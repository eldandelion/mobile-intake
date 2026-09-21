package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.SubmitScaleRequest
import com.medicalsystem.intake.dto.SubmitScaleResponse
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.exception.ConflictException
import com.medicalsystem.intake.exception.ValidationException
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ScaleSubmissionService(
    private val submissionRepository: ScaleSubmissionRepository,
    private val scaleDraftService: ScaleDraftService,
    private val scaleCatalogService: ScaleCatalogService,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun submitScale(studentNumber: String, scaleCode: String, request: SubmitScaleRequest): SubmitScaleResponse {
        val studentNumberVo = com.medicalsystem.intake.model.StudentNumber(studentNumber)
        val scaleCodeVo = com.medicalsystem.intake.model.ScaleCode(scaleCode)

        val detail = scaleCatalogService.getScaleDetail(scaleCodeVo.normalized())

        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumberVo.normalized(), scaleCodeVo.normalized())) {
            throw ConflictException("Scale '${scaleCodeVo.normalized()}' has already been submitted and locked for student: ${studentNumberVo.normalized()}")
        }

        // Validate completeness, options, bounds, and key whitelisting via domain Value Object
        val responseSet = com.medicalsystem.intake.model.ScaleResponseSet(scaleCodeVo, request.answers)
        responseSet.validateAgainst(detail)

        val answersJson = objectMapper.writeValueAsString(request.answers)
        val submission = ScaleSubmissionEntity.create(
            studentNumber = studentNumberVo,
            scaleCode = scaleCodeVo,
            answersJson = answersJson
        )
        val saved = submissionRepository.save(submission)

        // Atomically purge draft upon successful final submission
        scaleDraftService.purgeDraft(studentNumberVo.normalized(), scaleCodeVo.normalized())

        return SubmitScaleResponse(
            scaleCode = saved.scaleCode,
            status = saved.status,
            completedAt = saved.completedAt
        )
    }

    @Transactional(readOnly = true)
    fun getSubmission(studentNumber: String, scaleCode: String): ScaleSubmissionEntity? {
        return submissionRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode).orElse(null)
    }
}

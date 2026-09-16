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
        val detail = scaleCatalogService.getScaleDetail(scaleCode)

        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)) {
            throw ConflictException("Scale '$scaleCode' has already been submitted and locked for student: $studentNumber")
        }

        // Validate completeness & option value invariants
        for (q in detail.questions) {
            val rawAnswer = request.answers[q.id]
                ?: throw ValidationException("Missing answer for question: ${q.id}")
            if (rawAnswer.toString().isBlank()) {
                throw ValidationException("Answer cannot be blank for question: ${q.id}")
            }
            if (q.options.isNotEmpty()) {
                val allowedValues = q.options.map { it.value.toString() }.toSet()
                if (!allowedValues.contains(rawAnswer.toString())) {
                    throw ValidationException("Invalid option value '$rawAnswer' for question: ${q.id}")
                }
            }
        }

        val answersJson = objectMapper.writeValueAsString(request.answers)
        val submission = ScaleSubmissionEntity(
            studentNumber = studentNumber,
            scaleCode = scaleCode,
            answersJson = answersJson,
            status = "COMPLETED",
            completedAt = LocalDateTime.now()
        )
        val saved = submissionRepository.save(submission)

        // Atomically purge draft upon successful final submission
        scaleDraftService.purgeDraft(studentNumber, scaleCode)

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

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
    private val scaleCatalogService: ScaleCatalogService,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun submitScale(studentNumber: String, scaleCode: String, request: SubmitScaleRequest): SubmitScaleResponse {
        val detail = scaleCatalogService.getScaleDetail(scaleCode)

        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)) {
            throw ConflictException("Scale '$scaleCode' has already been submitted and locked for student: $studentNumber")
        }

        // Validate that all questions are answered
        val requiredIds = detail.questions.map { it.id }.toSet()
        val missing = requiredIds.filter { !request.answers.containsKey(it) || request.answers[it] == null || request.answers[it].toString().isBlank() }
        if (missing.isNotEmpty()) {
            throw ValidationException("Incomplete questionnaire submission. Missing questions: $missing")
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

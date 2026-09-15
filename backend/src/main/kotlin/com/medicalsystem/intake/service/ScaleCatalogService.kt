package com.medicalsystem.intake.service

import com.medicalsystem.intake.dto.ScaleSummaryDto
import com.medicalsystem.intake.exception.NotFoundException
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.stereotype.Service

@Service
class ScaleCatalogService(
    private val catalogLoader: AssessmentCatalogLoader,
    private val submissionRepository: ScaleSubmissionRepository
) {
    fun getScaleSummaries(studentNumber: String): List<ScaleSummaryDto> {
        val completedCodes = submissionRepository.findByStudentNumber(studentNumber)
            .map { it.scaleCode }
            .toSet()

        return catalogLoader.getScaleDetails().map { detail ->
            ScaleSummaryDto(
                code = detail.code,
                title = detail.title,
                subtitle = detail.subtitle,
                description = detail.description,
                questionCount = detail.questions.size,
                estimatedMinutes = detail.estimatedMinutes,
                status = if (completedCodes.contains(detail.code)) "COMPLETED" else "NOT_STARTED"
            )
        }
    }

    fun getScaleDetail(code: String): ScaleDetail {
        return catalogLoader.getScaleDetail(code)
            ?: throw NotFoundException("Scale not found with code: $code")
    }

    fun getScaleCodes(): List<String> = catalogLoader.getScaleCodes()

    fun lookupScaleCodeForQuestion(questionId: String): String? =
        catalogLoader.lookupScaleCodeForQuestion(questionId)
}

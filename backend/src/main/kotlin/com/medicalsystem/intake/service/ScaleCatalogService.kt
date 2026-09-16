package com.medicalsystem.intake.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.ScaleSummaryDto
import com.medicalsystem.intake.exception.NotFoundException
import com.medicalsystem.intake.model.ScaleProgress
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.stereotype.Service

@Service
class ScaleCatalogService(
    private val catalogLoader: AssessmentCatalogLoader,
    private val submissionRepository: ScaleSubmissionRepository,
    private val draftRepository: ScaleDraftRepository,
    private val objectMapper: ObjectMapper
) {
    fun getScaleSummaries(studentNumber: String): List<ScaleSummaryDto> {
        val completedCodes = submissionRepository.findByStudentNumber(studentNumber)
            .map { it.scaleCode }
            .toSet()
        val draftMap = draftRepository.findByStudentNumber(studentNumber)
            .associateBy { it.scaleCode }

        return catalogLoader.getScaleDetails().map { detail ->
            val totalQuestions = detail.questions.size
            val validQuestionIds = detail.questions.map { it.id }.toSet()

            val (status, progress) = when {
                completedCodes.contains(detail.code) -> {
                    "COMPLETED" to ScaleProgress.completed(totalQuestions)
                }
                draftMap.containsKey(detail.code) -> {
                    val draft = draftMap[detail.code]!!
                    val answers: Map<String, Any> = try {
                        objectMapper.readValue(draft.answersJson, object : TypeReference<Map<String, Any>>() {})
                    } catch (e: Exception) {
                        emptyMap()
                    }
                    "IN_PROGRESS" to ScaleProgress.fromAnswers(validQuestionIds, answers)
                }
                else -> {
                    "NOT_STARTED" to ScaleProgress.zero(totalQuestions)
                }
            }

            ScaleSummaryDto(
                code = detail.code,
                title = detail.title,
                subtitle = detail.subtitle,
                description = detail.description,
                questionCount = totalQuestions,
                estimatedMinutes = detail.estimatedMinutes,
                status = status,
                answeredCount = progress.answeredCount,
                completionPercentage = progress.completionPercentage
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

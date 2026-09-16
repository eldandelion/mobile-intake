package com.medicalsystem.intake.dto

import jakarta.validation.constraints.NotEmpty
import java.time.LocalDateTime

data class ScaleSummaryDto(
    val code: String,
    val title: String,
    val subtitle: String? = null,
    val description: String,
    val questionCount: Int,
    val estimatedMinutes: Int,
    val status: String, // "NOT_STARTED", "IN_PROGRESS", or "COMPLETED"
    val answeredCount: Int = 0,
    val completionPercentage: Int = 0
)

data class SaveDraftRequest(
    val answers: Map<String, Any>,
    val updatedAt: Long
)

data class ScaleDraftDto(
    val scaleCode: String,
    val answers: Map<String, Any>,
    val updatedAt: Long
)

data class SubmitScaleRequest(
    @field:NotEmpty(message = "Answers map cannot be empty")
    val answers: Map<String, Any>
)

data class SubmitScaleResponse(
    val scaleCode: String,
    val status: String,
    val completedAt: LocalDateTime
)

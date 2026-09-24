package com.medicalsystem.intake.dto

import jakarta.validation.constraints.NotBlank

// --- Auth DTOs ---
data class AdminLoginRequest(
    @field:NotBlank(message = "管理密钥不能为空")
    val secret: String
)

data class AdminAuthResponse(
    val token: String,
    val username: String = "admin",
    val role: String = "ROLE_INTAKE_ADMIN"
)

// --- Dashboard DTOs ---
data class ScaleMetricStat(
    val scaleCode: String,
    val title: String,
    val completedCount: Long,
    val inProgressCount: Long,
    val totalStudents: Long,
    val completionRate: Double
)

data class AdminDashboardMetrics(
    val totalStudents: Long,
    val fullyCompletedStudents: Long,
    val overallCompletionRate: Double,
    val scaleStats: List<ScaleMetricStat>
)

// --- Student Management DTOs ---
data class StudentScaleStatusItem(
    val scaleCode: String,
    val title: String,
    val status: String,
    val completedAt: String?
)

data class AdminStudentSummaryDto(
    val studentNumber: String,
    val fullName: String,
    val phone: String,
    val registeredAt: String,
    val scaleStatuses: List<StudentScaleStatusItem>,
    val allCompleted: Boolean
)

data class AdminStudentDetailDto(
    val studentNumber: String,
    val fullName: String,
    val phone: String,
    val registeredAt: String,
    val demographics: Map<String, Any?>?,
    val scaleStatuses: List<StudentScaleStatusItem>
)

data class ResetPasswordRequest(
    val newPassword: String? = null
)

data class ResetPasswordResponse(
    val studentNumber: String,
    val newPassword: String,
    val message: String
)

data class DeleteStudentResponse(
    val studentNumber: String,
    val success: Boolean,
    val message: String
)

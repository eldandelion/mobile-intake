package com.medicalsystem.intake.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

data class RegisterRequest(
    @field:NotBlank(message = "Student number is required")
    @field:Size(min = 3, max = 32, message = "Student number must be between 3 and 32 characters")
    val studentNumber: String,

    @field:NotBlank(message = "Full name is required")
    @field:Size(min = 2, max = 64, message = "Full name must be between 2 and 64 characters")
    val fullName: String,

    @field:NotBlank(message = "Phone number is required")
    @field:Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid Chinese mobile phone number format")
    val phone: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 6, max = 64, message = "Password must be at least 6 characters")
    val password: String
)

data class LoginRequest(
    @field:NotBlank(message = "Identifier is required")
    val identifier: String,

    @field:NotBlank(message = "Password is required")
    val password: String
)

data class StudentDto(
    val studentNumber: String,
    val fullName: String,
    val phone: String,
    val createdAt: LocalDateTime
)

data class AuthResponse(
    val token: String,
    val student: StudentDto
)

data class SendCodeRequest(
    @field:NotBlank(message = "Phone number is required")
    @field:Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid Chinese mobile phone number format")
    val phone: String
)

data class SendCodeResponse(
    val phone: String,
    val devCode: String = "123456",
    val expiresInSeconds: Int = 300
)

data class VerifyCodeRequest(
    @field:NotBlank(message = "Phone number is required")
    val phone: String,

    @field:NotBlank(message = "Verification code is required")
    val code: String
)

data class VerifyCodeResponse(
    val valid: Boolean
)

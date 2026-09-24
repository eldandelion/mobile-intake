package com.medicalsystem.intake.dto

import com.fasterxml.jackson.annotation.JsonAlias
import com.fasterxml.jackson.annotation.JsonProperty
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
    val password: String,

    @field:NotBlank(message = "Verification code is required")
    @field:Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits")
    val verificationCode: String
)

data class LoginRequest(
    @JsonProperty("identifier")
    val identifier: String? = null,

    @JsonProperty("studentNumber")
    val studentNumber: String? = null,

    @JsonProperty("password")
    val password: String? = null
) {
    val resolvedIdentifier: String
        get() = identifier?.trim()?.ifEmpty { null }
            ?: studentNumber?.trim()?.ifEmpty { null }
            ?: ""

    val resolvedPassword: String
        get() = password?.trim().orEmpty()
}

data class StudentDto(
    val studentNumber: String,
    val fullName: String,
    val phone: String,
    val createdAt: LocalDateTime
)

data class AuthResponse(
    val token: String,
    val student: StudentDto,
    val studentNumber: String = student.studentNumber,
    val fullName: String = student.fullName,
    val phone: String = student.phone
)

data class SendCodeRequest(
    @field:NotBlank(message = "Phone number is required")
    @field:Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid Chinese mobile phone number format")
    val phone: String,

    val purpose: String? = "REGISTRATION",

    val studentNumber: String? = null
)

data class CheckAvailabilityResponse(
    val studentNumberAvailable: Boolean,
    val phoneAvailable: Boolean,
    val message: String? = null
)

data class SendCodeResponse(
    val phone: String,
    val devCode: String? = null,
    val expiresInSeconds: Int = 300
)

data class VerifyCodeRequest(
    @field:NotBlank(message = "Phone number is required")
    @field:Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid Chinese mobile phone number format")
    val phone: String,

    @field:NotBlank(message = "Verification code is required")
    val code: String,

    val purpose: String? = "REGISTRATION"
)

data class VerifyCodeResponse(
    val valid: Boolean
)

data class LoginSmsRequest(
    @field:NotBlank(message = "Phone number is required")
    @field:Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid Chinese mobile phone number format")
    val phone: String,

    @field:NotBlank(message = "Verification code is required")
    @field:Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits")
    val code: String
)

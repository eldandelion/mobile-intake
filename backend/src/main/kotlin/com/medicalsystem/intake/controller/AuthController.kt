package com.medicalsystem.intake.controller

import com.medicalsystem.intake.dto.*
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.security.CurrentStudent
import com.medicalsystem.intake.service.AuthService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        val response = authService.register(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        val response = authService.login(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/login-sms")
    fun loginSms(@Valid @RequestBody request: LoginSmsRequest): ResponseEntity<AuthResponse> {
        val response = authService.loginWithSms(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/send-code")
    fun sendCode(@Valid @RequestBody request: SendCodeRequest): ResponseEntity<SendCodeResponse> {
        val response = authService.sendVerificationCode(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/verify-code")
    fun verifyCode(@Valid @RequestBody request: VerifyCodeRequest): ResponseEntity<VerifyCodeResponse> {
        val response = authService.verifyCode(request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/me")
    fun me(@CurrentStudent student: IntakeStudentEntity): ResponseEntity<StudentDto> {
        return ResponseEntity.ok(authService.toDto(student))
    }
}

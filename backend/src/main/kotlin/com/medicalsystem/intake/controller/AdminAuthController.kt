package com.medicalsystem.intake.controller

import com.medicalsystem.intake.dto.AdminAuthResponse
import com.medicalsystem.intake.dto.AdminLoginRequest
import com.medicalsystem.intake.exception.ForbiddenException
import com.medicalsystem.intake.security.AdminPrincipal
import com.medicalsystem.intake.security.CurrentAdmin
import com.medicalsystem.intake.security.JwtService
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/auth")
class AdminAuthController(
    private val jwtService: JwtService,
    @Value("\${intake.security.admin-secret:csu-medical-intake-admin-secret-2026}")
    private val adminSecret: String
) {

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: AdminLoginRequest): ResponseEntity<AdminAuthResponse> {
        if (request.secret.trim() != adminSecret.trim()) {
            throw ForbiddenException("管理密钥无效，请核对后重试")
        }

        val token = jwtService.generateAdminToken("admin")
        return ResponseEntity.ok(
            AdminAuthResponse(
                token = token,
                username = "admin",
                role = "ROLE_INTAKE_ADMIN"
            )
        )
    }

    @GetMapping("/me")
    fun me(@CurrentAdmin admin: AdminPrincipal): ResponseEntity<AdminAuthResponse> {
        return ResponseEntity.ok(
            AdminAuthResponse(
                token = "",
                username = admin.username,
                role = admin.role
            )
        )
    }
}

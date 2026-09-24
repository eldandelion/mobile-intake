package com.medicalsystem.intake.security

import com.medicalsystem.intake.exception.ForbiddenException
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.MethodParameter
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

@Component
class CurrentAdminArgumentResolver(
    private val jwtService: JwtService,
    @Value("\${intake.security.admin-secret:csu-medical-intake-admin-secret-2026}")
    private val adminSecret: String
) : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean {
        return parameter.hasParameterAnnotation(CurrentAdmin::class.java) &&
                parameter.parameterType == AdminPrincipal::class.java
    }

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): AdminPrincipal? {
        val annotation = parameter.getParameterAnnotation(CurrentAdmin::class.java)
        val required = annotation?.required ?: true

        // 1. Check X-Admin-Secret header (for legacy/curl scripts)
        val headerSecret = webRequest.getHeader("X-Admin-Secret")
        if (headerSecret != null && headerSecret == adminSecret) {
            return AdminPrincipal(username = "admin")
        }

        // 2. Check Bearer token (for Admin Web Console)
        val authHeader = webRequest.getHeader("Authorization")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val token = authHeader.substring(7)
            val adminUsername = jwtService.validateAndExtractAdmin(token)
            if (adminUsername != null) {
                return AdminPrincipal(username = adminUsername)
            }
        }

        if (required) {
            throw ForbiddenException("Administrative access required")
        }
        return null
    }
}

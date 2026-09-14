package com.medicalsystem.intake.security

import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.exception.UnauthorizedException
import com.medicalsystem.intake.repository.IntakeStudentRepository
import org.springframework.core.MethodParameter
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

@Component
class CurrentStudentArgumentResolver(
    private val jwtService: JwtService,
    private val studentRepository: IntakeStudentRepository
) : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean {
        return parameter.hasParameterAnnotation(CurrentStudent::class.java) &&
                parameter.parameterType == IntakeStudentEntity::class.java
    }

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): IntakeStudentEntity? {
        val annotation = parameter.getParameterAnnotation(CurrentStudent::class.java)
        val required = annotation?.required ?: true

        val authHeader = webRequest.getHeader("Authorization")
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (required) throw UnauthorizedException("Missing or invalid authorization header")
            return null
        }

        val token = authHeader.substring(7)
        val studentNumber = jwtService.validateAndExtractStudentNumber(token)
            ?: if (required) throw UnauthorizedException("Invalid or expired session token") else return null

        val student = studentRepository.findByStudentNumber(studentNumber).orElse(null)
        if (student == null && required) {
            throw UnauthorizedException("Student record not found for active token")
        }
        return student
    }
}

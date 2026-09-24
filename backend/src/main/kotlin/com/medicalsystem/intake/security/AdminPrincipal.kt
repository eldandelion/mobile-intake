package com.medicalsystem.intake.security

data class AdminPrincipal(
    val username: String = "admin",
    val role: String = "ROLE_INTAKE_ADMIN"
)

@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
annotation class CurrentAdmin(
    val required: Boolean = true
)

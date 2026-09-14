package com.medicalsystem.intake.security

@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
annotation class CurrentStudent(val required: Boolean = true)

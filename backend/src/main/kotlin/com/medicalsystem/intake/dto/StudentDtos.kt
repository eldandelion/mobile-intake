package com.medicalsystem.intake.dto

data class StudentDemographicsDto(
    val isSubmitted: Boolean = false,
    val gender: String? = null,
    val ethnicity: String? = null,
    val major: String? = null,
    val birthday: String? = null,
    val idCardNumber: String? = null,
    val email: String? = null,
    val homeAddress: String? = null,
    val emergencyContact: String? = null,
    val emergencyPhone: String? = null,
    val completedAt: String? = null
)

data class StudentProfileDto(
    val studentNumber: String,
    val fullName: String,
    val phone: String,
    val registeredAt: String,
    val isDemographicsSubmitted: Boolean,
    val demographics: StudentDemographicsDto
)

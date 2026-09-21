package com.medicalsystem.intake.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.StudentDemographicsDto
import org.springframework.stereotype.Component
import java.time.LocalDateTime

@Component
class DemographicsProjector(
    private val scaleCatalogService: ScaleCatalogService,
    private val objectMapper: ObjectMapper
) {
    fun projectFromJson(answersJson: String?, completedAt: LocalDateTime? = null): StudentDemographicsDto {
        if (answersJson.isNullOrBlank()) {
            return StudentDemographicsDto(isSubmitted = false)
        }
        val answers: Map<String, Any> = try {
            objectMapper.readValue(answersJson, object : TypeReference<Map<String, Any>>() {})
        } catch (_: Exception) {
            emptyMap()
        }
        return project(answers, completedAt)
    }

    fun project(answers: Map<String, Any>?, completedAt: LocalDateTime? = null): StudentDemographicsDto {
        if (answers.isNullOrEmpty()) {
            return StudentDemographicsDto(isSubmitted = false)
        }

        val scaleDetail = try {
            scaleCatalogService.getScaleDetail("demographics_survey")
        } catch (_: Exception) {
            null
        }

        val questionsByField = scaleDetail?.questions
            ?.filter { it.field != null }
            ?.associateBy { it.field!! } ?: emptyMap()

        // 1. Gender: dynamic catalog option label resolution
        val gender = resolveChoice(questionsByField["gender"], answers, listOf("G1", "demo_gender", "gender"))

        // 2. Ethnicity: dynamic catalog option label resolution
        val ethnicity = resolveChoice(questionsByField["ethnicity"], answers, listOf("G4", "demo_ethnicity", "ethnicity")) ?: "汉族"

        // 3. Major / Class
        val major = resolveText(questionsByField["major"], answers, listOf("demo_class", "demo_major", "major"))

        // 4. ID Card & Birthday
        val idCard = resolveText(questionsByField["idCardNumber"], answers, listOf("demo_id_card", "idCardNumber"))
        val age = resolveText(questionsByField["age"], answers, listOf("G2", "age"))
        val birthday = extractBirthday(idCard, age)

        // 5. Contact & Address
        val email = resolveText(questionsByField["email"], answers, listOf("demo_email", "email"))
        val address = resolveText(null, answers, listOf("demo_home_address", "homeAddress"))
            ?: resolveChoice(questionsByField["homeAddress"], answers, listOf("G6"))
        val emergencyContact = resolveText(questionsByField["emergencyContact"], answers, listOf("demo_emergency_contact", "emergencyContactName"))
        val emergencyPhone = resolveText(questionsByField["emergencyPhone"], answers, listOf("demo_emergency_phone", "emergencyContactPhone"))

        return StudentDemographicsDto(
            isSubmitted = true,
            gender = gender,
            ethnicity = ethnicity,
            major = major,
            birthday = birthday,
            idCardNumber = idCard,
            email = email,
            homeAddress = address,
            emergencyContact = emergencyContact,
            emergencyPhone = emergencyPhone,
            completedAt = completedAt?.toString()
        )
    }

    private fun resolveChoice(question: ScaleQuestion?, answers: Map<String, Any>, fallbackKeys: List<String>): String? {
        val rawVal = (question?.let { answers[it.id] }
            ?: fallbackKeys.firstNotNullOfOrNull { answers[it] })?.toString()?.trim()
            ?: return null

        if (question != null && question.options.isNotEmpty()) {
            val matched = question.options.find { it.value.toString() == rawVal }
            if (matched != null) return matched.label
        }
        return when (rawVal) {
            "1", "男" -> "男"
            "2", "女" -> "女"
            else -> rawVal
        }
    }

    private fun resolveText(question: ScaleQuestion?, answers: Map<String, Any>, fallbackKeys: List<String>): String? {
        val raw = (question?.let { answers[it.id] }
            ?: fallbackKeys.firstNotNullOfOrNull { answers[it] })?.toString()?.trim()
        return if (raw.isNullOrEmpty()) null else raw
    }

    private fun extractBirthday(idCard: String?, age: String?): String? {
        if (!idCard.isNullOrBlank()) {
            val match = Regex("""\d{6}(\d{4})(\d{2})(\d{2})""").find(idCard.trim())
            if (match != null) {
                val (y, m, d) = match.destructured
                return "$y-$m-$d"
            }
        }
        if (!age.isNullOrBlank()) {
            return "${age}周岁"
        }
        return null
    }
}

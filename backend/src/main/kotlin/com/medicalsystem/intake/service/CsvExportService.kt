package com.medicalsystem.intake.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.ByteArrayOutputStream
import java.io.OutputStreamWriter
import java.nio.charset.StandardCharsets

@Service
class CsvExportService(
    private val studentRepository: IntakeStudentRepository,
    private val submissionRepository: ScaleSubmissionRepository,
    private val scaleCatalogService: ScaleCatalogService,
    private val objectMapper: ObjectMapper
) {
    // UTF-8 Byte Order Mark for Excel
    private val utf8Bom = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte())

    @Transactional(readOnly = true)
    fun exportStudentsCsv(): ByteArray {
        val students = studentRepository.findAll()
        val submissions = submissionRepository.findAll()
            .filter { it.scaleCode == "demographics_survey" }
            .associateBy { it.studentNumber }

        val out = ByteArrayOutputStream()
        out.write(utf8Bom)

        val writer = OutputStreamWriter(out, StandardCharsets.UTF_8)

        // Core system headers matching StudentImportSchema
        val headers = listOf(
            "学号", "姓名", "专业", "入学日期", "身份证号", "性别", "民族",
            "联系电话", "电子邮箱", "家庭住址", "紧急联系人", "紧急联系电话", "班主任/辅导员工号"
        )
        writer.write(headers.joinToString(",") + "\n")

        val ethnicityMap = mapOf(
            1 to "汉族", 2 to "回族", 3 to "满族", 4 to "维吾尔族",
            5 to "壮族", 6 to "蒙古族", 7 to "其他少数民族"
        )

        for (s in students) {
            val demoSub = submissions[s.studentNumber]
            val answers: Map<String, Any> = if (demoSub != null) {
                try {
                    objectMapper.readValue(demoSub.answersJson, object : TypeReference<Map<String, Any>>() {})
                } catch (e: Exception) {
                    emptyMap()
                }
            } else {
                emptyMap()
            }

            val genderRaw = answers["G1"] ?: answers["demo_gender"] ?: answers["gender"]
            val gender = when (genderRaw?.toString()) {
                "1", "男" -> "男"
                "2", "女" -> "女"
                else -> ""
            }

            val ethRaw = answers["G4"] ?: answers["demo_ethnicity"] ?: answers["ethnicity"]
            val ethnicity = when {
                ethRaw is Number -> ethnicityMap[ethRaw.toInt()] ?: "汉族"
                ethRaw != null && ethRaw.toString().toIntOrNull() != null -> ethnicityMap[ethRaw.toString().toInt()] ?: "汉族"
                ethRaw != null -> ethRaw.toString()
                else -> "汉族"
            }

            val major = answers["demo_class"] ?: answers["demo_major"] ?: answers["major"] ?: "待确认专业"
            val enrollmentDate = "2026-09-01"
            val idCardNumber = answers["demo_id_card"] ?: answers["idCardNumber"] ?: ""
            val email = answers["demo_email"] ?: answers["email"] ?: "${s.studentNumber}@univ.edu.cn"
            val homeAddress = answers["demo_home_address"] ?: answers["homeAddress"] ?: ""
            val emergencyContact = answers["demo_emergency_contact"] ?: answers["emergencyContactName"] ?: ""
            val emergencyPhone = answers["demo_emergency_phone"] ?: answers["emergencyContactPhone"] ?: ""
            val teacherEmployeeNumber = ""

            val row = listOf(
                escapeCsv(s.studentNumber),
                escapeCsv(s.fullName),
                escapeCsv(major.toString()),
                escapeCsv(enrollmentDate),
                escapeCsv(idCardNumber.toString()),
                escapeCsv(gender),
                escapeCsv(ethnicity),
                escapeCsv(s.phone),
                escapeCsv(email.toString()),
                escapeCsv(homeAddress.toString()),
                escapeCsv(emergencyContact.toString()),
                escapeCsv(emergencyPhone.toString()),
                escapeCsv(teacherEmployeeNumber)
            )
            writer.write(row.joinToString(",") + "\n")
        }

        writer.flush()
        return out.toByteArray()
    }

    @Transactional(readOnly = true)
    fun exportAssessmentsCsv(): ByteArray {
        val submissions = submissionRepository.findAll()

        val out = ByteArrayOutputStream()
        out.write(utf8Bom)

        val writer = OutputStreamWriter(out, StandardCharsets.UTF_8)
        val headers = listOf("student_number", "scale_code", "question_id", "selected_value", "completed_at")
        writer.write(headers.joinToString(",") + "\n")

        for (sub in submissions) {
            val answers: Map<String, Any> = try {
                objectMapper.readValue(sub.answersJson, object : TypeReference<Map<String, Any>>() {})
            } catch (e: Exception) {
                emptyMap()
            }

            for ((qId, value) in answers) {
                val canonicalScaleCode = scaleCatalogService.lookupScaleCodeForQuestion(qId) ?: sub.scaleCode
                val row = listOf(
                    escapeCsv(sub.studentNumber),
                    escapeCsv(canonicalScaleCode),
                    escapeCsv(qId),
                    escapeCsv(value.toString()),
                    escapeCsv(sub.completedAt.toString())
                )
                writer.write(row.joinToString(",") + "\n")
            }
        }

        writer.flush()
        return out.toByteArray()
    }

    internal fun escapeCsv(value: String): String {
        val sanitized = if (value.isNotEmpty() && value[0] in charArrayOf('=', '+', '-', '@', '\t', '\r')) {
            "'$value"
        } else {
            value
        }
        return if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n") || sanitized.contains("\r")) {
            "\"" + sanitized.replace("\"", "\"\"") + "\""
        } else {
            sanitized
        }
    }
}

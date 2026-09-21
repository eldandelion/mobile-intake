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
    private val objectMapper: ObjectMapper,
    private val demographicsProjector: DemographicsProjector
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

        for (s in students) {
            val demoSub = submissions[s.studentNumber]
            val demographics = demographicsProjector.projectFromJson(demoSub?.answersJson)

            val major = demographics.major ?: "待确认专业"
            val enrollmentDate = "2026-09-01"
            val idCardNumber = demographics.idCardNumber ?: ""
            val gender = demographics.gender ?: ""
            val ethnicity = demographics.ethnicity ?: "汉族"
            val email = demographics.email ?: "${s.studentNumber}@univ.edu.cn"
            val homeAddress = demographics.homeAddress ?: ""
            val emergencyContact = demographics.emergencyContact ?: ""
            val emergencyPhone = demographics.emergencyPhone ?: ""
            val teacherEmployeeNumber = ""

            val row = listOf(
                escapeCsv(s.studentNumber),
                escapeCsv(s.fullName),
                escapeCsv(major),
                escapeCsv(enrollmentDate),
                escapeCsv(idCardNumber),
                escapeCsv(gender),
                escapeCsv(ethnicity),
                escapeCsv(s.phone),
                escapeCsv(email),
                escapeCsv(homeAddress),
                escapeCsv(emergencyContact),
                escapeCsv(emergencyPhone),
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

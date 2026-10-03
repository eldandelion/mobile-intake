package com.medicalsystem.intake.service

import com.medicalsystem.intake.dto.*
import com.medicalsystem.intake.exception.NotFoundException
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.format.DateTimeFormatter

@Service
class AdminStudentService(
    private val studentRepository: IntakeStudentRepository,
    private val submissionRepository: ScaleSubmissionRepository,
    private val draftRepository: ScaleDraftRepository,
    private val catalogLoader: AssessmentCatalogLoader,
    private val demographicsProjector: DemographicsProjector,
    private val passwordEncoder: PasswordEncoder
) {
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")

    @Transactional(readOnly = true)
    fun listStudents(search: String?): List<AdminStudentSummaryDto> {
        val students = if (search.isNullOrBlank()) {
            studentRepository.findAll()
        } else {
            studentRepository.searchStudents(search.trim())
        }

        val allSubmissions = submissionRepository.findAll()
            .groupBy { it.studentNumber }
        val allDrafts = draftRepository.findAll()
            .groupBy { it.studentNumber }

        val catalogScales = catalogLoader.getScaleDetails()
        val keyScaleCodes = catalogScales.map { it.code }.toSet()

        return students.map { student ->
            val submissions = allSubmissions[student.studentNumber]?.associateBy { it.scaleCode } ?: emptyMap()
            val drafts = allDrafts[student.studentNumber]?.associateBy { it.scaleCode } ?: emptyMap()

            val scaleStatuses = catalogScales.map { scale ->
                val sub = submissions[scale.code]
                val draft = drafts[scale.code]

                val status = when {
                    sub != null -> "COMPLETED"
                    draft != null -> "IN_PROGRESS"
                    else -> "NOT_STARTED"
                }

                val completedAt = sub?.completedAt?.format(dateFormatter)

                StudentScaleStatusItem(
                    scaleCode = scale.code,
                    title = scale.title,
                    status = status,
                    completedAt = completedAt
                )
            }

            val allCompleted = keyScaleCodes.isNotEmpty() && keyScaleCodes.all { submissions.containsKey(it) }

            AdminStudentSummaryDto(
                studentNumber = student.studentNumber,
                fullName = student.fullName,
                phone = student.phone,
                registeredAt = student.createdAt.format(dateFormatter),
                scaleStatuses = scaleStatuses,
                allCompleted = allCompleted
            )
        }
    }

    @Transactional(readOnly = true)
    fun getStudentDetail(studentNumber: String): AdminStudentDetailDto {
        val student = studentRepository.findByStudentNumber(studentNumber)
            .orElseThrow { NotFoundException("未找到学号为 $studentNumber 的学生") }

        val submissions = submissionRepository.findByStudentNumber(studentNumber)
            .associateBy { it.scaleCode }
        val drafts = draftRepository.findByStudentNumber(studentNumber)
            .associateBy { it.scaleCode }

        val catalogScales = catalogLoader.getScaleDetails()

        val scaleStatuses = catalogScales.map { scale ->
            val sub = submissions[scale.code]
            val draft = drafts[scale.code]

            val status = when {
                sub != null -> "COMPLETED"
                draft != null -> "IN_PROGRESS"
                else -> "NOT_STARTED"
            }

            StudentScaleStatusItem(
                scaleCode = scale.code,
                title = scale.title,
                status = status,
                completedAt = sub?.completedAt?.format(dateFormatter)
            )
        }

        val demoSub = submissions["comprehensive_student_intake_survey"] ?: submissions["demographics_survey"]
        val demographics = demographicsProjector.projectFromJson(demoSub?.answersJson, demoSub?.completedAt)

        val demoMap: Map<String, Any?> = if (demographics.isSubmitted) {
            mapOf(
                "isSubmitted" to true,
                "gender" to demographics.gender,
                "ethnicity" to demographics.ethnicity,
                "major" to demographics.major,
                "birthday" to demographics.birthday,
                "idCardNumber" to demographics.idCardNumber,
                "email" to demographics.email,
                "homeAddress" to demographics.homeAddress,
                "emergencyContact" to demographics.emergencyContact,
                "emergencyPhone" to demographics.emergencyPhone,
                "completedAt" to demographics.completedAt
            )
        } else {
            emptyMap()
        }

        return AdminStudentDetailDto(
            studentNumber = student.studentNumber,
            fullName = student.fullName,
            phone = student.phone,
            registeredAt = student.createdAt.format(dateFormatter),
            demographics = demoMap,
            scaleStatuses = scaleStatuses
        )
    }

    @Transactional
    fun resetPassword(studentNumber: String, customPassword: String?): ResetPasswordResponse {
        val student = studentRepository.findByStudentNumber(studentNumber)
            .orElseThrow { NotFoundException("未找到学号为 $studentNumber 的学生") }

        val defaultPassword = customPassword?.takeIf { it.isNotBlank() } ?: "123456"
        student.passwordHash = passwordEncoder.encode(defaultPassword) ?: error("Password encoding failed")
        studentRepository.save(student)

        return ResetPasswordResponse(
            studentNumber = studentNumber,
            newPassword = defaultPassword,
            message = "密码已重置为: $defaultPassword"
        )
    }

    @Transactional
    fun deleteStudent(studentNumber: String): DeleteStudentResponse {
        val student = studentRepository.findByStudentNumber(studentNumber)
            .orElseThrow { NotFoundException("未找到学号为 $studentNumber 的学生") }

        draftRepository.deleteByStudentNumber(studentNumber)
        submissionRepository.deleteByStudentNumber(studentNumber)
        studentRepository.deleteByStudentNumber(studentNumber)

        return DeleteStudentResponse(
            studentNumber = studentNumber,
            success = true,
            message = "已成功删除学生 ${student.fullName} ($studentNumber) 及其作答草稿与提交记录"
        )
    }
}

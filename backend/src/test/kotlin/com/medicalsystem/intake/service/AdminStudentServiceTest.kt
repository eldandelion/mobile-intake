package com.medicalsystem.intake.service

import com.medicalsystem.intake.dto.StudentDemographicsDto
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.exception.NotFoundException
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.model.PersonName
import com.medicalsystem.intake.model.ScaleCode
import com.medicalsystem.intake.model.StudentNumber
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.*

class AdminStudentServiceTest {

    private lateinit var studentRepository: IntakeStudentRepository
    private lateinit var submissionRepository: ScaleSubmissionRepository
    private lateinit var draftRepository: ScaleDraftRepository
    private lateinit var catalogLoader: AssessmentCatalogLoader
    private lateinit var demographicsProjector: DemographicsProjector
    private lateinit var passwordEncoder: PasswordEncoder
    private lateinit var adminStudentService: AdminStudentService

    @BeforeEach
    fun setUp() {
        studentRepository = mock(IntakeStudentRepository::class.java)
        submissionRepository = mock(ScaleSubmissionRepository::class.java)
        draftRepository = mock(ScaleDraftRepository::class.java)
        catalogLoader = mock(AssessmentCatalogLoader::class.java)
        demographicsProjector = mock(DemographicsProjector::class.java)
        passwordEncoder = mock(PasswordEncoder::class.java)

        adminStudentService = AdminStudentService(
            studentRepository,
            submissionRepository,
            draftRepository,
            catalogLoader,
            demographicsProjector,
            passwordEncoder
        )
    }

    @Test
    fun `listStudents returns student list with unified scale status`() {
        val student = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("张三"),
            ChineseMobileNumber("13800138000"),
            "encoded_hash"
        )
        `when`(studentRepository.findAll()).thenReturn(listOf(student))

        val sub = ScaleSubmissionEntity.create(
            StudentNumber("8209220532"),
            ScaleCode("comprehensive_student_intake_survey"),
            "{}"
        )
        `when`(submissionRepository.findAll()).thenReturn(listOf(sub))
        `when`(draftRepository.findAll()).thenReturn(emptyList())

        val unifiedDetail = ScaleDetail(
            code = "comprehensive_student_intake_survey",
            title = "中南大学学生心身健康综合调查问卷",
            description = "综合普查",
            estimatedMinutes = 45,
            instructions = "",
            questions = emptyList(),
            sections = emptyList()
        )
        `when`(catalogLoader.getScaleDetails()).thenReturn(listOf(unifiedDetail))

        val list = adminStudentService.listStudents(null)
        assertEquals(1, list.size)
        val s = list[0]
        assertEquals("8209220532", s.studentNumber)
        assertEquals("张三", s.fullName)
        assertTrue(s.allCompleted)
        assertEquals(1, s.scaleStatuses.size)
        assertEquals("COMPLETED", s.scaleStatuses[0].status)
    }

    @Test
    fun `getStudentDetail projects demographics from unified submission`() {
        val student = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("李四"),
            ChineseMobileNumber("13800138000"),
            "encoded_hash"
        )
        `when`(studentRepository.findByStudentNumber("8209220532")).thenReturn(Optional.of(student))

        val sub = ScaleSubmissionEntity.create(
            StudentNumber("8209220532"),
            ScaleCode("comprehensive_student_intake_survey"),
            "{\"major\":\"软件工程\"}"
        )
        `when`(submissionRepository.findByStudentNumber("8209220532")).thenReturn(listOf(sub))
        `when`(draftRepository.findByStudentNumber("8209220532")).thenReturn(emptyList())
        `when`(catalogLoader.getScaleDetails()).thenReturn(emptyList())

        val demoDto = StudentDemographicsDto(
            isSubmitted = true,
            gender = "男",
            ethnicity = "汉族",
            major = "软件工程",
            birthday = "2004-05-01"
        )
        `when`(demographicsProjector.projectFromJson(eq("{\"major\":\"软件工程\"}"), any())).thenReturn(demoDto)

        val detail = adminStudentService.getStudentDetail("8209220532")
        assertEquals("8209220532", detail.studentNumber)
        assertEquals("李四", detail.fullName)
        assertEquals("软件工程", detail.demographics?.get("major"))
        assertEquals("男", detail.demographics?.get("gender"))
    }

    @Test
    fun `getStudentDetail throws NotFoundException when student missing`() {
        `when`(studentRepository.findByStudentNumber("9999999999")).thenReturn(Optional.empty())

        assertThrows(NotFoundException::class.java) {
            adminStudentService.getStudentDetail("9999999999")
        }
    }

    @Test
    fun `resetPassword encodes new password and saves student`() {
        val student = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("王五"),
            ChineseMobileNumber("13800138000"),
            "old_hash"
        )
        `when`(studentRepository.findByStudentNumber("8209220532")).thenReturn(Optional.of(student))
        `when`(passwordEncoder.encode("custom123")).thenReturn("new_hash")

        val res = adminStudentService.resetPassword("8209220532", "custom123")
        assertEquals("8209220532", res.studentNumber)
        assertEquals("custom123", res.newPassword)
        assertEquals("new_hash", student.passwordHash)
        verify(studentRepository).save(student)
    }

    @Test
    fun `deleteStudent atomically purges drafts submissions and student record`() {
        val student = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("赵六"),
            ChineseMobileNumber("13800138000"),
            "hash"
        )
        `when`(studentRepository.findByStudentNumber("8209220532")).thenReturn(Optional.of(student))

        val res = adminStudentService.deleteStudent("8209220532")
        assertTrue(res.success)
        assertEquals("8209220532", res.studentNumber)
        verify(draftRepository).deleteByStudentNumber("8209220532")
        verify(submissionRepository).deleteByStudentNumber("8209220532")
        verify(studentRepository).deleteByStudentNumber("8209220532")
    }
}

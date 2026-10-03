package com.medicalsystem.intake.service

import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.entity.ScaleDraftEntity
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.model.PersonName
import com.medicalsystem.intake.model.StudentNumber
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*

class AdminDashboardServiceTest {

    private lateinit var studentRepository: IntakeStudentRepository
    private lateinit var submissionRepository: ScaleSubmissionRepository
    private lateinit var draftRepository: ScaleDraftRepository
    private lateinit var catalogLoader: AssessmentCatalogLoader
    private lateinit var dashboardService: AdminDashboardService

    @BeforeEach
    fun setUp() {
        studentRepository = mock(IntakeStudentRepository::class.java)
        submissionRepository = mock(ScaleSubmissionRepository::class.java)
        draftRepository = mock(ScaleDraftRepository::class.java)
        catalogLoader = mock(AssessmentCatalogLoader::class.java)

        dashboardService = AdminDashboardService(
            studentRepository,
            submissionRepository,
            draftRepository,
            catalogLoader
        )
    }

    @Test
    fun `getDashboardMetrics returns zeros when database has no students`() {
        `when`(studentRepository.count()).thenReturn(0L)
        `when`(submissionRepository.findAll()).thenReturn(emptyList())
        `when`(draftRepository.findAll()).thenReturn(emptyList())
        `when`(catalogLoader.getScaleDetails()).thenReturn(emptyList())

        val metrics = dashboardService.getDashboardMetrics()
        assertEquals(0L, metrics.totalStudents)
        assertEquals(0L, metrics.fullyCompletedStudents)
        assertEquals(0.0, metrics.overallCompletionRate)
        assertTrue(metrics.scaleStats.isEmpty())
    }

    @Test
    fun `getDashboardMetrics computes completion rate for unified questionnaire`() {
        val student1 = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("张三"),
            ChineseMobileNumber("13800138000"),
            "hash"
        )
        val student2 = IntakeStudentEntity.create(
            StudentNumber("8209220533"),
            PersonName("李四"),
            ChineseMobileNumber("13800138001"),
            "hash"
        )

        `when`(studentRepository.count()).thenReturn(2L)
        `when`(studentRepository.findAll()).thenReturn(listOf(student1, student2))

        val sub1 = ScaleSubmissionEntity.create(
            StudentNumber("8209220532"),
            com.medicalsystem.intake.model.ScaleCode("comprehensive_student_intake_survey"),
            "{}"
        )
        `when`(submissionRepository.findAll()).thenReturn(listOf(sub1))

        val draft2 = ScaleDraftEntity(
            studentNumber = "8209220533",
            scaleCode = "comprehensive_student_intake_survey",
            answersJson = "{}",
            clientUpdatedAt = 1000L
        )
        `when`(draftRepository.findAll()).thenReturn(listOf(draft2))

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

        val metrics = dashboardService.getDashboardMetrics()
        assertEquals(2L, metrics.totalStudents)
        assertEquals(1L, metrics.fullyCompletedStudents)
        assertEquals(50.0, metrics.overallCompletionRate)

        assertEquals(1, metrics.scaleStats.size)
        val stat = metrics.scaleStats[0]
        assertEquals("comprehensive_student_intake_survey", stat.scaleCode)
        assertEquals(1L, stat.completedCount)
        assertEquals(1L, stat.inProgressCount)
        assertEquals(50.0, stat.completionRate)
    }
}

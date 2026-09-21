package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.SubmitScaleRequest
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.exception.ConflictException
import com.medicalsystem.intake.exception.ValidationException
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class ScaleSubmissionServiceTest {

    private val submissionRepository: ScaleSubmissionRepository = mock()
    private val scaleDraftService: ScaleDraftService = mock()
    private val scaleCatalogService: ScaleCatalogService = mock()
    private val objectMapper = ObjectMapper()

    private val scaleSubmissionService = ScaleSubmissionService(
        submissionRepository = submissionRepository,
        scaleDraftService = scaleDraftService,
        scaleCatalogService = scaleCatalogService,
        objectMapper = objectMapper
    )

    private val testScaleDetail = ScaleDetail(
        code = "phq_9",
        title = "PHQ-9 抑郁症筛查",
        description = "Test Scale",
        estimatedMinutes = 2,
        questions = listOf(
            ScaleQuestion(
                id = "phq9_1",
                text = "做事时提不起劲或没有乐趣",
                orderNum = 1,
                options = listOf(
                    ScaleOption(value = 0, label = "完全不会"),
                    ScaleOption(value = 1, label = "好几天"),
                    ScaleOption(value = 2, label = "一半以上天数"),
                    ScaleOption(value = 3, label = "几乎每天")
                )
            ),
            ScaleQuestion(
                id = "phq9_2",
                text = "感到心情低落、沮丧或绝望",
                orderNum = 2,
                options = listOf(
                    ScaleOption(value = 0, label = "完全不会"),
                    ScaleOption(value = 1, label = "好几天"),
                    ScaleOption(value = 2, label = "一半以上天数"),
                    ScaleOption(value = 3, label = "几乎每天")
                )
            )
        )
    )

    @BeforeEach
    fun setUp() {
        whenever(scaleCatalogService.getScaleDetail("phq_9")).thenReturn(testScaleDetail)
    }

    @Test
    fun `test successful submission with valid options`() {
        val studentNumber = "2026001001"
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, "phq_9")).thenReturn(false)
        whenever(submissionRepository.save(any<ScaleSubmissionEntity>())).thenAnswer { it.arguments[0] }

        val request = SubmitScaleRequest(answers = mapOf("phq9_1" to 1, "phq9_2" to 0))
        val response = scaleSubmissionService.submitScale(studentNumber, "phq_9", request)

        assertEquals("phq_9", response.scaleCode)
        assertEquals("COMPLETED", response.status)
        assertNotNull(response.completedAt)
        org.mockito.kotlin.verify(scaleDraftService).purgeDraft(studentNumber, "phq_9")
    }

    @Test
    fun `test submission rejection when already submitted and locked`() {
        val studentNumber = "2026001001"
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, "phq_9")).thenReturn(true)

        val request = SubmitScaleRequest(answers = mapOf("phq9_1" to 1, "phq9_2" to 0))
        val exception = assertThrows<ConflictException> {
            scaleSubmissionService.submitScale(studentNumber, "phq_9", request)
        }
        assertTrue(exception.message!!.contains("already been submitted and locked"))
    }

    @Test
    fun `test submission rejection when question is missing`() {
        val studentNumber = "2026001001"
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, "phq_9")).thenReturn(false)

        // Missing phq9_2
        val request = SubmitScaleRequest(answers = mapOf("phq9_1" to 1))
        val exception = assertThrows<ValidationException> {
            scaleSubmissionService.submitScale(studentNumber, "phq_9", request)
        }
        assertTrue(exception.message!!.contains("Missing answer for question"))
    }

    @Test
    fun `test submission rejection when answer is out of bounds Likert value`() {
        val studentNumber = "2026001001"
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, "phq_9")).thenReturn(false)

        // Out-of-bounds 999 option
        val request = SubmitScaleRequest(answers = mapOf("phq9_1" to 999, "phq9_2" to 0))
        val exception = assertThrows<ValidationException> {
            scaleSubmissionService.submitScale(studentNumber, "phq_9", request)
        }
        assertTrue(exception.message!!.contains("Invalid option value '999'"))
    }
}

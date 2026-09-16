package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.entity.ScaleDraftEntity
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.exception.NotFoundException
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.time.LocalDateTime

class ScaleCatalogServiceTest {

    private val catalogLoader: AssessmentCatalogLoader = mock()
    private val submissionRepository: ScaleSubmissionRepository = mock()
    private val draftRepository: ScaleDraftRepository = mock()
    private val objectMapper = ObjectMapper()

    private val scaleCatalogService = ScaleCatalogService(
        catalogLoader = catalogLoader,
        submissionRepository = submissionRepository,
        draftRepository = draftRepository,
        objectMapper = objectMapper
    )

    private val phq9Detail = ScaleDetail(
        code = "phq_9",
        title = "PHQ-9 抑郁症筛查量表",
        description = "Test Description",
        estimatedMinutes = 2,
        questions = (1..9).map { i ->
            ScaleQuestion(
                id = "phq9_$i",
                text = "Question $i",
                orderNum = i
            )
        }
    )

    private val gad7Detail = ScaleDetail(
        code = "gad_7",
        title = "GAD-7 广泛性焦虑量表",
        description = "Test Description",
        estimatedMinutes = 2,
        questions = (1..7).map { i ->
            ScaleQuestion(
                id = "gad7_$i",
                text = "Question $i",
                orderNum = i
            )
        }
    )

    @BeforeEach
    fun setUp() {
        whenever(catalogLoader.getScaleDetails()).thenReturn(listOf(phq9Detail, gad7Detail))
        whenever(catalogLoader.getScaleDetail("phq_9")).thenReturn(phq9Detail)
        whenever(catalogLoader.getScaleDetail("non_existent")).thenReturn(null)
    }

    @Test
    fun `getScaleSummaries returns NOT_STARTED with zero counts when no draft or submission exists`() {
        whenever(submissionRepository.findByStudentNumber("S1001")).thenReturn(emptyList())
        whenever(draftRepository.findByStudentNumber("S1001")).thenReturn(emptyList())

        val summaries = scaleCatalogService.getScaleSummaries("S1001")

        assertEquals(2, summaries.size)
        val phqSummary = summaries.first { it.code == "phq_9" }
        assertEquals("NOT_STARTED", phqSummary.status)
        assertEquals(0, phqSummary.answeredCount)
        assertEquals(0, phqSummary.completionPercentage)
        assertEquals(9, phqSummary.questionCount)
    }

    @Test
    fun `getScaleSummaries returns IN_PROGRESS with accurate progress projection from draft answers`() {
        whenever(submissionRepository.findByStudentNumber("S1001")).thenReturn(emptyList())

        // Draft with 3 valid answers (including 0), 1 empty string, 1 unknown question
        val answersMap = mapOf(
            "phq9_1" to 0,       // Valid Likert 0
            "phq9_2" to 2,       // Valid Likert 2
            "phq9_3" to 1,       // Valid Likert 1
            "phq9_4" to "  ",    // Blank string - excluded
            "unknown_id" to 3    // Unknown question - excluded
        )
        val draft = ScaleDraftEntity(
            studentNumber = "S1001",
            scaleCode = "phq_9",
            answersJson = objectMapper.writeValueAsString(answersMap),
            clientUpdatedAt = 1000L,
            updatedAt = LocalDateTime.now()
        )
        whenever(draftRepository.findByStudentNumber("S1001")).thenReturn(listOf(draft))

        val summaries = scaleCatalogService.getScaleSummaries("S1001")

        val phqSummary = summaries.first { it.code == "phq_9" }
        assertEquals("IN_PROGRESS", phqSummary.status)
        assertEquals(3, phqSummary.answeredCount)
        // 3 / 9 = 33%
        assertEquals(33, phqSummary.completionPercentage)
        assertEquals(9, phqSummary.questionCount)

        val gadSummary = summaries.first { it.code == "gad_7" }
        assertEquals("NOT_STARTED", gadSummary.status)
        assertEquals(0, gadSummary.answeredCount)
        assertEquals(0, gadSummary.completionPercentage)
    }

    @Test
    fun `getScaleSummaries returns COMPLETED with 100 percent completion for submitted scale`() {
        val submission = ScaleSubmissionEntity(
            studentNumber = "S1001",
            scaleCode = "phq_9",
            answersJson = "{}",
            status = "COMPLETED",
            completedAt = LocalDateTime.now()
        )
        whenever(submissionRepository.findByStudentNumber("S1001")).thenReturn(listOf(submission))
        whenever(draftRepository.findByStudentNumber("S1001")).thenReturn(emptyList())

        val summaries = scaleCatalogService.getScaleSummaries("S1001")

        val phqSummary = summaries.first { it.code == "phq_9" }
        assertEquals("COMPLETED", phqSummary.status)
        assertEquals(9, phqSummary.answeredCount)
        assertEquals(100, phqSummary.completionPercentage)
    }

    @Test
    fun `getScaleSummaries handles malformed draft answersJson safely`() {
        whenever(submissionRepository.findByStudentNumber("S1001")).thenReturn(emptyList())

        val corruptedDraft = ScaleDraftEntity(
            studentNumber = "S1001",
            scaleCode = "phq_9",
            answersJson = "{corrupted json syntax...",
            clientUpdatedAt = 1000L,
            updatedAt = LocalDateTime.now()
        )
        whenever(draftRepository.findByStudentNumber("S1001")).thenReturn(listOf(corruptedDraft))

        val summaries = scaleCatalogService.getScaleSummaries("S1001")

        val phqSummary = summaries.first { it.code == "phq_9" }
        assertEquals("IN_PROGRESS", phqSummary.status)
        assertEquals(0, phqSummary.answeredCount)
        assertEquals(0, phqSummary.completionPercentage)
    }

    @Test
    fun `getScaleDetail returns detail or throws NotFoundException`() {
        val detail = scaleCatalogService.getScaleDetail("phq_9")
        assertEquals("phq_9", detail.code)

        assertThrows<NotFoundException> {
            scaleCatalogService.getScaleDetail("non_existent")
        }
    }
}

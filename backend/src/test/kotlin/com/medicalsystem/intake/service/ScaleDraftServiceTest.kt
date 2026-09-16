package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.SaveDraftRequest
import com.medicalsystem.intake.entity.ScaleDraftEntity
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import java.util.Optional

class ScaleDraftServiceTest {

    private val draftRepository: ScaleDraftRepository = mock()
    private val submissionRepository: ScaleSubmissionRepository = mock()
    private val objectMapper = ObjectMapper()

    private val scaleDraftService = ScaleDraftService(
        draftRepository = draftRepository,
        submissionRepository = submissionRepository,
        objectMapper = objectMapper
    )

    private val studentNumber = "2026001"
    private val scaleCode = "phq_9"

    @org.junit.jupiter.api.BeforeEach
    fun setUp() {
        whenever(draftRepository.save(any<ScaleDraftEntity>())).thenAnswer { it.arguments[0] }
    }

    @Test
    fun `saveDraft should create new entity when draft does not exist`() {
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(false)
        whenever(draftRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(Optional.empty())

        val request = SaveDraftRequest(
            answers = mapOf("phq9_1" to 1, "phq9_2" to 2),
            updatedAt = 1000L
        )

        scaleDraftService.saveDraft(studentNumber, scaleCode, request)

        argumentCaptor<ScaleDraftEntity>().apply {
            verify(draftRepository).save(capture())
            assertEquals(studentNumber, firstValue.studentNumber)
            assertEquals(scaleCode, firstValue.scaleCode)
            assertEquals(1000L, firstValue.clientUpdatedAt)
            assertTrue(firstValue.answersJson.contains("\"phq9_1\":1"))
        }
    }

    @Test
    fun `saveDraft should update existing entity when updatedAt is greater or equal`() {
        val existing = ScaleDraftEntity(
            id = 1L,
            studentNumber = studentNumber,
            scaleCode = scaleCode,
            answersJson = "{\"phq9_1\":0}",
            clientUpdatedAt = 1000L
        )

        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(false)
        whenever(draftRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(Optional.of(existing))

        val request = SaveDraftRequest(
            answers = mapOf("phq9_1" to 2),
            updatedAt = 2000L
        )

        scaleDraftService.saveDraft(studentNumber, scaleCode, request)

        verify(draftRepository).save(existing)
        assertEquals(2000L, existing.clientUpdatedAt)
        assertTrue(existing.answersJson.contains("\"phq9_1\":2"))
    }

    @Test
    fun `saveDraft should ignore older draft when updatedAt is less than existing`() {
        val existing = ScaleDraftEntity(
            id = 1L,
            studentNumber = studentNumber,
            scaleCode = scaleCode,
            answersJson = "{\"phq9_1\":3}",
            clientUpdatedAt = 5000L
        )

        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(false)
        whenever(draftRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(Optional.of(existing))

        val staleRequest = SaveDraftRequest(
            answers = mapOf("phq9_1" to 1),
            updatedAt = 3000L // Stale timestamp
        )

        scaleDraftService.saveDraft(studentNumber, scaleCode, staleRequest)

        verify(draftRepository, never()).save(any())
        assertEquals(5000L, existing.clientUpdatedAt)
        assertTrue(existing.answersJson.contains("\"phq9_1\":3"))
    }

    @Test
    fun `saveDraft should not save if scale is already completed`() {
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(true)

        val request = SaveDraftRequest(
            answers = mapOf("phq9_1" to 1),
            updatedAt = 1000L
        )

        scaleDraftService.saveDraft(studentNumber, scaleCode, request)

        verify(draftRepository, never()).save(any())
    }

    @Test
    fun `getDraft should return draft dto with deserialized answers`() {
        val existing = ScaleDraftEntity(
            id = 1L,
            studentNumber = studentNumber,
            scaleCode = scaleCode,
            answersJson = "{\"phq9_1\":2,\"phq9_2\":1}",
            clientUpdatedAt = 1500L
        )

        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(false)
        whenever(draftRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(Optional.of(existing))

        val result = scaleDraftService.getDraft(studentNumber, scaleCode)

        assertNotNull(result)
        assertEquals(scaleCode, result!!.scaleCode)
        assertEquals(1500L, result.updatedAt)
        assertEquals(2, result.answers["phq9_1"])
        assertEquals(1, result.answers["phq9_2"])
    }

    @Test
    fun `getDraft should return null if scale is already completed`() {
        whenever(submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)).thenReturn(true)

        val result = scaleDraftService.getDraft(studentNumber, scaleCode)

        assertNull(result)
        verify(draftRepository, never()).findByStudentNumberAndScaleCode(any(), any())
    }

    @Test
    fun `purgeDraft should delete draft by student and scale`() {
        scaleDraftService.purgeDraft(studentNumber, scaleCode)
        verify(draftRepository).deleteByStudentNumberAndScaleCode(studentNumber, scaleCode)
    }
}

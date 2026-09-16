package com.medicalsystem.intake.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.SaveDraftRequest
import com.medicalsystem.intake.dto.ScaleDraftDto
import com.medicalsystem.intake.entity.ScaleDraftEntity
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ScaleDraftService(
    private val draftRepository: ScaleDraftRepository,
    private val submissionRepository: ScaleSubmissionRepository,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun saveDraft(studentNumber: String, scaleCode: String, request: SaveDraftRequest) {
        // Invariant: Do not accept drafts for already completed scales
        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)) {
            return
        }

        val answersJson = objectMapper.writeValueAsString(request.answers)
        val existingOpt = draftRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode)

        if (existingOpt.isPresent) {
            val existing = existingOpt.get()
            // Last-Write-Wins based on client timestamp
            if (request.updatedAt >= existing.clientUpdatedAt) {
                existing.answersJson = answersJson
                existing.clientUpdatedAt = request.updatedAt
                existing.updatedAt = LocalDateTime.now()
                draftRepository.save(existing)
            }
        } else {
            draftRepository.save(
                ScaleDraftEntity(
                    studentNumber = studentNumber,
                    scaleCode = scaleCode,
                    answersJson = answersJson,
                    clientUpdatedAt = request.updatedAt,
                    updatedAt = LocalDateTime.now()
                )
            )
        }
    }

    @Transactional(readOnly = true)
    fun getDraft(studentNumber: String, scaleCode: String): ScaleDraftDto? {
        // If already completed, no draft should be returned
        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumber, scaleCode)) {
            return null
        }

        val draftOpt = draftRepository.findByStudentNumberAndScaleCode(studentNumber, scaleCode)
        if (draftOpt.isEmpty) {
            return null
        }

        val draft = draftOpt.get()
        val answers: Map<String, Any> = try {
            objectMapper.readValue(draft.answersJson, object : TypeReference<Map<String, Any>>() {})
        } catch (e: Exception) {
            emptyMap()
        }

        return ScaleDraftDto(
            scaleCode = draft.scaleCode,
            answers = answers,
            updatedAt = draft.clientUpdatedAt
        )
    }

    @Transactional
    fun purgeDraft(studentNumber: String, scaleCode: String) {
        draftRepository.deleteByStudentNumberAndScaleCode(studentNumber, scaleCode)
    }
}

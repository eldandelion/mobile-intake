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
        val studentNumberVo = com.medicalsystem.intake.model.StudentNumber(studentNumber)
        val scaleCodeVo = com.medicalsystem.intake.model.ScaleCode(scaleCode)

        // Invariant: Do not accept drafts for already completed scales
        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumberVo.normalized(), scaleCodeVo.normalized())) {
            return
        }

        val answersJson = objectMapper.writeValueAsString(request.answers)
        val existingOpt = draftRepository.findByStudentNumberAndScaleCode(studentNumberVo.normalized(), scaleCodeVo.normalized())

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
                    studentNumber = studentNumberVo.normalized(),
                    scaleCode = scaleCodeVo.normalized(),
                    answersJson = answersJson,
                    clientUpdatedAt = request.updatedAt,
                    updatedAt = LocalDateTime.now()
                )
            )
        }
    }

    @Transactional(readOnly = true)
    fun getDraft(studentNumber: String, scaleCode: String): ScaleDraftDto? {
        val studentNumberVo = com.medicalsystem.intake.model.StudentNumber(studentNumber)
        val scaleCodeVo = com.medicalsystem.intake.model.ScaleCode(scaleCode)

        // If already completed, no draft should be returned
        if (submissionRepository.existsByStudentNumberAndScaleCode(studentNumberVo.normalized(), scaleCodeVo.normalized())) {
            return null
        }

        val draftOpt = draftRepository.findByStudentNumberAndScaleCode(studentNumberVo.normalized(), scaleCodeVo.normalized())
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
        val studentNumberVo = com.medicalsystem.intake.model.StudentNumber(studentNumber)
        val scaleCodeVo = com.medicalsystem.intake.model.ScaleCode(scaleCode)
        draftRepository.deleteByStudentNumberAndScaleCode(studentNumberVo.normalized(), scaleCodeVo.normalized())
    }
}

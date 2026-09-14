package com.medicalsystem.intake.controller

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.ScaleSummaryDto
import com.medicalsystem.intake.dto.SubmitScaleRequest
import com.medicalsystem.intake.dto.SubmitScaleResponse
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.security.CurrentStudent
import com.medicalsystem.intake.service.ScaleCatalogService
import com.medicalsystem.intake.service.ScaleDetail
import com.medicalsystem.intake.service.ScaleSubmissionService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/scales")
class ScaleController(
    private val scaleCatalogService: ScaleCatalogService,
    private val scaleSubmissionService: ScaleSubmissionService,
    private val objectMapper: ObjectMapper
) {

    @GetMapping
    fun listScales(@CurrentStudent student: IntakeStudentEntity): ResponseEntity<List<ScaleSummaryDto>> {
        val summaries = scaleCatalogService.getScaleSummaries(student.studentNumber)
        return ResponseEntity.ok(summaries)
    }

    @GetMapping("/{code}")
    fun getScaleDetail(
        @PathVariable code: String,
        @CurrentStudent student: IntakeStudentEntity
    ): ResponseEntity<ScaleDetail> {
        val detail = scaleCatalogService.getScaleDetail(code)
        return ResponseEntity.ok(detail)
    }

    @PostMapping("/{code}/submit")
    fun submitScale(
        @PathVariable code: String,
        @Valid @RequestBody request: SubmitScaleRequest,
        @CurrentStudent student: IntakeStudentEntity
    ): ResponseEntity<SubmitScaleResponse> {
        val response = scaleSubmissionService.submitScale(student.studentNumber, code, request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{code}/submission")
    fun getSubmission(
        @PathVariable code: String,
        @CurrentStudent student: IntakeStudentEntity
    ): ResponseEntity<Map<String, Any>> {
        val sub = scaleSubmissionService.getSubmission(student.studentNumber, code)
        if (sub == null) {
            return ResponseEntity.notFound().build()
        }
        val answers: Map<String, Any> = try {
            objectMapper.readValue(sub.answersJson, object : TypeReference<Map<String, Any>>() {})
        } catch (e: Exception) {
            emptyMap()
        }
        return ResponseEntity.ok(
            mapOf(
                "scaleCode" to sub.scaleCode,
                "status" to sub.status,
                "completedAt" to sub.completedAt,
                "answers" to answers
            )
        )
    }
}

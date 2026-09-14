package com.medicalsystem.intake.controller

import com.medicalsystem.intake.exception.ForbiddenException
import com.medicalsystem.intake.service.CsvExportService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/export")
class AdminExportController(
    private val csvExportService: CsvExportService,
    @Value("\${intake.security.admin-secret:csu-medical-intake-admin-secret-2026}")
    private val adminSecret: String
) {

    private fun verifySecret(headerSecret: String?) {
        if (headerSecret == null || headerSecret != adminSecret) {
            throw ForbiddenException("Invalid administrative export credentials")
        }
    }

    @GetMapping("/students.csv")
    fun exportStudents(
        @RequestHeader(name = "X-Admin-Secret", required = false) secret: String?
    ): ResponseEntity<ByteArray> {
        verifySecret(secret)
        val csvData = csvExportService.exportStudentsCsv()

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students.csv\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(csvData)
    }

    @GetMapping("/assessments.csv")
    fun exportAssessments(
        @RequestHeader(name = "X-Admin-Secret", required = false) secret: String?
    ): ResponseEntity<ByteArray> {
        verifySecret(secret)
        val csvData = csvExportService.exportAssessmentsCsv()

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"assessments.csv\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(csvData)
    }
}

package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class CsvExportServiceTest {

    private val studentRepository: IntakeStudentRepository = mock()
    private val submissionRepository: ScaleSubmissionRepository = mock()
    private val scaleCatalogService: ScaleCatalogService = mock()
    private val objectMapper = ObjectMapper()

    private val csvExportService = CsvExportService(
        studentRepository = studentRepository,
        submissionRepository = submissionRepository,
        scaleCatalogService = scaleCatalogService,
        objectMapper = objectMapper
    )

    @Test
    fun `test escapeCsv sanitizes spreadsheet formula injection characters`() {
        // CWE-1236 Formula injection attack vectors
        assertEquals("'-cmd", csvExportService.escapeCsv("-cmd"))
        assertEquals("'+1234", csvExportService.escapeCsv("+1234"))
        assertEquals("\"'=HYPERLINK(\"\"http://evil.com\"\")\"", csvExportService.escapeCsv("=HYPERLINK(\"http://evil.com\")"))
        assertEquals("'@SUM(A1:A10)", csvExportService.escapeCsv("@SUM(A1:A10)"))
        assertEquals("'\ttabbed", csvExportService.escapeCsv("\ttabbed"))
    }

    @Test
    fun `test escapeCsv properly handles quotes, commas, and linebreaks according to RFC 4180`() {
        assertEquals("normal", csvExportService.escapeCsv("normal"))
        assertEquals("\"hello, world\"", csvExportService.escapeCsv("hello, world"))
        assertEquals("\"line1\nline2\"", csvExportService.escapeCsv("line1\nline2"))
        assertEquals("\"he said \"\"hello\"\"\"", csvExportService.escapeCsv("he said \"hello\""))
        assertEquals("\"'=formula,with,comma\"", csvExportService.escapeCsv("=formula,with,comma"))
    }

    @Test
    fun `test exportStudentsCsv includes UTF-8 BOM and sanitizes student fields`() {
        val maliciousStudent = IntakeStudentEntity(
            studentNumber = "2026999",
            fullName = "=cmd|' /C calc'!A0",
            phone = "+13800001111",
            passwordHash = "hash"
        )

        whenever(studentRepository.findAll()).thenReturn(listOf(maliciousStudent))
        whenever(submissionRepository.findAll()).thenReturn(emptyList())

        val csvBytes = csvExportService.exportStudentsCsv()

        // Verify UTF-8 BOM
        assertEquals(0xEF.toByte(), csvBytes[0])
        assertEquals(0xBB.toByte(), csvBytes[1])
        assertEquals(0xBF.toByte(), csvBytes[2])

        val content = String(csvBytes, Charsets.UTF_8)
        assertTrue(content.contains("学号,姓名,专业"))
        // Formula injection should be neutralized with leading single quote
        assertTrue(content.contains("2026999"))
        assertTrue(content.contains("'=cmd|' /C calc'!A0"))
        assertTrue(content.contains("'+13800001111"))
    }

    @Test
    fun `test exportAssessmentsCsv maps questionId to canonical scale code via ACL bridge`() {
        val submission = ScaleSubmissionEntity(
            studentNumber = "2026001",
            scaleCode = "MENTAL_HEALTH_ASSESSMENT",
            answersJson = """{"phq9_1":2,"gad7_1":1}""",
            status = "COMPLETED"
        )

        whenever(submissionRepository.findAll()).thenReturn(listOf(submission))
        whenever(scaleCatalogService.lookupScaleCodeForQuestion("phq9_1")).thenReturn("phq_9")
        whenever(scaleCatalogService.lookupScaleCodeForQuestion("gad7_1")).thenReturn("gad_7")

        val csvBytes = csvExportService.exportAssessmentsCsv()

        // Verify UTF-8 BOM
        assertEquals(0xEF.toByte(), csvBytes[0])
        assertEquals(0xBB.toByte(), csvBytes[1])
        assertEquals(0xBF.toByte(), csvBytes[2])

        val content = String(csvBytes, Charsets.UTF_8)
        assertTrue(content.contains("student_number,scale_code,question_id,selected_value,completed_at"))
        // Check that phq_9 and gad_7 are emitted instead of MENTAL_HEALTH_ASSESSMENT
        assertTrue(content.contains("2026001,phq_9,phq9_1,2"))
        assertTrue(content.contains("2026001,gad_7,gad7_1,1"))
        assertFalse(content.contains("2026001,MENTAL_HEALTH_ASSESSMENT"))
    }
}

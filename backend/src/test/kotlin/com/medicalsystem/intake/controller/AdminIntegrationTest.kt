package com.medicalsystem.intake.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.AdminLoginRequest
import com.medicalsystem.intake.dto.ResetPasswordRequest
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.entity.ScaleDraftEntity
import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.model.PersonName
import com.medicalsystem.intake.model.ScaleCode
import com.medicalsystem.intake.model.StudentNumber
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import com.medicalsystem.intake.security.JwtService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.WebApplicationContext
import java.io.ByteArrayInputStream
import java.util.zip.ZipInputStream

@SpringBootTest
class AdminIntegrationTest {

    @Autowired
    private lateinit var webApplicationContext: WebApplicationContext

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var studentRepository: IntakeStudentRepository

    @Autowired
    private lateinit var submissionRepository: ScaleSubmissionRepository

    @Autowired
    private lateinit var draftRepository: ScaleDraftRepository

    @Autowired
    private lateinit var jwtService: JwtService

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    private lateinit var mockMvc: MockMvc
    private val adminSecret = "csu-medical-intake-admin-secret-2026"

    @BeforeEach
    fun setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build()
        draftRepository.deleteAll()
        submissionRepository.deleteAll()
        studentRepository.deleteAll()
    }

    private fun loginAsAdmin(): String {
        val result = mockMvc.perform(
            post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AdminLoginRequest(secret = adminSecret)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").isNotEmpty)
            .andReturn()

        val json = objectMapper.readTree(result.response.contentAsString)
        return json.get("token").asText()
    }

    private fun createStudent(studentNumber: String, name: String, phone: String, password: String = "password123"): String {
        val entity = IntakeStudentEntity.create(
            studentNumber = StudentNumber(studentNumber),
            fullName = PersonName(name),
            phone = ChineseMobileNumber(phone),
            passwordHash = passwordEncoder.encode(password)!!
        )
        studentRepository.save(entity)
        return jwtService.generateToken(studentNumber)
    }

    @Test
    fun `test admin login failure with wrong secret`() {
        mockMvc.perform(
            post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AdminLoginRequest(secret = "wrong-secret")))
        )
            .andExpect(status().isForbidden)
    }

    @Test
    fun `test admin login success and access me endpoint`() {
        val token = loginAsAdmin()

        mockMvc.perform(
            get("/api/admin/auth/me")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.username").value("admin"))
            .andExpect(jsonPath("$.role").value("ROLE_INTAKE_ADMIN"))
    }

    @Test
    fun `test student token cannot access admin endpoints`() {
        val studentToken = createStudent("8209220532", "张三", "13800138000")

        // Attempt admin dashboard with student token -> should be Forbidden
        mockMvc.perform(
            get("/api/admin/dashboard/metrics")
                .header("Authorization", "Bearer $studentToken")
        )
            .andExpect(status().isForbidden)
    }

    @Test
    fun `test admin dashboard metrics aggregation`() {
        val adminToken = loginAsAdmin()

        // 1. Initial metrics (0 students)
        mockMvc.perform(
            get("/api/admin/dashboard/metrics")
                .header("Authorization", "Bearer $adminToken")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.totalStudents").value(0))
            .andExpect(jsonPath("$.fullyCompletedStudents").value(0))

        // 2. Create student and save a submission for comprehensive_student_intake_survey
        createStudent("8209220532", "张三", "13800138000")
        submissionRepository.save(
            ScaleSubmissionEntity.create(
                studentNumber = StudentNumber("8209220532"),
                scaleCode = ScaleCode("comprehensive_student_intake_survey"),
                answersJson = objectMapper.writeValueAsString(mapOf("demo_major" to "自动化"))
            )
        )

        // 3. Re-check metrics
        mockMvc.perform(
            get("/api/admin/dashboard/metrics")
                .header("Authorization", "Bearer $adminToken")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.totalStudents").value(1))
            .andExpect(jsonPath("$.fullyCompletedStudents").value(1))
            .andExpect(jsonPath("$.scaleStats[?(@.scaleCode=='comprehensive_student_intake_survey')].completedCount").value(1))
    }

    @Test
    fun `test student management - list, detail, password reset, and atomic delete`() {
        val adminToken = loginAsAdmin()

        createStudent("8209220532", "李四", "13900139000", "oldpassword")

        // Save a submission for comprehensive_student_intake_survey
        val demoAnswers = mapOf(
            "demo_gender" to 1,
            "demo_major" to "计算机科学",
            "demo_id_card" to "110101199003072345"
        )
        submissionRepository.save(
            ScaleSubmissionEntity.create(
                studentNumber = StudentNumber("8209220532"),
                scaleCode = ScaleCode("comprehensive_student_intake_survey"),
                answersJson = objectMapper.writeValueAsString(demoAnswers)
            )
        )

        // 1. Admin lists students with search
        mockMvc.perform(
            get("/api/admin/students")
                .param("search", "李四")
                .header("Authorization", "Bearer $adminToken")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].studentNumber").value("8209220532"))
            .andExpect(jsonPath("$[0].scaleStatuses[?(@.scaleCode=='comprehensive_student_intake_survey')].status").value("COMPLETED"))
            .andExpect(jsonPath("$[0].allCompleted").value(true))

        // 2. Admin gets student detail
        mockMvc.perform(
            get("/api/admin/students/8209220532")
                .header("Authorization", "Bearer $adminToken")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.studentNumber").value("8209220532"))
            .andExpect(jsonPath("$.fullName").value("李四"))
            .andExpect(jsonPath("$.demographics.major").value("计算机科学"))

        // 3. Admin resets password
        mockMvc.perform(
            post("/api/admin/students/8209220532/reset-password")
                .header("Authorization", "Bearer $adminToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ResetPasswordRequest(newPassword = "newsecret123")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.newPassword").value("newsecret123"))

        // Verify student can log in with new password
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapOf("identifier" to "8209220532", "password" to "newsecret123")))
        ).andExpect(status().isOk)

        // 4. Admin deletes student (atomic cascade)
        mockMvc.perform(
            delete("/api/admin/students/8209220532")
                .header("Authorization", "Bearer $adminToken")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        // Confirm database is completely purged of drafts, submissions, and student
        assertFalse(studentRepository.findByStudentNumber("8209220532").isPresent)
        assertTrue(draftRepository.findByStudentNumber("8209220532").isEmpty())
        assertTrue(submissionRepository.findByStudentNumber("8209220532").isEmpty())
    }

    @Test
    fun `test admin export zip package contains students and assessments csv with BOM`() {
        val adminToken = loginAsAdmin()

        createStudent("8209220532", "王五", "13700137000")

        val demoAnswers = mapOf("demo_major" to "自动化")
        submissionRepository.save(
            ScaleSubmissionEntity.create(
                studentNumber = StudentNumber("8209220532"),
                scaleCode = ScaleCode("demographics_survey"),
                answersJson = objectMapper.writeValueAsString(demoAnswers)
            )
        )

        // Request ZIP with Bearer token
        val zipResult = mockMvc.perform(
            get("/api/admin/export/package.zip")
                .header("Authorization", "Bearer $adminToken")
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Content-Type", "application/zip"))
            .andReturn()

        val zipBytes = zipResult.response.contentAsByteArray
        val zis = ZipInputStream(ByteArrayInputStream(zipBytes))
        val entryNames = mutableListOf<String>()

        var entry = zis.nextEntry
        while (entry != null) {
            entryNames.add(entry.name)
            val content = zis.readBytes()
            // Verify UTF-8 BOM at start of each CSV
            assertEquals(0xEF.toByte(), content[0])
            assertEquals(0xBB.toByte(), content[1])
            assertEquals(0xBF.toByte(), content[2])
            zis.closeEntry()
            entry = zis.nextEntry
        }

        assertTrue(entryNames.contains("students.csv"))
        assertTrue(entryNames.contains("assessments.csv"))
    }
}

package com.medicalsystem.intake

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.LoginRequest
import com.medicalsystem.intake.dto.RegisterRequest
import com.medicalsystem.intake.dto.SubmitScaleRequest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.WebApplicationContext

@SpringBootTest
class IntakeApplicationTests {

    @Autowired
    private lateinit var webApplicationContext: WebApplicationContext

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build()
    }

    @Test
    fun contextLoads() {
        assertNotNull(webApplicationContext)
    }

    @Test
    fun `test full student registration, scale completion, and admin CSV export lifecycle`() {
        val studentNumber = "2026099"
        val phone = "13800112233"
        val registerReq = RegisterRequest(
            studentNumber = studentNumber,
            fullName = "张三丰",
            phone = phone,
            password = "securePassword123"
        )

        // 1. Register Student
        val registerResult = mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").isNotEmpty)
            .andExpect(jsonPath("$.student.studentNumber").value(studentNumber))
            .andReturn()

        val token = objectMapper.readTree(registerResult.response.contentAsString).get("token").asText()
        assertNotNull(token)

        // 2. Duplicate registration should return 409 Conflict
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq))
        )
            .andExpect(status().isConflict)

        // 3. Login with Student Number
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest(identifier = studentNumber, password = "securePassword123")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").isNotEmpty)

        // 4. Fetch Scale List
        val listResult = mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andReturn()

        val scaleSummaries = objectMapper.readTree(listResult.response.contentAsString)
        assertTrue(scaleSummaries.size() >= 4)
        val phqSummary = scaleSummaries.first { it.get("code").asText() == "phq_9" }
        assertEquals("NOT_STARTED", phqSummary.get("status").asText())

        // 5. Fetch Scale Details for PHQ-9
        mockMvc.perform(
            get("/api/scales/phq_9")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value("phq_9"))
            .andExpect(jsonPath("$.questions").isArray)
            .andExpect(jsonPath("$.questions.length()").value(9))

        // 6. Submit PHQ-9 Scale
        val phqAnswers = mapOf(
            "phq9_1" to 1,
            "phq9_2" to 0,
            "phq9_3" to 2,
            "phq9_4" to 1,
            "phq9_5" to 0,
            "phq9_6" to 1,
            "phq9_7" to 0,
            "phq9_8" to 0,
            "phq9_9" to 0
        )
        mockMvc.perform(
            post("/api/scales/phq_9/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(phqAnswers)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.scaleCode").value("phq_9"))
            .andExpect(jsonPath("$.status").value("COMPLETED"))

        // 7. Verify status is now COMPLETED
        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'phq_9')].status").value("COMPLETED"))

        // 8. Resubmitting should return 409 Conflict (Locked)
        mockMvc.perform(
            post("/api/scales/phq_9/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(phqAnswers)))
        )
            .andExpect(status().isConflict)

        // 9. Admin CSV Export - Unauthorized without secret
        mockMvc.perform(get("/api/admin/export/students.csv"))
            .andExpect(status().isForbidden)

        // 10. Admin CSV Export - Successful with valid secret
        val adminSecret = "csu-medical-intake-admin-secret-2026"
        val csvResult = mockMvc.perform(
            get("/api/admin/export/students.csv")
                .header("X-Admin-Secret", adminSecret)
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"students.csv\""))
            .andReturn()

        val csvContent = csvResult.response.contentAsByteArray
        // Check for UTF-8 BOM
        assertEquals(0xEF.toByte(), csvContent[0])
        assertEquals(0xBB.toByte(), csvContent[1])
        assertEquals(0xBF.toByte(), csvContent[2])

        val csvString = String(csvContent, Charsets.UTF_8)
        assertTrue(csvString.contains("学号,姓名,专业"))
        assertTrue(csvString.contains(studentNumber))
        assertTrue(csvString.contains("张三丰"))

        // 11. Admin Assessment CSV Export
        val assessCsvResult = mockMvc.perform(
            get("/api/admin/export/assessments.csv")
                .header("X-Admin-Secret", adminSecret)
        )
            .andExpect(status().isOk)
            .andReturn()

        val assessCsvString = String(assessCsvResult.response.contentAsByteArray, Charsets.UTF_8)
        assertTrue(assessCsvString.contains("student_number,scale_code,question_id,selected_value,completed_at"))
        assertTrue(assessCsvString.contains(studentNumber))
        assertTrue(assessCsvString.contains("phq_9"))
        assertTrue(assessCsvString.contains("phq9_1,1"))
    }
}

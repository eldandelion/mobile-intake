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

    @Autowired
    private lateinit var studentRepository: com.medicalsystem.intake.repository.IntakeStudentRepository

    @Autowired
    private lateinit var submissionRepository: com.medicalsystem.intake.repository.ScaleSubmissionRepository

    @Autowired
    private lateinit var draftRepository: com.medicalsystem.intake.repository.ScaleDraftRepository

    @Autowired
    private lateinit var catalogLoader: com.medicalsystem.intake.service.AssessmentCatalogLoader

    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build()
        draftRepository.deleteAll()
        submissionRepository.deleteAll()
        studentRepository.deleteAll()
    }

    @Test
    fun contextLoads() {
        assertNotNull(webApplicationContext)
    }

    @Test
    fun `test send and verify code endpoints`() {
        // Send code
        mockMvc.perform(
            post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.SendCodeRequest("13811112222")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.devCode").value("123456"))

        // Verify code with valid code
        mockMvc.perform(
            post("/api/auth/verify-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.VerifyCodeRequest("13811112222", "123456")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.valid").value(true))

        // Verify code with wrong code
        mockMvc.perform(
            post("/api/auth/verify-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.VerifyCodeRequest("13811112222", "999999")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.valid").value(false))
    }

    @Test
    fun `test full student registration, scale completion, and admin CSV export lifecycle`() {
        val studentNumber = "2026099001"
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

        // 3. Login with Student Number (both identifier and studentNumber JSON keys)
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest(identifier = studentNumber, password = "securePassword123")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").isNotEmpty)
            .andExpect(jsonPath("$.student.studentNumber").value(studentNumber))
            .andExpect(jsonPath("$.studentNumber").value(studentNumber))

        // Also verify payload with explicit studentNumber key works identically
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapOf("studentNumber" to studentNumber, "password" to "securePassword123")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").isNotEmpty)
            .andExpect(jsonPath("$.student.studentNumber").value(studentNumber))
            .andExpect(jsonPath("$.studentNumber").value(studentNumber))

        // 4. Fetch Scale List
        val listResult = mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andReturn()

        val scaleSummaries = objectMapper.readTree(listResult.response.contentAsString)
        assertEquals(10, scaleSummaries.size())
        val demoSummary = scaleSummaries.get(0)
        assertEquals("demographics_survey", demoSummary.get("code").asText())
        assertEquals("NOT_STARTED", demoSummary.get("status").asText())

        val ghqSummary = scaleSummaries.get(1)
        assertEquals("general_health_screener", ghqSummary.get("code").asText())
        assertEquals("NOT_STARTED", ghqSummary.get("status").asText())
        assertEquals(24, ghqSummary.get("questionCount").asInt())

        val sleepSummary = scaleSummaries.first { it.get("code").asText() == "SLEEP_ASSESSMENT" }
        assertEquals("NOT_STARTED", sleepSummary.get("status").asText())
        assertEquals(14, sleepSummary.get("questionCount").asInt())

        // 5. Fetch Scale Details for SLEEP_ASSESSMENT
        mockMvc.perform(
            get("/api/scales/SLEEP_ASSESSMENT")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value("SLEEP_ASSESSMENT"))
            .andExpect(jsonPath("$.questions").isArray)
            .andExpect(jsonPath("$.questions.length()").value(14))
            .andExpect(jsonPath("$.sections.length()").value(2))
            .andExpect(jsonPath("$.sections[0].code").value("sleep_disorder"))
            .andExpect(jsonPath("$.sections[1].code").value("psqi"))

        // 5.5 Submit with out-of-bounds option value -> 400 Bad Request
        val invalidOptionAnswers = mapOf(
            "sleep_1" to 999,
            "sleep_2" to 0,
            "sleep_3" to 0,
            "sleep_4" to 2,
            "sleep_5" to 0,
            "sleep_6" to 1,
            "sleep_7" to 0,
            "psqi_1" to 0,
            "psqi_2" to 1,
            "psqi_3" to 0,
            "psqi_4" to 2,
            "psqi_5" to 0,
            "psqi_6" to 1,
            "psqi_7" to 0
        )
        mockMvc.perform(
            post("/api/scales/SLEEP_ASSESSMENT/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(invalidOptionAnswers)))
        )
            .andExpect(status().isBadRequest)

        // 5.6 Submit with missing question -> 400 Bad Request
        val missingAnswers = mapOf("sleep_1" to 1)
        mockMvc.perform(
            post("/api/scales/SLEEP_ASSESSMENT/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(missingAnswers)))
        )
            .andExpect(status().isBadRequest)

        // 6. Submit SLEEP_ASSESSMENT Battery (Valid 14 questions across 2 sections)
        val sleepAnswers = mapOf(
            "sleep_1" to 0,
            "sleep_2" to 1,
            "sleep_3" to 0,
            "sleep_4" to 2,
            "sleep_5" to 0,
            "sleep_6" to 1,
            "sleep_7" to 0,
            "psqi_1" to 0,
            "psqi_2" to 1,
            "psqi_3" to 0,
            "psqi_4" to 2,
            "psqi_5" to 0,
            "psqi_6" to 1,
            "psqi_7" to 0
        )
        mockMvc.perform(
            post("/api/scales/SLEEP_ASSESSMENT/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(sleepAnswers)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.scaleCode").value("SLEEP_ASSESSMENT"))
            .andExpect(jsonPath("$.status").value("COMPLETED"))

        // 6.1 Submit demographics_survey
        val demoDetail = catalogLoader.getScaleDetail("demographics_survey")!!
        val demoAnswers = demoDetail.questions.associate { q ->
            val sampleVal: Any = if (q.id == "demo_class") {
                "计算机学院 软件工程"
            } else if (q.id == "demo_id_card") {
                "110101199003072375"
            } else if (q.options.isNotEmpty()) {
                q.options[0].value
            } else if (q.type == "number" || q.type == "slider") {
                q.min?.toInt() ?: 18
            } else {
                "张测试"
            }
            q.id to sampleVal
        }
        mockMvc.perform(
            post("/api/scales/demographics_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(demoAnswers)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.scaleCode").value("demographics_survey"))
            .andExpect(jsonPath("$.status").value("COMPLETED"))

        // 7. Verify statuses are now COMPLETED
        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'SLEEP_ASSESSMENT')].status").value("COMPLETED"))
            .andExpect(jsonPath("$[?(@.code == 'demographics_survey')].status").value("COMPLETED"))

        // 8. Resubmitting should return 409 Conflict (Locked)
        mockMvc.perform(
            post("/api/scales/SLEEP_ASSESSMENT/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(sleepAnswers)))
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
        assertTrue(csvString.contains("计算机学院 软件工程"))

        // 11. Admin Assessment CSV Export with canonical instrument codes (ACL bridge)
        val assessCsvResult = mockMvc.perform(
            get("/api/admin/export/assessments.csv")
                .header("X-Admin-Secret", adminSecret)
        )
            .andExpect(status().isOk)
            .andReturn()

        val assessCsvString = String(assessCsvResult.response.contentAsByteArray, Charsets.UTF_8)
        assertTrue(assessCsvString.contains("student_number,scale_code,question_id,selected_value,completed_at"))
        assertTrue(assessCsvString.contains(studentNumber))
        // Verify ACL resolves question to canonical scale codes sleep_disorder and psqi
        assertTrue(assessCsvString.contains("sleep_disorder,sleep_1,0"))
        assertTrue(assessCsvString.contains("psqi,psqi_1,0"))
        // And demographics_survey questions
        assertTrue(assessCsvString.contains("demographics_survey,G1,1"))
        // Must NOT output the composite battery code SLEEP_ASSESSMENT in scale_code column
        assertFalse(assessCsvString.contains("SLEEP_ASSESSMENT"))
    }

    @Test
    fun `test draft save, retrieve, status IN_PROGRESS, and purge on completion`() {
        val studentNumber = "2026088001"
        val registerReq = RegisterRequest(
            studentNumber = studentNumber,
            fullName = "李寻欢",
            phone = "13800889900",
            password = "securePassword123"
        )
        val registerResult = mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq))
        )
            .andExpect(status().isOk)
            .andReturn()

        val token = objectMapper.readTree(registerResult.response.contentAsString).get("token").asText()

        // 1. Initial draft should be empty (204 No Content)
        mockMvc.perform(
            get("/api/scales/demographics_survey/draft")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isNoContent)

        // 2. Save partial draft
        val draftAnswers = mapOf(
            "G1" to 1,
            "G4" to 1
        )
        val draftReq = com.medicalsystem.intake.dto.SaveDraftRequest(
            answers = draftAnswers,
            updatedAt = 1000L
        )
        mockMvc.perform(
            put("/api/scales/demographics_survey/draft")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(draftReq))
        )
            .andExpect(status().isNoContent)

        // 3. Retrieve draft
        mockMvc.perform(
            get("/api/scales/demographics_survey/draft")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.scaleCode").value("demographics_survey"))
            .andExpect(jsonPath("$.updatedAt").value(1000L))
            .andExpect(jsonPath("$.answers.G1").value(1))
            .andExpect(jsonPath("$.answers.G4").value(1))

        // 4. Check scale list: demographics_survey should now have status "IN_PROGRESS" with progress counts
        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'demographics_survey')].status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$[?(@.code == 'demographics_survey')].answeredCount").value(2))

        // 5. Complete and submit demographics_survey
        val demoDetail = catalogLoader.getScaleDetail("demographics_survey")!!
        val fullAnswers = demoDetail.questions.associate { q ->
            val sampleVal: Any = if (q.id == "demo_class") {
                "计算机学院 软件工程"
            } else if (q.id == "demo_id_card") {
                "110101199003072375"
            } else if (q.options.isNotEmpty()) {
                q.options[0].value
            } else if (q.type == "number" || q.type == "slider") {
                q.min?.toInt() ?: 18
            } else {
                "测试内容"
            }
            q.id to sampleVal
        }
        mockMvc.perform(
            post("/api/scales/demographics_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(fullAnswers)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("COMPLETED"))

        // 6. Draft must now be purged (204 No Content) and status COMPLETED with 100% completion
        mockMvc.perform(
            get("/api/scales/demographics_survey/draft")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isNoContent)

        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'demographics_survey')].status").value("COMPLETED"))
            .andExpect(jsonPath("$[?(@.code == 'demographics_survey')].completionPercentage").value(100))
    }

    @Test
    fun `test international student registration with lowercase l normalizes and allows login`() {
        val rawStudentNumber = "l209220532"
        val phone = "13900112233"
        val registerReq = RegisterRequest(
            studentNumber = rawStudentNumber,
            fullName = "John Doe",
            phone = phone,
            password = "securePassword123"
        )

        // Register with lowercase 'l'
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.student.studentNumber").value("L209220532"))

        // Login with lowercase 'l'
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest(identifier = "l209220532", password = "securePassword123")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.student.studentNumber").value("L209220532"))
    }

    @Test
    fun `test register rejects degenerate and leading zero student numbers`() {
        // Degenerate repeating 9s
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = "9999999999",
                        fullName = "张三",
                        phone = "13800000001",
                        password = "password123"
                    )
                ))
        ).andExpect(status().isBadRequest)

        // Leading zero
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = "0209220532",
                        fullName = "张三",
                        phone = "13800000002",
                        password = "password123"
                    )
                ))
        ).andExpect(status().isBadRequest)
    }
}

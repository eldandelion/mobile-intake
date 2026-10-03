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

    private fun sendCodeAndGetDevCode(phone: String, purpose: String = "REGISTRATION", studentNumber: String? = null): String {
        val sendRes = mockMvc.perform(
            post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.SendCodeRequest(
                    phone = phone,
                    purpose = purpose,
                    studentNumber = studentNumber
                )))
        ).andExpect(status().isOk).andReturn()
        return objectMapper.readTree(sendRes.response.contentAsString).get("devCode").asText()
    }

    @Test
    fun `test send and verify code endpoints`() {
        // Send code
        val sendRes = mockMvc.perform(
            post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.SendCodeRequest("13811112222")))
        )
            .andExpect(status().isOk)
            .andReturn()

        val json = objectMapper.readTree(sendRes.response.contentAsString)
        val devCode = json.get("devCode").asText()

        // Verify code with valid code
        mockMvc.perform(
            post("/api/auth/verify-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.VerifyCodeRequest("13811112222", devCode)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.valid").value(true))

        // Verify code with wrong code
        mockMvc.perform(
            post("/api/auth/verify-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.VerifyCodeRequest("13811112222", "000000")))
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `test phone login with sms verification code`() {
        val studentNumber = "8209220999"
        val phone = "13988887777"
        val regCode = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = studentNumber)
        val registerReq = com.medicalsystem.intake.dto.RegisterRequest(
            studentNumber = studentNumber,
            fullName = "王小明",
            phone = phone,
            password = "password123",
            verificationCode = regCode
        )
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq))
        ).andExpect(status().isOk)

        // Request login code
        val sendRes = mockMvc.perform(
            post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.SendCodeRequest(phone = phone, purpose = "LOGIN")))
        )
            .andExpect(status().isOk)
            .andReturn()

        val json = objectMapper.readTree(sendRes.response.contentAsString)
        val devCode = json.get("devCode").asText()

        // Login with SMS code
        val loginRes = mockMvc.perform(
            post("/api/auth/login-sms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(com.medicalsystem.intake.dto.LoginSmsRequest(phone = phone, code = devCode)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").isNotEmpty)
            .andExpect(jsonPath("$.student.studentNumber").value(studentNumber))
            .andReturn()

        val loginJson = objectMapper.readTree(loginRes.response.contentAsString)
        val token = loginJson.get("token").asText()

        // Verify me endpoint with token
        mockMvc.perform(
            get("/api/auth/me")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.studentNumber").value(studentNumber))
            .andExpect(jsonPath("$.phone").value(phone))
    }

    @Test
    fun `test full student registration, scale completion, and admin CSV export lifecycle`() {
        val studentNumber = "2026099001"
        val phone = "13800112233"
        val regCode = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = studentNumber)
        val registerReq = RegisterRequest(
            studentNumber = studentNumber,
            fullName = "张三丰",
            phone = phone,
            password = "securePassword123",
            verificationCode = regCode
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

        // 4. Fetch Scale List (Now contains exactly 1 unified intake survey)
        val listResult = mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andReturn()

        val scaleSummaries = objectMapper.readTree(listResult.response.contentAsString)
        assertEquals(1, scaleSummaries.size(), "Should have exactly 1 unified questionnaire available to student")
        val surveySummary = scaleSummaries.get(0)
        assertEquals("comprehensive_student_intake_survey", surveySummary.get("code").asText())
        assertEquals("NOT_STARTED", surveySummary.get("status").asText())
        assertTrue(surveySummary.get("questionCount").asInt() > 300)

        // 5. Fetch Scale Details for comprehensive_student_intake_survey
        mockMvc.perform(
            get("/api/scales/comprehensive_student_intake_survey")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value("comprehensive_student_intake_survey"))
            .andExpect(jsonPath("$.questions").isArray)
            .andExpect(jsonPath("$.sections").isArray)

        // 5.5 Submit with out-of-bounds option value -> 400 Bad Request
        val invalidOptionAnswers = mapOf(
            "sleep_1" to 999
        )
        mockMvc.perform(
            post("/api/scales/comprehensive_student_intake_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(invalidOptionAnswers)))
        )
            .andExpect(status().isBadRequest)

        // 5.6 Submit with missing question -> 400 Bad Request
        val missingAnswers = mapOf("sleep_1" to 1)
        mockMvc.perform(
            post("/api/scales/comprehensive_student_intake_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(missingAnswers)))
        )
            .andExpect(status().isBadRequest)

        // 6. Submit comprehensive_student_intake_survey
        val surveyDetail = catalogLoader.getScaleDetail("comprehensive_student_intake_survey")!!
        val surveyAnswers = surveyDetail.questions.associate { q ->
            val sampleVal: Any = if (q.id == "demo_class") {
                "计算机学院 软件工程"
            } else if (q.id == "demo_id_card" || q.id == "idCardNumber") {
                "110101199003072375"
            } else if (q.type == "date" || q.id == "G2") {
                "2004-05-18"
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
            post("/api/scales/comprehensive_student_intake_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(surveyAnswers)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.scaleCode").value("comprehensive_student_intake_survey"))
            .andExpect(jsonPath("$.status").value("COMPLETED"))

        // 7. Verify status is now COMPLETED
        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'comprehensive_student_intake_survey')].status").value("COMPLETED"))

        // 8. Resubmitting should return 409 Conflict (Locked)
        mockMvc.perform(
            post("/api/scales/comprehensive_student_intake_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(surveyAnswers)))
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
        // Verify ACL resolves question to canonical scale codes sleep_disorder and demographics_survey
        assertTrue(assessCsvString.contains("sleep_disorder,sleep_1"))
        assertTrue(assessCsvString.contains("demographics_survey,G1"))
        // Must NOT output the composite battery code comprehensive_student_intake_survey in scale_code column
        assertFalse(assessCsvString.contains("comprehensive_student_intake_survey"))
    }

    @Test
    fun `test draft save, retrieve, status IN_PROGRESS, and purge on completion`() {
        val studentNumber = "2026088001"
        val phone = "13800889900"
        val regCode = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = studentNumber)
        val registerReq = RegisterRequest(
            studentNumber = studentNumber,
            fullName = "李寻欢",
            phone = phone,
            password = "securePassword123",
            verificationCode = regCode
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
            put("/api/scales/comprehensive_student_intake_survey/draft")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(draftReq))
        )
            .andExpect(status().isNoContent)

        // 3. Retrieve draft
        mockMvc.perform(
            get("/api/scales/comprehensive_student_intake_survey/draft")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.scaleCode").value("comprehensive_student_intake_survey"))
            .andExpect(jsonPath("$.updatedAt").value(1000L))
            .andExpect(jsonPath("$.answers.G1").value(1))
            .andExpect(jsonPath("$.answers.G4").value(1))

        // 4. Check scale list: comprehensive_student_intake_survey should now have status "IN_PROGRESS" with progress counts
        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'comprehensive_student_intake_survey')].status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$[?(@.code == 'comprehensive_student_intake_survey')].answeredCount").value(2))

        // 5. Complete and submit comprehensive_student_intake_survey
        val surveyDetail = catalogLoader.getScaleDetail("comprehensive_student_intake_survey")!!
        val fullAnswers = surveyDetail.questions.associate { q ->
            val sampleVal: Any = if (q.id == "demo_class") {
                "计算机学院 软件工程"
            } else if (q.id == "demo_id_card") {
                "110101199003072375"
            } else if (q.type == "date" || q.id == "G2") {
                "2004-05-18"
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
            post("/api/scales/comprehensive_student_intake_survey/submit")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitScaleRequest(fullAnswers)))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("COMPLETED"))

        // 6. Draft must now be purged (204 No Content) and status COMPLETED with 100% completion
        mockMvc.perform(
            get("/api/scales/comprehensive_student_intake_survey/draft")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isNoContent)

        mockMvc.perform(
            get("/api/scales")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[?(@.code == 'comprehensive_student_intake_survey')].status").value("COMPLETED"))
            .andExpect(jsonPath("$[?(@.code == 'comprehensive_student_intake_survey')].completionPercentage").value(100))
    }

    @Test
    fun `test international student registration with lowercase l normalizes and allows login`() {
        val rawStudentNumber = "l209220532"
        val phone = "13900112233"
        val regCode = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = rawStudentNumber)
        val registerReq = RegisterRequest(
            studentNumber = rawStudentNumber,
            fullName = "John Doe",
            phone = phone,
            password = "securePassword123",
            verificationCode = regCode
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
                        password = "password123",
                        verificationCode = "123456"
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
                        password = "password123",
                        verificationCode = "123456"
                    )
                ))
        ).andExpect(status().isBadRequest)
    }

    @Test
    fun `test check availability endpoint returns availability status correctly`() {
        val studentNumber = "8209220111"
        val phone = "13911223344"

        // Both available initially
        mockMvc.perform(
            get("/api/auth/check-availability")
                .param("studentNumber", studentNumber)
                .param("phone", phone)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.studentNumberAvailable").value(true))
            .andExpect(jsonPath("$.phoneAvailable").value(true))

        // Register student
        val regCode = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = studentNumber)
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = studentNumber,
                        fullName = "赵云",
                        phone = phone,
                        password = "password123",
                        verificationCode = regCode
                    )
                ))
        ).andExpect(status().isOk)

        // Both taken now
        mockMvc.perform(
            get("/api/auth/check-availability")
                .param("studentNumber", studentNumber)
                .param("phone", phone)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.studentNumberAvailable").value(false))
            .andExpect(jsonPath("$.phoneAvailable").value(false))
            .andExpect(jsonPath("$.message").isNotEmpty)
    }

    @Test
    fun `test send code rejects when student number already registered`() {
        val studentNumber = "8209220222"
        val phone1 = "13922334455"
        val phone2 = "13922334466"

        // Register student with phone1
        val regCode = sendCodeAndGetDevCode(phone = phone1, purpose = "REGISTRATION", studentNumber = studentNumber)
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = studentNumber,
                        fullName = "关羽",
                        phone = phone1,
                        password = "password123",
                        verificationCode = regCode
                    )
                ))
        ).andExpect(status().isOk)

        // Attempt send-code for registration with SAME student number but new phone2
        mockMvc.perform(
            post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    com.medicalsystem.intake.dto.SendCodeRequest(
                        phone = phone2,
                        purpose = "REGISTRATION",
                        studentNumber = studentNumber
                    )
                ))
        )
            .andExpect(status().isConflict)
            .andExpect(jsonPath("$.error").value("该学号已被注册: $studentNumber"))
    }

    @Test
    fun `test send code rejects when phone already registered`() {
        val studentNumber1 = "8209220333"
        val studentNumber2 = "8209220444"
        val phone = "13933445566"

        // Register student 1
        val regCode = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = studentNumber1)
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = studentNumber1,
                        fullName = "刘备",
                        phone = phone,
                        password = "password123",
                        verificationCode = regCode
                    )
                ))
        ).andExpect(status().isOk)

        // Attempt send-code for registration with new student number 2 but SAME phone
        mockMvc.perform(
            post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    com.medicalsystem.intake.dto.SendCodeRequest(
                        phone = phone,
                        purpose = "REGISTRATION",
                        studentNumber = studentNumber2
                    )
                ))
        )
            .andExpect(status().isConflict)
            .andExpect(jsonPath("$.error").value("该手机号码已被注册: $phone"))
    }

    @Test
    fun `test register requires valid verification code and invalidates it upon use`() {
        val studentNumber = "8209220555"
        val phone = "13955667788"
        val code = sendCodeAndGetDevCode(phone = phone, purpose = "REGISTRATION", studentNumber = studentNumber)

        // Attempt register with WRONG code -> 400 Bad Request
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = studentNumber,
                        fullName = "曹操",
                        phone = phone,
                        password = "password123",
                        verificationCode = "000000"
                    )
                ))
        ).andExpect(status().isBadRequest)

        // Register with VALID code -> 200 OK
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = studentNumber,
                        fullName = "曹操",
                        phone = phone,
                        password = "password123",
                        verificationCode = code
                    )
                ))
        ).andExpect(status().isOk)

        // Attempt to replay SAME code for another account -> should fail because code was consumed
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    RegisterRequest(
                        studentNumber = "8209220666",
                        fullName = "曹丕",
                        phone = "13955667799",
                        password = "password123",
                        verificationCode = code
                    )
                ))
        ).andExpect(status().isBadRequest)
    }

    @Test
    fun `test database unique constraint on phone prevents duplicate insertion`() {
        val s1 = com.medicalsystem.intake.entity.IntakeStudentEntity.create(
            studentNumber = com.medicalsystem.intake.model.StudentNumber("8209220777"),
            fullName = com.medicalsystem.intake.model.PersonName("孙权"),
            phone = com.medicalsystem.intake.model.ChineseMobileNumber("13966778899"),
            passwordHash = "hash1"
        )
        studentRepository.saveAndFlush(s1)

        val s2 = com.medicalsystem.intake.entity.IntakeStudentEntity.create(
            studentNumber = com.medicalsystem.intake.model.StudentNumber("8209220888"),
            fullName = com.medicalsystem.intake.model.PersonName("孙策"),
            phone = com.medicalsystem.intake.model.ChineseMobileNumber("13966778899"), // duplicate phone
            passwordHash = "hash2"
        )
        assertThrows(org.springframework.dao.DataAccessException::class.java) {
            studentRepository.saveAndFlush(s2)
        }
    }
}

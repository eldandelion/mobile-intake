package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.time.LocalDateTime

class DemographicsProjectorTest {

    private val scaleCatalogService: ScaleCatalogService = mock()
    private val objectMapper = ObjectMapper()
    private lateinit var projector: DemographicsProjector

    @BeforeEach
    fun setUp() {
        projector = DemographicsProjector(scaleCatalogService, objectMapper)

        // Mock scaleDetail for demographics_survey
        val questions = listOf(
            ScaleQuestion(
                id = "demo_name",
                field = "fullName",
                text = "1. 您的姓名：",
                orderNum = 1,
                type = "text"
            ),
            ScaleQuestion(
                id = "demo_phone",
                field = "phone",
                text = "2. 联系电话：",
                orderNum = 2,
                type = "text"
            ),
            ScaleQuestion(
                id = "demo_class",
                field = "major",
                text = "3. 所在班级与专业：",
                orderNum = 3,
                type = "text"
            ),
            ScaleQuestion(
                id = "G1",
                field = "gender",
                text = "G1. 你出生时的生理性别是：",
                orderNum = 4,
                type = "single_choice",
                options = listOf(
                    ScaleOption(value = 1, label = "男"),
                    ScaleOption(value = 2, label = "女")
                )
            ),
            ScaleQuestion(
                id = "G2",
                field = "age",
                text = "G2. 你的年龄（周岁）：",
                orderNum = 5,
                type = "number"
            ),
            ScaleQuestion(
                id = "G4",
                field = "ethnicity",
                text = "G4. 你的民族：",
                orderNum = 6,
                type = "single_choice",
                options = listOf(
                    ScaleOption(value = 1, label = "汉族"),
                    ScaleOption(value = 2, label = "少数民族")
                )
            ),
            ScaleQuestion(
                id = "G6",
                field = "homeAddress",
                text = "G6. 你的常住地区：",
                orderNum = 7,
                type = "single_choice",
                options = listOf(
                    ScaleOption(value = 1, label = "城市"),
                    ScaleOption(value = 2, label = "农村"),
                    ScaleOption(value = 3, label = "城乡结合部")
                )
            )
        )

        val detail = ScaleDetail(
            code = "demographics_survey",
            title = "个人基本信息核对",
            description = "测试",
            estimatedMinutes = 5,
            questions = questions
        )

        whenever(scaleCatalogService.getScaleDetail("demographics_survey")).thenReturn(detail)
    }

    @Test
    fun `test project resolves choice labels dynamically from catalog for G1 and G4`() {
        val answers = mapOf<String, Any>(
            "G1" to 1,
            "G4" to 1,
            "demo_class" to "计算机学院 软工2601班"
        )
        val completedAt = LocalDateTime.of(2026, 9, 21, 10, 0)
        val dto = projector.project(answers, completedAt)

        assertTrue(dto.isSubmitted)
        assertEquals("男", dto.gender)
        assertEquals("汉族", dto.ethnicity)
        assertEquals("计算机学院 软工2601班", dto.major)
        assertEquals(completedAt.toString(), dto.completedAt)
    }

    @Test
    fun `test project resolves female gender dynamically`() {
        val answers = mapOf<String, Any>(
            "G1" to 2,
            "G4" to 2
        )
        val dto = projector.project(answers)

        assertEquals("女", dto.gender)
        assertEquals("少数民族", dto.ethnicity)
    }

    @Test
    fun `test project extracts birthday from 18-digit ID card`() {
        val answers = mapOf<String, Any>(
            "demo_id_card" to "110101200102051234",
            "G2" to 25
        )
        val dto = projector.project(answers)

        assertEquals("2001-02-05", dto.birthday)
        assertEquals("110101200102051234", dto.idCardNumber)
    }

    @Test
    fun `test project formats age when ID card is not provided`() {
        val answers = mapOf<String, Any>(
            "G2" to 18
        )
        val dto = projector.project(answers)

        assertEquals("18周岁", dto.birthday)
        assertNull(dto.idCardNumber)
    }

    @Test
    fun `test project resolves home address from choice G6 or text`() {
        val answersChoice = mapOf<String, Any>("G6" to 1)
        val dtoChoice = projector.project(answersChoice)
        assertEquals("城市", dtoChoice.homeAddress)

        val answersText = mapOf<String, Any>("demo_home_address" to "湖南省长沙市岳麓区")
        val dtoText = projector.project(answersText)
        assertEquals("湖南省长沙市岳麓区", dtoText.homeAddress)
    }

    @Test
    fun `test project supports legacy field names for backwards compatibility`() {
        val answers = mapOf<String, Any>(
            "demo_gender" to 1,
            "demo_major" to "软件工程",
            "demo_email" to "test@csu.edu.cn",
            "demo_emergency_contact" to "张父",
            "demo_emergency_phone" to "13900000000"
        )
        val dto = projector.project(answers)

        assertEquals("男", dto.gender)
        assertEquals("软件工程", dto.major)
        assertEquals("test@csu.edu.cn", dto.email)
        assertEquals("张父", dto.emergencyContact)
        assertEquals("13900000000", dto.emergencyPhone)
    }

    @Test
    fun `test project returns unsubmitted empty dto when answers are null or empty`() {
        val dtoNull = projector.project(null)
        assertFalse(dtoNull.isSubmitted)
        assertNull(dtoNull.gender)

        val dtoEmptyJson = projector.projectFromJson("")
        assertFalse(dtoEmptyJson.isSubmitted)
    }
}

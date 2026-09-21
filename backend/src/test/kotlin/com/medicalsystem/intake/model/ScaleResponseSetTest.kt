package com.medicalsystem.intake.model

import com.medicalsystem.intake.exception.DomainValidationException
import com.medicalsystem.intake.service.ScaleDetail
import com.medicalsystem.intake.service.ScaleOption
import com.medicalsystem.intake.service.ScaleQuestion
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertTrue

class ScaleResponseSetTest {

    private val testDetail = ScaleDetail(
        code = "test_scale",
        title = "测试量表",
        description = "量表测试说明",
        estimatedMinutes = 2,
        questions = listOf(
            ScaleQuestion(
                id = "q1",
                text = "问题 1 (单选)",
                orderNum = 1,
                type = "single_choice",
                options = listOf(
                    ScaleOption(value = 0, label = "没有"),
                    ScaleOption(value = 1, label = "轻度"),
                    ScaleOption(value = 2, label = "中度"),
                    ScaleOption(value = 3, label = "重度")
                )
            ),
            ScaleQuestion(
                id = "q2_text",
                text = "问题 2 (文本)",
                orderNum = 2,
                type = "text"
            ),
            ScaleQuestion(
                id = "q3_num",
                text = "问题 3 (数值 10-100)",
                orderNum = 3,
                type = "number",
                min = 10.0,
                max = 100.0
            ),
            ScaleQuestion(
                id = "q4_dob",
                text = "问题 4 (出生日期)",
                orderNum = 4,
                type = "date"
            )
        )
    )

    @Test
    fun `valid answers pass validation`() {
        val answers = mapOf(
            "q1" to 1,
            "q2_text" to "测试文本",
            "q3_num" to 50,
            "q4_dob" to "2006-05-18"
        )
        val responseSet = ScaleResponseSet(ScaleCode("test_scale"), answers)
        assertDoesNotThrow { responseSet.validateAgainst(testDetail) }
    }

    @Test
    fun `empty answers map fails instantiation`() {
        assertThrows<DomainValidationException> {
            ScaleResponseSet(ScaleCode("test_scale"), emptyMap())
        }
    }

    @Test
    fun `missing question fails validation`() {
        val answers = mapOf(
            "q1" to 1,
            "q2_text" to "测试文本",
            "q4_dob" to "2006-05-18"
            // q3_num missing
        )
        val responseSet = ScaleResponseSet(ScaleCode("test_scale"), answers)
        val ex = assertThrows<DomainValidationException> { responseSet.validateAgainst(testDetail) }
        assertTrue(ex.message!!.contains("q3_num"))
    }

    @Test
    fun `blank answer fails validation`() {
        val answers = mapOf(
            "q1" to 1,
            "q2_text" to "   ",
            "q3_num" to 50,
            "q4_dob" to "2006-05-18"
        )
        val responseSet = ScaleResponseSet(ScaleCode("test_scale"), answers)
        val ex = assertThrows<DomainValidationException> { responseSet.validateAgainst(testDetail) }
        assertTrue(ex.message!!.contains("q2_text"))
    }

    @Test
    fun `invalid choice option fails validation`() {
        val answers = mapOf(
            "q1" to 99, // Allowed: 0, 1, 2, 3
            "q2_text" to "文本",
            "q3_num" to 50,
            "q4_dob" to "2006-05-18"
        )
        val responseSet = ScaleResponseSet(ScaleCode("test_scale"), answers)
        val ex = assertThrows<DomainValidationException> { responseSet.validateAgainst(testDetail) }
        assertTrue(ex.message!!.contains("Invalid option value"))
    }

    @Test
    fun `numeric value out of bounds fails validation`() {
        // Less than min (10.0)
        val answersLow = mapOf(
            "q1" to 1,
            "q2_text" to "文本",
            "q3_num" to 5,
            "q4_dob" to "2006-05-18"
        )
        val responseSetLow = ScaleResponseSet(ScaleCode("test_scale"), answersLow)
        val exLow = assertThrows<DomainValidationException> { responseSetLow.validateAgainst(testDetail) }
        assertTrue(exLow.message!!.contains("cannot be less than minimum"))

        // Greater than max (100.0)
        val answersHigh = mapOf(
            "q1" to 1,
            "q2_text" to "文本",
            "q3_num" to 150,
            "q4_dob" to "2006-05-18"
        )
        val responseSetHigh = ScaleResponseSet(ScaleCode("test_scale"), answersHigh)
        val exHigh = assertThrows<DomainValidationException> { responseSetHigh.validateAgainst(testDetail) }
        assertTrue(exHigh.message!!.contains("cannot be greater than maximum"))
    }

    @Test
    fun `date question fails validation on invalid calendar date or format`() {
        // Non-leap year Feb 29
        val answersInvalidCal = mapOf(
            "q1" to 1,
            "q2_text" to "文本",
            "q3_num" to 50,
            "q4_dob" to "2003-02-29"
        )
        val responseSetCal = ScaleResponseSet(ScaleCode("test_scale"), answersInvalidCal)
        val exCal = assertThrows<DomainValidationException> { responseSetCal.validateAgainst(testDetail) }
        assertTrue(exCal.message!!.contains("must be a valid birth date"))

        // Malformed string
        val answersMalformed = mapOf(
            "q1" to 1,
            "q2_text" to "文本",
            "q3_num" to 50,
            "q4_dob" to "2006/05/18"
        )
        val responseSetMal = ScaleResponseSet(ScaleCode("test_scale"), answersMalformed)
        val exMal = assertThrows<DomainValidationException> { responseSetMal.validateAgainst(testDetail) }
        assertTrue(exMal.message!!.contains("must be a valid birth date"))
    }

    @Test
    fun `unexpected extraneous question key fails validation`() {
        val answers = mapOf(
            "q1" to 1,
            "q2_text" to "测试文本",
            "q3_num" to 50,
            "q4_dob" to "2006-05-18",
            "hacked_key" to "malicious"
        )
        val responseSet = ScaleResponseSet(ScaleCode("test_scale"), answers)
        val ex = assertThrows<DomainValidationException> { responseSet.validateAgainst(testDetail) }
        assertTrue(ex.message!!.contains("Unexpected question IDs"))
        assertTrue(ex.message!!.contains("hacked_key"))
    }
}

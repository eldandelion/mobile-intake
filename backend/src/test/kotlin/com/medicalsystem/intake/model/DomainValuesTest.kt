package com.medicalsystem.intake.model

import com.medicalsystem.intake.exception.DomainValidationException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class DomainValuesTest {

    // --- StudentNumber Tests ---

    @Test
    fun `StudentNumber accepts valid alphanumeric formats`() {
        assertDoesNotThrow { StudentNumber("2026001") }
        assertDoesNotThrow { StudentNumber("STU123456") }
        assertDoesNotThrow { StudentNumber("abcd") }
        assertDoesNotThrow { StudentNumber("12345678901234567890") } // 20 chars

        val sn = StudentNumber("  stu2026001  ")
        assertEquals("STU2026001", sn.normalized())
    }

    @Test
    fun `StudentNumber rejects too short or too long strings`() {
        assertThrows<DomainValidationException> { StudentNumber("123") } // 3 chars
        assertThrows<DomainValidationException> { StudentNumber("123456789012345678901") } // 21 chars
    }

    @Test
    fun `StudentNumber rejects special characters and whitespace inside`() {
        assertThrows<DomainValidationException> { StudentNumber("stu 01") }
        assertThrows<DomainValidationException> { StudentNumber("stu-01") }
        assertThrows<DomainValidationException> { StudentNumber("stu_01") }
        assertThrows<DomainValidationException> { StudentNumber("2026@001") }
    }

    @Test
    fun `StudentNumber rejects formula injection prefixes`() {
        assertThrows<DomainValidationException> { StudentNumber("=cmd|' /C calc'!A0") }
        assertThrows<DomainValidationException> { StudentNumber("+123456") }
        assertThrows<DomainValidationException> { StudentNumber("-123456") }
        assertThrows<DomainValidationException> { StudentNumber("@SUM(A1:A10)") }
        assertFalse(StudentNumber.isValid("=cmd"))
    }

    // --- ChineseMobileNumber Tests ---

    @Test
    fun `ChineseMobileNumber accepts valid 11-digit mobile numbers`() {
        assertDoesNotThrow { ChineseMobileNumber("13800138000") }
        assertDoesNotThrow { ChineseMobileNumber("15912345678") }
        assertDoesNotThrow { ChineseMobileNumber("18688889999") }
        assertDoesNotThrow { ChineseMobileNumber("19900001111") }

        val mobile = ChineseMobileNumber(" 13812345678 ")
        assertEquals("13812345678", mobile.normalized())
    }

    @Test
    fun `ChineseMobileNumber rejects invalid numbers`() {
        assertThrows<DomainValidationException> { ChineseMobileNumber("12800138000") } // starts with 12
        assertThrows<DomainValidationException> { ChineseMobileNumber("1380013800") } // 10 digits
        assertThrows<DomainValidationException> { ChineseMobileNumber("138001380000") } // 12 digits
        assertThrows<DomainValidationException> { ChineseMobileNumber("1380013800a") } // contains letter
        assertFalse(ChineseMobileNumber.isValid("10086"))
    }

    // --- PersonName Tests ---

    @Test
    fun `PersonName accepts valid Chinese and Latin names`() {
        assertDoesNotThrow { PersonName("赵子轩") }
        assertDoesNotThrow { PersonName("买买提·阿不都拉") }
        assertDoesNotThrow { PersonName("John Doe") }
        assertDoesNotThrow { PersonName("Mary Jane-Watson") }
    }

    @Test
    fun `PersonName rejects invalid names`() {
        assertThrows<DomainValidationException> { PersonName("a") } // 1 char
        assertThrows<DomainValidationException> { PersonName("123456") } // numbers
        assertThrows<DomainValidationException> { PersonName("<script>alert(1)</script>") }
        assertFalse(PersonName.isValid("!@#$%"))
    }

    // --- IdCardNumber Tests ---

    @Test
    fun `IdCardNumber validates correct GB 11643-1999 checksum and extracts data`() {
        // Known valid test ID cards with ISO 7064 MOD 11-2 check codes:
        // 110101199003072375: 1990-03-07, seq 237 (odd -> male), check code 5
        val id1 = IdCardNumber("110101199003072375")
        assertEquals(LocalDate.of(1990, 3, 7), id1.birthDate())
        assertEquals("男", id1.gender())

        // 11010519491231002X: 1949-12-31, seq 002 (even -> female), check code X
        val id2 = IdCardNumber("11010519491231002x")
        assertEquals("11010519491231002X", id2.normalized())
        assertEquals(LocalDate.of(1949, 12, 31), id2.birthDate())
        assertEquals("女", id2.gender())
    }

    @Test
    fun `IdCardNumber rejects wrong checksum and invalid calendar dates`() {
        // Wrong check code (should be 5, changed to 9)
        assertThrows<DomainValidationException> { IdCardNumber("110101199003072379") }
        assertFalse(IdCardNumber.isValid("110101199003072379"))

        // Invalid birthdate (February 31)
        assertThrows<DomainValidationException> { IdCardNumber("110101199002312378") }
        assertFalse(IdCardNumber.isValid("110101199002312378"))

        // Invalid length
        assertThrows<DomainValidationException> { IdCardNumber("123456") }
    }

    // --- ScaleCode Tests ---

    @Test
    fun `ScaleCode accepts valid codes and preserves casing`() {
        val sc = ScaleCode("  PHQ_9  ")
        assertEquals("PHQ_9", sc.normalized())
        assertDoesNotThrow { ScaleCode("demographics_survey") }
        assertDoesNotThrow { ScaleCode("scl_90") }
    }

    @Test
    fun `ScaleCode rejects invalid codes`() {
        assertThrows<DomainValidationException> { ScaleCode("ab") } // too short
        assertThrows<DomainValidationException> { ScaleCode("phq-9") } // hyphens not allowed
        assertThrows<DomainValidationException> { ScaleCode("phq 9") } // space not allowed
    }

    // --- ScaleStatus Tests ---

    @Test
    fun `ScaleStatus fromCode parses correctly and rejects unknown`() {
        assertEquals(ScaleStatus.COMPLETED, ScaleStatus.fromCode("COMPLETED"))
        assertEquals(ScaleStatus.IN_PROGRESS, ScaleStatus.fromCode("in_progress"))
        assertEquals(ScaleStatus.NOT_STARTED, ScaleStatus.fromCode("NOT_STARTED"))
        assertThrows<DomainValidationException> { ScaleStatus.fromCode("BOGUS_STATUS") }
    }
}

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
    fun `StudentNumber accepts valid institutional formats`() {
        // 10-digit domestic undergraduate
        assertDoesNotThrow { StudentNumber("8209220532") }
        assertDoesNotThrow { StudentNumber("2026001001") }
        assertTrue(StudentNumber.isValid("8209220532"))

        // 9-digit domestic postgraduate
        assertDoesNotThrow { StudentNumber("264718003") }
        assertDoesNotThrow { StudentNumber("202600101") }
        assertTrue(StudentNumber.isValid("264718003"))

        // 10-character international student (L or l followed by 9 digits)
        assertDoesNotThrow { StudentNumber("L209220532") }
        assertDoesNotThrow { StudentNumber("l209220532") }
        assertTrue(StudentNumber.isValid("L209220532"))
        assertTrue(StudentNumber.isValid("l209220532"))

        // Normalization and whitespace trimming
        val snUndergrad = StudentNumber("  8209220532  ")
        assertEquals("8209220532", snUndergrad.normalized())

        val snInternational = StudentNumber("  l209220532  ")
        assertEquals("L209220532", snInternational.normalized())
    }

    @Test
    fun `StudentNumber rejects leading zero`() {
        assertThrows<DomainValidationException> { StudentNumber("0209220532") }
        assertThrows<DomainValidationException> { StudentNumber("026471800") }
        assertThrows<DomainValidationException> { StudentNumber("L009220532") }
        assertFalse(StudentNumber.isValid("0209220532"))
        assertFalse(StudentNumber.isValid("026471800"))
        assertFalse(StudentNumber.isValid("L009220532"))
    }

    @Test
    fun `StudentNumber rejects degenerate uniform digit repetitions`() {
        assertThrows<DomainValidationException> { StudentNumber("9999999999") }
        assertThrows<DomainValidationException> { StudentNumber("111111111") }
        assertThrows<DomainValidationException> { StudentNumber("L999999999") }
        assertThrows<DomainValidationException> { StudentNumber("L111111111") }
        assertFalse(StudentNumber.isValid("9999999999"))
        assertFalse(StudentNumber.isValid("111111111"))
        assertFalse(StudentNumber.isValid("L999999999"))
        assertFalse(StudentNumber.isValid("L111111111"))
    }

    @Test
    fun `StudentNumber rejects invalid lengths and invalid characters`() {
        assertThrows<DomainValidationException> { StudentNumber("123") } // 3 chars
        assertThrows<DomainValidationException> { StudentNumber("2026001") } // 7 chars
        assertThrows<DomainValidationException> { StudentNumber("12345678") } // 8 chars
        assertThrows<DomainValidationException> { StudentNumber("12345678901") } // 11 chars
        assertThrows<DomainValidationException> { StudentNumber("M209220532") } // Only 'L' allowed
        assertThrows<DomainValidationException> { StudentNumber("STU123456") }
        assertThrows<DomainValidationException> { StudentNumber("8209 22053") }
        assertThrows<DomainValidationException> { StudentNumber("8209-22053") }
        assertFalse(StudentNumber.isValid("2026001"))
        assertFalse(StudentNumber.isValid("M209220532"))
    }

    @Test
    fun `StudentNumber rejects formula injection prefixes`() {
        assertThrows<DomainValidationException> { StudentNumber("=8209220532") }
        assertThrows<DomainValidationException> { StudentNumber("+8209220532") }
        assertThrows<DomainValidationException> { StudentNumber("-8209220532") }
        assertThrows<DomainValidationException> { StudentNumber("@8209220532") }
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

    // --- BirthDate Tests ---

    @Test
    fun `BirthDate accepts valid calendar dates within age bounds`() {
        val today = LocalDate.now()
        val validDateUndergrad = "${today.year - 18}-05-18"
        assertDoesNotThrow { BirthDate(validDateUndergrad) }
        assertTrue(BirthDate.isValid(validDateUndergrad))

        // Leap year 2004-02-29 (age 22 in 2026)
        assertDoesNotThrow { BirthDate("2004-02-29") }
        assertTrue(BirthDate.isValid("2004-02-29"))

        // Centurial leap year 2000-02-29
        assertDoesNotThrow { BirthDate("2000-02-29") }
        assertTrue(BirthDate.isValid("2000-02-29"))

        val bd = BirthDate("  2004-02-29  ")
        assertEquals("2004-02-29", bd.normalized())
        assertEquals(LocalDate.of(2004, 2, 29), bd.toLocalDate())
    }

    @Test
    fun `BirthDate rejects invalid calendar dates`() {
        // Non-leap year Feb 29
        assertThrows<DomainValidationException> { BirthDate("2003-02-29") }
        assertFalse(BirthDate.isValid("2003-02-29"))

        // 1900 is not a leap year
        assertThrows<DomainValidationException> { BirthDate("1900-02-29") }
        assertFalse(BirthDate.isValid("1900-02-29"))

        // April has only 30 days
        assertThrows<DomainValidationException> { BirthDate("2004-04-31") }
        assertFalse(BirthDate.isValid("2004-04-31"))

        // Invalid month 13
        assertThrows<DomainValidationException> { BirthDate("2004-13-10") }
        assertFalse(BirthDate.isValid("2004-13-10"))

        // Day 00
        assertThrows<DomainValidationException> { BirthDate("2004-05-00") }
        assertFalse(BirthDate.isValid("2004-05-00"))
    }

    @Test
    fun `BirthDate rejects out-of-bounds age and future dates`() {
        val today = LocalDate.now()

        // Future date
        val futureDate = today.plusDays(1).toString()
        assertFalse(BirthDate.isValid(futureDate))

        // Under minimum age (e.g. 10 years old)
        val underage = "${today.year - 10}-01-01"
        assertThrows<DomainValidationException> { BirthDate(underage) }
        assertFalse(BirthDate.isValid(underage))

        // Over maximum age (e.g. 80 years old)
        val overage = "${today.year - 80}-01-01"
        assertThrows<DomainValidationException> { BirthDate(overage) }
        assertFalse(BirthDate.isValid(overage))

        // Malformed format
        assertThrows<DomainValidationException> { BirthDate("2004/05/18") }
        assertThrows<DomainValidationException> { BirthDate("not-a-date") }
        assertFalse(BirthDate.isValid("2004/05/18"))
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

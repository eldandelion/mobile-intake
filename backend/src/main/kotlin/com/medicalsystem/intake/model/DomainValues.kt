package com.medicalsystem.intake.model

import com.medicalsystem.intake.exception.DomainValidationException
import java.time.LocalDate
import java.time.Period

/**
 * Value Object representing an institutional Student Number.
 * Valid formats:
 * - Domestic Undergraduate: 10 digits starting with 1-9 (e.g. 8209220532)
 * - Domestic Postgraduate: 9 digits starting with 1-9 (e.g. 264718003)
 * - International Student: 'L' or 'l' followed by 9 digits starting with 1-9 (e.g. L209220532)
 * Anti-degeneracy: cannot have all identical digits (e.g. 9999999999, L999999999).
 * Protects against formula injection prefixes in CSV exports.
 */
@JvmInline
value class StudentNumber(val value: String) {
    companion object {
        private val PATTERN = Regex("^([1-9]\\d{8,9}|[Ll][1-9]\\d{8})$")
        private val INJECTION_PREFIXES = charArrayOf('=', '+', '-', '@', '\t', '\r')

        fun isValid(raw: String?): Boolean {
            if (raw == null) return false
            val trimmed = raw.trim()
            if (INJECTION_PREFIXES.any { trimmed.startsWith(it) }) return false
            if (!PATTERN.matches(trimmed)) return false
            val digits = trimmed.filter { it.isDigit() }
            if (digits.toSet().size <= 1) return false
            return true
        }
    }

    init {
        val trimmed = value.trim()
        if (INJECTION_PREFIXES.any { trimmed.startsWith(it) }) {
            throw DomainValidationException("Student number cannot start with formula characters: '$value'")
        }
        if (!PATTERN.matches(trimmed)) {
            throw DomainValidationException("Student number must be 10 digits for undergrad, 9 digits for postgrad, or 'L' + 9 digits for international students, with non-zero leading digit; received: '$value'")
        }
        val digits = trimmed.filter { it.isDigit() }
        if (digits.toSet().size <= 1) {
            throw DomainValidationException("Student number cannot have all identical digits: '$value'")
        }
    }

    fun normalized(): String = value.trim().uppercase()
}

/**
 * Value Object representing an 11-digit Chinese mobile phone number.
 */
@JvmInline
value class ChineseMobileNumber(val value: String) {
    companion object {
        private val PATTERN = Regex("^1[3-9]\\d{9}$")

        fun isValid(raw: String?): Boolean {
            return raw != null && PATTERN.matches(raw.trim())
        }
    }

    init {
        val trimmed = value.trim()
        if (!PATTERN.matches(trimmed)) {
            throw DomainValidationException("Invalid Chinese mobile phone number: '$value'")
        }
    }

    fun normalized(): String = value.trim()
}

/**
 * Value Object representing a person's display name (2-64 characters).
 * Supports standard Chinese names (with minority middle dot '·' or '•') and Latin names.
 */
@JvmInline
value class PersonName(val value: String) {
    companion object {
        private val CHINESE_NAME_PATTERN = Regex("^[\\u4e00-\\u9fa5·•]{2,32}$")
        private val LATIN_NAME_PATTERN = Regex("^[A-Za-z\\s.'\\-]{2,64}$")

        fun isValid(raw: String?): Boolean {
            if (raw == null) return false
            val trimmed = raw.trim()
            if (trimmed.length !in 2..64) return false
            return CHINESE_NAME_PATTERN.matches(trimmed) || LATIN_NAME_PATTERN.matches(trimmed)
        }
    }

    init {
        val trimmed = value.trim()
        if (trimmed.length !in 2..64) {
            throw DomainValidationException("Name must be between 2 and 64 characters: '$value'")
        }
        if (!CHINESE_NAME_PATTERN.matches(trimmed) && !LATIN_NAME_PATTERN.matches(trimmed)) {
            throw DomainValidationException("Name contains invalid characters: '$value'")
        }
    }

    fun normalized(): String = value.trim()
}

/**
 * Value Object representing an 18-digit Chinese National ID Card (GB 11643-1999)
 * with full ISO 7064:1983.MOD 11-2 check code validation.
 */
@JvmInline
value class IdCardNumber(val value: String) {
    companion object {
        private val WEIGHTS = intArrayOf(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2)
        private val CHECK_CODES = charArrayOf('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2')
        private val PATTERN = Regex("^(\\d{6})(19|20)(\\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])(\\d{3})([0-9Xx])$")

        fun isValid(raw: String?): Boolean {
            if (raw == null) return false
            val trimmed = raw.trim().uppercase()
            val match = PATTERN.matchEntire(trimmed) ?: return false

            val year = "${match.groupValues[2]}${match.groupValues[3]}".toInt()
            val month = match.groupValues[4].toInt()
            val day = match.groupValues[5].toInt()

            try {
                LocalDate.of(year, month, day)
            } catch (_: Exception) {
                return false
            }

            var sum = 0
            for (i in 0 until 17) {
                sum += (trimmed[i] - '0') * WEIGHTS[i]
            }
            val expectedCheckCode = CHECK_CODES[sum % 11]
            return trimmed[17] == expectedCheckCode
        }
    }

    init {
        if (!isValid(value)) {
            throw DomainValidationException("Invalid Chinese National ID card number: '$value'")
        }
    }

    fun normalized(): String = value.trim().uppercase()

    fun birthDate(): LocalDate {
        val upper = normalized()
        val year = upper.substring(6, 10).toInt()
        val month = upper.substring(10, 12).toInt()
        val day = upper.substring(12, 14).toInt()
        return LocalDate.of(year, month, day)
    }

    fun gender(): String {
        val upper = normalized()
        val seq = upper.substring(14, 17).toInt()
        return if (seq % 2 == 1) "男" else "女"
    }
}

/**
 * Value Object representing a person's birth date (ISO-8601 YYYY-MM-DD).
 * Enforces calendar validity (leap years) and university intake age bounds (14 to 70 years old).
 */
@JvmInline
value class BirthDate(val value: String) {
    companion object {
        const val MIN_STUDENT_AGE = 14
        const val MAX_STUDENT_AGE = 70
        private val PATTERN = Regex("""^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$""")

        fun isValid(raw: String?, minAge: Int = MIN_STUDENT_AGE, maxAge: Int = MAX_STUDENT_AGE): Boolean {
            if (raw == null) return false
            val trimmed = raw.trim()
            val match = PATTERN.matchEntire(trimmed) ?: return false
            val year = match.groupValues[1].toInt()
            val month = match.groupValues[2].toInt()
            val day = match.groupValues[3].toInt()

            val date = try {
                LocalDate.of(year, month, day)
            } catch (_: Exception) {
                return false
            }

            val today = LocalDate.now()
            if (date.isAfter(today)) return false

            val age = Period.between(date, today).years
            return age in minAge..maxAge
        }
    }

    init {
        if (!isValid(value)) {
            throw DomainValidationException("Invalid birth date: '$value'. Must be valid calendar YYYY-MM-DD within age $MIN_STUDENT_AGE-$MAX_STUDENT_AGE.")
        }
    }

    fun toLocalDate(): LocalDate = LocalDate.parse(value.trim())
    fun normalized(): String = value.trim()
}

/**
 * Value Object representing a canonical scale code (e.g. "phq_9", "demographics_survey").
 */
@JvmInline
value class ScaleCode(val value: String) {
    companion object {
        private val PATTERN = Regex("^[A-Za-z0-9_]{3,64}$")

        fun isValid(raw: String?): Boolean {
            return raw != null && PATTERN.matches(raw.trim())
        }
    }

    init {
        val trimmed = value.trim()
        if (!PATTERN.matches(trimmed)) {
            throw DomainValidationException("Invalid scale code: '$value'")
        }
    }

    fun normalized(): String = value.trim()
}

/**
 * Domain Enum for Scale Status.
 */
enum class ScaleStatus(val code: String) {
    NOT_STARTED("NOT_STARTED"),
    IN_PROGRESS("IN_PROGRESS"),
    COMPLETED("COMPLETED");

    companion object {
        fun fromCode(code: String): ScaleStatus =
            entries.find { it.code.equals(code, ignoreCase = true) }
                ?: throw DomainValidationException("Unknown scale status: $code")
    }
}

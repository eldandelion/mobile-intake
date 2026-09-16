package com.medicalsystem.intake.model

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class ScaleProgressTest {

    @Test
    fun `test invariants throw on negative numbers`() {
        assertThrows(IllegalArgumentException::class.java) {
            ScaleProgress(-1, 10)
        }
        assertThrows(IllegalArgumentException::class.java) {
            ScaleProgress(5, -1)
        }
    }

    @Test
    fun `test percentage calculation and edge cases`() {
        // Zero total questions (division-by-zero protection)
        val zeroTotal = ScaleProgress(0, 0)
        assertEquals(0, zeroTotal.completionPercentage)

        // Zero answered
        val notStarted = ScaleProgress(0, 9)
        assertEquals(0, notStarted.completionPercentage)

        // Partial progress: 3 / 9 = 33%
        val partial = ScaleProgress(3, 9)
        assertEquals(33, partial.completionPercentage)

        // Partial progress: 1 / 3 = 33%
        val partialThird = ScaleProgress(1, 3)
        assertEquals(33, partialThird.completionPercentage)

        // Partial progress: 2 / 3 = 66%
        val partialTwoThird = ScaleProgress(2, 3)
        assertEquals(66, partialTwoThird.completionPercentage)

        // Fully completed
        val completed = ScaleProgress(9, 9)
        assertEquals(100, completed.completionPercentage)

        // Upper clamp protection
        val clamped = ScaleProgress(12, 10)
        assertEquals(100, clamped.completionPercentage)
    }

    @Test
    fun `test fromAnswers handles valid and invalid answers correctly`() {
        val validQuestionIds = setOf("q1", "q2", "q3", "q4", "q5", "q6")
        val answers = mapOf(
            "q1" to 0,            // Valid integer 0 Likert answer
            "q2" to "3",          // Valid string answer
            "q3" to "",           // Empty string - should not count
            "q4" to "   ",        // Whitespace string - should not count
            "q5" to null as Any?, // Null - should not count
            "unknown_q" to 4      // Not in validQuestionIds - should not count
        ).filterValues { it != null } as Map<String, Any>

        val progress = ScaleProgress.fromAnswers(validQuestionIds, answers)

        // Only q1 and q2 are valid answered questions
        assertEquals(2, progress.answeredCount)
        assertEquals(6, progress.totalCount)
        assertEquals(33, progress.completionPercentage)
    }

    @Test
    fun `test factory methods zero and completed`() {
        val zero = ScaleProgress.zero(10)
        assertEquals(0, zero.answeredCount)
        assertEquals(10, zero.totalCount)
        assertEquals(0, zero.completionPercentage)

        val completed = ScaleProgress.completed(10)
        assertEquals(10, completed.answeredCount)
        assertEquals(10, completed.totalCount)
        assertEquals(100, completed.completionPercentage)
    }
}

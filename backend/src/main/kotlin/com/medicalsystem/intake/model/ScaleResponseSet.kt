package com.medicalsystem.intake.model

import com.medicalsystem.intake.exception.DomainValidationException
import com.medicalsystem.intake.service.ScaleDetail

/**
 * Domain Value Object representing a validated set of answers for a psychological or demographic scale.
 * Enforces:
 * 1. Completeness: all required questions answered.
 * 2. Whitelisting: rejects unexpected or hallucinated question IDs.
 * 3. Option Invariants: selected option values must belong to the catalog choice set.
 * 4. Numeric & Slider Bounds: numeric responses must respect min and max constraints.
 */
data class ScaleResponseSet(
    val scaleCode: ScaleCode,
    val answers: Map<String, Any>
) {
    init {
        if (answers.isEmpty()) {
            throw DomainValidationException("Answers map cannot be empty")
        }
    }

    fun validateAgainst(detail: ScaleDetail) {
        val validQuestionIds = detail.questions.map { it.id }.toSet()

        // 1. Invariant: Whitelist question IDs - reject unknown/hallucinated keys
        val extraneousKeys = answers.keys - validQuestionIds
        if (extraneousKeys.isNotEmpty()) {
            throw DomainValidationException("Unexpected question IDs submitted for scale '${detail.code}': $extraneousKeys")
        }

        // 2. Invariant: Check completeness and individual question validity
        for (q in detail.questions) {
            val rawAnswer = answers[q.id]
                ?: throw DomainValidationException("Missing answer for question: ${q.id}")

            if (rawAnswer.toString().isBlank()) {
                throw DomainValidationException("Answer cannot be blank for question: ${q.id}")
            }

            // 3. Choice Options Invariant
            if (q.options.isNotEmpty()) {
                val allowedValues = q.options.map { it.value.toString() }.toSet()
                when (rawAnswer) {
                    is Collection<*> -> {
                        if (rawAnswer.isEmpty()) {
                            throw DomainValidationException("At least one option must be selected for question: ${q.id}")
                        }
                        for (item in rawAnswer) {
                            val itemVal = if (item is Map<*, *>) item["value"] else item
                            if (!allowedValues.contains(itemVal?.toString())) {
                                throw DomainValidationException("Invalid option value '$itemVal' for question: ${q.id}")
                            }
                        }
                    }
                    is Map<*, *> -> {
                        val valPart = rawAnswer["value"]?.toString() ?: rawAnswer.toString()
                        if (!allowedValues.contains(valPart)) {
                            throw DomainValidationException("Invalid option value '$valPart' for question: ${q.id}")
                        }
                    }
                    else -> {
                        if (!allowedValues.contains(rawAnswer.toString())) {
                            throw DomainValidationException("Invalid option value '$rawAnswer' for question: ${q.id}")
                        }
                    }
                }
            }

            // 4. Numeric & Slider Bounds Invariant
            if (q.type == "number" || q.type == "slider" || q.min != null || q.max != null) {
                val numVal = rawAnswer.toString().toDoubleOrNull()
                    ?: throw DomainValidationException("Answer for question '${q.id}' must be a valid number, received: '$rawAnswer'")

                q.min?.let { min ->
                    if (numVal < min) {
                        throw DomainValidationException("Answer for question '${q.id}' ($numVal) cannot be less than minimum allowed ($min)")
                    }
                }
                q.max?.let { max ->
                    if (numVal > max) {
                        throw DomainValidationException("Answer for question '${q.id}' ($numVal) cannot be greater than maximum allowed ($max)")
                    }
                }
            }

            // 5. Date of Birth Invariant
            if (q.type == "date") {
                val dateStr = rawAnswer.toString().trim()
                if (!BirthDate.isValid(dateStr)) {
                    throw DomainValidationException("Answer for question '${q.id}' must be a valid birth date (YYYY-MM-DD within age 14-70), received: '$rawAnswer'")
                }
            }
        }
    }
}

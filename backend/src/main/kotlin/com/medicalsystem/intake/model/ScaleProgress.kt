package com.medicalsystem.intake.model

data class ScaleProgress(
    val answeredCount: Int,
    val totalCount: Int
) {
    init {
        require(answeredCount >= 0) { "Answered count cannot be negative: $answeredCount" }
        require(totalCount >= 0) { "Total count cannot be negative: $totalCount" }
    }

    val completionPercentage: Int =
        if (totalCount <= 0) 0 else ((answeredCount.toDouble() / totalCount) * 100).toInt().coerceIn(0, 100)

    companion object {
        fun zero(totalCount: Int) = ScaleProgress(0, totalCount)
        fun completed(totalCount: Int) = ScaleProgress(totalCount, totalCount)

        fun fromAnswers(validQuestionIds: Set<String>, answers: Map<String, Any>): ScaleProgress {
            val validAnswered = answers.entries.count { (qid, value) ->
                validQuestionIds.contains(qid) && when (value) {
                    is String -> value.isNotBlank()
                    null -> false
                    else -> true
                }
            }
            return ScaleProgress(
                answeredCount = validAnswered.coerceAtMost(validQuestionIds.size),
                totalCount = validQuestionIds.size
            )
        }
    }
}

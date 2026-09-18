package com.medicalsystem.intake.service

data class ScaleOption(
    val value: Any,
    val label: String,
    val hasTextInput: Boolean = false,
    val textInputPlaceholder: String? = null,
    val textInputLabel: String? = null
)

data class ScaleQuestion(
    val id: String,
    val text: String,
    val orderNum: Int,
    val type: String = "single_choice",
    val placeholder: String? = null,
    val min: Double? = null,
    val max: Double? = null,
    val step: Double? = null,
    val unit: String? = null,
    val minLabel: String? = null,
    val maxLabel: String? = null,
    val options: List<ScaleOption> = emptyList(),
    val sectionCode: String? = null,
    val sectionTitle: String? = null
)

data class BatterySection(
    val code: String,
    val title: String,
    val questionCount: Int,
    val orderNum: Int
)

data class ScaleIntroItem(
    val icon: String = "assignment",
    val title: String,
    val description: String
)

data class ScaleDetail(
    val code: String,
    val title: String,
    val subtitle: String? = null,
    val description: String,
    val estimatedMinutes: Int,
    val instructions: String? = null,
    val introItems: List<ScaleIntroItem> = emptyList(),
    val questions: List<ScaleQuestion>,
    val sections: List<BatterySection> = emptyList()
)

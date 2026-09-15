package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.dto.ScaleSummaryDto
import com.medicalsystem.intake.exception.NotFoundException
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import jakarta.annotation.PostConstruct
import org.springframework.core.io.ResourceLoader
import org.springframework.stereotype.Service
import java.io.InputStream

data class ScaleOption(val value: Any, val label: String)

data class ScaleQuestion(
    val id: String,
    val text: String,
    val orderNum: Int,
    val type: String = "single_choice",
    val placeholder: String? = null,
    val options: List<ScaleOption> = emptyList()
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
    val questions: List<ScaleQuestion>
)

@Service
class ScaleCatalogService(
    private val resourceLoader: ResourceLoader,
    private val objectMapper: ObjectMapper,
    private val submissionRepository: ScaleSubmissionRepository
) {
    private val optionGroups = mutableMapOf<String, List<ScaleOption>>()
    private val scaleDetails = linkedMapOf<String, ScaleDetail>()

    private val supportedScaleCodes = listOf("demographics_survey", "phq_9", "gad_7", "scl_90")

    @PostConstruct
    fun init() {
        loadOptionGroups()
        for (code in supportedScaleCodes) {
            loadScale(code)
        }
    }

    private fun loadOptionGroups() {
        try {
            val resource = resourceLoader.getResource("classpath:assessments/shared_option_groups.json")
            if (resource.exists()) {
                val root: JsonNode = objectMapper.readTree(resource.inputStream)
                for (groupNode in root) {
                    val name = groupNode.get("name").asText()
                    val optionsList = mutableListOf<ScaleOption>()
                    val optionsArray = groupNode.get("options")
                    if (optionsArray != null && optionsArray.isArray) {
                        for (opt in optionsArray) {
                            val valueNode = opt.get("value")
                            val valObj: Any = if (valueNode.isInt) valueNode.asInt() else valueNode.asText()
                            val label = opt.get("label").asText()
                            optionsList.add(ScaleOption(value = valObj, label = label))
                        }
                    }
                    optionGroups[name] = optionsList
                }
            }
        } catch (e: Exception) {
            // fallback if not available
        }
    }

    private fun loadScale(code: String) {
        val resource = resourceLoader.getResource("classpath:assessments/$code.json")
        if (!resource.exists()) return

        resource.inputStream.use { input ->
            val root: JsonNode = objectMapper.readTree(input)
            val scaleCode = root.get("code")?.asText() ?: root.get("id")?.asText() ?: code
            val title = root.get("title")?.asText() ?: scaleCode
            val subtitle = root.get("subtitle")?.asText()
            val description = root.get("description")?.asText() ?: ""
            val estimatedMinutes = root.get("estimatedMinutes")?.asInt() ?: 3

            val questionList = mutableListOf<ScaleQuestion>()

            // If sections exist (like demographics_survey)
            if (root.has("sections")) {
                var order = 1
                for (section in root.get("sections")) {
                    for (q in section.get("questions")) {
                        questionList.add(parseQuestion(q, order++))
                    }
                }
            } else if (root.has("questions")) {
                var order = 1
                for (q in root.get("questions")) {
                    questionList.add(parseQuestion(q, order++))
                }
            }

            val instructions = root.get("instructions")?.asText() ?: description

            val introItemsList = mutableListOf<ScaleIntroItem>()
            if (root.has("introItems") && root.get("introItems").isArray) {
                for (itemNode in root.get("introItems")) {
                    val icon = itemNode.get("icon")?.asText() ?: "assignment"
                    val itemTitle = itemNode.get("title")?.asText() ?: ""
                    val itemDesc = itemNode.get("description")?.asText() ?: ""
                    if (itemTitle.isNotBlank()) {
                        introItemsList.add(ScaleIntroItem(icon, itemTitle, itemDesc))
                    }
                }
            }

            if (introItemsList.isEmpty()) {
                introItemsList.add(
                    ScaleIntroItem(
                        icon = "assignment",
                        title = "评估内容",
                        description = "本评估共包含 ${questionList.size} 道题目，预计用时约 $estimatedMinutes 分钟。$description"
                    )
                )
                introItemsList.add(
                    ScaleIntroItem(
                        icon = "volunteer_activism",
                        title = "客观作答",
                        description = "所有问题的答案没有对错之分，您的第一反应往往最准确，请按照您的实际感受放心填写。"
                    )
                )
                introItemsList.add(
                    ScaleIntroItem(
                        icon = "lock",
                        title = "隐私保密",
                        description = "您的个人信息及答题数据将被严格加密保密，仅用于高校新生心理健康筛查与支持，请您安心作答。"
                    )
                )
            }

            scaleDetails[scaleCode] = ScaleDetail(
                code = scaleCode,
                title = title,
                subtitle = subtitle,
                description = description,
                estimatedMinutes = estimatedMinutes,
                instructions = instructions,
                introItems = introItemsList,
                questions = questionList
            )
        }
    }

    private fun parseQuestion(qNode: JsonNode, fallbackOrder: Int): ScaleQuestion {
        val qId = qNode.get("id")?.asText() ?: qNode.get("code")?.asText() ?: "q_$fallbackOrder"
        val text = qNode.get("text")?.asText() ?: ""
        val orderNum = qNode.get("orderNum")?.asInt() ?: fallbackOrder
        val type = qNode.get("type")?.asText() ?: "single_choice"
        val placeholder = qNode.get("placeholder")?.asText()

        val options = mutableListOf<ScaleOption>()
        if (qNode.has("optionGroupName")) {
            val groupName = qNode.get("optionGroupName").asText()
            options.addAll(optionGroups[groupName] ?: emptyList())
        } else if (qNode.has("options")) {
            for (opt in qNode.get("options")) {
                val valueNode = opt.get("value")
                val valObj: Any = if (valueNode.isInt) valueNode.asInt() else valueNode.asText()
                val label = opt.get("label").asText()
                options.add(ScaleOption(valObj, label))
            }
        }

        return ScaleQuestion(
            id = qId,
            text = text,
            orderNum = orderNum,
            type = type,
            placeholder = placeholder,
            options = options
        )
    }

    fun getScaleSummaries(studentNumber: String): List<ScaleSummaryDto> {
        val completedCodes = submissionRepository.findByStudentNumber(studentNumber)
            .map { it.scaleCode }
            .toSet()

        return scaleDetails.values.map { detail ->
            ScaleSummaryDto(
                code = detail.code,
                title = detail.title,
                subtitle = detail.subtitle,
                description = detail.description,
                questionCount = detail.questions.size,
                estimatedMinutes = detail.estimatedMinutes,
                status = if (completedCodes.contains(detail.code)) "COMPLETED" else "NOT_STARTED"
            )
        }
    }

    fun getScaleDetail(code: String): ScaleDetail {
        return scaleDetails[code] ?: throw NotFoundException("Scale not found with code: $code")
    }

    fun getScaleCodes(): List<String> = scaleDetails.keys.toList()
}

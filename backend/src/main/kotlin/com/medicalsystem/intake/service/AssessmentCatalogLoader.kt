package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.exception.AssessmentCatalogInitializationException
import jakarta.annotation.PostConstruct
import org.springframework.core.io.ResourceLoader
import org.springframework.stereotype.Component
import java.util.Collections

@Component
class AssessmentCatalogLoader(
    private val resourceLoader: ResourceLoader,
    private val objectMapper: ObjectMapper
) {
    private val optionGroups = mutableMapOf<String, List<ScaleOption>>()
    private val scaleDetailsMap = LinkedHashMap<String, ScaleDetail>()
    private val questionToScaleMap = HashMap<String, String>()

    @PostConstruct
    fun init() {
        optionGroups.clear()
        scaleDetailsMap.clear()
        questionToScaleMap.clear()

        loadOptionGroups()
        loadDemographicsSurvey()
        loadAssessmentBatteries()
    }

    private fun loadOptionGroups() {
        val sharedResource = resourceLoader.getResource("classpath:assessments/shared_option_groups.json")
        if (!sharedResource.exists()) {
            throw AssessmentCatalogInitializationException("shared_option_groups.json not found in classpath")
        }
        try {
            val root: JsonNode = objectMapper.readTree(sharedResource.inputStream)
            for (groupNode in root) {
                val name = groupNode.get("name")?.asText() ?: continue
                val optionsList = mutableListOf<ScaleOption>()
                val optionsArray = groupNode.get("options")
                if (optionsArray != null && optionsArray.isArray) {
                    for (opt in optionsArray) {
                        val valueNode = opt.get("value")
                        val valObj: Any = if (valueNode.isInt) valueNode.asInt() else valueNode.asText()
                        val label = opt.get("label")?.asText() ?: ""
                        optionsList.add(ScaleOption(value = valObj, label = label))
                    }
                }
                optionGroups[name] = Collections.unmodifiableList(optionsList)
            }
        } catch (e: Exception) {
            if (e is AssessmentCatalogInitializationException) throw e
            throw AssessmentCatalogInitializationException("Failed to parse shared_option_groups.json: ${e.message}", e)
        }
    }

    private fun loadDemographicsSurvey() {
        val demoResource = resourceLoader.getResource("classpath:assessments/demographics_survey.json")
        if (!demoResource.exists()) {
            throw AssessmentCatalogInitializationException("demographics_survey.json not found in classpath")
        }
        try {
            demoResource.inputStream.use { input ->
                val root: JsonNode = objectMapper.readTree(input)
                val code = root.get("id")?.asText() ?: root.get("code")?.asText() ?: "demographics_survey"
                val title = root.get("title")?.asText() ?: code
                val subtitle = root.get("subtitle")?.asText()
                val description = root.get("description")?.asText() ?: ""
                val estimatedMinutes = root.get("estimatedMinutes")?.asInt() ?: 3
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

                val questionList = mutableListOf<ScaleQuestion>()
                val sectionList = mutableListOf<BatterySection>()
                var globalOrder = 1

                if (root.has("sections") && root.get("sections").isArray) {
                    for (secNode in root.get("sections")) {
                        val secId = secNode.get("id")?.asText() ?: "section_${sectionList.size + 1}"
                        val secTitle = secNode.get("title")?.asText() ?: secId
                        val qNodes = secNode.get("questions")
                        var secCount = 0
                        if (qNodes != null && qNodes.isArray) {
                            for (q in qNodes) {
                                val qId = q.get("id")?.asText() ?: q.get("code")?.asText()
                                    ?: throw AssessmentCatalogInitializationException("Demographics question missing id/code")
                                val text = q.get("text")?.asText() ?: ""
                                val type = q.get("type")?.asText() ?: "single_choice"
                                val placeholder = q.get("placeholder")?.asText()
                                val options = parseOptions(q, qId, code)
                                val question = ScaleQuestion(
                                    id = qId,
                                    text = text,
                                    orderNum = globalOrder++,
                                    type = type,
                                    placeholder = placeholder,
                                    options = options,
                                    sectionCode = secId,
                                    sectionTitle = secTitle
                                )
                                questionList.add(question)
                                questionToScaleMap[qId] = code
                                secCount++
                            }
                        }
                        sectionList.add(
                            BatterySection(
                                code = secId,
                                title = secTitle,
                                questionCount = secCount,
                                orderNum = sectionList.size + 1
                            )
                        )
                    }
                }

                scaleDetailsMap[code] = ScaleDetail(
                    code = code,
                    title = title,
                    subtitle = subtitle,
                    description = description,
                    estimatedMinutes = estimatedMinutes,
                    instructions = instructions,
                    introItems = introItemsList,
                    questions = Collections.unmodifiableList(questionList),
                    sections = Collections.unmodifiableList(sectionList)
                )
            }
        } catch (e: Exception) {
            if (e is AssessmentCatalogInitializationException) throw e
            throw AssessmentCatalogInitializationException("Failed to load demographics_survey.json: ${e.message}", e)
        }
    }

    private fun loadAssessmentBatteries() {
        val groupsResource = resourceLoader.getResource("classpath:assessments/assessment_groups.json")
        if (!groupsResource.exists()) {
            throw AssessmentCatalogInitializationException("assessment_groups.json not found in classpath")
        }
        try {
            groupsResource.inputStream.use { input ->
                val root: JsonNode = objectMapper.readTree(input)
                val fieldNames = root.fieldNames()
                while (fieldNames.hasNext()) {
                    val batteryCode = fieldNames.next()
                    val groupNode = root.get(batteryCode)

                    val title = groupNode.get("title")?.asText() ?: batteryCode
                    val subtitle = groupNode.get("subtitle")?.asText()
                    val description = groupNode.get("description")?.asText() ?: ""
                    val durationStr = groupNode.get("duration")?.asText() ?: "15 分钟"
                    val estimatedMinutes = Regex("""\d+""").find(durationStr)?.value?.toIntOrNull() ?: 15
                    val instructions = groupNode.get("instructions")?.asText() ?: description

                    val introItemsList = mutableListOf<ScaleIntroItem>()
                    if (groupNode.has("introItems") && groupNode.get("introItems").isArray) {
                        for (itemNode in groupNode.get("introItems")) {
                            val icon = itemNode.get("icon")?.asText() ?: "assignment"
                            val itemTitle = itemNode.get("title")?.asText() ?: ""
                            val itemDesc = itemNode.get("description")?.asText() ?: ""
                            if (itemTitle.isNotBlank()) {
                                introItemsList.add(ScaleIntroItem(icon, itemTitle, itemDesc))
                            }
                        }
                    }

                    val questionnairesNode = groupNode.get("questionnaires")
                        ?: throw AssessmentCatalogInitializationException("Battery '$batteryCode' missing questionnaires list")

                    val batteryQuestions = mutableListOf<ScaleQuestion>()
                    val batterySections = mutableListOf<BatterySection>()
                    val seenQuestionIds = mutableSetOf<String>()
                    var globalOrder = 1

                    for (qCodeNode in questionnairesNode) {
                        val qCode = qCodeNode.asText()
                        val qResource = resourceLoader.getResource("classpath:assessments/$qCode.json")
                        if (!qResource.exists()) {
                            throw AssessmentCatalogInitializationException(
                                "Referenced questionnaire '$qCode' in battery '$batteryCode' not found in classpath"
                            )
                        }

                        qResource.inputStream.use { qInput ->
                            val qRoot: JsonNode = objectMapper.readTree(qInput)
                            val subscaleTitle = qRoot.get("title")?.asText() ?: qCode
                            val questionsNode = qRoot.get("questions")
                                ?: throw AssessmentCatalogInitializationException("No questions found in questionnaire '$qCode'")

                            var sectionQuestionCount = 0
                            for (qNode in questionsNode) {
                                val qId = qNode.get("code")?.asText() ?: qNode.get("id")?.asText()
                                    ?: throw AssessmentCatalogInitializationException("Question missing code/id in '$qCode'")

                                if (!seenQuestionIds.add(qId)) {
                                    throw AssessmentCatalogInitializationException(
                                        "Duplicate question ID '$qId' detected in battery '$batteryCode'"
                                    )
                                }

                                val text = qNode.get("text")?.asText() ?: ""
                                val type = qNode.get("type")?.asText() ?: "single_choice"
                                val placeholder = qNode.get("placeholder")?.asText()
                                val options = parseOptions(qNode, qId, qCode)

                                val question = ScaleQuestion(
                                    id = qId,
                                    text = text,
                                    orderNum = globalOrder++,
                                    type = type,
                                    placeholder = placeholder,
                                    options = options,
                                    sectionCode = qCode,
                                    sectionTitle = subscaleTitle
                                )
                                batteryQuestions.add(question)
                                questionToScaleMap[qId] = qCode
                                sectionQuestionCount++
                            }

                            batterySections.add(
                                BatterySection(
                                    code = qCode,
                                    title = subscaleTitle,
                                    questionCount = sectionQuestionCount,
                                    orderNum = batterySections.size + 1
                                )
                            )
                        }
                    }

                    scaleDetailsMap[batteryCode] = ScaleDetail(
                        code = batteryCode,
                        title = title,
                        subtitle = subtitle,
                        description = description,
                        estimatedMinutes = estimatedMinutes,
                        instructions = instructions,
                        introItems = introItemsList,
                        questions = Collections.unmodifiableList(batteryQuestions),
                        sections = Collections.unmodifiableList(batterySections)
                    )
                }
            }
        } catch (e: Exception) {
            if (e is AssessmentCatalogInitializationException) throw e
            throw AssessmentCatalogInitializationException("Failed to load assessment_groups.json: ${e.message}", e)
        }
    }

    private fun parseOptions(qNode: JsonNode, qId: String, scaleCode: String): List<ScaleOption> {
        if (qNode.has("customOptions") && qNode.get("customOptions").isArray) {
            return parseOptionArray(qNode.get("customOptions"))
        }
        if (qNode.has("optionGroupName")) {
            val groupName = qNode.get("optionGroupName").asText()
            return optionGroups[groupName]
                ?: throw AssessmentCatalogInitializationException(
                    "Unknown option group '$groupName' for question '$qId' in scale '$scaleCode'"
                )
        }
        if (qNode.has("options") && qNode.get("options").isArray) {
            return parseOptionArray(qNode.get("options"))
        }
        return emptyList()
    }

    private fun parseOptionArray(arrayNode: JsonNode): List<ScaleOption> {
        val list = mutableListOf<ScaleOption>()
        for (opt in arrayNode) {
            val valueNode = opt.get("value")
            val valObj: Any = if (valueNode.isInt) valueNode.asInt() else valueNode.asText()
            val label = opt.get("label")?.asText() ?: ""
            list.add(ScaleOption(valObj, label))
        }
        return list
    }

    fun getScaleDetail(code: String): ScaleDetail? = scaleDetailsMap[code]

    fun getScaleDetails(): List<ScaleDetail> = scaleDetailsMap.values.toList()

    fun getScaleCodes(): List<String> = scaleDetailsMap.keys.toList()

    fun lookupScaleCodeForQuestion(questionId: String): String? = questionToScaleMap[questionId]
}

package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.core.io.DefaultResourceLoader

class AssessmentCatalogLoaderTest {

    private lateinit var catalogLoader: AssessmentCatalogLoader
    private val resourceLoader = DefaultResourceLoader()
    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setUp() {
        catalogLoader = AssessmentCatalogLoader(resourceLoader, objectMapper)
        catalogLoader.init()
    }

    @Test
    fun `testLoadCatalog creates exactly 1 unified milestone questionnaire containing all assessments`() {
        val details = catalogLoader.getScaleDetails()
        assertEquals(1, details.size, "Should contain exactly 1 unified intake questionnaire")

        val codes = catalogLoader.getScaleCodes()
        assertEquals("comprehensive_student_intake_survey", codes[0], "Primary questionnaire must be comprehensive_student_intake_survey")

        val unified = details[0]
        assertEquals("中南大学学生心身健康综合调查问卷", unified.title)
        assertTrue(unified.questions.isNotEmpty(), "Unified questionnaire must contain questions")
    }

    @Test
    fun `testAssembleUnifiedSurvey contiguous orderNum across all section boundaries`() {
        val survey = catalogLoader.getScaleDetail("comprehensive_student_intake_survey")
        assertNotNull(survey)
        survey!!

        // Verify contiguous 1..N order
        for (i in survey.questions.indices) {
            assertEquals(i + 1, survey.questions[i].orderNum, "Question index $i should have orderNum ${i + 1}")
        }

        // Verify sections contain expected PDF protocol components
        val sectionCodes = survey.sections.map { it.code }
        assertTrue(sectionCodes.contains("demo_basic_info"), "Must contain demographic basic info section")
        assertTrue(sectionCodes.contains("ghq_12_section"), "Must contain GHQ-12 section")
        assertTrue(sectionCodes.contains("phq_9"), "Must contain PHQ-9 section")
        assertTrue(sectionCodes.contains("gad_7"), "Must contain GAD-7 section")
        assertTrue(sectionCodes.contains("sleep_disorder"), "Must contain sleep disorder section")
        assertTrue(sectionCodes.contains("big_five"), "Must contain Big Five section")
        assertFalse(sectionCodes.contains("scl_90"), "Must NOT contain purged SCL-90")
        assertFalse(sectionCodes.contains("psqi"), "Must NOT contain purged PSQI")
    }

    @Test
    fun `testTable3SleepCustomOptions parsed properly with 10 questions`() {
        val survey = catalogLoader.getScaleDetail("comprehensive_student_intake_survey")
        assertNotNull(survey)
        survey!!

        val sleepQuestions = survey.questions.filter { it.sectionCode == "sleep_disorder" }
        assertEquals(10, sleepQuestions.size, "Sleep questionnaire must have all 10 items from Table 3 in the PDF")

        val sleepHours = sleepQuestions.first { it.id == "sleep_hours" }
        assertEquals("你晚上一般睡几个小时？", sleepHours.text)
        assertEquals(5, sleepHours.options.size)

        val sleep4 = sleepQuestions.first { it.id == "sleep_4" }
        assertEquals(5, sleep4.options.size)
        assertEquals(0, sleep4.options[0].value)
        assertEquals("很不满意", sleep4.options[0].label)
        assertEquals(4, sleep4.options[4].value)
        assertEquals("很满意", sleep4.options[4].label)

        val sleepNap = sleepQuestions.first { it.id == "sleep_nap" }
        assertEquals("你一般午休多久？", sleepNap.text)
        assertEquals(5, sleepNap.options.size)

        val sleepMed = sleepQuestions.first { it.id == "sleep_medication" }
        assertEquals("过去一个月，你服用助眠药物的情况", sleepMed.text)
        assertEquals(4, sleepMed.options.size)
    }

    @Test
    fun `testReverseIndex maps question to canonical scale`() {
        assertEquals("demographics_survey", catalogLoader.lookupScaleCodeForQuestion("G1"))
        assertEquals("general_health_screener", catalogLoader.lookupScaleCodeForQuestion("ghq_1"))
        assertEquals("phq_9", catalogLoader.lookupScaleCodeForQuestion("phq9_1"))
        assertEquals("gad_7", catalogLoader.lookupScaleCodeForQuestion("gad7_1"))
        assertEquals("sleep_disorder", catalogLoader.lookupScaleCodeForQuestion("sleep_hours"))
        assertEquals("sleep_disorder", catalogLoader.lookupScaleCodeForQuestion("sleep_1"))
        assertEquals("sleep_disorder", catalogLoader.lookupScaleCodeForQuestion("sleep_nap"))
        assertEquals("sleep_disorder", catalogLoader.lookupScaleCodeForQuestion("sleep_medication"))
        assertEquals("apq_9_father", catalogLoader.lookupScaleCodeForQuestion("apq9_f_1"))
        assertEquals("apq_9_mother", catalogLoader.lookupScaleCodeForQuestion("apq9_m_1"))
        assertEquals("big_five", catalogLoader.lookupScaleCodeForQuestion("big_five_1"))

        // Purged scales must not have mappings
        assertNull(catalogLoader.lookupScaleCodeForQuestion("scl90_1"), "SCL-90 should be purged")
        assertNull(catalogLoader.lookupScaleCodeForQuestion("psqi_1"), "PSQI should be purged")
        assertNull(catalogLoader.lookupScaleCodeForQuestion("non_existent_question"))
    }

    @Test
    fun `testDurationParsing extracts minutes from localized strings`() {
        assertEquals(45, catalogLoader.getScaleDetail("comprehensive_student_intake_survey")?.estimatedMinutes)
    }

    @Test
    fun `testDemographicsDetail has 3 sections and rich attributes from JSON`() {
        val demo = catalogLoader.getScaleDetail("demographics_survey")
        assertNotNull(demo)
        demo!!

        assertEquals(3, demo.sections.size, "Demographics has 3 sections (Basic info, General status, Lifestyle)")
        assertEquals("demo_basic_info", demo.sections[0].code)
        assertEquals("demo_general_status", demo.sections[1].code)
        assertEquals("demo_lifestyle_habits", demo.sections[2].code)
        assertEquals(3, demo.introItems.size, "Demographics has 3 intro items in JSON")

        // Test slider question G14_1
        val g14 = demo.questions.first { it.id == "G14_1" }
        assertEquals("slider", g14.type)
        assertEquals(1.0, g14.min)
        assertEquals(10.0, g14.max)

        // Test numeric question G1b_height
        val height = demo.questions.first { it.id == "G1b_height" }
        assertEquals("number", height.type)
        assertEquals("cm", height.unit)

        // Test option with text input
        val religion = demo.questions.first { it.id == "G7" }
        val otherOpt = religion.options.first { it.value == "other" }
        assertTrue(otherOpt.hasTextInput)
    }

    @Test
    fun `testGeneralHealthScreenerDetail has 2 sections with GHQ12 and clinical referral items`() {
        val ghq = catalogLoader.getScaleDetail("general_health_screener")
        assertNotNull(ghq)
        ghq!!

        assertEquals(2, ghq.sections.size, "GHQ Screener has 2 sections")
        assertEquals("ghq_12_section", ghq.sections[0].code)
        assertEquals(12, ghq.sections[0].questionCount)
        assertEquals("clinical_referral_section", ghq.sections[1].code)
        assertEquals(12, ghq.sections[1].questionCount)
        assertEquals(24, ghq.questions.size)

        // Test high-risk suicide item ghq_22
        val suicideItem = ghq.questions.first { it.id == "ghq_22" }
        assertEquals("single_choice", suicideItem.type)
        assertEquals(2, suicideItem.options.size)
    }

    @Test
    fun `testBatteriesHaveEmptyIntroItemsFromBackend`() {
        val survey = catalogLoader.getScaleDetail("comprehensive_student_intake_survey")
        assertNotNull(survey)
        assertTrue(survey!!.introItems.isEmpty(), "Backend must not generate hardcoded UI introItems for batteries")
    }
}

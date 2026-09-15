package com.medicalsystem.intake.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.medicalsystem.intake.exception.AssessmentCatalogInitializationException
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
    fun `testLoadCatalog creates exactly 9 milestones with demographics pinned first`() {
        val details = catalogLoader.getScaleDetails()
        assertEquals(9, details.size, "Should contain exactly 9 milestone scales (1 demographic + 8 batteries)")

        val codes = catalogLoader.getScaleCodes()
        assertEquals("demographics_survey", codes[0], "Card 0 must be demographics_survey")

        val expectedBatteries = listOf(
            "demographics_survey",
            "MENTAL_HEALTH_ASSESSMENT",
            "SLEEP_ASSESSMENT",
            "DIGITAL_HABITS_DAILY_BEHAVIORS_ASSESSMENT",
            "SOCIAL_ENVIRONMENT_SUPPORT_ASSESSMENT",
            "SELF_REGULATION_PERSONALITY_ASSESSMENT",
            "FAMILY_BACKGROUND_EARLY_EXPERIENCES_ASSESSMENT",
            "CLINICAL_SCREENING_NEURODIVERGENCE_ASSESSMENT",
            "PERSONALITY_COPING_OUTLOOK_ASSESSMENT"
        )
        assertEquals(expectedBatteries, codes)
    }

    @Test
    fun `testAssembleBattery contiguous orderNum across section boundaries`() {
        val mentalHealth = catalogLoader.getScaleDetail("MENTAL_HEALTH_ASSESSMENT")
        assertNotNull(mentalHealth)
        mentalHealth!!

        assertEquals(124, mentalHealth.questions.size)
        // Verify contiguous 1..N order
        for (i in mentalHealth.questions.indices) {
            assertEquals(i + 1, mentalHealth.questions[i].orderNum, "Question index $i should have orderNum ${i + 1}")
        }

        // PHQ-9 is 9 questions, GAD-7 starts at question index 9 (orderNum 10)
        val firstGad7 = mentalHealth.questions[9]
        assertEquals("gad7_1", firstGad7.id)
        assertEquals(10, firstGad7.orderNum)
        assertEquals("gad_7", firstGad7.sectionCode)
        assertNotNull(firstGad7.sectionTitle)

        // Sections
        assertEquals(5, mentalHealth.sections.size)
        assertEquals("phq_9", mentalHealth.sections[0].code)
        assertEquals(9, mentalHealth.sections[0].questionCount)
        assertEquals("gad_7", mentalHealth.sections[1].code)
        assertEquals(7, mentalHealth.sections[1].questionCount)
        assertEquals("apq_9_father", mentalHealth.sections[2].code)
        assertEquals(9, mentalHealth.sections[2].questionCount)
        assertEquals("apq_9_mother", mentalHealth.sections[3].code)
        assertEquals(9, mentalHealth.sections[3].questionCount)
        assertEquals("scl_90", mentalHealth.sections[4].code)
        assertEquals(90, mentalHealth.sections[4].questionCount)
    }

    @Test
    fun `testAssembleBattery customOptions parsed properly`() {
        val sleep = catalogLoader.getScaleDetail("SLEEP_ASSESSMENT")
        assertNotNull(sleep)
        sleep!!

        assertEquals(14, sleep.questions.size)
        assertEquals(2, sleep.sections.size)
        assertEquals("sleep_disorder", sleep.sections[0].code)
        assertEquals("psqi", sleep.sections[1].code)

        // sleep_4 has customOptions
        val sleep4 = sleep.questions.first { it.id == "sleep_4" }
        assertEquals(5, sleep4.options.size)
        assertEquals(0, sleep4.options[0].value)
        assertEquals("很不满意", sleep4.options[0].label)
        assertEquals(4, sleep4.options[4].value)
        assertEquals("很满意", sleep4.options[4].label)

        // psqi_4 has customOptions
        val psqi4 = sleep.questions.first { it.id == "psqi_4" }
        assertEquals(5, psqi4.options.size)
        assertEquals(0, psqi4.options[0].value)
        assertEquals("很满意", psqi4.options[0].label)
        assertEquals(4, psqi4.options[4].value)
        assertEquals("很不满意", psqi4.options[4].label)
    }

    @Test
    fun `testReverseIndex maps question to canonical scale`() {
        assertEquals("phq_9", catalogLoader.lookupScaleCodeForQuestion("phq9_1"))
        assertEquals("gad_7", catalogLoader.lookupScaleCodeForQuestion("gad7_1"))
        assertEquals("apq_9_father", catalogLoader.lookupScaleCodeForQuestion("apq9_f_1"))
        assertEquals("scl_90", catalogLoader.lookupScaleCodeForQuestion("scl90_1"))
        assertEquals("sleep_disorder", catalogLoader.lookupScaleCodeForQuestion("sleep_1"))
        assertEquals("psqi", catalogLoader.lookupScaleCodeForQuestion("psqi_1"))
        assertEquals("demographics_survey", catalogLoader.lookupScaleCodeForQuestion("demo_gender"))
        assertNull(catalogLoader.lookupScaleCodeForQuestion("non_existent_question"))
    }

    @Test
    fun `testDurationParsing extracts minutes from localized strings`() {
        assertEquals(15, catalogLoader.getScaleDetail("MENTAL_HEALTH_ASSESSMENT")?.estimatedMinutes)
        assertEquals(10, catalogLoader.getScaleDetail("SLEEP_ASSESSMENT")?.estimatedMinutes)
        assertEquals(15, catalogLoader.getScaleDetail("DIGITAL_HABITS_DAILY_BEHAVIORS_ASSESSMENT")?.estimatedMinutes)
        assertEquals(10, catalogLoader.getScaleDetail("SOCIAL_ENVIRONMENT_SUPPORT_ASSESSMENT")?.estimatedMinutes)
        assertEquals(15, catalogLoader.getScaleDetail("SELF_REGULATION_PERSONALITY_ASSESSMENT")?.estimatedMinutes)
        assertEquals(20, catalogLoader.getScaleDetail("FAMILY_BACKGROUND_EARLY_EXPERIENCES_ASSESSMENT")?.estimatedMinutes)
        assertEquals(25, catalogLoader.getScaleDetail("CLINICAL_SCREENING_NEURODIVERGENCE_ASSESSMENT")?.estimatedMinutes)
        assertEquals(20, catalogLoader.getScaleDetail("PERSONALITY_COPING_OUTLOOK_ASSESSMENT")?.estimatedMinutes)
    }

    @Test
    fun `testDemographicsDetail has sections and intro items from JSON`() {
        val demo = catalogLoader.getScaleDetail("demographics_survey")
        assertNotNull(demo)
        demo!!

        assertEquals(8, demo.questions.size)
        assertEquals(1, demo.sections.size)
        assertEquals("demographics_section", demo.sections[0].code)
        assertEquals(3, demo.introItems.size, "Demographics has 3 intro items in JSON")
    }

    @Test
    fun `testBatteriesHaveEmptyIntroItemsFromBackend`() {
        // Strict adherence to GEMINI.md: No backend UI presentation strings
        val mentalHealth = catalogLoader.getScaleDetail("MENTAL_HEALTH_ASSESSMENT")
        assertNotNull(mentalHealth)
        assertTrue(mentalHealth!!.introItems.isEmpty(), "Backend must not generate hardcoded UI introItems for batteries")
    }
}

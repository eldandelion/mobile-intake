package com.medicalsystem.intake.infrastructure.sms

import com.medicalsystem.intake.service.sms.SmsSender
import org.junit.jupiter.api.Test
import org.springframework.boot.autoconfigure.AutoConfigurations
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SmsConfigurationTest {

    private val contextRunner = ApplicationContextRunner()
        .withConfiguration(
            AutoConfigurations.of(
                MockSmsSender::class.java,
                AliyunSmsSender::class.java,
                AliyunDypnsSmsSender::class.java,
                AliyunSmsProperties::class.java
            )
        )

    @Test
    fun `default configuration activates MockSmsSender`() {
        contextRunner.run { context ->
            val smsSender = context.getBean(SmsSender::class.java)
            assertTrue(smsSender is MockSmsSender)
        }
    }

    @Test
    fun `provider dysms activates AliyunSmsSender`() {
        contextRunner
            .withPropertyValues(
                "aliyun.sms.enabled=true",
                "aliyun.sms.provider=dysms",
                "aliyun.sms.access-key-id=test-key",
                "aliyun.sms.access-key-secret=test-secret"
            )
            .run { context ->
                val smsSender = context.getBean(SmsSender::class.java)
                assertTrue(smsSender is AliyunSmsSender)
            }
    }

    @Test
    fun `provider dypns activates AliyunDypnsSmsSender`() {
        contextRunner
            .withPropertyValues(
                "aliyun.sms.enabled=true",
                "aliyun.sms.provider=dypns",
                "aliyun.sms.access-key-id=test-key",
                "aliyun.sms.access-key-secret=test-secret",
                "aliyun.sms.scheme-code=FC1000000000"
            )
            .run { context ->
                val smsSender = context.getBean(SmsSender::class.java)
                assertTrue(smsSender is AliyunDypnsSmsSender)
            }
    }

    @Test
    fun `AliyunSmsProperties resolves effective scheme name`() {
        val propsWithCodeOnly = AliyunSmsProperties(schemeCode = "FC123")
        assertEquals("FC123", propsWithCodeOnly.effectiveSchemeName())

        val propsWithNameOnly = AliyunSmsProperties(schemeName = "my-scheme")
        assertEquals("my-scheme", propsWithNameOnly.effectiveSchemeName())

        val propsWithBoth = AliyunSmsProperties(schemeName = "preferred-name", schemeCode = "FC456")
        assertEquals("preferred-name", propsWithBoth.effectiveSchemeName())
    }
}

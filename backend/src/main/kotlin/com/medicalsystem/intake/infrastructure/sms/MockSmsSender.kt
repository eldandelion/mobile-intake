package com.medicalsystem.intake.infrastructure.sms

import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.service.sms.SmsSendResult
import com.medicalsystem.intake.service.sms.SmsSender
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

@Component
@ConditionalOnProperty(prefix = "aliyun.sms", name = ["enabled"], havingValue = "false", matchIfMissing = true)
class MockSmsSender : SmsSender {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostConstruct
    fun init() {
        log.warn("===================================================================")
        log.warn("[SMS INITIALIZED] MOCK SMS SENDER ACTIVE (Real SMS is DISABLED)")
        log.warn("To enable real SMS, set aliyun.sms.enabled=true in backend/.env")
        log.warn("===================================================================")
    }

    override fun sendVerificationCode(phone: ChineseMobileNumber, code: String): SmsSendResult {
        log.info("[MOCK SMS] Verification code for {}: {}", phone.normalized(), code)
        return SmsSendResult(success = true, messageId = "mock-${System.currentTimeMillis()}")
    }
}

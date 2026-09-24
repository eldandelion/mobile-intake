package com.medicalsystem.intake.infrastructure.sms

import com.aliyun.dysmsapi20170525.Client
import com.aliyun.dysmsapi20170525.models.SendSmsRequest
import com.aliyun.teaopenapi.models.Config
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.service.sms.SmsSendResult
import com.medicalsystem.intake.service.sms.SmsSender
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

@Component
@ConditionalOnProperty(prefix = "aliyun.sms", name = ["enabled"], havingValue = "true")
@ConditionalOnProperty(prefix = "aliyun.sms", name = ["provider"], havingValue = "dysms", matchIfMissing = true)
class AliyunSmsSender(
    private val properties: AliyunSmsProperties
) : SmsSender {
    private val log = LoggerFactory.getLogger(javaClass)

    @jakarta.annotation.PostConstruct
    fun init() {
        val maskedKey = if (properties.accessKeyId.length > 8) "${properties.accessKeyId.take(4)}****${properties.accessKeyId.takeLast(4)}" else properties.accessKeyId
        log.info("===================================================================")
        log.info("[SMS INITIALIZED] ALIBABA CLOUD DYSMS (Traditional SMS) ACTIVE")
        log.info("  AccessKeyId: {}", maskedKey)
        log.info("  SignName:    {}", properties.effectiveSignName())
        log.info("  TemplateCode:{}", properties.templateCode)
        log.info("===================================================================")
    }

    private val client: Client by lazy {
        val config = Config().apply {
            accessKeyId = properties.accessKeyId
            accessKeySecret = properties.accessKeySecret
            endpoint = properties.endpoint
        }
        Client(config)
    }

    override fun sendVerificationCode(phone: ChineseMobileNumber, code: String): SmsSendResult {
        val phoneStr = phone.normalized()
        val maskedPhone = if (phoneStr.length == 11) {
            "${phoneStr.substring(0, 3)}****${phoneStr.substring(7)}"
        } else {
            phoneStr
        }

        return try {
            val request = SendSmsRequest().apply {
                phoneNumbers = phoneStr
                signName = properties.effectiveSignName()
                templateCode = properties.templateCode
                templateParam = "{\"code\":\"$code\"}"
            }
            val response = client.sendSms(request)
            val body = response.body
            if (body != null && body.code == "OK") {
                log.info("Alibaba SMS delivered successfully to {}", maskedPhone)
                SmsSendResult(success = true, messageId = body.bizId ?: body.requestId)
            } else {
                val errorCode = body?.code ?: "UNKNOWN_ERROR"
                val errorMsg = body?.message ?: "SMS dispatch failed"
                log.error("Alibaba SMS failed for {}: {} - {}", maskedPhone, errorCode, errorMsg)
                SmsSendResult(success = false, errorCode = errorCode, errorMessage = errorMsg)
            }
        } catch (ex: Exception) {
            log.error("Alibaba SMS client exception for $maskedPhone", ex)
            SmsSendResult(success = false, errorCode = "CLIENT_EXCEPTION", errorMessage = ex.message)
        }
    }
}

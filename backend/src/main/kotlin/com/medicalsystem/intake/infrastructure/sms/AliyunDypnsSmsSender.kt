package com.medicalsystem.intake.infrastructure.sms

import com.aliyun.dypnsapi20170525.Client
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest
import com.aliyun.teaopenapi.models.Config
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.service.sms.SmsSendResult
import com.medicalsystem.intake.service.sms.SmsSender
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

/**
 * Alibaba Cloud Number Verification Service (Dypnsapi - 短信认证方案) Adapter.
 * Enables SMS verification using zero-qualification signatures & templates for personal accounts.
 */
@Component
@ConditionalOnProperty(prefix = "aliyun.sms", name = ["enabled"], havingValue = "true")
@ConditionalOnProperty(prefix = "aliyun.sms", name = ["provider"], havingValue = "dypns")
class AliyunDypnsSmsSender(
    private val properties: AliyunSmsProperties
) : SmsSender {
    private val log = LoggerFactory.getLogger(javaClass)

    @jakarta.annotation.PostConstruct
    fun init() {
        val maskedKey = if (properties.accessKeyId.length > 8) "${properties.accessKeyId.take(4)}****${properties.accessKeyId.takeLast(4)}" else properties.accessKeyId
        log.info("===================================================================")
        log.info("[SMS INITIALIZED] ALIBABA CLOUD DYPNS (Number Verification) ACTIVE")
        log.info("  AccessKeyId: {}", maskedKey)
        log.info("  SignName:    {}", properties.effectiveSignName())
        log.info("  TemplateCode:{}", properties.templateCode)
        log.info("===================================================================")
    }

    private val client: Client by lazy {
        val config = Config().apply {
            accessKeyId = properties.accessKeyId
            accessKeySecret = properties.accessKeySecret
            endpoint = if (properties.endpoint.isNotBlank() && properties.endpoint != "dysmsapi.aliyuncs.com") {
                properties.endpoint
            } else {
                "dypnsapi.aliyuncs.com"
            }
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
            val request = SendSmsVerifyCodeRequest().apply {
                phoneNumber = phoneStr
                if (properties.effectiveSchemeName().isNotBlank()) {
                    schemeName = properties.effectiveSchemeName()
                }
                templateParam = "{\"code\":\"$code\",\"min\":\"5\"}"
                codeLength = 6L
                validTime = 300L
                if (properties.effectiveSignName().isNotBlank()) {
                    signName = properties.effectiveSignName()
                }
                if (properties.templateCode.isNotBlank()) {
                    templateCode = properties.templateCode
                }
            }
            val response = client.sendSmsVerifyCode(request)
            val body = response.body
            if (body != null && (body.code == "OK" || body.code == "Success" || body.success == true)) {
                val messageId = body.model?.bizId ?: body.model?.outId ?: body.requestId
                log.info("Alibaba DYPNS SMS delivered successfully to {}", maskedPhone)
                SmsSendResult(success = true, messageId = messageId)
            } else {
                val errorCode = body?.code ?: "UNKNOWN_ERROR"
                val errorMsg = body?.message ?: "SMS dispatch failed"
                log.error("Alibaba DYPNS SMS failed for {}: {} - {}", maskedPhone, errorCode, errorMsg)
                SmsSendResult(success = false, errorCode = errorCode, errorMessage = errorMsg)
            }
        } catch (ex: Exception) {
            log.error("Alibaba DYPNS SMS client exception for $maskedPhone", ex)
            SmsSendResult(success = false, errorCode = "CLIENT_EXCEPTION", errorMessage = ex.message)
        }
    }
}

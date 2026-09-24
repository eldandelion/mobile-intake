package com.medicalsystem.intake.infrastructure.sms

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

enum class SmsProviderType {
    DYSMS,
    DYPNS
}

@Component
@ConfigurationProperties(prefix = "aliyun.sms")
data class AliyunSmsProperties(
    var enabled: Boolean = false,
    var provider: SmsProviderType = SmsProviderType.DYSMS,
    var accessKeyId: String = "",
    var accessKeySecret: String = "",
    var endpoint: String = "dysmsapi.aliyuncs.com",
    // Traditional Dysmsapi configuration (branded signature or test signature)
    var signName: String = "",
    var templateCode: String = "",
    // Dypnsapi configuration (Number Verification / 免资质短信认证方案)
    var schemeName: String = "",
    var schemeCode: String = ""
) {
    fun effectiveSchemeName(): String = schemeName.ifBlank { schemeCode }

    fun effectiveSignName(): String {
        if (signName.isBlank()) return ""
        return try {
            // Java Properties loaders can parse UTF-8 bytes as ISO-8859-1 (Latin-1)
            if (signName.any { it.code in 0x0080..0x00FF }) {
                String(signName.toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
            } else {
                signName
            }
        } catch (_: Exception) {
            signName
        }
    }
}

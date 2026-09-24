package com.medicalsystem.intake.service

import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import com.medicalsystem.intake.exception.ValidationException
import com.medicalsystem.intake.infrastructure.sms.MockSmsSender
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.service.sms.SmsSender
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.util.concurrent.TimeUnit
import kotlin.math.ceil

enum class OtpPurpose {
    REGISTRATION,
    LOGIN;

    companion object {
        fun fromString(value: String?): OtpPurpose {
            if (value.isNullOrBlank()) return REGISTRATION
            return entries.find { it.name.equals(value.trim(), ignoreCase = true) }
                ?: throw ValidationException("无效的验证码业务用途: $value")
        }
    }
}

data class OtpSendOutcome(
    val expiresInSeconds: Int,
    val devCode: String?
)

@Service
class OtpService(
    private val smsSender: SmsSender
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val secureRandom = SecureRandom()

    private data class OtpRecord(
        val code: String,
        val createdAtMillis: Long,
        val expiresAtMillis: Long,
        var failedAttempts: Int = 0
    )

    // 5-minute TTL cache keyed by "phone:purpose"
    private val cache: Cache<String, OtpRecord> = Caffeine.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .maximumSize(50_000)
        .build()

    private fun cacheKey(phone: ChineseMobileNumber, purpose: OtpPurpose): String {
        return "${phone.normalized()}:${purpose.name}"
    }

    /**
     * Dispatches a 6-digit OTP code to the given phone number with strict 60s cooldown.
     */
    fun sendOtp(phone: ChineseMobileNumber, purpose: OtpPurpose): OtpSendOutcome {
        val now = System.currentTimeMillis()
        val key = cacheKey(phone, purpose)
        val existing = cache.getIfPresent(key)

        // 1. Strict 60-second cooldown check
        if (existing != null && (now - existing.createdAtMillis) < 60_000) {
            val remainingSec = ceil((60_000 - (now - existing.createdAtMillis)) / 1000.0).toInt().coerceAtLeast(1)
            throw ValidationException("短信发送过于频繁，请等待 ${remainingSec} 秒后再试")
        }

        // 2. Generate cryptographically secure 6-digit numeric OTP
        val code = String.format("%06d", secureRandom.nextInt(1_000_000))

        // 3. Dispatch via SmsSender port
        val sendResult = smsSender.sendVerificationCode(phone, code)
        if (!sendResult.success) {
            log.error("Failed to send OTP to {}: {}", phone.normalized(), sendResult.errorMessage)
            throw ValidationException("短信发送失败: ${sendResult.errorMessage ?: "运营商网关异常"}")
        }

        // 4. Save in cache with 5-minute validity
        val ttlMillis = 5 * 60 * 1000L
        cache.put(
            key,
            OtpRecord(
                code = code,
                createdAtMillis = now,
                expiresAtMillis = now + ttlMillis,
                failedAttempts = 0
            )
        )

        val devCode = if (smsSender is MockSmsSender) code else null
        return OtpSendOutcome(expiresInSeconds = 300, devCode = devCode)
    }

    /**
     * Verifies the OTP code. If consume is true, the OTP is invalidated upon successful verification.
     */
    fun verifyOtp(phone: ChineseMobileNumber, code: String, purpose: OtpPurpose, consume: Boolean = false): Boolean {
        val now = System.currentTimeMillis()
        val key = cacheKey(phone, purpose)
        val record = cache.getIfPresent(key)
            ?: throw ValidationException("验证码不存在或已过期，请重新获取")

        if (record.expiresAtMillis <= now) {
            cache.invalidate(key)
            throw ValidationException("验证码已过期，请重新获取")
        }

        if (record.failedAttempts >= 5) {
            cache.invalidate(key)
            throw ValidationException("验证码错误次数过多，已被作废，请重新获取")
        }

        if (record.code != code.trim()) {
            record.failedAttempts++
            val remaining = 5 - record.failedAttempts
            if (remaining <= 0) {
                cache.invalidate(key)
                throw ValidationException("验证码错误次数过多，已被作废，请重新获取")
            }
            throw ValidationException("验证码错误，还剩 $remaining 次尝试机会")
        }

        if (consume) {
            cache.invalidate(key)
        }
        return true
    }

    /**
     * Inspect OTP code for testing purposes.
     */
    fun getActiveCodeForTesting(phone: ChineseMobileNumber, purpose: OtpPurpose): String? {
        return cache.getIfPresent(cacheKey(phone, purpose))?.code
    }

    /**
     * Clear all cached codes (useful in test teardown).
     */
    fun clearAllForTesting() {
        cache.invalidateAll()
    }
}

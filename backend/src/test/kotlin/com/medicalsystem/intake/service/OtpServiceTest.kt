package com.medicalsystem.intake.service

import com.medicalsystem.intake.exception.ValidationException
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.service.sms.SmsSendResult
import com.medicalsystem.intake.service.sms.SmsSender
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class OtpServiceTest {

    private class FakeSmsSender : SmsSender {
        var callCount = 0
        var lastPhone: ChineseMobileNumber? = null
        var lastCode: String? = null
        var returnSuccess = true
        var failureMessage: String? = null

        override fun sendVerificationCode(phone: ChineseMobileNumber, code: String): SmsSendResult {
            callCount++
            lastPhone = phone
            lastCode = code
            return if (returnSuccess) {
                SmsSendResult(success = true, messageId = "fake-$callCount")
            } else {
                SmsSendResult(success = false, errorCode = "FAILED", errorMessage = failureMessage)
            }
        }
    }

    private lateinit var fakeSmsSender: FakeSmsSender
    private lateinit var otpService: OtpService

    private val testPhone = ChineseMobileNumber("13812345678")

    @BeforeEach
    fun setUp() {
        fakeSmsSender = FakeSmsSender()
        otpService = OtpService(fakeSmsSender)
    }

    @Test
    fun `should send OTP and return 300s expiry`() {
        val outcome = otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)
        assertEquals(300, outcome.expiresInSeconds)

        val activeCode = otpService.getActiveCodeForTesting(testPhone, OtpPurpose.REGISTRATION)
        assertNotNull(activeCode)
        assertEquals(6, activeCode.length)
        assertTrue(activeCode.all { it.isDigit() })

        assertEquals(1, fakeSmsSender.callCount)
        assertEquals(testPhone, fakeSmsSender.lastPhone)
        assertEquals(activeCode, fakeSmsSender.lastCode)
    }

    @Test
    fun `should throw validation exception if SMS gateway fails`() {
        fakeSmsSender.returnSuccess = false
        fakeSmsSender.failureMessage = "Quota exhausted"

        val ex = assertThrows<ValidationException> {
            otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)
        }
        assertTrue(ex.message!!.contains("Quota exhausted"))
    }

    @Test
    fun `should enforce 60-second cooldown on consecutive send requests`() {
        otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)

        val ex = assertThrows<ValidationException> {
            otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)
        }
        assertTrue(ex.message!!.contains("短信发送过于频繁"))
    }

    @Test
    fun `should successfully verify valid OTP without consuming when consume is false`() {
        otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)
        val code = checkNotNull(otpService.getActiveCodeForTesting(testPhone, OtpPurpose.REGISTRATION))

        val valid = otpService.verifyOtp(testPhone, code, OtpPurpose.REGISTRATION, consume = false)
        assertTrue(valid)

        // Still exists
        assertNotNull(otpService.getActiveCodeForTesting(testPhone, OtpPurpose.REGISTRATION))
    }

    @Test
    fun `should successfully verify valid OTP and consume when consume is true`() {
        otpService.sendOtp(testPhone, OtpPurpose.LOGIN)
        val code = checkNotNull(otpService.getActiveCodeForTesting(testPhone, OtpPurpose.LOGIN))

        val valid = otpService.verifyOtp(testPhone, code, OtpPurpose.LOGIN, consume = true)
        assertTrue(valid)

        // Consumed -> should not exist anymore
        assertThrows<ValidationException> {
            otpService.verifyOtp(testPhone, code, OtpPurpose.LOGIN, consume = false)
        }
    }

    @Test
    fun `should decrement remaining attempts on invalid code`() {
        otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)

        val ex1 = assertThrows<ValidationException> {
            otpService.verifyOtp(testPhone, "000000", OtpPurpose.REGISTRATION)
        }
        assertTrue(ex1.message!!.contains("还剩 4 次尝试机会"))

        val ex2 = assertThrows<ValidationException> {
            otpService.verifyOtp(testPhone, "000000", OtpPurpose.REGISTRATION)
        }
        assertTrue(ex2.message!!.contains("还剩 3 次尝试机会"))
    }

    @Test
    fun `should invalidate OTP after 5 consecutive failed attempts`() {
        otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)

        repeat(4) {
            assertThrows<ValidationException> {
                otpService.verifyOtp(testPhone, "000000", OtpPurpose.REGISTRATION)
            }
        }

        // 5th attempt invalidates
        val ex5 = assertThrows<ValidationException> {
            otpService.verifyOtp(testPhone, "000000", OtpPurpose.REGISTRATION)
        }
        assertTrue(ex5.message!!.contains("验证码错误次数过多，已被作废"))

        // Next attempt will say not found / expired
        val ex6 = assertThrows<ValidationException> {
            otpService.verifyOtp(testPhone, "000000", OtpPurpose.REGISTRATION)
        }
        assertTrue(ex6.message!!.contains("验证码不存在或已过期"))
    }

    @Test
    fun `should isolate OTPs across different purposes`() {
        otpService.sendOtp(testPhone, OtpPurpose.REGISTRATION)
        val regCode = checkNotNull(otpService.getActiveCodeForTesting(testPhone, OtpPurpose.REGISTRATION))

        // Attempting to verify regCode with LOGIN purpose must throw not found
        val ex = assertThrows<ValidationException> {
            otpService.verifyOtp(testPhone, regCode, OtpPurpose.LOGIN)
        }
        assertTrue(ex.message!!.contains("验证码不存在或已过期"))
    }
}

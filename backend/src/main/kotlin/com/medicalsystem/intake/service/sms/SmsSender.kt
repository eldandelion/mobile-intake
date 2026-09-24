package com.medicalsystem.intake.service.sms

import com.medicalsystem.intake.model.ChineseMobileNumber

data class SmsSendResult(
    val success: Boolean,
    val messageId: String? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null
)

interface SmsSender {
    fun sendVerificationCode(phone: ChineseMobileNumber, code: String): SmsSendResult
}

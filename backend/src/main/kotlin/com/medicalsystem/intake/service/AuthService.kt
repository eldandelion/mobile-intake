package com.medicalsystem.intake.service

import com.medicalsystem.intake.dto.*
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.exception.ConflictException
import com.medicalsystem.intake.exception.UnauthorizedException
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.security.JwtService
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val studentRepository: IntakeStudentRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val otpService: OtpService
) {

    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        val studentNumberVo = com.medicalsystem.intake.model.StudentNumber(request.studentNumber)
        val phoneVo = com.medicalsystem.intake.model.ChineseMobileNumber(request.phone)
        val nameVo = com.medicalsystem.intake.model.PersonName(request.fullName)

        val normalizedStudentNumber = studentNumberVo.normalized()
        val normalizedPhone = phoneVo.normalized()

        if (studentRepository.existsByStudentNumber(normalizedStudentNumber)) {
            throw ConflictException("Student number already registered: $normalizedStudentNumber")
        }
        if (studentRepository.existsByPhone(normalizedPhone)) {
            throw ConflictException("Phone number already registered: $normalizedPhone")
        }

        val student = IntakeStudentEntity.create(
            studentNumber = studentNumberVo,
            fullName = nameVo,
            phone = phoneVo,
            passwordHash = checkNotNull(passwordEncoder.encode(request.password)) { "Failed to encode password" }
        )
        val saved = studentRepository.save(student)
        val token = jwtService.generateToken(saved.studentNumber)

        return AuthResponse(
            token = token,
            student = toDto(saved)
        )
    }

    @Transactional(readOnly = true)
    fun login(request: LoginRequest): AuthResponse {
        val identifier = request.resolvedIdentifier
        val password = request.resolvedPassword
        if (identifier.isBlank()) {
            throw com.medicalsystem.intake.exception.ValidationException("Identifier is required")
        }
        if (password.isBlank()) {
            throw com.medicalsystem.intake.exception.ValidationException("Password is required")
        }

        val cleanIdentifier = identifier.trim()
        val normalizedStudentNumber = if (cleanIdentifier.startsWith("l", ignoreCase = true)) {
            cleanIdentifier.uppercase()
        } else {
            cleanIdentifier
        }

        val student = studentRepository.findByStudentNumber(normalizedStudentNumber).orElse(null)
            ?: studentRepository.findByPhone(cleanIdentifier).orElse(null)
            ?: throw UnauthorizedException("Invalid credentials")

        if (!passwordEncoder.matches(password, student.passwordHash)) {
            throw UnauthorizedException("Invalid credentials")
        }

        val token = jwtService.generateToken(student.studentNumber)
        return AuthResponse(
            token = token,
            student = toDto(student)
        )
    }

    fun sendVerificationCode(request: SendCodeRequest): SendCodeResponse {
        val phoneVo = com.medicalsystem.intake.model.ChineseMobileNumber(request.phone)
        val purpose = OtpPurpose.fromString(request.purpose)

        if (purpose == OtpPurpose.LOGIN) {
            if (!studentRepository.existsByPhone(phoneVo.normalized())) {
                throw com.medicalsystem.intake.exception.NotFoundException("该手机号码尚未登记，请先创建账号")
            }
        } else if (purpose == OtpPurpose.REGISTRATION) {
            if (studentRepository.existsByPhone(phoneVo.normalized())) {
                throw ConflictException("该手机号码已被注册: ${phoneVo.normalized()}")
            }
        }

        val outcome = otpService.sendOtp(phoneVo, purpose)
        return SendCodeResponse(
            phone = phoneVo.normalized(),
            devCode = outcome.devCode,
            expiresInSeconds = outcome.expiresInSeconds
        )
    }

    fun verifyCode(request: VerifyCodeRequest): VerifyCodeResponse {
        val phoneVo = com.medicalsystem.intake.model.ChineseMobileNumber(request.phone)
        val purpose = OtpPurpose.fromString(request.purpose)
        val isValid = otpService.verifyOtp(phoneVo, request.code, purpose, consume = false)
        return VerifyCodeResponse(valid = isValid)
    }

    @Transactional(readOnly = true)
    fun loginWithSms(request: LoginSmsRequest): AuthResponse {
        val phoneVo = com.medicalsystem.intake.model.ChineseMobileNumber(request.phone)
        otpService.verifyOtp(phoneVo, request.code, OtpPurpose.LOGIN, consume = true)

        val student = studentRepository.findByPhone(phoneVo.normalized()).orElseThrow {
            com.medicalsystem.intake.exception.NotFoundException("该手机号码尚未登记，请先创建账号")
        }

        val token = jwtService.generateToken(student.studentNumber)
        return AuthResponse(
            token = token,
            student = toDto(student)
        )
    }

    fun toDto(entity: IntakeStudentEntity): StudentDto {
        return StudentDto(
            studentNumber = entity.studentNumber,
            fullName = entity.fullName,
            phone = entity.phone,
            createdAt = entity.createdAt
        )
    }
}

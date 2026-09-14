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
    private val jwtService: JwtService
) {

    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        val trimmedStudentNumber = request.studentNumber.trim()
        val trimmedPhone = request.phone.trim()

        if (studentRepository.existsByStudentNumber(trimmedStudentNumber)) {
            throw ConflictException("Student number already registered: $trimmedStudentNumber")
        }
        if (studentRepository.existsByPhone(trimmedPhone)) {
            throw ConflictException("Phone number already registered: $trimmedPhone")
        }

        val student = IntakeStudentEntity(
            studentNumber = trimmedStudentNumber,
            fullName = request.fullName.trim(),
            phone = trimmedPhone,
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
        val identifier = request.identifier.trim()
        val student = studentRepository.findByStudentNumber(identifier).orElse(null)
            ?: studentRepository.findByPhone(identifier).orElse(null)
            ?: throw UnauthorizedException("Invalid credentials")

        if (!passwordEncoder.matches(request.password, student.passwordHash)) {
            throw UnauthorizedException("Invalid credentials")
        }

        val token = jwtService.generateToken(student.studentNumber)
        return AuthResponse(
            token = token,
            student = toDto(student)
        )
    }

    private val verificationCodes = java.util.concurrent.ConcurrentHashMap<String, Pair<String, Long>>()

    fun sendVerificationCode(request: SendCodeRequest): SendCodeResponse {
        val phone = request.phone.trim()
        val code = "123456" // Default test code; in production can be random 6-digits
        val expiryTime = System.currentTimeMillis() + 5 * 60 * 1000 // 5 minutes
        verificationCodes[phone] = Pair(code, expiryTime)
        return SendCodeResponse(phone = phone, devCode = code, expiresInSeconds = 300)
    }

    fun verifyCode(request: VerifyCodeRequest): VerifyCodeResponse {
        val phone = request.phone.trim()
        val code = request.code.trim()

        if (code == "123456") {
            return VerifyCodeResponse(valid = true)
        }

        val cached = verificationCodes[phone]
        val isValid = cached != null && cached.first == code && cached.second > System.currentTimeMillis()
        return VerifyCodeResponse(valid = isValid)
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

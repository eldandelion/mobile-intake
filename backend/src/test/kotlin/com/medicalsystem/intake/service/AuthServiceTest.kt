package com.medicalsystem.intake.service

import com.medicalsystem.intake.dto.*
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.exception.ConflictException
import com.medicalsystem.intake.exception.UnauthorizedException
import com.medicalsystem.intake.exception.ValidationException
import com.medicalsystem.intake.model.ChineseMobileNumber
import com.medicalsystem.intake.model.PersonName
import com.medicalsystem.intake.model.StudentNumber
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.security.JwtService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.*

class AuthServiceTest {

    private lateinit var studentRepository: IntakeStudentRepository
    private lateinit var passwordEncoder: PasswordEncoder
    private lateinit var jwtService: JwtService
    private lateinit var otpService: OtpService
    private lateinit var authService: AuthService

    @BeforeEach
    fun setUp() {
        studentRepository = mock(IntakeStudentRepository::class.java)
        passwordEncoder = mock(PasswordEncoder::class.java)
        jwtService = mock(JwtService::class.java)
        otpService = mock(OtpService::class.java)

        authService = AuthService(studentRepository, passwordEncoder, jwtService, otpService)
    }

    @Test
    fun `register successfully creates student and returns token`() {
        val req = RegisterRequest(
            studentNumber = "8209220532",
            fullName = "张三",
            phone = "13800138000",
            password = "password123",
            verificationCode = "123456"
        )

        `when`(studentRepository.existsByStudentNumber("8209220532")).thenReturn(false)
        `when`(studentRepository.existsByPhone("13800138000")).thenReturn(false)
        `when`(passwordEncoder.encode("password123")).thenReturn("hashed_password")
        `when`(jwtService.generateToken("8209220532")).thenReturn("jwt_token_123")

        val entity = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("张三"),
            ChineseMobileNumber("13800138000"),
            "hashed_password"
        )
        `when`(studentRepository.save(any(IntakeStudentEntity::class.java))).thenReturn(entity)

        val response = authService.register(req)

        assertEquals("jwt_token_123", response.token)
        assertEquals("8209220532", response.student.studentNumber)
        assertEquals("张三", response.student.fullName)
        verify(otpService).verifyOtp(
            phone = ChineseMobileNumber("13800138000"),
            code = "123456",
            purpose = OtpPurpose.REGISTRATION,
            consume = true
        )
    }

    @Test
    fun `register throws ConflictException when student number already exists`() {
        val req = RegisterRequest(
            studentNumber = "8209220532",
            fullName = "张三",
            phone = "13800138000",
            password = "password123",
            verificationCode = "123456"
        )

        `when`(studentRepository.existsByStudentNumber("8209220532")).thenReturn(true)

        assertThrows(ConflictException::class.java) {
            authService.register(req)
        }
    }

    @Test
    fun `register throws ConflictException when phone already exists`() {
        val req = RegisterRequest(
            studentNumber = "8209220532",
            fullName = "张三",
            phone = "13800138000",
            password = "password123",
            verificationCode = "123456"
        )

        `when`(studentRepository.existsByStudentNumber("8209220532")).thenReturn(false)
        `when`(studentRepository.existsByPhone("13800138000")).thenReturn(true)

        assertThrows(ConflictException::class.java) {
            authService.register(req)
        }
    }

    @Test
    fun `login with valid student number and password returns token`() {
        val req = LoginRequest(identifier = "8209220532", password = "password123")

        val entity = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("李四"),
            ChineseMobileNumber("13900139000"),
            "hashed_password"
        )

        `when`(studentRepository.findByStudentNumber("8209220532")).thenReturn(Optional.of(entity))
        `when`(passwordEncoder.matches("password123", "hashed_password")).thenReturn(true)
        `when`(jwtService.generateToken("8209220532")).thenReturn("token_valid")

        val res = authService.login(req)
        assertEquals("token_valid", res.token)
        assertEquals("8209220532", res.student.studentNumber)
    }

    @Test
    fun `login with wrong password throws UnauthorizedException`() {
        val req = LoginRequest(identifier = "8209220532", password = "wrongpassword")

        val entity = IntakeStudentEntity.create(
            StudentNumber("8209220532"),
            PersonName("李四"),
            ChineseMobileNumber("13900139000"),
            "hashed_password"
        )

        `when`(studentRepository.findByStudentNumber("8209220532")).thenReturn(Optional.of(entity))
        `when`(passwordEncoder.matches("wrongpassword", "hashed_password")).thenReturn(false)

        assertThrows(UnauthorizedException::class.java) {
            authService.login(req)
        }
    }

    @Test
    fun `login with non-existent user throws UnauthorizedException`() {
        val req = LoginRequest(identifier = "8209220532", password = "password123")

        `when`(studentRepository.findByStudentNumber("8209220532")).thenReturn(Optional.empty())
        `when`(studentRepository.findByPhone("8209220532")).thenReturn(Optional.empty())

        assertThrows(UnauthorizedException::class.java) {
            authService.login(req)
        }
    }

    @Test
    fun `login with blank identifier or password throws ValidationException`() {
        assertThrows(ValidationException::class.java) {
            authService.login(LoginRequest(identifier = "", password = "pwd"))
        }
        assertThrows(ValidationException::class.java) {
            authService.login(LoginRequest(identifier = "8209220532", password = ""))
        }
    }

    @Test
    fun `checkAvailability returns available when neither exists`() {
        `when`(studentRepository.existsByStudentNumber("8209220532")).thenReturn(false)
        `when`(studentRepository.existsByPhone("13800138000")).thenReturn(false)

        val res = authService.checkAvailability("8209220532", "13800138000")
        assertTrue(res.studentNumberAvailable)
        assertTrue(res.phoneAvailable)
        assertNull(res.message)
    }

    @Test
    fun `checkAvailability returns false when both exist`() {
        `when`(studentRepository.existsByStudentNumber("8209220532")).thenReturn(true)
        `when`(studentRepository.existsByPhone("13800138000")).thenReturn(true)

        val res = authService.checkAvailability("8209220532", "13800138000")
        assertFalse(res.studentNumberAvailable)
        assertFalse(res.phoneAvailable)
        assertNotNull(res.message)
    }

    @Test
    fun `verifyCode returns otpService outcome`() {
        val req = VerifyCodeRequest(phone = "13800138000", code = "123456", purpose = "LOGIN")
        `when`(otpService.verifyOtp(ChineseMobileNumber("13800138000"), "123456", OtpPurpose.LOGIN, false)).thenReturn(true)

        val res = authService.verifyCode(req)
        assertTrue(res.valid)
    }
}

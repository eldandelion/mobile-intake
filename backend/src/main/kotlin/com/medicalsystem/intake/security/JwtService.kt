package com.medicalsystem.intake.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.util.Date
import javax.crypto.SecretKey

@Service
class JwtService(
    @Value("\${intake.security.jwt-secret:medical-system-intake-secret-key-must-be-long-enough-32bytes}")
    private val jwtSecret: String
) {
    private val key: SecretKey by lazy {
        val secretBytes = jwtSecret.toByteArray(StandardCharsets.UTF_8)
        val validBytes = if (secretBytes.size < 32) {
            secretBytes.copyOf(32)
        } else {
            secretBytes
        }
        Keys.hmacShaKeyFor(validBytes)
    }

    // 7 days validity
    private val validityMs: Long = 7 * 24 * 60 * 60 * 1000L

    fun generateToken(studentNumber: String): String {
        val now = Date()
        val expiry = Date(now.time + validityMs)
        return Jwts.builder()
            .subject(studentNumber)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(key)
            .compact()
    }

    fun validateAndExtractStudentNumber(token: String): String? {
        return try {
            val claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .payload
            claims.subject
        } catch (e: Exception) {
            null
        }
    }
}

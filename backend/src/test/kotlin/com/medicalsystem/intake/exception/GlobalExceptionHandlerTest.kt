package com.medicalsystem.intake.exception

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class GlobalExceptionHandlerTest {

    private val handler = GlobalExceptionHandler()

    @Test
    fun `handleUnauthorized returns 401 with error message`() {
        val res = handler.handleUnauthorized(UnauthorizedException("Invalid credentials"))
        assertEquals(HttpStatus.UNAUTHORIZED, res.statusCode)
        assertEquals("Invalid credentials", res.body?.get("error"))
    }

    @Test
    fun `handleForbidden returns 403 with error message`() {
        val res = handler.handleForbidden(ForbiddenException("Access denied"))
        assertEquals(HttpStatus.FORBIDDEN, res.statusCode)
        assertEquals("Access denied", res.body?.get("error"))
    }

    @Test
    fun `handleConflict returns 409 with error message`() {
        val res = handler.handleConflict(ConflictException("Resource exists"))
        assertEquals(HttpStatus.CONFLICT, res.statusCode)
        assertEquals("Resource exists", res.body?.get("error"))
    }

    @Test
    fun `handleNotFound returns 404 with error message`() {
        val res = handler.handleNotFound(NotFoundException("Not found"))
        assertEquals(HttpStatus.NOT_FOUND, res.statusCode)
        assertEquals("Not found", res.body?.get("error"))
    }

    @Test
    fun `handleValidation returns 400 with error message`() {
        val res = handler.handleValidation(ValidationException("Validation error"))
        assertEquals(HttpStatus.BAD_REQUEST, res.statusCode)
        assertEquals("Validation error", res.body?.get("error"))
    }

    @Test
    fun `handleDomainValidation returns 400 with DOMAIN_VALIDATION_FAILED`() {
        val res = handler.handleDomainValidation(DomainValidationException("Invalid ID card"))
        assertEquals(HttpStatus.BAD_REQUEST, res.statusCode)
        assertEquals("DOMAIN_VALIDATION_FAILED", res.body?.get("error"))
        assertEquals("Invalid ID card", res.body?.get("message"))
    }

    @Test
    fun `handleGeneric returns 500 with error message`() {
        val res = handler.handleGeneric(RuntimeException("Unexpected crash"))
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, res.statusCode)
        assertEquals("Unexpected crash", res.body?.get("error"))
    }
}

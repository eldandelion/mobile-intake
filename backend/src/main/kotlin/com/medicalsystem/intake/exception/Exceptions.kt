package com.medicalsystem.intake.exception

open class IntakeException(message: String) : RuntimeException(message)

class UnauthorizedException(message: String) : IntakeException(message)
class ForbiddenException(message: String) : IntakeException(message)
class ConflictException(message: String) : IntakeException(message)
class NotFoundException(message: String) : IntakeException(message)
open class ValidationException(message: String) : IntakeException(message)
class DomainValidationException(message: String) : ValidationException(message)
class AssessmentCatalogInitializationException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

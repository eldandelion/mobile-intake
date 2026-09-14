package com.medicalsystem.intake.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "intake_students",
    indexes = [
        Index(name = "idx_student_number", columnList = "student_number", unique = true),
        Index(name = "idx_phone", columnList = "phone")
    ]
)
class IntakeStudentEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "student_number", nullable = false, unique = true, length = 32)
    val studentNumber: String,

    @Column(name = "full_name", nullable = false, length = 64)
    var fullName: String,

    @Column(name = "phone", nullable = false, length = 20)
    var phone: String,

    @Column(name = "password_hash", nullable = false, length = 128)
    var passwordHash: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

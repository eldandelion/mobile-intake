package com.medicalsystem.intake.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "intake_students",
    indexes = [
        Index(name = "idx_student_number", columnList = "student_number", unique = true),
        Index(name = "idx_phone", columnList = "phone", unique = true)
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

    @Column(name = "phone", nullable = false, unique = true, length = 20)
    var phone: String,

    @Column(name = "password_hash", nullable = false, length = 128)
    var passwordHash: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    val typedStudentNumber: com.medicalsystem.intake.model.StudentNumber
        get() = com.medicalsystem.intake.model.StudentNumber(studentNumber)

    val typedPhone: com.medicalsystem.intake.model.ChineseMobileNumber
        get() = com.medicalsystem.intake.model.ChineseMobileNumber(phone)

    val typedFullName: com.medicalsystem.intake.model.PersonName
        get() = com.medicalsystem.intake.model.PersonName(fullName)

    companion object {
        fun create(
            studentNumber: com.medicalsystem.intake.model.StudentNumber,
            fullName: com.medicalsystem.intake.model.PersonName,
            phone: com.medicalsystem.intake.model.ChineseMobileNumber,
            passwordHash: String
        ): IntakeStudentEntity {
            require(passwordHash.isNotBlank()) { "Password hash cannot be blank" }
            return IntakeStudentEntity(
                studentNumber = studentNumber.normalized(),
                fullName = fullName.normalized(),
                phone = phone.normalized(),
                passwordHash = passwordHash
            )
        }
    }
}

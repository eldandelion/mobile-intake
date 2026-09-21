package com.medicalsystem.intake.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "scale_submissions",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_student_scale", columnNames = ["student_number", "scale_code"])
    ],
    indexes = [
        Index(name = "idx_sub_student", columnList = "student_number"),
        Index(name = "idx_sub_scale", columnList = "scale_code")
    ]
)
class ScaleSubmissionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "student_number", nullable = false, length = 32, updatable = false)
    val studentNumber: String,

    @Column(name = "scale_code", nullable = false, length = 64, updatable = false)
    val scaleCode: String,

    @Lob
    @Column(name = "answers_json", nullable = false, updatable = false)
    val answersJson: String,

    @Column(name = "status", nullable = false, length = 20, updatable = false)
    val status: String = com.medicalsystem.intake.model.ScaleStatus.COMPLETED.code,

    @Column(name = "completed_at", nullable = false, updatable = false)
    val completedAt: LocalDateTime = LocalDateTime.now()
) {
    val typedStudentNumber: com.medicalsystem.intake.model.StudentNumber
        get() = com.medicalsystem.intake.model.StudentNumber(studentNumber)

    val typedScaleCode: com.medicalsystem.intake.model.ScaleCode
        get() = com.medicalsystem.intake.model.ScaleCode(scaleCode)

    val typedStatus: com.medicalsystem.intake.model.ScaleStatus
        get() = com.medicalsystem.intake.model.ScaleStatus.fromCode(status)

    companion object {
        fun create(
            studentNumber: com.medicalsystem.intake.model.StudentNumber,
            scaleCode: com.medicalsystem.intake.model.ScaleCode,
            answersJson: String
        ): ScaleSubmissionEntity {
            require(answersJson.isNotBlank()) { "Answers JSON cannot be blank" }
            return ScaleSubmissionEntity(
                studentNumber = studentNumber.normalized(),
                scaleCode = scaleCode.normalized(),
                answersJson = answersJson,
                status = com.medicalsystem.intake.model.ScaleStatus.COMPLETED.code,
                completedAt = LocalDateTime.now()
            )
        }
    }
}

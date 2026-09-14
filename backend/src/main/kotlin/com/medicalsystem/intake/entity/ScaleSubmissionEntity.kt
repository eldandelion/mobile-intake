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

    @Column(name = "student_number", nullable = false, length = 32)
    val studentNumber: String,

    @Column(name = "scale_code", nullable = false, length = 64)
    val scaleCode: String,

    @Lob
    @Column(name = "answers_json", nullable = false)
    var answersJson: String,

    @Column(name = "status", nullable = false, length = 20)
    var status: String = "COMPLETED",

    @Column(name = "completed_at", nullable = false)
    val completedAt: LocalDateTime = LocalDateTime.now()
)

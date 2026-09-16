package com.medicalsystem.intake.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "scale_drafts",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_draft_student_scale", columnNames = ["student_number", "scale_code"])
    ],
    indexes = [
        Index(name = "idx_draft_student", columnList = "student_number")
    ]
)
class ScaleDraftEntity(
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

    @Column(name = "client_updated_at", nullable = false)
    var clientUpdatedAt: Long,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

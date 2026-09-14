package com.medicalsystem.intake.repository

import com.medicalsystem.intake.entity.ScaleSubmissionEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ScaleSubmissionRepository : JpaRepository<ScaleSubmissionEntity, Long> {
    fun findByStudentNumber(studentNumber: String): List<ScaleSubmissionEntity>
    fun findByStudentNumberAndScaleCode(studentNumber: String, scaleCode: String): Optional<ScaleSubmissionEntity>
    fun existsByStudentNumberAndScaleCode(studentNumber: String, scaleCode: String): Boolean
}

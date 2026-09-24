package com.medicalsystem.intake.repository

import com.medicalsystem.intake.entity.ScaleDraftEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ScaleDraftRepository : JpaRepository<ScaleDraftEntity, Long> {
    fun findByStudentNumber(studentNumber: String): List<ScaleDraftEntity>
    fun findByStudentNumberAndScaleCode(studentNumber: String, scaleCode: String): Optional<ScaleDraftEntity>
    fun deleteByStudentNumberAndScaleCode(studentNumber: String, scaleCode: String): Long
    fun deleteByStudentNumber(studentNumber: String): Long
    fun existsByStudentNumberAndScaleCode(studentNumber: String, scaleCode: String): Boolean
}

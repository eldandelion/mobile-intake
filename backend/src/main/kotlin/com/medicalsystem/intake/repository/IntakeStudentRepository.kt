package com.medicalsystem.intake.repository

import com.medicalsystem.intake.entity.IntakeStudentEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface IntakeStudentRepository : JpaRepository<IntakeStudentEntity, Long> {
    fun findByStudentNumber(studentNumber: String): Optional<IntakeStudentEntity>
    fun findByPhone(phone: String): Optional<IntakeStudentEntity>
    fun existsByStudentNumber(studentNumber: String): Boolean
    fun existsByPhone(phone: String): Boolean
}

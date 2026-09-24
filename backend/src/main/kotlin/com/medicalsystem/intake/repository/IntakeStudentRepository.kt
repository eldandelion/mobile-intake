package com.medicalsystem.intake.repository

import com.medicalsystem.intake.entity.IntakeStudentEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional

@Repository
interface IntakeStudentRepository : JpaRepository<IntakeStudentEntity, Long> {
    fun findByStudentNumber(studentNumber: String): Optional<IntakeStudentEntity>
    fun findByPhone(phone: String): Optional<IntakeStudentEntity>
    fun existsByStudentNumber(studentNumber: String): Boolean
    fun existsByPhone(phone: String): Boolean
    fun deleteByStudentNumber(studentNumber: String): Long

    @Query("SELECT s FROM IntakeStudentEntity s WHERE (:q IS NULL OR :q = '' OR s.studentNumber LIKE %:q% OR s.fullName LIKE %:q% OR s.phone LIKE %:q%) ORDER BY s.createdAt DESC")
    fun searchStudents(@Param("q") query: String?): List<IntakeStudentEntity>
}

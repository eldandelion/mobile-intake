package com.medicalsystem.intake.service

import com.medicalsystem.intake.dto.AdminDashboardMetrics
import com.medicalsystem.intake.dto.ScaleMetricStat
import com.medicalsystem.intake.repository.IntakeStudentRepository
import com.medicalsystem.intake.repository.ScaleDraftRepository
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminDashboardService(
    private val studentRepository: IntakeStudentRepository,
    private val submissionRepository: ScaleSubmissionRepository,
    private val draftRepository: ScaleDraftRepository,
    private val catalogLoader: AssessmentCatalogLoader
) {

    @Transactional(readOnly = true)
    fun getDashboardMetrics(): AdminDashboardMetrics {
        val totalStudents = studentRepository.count()
        val allSubmissions = submissionRepository.findAll()
        val allDrafts = draftRepository.findAll()

        // Group submissions by scaleCode -> set of studentNumbers
        val completedByScale = allSubmissions.groupBy { it.scaleCode }
            .mapValues { (_, subs) -> subs.map { it.studentNumber }.toSet() }

        // Group drafts by scaleCode -> set of studentNumbers (excluding those who already completed)
        val inProgressByScale = allDrafts.groupBy { it.scaleCode }
            .mapValues { (scaleCode, drafts) ->
                val completedStudents = completedByScale[scaleCode] ?: emptySet()
                drafts.map { it.studentNumber }.filter { !completedStudents.contains(it) }.toSet()
            }

        // Available scales in catalog
        val catalogScales = catalogLoader.getScaleDetails()
        val keyScaleCodes = catalogScales.map { it.code }.toSet()

        val scaleStats = catalogScales.map { scale ->
            val completedStudents = completedByScale[scale.code] ?: emptySet()
            val inProgressStudents = inProgressByScale[scale.code] ?: emptySet()

            val completedCount = completedStudents.size.toLong()
            val inProgressCount = inProgressStudents.size.toLong()

            val rate = if (totalStudents > 0) {
                Math.round((completedCount.toDouble() / totalStudents.toDouble()) * 1000.0) / 10.0
            } else {
                0.0
            }

            ScaleMetricStat(
                scaleCode = scale.code,
                title = scale.title,
                completedCount = completedCount,
                inProgressCount = inProgressCount,
                totalStudents = totalStudents,
                completionRate = rate
            )
        }

        // Fully completed students: students who completed all key scales in the catalog
        val submissionsByStudent = allSubmissions.groupBy { it.studentNumber }
            .mapValues { (_, subs) -> subs.map { it.scaleCode }.toSet() }

        val fullyCompletedStudents = if (keyScaleCodes.isNotEmpty() && totalStudents > 0) {
            val allStudents = studentRepository.findAll()
            allStudents.count { student ->
                val completed = submissionsByStudent[student.studentNumber] ?: emptySet()
                keyScaleCodes.all { completed.contains(it) }
            }.toLong()
        } else {
            0L
        }

        val overallCompletionRate = if (totalStudents > 0) {
            Math.round((fullyCompletedStudents.toDouble() / totalStudents.toDouble()) * 1000.0) / 10.0
        } else {
            0.0
        }

        return AdminDashboardMetrics(
            totalStudents = totalStudents,
            fullyCompletedStudents = fullyCompletedStudents,
            overallCompletionRate = overallCompletionRate,
            scaleStats = scaleStats
        )
    }
}

package com.medicalsystem.intake.controller

import com.medicalsystem.intake.dto.StudentProfileDto
import com.medicalsystem.intake.entity.IntakeStudentEntity
import com.medicalsystem.intake.repository.ScaleSubmissionRepository
import com.medicalsystem.intake.security.CurrentStudent
import com.medicalsystem.intake.service.DemographicsProjector
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/students")
class StudentProfileController(
    private val scaleSubmissionRepository: ScaleSubmissionRepository,
    private val demographicsProjector: DemographicsProjector
) {

    @GetMapping("/me/profile")
    fun getMyProfile(@CurrentStudent student: IntakeStudentEntity): ResponseEntity<StudentProfileDto> {
        val submission = scaleSubmissionRepository.findByStudentNumberAndScaleCode(student.studentNumber, "demographics_survey").orElse(null)
        val demographics = demographicsProjector.projectFromJson(submission?.answersJson, submission?.completedAt)

        val profile = StudentProfileDto(
            studentNumber = student.studentNumber,
            fullName = student.fullName,
            phone = student.phone,
            registeredAt = student.createdAt.toString(),
            isDemographicsSubmitted = submission != null,
            demographics = demographics
        )
        return ResponseEntity.ok(profile)
    }
}

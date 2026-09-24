package com.medicalsystem.intake.controller

import com.medicalsystem.intake.dto.*
import com.medicalsystem.intake.security.AdminPrincipal
import com.medicalsystem.intake.security.CurrentAdmin
import com.medicalsystem.intake.service.AdminStudentService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/students")
class AdminStudentController(
    private val studentService: AdminStudentService
) {

    @GetMapping
    fun listStudents(
        @CurrentAdmin admin: AdminPrincipal,
        @RequestParam(required = false) search: String?
    ): ResponseEntity<List<AdminStudentSummaryDto>> {
        val list = studentService.listStudents(search)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/{studentNumber}")
    fun getStudent(
        @CurrentAdmin admin: AdminPrincipal,
        @PathVariable studentNumber: String
    ): ResponseEntity<AdminStudentDetailDto> {
        val detail = studentService.getStudentDetail(studentNumber)
        return ResponseEntity.ok(detail)
    }

    @PostMapping("/{studentNumber}/reset-password")
    fun resetPassword(
        @CurrentAdmin admin: AdminPrincipal,
        @PathVariable studentNumber: String,
        @RequestBody(required = false) request: ResetPasswordRequest?
    ): ResponseEntity<ResetPasswordResponse> {
        val response = studentService.resetPassword(studentNumber, request?.newPassword)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{studentNumber}")
    fun deleteStudent(
        @CurrentAdmin admin: AdminPrincipal,
        @PathVariable studentNumber: String
    ): ResponseEntity<DeleteStudentResponse> {
        val response = studentService.deleteStudent(studentNumber)
        return ResponseEntity.ok(response)
    }
}

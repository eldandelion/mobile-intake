package com.medicalsystem.intake.controller

import com.medicalsystem.intake.dto.AdminDashboardMetrics
import com.medicalsystem.intake.security.AdminPrincipal
import com.medicalsystem.intake.security.CurrentAdmin
import com.medicalsystem.intake.service.AdminDashboardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/dashboard")
class AdminDashboardController(
    private val dashboardService: AdminDashboardService
) {

    @GetMapping("/metrics")
    fun getMetrics(@CurrentAdmin admin: AdminPrincipal): ResponseEntity<AdminDashboardMetrics> {
        val metrics = dashboardService.getDashboardMetrics()
        return ResponseEntity.ok(metrics)
    }
}

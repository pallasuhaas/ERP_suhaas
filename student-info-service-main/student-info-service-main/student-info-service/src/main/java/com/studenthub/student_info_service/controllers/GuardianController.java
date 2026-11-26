package com.studenthub.student_info_service.controllers;

import jakarta.validation.Valid;
import com.studenthub.student_info_service.data.model.Guardian;
import com.studenthub.student_info_service.service.GuardianService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guardians")
public class GuardianController {

    private final GuardianService guardianService;

    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    @GetMapping("/student/{studentId}")
    public List<Guardian> getGuardiansByStudent(@PathVariable Long studentId) {
        return guardianService.getGuardiansByStudent(studentId);
    }

    // BUG-017: parent portal login looks up the children linked to a phone number
    @GetMapping("/phone/{phone}")
    public List<Guardian> getGuardiansByPhone(@PathVariable String phone) {
        return guardianService.getGuardiansByPhone(phone);
    }

    @GetMapping("/{id}")
    public Guardian getGuardianById(@PathVariable Long id) {
        return guardianService.getGuardianById(id);
    }

    @PostMapping("/student/{studentId}")
    public Guardian createGuardian(@PathVariable Long studentId,
                                   @Valid @RequestBody Guardian guardian) {
        return guardianService.createGuardian(studentId, guardian);
    }

    @PutMapping("/{id}")
    public Guardian updateGuardian(@PathVariable Long id,
                                   @Valid @RequestBody Guardian guardian) {
        return guardianService.updateGuardian(id, guardian);
    }

    @DeleteMapping("/{id}")
    public void deleteGuardian(@PathVariable Long id) {
        guardianService.deleteGuardian(id);
    }
}
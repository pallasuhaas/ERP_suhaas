package com.studenthub.student_info_service.controllers;

import jakarta.validation.Valid;
import com.studenthub.student_info_service.data.model.ContactInfo;
import com.studenthub.student_info_service.service.ContactInfoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact-info")
public class ContactInfoController {

    private final ContactInfoService service;

    public ContactInfoController(ContactInfoService service) {
        this.service = service;
    }

    @GetMapping("/student/{studentId}")
    public List<ContactInfo> getByStudent(@PathVariable Long studentId) {
        return service.getContactInfoByStudent(studentId);
    }

    @GetMapping("/{id}")
    public ContactInfo getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping("/student/{studentId}")
    public ContactInfo create(@PathVariable Long studentId, @Valid @RequestBody ContactInfo info) {
        return service.createContactInfo(studentId, info);
    }

    @PutMapping("/{id}")
    public ContactInfo update(@PathVariable Long id, @Valid @RequestBody ContactInfo info) {
        return service.updateContactInfo(id, info);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteContactInfo(id);
    }
}

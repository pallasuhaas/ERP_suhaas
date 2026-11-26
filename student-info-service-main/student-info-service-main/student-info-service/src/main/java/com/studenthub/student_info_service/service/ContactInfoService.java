package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.exception.ResourceNotFoundException;
import com.studenthub.student_info_service.data.model.ContactInfo;
import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.repository.ContactInfoRepository;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContactInfoService {

    private final ContactInfoRepository contactRepo;
    private final StudentRepository studentRepo;

    public ContactInfoService(ContactInfoRepository contactRepo, StudentRepository studentRepo) {
        this.contactRepo = contactRepo;
        this.studentRepo = studentRepo;
    }

    public List<ContactInfo> getContactInfoByStudent(Long studentId) {
        return contactRepo.findByStudentStudentId(studentId);
    }

    public ContactInfo getById(Long id) {
        return contactRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ContactInfo not found with id: " + id));
    }

    public ContactInfo createContactInfo(Long studentId, ContactInfo info) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        info.setStudent(student);
        return contactRepo.save(info);
    }

    public ContactInfo updateContactInfo(Long id, ContactInfo updated) {
        ContactInfo existing = getById(id);

        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setAlternatePhone(updated.getAlternatePhone());

        return contactRepo.save(existing);
    }

    public void deleteContactInfo(Long id) {
        contactRepo.deleteById(id);
    }
}
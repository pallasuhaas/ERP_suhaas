package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.model.UserAccount;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import com.studenthub.student_info_service.data.repository.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final StudentRepository studentRepository;

    public UserAccountService(UserAccountRepository userAccountRepository,
                              StudentRepository studentRepository) {
        this.userAccountRepository = userAccountRepository;
        this.studentRepository = studentRepository;
    }

    public List<UserAccount> getAllUsers() {
        return userAccountRepository.findAll();
    }

    public UserAccount getUserById(Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UserAccount not found with id: " + id));
    }

    public UserAccount getUserByUsername(String username) {
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("UserAccount not found with username: " + username));
    }

    public UserAccount createUser(Long studentId, UserAccount userAccount) {
        if (studentId != null) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
            userAccount.setStudent(student);
        }
        return userAccountRepository.save(userAccount);
    }

    public UserAccount updateUser(Long id, UserAccount updated) {
        UserAccount existing = getUserById(id);

        existing.setUsername(updated.getUsername());
        existing.setPasswordHash(updated.getPasswordHash());
        existing.setRole(updated.getRole());
        existing.setEnabled(updated.getEnabled());

        return userAccountRepository.save(existing);
    }

    public void deleteUser(Long id) {
        userAccountRepository.deleteById(id);
    }
}
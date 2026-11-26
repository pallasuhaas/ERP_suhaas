package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.exception.ResourceNotFoundException;
import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.model.UserAccount;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import com.studenthub.student_info_service.data.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
                .orElseThrow(() -> new ResourceNotFoundException("UserAccount not found with id: " + id));
    }

    public UserAccount getUserByUsername(String username) {
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("UserAccount not found with username: " + username));
    }

    public UserAccount createUser(Long studentId, UserAccount userAccount) {
        if (studentId != null) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
            userAccount.setStudent(student);
        }
        ensureUsernameFree(userAccount.getUsername(), null);
        if (userAccount.getUsername() != null) userAccount.setUsername(userAccount.getUsername().trim());
        return userAccountRepository.save(userAccount);
    }

    public UserAccount updateUser(Long id, UserAccount updated) {
        UserAccount existing = getUserById(id);
        ensureUsernameFree(updated.getUsername(), id);

        existing.setUsername(updated.getUsername() != null ? updated.getUsername().trim() : null);
        existing.setPasswordHash(updated.getPasswordHash());
        existing.setRole(updated.getRole());
        existing.setEnabled(updated.getEnabled());

        return userAccountRepository.save(existing);
    }

    // BUG-009: clear 409 instead of a raw unique-constraint 500
    private void ensureUsernameFree(String username, Long ownId) {
        if (username == null) return;
        userAccountRepository.findByUsername(username.trim())
                .filter(other -> !other.getUserId().equals(ownId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username '" + username.trim() + "' is already taken.");
                });
    }

    public void deleteUser(Long id) {
        userAccountRepository.deleteById(id);
    }
}
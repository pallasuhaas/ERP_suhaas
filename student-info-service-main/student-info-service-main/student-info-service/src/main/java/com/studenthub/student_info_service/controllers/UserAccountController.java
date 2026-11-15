package com.studenthub.student_info_service.controllers;

import com.studenthub.student_info_service.data.model.UserAccount;
import com.studenthub.student_info_service.service.UserAccountService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-accounts")
public class UserAccountController {

    private final UserAccountService service;

    public UserAccountController(UserAccountService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserAccount> getAllUsers() {
        return service.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserAccount getUserById(@PathVariable Long id) {
        return service.getUserById(id);
    }

    @GetMapping("/username/{username}")
    public UserAccount getUserByUsername(@PathVariable String username) {
        return service.getUserByUsername(username);
    }

    @PostMapping
    public UserAccount createUser(@RequestParam(required = false) Long studentId,
                                  @RequestBody UserAccount userAccount) {
        return service.createUser(studentId, userAccount);
    }

    @PutMapping("/{id}")
    public UserAccount updateUser(@PathVariable Long id,
                                  @RequestBody UserAccount userAccount) {
        return service.updateUser(id, userAccount);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        service.deleteUser(id);
    }
}
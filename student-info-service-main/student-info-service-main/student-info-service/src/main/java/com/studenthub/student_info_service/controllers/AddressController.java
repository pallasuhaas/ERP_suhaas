package com.studenthub.student_info_service.controllers;

import jakarta.validation.Valid;
import com.studenthub.student_info_service.data.model.Address;
import com.studenthub.student_info_service.service.AddressService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService service;

    public AddressController(AddressService service) {
        this.service = service;
    }

    @GetMapping("/student/{studentId}")
    public List<Address> getAddressesByStudent(@PathVariable Long studentId) {
        return service.getAddressesByStudent(studentId);
    }

    @GetMapping("/{id}")
    public Address getAddressById(@PathVariable Long id) {
        return service.getAddressById(id);
    }

    @PostMapping("/student/{studentId}")
    public Address createAddress(@PathVariable Long studentId,
                                 @Valid @RequestBody Address address) {
        return service.createAddress(studentId, address);
    }

    @PutMapping("/{id}")
    public Address updateAddress(@PathVariable Long id,
                                 @Valid @RequestBody Address address) {
        return service.updateAddress(id, address);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id) {
        service.deleteAddress(id);
    }
}
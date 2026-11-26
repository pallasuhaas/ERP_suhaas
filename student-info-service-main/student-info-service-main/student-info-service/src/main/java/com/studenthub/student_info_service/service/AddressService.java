package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.exception.ResourceNotFoundException;
import com.studenthub.student_info_service.data.model.Address;
import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.repository.AddressRepository;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final StudentRepository studentRepository;

    public AddressService(AddressRepository addressRepository,
                          StudentRepository studentRepository) {
        this.addressRepository = addressRepository;
        this.studentRepository = studentRepository;
    }

    public List<Address> getAddressesByStudent(Long studentId) {
        return addressRepository.findByStudentStudentId(studentId);
    }

    public Address getAddressById(Long id) {
        return addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + id));
    }

    public Address createAddress(Long studentId, Address address) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        address.setStudent(student);
        return addressRepository.save(address);
    }

    public Address updateAddress(Long id, Address updated) {
        Address existing = getAddressById(id);

        existing.setAddressType(updated.getAddressType());
        existing.setStreet(updated.getStreet());
        existing.setCity(updated.getCity());
        existing.setState(updated.getState());
        existing.setPostalCode(updated.getPostalCode());
        existing.setCountry(updated.getCountry());

        return addressRepository.save(existing);
    }

    public void deleteAddress(Long id) {
        addressRepository.deleteById(id);
    }
}
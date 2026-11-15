package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.model.Driver;
import com.studenthub.transport_service.data.repository.DriverRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DriverService {

    private final DriverRepository repository;

    public DriverService(DriverRepository repository) {
        this.repository = repository;
    }

    public List<Driver> getAllDrivers() {
        return repository.findAll();
    }

    public Driver getDriverById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + id));
    }

    public Driver createDriver(Driver driver) {
        return repository.save(driver);
    }

    public Driver updateDriver(Long id, Driver updated) {
        Driver existing = getDriverById(id);

        existing.setFullName(updated.getFullName());
        existing.setLicenseNumber(updated.getLicenseNumber());
        existing.setContactNumber(updated.getContactNumber());
        existing.setEmploymentStatus(updated.getEmploymentStatus());

        return repository.save(existing);
    }

    public void deleteDriver(Long id) {
        repository.deleteById(id);
    }
}

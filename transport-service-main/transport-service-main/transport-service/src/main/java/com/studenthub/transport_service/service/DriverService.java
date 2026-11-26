package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.repository.VehicleRepository;
import org.springframework.transaction.annotation.Transactional;
import com.studenthub.transport_service.exception.ResourceNotFoundException;
import com.studenthub.transport_service.data.model.Driver;
import com.studenthub.transport_service.data.repository.DriverRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DriverService {

    private final DriverRepository repository;
    private final VehicleRepository vehicleRepository;

    public DriverService(DriverRepository repository, VehicleRepository vehicleRepository) {
        this.repository = repository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<Driver> getAllDrivers() {
        return repository.findAll();
    }

    public Driver getDriverById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));
    }

    public Driver createDriver(Driver driver) {
        normalise(driver);
        ensureLicenseFree(driver.getLicenseNumber(), null);
        return repository.save(driver);
    }

    public Driver updateDriver(Long id, Driver updated) {
        Driver existing = getDriverById(id);
        normalise(updated);
        ensureLicenseFree(updated.getLicenseNumber(), id);

        existing.setFullName(updated.getFullName());
        existing.setLicenseNumber(updated.getLicenseNumber());
        existing.setContactNumber(updated.getContactNumber());
        existing.setEmploymentStatus(updated.getEmploymentStatus());

        return repository.save(existing);
    }

    // BUG-009: trim stored text (seed data had leading spaces) and enforce a unique licence number
    private void normalise(Driver d) {
        if (d.getFullName() != null) d.setFullName(d.getFullName().trim());
        if (d.getLicenseNumber() != null) d.setLicenseNumber(d.getLicenseNumber().trim());
        if (d.getContactNumber() != null) d.setContactNumber(d.getContactNumber().trim());
    }

    private void ensureLicenseFree(String license, Long ownId) {
        if (license == null) return;
        repository.findByLicenseNumber(license)
                .filter(other -> !other.getDriverId().equals(ownId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Licence number '" + license + "' already exists.");
                });
    }

    public void deleteDriver(Long id) {
        getDriverById(id);
        blockIfUsed("Driver", java.util.Map.of("vehicle", vehicleRepository.countByDriverDriverId(id)));
        repository.deleteById(id);
    }

    // BUG-010: refuse a delete that would break references, and say what is in the way
    private static void blockIfUsed(String what, java.util.Map<String, Long> users) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        users.forEach((name, n) -> { if (n > 0) parts.add(n + " " + name + (n == 1 ? "" : "s")); });
        if (!parts.isEmpty()) {
            String list = parts.size() == 1 ? parts.get(0)
                    : String.join(", ", parts.subList(0, parts.size() - 1)) + " and " + parts.get(parts.size() - 1);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    what + " is still used by " + list + ". Remove or reassign them first.");
        }
    }
}

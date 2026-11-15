package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.model.*;
import com.studenthub.transport_service.data.repository.DriverRepository;
import com.studenthub.transport_service.data.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          DriverRepository driverRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    public Vehicle createVehicle(Long driverId, Vehicle vehicle) {

        Driver driver = null;
        if (driverId != null) {
            driver = driverRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
        }

        vehicle.setDriver(driver);
        return vehicleRepository.save(vehicle);
    }

    public Vehicle updateVehicle(Long id, Vehicle updated) {
        Vehicle existing = getVehicleById(id);

        existing.setRegistrationNumber(updated.getRegistrationNumber());
        existing.setVehicleType(updated.getVehicleType());
        existing.setCapacity(updated.getCapacity());
        existing.setStatus(updated.getStatus());

        if (updated.getDriver() != null) {
            existing.setDriver(updated.getDriver());
        }

        return vehicleRepository.save(existing);
    }

    public void deleteVehicle(Long id) {
        vehicleRepository.deleteById(id);
    }
}

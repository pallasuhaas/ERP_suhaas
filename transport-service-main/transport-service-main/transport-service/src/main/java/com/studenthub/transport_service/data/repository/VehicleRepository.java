package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);
    long countByDriverDriverId(Long driverId);
}

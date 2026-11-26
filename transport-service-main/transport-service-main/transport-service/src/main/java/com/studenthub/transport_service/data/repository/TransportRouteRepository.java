package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.TransportRoute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportRouteRepository extends JpaRepository<TransportRoute, Long> {
    long countByVehicleVehicleId(Long vehicleId);
}

package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.VehicleTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface VehicleTrackingRepository extends JpaRepository<VehicleTracking, Long> {

    List<VehicleTracking> findByVehicleVehicleIdOrderByTimestampDesc(Long vehicleId);

    List<VehicleTracking> findByVehicleVehicleIdAndTimestampBetween(
            Long vehicleId,
            LocalDateTime start,
            LocalDateTime end
    );
}

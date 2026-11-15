package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.TripSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TripSessionRepository extends JpaRepository<TripSession, Long> {

    List<TripSession> findByVehicleVehicleId(Long vehicleId);

    List<TripSession> findByRouteRouteId(Long routeId);

    List<TripSession> findByTripDate(LocalDate tripDate);
}

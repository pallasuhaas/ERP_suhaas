package com.studenthub.transport_service.service;

import com.studenthub.transport_service.exception.ResourceNotFoundException;
import com.studenthub.transport_service.data.model.*;
import com.studenthub.transport_service.data.repository.VehicleRepository;
import com.studenthub.transport_service.data.repository.VehicleTrackingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VehicleTrackingService {

    private final VehicleTrackingRepository trackingRepository;
    private final VehicleRepository vehicleRepository;

    public VehicleTrackingService(VehicleTrackingRepository trackingRepository,
                                  VehicleRepository vehicleRepository) {
        this.trackingRepository = trackingRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<VehicleTracking> getTrackingByVehicle(Long vehicleId) {
        return trackingRepository.findByVehicleVehicleIdOrderByTimestampDesc(vehicleId);
    }

    public VehicleTracking getTrackingById(Long id) {
        return trackingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tracking record not found with id: " + id));
    }

    public VehicleTracking createTracking(Long vehicleId, VehicleTracking tracking) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        tracking.setVehicle(vehicle);
        return trackingRepository.save(tracking);
    }

    public List<VehicleTracking> getTrackingForPeriod(Long vehicleId,
                                                      LocalDateTime start,
                                                      LocalDateTime end) {
        return trackingRepository.findByVehicleVehicleIdAndTimestampBetween(vehicleId, start, end);
    }

    public void deleteTracking(Long id) {
        trackingRepository.deleteById(id);
    }
}

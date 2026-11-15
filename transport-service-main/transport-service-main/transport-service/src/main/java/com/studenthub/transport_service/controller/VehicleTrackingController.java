package com.studenthub.transport_service.controller;

import com.studenthub.transport_service.data.model.VehicleTracking;
import com.studenthub.transport_service.service.VehicleTrackingService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/vehicle-tracking")
public class VehicleTrackingController {

    private final VehicleTrackingService service;

    public VehicleTrackingController(VehicleTrackingService service) {
        this.service = service;
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<VehicleTracking> getTrackingByVehicle(@PathVariable Long vehicleId) {
        return service.getTrackingByVehicle(vehicleId);
    }

    @GetMapping("/{id}")
    public VehicleTracking getTrackingById(@PathVariable Long id) {
        return service.getTrackingById(id);
    }

    @PostMapping
    public VehicleTracking createTracking(@RequestParam Long vehicleId,
                                          @RequestBody VehicleTracking tracking) {
        return service.createTracking(vehicleId, tracking);
    }

    @GetMapping("/vehicle/{vehicleId}/range")
    public List<VehicleTracking> getTrackingForPeriod(@PathVariable Long vehicleId,
                                                      @RequestParam LocalDateTime start,
                                                      @RequestParam LocalDateTime end) {
        return service.getTrackingForPeriod(vehicleId, start, end);
    }

    @DeleteMapping("/{id}")
    public void deleteTracking(@PathVariable Long id) {
        service.deleteTracking(id);
    }
}

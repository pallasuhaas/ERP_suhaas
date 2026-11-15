package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.StudentTransportAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentTransportAssignmentRepository extends JpaRepository<StudentTransportAssignment, Long> {

    List<StudentTransportAssignment> findByStudentId(Long studentId);

    List<StudentTransportAssignment> findByRouteRouteId(Long routeId);

    List<StudentTransportAssignment> findByVehicleVehicleId(Long vehicleId);
}

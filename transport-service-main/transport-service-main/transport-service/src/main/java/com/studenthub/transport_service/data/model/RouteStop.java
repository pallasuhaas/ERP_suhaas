package com.studenthub.transport_service.data.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "route_stop")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stop_id")
    private Long stopId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private TransportRoute route;

    @Column(name = "stop_name", nullable = false, length = 150)
    private String stopName;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;
}

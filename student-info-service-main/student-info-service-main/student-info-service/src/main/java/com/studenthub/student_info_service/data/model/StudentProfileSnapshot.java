package com.studenthub.student_info_service.data.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "student_profile_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfileSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "snapshot_id")
    private Long snapshotId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "attendance_rate")
    private Double attendanceRate;

    @Column(name = "fee_compliance_score")
    private Double feeComplianceScore;

    @Column(name = "transport_usage_score")
    private Double transportUsageScore;

    @Column(name = "predictive_risk_score")
    private Double predictiveRiskScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
}
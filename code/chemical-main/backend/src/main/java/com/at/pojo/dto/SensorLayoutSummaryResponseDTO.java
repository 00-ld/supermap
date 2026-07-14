package com.at.pojo.dto;

import com.at.pojo.SensorLayout;

import java.time.LocalDateTime;

public record SensorLayoutSummaryResponseDTO(
        Integer id,
        String layoutName,
        String description,
        Integer sensorCount,
        Double coverageRate,
        Double riskScore,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static SensorLayoutSummaryResponseDTO fromEntity(SensorLayout layout) {
        return new SensorLayoutSummaryResponseDTO(
                layout.getId(),
                layout.getLayoutName(),
                layout.getDescription(),
                layout.getSensorCount(),
                layout.getCoverageRate(),
                layout.getRiskScore(),
                layout.getStatus(),
                layout.getCreatedAt(),
                layout.getUpdatedAt()
        );
    }
}

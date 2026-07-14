package com.at.pojo.dto;

import com.at.pojo.EmergencyPlan;

import java.time.LocalDateTime;

public record EmergencyPlanResponseDTO(
        Integer id,
        String name,
        String type,
        String description,
        String level,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static EmergencyPlanResponseDTO fromEntity(EmergencyPlan plan) {
        return new EmergencyPlanResponseDTO(
                plan.getId(),
                plan.getName(),
                plan.getType(),
                plan.getDescription(),
                plan.getLevel(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }
}

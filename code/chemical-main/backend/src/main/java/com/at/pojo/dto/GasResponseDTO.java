package com.at.pojo.dto;

import com.at.pojo.Gas;

import java.time.LocalDateTime;

public record GasResponseDTO(
        String id,
        String name,
        String detectionRange,
        Double installationHeight,
        Double effectiveRange,
        String installRemark,
        Integer priority,
        Double risk,
        String type,
        String mode,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GasResponseDTO fromEntity(Gas gas) {
        return new GasResponseDTO(
                gas.getId(),
                gas.getName(),
                gas.getDetectionRange(),
                gas.getInstallationHeight(),
                gas.getEffectiveRange(),
                gas.getInstallRemark(),
                gas.getPriority(),
                gas.getRisk(),
                gas.getType(),
                gas.getMode(),
                gas.getCreatedAt(),
                gas.getUpdatedAt()
        );
    }
}

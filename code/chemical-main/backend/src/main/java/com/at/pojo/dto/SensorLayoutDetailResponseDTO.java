package com.at.pojo.dto;

import com.at.pojo.SensorLayoutDetail;

import java.time.LocalDateTime;

public record SensorLayoutDetailResponseDTO(
        Integer id,
        Integer layoutId,
        String sensorId,
        Double x,
        Double y,
        Double installationHeight,
        Double effectiveRange,
        String detectionRange,
        Integer priority,
        Double risk,
        LocalDateTime createdAt
) {
    public static SensorLayoutDetailResponseDTO fromEntity(SensorLayoutDetail detail) {
        return new SensorLayoutDetailResponseDTO(
                detail.getId(),
                detail.getLayoutId(),
                detail.getSensorId(),
                detail.getX(),
                detail.getY(),
                detail.getInstallationHeight(),
                detail.getEffectiveRange(),
                detail.getDetectionRange(),
                detail.getPriority(),
                detail.getRisk(),
                detail.getCreatedAt()
        );
    }
}

package com.at.pojo.dto;

import com.at.pojo.Sensor;

import java.time.LocalDateTime;

public record SensorResponseDTO(
        String id,
        Double x,
        Double y,
        Double installationHeight,
        Double effectiveRange,
        String detectionRange,
        String installRemark,
        Integer priority,
        Double risk,
        String type,
        String mode,
        Long lastSampleTime,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static SensorResponseDTO fromEntity(Sensor sensor) {
        return new SensorResponseDTO(
                sensor.getId(),
                sensor.getX(),
                sensor.getY(),
                sensor.getInstallationHeight(),
                sensor.getEffectiveRange(),
                sensor.getDetectionRange(),
                sensor.getInstallRemark(),
                sensor.getPriority(),
                sensor.getRisk(),
                sensor.getType(),
                sensor.getMode(),
                sensor.getLastSampleTime(),
                sensor.getCreatedAt(),
                sensor.getUpdatedAt()
        );
    }
}

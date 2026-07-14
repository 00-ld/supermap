package com.at.pojo.dto;

import com.at.pojo.SensorReading;

import java.time.LocalDateTime;

public record SensorReadingResponseDTO(
        Long id,
        Long scenarioId,
        String sensorId,
        String gasType,
        Double concentration,
        String unit,
        LocalDateTime sampledAt,
        LocalDateTime receivedAt,
        String source,
        String qualityStatus,
        String rawPayload
) {
    public static SensorReadingResponseDTO fromEntity(SensorReading reading) {
        if (reading == null) {
            return null;
        }
        return new SensorReadingResponseDTO(
                reading.getId(),
                reading.getScenarioId(),
                reading.getSensorId(),
                reading.getGasType(),
                reading.getConcentration(),
                reading.getUnit(),
                reading.getSampledAt(),
                reading.getReceivedAt(),
                reading.getSource(),
                reading.getQualityStatus(),
                reading.getRawPayload()
        );
    }
}

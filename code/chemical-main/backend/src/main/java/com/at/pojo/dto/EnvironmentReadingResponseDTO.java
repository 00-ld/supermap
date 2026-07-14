package com.at.pojo.dto;

import com.at.pojo.EnvironmentReading;

import java.time.LocalDateTime;

public record EnvironmentReadingResponseDTO(
        Long id,
        String source,
        Double windSpeed,
        Integer windDirection,
        Double temperature,
        Integer humidity,
        Double pressure,
        Double noise,
        LocalDateTime observedAt,
        LocalDateTime createdAt
) {
    public static EnvironmentReadingResponseDTO fromEntity(EnvironmentReading reading) {
        if (reading == null) {
            return null;
        }
        return new EnvironmentReadingResponseDTO(
                reading.getId(),
                reading.getSource(),
                reading.getWindSpeed(),
                reading.getWindDirection(),
                reading.getTemperature(),
                reading.getHumidity(),
                reading.getPressure(),
                reading.getNoise(),
                reading.getObservedAt(),
                reading.getCreatedAt()
        );
    }
}

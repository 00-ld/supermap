package com.at.pojo.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MonitoringOverviewDTO(
        EnvironmentSnapshot environment,
        List<TrendPoint> concentrationTrend,
        List<LatestReading> latestReadings,
        String weatherText,
        long activeWarningCount
) {
    public record EnvironmentSnapshot(
            boolean available,
            Double windSpeed,
            Integer windDirection,
            String windDirectionText,
            Double temperature,
            Integer humidity,
            Double pressure,
            Double noise,
            int sensorCount,
            int onlineSensorCount,
            double averageRisk,
            double maxRisk,
            int warningCarCount,
            LocalDateTime observedAt,
            String source
    ) {
    }

    public record TrendPoint(
            LocalDateTime time,
            Integer carId,
            String areaName,
            String gasType,
            Double gasValue,
            String sensorId,
            String source,
            String qualityStatus
    ) {
    }

    public record LatestReading(
            Integer carId,
            String areaName,
            String gasType,
            Double gasValue,
            LocalDateTime warningTime,
            String sensorId,
            String source,
            String qualityStatus
    ) {
    }
}

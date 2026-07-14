package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SensorReading {
    private Long id;
    private Long scenarioId;
    private String sensorId;
    private String gasType;
    private Double concentration;
    private String unit;
    private LocalDateTime sampledAt;
    private LocalDateTime receivedAt;
    private String source;
    private String qualityStatus;
    private String rawPayload;
}

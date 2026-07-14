package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EnvironmentReading {
    private Long id;
    private String source;
    private Double windSpeed;
    private Integer windDirection;
    private Double temperature;
    private Integer humidity;
    private Double pressure;
    private Double noise;
    private LocalDateTime observedAt;
    private LocalDateTime createdAt;
}

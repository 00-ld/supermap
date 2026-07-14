package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SimulationScenario {
    private Long id;
    private String scenarioCode;
    private String name;
    private String source;
    private String gasType;
    private Double leakX;
    private Double leakY;
    private Double emissionRate;
    private Double windSpeed;
    private Integer windDirection;
    private Long seed;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
}

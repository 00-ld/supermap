package com.at.pojo.dto;

import com.at.pojo.SimulationScenario;

import java.time.LocalDateTime;

public record SimulationScenarioResponseDTO(
        Long id,
        String scenarioCode,
        String name,
        String source,
        String gasType,
        Double leakX,
        Double leakY,
        Double emissionRate,
        Double windSpeed,
        Integer windDirection,
        Long seed,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        LocalDateTime createdAt
) {
    public static SimulationScenarioResponseDTO fromEntity(SimulationScenario scenario) {
        if (scenario == null) {
            return null;
        }
        return new SimulationScenarioResponseDTO(
                scenario.getId(),
                scenario.getScenarioCode(),
                scenario.getName(),
                scenario.getSource(),
                scenario.getGasType(),
                scenario.getLeakX(),
                scenario.getLeakY(),
                scenario.getEmissionRate(),
                scenario.getWindSpeed(),
                scenario.getWindDirection(),
                scenario.getSeed(),
                scenario.getStartedAt(),
                scenario.getEndedAt(),
                scenario.getCreatedAt()
        );
    }
}

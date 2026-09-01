package com.at.service;

import com.at.mapper.SimulationScenarioMapper;
import com.at.pojo.SimulationScenario;
import com.at.pojo.dto.SimulationScenarioCreateDTO;
import com.at.pojo.dto.SimulationScenarioResponseDTO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Slf4j
@Service
public class SimulationMonitoringService {

    private static final String SIMULATION_SOURCE = "simulation";

    @Resource
    private SimulationScenarioMapper simulationScenarioMapper;

    public SimulationScenarioResponseDTO latestScenario() {
        return SimulationScenarioResponseDTO.fromEntity(simulationScenarioMapper.selectLatest());
    }

    public List<SimulationScenarioResponseDTO> recentScenarios(int limit) {
        return simulationScenarioMapper.selectRecent(safeLimit(limit, 100))
                .stream()
                .map(SimulationScenarioResponseDTO::fromEntity)
                .toList();
    }

    public SimulationScenarioResponseDTO addScenario(SimulationScenarioCreateDTO dto) {
        SimulationScenario scenario = new SimulationScenario();
        scenario.setScenarioCode(dto.getScenarioCode());
        scenario.setName(dto.getName());
        scenario.setSource(normalizeSimulationSource(dto.getSource()));
        scenario.setGasType(dto.getGasType());
        scenario.setLeakX(dto.getLeakX());
        scenario.setLeakY(dto.getLeakY());
        scenario.setEmissionRate(dto.getEmissionRate());
        scenario.setWindSpeed(dto.getWindSpeed());
        scenario.setWindDirection(dto.getWindDirection());
        scenario.setSeed(dto.getSeed());
        scenario.setStartedAt(dto.getStartedAt());
        scenario.setEndedAt(dto.getEndedAt());

        int rows = simulationScenarioMapper.insert(scenario);
        if (rows <= 0) {
            throw new IllegalStateException("仿真监测场景保存失败");
        }
        log.info("仿真监测场景已保存: id={}, code={}, gasType={}, affectedRows={}",
                scenario.getId(), scenario.getScenarioCode(), scenario.getGasType(), rows);
        return SimulationScenarioResponseDTO.fromEntity(scenario);
    }

    private static int safeLimit(int limit, int max) {
        return Math.max(1, Math.min(limit, max));
    }

    private static String normalizeSimulationSource(String source) {
        String normalized = defaultIfBlank(source, SIMULATION_SOURCE).toLowerCase(Locale.ROOT);
        if (!SIMULATION_SOURCE.equals(normalized)) {
            throw new IllegalArgumentException("当前项目未接入硬件采集链路，只允许保存 simulation 来源的仿真数据");
        }
        return SIMULATION_SOURCE;
    }

    private static String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}

package com.at.service;

import com.at.mapper.SensorReadingMapper;
import com.at.mapper.SimulationScenarioMapper;
import com.at.pojo.SensorReading;
import com.at.pojo.SimulationScenario;
import com.at.pojo.dto.SensorReadingCreateDTO;
import com.at.pojo.dto.SensorReadingResponseDTO;
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
    private static final String SIMULATED_QUALITY = "SIMULATED";

    @Resource
    private SimulationScenarioMapper simulationScenarioMapper;

    @Resource
    private SensorReadingMapper sensorReadingMapper;

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

    public SensorReadingResponseDTO latestReading() {
        return SensorReadingResponseDTO.fromEntity(sensorReadingMapper.selectLatest());
    }

    public List<SensorReadingResponseDTO> recentReadings(int limit, String sensorId) {
        int safeLimit = safeLimit(limit, 500);
        List<SensorReading> readings;
        if (sensorId != null && !sensorId.isBlank()) {
            readings = sensorReadingMapper.selectRecentBySensor(sensorId, safeLimit);
        } else {
            readings = sensorReadingMapper.selectRecent(safeLimit);
        }
        return readings.stream().map(SensorReadingResponseDTO::fromEntity).toList();
    }

    public SensorReadingResponseDTO addReading(SensorReadingCreateDTO dto) {
        SensorReading reading = new SensorReading();
        reading.setScenarioId(dto.getScenarioId());
        reading.setSensorId(dto.getSensorId());
        reading.setGasType(dto.getGasType());
        reading.setConcentration(dto.getConcentration());
        reading.setUnit(defaultIfBlank(dto.getUnit(), "ppm"));
        reading.setSampledAt(dto.getSampledAt());
        reading.setSource(normalizeSimulationSource(dto.getSource()));
        reading.setQualityStatus(normalizeSimulatedQuality(dto.getQualityStatus()));
        reading.setRawPayload(dto.getRawPayload());

        int rows = sensorReadingMapper.insert(reading);
        if (rows <= 0) {
            throw new IllegalStateException("仿真传感器读数保存失败");
        }
        log.info("仿真传感器读数已保存: id={}, sensorId={}, gasType={}, sampledAt={}, affectedRows={}",
                reading.getId(), reading.getSensorId(), reading.getGasType(), reading.getSampledAt(), rows);
        return SensorReadingResponseDTO.fromEntity(reading);
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

    private static String normalizeSimulatedQuality(String qualityStatus) {
        String normalized = defaultIfBlank(qualityStatus, SIMULATED_QUALITY).toUpperCase(Locale.ROOT);
        if (!SIMULATED_QUALITY.equals(normalized)) {
            throw new IllegalArgumentException("当前接口只接收 SIMULATED 质量状态，不能把仿真数据标成实测");
        }
        return SIMULATED_QUALITY;
    }

    private static String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}

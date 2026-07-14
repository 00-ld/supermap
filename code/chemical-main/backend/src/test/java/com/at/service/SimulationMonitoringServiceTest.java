package com.at.service;

import com.at.mapper.SensorReadingMapper;
import com.at.mapper.SimulationScenarioMapper;
import com.at.pojo.SensorReading;
import com.at.pojo.SimulationScenario;
import com.at.pojo.dto.SensorReadingCreateDTO;
import com.at.pojo.dto.SensorReadingResponseDTO;
import com.at.pojo.dto.SimulationScenarioCreateDTO;
import com.at.pojo.dto.SimulationScenarioResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SimulationMonitoringServiceTest {

    @Mock
    private SimulationScenarioMapper simulationScenarioMapper;

    @Mock
    private SensorReadingMapper sensorReadingMapper;

    private SimulationMonitoringService service;

    @BeforeEach
    void setUp() {
        service = new SimulationMonitoringService();
        ReflectionTestUtils.setField(service, "simulationScenarioMapper", simulationScenarioMapper);
        ReflectionTestUtils.setField(service, "sensorReadingMapper", sensorReadingMapper);
    }

    @Test
    void addScenarioStoresExplicitSimulationSource() {
        SimulationScenarioCreateDTO dto = scenarioDto();
        dto.setSource(null);
        when(simulationScenarioMapper.insert(any(SimulationScenario.class))).thenReturn(1);

        SimulationScenarioResponseDTO body = service.addScenario(dto);

        assertThat(body.source()).isEqualTo("simulation");
        assertThat(body.gasType()).isEqualTo("CH4");
        verify(simulationScenarioMapper).insert(any(SimulationScenario.class));
    }

    @Test
    void addScenarioRejectsZeroInsertedRows() {
        SimulationScenarioCreateDTO dto = scenarioDto();
        when(simulationScenarioMapper.insert(any(SimulationScenario.class))).thenReturn(0);

        assertThatThrownBy(() -> service.addScenario(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("仿真监测场景保存失败");
    }

    @Test
    void addScenarioRejectsHardwareSourceUntilHardwareChainExists() {
        SimulationScenarioCreateDTO dto = scenarioDto();
        dto.setSource("hardware");

        assertThatThrownBy(() -> service.addScenario(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("未接入硬件采集链路");
    }

    @Test
    void addReadingDefaultsToSimulatedQualityAndPpm() {
        SensorReadingCreateDTO dto = readingDto();
        dto.setUnit(null);
        dto.setSource(null);
        dto.setQualityStatus(null);
        when(sensorReadingMapper.insert(any(SensorReading.class))).thenReturn(1);

        SensorReadingResponseDTO body = service.addReading(dto);

        assertThat(body.source()).isEqualTo("simulation");
        assertThat(body.qualityStatus()).isEqualTo("SIMULATED");
        assertThat(body.unit()).isEqualTo("ppm");
        verify(sensorReadingMapper).insert(any(SensorReading.class));
    }

    @Test
    void addReadingRejectsZeroInsertedRows() {
        SensorReadingCreateDTO dto = readingDto();
        when(sensorReadingMapper.insert(any(SensorReading.class))).thenReturn(0);

        assertThatThrownBy(() -> service.addReading(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("仿真传感器读数保存失败");
    }

    @Test
    void addReadingRejectsRealQualityLabelForSimulationInput() {
        SensorReadingCreateDTO dto = readingDto();
        dto.setQualityStatus("MEASURED");

        assertThatThrownBy(() -> service.addReading(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不能把仿真数据标成实测");
    }

    @Test
    void recentReadingsClampsLimitAndCanFilterBySensor() {
        when(sensorReadingMapper.selectRecentBySensor("TK-01L", 500)).thenReturn(List.of(new SensorReading()));

        List<SensorReadingResponseDTO> body = service.recentReadings(999, "TK-01L");

        assertThat(body).hasSize(1);
        verify(sensorReadingMapper).selectRecentBySensor("TK-01L", 500);
    }

    private static SimulationScenarioCreateDTO scenarioDto() {
        SimulationScenarioCreateDTO dto = new SimulationScenarioCreateDTO();
        dto.setScenarioCode("UNIT-DEMO");
        dto.setName("单元测试仿真场景");
        dto.setSource("simulation");
        dto.setGasType("CH4");
        dto.setLeakX(430.0);
        dto.setLeakY(470.0);
        dto.setEmissionRate(0.18);
        dto.setWindSpeed(3.6);
        dto.setWindDirection(45);
        dto.setSeed(2026061901L);
        dto.setStartedAt(LocalDateTime.parse("2026-06-19T10:00:00"));
        return dto;
    }

    private static SensorReadingCreateDTO readingDto() {
        SensorReadingCreateDTO dto = new SensorReadingCreateDTO();
        dto.setScenarioId(1L);
        dto.setSensorId("TK-01L");
        dto.setGasType("CH4");
        dto.setConcentration(31.4);
        dto.setUnit("ppm");
        dto.setSource("simulation");
        dto.setQualityStatus("SIMULATED");
        dto.setSampledAt(LocalDateTime.parse("2026-06-19T10:00:00"));
        return dto;
    }
}

package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.dto.SimulationScenarioCreateDTO;
import com.at.pojo.dto.SimulationScenarioResponseDTO;
import com.at.service.SimulationMonitoringService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SimulationMonitoringControllerTest {

    @Mock
    private SimulationMonitoringService simulationMonitoringService;

    private SimulationMonitoringController controller;

    @BeforeEach
    void setUp() {
        controller = new SimulationMonitoringController();
        ReflectionTestUtils.setField(controller, "simulationMonitoringService", simulationMonitoringService);
    }

    @Test
    void addScenarioDelegatesToService() {
        SimulationScenarioCreateDTO dto = scenarioDto();
        SimulationScenarioResponseDTO response = scenarioResponse();
        when(simulationMonitoringService.addScenario(dto)).thenReturn(response);

        Result<SimulationScenarioResponseDTO> body = controller.addScenario(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(response);
        verify(simulationMonitoringService).addScenario(dto);
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

    private static SimulationScenarioResponseDTO scenarioResponse() {
        return new SimulationScenarioResponseDTO(
                1L,
                "UNIT-DEMO",
                "单元测试仿真场景",
                "simulation",
                "CH4",
                430.0,
                470.0,
                0.18,
                3.6,
                45,
                2026061901L,
                LocalDateTime.parse("2026-06-19T10:00:00"),
                null,
                null
        );
    }
}

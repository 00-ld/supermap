package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.dto.MonitoringOverviewDTO;
import com.at.service.MonitoringDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitoringDataControllerTest {

    @Mock
    private MonitoringDataService monitoringDataService;

    private MonitoringDataController controller;

    @BeforeEach
    void setUp() {
        controller = new MonitoringDataController();
        ReflectionTestUtils.setField(controller, "monitoringDataService", monitoringDataService);
    }

    @Test
    void overviewDelegatesAggregationToService() {
        MonitoringOverviewDTO overview = new MonitoringOverviewDTO(
                new MonitoringOverviewDTO.EnvironmentSnapshot(
                        true,
                        3.6,
                        25,
                        "东北风",
                        28.0,
                        58,
                        101.3,
                        null,
                        2,
                        1,
                        0.6,
                        0.8,
                        1,
                        LocalDateTime.parse("2026-06-19T10:10:00"),
                        "qweather:test-location"
                ),
                List.of(new MonitoringOverviewDTO.TrendPoint(
                        LocalDateTime.parse("2026-06-19T10:00:00"),
                        1,
                        "TK-01L",
                        "CH4",
                        31.4,
                        "TK-01L",
                        "simulation",
                        "SIMULATED"
                )),
                List.of(),
                "东北风 3.6m/s | 28.0℃ | 58%RH",
                1
        );
        when(monitoringDataService.overview()).thenReturn(overview);

        Result<MonitoringOverviewDTO> body = controller.overview();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isSameAs(overview);
        verify(monitoringDataService).overview();
    }
}

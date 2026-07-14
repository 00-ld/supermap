package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.Sensor;
import com.at.pojo.dto.SensorResponseDTO;
import com.at.pojo.dto.SensorSaveDTO;
import com.at.pojo.dto.StringIdDTO;
import com.at.service.SensorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SensorControllerTest {

    @Mock
    private SensorService sensorService;

    private SensorController controller;

    @BeforeEach
    void setUp() {
        controller = new SensorController();
        ReflectionTestUtils.setField(controller, "sensorService", sensorService);
    }

    @Test
    void getAllSensorsReturnsResponseDtosWithoutExposingEntities() {
        Sensor sensor = new Sensor();
        sensor.setId("sensor-1");
        sensor.setX(12.5);
        sensor.setY(34.5);
        sensor.setInstallationHeight(1.8);
        sensor.setEffectiveRange(35.0);
        sensor.setDetectionRange("CO/CH4");
        sensor.setInstallRemark("装置区下风向");
        sensor.setPriority(1);
        sensor.setRisk(0.7);
        sensor.setType("gas");
        sensor.setMode("fixed");
        sensor.setLastSampleTime(1781767200000L);
        sensor.setCreatedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        sensor.setUpdatedAt(LocalDateTime.of(2026, 6, 18, 11, 0));
        when(sensorService.getAllSensors()).thenReturn(List.of(sensor));

        Result<List<SensorResponseDTO>> body = controller.getAllSensors();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new SensorResponseDTO(
                "sensor-1",
                12.5,
                34.5,
                1.8,
                35.0,
                "CO/CH4",
                "装置区下风向",
                1,
                0.7,
                "gas",
                "fixed",
                1781767200000L,
                LocalDateTime.of(2026, 6, 18, 10, 0),
                LocalDateTime.of(2026, 6, 18, 11, 0)
        ));
    }

    @Test
    void updateSensorReturnsNotFoundWhenServiceUpdatesNoRows() {
        SensorSaveDTO dto = sensorDto(" missing-sensor ");
        when(sensorService.updateSensor(any(Sensor.class))).thenReturn(false);

        Result<?> body = controller.updateSensor(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        var captor = forClass(Sensor.class);
        verify(sensorService).updateSensor(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo("missing-sensor");
    }

    @Test
    void updateSensorReturnsOkWhenServiceUpdatesRows() {
        SensorSaveDTO dto = sensorDto(" sensor-1 ");
        dto.setX(12.5);
        dto.setY(34.5);
        dto.setRisk(0.7);
        when(sensorService.updateSensor(any(Sensor.class))).thenReturn(true);

        Result<?> body = controller.updateSensor(dto);

        assertThat(body.isOk()).isTrue();
        var captor = forClass(Sensor.class);
        verify(sensorService).updateSensor(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo("sensor-1");
        assertThat(captor.getValue().getX()).isEqualTo(12.5);
        assertThat(captor.getValue().getY()).isEqualTo(34.5);
        assertThat(captor.getValue().getRisk()).isEqualTo(0.7);
    }

    @Test
    void deleteSensorReturnsNotFoundWhenServiceDeletesNoRows() {
        StringIdDTO dto = idDto("missing-sensor");
        when(sensorService.deleteSensor("missing-sensor")).thenReturn(false);

        Result<?> body = controller.deleteSensor(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        verify(sensorService).deleteSensor("missing-sensor");
    }

    @Test
    void deleteSensorReturnsOkWhenServiceDeletesRows() {
        StringIdDTO dto = idDto("sensor-1");
        when(sensorService.deleteSensor("sensor-1")).thenReturn(true);

        Result<?> body = controller.deleteSensor(dto);

        assertThat(body.isOk()).isTrue();
        verify(sensorService).deleteSensor("sensor-1");
    }

    private SensorSaveDTO sensorDto(String id) {
        SensorSaveDTO dto = new SensorSaveDTO();
        dto.setId(id);
        return dto;
    }

    private StringIdDTO idDto(String id) {
        StringIdDTO dto = new StringIdDTO();
        dto.setId(id);
        return dto;
    }
}

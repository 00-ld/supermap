package com.at.service;

import com.at.mapper.SensorMapper;
import com.at.pojo.Sensor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SensorServiceTest {

    @Mock
    private SensorMapper sensorMapper;

    private SensorService service;

    @BeforeEach
    void setUp() {
        service = new SensorService();
        ReflectionTestUtils.setField(service, "sensorMapper", sensorMapper);
    }

    @Test
    void addSensorReportsMissingInsertedRows() {
        Sensor sensor = new Sensor();
        sensor.setId("sensor-1");
        sensor.setX(10.0);
        sensor.setY(20.0);
        when(sensorMapper.insert(sensor)).thenReturn(0);

        assertThat(service.addSensor(sensor)).isFalse();
    }

    @Test
    void addSensorReportsInsertedRows() {
        Sensor sensor = new Sensor();
        sensor.setId("sensor-1");
        sensor.setX(10.0);
        sensor.setY(20.0);
        when(sensorMapper.insert(sensor)).thenReturn(1);

        assertThat(service.addSensor(sensor)).isTrue();
    }

    @Test
    void updateSensorReportsMissingRows() {
        Sensor sensor = new Sensor();
        sensor.setId("missing-sensor");
        when(sensorMapper.updateById(sensor)).thenReturn(0);

        assertThat(service.updateSensor(sensor)).isFalse();
    }

    @Test
    void updateSensorReportsUpdatedRows() {
        Sensor sensor = new Sensor();
        sensor.setId("sensor-1");
        when(sensorMapper.updateById(sensor)).thenReturn(1);

        assertThat(service.updateSensor(sensor)).isTrue();
    }

    @Test
    void deleteSensorReportsMissingRows() {
        when(sensorMapper.deleteById("missing-sensor")).thenReturn(0);

        assertThat(service.deleteSensor("missing-sensor")).isFalse();
    }

    @Test
    void deleteSensorReportsDeletedRows() {
        when(sensorMapper.deleteById("sensor-1")).thenReturn(1);

        assertThat(service.deleteSensor("sensor-1")).isTrue();
    }
}

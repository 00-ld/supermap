package com.at.service;

import com.at.mapper.CarMapper;
import com.at.mapper.EnvironmentReadingMapper;
import com.at.mapper.SensorReadingMapper;
import com.at.pojo.Car;
import com.at.pojo.EnvironmentReading;
import com.at.pojo.Sensor;
import com.at.pojo.SensorReading;
import com.at.pojo.dto.MonitoringOverviewDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitoringDataServiceTest {

    @Mock
    private SensorService sensorService;

    @Mock
    private CarMapper carMapper;

    @Mock
    private EnvironmentReadingMapper environmentReadingMapper;

    @Mock
    private SensorReadingMapper sensorReadingMapper;

    @Mock
    private QWeatherService qWeatherService;

    private MonitoringDataService service;

    @BeforeEach
    void setUp() {
        service = new MonitoringDataService();
        ReflectionTestUtils.setField(service, "sensorService", sensorService);
        ReflectionTestUtils.setField(service, "carMapper", carMapper);
        ReflectionTestUtils.setField(service, "environmentReadingMapper", environmentReadingMapper);
        ReflectionTestUtils.setField(service, "sensorReadingMapper", sensorReadingMapper);
        ReflectionTestUtils.setField(service, "qWeatherService", qWeatherService);
    }

    @Test
    void overviewKeepsReadingsEmptyWhenSensorReadingsAreAbsent() {
        Sensor sensorA = sensor("PA-01L", 0.8, "auto");
        Sensor sensorB = sensor("MN-01", 0.4, "offline");
        Car normalCar = car(1, 0);
        Car warningCar = car(3, 1);

        when(sensorReadingMapper.selectRecent(500)).thenReturn(List.of());
        when(sensorService.getAllSensors()).thenReturn(List.of(sensorA, sensorB));
        when(carMapper.getAllCars()).thenReturn(List.of(normalCar, warningCar));
        when(qWeatherService.fetchCurrentWeather()).thenReturn(Optional.of(environmentReading()));

        MonitoringOverviewDTO overview = service.overview();

        assertThat(overview.environment().sensorCount()).isEqualTo(2);
        assertThat(overview.environment().onlineSensorCount()).isEqualTo(1);
        assertThat(overview.environment().averageRisk()).isEqualTo(0.6);
        assertThat(overview.environment().available()).isTrue();
        assertThat(overview.environment().source()).isEqualTo("qweather:test-location");
        assertThat(overview.activeWarningCount()).isEqualTo(1);
        assertThat(overview.concentrationTrend()).isEmpty();
        assertThat(overview.latestReadings()).isEmpty();
        assertThat(overview.weatherText()).contains("m/s");

        verify(sensorReadingMapper).selectRecent(500);
        verify(sensorService).getAllSensors();
        verify(carMapper).getAllCars();
    }

    @Test
    void overviewPrefersSensorReadingsForTrendAndLatestReadings() {
        SensorReading older = reading("TK-01L", "CH4", 31.4, LocalDateTime.parse("2026-06-19T10:00:00"));
        SensorReading newer = reading("TK-02L", "CH4", 44.8, LocalDateTime.parse("2026-06-19T10:02:00"));
        SensorReading co = reading("PA-03L", "CO", 12.6, LocalDateTime.parse("2026-06-19T10:01:00"));
        when(sensorReadingMapper.selectRecent(500)).thenReturn(List.of(newer, co, older));
        when(sensorService.getAllSensors()).thenReturn(List.of(sensor("TK-01L", 0.8, "auto")));
        when(carMapper.getAllCars()).thenReturn(List.of(car(1, 0)));
        when(qWeatherService.fetchCurrentWeather()).thenReturn(Optional.empty());
        when(environmentReadingMapper.selectLatest()).thenReturn(environmentReading());

        MonitoringOverviewDTO overview = service.overview();

        assertThat(overview.concentrationTrend())
                .extracting(MonitoringOverviewDTO.TrendPoint::gasValue)
                .containsExactly(31.4, 12.6, 44.8);
        assertThat(overview.concentrationTrend().get(0).sensorId()).isEqualTo("TK-01L");
        assertThat(overview.concentrationTrend().get(0).source()).isEqualTo("simulation");
        assertThat(overview.latestReadings())
                .extracting(MonitoringOverviewDTO.LatestReading::gasType)
                .containsExactly("CH4", "CO");
        assertThat(overview.latestReadings().get(0).gasValue()).isEqualTo(44.8);
        assertThat(overview.latestReadings().get(0).qualityStatus()).isEqualTo("SIMULATED");
    }

    @Test
    void overviewMarksEnvironmentUnavailableWhenNoObservationSourceExists() {
        when(sensorReadingMapper.selectRecent(500)).thenReturn(List.of());
        when(sensorService.getAllSensors()).thenReturn(List.of());
        when(carMapper.getAllCars()).thenReturn(List.of());
        when(qWeatherService.fetchCurrentWeather()).thenReturn(Optional.empty());
        when(environmentReadingMapper.selectLatest()).thenReturn(null);

        MonitoringOverviewDTO overview = service.overview();

        assertThat(overview.environment().available()).isFalse();
        assertThat(overview.weatherText()).isEqualTo("未接入外部环境观测数据");
    }

    private static SensorReading reading(String sensorId, String gasType, Double concentration, LocalDateTime time) {
        SensorReading reading = new SensorReading();
        reading.setSensorId(sensorId);
        reading.setGasType(gasType);
        reading.setConcentration(concentration);
        reading.setSampledAt(time);
        reading.setSource("simulation");
        reading.setQualityStatus("SIMULATED");
        return reading;
    }

    private static Sensor sensor(String id, Double risk, String mode) {
        Sensor sensor = new Sensor();
        sensor.setId(id);
        sensor.setRisk(risk);
        sensor.setMode(mode);
        return sensor;
    }

    private static Car car(Integer carId, Integer warning) {
        Car car = new Car();
        car.setCarId(carId);
        car.setWarning(warning);
        return car;
    }

    private static EnvironmentReading environmentReading() {
        EnvironmentReading reading = new EnvironmentReading();
        reading.setSource("qweather:test-location");
        reading.setWindSpeed(3.6);
        reading.setWindDirection(25);
        reading.setTemperature(28.0);
        reading.setHumidity(58);
        reading.setPressure(101.3);
        reading.setObservedAt(LocalDateTime.parse("2026-06-19T10:10:00"));
        return reading;
    }
}

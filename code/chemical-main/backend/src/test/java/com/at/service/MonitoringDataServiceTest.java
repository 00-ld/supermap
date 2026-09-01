package com.at.service;

import com.at.mapper.CarMapper;
import com.at.mapper.EnvironmentReadingMapper;
import com.at.pojo.Car;
import com.at.pojo.EnvironmentReading;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitoringDataServiceTest {

    @Mock
    private CarMapper carMapper;

    @Mock
    private EnvironmentReadingMapper environmentReadingMapper;

    @Mock
    private QWeatherService qWeatherService;

    private MonitoringDataService service;

    @BeforeEach
    void setUp() {
        service = new MonitoringDataService();
        ReflectionTestUtils.setField(service, "carMapper", carMapper);
        ReflectionTestUtils.setField(service, "environmentReadingMapper", environmentReadingMapper);
        ReflectionTestUtils.setField(service, "qWeatherService", qWeatherService);
    }

    @Test
    void overviewReportsEnvironmentAndWarningsWithSensorMetricsZeroed() {
        Car normalCar = car(1, 0);
        Car warningCar = car(3, 1);

        when(carMapper.getAllCars()).thenReturn(List.of(normalCar, warningCar));
        when(qWeatherService.fetchCurrentWeather()).thenReturn(Optional.of(environmentReading()));

        MonitoringOverviewDTO overview = service.overview();

        assertThat(overview.environment().available()).isTrue();
        assertThat(overview.environment().source()).isEqualTo("qweather:test-location");
        assertThat(overview.environment().sensorCount()).isZero();
        assertThat(overview.environment().onlineSensorCount()).isZero();
        assertThat(overview.environment().averageRisk()).isZero();
        assertThat(overview.environment().maxRisk()).isZero();
        assertThat(overview.environment().warningCarCount()).isEqualTo(1);
        assertThat(overview.activeWarningCount()).isEqualTo(1);
        assertThat(overview.concentrationTrend()).isEmpty();
        assertThat(overview.latestReadings()).isEmpty();
        assertThat(overview.weatherText()).contains("m/s");

        verify(carMapper).getAllCars();
    }

    @Test
    void overviewFallsBackToLatestEnvironmentReadingWhenWeatherApiIsEmpty() {
        when(carMapper.getAllCars()).thenReturn(List.of(car(1, 0)));
        when(qWeatherService.fetchCurrentWeather()).thenReturn(Optional.empty());
        when(environmentReadingMapper.selectLatest()).thenReturn(environmentReading());

        MonitoringOverviewDTO overview = service.overview();

        assertThat(overview.environment().available()).isTrue();
        assertThat(overview.environment().source()).isEqualTo("qweather:test-location");
        verify(environmentReadingMapper).selectLatest();
    }

    @Test
    void overviewMarksEnvironmentUnavailableWhenNoObservationSourceExists() {
        when(carMapper.getAllCars()).thenReturn(List.of());
        when(qWeatherService.fetchCurrentWeather()).thenReturn(Optional.empty());
        when(environmentReadingMapper.selectLatest()).thenReturn(null);

        MonitoringOverviewDTO overview = service.overview();

        assertThat(overview.environment().available()).isFalse();
        assertThat(overview.environment().sensorCount()).isZero();
        assertThat(overview.concentrationTrend()).isEmpty();
        assertThat(overview.latestReadings()).isEmpty();
        assertThat(overview.weatherText()).isEqualTo("未接入外部环境观测数据");
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

package com.at.service;

import com.at.mapper.CarMapper;
import com.at.mapper.EnvironmentReadingMapper;
import com.at.mapper.SensorReadingMapper;
import com.at.pojo.Car;
import com.at.pojo.EnvironmentReading;
import com.at.pojo.Sensor;
import com.at.pojo.SensorReading;
import com.at.pojo.dto.MonitoringOverviewDTO;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MonitoringDataService {

    @Resource
    private SensorService sensorService;

    @Resource
    private CarMapper carMapper;

    @Resource
    private EnvironmentReadingMapper environmentReadingMapper;

    @Resource
    private SensorReadingMapper sensorReadingMapper;

    @Resource
    private QWeatherService qWeatherService;

    public MonitoringOverviewDTO overview() {
        List<Sensor> sensors = sensorService.getAllSensors();
        List<Car> cars = carMapper.getAllCars();
        List<SensorReading> sensorReadings = Optional.ofNullable(sensorReadingMapper.selectRecent(500))
                .orElse(List.of());
        Optional<EnvironmentReading> qWeatherReading = qWeatherService.fetchCurrentWeather();
        EnvironmentReading latestEnvironmentReading = qWeatherReading.orElseGet(environmentReadingMapper::selectLatest);

        MonitoringOverviewDTO.EnvironmentSnapshot environment =
                buildEnvironmentSnapshot(sensors, cars, latestEnvironmentReading);
        List<MonitoringOverviewDTO.TrendPoint> concentrationTrend = buildTrendFromSensorReadings(sensorReadings);
        List<MonitoringOverviewDTO.LatestReading> latestReadings = buildLatestReadingsFromSensorReadings(sensorReadings);
        long activeWarningCount = cars.stream()
                .filter(car -> Objects.equals(car.getWarning(), 1))
                .count();

        return new MonitoringOverviewDTO(
                environment,
                concentrationTrend,
                latestReadings,
                buildWeatherText(environment),
                activeWarningCount
        );
    }

    private MonitoringOverviewDTO.EnvironmentSnapshot buildEnvironmentSnapshot(
            List<Sensor> sensors,
            List<Car> cars,
            EnvironmentReading latestReading) {
        int sensorCount = sensors.size();
        int onlineSensorCount = (int) sensors.stream()
                .filter(sensor -> sensor.getMode() == null || !"offline".equalsIgnoreCase(sensor.getMode()))
                .count();
        double averageRisk = sensors.stream()
                .map(Sensor::getRisk)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        double maxRisk = sensors.stream()
                .map(Sensor::getRisk)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .max()
                .orElse(0.0);
        int warningCarCount = (int) cars.stream()
                .filter(car -> Objects.equals(car.getWarning(), 1))
                .count();

        if (latestReading == null) {
            return new MonitoringOverviewDTO.EnvironmentSnapshot(
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    sensorCount,
                    onlineSensorCount,
                    round(averageRisk, 3),
                    round(maxRisk, 3),
                    warningCarCount,
                    null,
                    "not_configured"
            );
        }

        return new MonitoringOverviewDTO.EnvironmentSnapshot(
                true,
                latestReading.getWindSpeed(),
                latestReading.getWindDirection(),
                windDirectionText(latestReading.getWindDirection()),
                latestReading.getTemperature(),
                latestReading.getHumidity(),
                latestReading.getPressure(),
                latestReading.getNoise(),
                sensorCount,
                onlineSensorCount,
                round(averageRisk, 3),
                round(maxRisk, 3),
                warningCarCount,
                latestReading.getObservedAt(),
                latestReading.getSource()
        );
    }

    private List<MonitoringOverviewDTO.TrendPoint> buildTrendFromSensorReadings(List<SensorReading> readings) {
        return readings.stream()
                .filter(item -> item.getSampledAt() != null && item.getConcentration() != null)
                .sorted(Comparator.comparing(SensorReading::getSampledAt))
                .map(item -> new MonitoringOverviewDTO.TrendPoint(
                        item.getSampledAt(),
                        gasTypeCompatCarId(item.getGasType()),
                        item.getSensorId(),
                        item.getGasType(),
                        item.getConcentration(),
                        item.getSensorId(),
                        item.getSource(),
                        item.getQualityStatus()
                ))
                .toList();
    }

    private List<MonitoringOverviewDTO.LatestReading> buildLatestReadingsFromSensorReadings(List<SensorReading> readings) {
        Map<String, SensorReading> latestByGas = readings.stream()
                .filter(item -> item.getGasType() != null)
                .collect(Collectors.toMap(
                        item -> item.getGasType().toUpperCase(Locale.ROOT),
                        Function.identity(),
                        (a, b) -> {
                            LocalDateTime at = a.getSampledAt();
                            LocalDateTime bt = b.getSampledAt();
                            if (at == null) return b;
                            if (bt == null) return a;
                            return bt.isAfter(at) ? b : a;
                        }
                ));

        return latestByGas.values().stream()
                .sorted(Comparator.comparing(item -> gasTypeCompatCarId(item.getGasType())))
                .map(item -> new MonitoringOverviewDTO.LatestReading(
                        gasTypeCompatCarId(item.getGasType()),
                        item.getSensorId(),
                        item.getGasType(),
                        item.getConcentration(),
                        item.getSampledAt(),
                        item.getSensorId(),
                        item.getSource(),
                        item.getQualityStatus()
                ))
                .toList();
    }

    private String buildWeatherText(MonitoringOverviewDTO.EnvironmentSnapshot env) {
        if (!env.available()) {
            return "未接入外部环境观测数据";
        }
        String wind = env.windSpeed() == null
                ? "风速未接入"
                : String.format("%s %.1fm/s", env.windDirectionText() == null ? "未知风向" : env.windDirectionText(), env.windSpeed());
        String temperature = env.temperature() == null
                ? "温度未接入"
                : String.format("%.1f℃", env.temperature());
        String humidity = env.humidity() == null
                ? "湿度未接入"
                : env.humidity() + "%RH";
        return wind + " | " + temperature + " | " + humidity;
    }

    private static String windDirectionText(Integer degree) {
        if (degree == null) {
            return null;
        }
        String[] directions = {"北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"};
        int normalized = ((degree % 360) + 360) % 360;
        int index = Math.round(normalized / 45.0f) % 8;
        return directions[index];
    }

    private static double round(double value, int scale) {
        double factor = Math.pow(10, scale);
        return Math.round(value * factor) / factor;
    }

    private static int gasTypeCompatCarId(String gasType) {
        if (gasType == null) {
            return 0;
        }
        return switch (gasType.toUpperCase(Locale.ROOT)) {
            case "CH4", "METHANE" -> 1;
            case "NH3", "AMMONIA" -> 2;
            case "CO" -> 3;
            case "O2", "OXYGEN" -> 4;
            default -> 0;
        };
    }
}

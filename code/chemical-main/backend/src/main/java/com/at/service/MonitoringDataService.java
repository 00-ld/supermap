package com.at.service;

import com.at.mapper.CarMapper;
import com.at.mapper.EnvironmentReadingMapper;
import com.at.pojo.Car;
import com.at.pojo.EnvironmentReading;
import com.at.pojo.dto.MonitoringOverviewDTO;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class MonitoringDataService {

    @Resource
    private CarMapper carMapper;

    @Resource
    private EnvironmentReadingMapper environmentReadingMapper;

    @Resource
    private QWeatherService qWeatherService;

    public MonitoringOverviewDTO overview() {
        List<Car> cars = carMapper.getAllCars();
        Optional<EnvironmentReading> qWeatherReading = qWeatherService.fetchCurrentWeather();
        EnvironmentReading latestEnvironmentReading = qWeatherReading.orElseGet(environmentReadingMapper::selectLatest);

        MonitoringOverviewDTO.EnvironmentSnapshot environment =
                buildEnvironmentSnapshot(cars, latestEnvironmentReading);
        long activeWarningCount = cars.stream()
                .filter(car -> Objects.equals(car.getWarning(), 1))
                .count();

        return new MonitoringOverviewDTO(
                environment,
                List.of(),
                List.of(),
                buildWeatherText(environment),
                activeWarningCount
        );
    }

    private MonitoringOverviewDTO.EnvironmentSnapshot buildEnvironmentSnapshot(
            List<Car> cars,
            EnvironmentReading latestReading) {
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
                    0,
                    0,
                    0.0,
                    0.0,
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
                0,
                0,
                0.0,
                0.0,
                warningCarCount,
                latestReading.getObservedAt(),
                latestReading.getSource()
        );
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
}

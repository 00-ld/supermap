package com.at.service;

import com.alibaba.fastjson.JSONObject;
import com.at.pojo.EnvironmentReading;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Optional;

@Slf4j
@Service
public class QWeatherService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${qweather.api-key:}")
    private String apiKey;

    @Value("${qweather.location:}")
    private String location;

    @Value("${qweather.api-host:https://devapi.qweather.com}")
    private String apiHost;

    @Value("${qweather.auth-mode:key}")
    private String authMode;

    @Value("${qweather.language:zh}")
    private String language;

    @Value("${qweather.unit:m}")
    private String unit;

    public Optional<EnvironmentReading> fetchCurrentWeather() {
        if (isBlank(apiKey) || isBlank(location)) {
            return Optional.empty();
        }

        try {
            URI uri = buildWeatherNowUri();
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(uri)
                    .GET()
                    .timeout(Duration.ofSeconds(8));

            if ("bearer".equalsIgnoreCase(authMode)) {
                requestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> response = httpClient.send(
                    requestBuilder.build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("和风天气调用失败: status={}", response.statusCode());
                return Optional.empty();
            }

            JSONObject root = JSONObject.parseObject(response.body());
            if (!"200".equals(root.getString("code"))) {
                log.warn("和风天气返回非成功状态: code={}", root.getString("code"));
                return Optional.empty();
            }

            JSONObject now = root.getJSONObject("now");
            if (now == null) {
                return Optional.empty();
            }

            EnvironmentReading reading = new EnvironmentReading();
            reading.setSource("qweather:" + location);
            reading.setWindSpeed(kmhToMps(parseDouble(now.getString("windSpeed"))));
            reading.setWindDirection(parseInteger(now.getString("wind360")));
            reading.setTemperature(parseDouble(now.getString("temp")));
            reading.setHumidity(parseInteger(now.getString("humidity")));
            reading.setPressure(hpaToKpa(parseDouble(now.getString("pressure"))));
            reading.setObservedAt(parseObservedAt(now.getString("obsTime")));
            return Optional.of(reading);
        } catch (Exception exception) {
            log.warn("和风天气调用异常: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    private URI buildWeatherNowUri() {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(trimTrailingSlash(apiHost) + "/v7/weather/now")
                .queryParam("location", location)
                .queryParam("lang", language)
                .queryParam("unit", unit);

        if (!"bearer".equalsIgnoreCase(authMode)) {
            builder.queryParam("key", apiKey);
        }

        return builder.build(true).toUri();
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static Double parseDouble(String value) {
        if (isBlank(value)) {
            return null;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static Integer parseInteger(String value) {
        if (isBlank(value)) {
            return null;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static Double kmhToMps(Double value) {
        return value == null ? null : Math.round((value / 3.6) * 10.0) / 10.0;
    }

    private static Double hpaToKpa(Double value) {
        return value == null ? null : Math.round((value / 10.0) * 10.0) / 10.0;
    }

    private static LocalDateTime parseObservedAt(String value) {
        if (isBlank(value)) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception exception) {
            return LocalDateTime.now();
        }
    }
}

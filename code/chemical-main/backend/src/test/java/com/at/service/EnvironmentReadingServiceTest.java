package com.at.service;

import com.at.mapper.EnvironmentReadingMapper;
import com.at.pojo.EnvironmentReading;
import com.at.pojo.dto.EnvironmentReadingCreateDTO;
import com.at.pojo.dto.EnvironmentReadingResponseDTO;
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
class EnvironmentReadingServiceTest {

    @Mock
    private EnvironmentReadingMapper environmentReadingMapper;

    private EnvironmentReadingService service;

    @BeforeEach
    void setUp() {
        service = new EnvironmentReadingService();
        ReflectionTestUtils.setField(service, "environmentReadingMapper", environmentReadingMapper);
    }

    @Test
    void latestReturnsResponseDtoWithoutExposingEntity() {
        EnvironmentReading reading = reading();
        when(environmentReadingMapper.selectLatest()).thenReturn(reading);

        EnvironmentReadingResponseDTO body = service.latest();

        assertThat(body).isEqualTo(response());
        verify(environmentReadingMapper).selectLatest();
    }

    @Test
    void recentClampsLimitAndReturnsResponseDtos() {
        EnvironmentReading reading = reading();
        when(environmentReadingMapper.selectRecent(200)).thenReturn(List.of(reading));

        List<EnvironmentReadingResponseDTO> body = service.recent(999);

        assertThat(body).containsExactly(response());
        verify(environmentReadingMapper).selectRecent(200);
    }

    @Test
    void addRejectsEmptyMetricPayload() {
        EnvironmentReadingCreateDTO dto = new EnvironmentReadingCreateDTO();
        dto.setSource("qweather:test");
        dto.setObservedAt(LocalDateTime.of(2026, 6, 18, 10, 0));

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("至少需要一个环境观测指标");
    }

    @Test
    void addReturnsResponseDtoWithoutExposingEntity() {
        EnvironmentReadingCreateDTO dto = new EnvironmentReadingCreateDTO();
        dto.setSource("qweather:test");
        dto.setWindSpeed(3.5);
        dto.setObservedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        when(environmentReadingMapper.insert(any(EnvironmentReading.class))).thenReturn(1);

        EnvironmentReadingResponseDTO body = service.add(dto);

        assertThat(body.source()).isEqualTo("qweather:test");
        assertThat(body.windSpeed()).isEqualTo(3.5);
        verify(environmentReadingMapper).insert(any(EnvironmentReading.class));
    }

    @Test
    void addRejectsZeroInsertedRows() {
        EnvironmentReadingCreateDTO dto = new EnvironmentReadingCreateDTO();
        dto.setSource("qweather:test");
        dto.setWindSpeed(3.5);
        dto.setObservedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        when(environmentReadingMapper.insert(any(EnvironmentReading.class))).thenReturn(0);

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("环境观测数据保存失败");
    }

    private EnvironmentReading reading() {
        EnvironmentReading reading = new EnvironmentReading();
        reading.setId(7L);
        reading.setSource("qweather:test");
        reading.setWindSpeed(3.5);
        reading.setWindDirection(45);
        reading.setTemperature(28.0);
        reading.setHumidity(61);
        reading.setPressure(1008.5);
        reading.setNoise(55.0);
        reading.setObservedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        reading.setCreatedAt(LocalDateTime.of(2026, 6, 18, 10, 1));
        return reading;
    }

    private EnvironmentReadingResponseDTO response() {
        return new EnvironmentReadingResponseDTO(
                7L,
                "qweather:test",
                3.5,
                45,
                28.0,
                61,
                1008.5,
                55.0,
                LocalDateTime.of(2026, 6, 18, 10, 0),
                LocalDateTime.of(2026, 6, 18, 10, 1)
        );
    }
}

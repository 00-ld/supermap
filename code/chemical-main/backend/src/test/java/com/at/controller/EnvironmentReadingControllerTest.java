package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.dto.EnvironmentReadingCreateDTO;
import com.at.pojo.dto.EnvironmentReadingResponseDTO;
import com.at.service.EnvironmentReadingService;
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
class EnvironmentReadingControllerTest {

    @Mock
    private EnvironmentReadingService environmentReadingService;

    private EnvironmentReadingController controller;

    @BeforeEach
    void setUp() {
        controller = new EnvironmentReadingController();
        ReflectionTestUtils.setField(controller, "environmentReadingService", environmentReadingService);
    }

    @Test
    void latestDelegatesToService() {
        EnvironmentReadingResponseDTO response = response();
        when(environmentReadingService.latest()).thenReturn(response);

        Result<EnvironmentReadingResponseDTO> body = controller.latest();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(response);
        verify(environmentReadingService).latest();
    }

    @Test
    void recentDelegatesOriginalLimitToService() {
        EnvironmentReadingResponseDTO response = response();
        when(environmentReadingService.recent(999)).thenReturn(List.of(response));

        Result<List<EnvironmentReadingResponseDTO>> body = controller.recent(999);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(response);
        verify(environmentReadingService).recent(999);
    }

    @Test
    void addDelegatesToService() {
        EnvironmentReadingCreateDTO dto = new EnvironmentReadingCreateDTO();
        dto.setSource("qweather:test");
        dto.setWindSpeed(3.5);
        dto.setObservedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        EnvironmentReadingResponseDTO response = response();
        when(environmentReadingService.add(dto)).thenReturn(response);

        Result<EnvironmentReadingResponseDTO> body = controller.add(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(response);
        verify(environmentReadingService).add(dto);
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

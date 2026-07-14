package com.at.controller;

import com.at.pojo.MonitorPoint;
import com.at.pojo.Result;
import com.at.pojo.dto.MonitorPointCreateDTO;
import com.at.pojo.dto.MonitorPointResponseDTO;
import com.at.service.MonitorPointService;
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
class MonitorPointControllerTest {

    @Mock
    private MonitorPointService monitorPointService;

    private MonitorPointController controller;

    @BeforeEach
    void setUp() {
        controller = new MonitorPointController();
        ReflectionTestUtils.setField(controller, "monitorPointService", monitorPointService);
    }

    @Test
    void listReturnsResponseDtosWithoutExposingEntities() {
        MonitorPoint point = monitorPoint(7L, "东区罐组", LocalDateTime.of(2026, 6, 18, 10, 0));
        when(monitorPointService.listPoints()).thenReturn(List.of(point));

        Result<List<MonitorPointResponseDTO>> body = controller.list();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new MonitorPointResponseDTO(
                7L,
                "东区罐组",
                "东区",
                "manual",
                "TK-01L",
                null,
                120.0,
                240.0,
                "UNBOUND",
                LocalDateTime.of(2026, 6, 18, 10, 0),
                LocalDateTime.of(2026, 6, 18, 10, 5)
        ));
        verify(monitorPointService).listPoints();
    }

    @Test
    void createReturnsResponseDtoWithoutExposingEntity() {
        MonitorPointCreateDTO dto = new MonitorPointCreateDTO();
        dto.setName("西区装卸区");
        MonitorPoint point = monitorPoint(8L, "西区装卸区", LocalDateTime.of(2026, 6, 18, 11, 0));
        when(monitorPointService.createPoint(dto)).thenReturn(point);

        Result<MonitorPointResponseDTO> body = controller.create(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(new MonitorPointResponseDTO(
                8L,
                "西区装卸区",
                "东区",
                "manual",
                "TK-01L",
                null,
                120.0,
                240.0,
                "UNBOUND",
                LocalDateTime.of(2026, 6, 18, 11, 0),
                LocalDateTime.of(2026, 6, 18, 11, 5)
        ));
        verify(monitorPointService).createPoint(dto);
    }

    @Test
    void deleteReturnsBadRequestWhenPointDoesNotExist() {
        when(monitorPointService.deletePoint(404L)).thenReturn(false);

        Result<?> body = controller.delete(404L);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getMessage()).isEqualTo("监测点不存在");
        verify(monitorPointService).deletePoint(404L);
    }

    @Test
    void deleteReturnsOkWhenPointWasDeleted() {
        when(monitorPointService.deletePoint(7L)).thenReturn(true);

        Result<?> body = controller.delete(7L);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("监测点已删除");
        verify(monitorPointService).deletePoint(7L);
    }

    private MonitorPoint monitorPoint(Long id, String name, LocalDateTime createTime) {
        MonitorPoint point = new MonitorPoint();
        point.setId(id);
        point.setName(name);
        point.setAreaName("东区");
        point.setSourceType("manual");
        point.setSensorId("TK-01L");
        point.setX(120.0);
        point.setY(240.0);
        point.setQualityStatus("UNBOUND");
        point.setCreateTime(createTime);
        point.setUpdatedAt(createTime.plusMinutes(5));
        return point;
    }
}

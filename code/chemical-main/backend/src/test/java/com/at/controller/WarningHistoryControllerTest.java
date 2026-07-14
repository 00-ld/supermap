package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.WarningHistory;
import com.at.pojo.dto.IntIdDTO;
import com.at.pojo.dto.WarningHistoryResponseDTO;
import com.at.service.WarningHistoryService;
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
class WarningHistoryControllerTest {

    @Mock
    private WarningHistoryService warningHistoryService;

    private WarningHistoryController controller;

    @BeforeEach
    void setUp() {
        controller = new WarningHistoryController();
        ReflectionTestUtils.setField(controller, "warningHistoryService", warningHistoryService);
    }

    @Test
    void getHistoryListReturnsResponseDtosWithoutExposingEntities() {
        WarningHistory warning = new WarningHistory();
        warning.setId(7);
        warning.setCarId(2);
        warning.setAreaName("东区罐组");
        warning.setX(123);
        warning.setY(456);
        warning.setGasType("CH4");
        warning.setGasValue(28.5);
        warning.setWarningTime(LocalDateTime.of(2026, 6, 18, 10, 0));
        when(warningHistoryService.getAllHistory()).thenReturn(List.of(warning));

        Result<List<WarningHistoryResponseDTO>> body = controller.getHistoryList();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new WarningHistoryResponseDTO(
                7,
                2,
                "东区罐组",
                123,
                456,
                "CH4",
                28.5,
                LocalDateTime.of(2026, 6, 18, 10, 0)
        ));
    }

    @Test
    void deleteHistoryReturnsNotFoundWhenServiceDeletesNoRows() {
        IntIdDTO dto = idDto(404);
        when(warningHistoryService.deleteHistoryById(404)).thenReturn(false);

        Result<?> body = controller.deleteHistory(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        assertThat(body.getMessage()).isEqualTo("预警记录不存在");
        verify(warningHistoryService).deleteHistoryById(404);
    }

    @Test
    void deleteHistoryReturnsOkWhenServiceDeletesRows() {
        IntIdDTO dto = idDto(7);
        when(warningHistoryService.deleteHistoryById(7)).thenReturn(true);

        Result<?> body = controller.deleteHistory(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("删除成功");
        verify(warningHistoryService).deleteHistoryById(7);
    }

    private IntIdDTO idDto(Integer id) {
        IntIdDTO dto = new IntIdDTO();
        dto.setId(id);
        return dto;
    }
}

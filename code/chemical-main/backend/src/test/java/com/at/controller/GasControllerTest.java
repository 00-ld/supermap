package com.at.controller;

import com.at.pojo.Gas;
import com.at.pojo.Result;
import com.at.pojo.dto.GasResponseDTO;
import com.at.pojo.dto.GasSaveDTO;
import com.at.pojo.dto.StringIdDTO;
import com.at.service.GasService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GasControllerTest {

    @Mock
    private GasService gasService;

    private GasController controller;

    @BeforeEach
    void setUp() {
        controller = new GasController();
        ReflectionTestUtils.setField(controller, "gasService", gasService);
    }

    @Test
    void getAllGasesReturnsResponseDtosWithoutExposingEntities() {
        Gas gas = new Gas();
        gas.setId("co");
        gas.setName("一氧化碳");
        gas.setDetectionRange("0-1000 ppm");
        gas.setInstallationHeight(1.5);
        gas.setEffectiveRange(30.0);
        gas.setInstallRemark("靠近阀组");
        gas.setPriority(2);
        gas.setRisk(0.8);
        gas.setType("toxic");
        gas.setMode("fixed");
        gas.setCreatedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        gas.setUpdatedAt(LocalDateTime.of(2026, 6, 18, 11, 0));
        when(gasService.getAllGases()).thenReturn(List.of(gas));

        Result<List<GasResponseDTO>> body = controller.getAllGases();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new GasResponseDTO(
                "co",
                "一氧化碳",
                "0-1000 ppm",
                1.5,
                30.0,
                "靠近阀组",
                2,
                0.8,
                "toxic",
                "fixed",
                LocalDateTime.of(2026, 6, 18, 10, 0),
                LocalDateTime.of(2026, 6, 18, 11, 0)
        ));
    }

    @Test
    void updateGasReturnsNotFoundWhenServiceUpdatesNoRows() {
        GasSaveDTO dto = gasDto(" missing-gas ", "一氧化碳");
        when(gasService.updateGas(any(Gas.class))).thenReturn(false);

        Result<?> body = controller.updateGas(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        var captor = forClass(Gas.class);
        verify(gasService).updateGas(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo("missing-gas");
    }

    @Test
    void updateGasReturnsOkWhenServiceUpdatesRows() {
        GasSaveDTO dto = gasDto(" co ", " 一氧化碳 ");
        dto.setRisk(0.9);
        when(gasService.updateGas(any(Gas.class))).thenReturn(true);

        Result<?> body = controller.updateGas(dto);

        assertThat(body.isOk()).isTrue();
        var captor = forClass(Gas.class);
        verify(gasService).updateGas(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo("co");
        assertThat(captor.getValue().getName()).isEqualTo("一氧化碳");
        assertThat(captor.getValue().getRisk()).isEqualTo(0.9);
    }

    @Test
    void deleteGasReturnsNotFoundWhenServiceDeletesNoRows() {
        StringIdDTO dto = idDto("missing-gas");
        when(gasService.deleteGas("missing-gas")).thenReturn(false);

        Result<?> body = controller.deleteGas(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        verify(gasService).deleteGas("missing-gas");
    }

    @Test
    void deleteGasReturnsOkWhenServiceDeletesRows() {
        StringIdDTO dto = idDto("co");
        when(gasService.deleteGas("co")).thenReturn(true);

        Result<?> body = controller.deleteGas(dto);

        assertThat(body.isOk()).isTrue();
        verify(gasService).deleteGas("co");
    }

    private GasSaveDTO gasDto(String id, String name) {
        GasSaveDTO dto = new GasSaveDTO();
        dto.setId(id);
        dto.setName(name);
        return dto;
    }

    private StringIdDTO idDto(String id) {
        StringIdDTO dto = new StringIdDTO();
        dto.setId(id);
        return dto;
    }
}

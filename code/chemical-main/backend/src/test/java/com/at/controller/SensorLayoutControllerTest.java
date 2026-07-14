package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.SensorLayout;
import com.at.pojo.SensorLayoutDetail;
import com.at.pojo.dto.IdResponseDTO;
import com.at.pojo.dto.SensorLayoutDetailResponseDTO;
import com.at.pojo.dto.SensorLayoutResponseDTO;
import com.at.pojo.dto.SensorLayoutSaveDTO;
import com.at.pojo.dto.SensorLayoutSummaryResponseDTO;
import com.at.service.SensorLayoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SensorLayoutControllerTest {

    @Mock
    private SensorLayoutService sensorLayoutService;

    private SensorLayoutController controller;

    @BeforeEach
    void setUp() {
        controller = new SensorLayoutController();
        ReflectionTestUtils.setField(controller, "sensorLayoutService", sensorLayoutService);
    }

    @Test
    void deleteLayoutUsesRestDeleteMapping() throws Exception {
        Method method = SensorLayoutController.class.getMethod("deleteLayout", Integer.class);

        assertThat(method.getAnnotation(DeleteMapping.class).value()).containsExactly("/{id}");
        assertThat(method.getAnnotation(PostMapping.class)).isNull();
    }

    @Test
    void getAllLayoutsReturnsResponseDtosWithoutExposingEntities() {
        SensorLayout layout = layout();
        when(sensorLayoutService.getAllLayouts()).thenReturn(List.of(layout));

        Result<List<SensorLayoutSummaryResponseDTO>> body = controller.getAllLayouts();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(layoutResponse());
        verify(sensorLayoutService).getAllLayouts();
    }

    @Test
    void getLayoutByIdReturnsTypedLayoutResponse() {
        SensorLayout layout = layout();
        SensorLayoutDetail detail = detail();
        when(sensorLayoutService.getLayoutById(7)).thenReturn(layout);
        when(sensorLayoutService.getLayoutDetails(7)).thenReturn(List.of(detail));

        Result<?> body = controller.getLayoutById(7);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isInstanceOf(SensorLayoutResponseDTO.class);
        SensorLayoutResponseDTO response = (SensorLayoutResponseDTO) body.getData();
        assertThat(response.layout()).isEqualTo(layoutResponse());
        assertThat(response.details()).containsExactly(detailResponse());
        verify(sensorLayoutService).getLayoutById(7);
        verify(sensorLayoutService).getLayoutDetails(7);
    }

    @Test
    void saveLayoutReturnsTypedIdResponse() {
        SensorLayoutSaveDTO dto = new SensorLayoutSaveDTO();
        when(sensorLayoutService.saveLayout(dto)).thenReturn(42);

        Result<?> body = controller.saveLayout(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(new IdResponseDTO(42));
        verify(sensorLayoutService).saveLayout(dto);
    }

    @Test
    void deleteLayoutReturnsBadRequestWhenLayoutDoesNotExist() {
        when(sensorLayoutService.deleteLayout(404)).thenReturn(false);

        Result<?> body = controller.deleteLayout(404);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getMessage()).isEqualTo("布局方案不存在");
        verify(sensorLayoutService).deleteLayout(404);
    }

    @Test
    void deleteLayoutReturnsOkWhenLayoutWasDeleted() {
        when(sensorLayoutService.deleteLayout(7)).thenReturn(true);

        Result<?> body = controller.deleteLayout(7);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("布局方案已删除");
        verify(sensorLayoutService).deleteLayout(7);
    }

    private SensorLayout layout() {
        SensorLayout layout = new SensorLayout();
        layout.setId(7);
        layout.setLayoutName("current-layout");
        layout.setDescription("当前布点方案");
        layout.setSensorCount(12);
        layout.setCoverageRate(91.5);
        layout.setRiskScore(0.42);
        layout.setStatus("active");
        layout.setCreatedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        layout.setUpdatedAt(LocalDateTime.of(2026, 6, 18, 11, 0));
        return layout;
    }

    private SensorLayoutSummaryResponseDTO layoutResponse() {
        return new SensorLayoutSummaryResponseDTO(
                7,
                "current-layout",
                "当前布点方案",
                12,
                91.5,
                0.42,
                "active",
                LocalDateTime.of(2026, 6, 18, 10, 0),
                LocalDateTime.of(2026, 6, 18, 11, 0)
        );
    }

    private SensorLayoutDetail detail() {
        SensorLayoutDetail detail = new SensorLayoutDetail();
        detail.setId(3);
        detail.setLayoutId(7);
        detail.setSensorId("S-001");
        detail.setX(123.0);
        detail.setY(456.0);
        detail.setInstallationHeight(1.5);
        detail.setEffectiveRange(30.0);
        detail.setDetectionRange("CO/CH4");
        detail.setPriority(1);
        detail.setRisk(0.7);
        detail.setCreatedAt(LocalDateTime.of(2026, 6, 18, 10, 5));
        return detail;
    }

    private SensorLayoutDetailResponseDTO detailResponse() {
        return new SensorLayoutDetailResponseDTO(
                3,
                7,
                "S-001",
                123.0,
                456.0,
                1.5,
                30.0,
                "CO/CH4",
                1,
                0.7,
                LocalDateTime.of(2026, 6, 18, 10, 5)
        );
    }
}

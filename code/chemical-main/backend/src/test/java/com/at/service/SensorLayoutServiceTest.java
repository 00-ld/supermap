package com.at.service;

import com.at.mapper.SensorLayoutMapper;
import com.at.pojo.SensorLayout;
import com.at.pojo.SensorLayoutDetail;
import com.at.pojo.dto.SensorLayoutSaveDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SensorLayoutServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private SensorLayoutMapper sensorLayoutMapper;

    @InjectMocks
    private SensorLayoutService sensorLayoutService;

    @Test
    void saveLayoutAcceptsIntegerCoordinatesFromDtoJson() throws Exception {
        String json = """
                {
                  "layoutName": "integer-coordinate-layout",
                  "description": "regression test",
                  "coverageRate": 0.82,
                  "riskScore": 0.31,
                  "details": [
                    {
                      "sensorId": "S-001",
                      "x": 100,
                      "y": 200,
                      "installationHeight": 2,
                      "effectiveRange": 30,
                      "detectionRange": "CO",
                      "priority": 1,
                      "risk": 0.4
                    }
                  ]
                }
                """;

        SensorLayoutSaveDTO dto = objectMapper.readValue(json, SensorLayoutSaveDTO.class);
        doAnswer(invocation -> {
            SensorLayout layout = invocation.getArgument(0);
            layout.setId(42);
            return 1;
        }).when(sensorLayoutMapper).insertLayout(any(SensorLayout.class));
        when(sensorLayoutMapper.insertDetail(any(SensorLayoutDetail.class))).thenReturn(1);

        assertThat(dto.getDetails().get(0).getX()).isEqualTo(100.0);
        assertThat(dto.getDetails().get(0).getY()).isEqualTo(200.0);
        assertThatCode(() -> sensorLayoutService.saveLayout(dto))
                .doesNotThrowAnyException();

        ArgumentCaptor<SensorLayoutDetail> detailCaptor = ArgumentCaptor.forClass(SensorLayoutDetail.class);
        verify(sensorLayoutMapper).insertDetail(detailCaptor.capture());
        SensorLayoutDetail savedDetail = detailCaptor.getValue();
        assertThat(savedDetail.getLayoutId()).isEqualTo(42);
        assertThat(savedDetail.getX()).isEqualTo(100.0);
        assertThat(savedDetail.getY()).isEqualTo(200.0);
        assertThat(savedDetail.getInstallationHeight()).isEqualTo(2.0);
        assertThat(savedDetail.getEffectiveRange()).isEqualTo(30.0);
        assertThat(savedDetail.getPriority()).isEqualTo(1);
        assertThat(savedDetail.getRisk()).isEqualTo(0.4);
    }

    @Test
    void deleteLayoutReturnsFalseWhenNoRowsDeleted() {
        when(sensorLayoutMapper.deleteLayout(7)).thenReturn(0);

        boolean deleted = sensorLayoutService.deleteLayout(7);

        assertThat(deleted).isFalse();
    }

    @Test
    void saveLayoutRejectsZeroInsertedLayoutRows() throws Exception {
        SensorLayoutSaveDTO dto = objectMapper.readValue("""
                {
                  "layoutName": "zero-layout-row",
                  "details": [
                    {"sensorId": "S-001", "x": 100, "y": 200}
                  ]
                }
                """, SensorLayoutSaveDTO.class);
        when(sensorLayoutMapper.insertLayout(any(SensorLayout.class))).thenReturn(0);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> sensorLayoutService.saveLayout(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("布局方案保存失败");

        verify(sensorLayoutMapper, never()).insertDetail(any(SensorLayoutDetail.class));
    }

    @Test
    void saveLayoutRejectsMissingGeneratedLayoutId() throws Exception {
        SensorLayoutSaveDTO dto = objectMapper.readValue("""
                {
                  "layoutName": "missing-layout-id",
                  "details": [
                    {"sensorId": "S-001", "x": 100, "y": 200}
                  ]
                }
                """, SensorLayoutSaveDTO.class);
        when(sensorLayoutMapper.insertLayout(any(SensorLayout.class))).thenReturn(1);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> sensorLayoutService.saveLayout(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("布局方案保存失败");

        verify(sensorLayoutMapper, never()).insertDetail(any(SensorLayoutDetail.class));
    }

    @Test
    void saveLayoutRejectsZeroInsertedDetailRows() throws Exception {
        SensorLayoutSaveDTO dto = objectMapper.readValue("""
                {
                  "layoutName": "zero-detail-row",
                  "details": [
                    {"sensorId": "S-001", "x": 100, "y": 200}
                  ]
                }
                """, SensorLayoutSaveDTO.class);
        doAnswer(invocation -> {
            SensorLayout layout = invocation.getArgument(0);
            layout.setId(44);
            return 1;
        }).when(sensorLayoutMapper).insertLayout(any(SensorLayout.class));
        when(sensorLayoutMapper.insertDetail(any(SensorLayoutDetail.class))).thenReturn(0);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> sensorLayoutService.saveLayout(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("布局方案明细保存失败: S-001");
    }

    @Test
    void saveLayoutRejectsDuplicateSensorIdsBeforeInsert() throws Exception {
        String json = """
                {
                  "layoutName": "duplicate-sensor-layout",
                  "details": [
                    {"sensorId": "S-001", "x": 100, "y": 200},
                    {"sensorId": "S-001", "x": 110, "y": 210}
                  ]
                }
                """;
        SensorLayoutSaveDTO dto = objectMapper.readValue(json, SensorLayoutSaveDTO.class);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> sensorLayoutService.saveLayout(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("S-001");
        verify(sensorLayoutMapper, never()).insertLayout(any(SensorLayout.class));
        verify(sensorLayoutMapper, never()).insertDetail(any(SensorLayoutDetail.class));
    }

    @Test
    void saveLayoutRejectsDuplicateSensorIdsAfterTrimming() throws Exception {
        String json = """
                {
                  "layoutName": "duplicate-sensor-layout",
                  "details": [
                    {"sensorId": "S-001", "x": 100, "y": 200},
                    {"sensorId": " S-001 ", "x": 110, "y": 210}
                  ]
                }
                """;
        SensorLayoutSaveDTO dto = objectMapper.readValue(json, SensorLayoutSaveDTO.class);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> sensorLayoutService.saveLayout(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("S-001");
        verify(sensorLayoutMapper, never()).insertLayout(any(SensorLayout.class));
        verify(sensorLayoutMapper, never()).insertDetail(any(SensorLayoutDetail.class));
    }

    @Test
    void saveLayoutTrimsSensorIdsBeforePersisting() throws Exception {
        String json = """
                {
                  "layoutName": "trim-sensor-layout",
                  "details": [
                    {"sensorId": " S-002 ", "x": 100, "y": 200}
                  ]
                }
                """;
        SensorLayoutSaveDTO dto = objectMapper.readValue(json, SensorLayoutSaveDTO.class);
        doAnswer(invocation -> {
            SensorLayout layout = invocation.getArgument(0);
            layout.setId(43);
            return 1;
        }).when(sensorLayoutMapper).insertLayout(any(SensorLayout.class));
        when(sensorLayoutMapper.insertDetail(any(SensorLayoutDetail.class))).thenReturn(1);

        sensorLayoutService.saveLayout(dto);

        ArgumentCaptor<SensorLayoutDetail> detailCaptor = ArgumentCaptor.forClass(SensorLayoutDetail.class);
        verify(sensorLayoutMapper).insertDetail(detailCaptor.capture());
        assertThat(detailCaptor.getValue().getSensorId()).isEqualTo("S-002");
    }

    @Test
    void deleteLayoutReturnsTrueWhenRowsDeleted() {
        when(sensorLayoutMapper.deleteLayout(7)).thenReturn(1);

        boolean deleted = sensorLayoutService.deleteLayout(7);

        assertThat(deleted).isTrue();
    }
}

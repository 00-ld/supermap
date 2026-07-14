package com.at.service;

import com.at.mapper.MonitorPointMapper;
import com.at.pojo.MonitorPoint;
import com.at.pojo.dto.MonitorPointCreateDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitorPointServiceTest {

    @Mock
    private MonitorPointMapper monitorPointMapper;

    @InjectMocks
    private MonitorPointService monitorPointService;

    @Test
    void createPointDefaultsToUnboundManualMonitoringMetadata() {
        MonitorPointCreateDTO dto = new MonitorPointCreateDTO();
        dto.setName(" 东区罐组 ");
        when(monitorPointMapper.insert(any(MonitorPoint.class))).thenReturn(1);

        MonitorPoint point = monitorPointService.createPoint(dto);

        assertThat(point.getName()).isEqualTo("东区罐组");
        assertThat(point.getSourceType()).isEqualTo("manual");
        assertThat(point.getQualityStatus()).isEqualTo("UNBOUND");
        assertThat(point.getSensorId()).isNull();
        assertThat(point.getCameraUrl()).isNull();
        verify(monitorPointMapper).insert(any(MonitorPoint.class));
    }

    @Test
    void createPointRejectsZeroInsertedRows() {
        MonitorPointCreateDTO dto = new MonitorPointCreateDTO();
        dto.setName("东区罐组");
        when(monitorPointMapper.insert(any(MonitorPoint.class))).thenReturn(0);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> monitorPointService.createPoint(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("监测点保存失败");
    }

    @Test
    void deletePointReturnsFalseWhenNoRowsDeleted() {
        when(monitorPointMapper.deleteById(404L)).thenReturn(0);

        assertThat(monitorPointService.deletePoint(404L)).isFalse();
    }

    @Test
    void deletePointReturnsTrueWhenRowsDeleted() {
        when(monitorPointMapper.deleteById(7L)).thenReturn(1);

        assertThat(monitorPointService.deletePoint(7L)).isTrue();
    }
}

package com.at.service;

import com.at.mapper.CarMapper;
import com.at.mapper.WarningHistoryMapper;
import com.at.pojo.Car;
import com.at.pojo.WarningHistory;
import com.at.pojo.dto.WarningAddDTO;
import com.at.service.impl.WarningHistoryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WarningHistoryServiceImplTest {

    @Mock
    private WarningHistoryMapper warningHistoryMapper;

    @Mock
    private CarMapper carMapper;

    @InjectMocks
    private WarningHistoryServiceImpl warningHistoryService;

    @Test
    void addWarningRecordUsesRealCoordinatesFromCarMapper() {
        WarningAddDTO dto = new WarningAddDTO();
        dto.setCarId(2);
        dto.setGasType("CO");
        dto.setGasValue(42.5);

        Car car = new Car();
        car.setCarId(2);
        car.setX(123);
        car.setY(456);
        when(carMapper.getByCarId(2)).thenReturn(car);
        when(warningHistoryMapper.insert(any(WarningHistory.class))).thenReturn(1);

        boolean saved = warningHistoryService.addWarningRecord(dto);

        assertThat(saved).isTrue();
        ArgumentCaptor<WarningHistory> recordCaptor = ArgumentCaptor.forClass(WarningHistory.class);
        verify(warningHistoryMapper).insert(recordCaptor.capture());
        WarningHistory savedRecord = recordCaptor.getValue();
        assertThat(savedRecord.getCarId()).isEqualTo(2);
        assertThat(savedRecord.getX()).isEqualTo(123);
        assertThat(savedRecord.getY()).isEqualTo(456);
        assertThat(savedRecord.getAreaName()).isEqualTo("南区");
        assertThat(savedRecord.getGasType()).isEqualTo("CO");
        assertThat(savedRecord.getGasValue()).isEqualTo(42.5);
        assertThat(savedRecord.getWarningTime()).isNotNull();
        verify(carMapper).getByCarId(2);
    }

    @Test
    void addWarningRecordRejectsMissingCarInsteadOfInventingCoordinates() {
        WarningAddDTO dto = new WarningAddDTO();
        dto.setCarId(2);
        dto.setGasType("CO");
        dto.setGasValue(42.5);
        when(carMapper.getByCarId(2)).thenReturn(null);

        assertThatThrownBy(() -> warningHistoryService.addWarningRecord(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("小车不存在: 2");

        verify(carMapper).getByCarId(2);
        verify(warningHistoryMapper, never()).insert(any(WarningHistory.class));
    }

    @Test
    void addWarningRecordReturnsFalseWhenMapperInsertsNoRows() {
        WarningAddDTO dto = new WarningAddDTO();
        dto.setCarId(2);
        dto.setGasType("CO");
        dto.setGasValue(42.5);

        Car car = new Car();
        car.setCarId(2);
        car.setX(123);
        car.setY(456);
        when(carMapper.getByCarId(2)).thenReturn(car);
        when(warningHistoryMapper.insert(any(WarningHistory.class))).thenReturn(0);

        boolean saved = warningHistoryService.addWarningRecord(dto);

        assertThat(saved).isFalse();
        verify(warningHistoryMapper).insert(any(WarningHistory.class));
    }

    @Test
    void deleteHistoryByIdReturnsFalseWhenMapperDeletesNoRows() {
        when(warningHistoryMapper.deleteById(404)).thenReturn(0);

        boolean deleted = warningHistoryService.deleteHistoryById(404);

        assertThat(deleted).isFalse();
        verify(warningHistoryMapper).deleteById(404);
    }

    @Test
    void deleteHistoryByIdReturnsTrueWhenMapperDeletesRows() {
        when(warningHistoryMapper.deleteById(7)).thenReturn(1);

        boolean deleted = warningHistoryService.deleteHistoryById(7);

        assertThat(deleted).isTrue();
        verify(warningHistoryMapper).deleteById(7);
    }
}

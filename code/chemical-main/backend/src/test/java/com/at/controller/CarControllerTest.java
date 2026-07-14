package com.at.controller;

import com.at.pojo.Car;
import com.at.pojo.Result;
import com.at.pojo.dto.CarActionDTO;
import com.at.pojo.dto.CarResponseDTO;
import com.at.service.CarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CarControllerTest {

    @Mock
    private CarService carService;

    private CarController controller;

    @BeforeEach
    void setUp() {
        controller = new CarController();
        ReflectionTestUtils.setField(controller, "carService", carService);
    }

    @Test
    void getAllCarsReturnsResponseDtosWithoutExposingEntities() {
        Car car = new Car();
        car.setId(1);
        car.setCarId(101);
        car.setWarning(1);
        car.setX(123);
        car.setY(456);
        car.setGasType("CH4");
        when(carService.getAllCars()).thenReturn(List.of(car));

        Result<List<CarResponseDTO>> body = controller.getAllCars();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new CarResponseDTO(1, 101, 1, 123, 456, "CH4"));
        verify(carService).getAllCars();
    }

    @Test
    void setWarningReturnsNotFoundWhenNoRowsUpdated() {
        CarActionDTO dto = carAction(101);
        when(carService.setWarning(101)).thenReturn(0);

        Result<?> body = controller.setWarning(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        assertThat(body.getMessage()).isEqualTo("小车不存在");
        verify(carService).setWarning(101);
    }

    @Test
    void setWarningReturnsOkWhenRowsUpdated() {
        CarActionDTO dto = carAction(101);
        when(carService.setWarning(101)).thenReturn(1);

        Result<?> body = controller.setWarning(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("预警设置成功");
        verify(carService).setWarning(101);
    }

    @Test
    void resetStatusReturnsNotFoundWhenNoRowsUpdated() {
        CarActionDTO dto = carAction(101);
        when(carService.resetStatus(101)).thenReturn(0);

        Result<?> body = controller.resetStatus(dto);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        assertThat(body.getMessage()).isEqualTo("小车不存在");
        verify(carService).resetStatus(101);
    }

    @Test
    void resetStatusReturnsOkWhenRowsUpdated() {
        CarActionDTO dto = carAction(101);
        when(carService.resetStatus(101)).thenReturn(1);

        Result<?> body = controller.resetStatus(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("状态重置成功");
        verify(carService).resetStatus(101);
    }

    private CarActionDTO carAction(Integer carId) {
        CarActionDTO dto = new CarActionDTO();
        dto.setCarId(carId);
        return dto;
    }
}

package com.at.pojo.dto;

import com.at.pojo.Car;

public record CarResponseDTO(
        Integer id,
        Integer carId,
        Integer warning,
        Integer x,
        Integer y,
        String gasType
) {
    public static CarResponseDTO fromEntity(Car car) {
        return new CarResponseDTO(
                car.getId(),
                car.getCarId(),
                car.getWarning(),
                car.getX(),
                car.getY(),
                car.getGasType()
        );
    }
}

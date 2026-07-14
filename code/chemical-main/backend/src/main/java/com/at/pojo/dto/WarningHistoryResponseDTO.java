package com.at.pojo.dto;

import com.at.pojo.WarningHistory;

import java.time.LocalDateTime;

public record WarningHistoryResponseDTO(
        Integer id,
        Integer carId,
        String areaName,
        Integer x,
        Integer y,
        String gasType,
        Double gasValue,
        LocalDateTime warningTime
) {
    public static WarningHistoryResponseDTO fromEntity(WarningHistory warning) {
        return new WarningHistoryResponseDTO(
                warning.getId(),
                warning.getCarId(),
                warning.getAreaName(),
                warning.getX(),
                warning.getY(),
                warning.getGasType(),
                warning.getGasValue(),
                warning.getWarningTime()
        );
    }
}

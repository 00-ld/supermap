package com.at.pojo.dto;

import com.at.pojo.MonitorPoint;

import java.time.LocalDateTime;

public record MonitorPointResponseDTO(
        Long id,
        String name,
        String areaName,
        String sourceType,
        String sensorId,
        String cameraUrl,
        Double x,
        Double y,
        String qualityStatus,
        LocalDateTime createTime,
        LocalDateTime updatedAt
) {
    public static MonitorPointResponseDTO fromEntity(MonitorPoint point) {
        return new MonitorPointResponseDTO(
                point.getId(),
                point.getName(),
                point.getAreaName(),
                point.getSourceType(),
                point.getSensorId(),
                point.getCameraUrl(),
                point.getX(),
                point.getY(),
                point.getQualityStatus(),
                point.getCreateTime(),
                point.getUpdatedAt()
        );
    }
}

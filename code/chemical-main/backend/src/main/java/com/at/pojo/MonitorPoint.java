package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 监测点。取代前端浏览器本地假数据，入库为真实数据源。
 */
@Data
public class MonitorPoint {
    private Long id;
    private String name;
    private String areaName;
    private String sourceType;
    private String sensorId;
    private String cameraUrl;
    private Double x;
    private Double y;
    private String qualityStatus;
    private LocalDateTime createTime;
    private LocalDateTime updatedAt;
}

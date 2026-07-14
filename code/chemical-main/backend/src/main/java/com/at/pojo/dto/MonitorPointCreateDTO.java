package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 新增监测点的请求体（admin 权限）。
 */
@Data
public class MonitorPointCreateDTO {

    @NotBlank(message = "监测点名称不能为空")
    private String name;

    private String areaName;

    private String sourceType;

    private String sensorId;

    private String cameraUrl;

    private Double x;

    private Double y;

    private String qualityStatus;
}

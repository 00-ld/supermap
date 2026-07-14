package com.at.pojo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SensorReadingCreateDTO {
    private Long scenarioId;

    @NotBlank(message = "传感器 ID 不能为空")
    private String sensorId;

    @NotBlank(message = "气体类型不能为空")
    private String gasType;

    @NotNull(message = "浓度不能为空")
    @DecimalMin(value = "0.0", message = "浓度不能为负数")
    private Double concentration;

    private String unit = "ppm";
    private String source = "simulation";
    private String qualityStatus = "SIMULATED";
    private String rawPayload;

    @NotNull(message = "采样时间不能为空")
    private LocalDateTime sampledAt;
}

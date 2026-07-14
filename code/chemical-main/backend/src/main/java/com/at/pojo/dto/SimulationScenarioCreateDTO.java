package com.at.pojo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SimulationScenarioCreateDTO {

    @NotBlank(message = "仿真场景编码不能为空")
    private String scenarioCode;

    @NotBlank(message = "场景名称不能为空")
    private String name;

    private String source = "simulation";

    @NotBlank(message = "气体类型不能为空")
    private String gasType;

    @NotNull(message = "泄漏点 X 坐标不能为空")
    private Double leakX;

    @NotNull(message = "泄漏点 Y 坐标不能为空")
    private Double leakY;

    @DecimalMin(value = "0.0", message = "源强不能为负数")
    private Double emissionRate;

    @DecimalMin(value = "0.0", message = "风速不能为负数")
    private Double windSpeed;

    @Min(value = 0, message = "风向角度不能小于 0")
    @Max(value = 359, message = "风向角度不能大于 359")
    private Integer windDirection;

    private Long seed;

    @NotNull(message = "场景开始时间不能为空")
    private LocalDateTime startedAt;

    private LocalDateTime endedAt;
}

package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 布局方案中单个传感器布点的请求参数。
 *
 * <p>用 DTO + Jackson 自动绑定，取代旧的 {@code Map<String,Object>} 逐字段手动强转，
 * 顺带修掉「JSON 整数坐标被强转成 Double 抛 ClassCastException」的真 bug：
 * Jackson 会按声明类型 Double 正确解析 {@code "x":100} 与 {@code "x":100.0}。
 */
@Data
public class SensorLayoutDetailDTO {

    @NotBlank(message = "sensorId 不能为空")
    private String sensorId;

    @NotNull(message = "x 坐标不能为空")
    private Double x;

    @NotNull(message = "y 坐标不能为空")
    private Double y;

    private Double installationHeight = 1.5;
    private Double effectiveRange = 20.0;
    private String detectionRange = "CO / CH4 / NH3 / O2";
    private Integer priority = 2;
    private Double risk = 0.3;
}

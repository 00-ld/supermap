package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 新增预警记录的请求体。
 *
 * <p>坐标不再由后端 {@code Random} 编造——区域映射与坐标取值下沉到 service，
 * 由 carId 关联到小车（patrol_car 表）的真实位置。
 */
@Data
public class WarningAddDTO {

    @NotNull(message = "carId 不能为空")
    private Integer carId;

    @NotBlank(message = "gasType 不能为空")
    private String gasType;

    @NotNull(message = "gasValue 不能为空")
    private Double gasValue;
}

package com.at.pojo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 小车写操作（设置预警 / 重置状态）的请求体。取代 {@code Map<String,Integer>}。
 */
@Data
public class CarActionDTO {

    @NotNull(message = "carId 不能为空")
    @Min(value = 1, message = "carId 无效")
    @Max(value = 4, message = "carId 无效")
    private Integer carId;
}

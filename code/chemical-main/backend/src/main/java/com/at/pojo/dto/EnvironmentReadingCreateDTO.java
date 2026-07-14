package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EnvironmentReadingCreateDTO {

    @NotBlank(message = "数据来源不能为空")
    private String source;

    private Double windSpeed;
    private Integer windDirection;
    private Double temperature;
    private Integer humidity;
    private Double pressure;
    private Double noise;

    @NotNull(message = "观测时间不能为空")
    private LocalDateTime observedAt;
}

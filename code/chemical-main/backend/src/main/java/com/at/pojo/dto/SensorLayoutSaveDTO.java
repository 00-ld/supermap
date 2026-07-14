package com.at.pojo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 保存布局方案的请求体。取代 {@code @RequestBody Map<String,Object>} 手动拆包。
 */
@Data
public class SensorLayoutSaveDTO {

    @NotBlank(message = "布局名称不能为空")
    private String layoutName;

    private String description = "";
    private Double coverageRate = 0.0;
    private Double riskScore = 0.0;

    @NotEmpty(message = "布局明细不能为空")
    @Valid
    private List<SensorLayoutDetailDTO> details;
}

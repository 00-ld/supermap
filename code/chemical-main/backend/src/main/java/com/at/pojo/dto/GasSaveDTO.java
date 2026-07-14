package com.at.pojo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 气体配置新增/更新请求体。避免直接把数据库实体暴露为 API 入参。
 */
@Data
public class GasSaveDTO {

    @NotBlank(message = "气体编号不能为空")
    private String id;

    @NotBlank(message = "气体名称不能为空")
    private String name;

    private String detectionRange;

    @DecimalMin(value = "0.0", message = "安装高度不能小于 0")
    private Double installationHeight;

    @DecimalMin(value = "0.0", message = "有效覆盖范围不能小于 0")
    private Double effectiveRange;

    private String installRemark;

    @Min(value = 1, message = "优先级不能小于 1")
    @Max(value = 5, message = "优先级不能大于 5")
    private Integer priority;

    @DecimalMin(value = "0.0", message = "风险值不能小于 0")
    @DecimalMax(value = "1.0", message = "风险值不能大于 1")
    private Double risk;

    private String type;

    private String mode;
}

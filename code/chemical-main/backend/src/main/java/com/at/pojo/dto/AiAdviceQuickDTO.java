package com.at.pojo.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiAdviceQuickDTO {
    private Integer carId;
    @Size(max = 40)
    private String gasType;
    private Double gasValue;
    @NotBlank
    @Size(max = 1000)
    private String scenario;
}

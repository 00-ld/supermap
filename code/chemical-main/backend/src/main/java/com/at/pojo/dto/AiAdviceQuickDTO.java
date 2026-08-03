package com.at.pojo.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiAdviceQuickDTO {
    private Integer carId;
    private String gasType;
    private Double gasValue;
    @Size(max = 1000)
    private String scenario;
}

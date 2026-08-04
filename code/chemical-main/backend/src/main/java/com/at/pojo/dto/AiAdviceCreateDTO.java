package com.at.pojo.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiAdviceCreateDTO {
    private Integer alertId;
    @Size(max = 40)
    private String alertType;
    @Size(max = 4000)
    private String evidence;
}

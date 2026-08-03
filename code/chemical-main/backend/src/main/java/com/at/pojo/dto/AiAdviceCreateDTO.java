package com.at.pojo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiAdviceCreateDTO {
    @NotNull
    private Integer alertId;
    private String alertType;
    private String evidence;
}

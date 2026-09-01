package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiAdviceQuickRequestDTO {
    @NotBlank(message = "事故场景不能为空")
    @Size(max = 1000, message = "事故场景不能超过1000字")
    private String scenario;
}

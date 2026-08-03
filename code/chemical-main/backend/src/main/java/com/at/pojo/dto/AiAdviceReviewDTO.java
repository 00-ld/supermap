package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiAdviceReviewDTO {
    @NotBlank
    private String status;
    private String comment;
}

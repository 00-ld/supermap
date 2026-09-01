package com.at.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAdviceResponseDTO {
    private String source;
    private String model;
    private String riskLevel;
    private String summary;
    private String riskExplanation;
    private List<String> recommendations;
    private List<String> allowedActions;
    private List<String> pageOperations;
    private List<String> evidenceDocuments;
    private String fallbackReason;
}

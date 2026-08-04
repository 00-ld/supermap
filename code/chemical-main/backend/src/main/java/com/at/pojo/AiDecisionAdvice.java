package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiDecisionAdvice {
    private Long id;
    private Integer alertId;
    private Integer carId;
    private String alertType;
    private String source;
    private String model;
    private String riskLevel;
    private String summary;
    private String riskExplanation;
    private String recommendations;
    private String allowedActions;
    private String pageOperations;
    private String evidenceStandards;
    private String evidenceDocuments;
    private String dataQuality;
    private String uncertainties;
    private String rawResponse;
    private String fallbackReason;
    private String reviewStatus;
    private String reviewedBy;
    private String reviewComment;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

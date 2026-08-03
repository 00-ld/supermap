package com.at.pojo.dto;

import com.at.pojo.AiDecisionAdvice;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AiAdviceResponseDTO {
    private Long id;
    private Integer alertId;
    private Integer carId;
    private String alertType;
    private String source;
    private String model;
    private String riskLevel;
    private String summary;
    private String riskExplanation;
    private List<String> recommendations;
    private List<String> allowedActions;
    private String fallbackReason;
    private String reviewStatus;
    private String reviewedBy;
    private String reviewComment;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AiAdviceResponseDTO fromEntity(AiDecisionAdvice entity, ObjectMapper objectMapper) {
        AiAdviceResponseDTO dto = new AiAdviceResponseDTO();
        dto.id = entity.getId();
        dto.alertId = entity.getAlertId();
        dto.carId = entity.getCarId();
        dto.alertType = entity.getAlertType();
        dto.source = entity.getSource();
        dto.model = entity.getModel();
        dto.riskLevel = entity.getRiskLevel();
        dto.summary = entity.getSummary();
        dto.riskExplanation = entity.getRiskExplanation();
        dto.recommendations = readList(entity.getRecommendations(), objectMapper);
        dto.allowedActions = readList(entity.getAllowedActions(), objectMapper);
        dto.fallbackReason = entity.getFallbackReason();
        dto.reviewStatus = entity.getReviewStatus();
        dto.reviewedBy = entity.getReviewedBy();
        dto.reviewComment = entity.getReviewComment();
        dto.reviewedAt = entity.getReviewedAt();
        dto.createdAt = entity.getCreatedAt();
        dto.updatedAt = entity.getUpdatedAt();
        return dto;
    }

    private static List<String> readList(String json, ObjectMapper objectMapper) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ignored) {
            return List.of(json);
        }
    }
}

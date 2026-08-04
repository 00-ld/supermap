package com.at.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class DecisionAdviceValidator {
    public ValidatedAdvice validate(QwenClient.QwenResponse response,
                                    DecisionRuleService.RuleAdvice fallback) {
        String risk = response.riskLevel() == null ? "" : response.riskLevel().toUpperCase(Locale.ROOT);
        if (!List.of("LOW", "MEDIUM", "HIGH", "CRITICAL").contains(risk)
                || response.summary() == null || response.summary().isBlank()
                || response.riskExplanation() == null || response.riskExplanation().isBlank()
                || response.recommendations() == null || response.recommendations().isEmpty()) {
            throw new IllegalArgumentException("千问返回字段不完整");
        }
        List<String> actions = response.allowedActions() == null ? List.of() : response.allowedActions();
        if (actions.isEmpty() || actions.stream().anyMatch(action -> !DecisionRuleService.ACTIONS.contains(action))) {
            throw new IllegalArgumentException("千问返回了不允许的车辆动作");
        }
        if (response.pageOperations() == null || response.pageOperations().isEmpty()
                || response.evidenceStandards() == null || response.evidenceStandards().isEmpty()
                || response.evidenceDocuments() == null || response.evidenceDocuments().isEmpty()
                || response.uncertainties() == null || response.uncertainties().isEmpty()) {
            throw new IllegalArgumentException("千问未返回完整的页面操作或依据追溯字段");
        }
        String quality = response.dataQuality() == null ? "unknown" : response.dataQuality().toLowerCase(Locale.ROOT);
        if (!List.of("normal", "degraded", "unknown").contains(quality)) {
            throw new IllegalArgumentException("千问返回了非法数据质量状态");
        }
        validateText(response.summary(), 120, "summary");
        validateText(response.riskExplanation(), 360, "riskExplanation");
        validateList(response.recommendations(), 4, 240, "recommendations");
        validateList(response.pageOperations(), 3, 240, "pageOperations");
        validateList(response.evidenceStandards(), 3, 240, "evidenceStandards");
        validateList(response.evidenceDocuments(), 2, 360, "evidenceDocuments");
        validateList(response.uncertainties(), 3, 240, "uncertainties");
        return new ValidatedAdvice(risk, response.summary(), response.riskExplanation(),
                response.recommendations(), actions, response.pageOperations(), response.evidenceStandards(),
                response.evidenceDocuments(), quality, response.uncertainties());
    }

    private void validateText(String value, int max, String field) {
        if (value.length() > max) throw new IllegalArgumentException("千问字段过长: " + field);
    }

    private void validateList(List<String> values, int maxItems, int maxLength, String field) {
        if (values.size() > maxItems || values.stream().anyMatch(value -> value == null || value.isBlank() || value.length() > maxLength)) {
            throw new IllegalArgumentException("千问字段不合规: " + field);
        }
    }

    public record ValidatedAdvice(String riskLevel, String summary, String riskExplanation,
                                  List<String> recommendations, List<String> allowedActions,
                                  List<String> pageOperations, List<String> evidenceStandards,
                                  List<String> evidenceDocuments, String dataQuality,
                                  List<String> uncertainties) {
    }
}

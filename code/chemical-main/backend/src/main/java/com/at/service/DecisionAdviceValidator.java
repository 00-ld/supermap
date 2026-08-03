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
        return new ValidatedAdvice(risk, response.summary(), response.riskExplanation(),
                response.recommendations(), actions);
    }

    public record ValidatedAdvice(String riskLevel, String summary, String riskExplanation,
                                  List<String> recommendations, List<String> allowedActions) {
    }
}

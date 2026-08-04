package com.at.service;

import com.at.mapper.AiDecisionAdviceMapper;
import com.at.mapper.WarningHistoryMapper;
import com.at.pojo.AiDecisionAdvice;
import com.at.pojo.WarningHistory;
import com.at.pojo.dto.AiAdviceCreateDTO;
import com.at.pojo.dto.AiAdviceReviewDTO;
import com.at.pojo.dto.AiAdviceQuickDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DecisionSupportService {
    @Resource private AiDecisionAdviceMapper adviceMapper;
    @Resource private WarningHistoryMapper warningHistoryMapper;
    @Resource private DecisionRuleService ruleService;
    @Resource private DecisionAdviceValidator validator;
    @Resource private QwenClient qwenClient;
    @Resource private ObjectMapper objectMapper;

    public AiDecisionAdvice create(AiAdviceCreateDTO dto) {
        WarningHistory alert = warningHistoryMapper.selectById(dto.getAlertId());
        if (alert == null) throw new IllegalArgumentException("告警记录不存在: " + dto.getAlertId());
        return createFromAlert(alert, dto.getAlertType(), dto.getEvidence(), true);
    }

    public AiDecisionAdvice quick(AiAdviceQuickDTO dto) {
        WarningHistory alert = new WarningHistory();
        alert.setId(null);
        alert.setCarId(dto.getCarId() == null ? 0 : dto.getCarId());
        alert.setAreaName("现场应急输入");
        alert.setGasType(blankOr(dto.getGasType(), "UNKNOWN"));
        alert.setGasValue(dto.getGasValue() != null && Double.isFinite(dto.getGasValue()) ? dto.getGasValue() : null);
        return createFromAlert(alert, "EMERGENCY_QUICK_DECISION", dto.getScenario(), true);
    }

    private AiDecisionAdvice createFromAlert(WarningHistory alert, String alertType, String evidence, boolean persist) {
        DecisionRuleService.RuleAdvice rule = ruleService.build(alert);
        AiDecisionAdvice advice = new AiDecisionAdvice();
        advice.setAlertId(alert.getId());
        advice.setCarId(alert.getCarId());
        advice.setAlertType(blankOr(alertType, "GAS_CONCENTRATION"));
        advice.setReviewStatus("PENDING");
        try {
            QwenClient.QwenResponse qwen = qwenClient.generate(alert, advice.getAlertType(), evidence, rule);
            DecisionAdviceValidator.ValidatedAdvice validated = validator.validate(qwen, rule);
            fill(advice, "QWEN", qwen.model(), validated.riskLevel(), validated.summary(),
                    validated.riskExplanation(), validated.recommendations(), validated.allowedActions(),
                    validated.pageOperations(), validated.evidenceStandards(), validated.evidenceDocuments(),
                    validated.dataQuality(), validated.uncertainties(), null);
        } catch (RuntimeException ex) {
            fill(advice, "RULE", null, rule.getRiskLevel(), rule.getSummary(), rule.getRiskExplanation(),
                    rule.getRecommendations(), rule.getAllowedActions(), rule.getPageOperations(),
                    rule.getEvidenceStandards(), rule.getEvidenceDocuments(), rule.getDataQuality(),
                    rule.getUncertainties(), ex.getMessage());
        }
        if (persist) adviceMapper.insert(advice);
        return advice;
    }

    public AiDecisionAdvice get(Long id) {
        AiDecisionAdvice advice = adviceMapper.selectById(id);
        if (advice == null) throw new IllegalArgumentException("AI建议不存在: " + id);
        return advice;
    }

    public AiDecisionAdvice getLatestByAlertId(Integer alertId) {
        return adviceMapper.selectLatestByAlertId(alertId);
    }

    public AiDecisionAdvice review(Long id, AiAdviceReviewDTO dto, String reviewer) {
        if (!List.of("APPROVED", "REJECTED").contains(dto.getStatus())) {
            throw new IllegalArgumentException("审核状态只能是 APPROVED 或 REJECTED");
        }
        AiDecisionAdvice advice = get(id);
        advice.setReviewStatus(dto.getStatus());
        advice.setReviewedBy(reviewer == null || reviewer.isBlank() ? "admin" : reviewer);
        advice.setReviewComment(dto.getComment());
        advice.setReviewedAt(LocalDateTime.now());
        adviceMapper.updateReview(advice);
        return advice;
    }

    private void fill(AiDecisionAdvice advice, String source, String model, String risk, String summary,
                      String explanation, List<String> recommendations, List<String> actions,
                      List<String> pageOperations, List<String> evidenceStandards,
                      List<String> evidenceDocuments, String dataQuality, List<String> uncertainties,
                      String fallbackReason) {
        try {
            advice.setSource(source);
            advice.setModel(model);
            advice.setRiskLevel(risk);
            advice.setSummary(summary);
            advice.setRiskExplanation(explanation);
            advice.setRecommendations(objectMapper.writeValueAsString(recommendations));
            advice.setAllowedActions(objectMapper.writeValueAsString(actions));
            advice.setPageOperations(objectMapper.writeValueAsString(pageOperations));
            advice.setEvidenceStandards(objectMapper.writeValueAsString(evidenceStandards));
            advice.setEvidenceDocuments(objectMapper.writeValueAsString(evidenceDocuments));
            advice.setDataQuality(dataQuality);
            advice.setUncertainties(objectMapper.writeValueAsString(uncertainties));
            // Structured fields are sufficient for audit and avoid storing provider envelopes or prompts.
            advice.setRawResponse(null);
            advice.setFallbackReason(fallbackReason);
        } catch (Exception e) {
            throw new IllegalStateException("序列化AI建议失败", e);
        }
    }

    private String blankOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}

package com.at.service;

import com.at.pojo.WarningHistory;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class DecisionRuleService {
    public static final List<String> ACTIONS = List.of(
            "PAUSE_PATROL", "RECHECK", "RETURN_HOME", "NOTIFY_RESPONSIBLE"
    );
    public static final List<String> DEFAULT_STANDARDS = List.of(
            "AQ/T 3052-2015《危险化学品事故应急救援指挥导则》",
            "GB/T 29639-2020",
            "GB 30077-2023",
            "GB/T 50493-2019",
            "GB 18218-2018",
            "GB 30871-2022",
            "《中华人民共和国安全生产法》",
            "《危险化学品安全管理条例》",
            "《生产安全事故应急条例》",
            "《生产安全事故应急预案管理办法》",
            "应急〔2023〕123号《化工园区安全风险排查治理导则》",
            "应急厅〔2022〕5号《化工园区安全风险智能化管控平台建设指南》"
    );
    public static final List<String> DEFAULT_DOCUMENTS = List.of(
            "D:/Desktop/chemical-park-alarm-response-plans.md",
            "docs/chemical-park-leak-emergency-response.md"
    );

    public RuleAdvice build(WarningHistory alert) {
        String gasType = alert.getGasType() == null ? "UNKNOWN" : alert.getGasType().toUpperCase(Locale.ROOT);
        Double value = alert.getGasValue();
        boolean uncertain = alert.getGasValue() == null || !Double.isFinite(alert.getGasValue())
                || "UNKNOWN".equals(gasType);
        // No universal concentration threshold is safe here; thresholds come from the approved site documents.
        String risk = uncertain ? "HIGH" : "MEDIUM";
        String valueText = value == null || !Double.isFinite(value)
                ? "未知" : String.format(Locale.ROOT, "%.2f", value);
        String summary = String.format(Locale.ROOT, "小车%d在%s发现%s浓度异常，当前值为%s，需人工确认后处置。",
                alert.getCarId(), alert.getAreaName() == null ? "未知区域" : alert.getAreaName(), gasType, valueText);
        String explanation = uncertain
                ? "介质、数值或数据质量不足，不能据此推导处置阈值，应按较高风险先暂停近距离巡检、复测并通知责任人。"
                : "当前仅能视为监测异常线索，是否超出企业处置阈值须核对仪表配置、现场方案和最新版 SDS。";
        List<String> recommendations = List.of("暂停当前点位继续前进并保持安全距离", "核对单位、阈值来源、时间戳和数据质量后复测",
                "在事故告警和巡检监测中核对告警记录与小车当前状态", "通知责任人并保留事件记录");
        return new RuleAdvice(risk, summary, explanation, recommendations,
                List.of("PAUSE_PATROL", "RECHECK", "RETURN_HOME", "NOTIFY_RESPONSIBLE"),
                List.of("事故告警核对告警详情并刷新数据", "巡检监测查看小车状态，必要时提交暂停、复测或返航申请", "任务中心创建或跟进关联任务"),
                DEFAULT_STANDARDS, DEFAULT_DOCUMENTS, "degraded",
                List.of("缺少介质最新版 SDS、现场人员状态、阈值来源和人工检测回执"));
    }

    @Data
    @AllArgsConstructor
    public static class RuleAdvice {
        private String riskLevel;
        private String summary;
        private String riskExplanation;
        private List<String> recommendations;
        private List<String> allowedActions;
        private List<String> pageOperations;
        private List<String> evidenceStandards;
        private List<String> evidenceDocuments;
        private String dataQuality;
        private List<String> uncertainties;
    }
}

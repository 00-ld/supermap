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
            "PAUSE_PATROL", "RECHECK", "ANALYZE_DIFFUSION", "RETURN_HOME", "NOTIFY_RESPONSIBLE"
    );

    public RuleAdvice build(WarningHistory alert) {
        String gasType = alert.getGasType() == null ? "UNKNOWN" : alert.getGasType().toUpperCase(Locale.ROOT);
        double value = alert.getGasValue() == null ? 0D : alert.getGasValue();
        boolean oxygenOutOfRange = "O2".equals(gasType) && (value < 19.5D || value > 23.5D);
        boolean critical = "CH4".equals(gasType) || "CO".equals(gasType) || oxygenOutOfRange || value >= 100D;
        String risk = critical ? "HIGH" : "MEDIUM";
        String summary = String.format(Locale.ROOT, "小车%d在%s发现%s浓度异常，当前值为%.2f，需人工确认后处置。",
                alert.getCarId(), alert.getAreaName() == null ? "未知区域" : alert.getAreaName(), gasType, value);
        String explanation = critical
                ? "该气体或浓度值可能带来中高风险，当前数据不足以直接判定事故范围，应先暂停近距离巡检并复测。"
                : "当前为单点异常信号，可能是瞬时波动或传感器误报，应通过复测和扩散分析确认。";
        List<String> recommendations = critical
                ? List.of("暂停当前巡检任务并保持安全距离", "立即复测并检查同区域关联监测点", "启动扩散分析并通知责任人", "确认后安排小车返航")
                : List.of("暂停当前点位继续前进", "在安全距离复测一次", "复测仍异常时开展扩散分析", "通知责任人并保留事件记录");
        return new RuleAdvice(risk, summary, explanation, recommendations,
                critical ? List.of("PAUSE_PATROL", "RECHECK", "ANALYZE_DIFFUSION", "RETURN_HOME", "NOTIFY_RESPONSIBLE")
                        : List.of("PAUSE_PATROL", "RECHECK", "ANALYZE_DIFFUSION", "NOTIFY_RESPONSIBLE"));
    }

    @Data
    @AllArgsConstructor
    public static class RuleAdvice {
        private String riskLevel;
        private String summary;
        private String riskExplanation;
        private List<String> recommendations;
        private List<String> allowedActions;
    }
}

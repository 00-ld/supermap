package com.at.service;

import com.at.pojo.WarningHistory;
import org.springframework.stereotype.Component;

public class DecisionPromptBuilder {
    private DecisionPromptBuilder() {
    }

    public static String build(WarningHistory alert, String alertType, String evidence,
                               DecisionRuleService.RuleAdvice ruleAdvice) {
        return "你是化工园区无人巡检小车的安全处置辅助助手。只输出 JSON，不要 Markdown。\n"
                + "你只能提供解释、复测、暂停、扩散分析、返航、通知等建议，不能直接控制小车，不能修改阈值、关闭避障或允许人员进入危险区。\n"
                + "JSON 字段必须为 riskLevel(LOW/MEDIUM/HIGH/CRITICAL)、summary、riskExplanation、recommendations(字符串数组)、allowedActions(动作代码数组)。\n"
                + "allowedActions 只能使用 PAUSE_PATROL、RECHECK、ANALYZE_DIFFUSION、RETURN_HOME、NOTIFY_RESPONSIBLE。\n"
                + "告警类型: " + safe(alertType, "GAS_CONCENTRATION") + "\n"
                + "小车编号: " + alert.getCarId() + "，区域: " + safe(alert.getAreaName(), "未知区域")
                + "，气体: " + safe(alert.getGasType(), "未知") + "，浓度: " + alert.getGasValue() + "\n"
                + "补充证据: " + safe(evidence, "无") + "\n"
                + "规则基线风险: " + ruleAdvice.getRiskLevel() + "。建议必须保守、可执行，并要求人工审核。";
    }

    private static String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}

package com.at.service;

import com.at.pojo.WarningHistory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class QwenClient {
    private final ObjectMapper objectMapper;

    @Value("${decision-model.enabled:false}")
    private boolean enabled;
    @Value("${decision-model.base-url:https://dashscope.aliyuncs.com/compatible-mode/v1}")
    private String baseUrl;
    @Value("${decision-model.api-key:}")
    private String apiKey;
    @Value("${decision-model.model:qwen-plus}")
    private String model;
    @Value("${decision-model.timeout-ms:30000}")
    private long timeoutMs;
    @Value("${decision-model.temperature:0.1}")
    private double temperature;
    @Value("${decision-model.max-tokens:1800}")
    private int maxTokens;

    public boolean available() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    public QwenResponse generate(WarningHistory alert, String alertType, String evidence,
                                 DecisionRuleService.RuleAdvice ruleAdvice) {
        if (!available()) {
            throw new IllegalStateException("千问未启用或未配置 DECISION_MODEL_API_KEY");
        }
        String prompt = DecisionPromptBuilder.build(alert, alertType, evidence, ruleAdvice);
        try {
            var payload = objectMapper.createObjectNode();
            payload.put("model", model);
            payload.put("temperature", temperature);
            payload.put("max_tokens", maxTokens);
            var messages = payload.putArray("messages");
            messages.addObject().put("role", "system").put("content", "严格按用户要求输出安全建议 JSON。");
            messages.addObject().put("role", "user").put("content", prompt);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(timeoutMs))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl.replaceAll("/$", "") + "/chat/completions"))
                    .timeout(Duration.ofMillis(timeoutMs))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("千问 HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) throw new IllegalStateException("千问返回内容为空");
            JsonNode result = parseJsonContent(content);
            return new QwenResponse(
                    model,
                    result.path("riskLevel").asText(""),
                    result.path("summary").asText(""),
                    result.path("riskExplanation").asText(""),
                    strings(result.path("recommendations")),
                    strings(result.path("allowedActions")),
                    response.body()
            );
        } catch (Exception e) {
            log.warn("千问建议生成失败，将使用规则兜底: {}", e.getMessage());
            throw new IllegalStateException("千问调用失败: " + e.getMessage(), e);
        }
    }

    private JsonNode parseJsonContent(String content) throws Exception {
        String normalized = content.trim();
        if (normalized.startsWith("```")) {
            normalized = normalized.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
        }
        return objectMapper.readTree(normalized);
    }

    private List<String> strings(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node.isArray()) node.forEach(item -> { if (item.isTextual()) values.add(item.asText()); });
        return values;
    }

    public record QwenResponse(String model, String riskLevel, String summary, String riskExplanation,
                               List<String> recommendations, List<String> allowedActions, String rawResponse) {
    }
}

package com.at.service;

import com.at.pojo.WarningHistory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
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
    private final EvidenceDocumentService evidenceDocumentService;
    private final DecisionPageFlow decisionPageFlow;

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
        EvidenceDocumentService.EvidenceBundle evidenceBundle = evidenceDocumentService.load();
        String prompt = DecisionPromptBuilder.build(alert, alertType, evidence, ruleAdvice,
                evidenceBundle, decisionPageFlow.describe());
        try {
            var payload = objectMapper.createObjectNode();
            payload.put("model", model);
            payload.put("temperature", Math.min(Math.max(temperature, 0D), 1D));
            payload.put("max_tokens", Math.min(Math.max(maxTokens, 300), 4000));
            var messages = payload.putArray("messages");
            messages.addObject().put("role", "system").put("content", "严格按用户要求输出安全建议 JSON。");
            messages.addObject().put("role", "user").put("content", prompt);

            long requestTimeout = Math.min(Math.max(timeoutMs, 1000L), 60000L);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(requestTimeout))
                    .build();
            URI endpoint = buildEndpoint();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(endpoint)
                    .timeout(Duration.ofMillis(requestTimeout))
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
                    strings(result.path("pageOperations")),
                    DecisionRuleService.DEFAULT_STANDARDS.stream().limit(3).toList(),
                    evidenceBundle.names().stream().limit(2).toList(),
                    result.path("dataQuality").asText("unknown"),
                    strings(result.path("uncertainties"))
            );
        } catch (Exception e) {
            log.warn("千问建议生成失败，将使用规则兜底: {}", e.getMessage());
            throw new IllegalStateException("千问调用失败: " + e.getMessage(), e);
        }
    }

    private URI buildEndpoint() throws URISyntaxException {
        String configured = baseUrl == null ? "" : baseUrl.trim();
        URI root = new URI(configured.replaceAll("/$", ""));
        boolean local = "localhost".equalsIgnoreCase(root.getHost())
                || "127.0.0.1".equals(root.getHost())
                || "[::1]".equals(root.getHost());
        if (!"https".equalsIgnoreCase(root.getScheme()) && !local) {
            throw new IllegalStateException("千问服务地址必须使用 HTTPS");
        }
        return new URI(root.toString() + "/chat/completions");
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
                               List<String> recommendations, List<String> allowedActions,
                               List<String> pageOperations, List<String> evidenceStandards,
                               List<String> evidenceDocuments, String dataQuality,
                               List<String> uncertainties) {
    }
}

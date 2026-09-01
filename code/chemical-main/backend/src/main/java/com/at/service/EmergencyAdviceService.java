package com.at.service;

import com.at.pojo.dto.AiAdviceResponseDTO;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Service
public class EmergencyAdviceService {
    private final EmergencyKnowledgeBaseService knowledgeBaseService;
    private final EmergencyLanguageModelClient languageModelClient;

    public EmergencyAdviceService(
            EmergencyKnowledgeBaseService knowledgeBaseService,
            EmergencyLanguageModelClient languageModelClient
    ) {
        this.knowledgeBaseService = knowledgeBaseService;
        this.languageModelClient = languageModelClient;
    }

    public AiAdviceResponseDTO advise(String scenario) {
        String normalizedScenario = scenario == null ? "" : scenario.trim();
        List<EmergencyKnowledgeEvidence> evidence = knowledgeBaseService.search(normalizedScenario, 3);
        if (languageModelClient.isConfigured()) {
            try {
                AiAdviceResponseDTO response = languageModelClient.generate(normalizedScenario, evidence);
                response.setSource("QWEN");
                response.setEvidenceDocuments(evidence.stream().map(EmergencyKnowledgeEvidence::title).toList());
                return response;
            } catch (RuntimeException exception) {
                log.warn("千问应急建议调用失败，切换本地知识库: type={}", exception.getClass().getSimpleName());
                return conservativeAdvice(evidence, "在线模型暂不可用，已切换到本地知识库安全建议");
            }
        }
        return conservativeAdvice(evidence, "服务端尚未配置千问密钥，当前使用本地知识库安全建议");
    }

    private AiAdviceResponseDTO conservativeAdvice(
            List<EmergencyKnowledgeEvidence> evidence,
            String fallbackReason
    ) {
        return AiAdviceResponseDTO.builder()
                .source("LOCAL_KNOWLEDGE_BASE")
                .model("local-emergency-safety-rules")
                .riskLevel("HIGH")
                .summary("疑似危险气体泄漏，应先控制人员暴露并由现场指挥确认物质、风向和影响范围。")
                .riskExplanation("人员不适意味着可能已经发生暴露；在物质和浓度未确认前，应按高风险场景设置警戒。")
                .recommendations(List.of(
                        "立即报警并启动园区应急响应，禁止无防护人员进入事故区。",
                        "组织人员沿上风向或侧上风向撤离，在安全区清点人数并对不适人员实施专业救治。",
                        "结合固定监测、便携检测和气象数据划定警戒区，持续复测边界浓度。",
                        "由具备资质且佩戴正压式空气呼吸器的人员确认泄漏源，按SDS和专项预案堵漏、洗消。",
                        "防止气体进入下水道、低洼区和受限空间，并同步通知消防、医疗、环保等联动单位。"
                ))
                .allowedActions(List.of("PAUSE_PATROL", "RECHECK", "RETURN_HOME", "NOTIFY_RESPONSIBLE"))
                .pageOperations(List.of("/monitor", "/smart-map"))
                .evidenceDocuments(evidence.stream().map(EmergencyKnowledgeEvidence::title).toList())
                .fallbackReason(fallbackReason)
                .build();
    }
}

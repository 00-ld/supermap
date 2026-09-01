package com.at.service;

import com.at.pojo.dto.AiAdviceResponseDTO;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmergencyAdviceServiceTest {

    @Test
    void returnsAConservativeKnowledgeBaseAnswerWhenQwenIsNotConfigured() {
        EmergencyKnowledgeBaseService knowledgeBase = mock(EmergencyKnowledgeBaseService.class);
        EmergencyLanguageModelClient languageModel = mock(EmergencyLanguageModelClient.class);
        when(languageModel.isConfigured()).thenReturn(false);
        when(knowledgeBase.search("液氨泄漏，东南风，有人员头晕", 3)).thenReturn(List.of(
                new EmergencyKnowledgeEvidence(
                        "液氨泄漏应急处置预案",
                        "01_预案与方案/ammonia.pdf",
                        "从上风向组织疏散并设置警戒区")));
        EmergencyAdviceService service = new EmergencyAdviceService(knowledgeBase, languageModel);

        AiAdviceResponseDTO response = service.advise("液氨泄漏，东南风，有人员头晕");

        assertEquals("LOCAL_KNOWLEDGE_BASE", response.getSource());
        assertFalse(response.getRecommendations().isEmpty());
        assertEquals(List.of("液氨泄漏应急处置预案"), response.getEvidenceDocuments());
    }
}

package com.at.service;

import com.at.pojo.dto.AiAdviceResponseDTO;

import java.util.List;

public interface EmergencyLanguageModelClient {
    boolean isConfigured();

    AiAdviceResponseDTO generate(
            String scenario,
            List<EmergencyKnowledgeEvidence> evidence
    );
}

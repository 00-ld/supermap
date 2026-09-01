package com.at.controller;

import com.at.pojo.dto.AiAdviceResponseDTO;
import com.at.service.EmergencyAdviceService;
import com.at.utils.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MobileAiAdviceController.class)
class MobileAiAdviceControllerTest {
    private final String token = JwtUtils.generateJwt(Map.of(
            "id", 1,
            "username", "tester",
            "role", "admin"));

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EmergencyAdviceService emergencyAdviceService;

    @Test
    void returnsAdviceUsingTheMobileContract() throws Exception {
        when(emergencyAdviceService.advise(anyString())).thenReturn(AiAdviceResponseDTO.builder()
                .source("LOCAL_KNOWLEDGE_BASE")
                .summary("立即组织上风向疏散")
                .recommendations(List.of("启动园区应急响应"))
                .evidenceDocuments(List.of("液氨泄漏应急处置预案"))
                .build());

        mockMvc.perform(post("/api/mobile/ai-advice/quick")
                        .header("token", token)
                        .contentType("application/json")
                        .content("{\"scenario\":\"液氨泄漏，有人员头晕\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.data.source").value("LOCAL_KNOWLEDGE_BASE"))
                .andExpect(jsonPath("$.data.summary").value("立即组织上风向疏散"));
    }

    @Test
    void rejectsAnEmptyScenario() throws Exception {
        mockMvc.perform(post("/api/mobile/ai-advice/quick")
                        .header("token", token)
                        .contentType("application/json")
                        .content("{\"scenario\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.code").value(400));
    }
}

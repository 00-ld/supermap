package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.dto.AiAdviceQuickRequestDTO;
import com.at.pojo.dto.AiAdviceResponseDTO;
import com.at.service.EmergencyAdviceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mobile/ai-advice")
public class MobileAiAdviceController {
    private final EmergencyAdviceService emergencyAdviceService;

    public MobileAiAdviceController(EmergencyAdviceService emergencyAdviceService) {
        this.emergencyAdviceService = emergencyAdviceService;
    }

    @PostMapping("/quick")
    public Result<AiAdviceResponseDTO> quickAdvice(
            @Valid @RequestBody AiAdviceQuickRequestDTO request
    ) {
        return Result.success(emergencyAdviceService.advise(request.getScenario()));
    }
}

package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.dto.AiAdviceCreateDTO;
import com.at.pojo.dto.AiAdviceResponseDTO;
import com.at.pojo.dto.AiAdviceReviewDTO;
import com.at.pojo.dto.AiAdviceQuickDTO;
import com.at.service.DecisionSupportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mobile")
public class DecisionSupportController {
    @Resource private DecisionSupportService service;
    @Resource private ObjectMapper objectMapper;

    @PostMapping("/alerts/{alertId}/ai-advice")
    @RequiresRole("admin")
    public Result<AiAdviceResponseDTO> generate(@PathVariable Integer alertId,
                                                @Valid @RequestBody AiAdviceCreateDTO dto) {
        dto.setAlertId(alertId);
        return Result.success(AiAdviceResponseDTO.fromEntity(service.create(dto), objectMapper));
    }

    @PostMapping("/ai-advice/quick")
    public Result<AiAdviceResponseDTO> quick(@Valid @RequestBody AiAdviceQuickDTO dto) {
        return Result.success(AiAdviceResponseDTO.fromEntity(service.quick(dto), objectMapper));
    }

    @GetMapping("/ai-advice/{adviceId}")
    public Result<AiAdviceResponseDTO> get(@PathVariable Long adviceId) {
        return Result.success(AiAdviceResponseDTO.fromEntity(service.get(adviceId), objectMapper));
    }

    @GetMapping("/alerts/{alertId}/ai-advice/latest")
    public Result<AiAdviceResponseDTO> latest(@PathVariable Integer alertId) {
        var advice = service.getLatestByAlertId(alertId);
        return Result.success(advice == null ? null : AiAdviceResponseDTO.fromEntity(advice, objectMapper));
    }

    @PostMapping("/ai-advice/{adviceId}/approve")
    @RequiresRole("admin")
    public Result<AiAdviceResponseDTO> approve(@PathVariable Long adviceId,
                                               @RequestBody(required = false) AiAdviceReviewDTO dto,
                                               HttpServletRequest request) {
        return review(adviceId, dto, request, "APPROVED");
    }

    @PostMapping("/ai-advice/{adviceId}/reject")
    @RequiresRole("admin")
    public Result<AiAdviceResponseDTO> reject(@PathVariable Long adviceId,
                                              @RequestBody(required = false) AiAdviceReviewDTO dto,
                                              HttpServletRequest request) {
        return review(adviceId, dto, request, "REJECTED");
    }

    @GetMapping("/ai-advice/{adviceId}/timeline")
    public Result<AiAdviceResponseDTO> timeline(@PathVariable Long adviceId) {
        return get(adviceId);
    }

    private Result<AiAdviceResponseDTO> review(Long id, AiAdviceReviewDTO dto,
                                               HttpServletRequest request, String status) {
        if (dto == null) dto = new AiAdviceReviewDTO();
        dto.setStatus(status);
        String reviewer = (String) request.getAttribute("username");
        return Result.success(AiAdviceResponseDTO.fromEntity(service.review(id, dto, reviewer), objectMapper));
    }
}

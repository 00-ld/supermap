package com.at.controller;

import com.at.pojo.EmergencyPlan;
import com.at.pojo.Result;
import com.at.pojo.dto.EmergencyPlanResponseDTO;
import com.at.service.EmergencyPlanService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/emergency-plan")
public class EmergencyPlanController {

    @Resource
    private EmergencyPlanService emergencyPlanService;

    @GetMapping("/list")
    public Result<List<EmergencyPlanResponseDTO>> list() {
        List<EmergencyPlan> plans = emergencyPlanService.getAllPlans();
        log.info("Query emergency plan list, count={}", plans.size());
        return Result.success(plans.stream().map(EmergencyPlanResponseDTO::fromEntity).toList());
    }
}

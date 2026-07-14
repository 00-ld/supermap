package com.at.service;

import com.at.mapper.EmergencyPlanMapper;
import com.at.pojo.EmergencyPlan;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class EmergencyPlanService {

    @Resource
    private EmergencyPlanMapper emergencyPlanMapper;

    public List<EmergencyPlan> getAllPlans() {
        List<EmergencyPlan> plans = emergencyPlanMapper.selectList();
        log.info("Query emergency plans, count={}", plans.size());
        return plans;
    }
}

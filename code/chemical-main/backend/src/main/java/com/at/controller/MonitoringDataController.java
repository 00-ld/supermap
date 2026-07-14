package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.dto.MonitoringOverviewDTO;
import com.at.service.MonitoringDataService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/monitoring")
public class MonitoringDataController {

    @Resource
    private MonitoringDataService monitoringDataService;

    @GetMapping("/overview")
    public Result<MonitoringOverviewDTO> overview() {
        MonitoringOverviewDTO overview = monitoringDataService.overview();
        log.info("查询监测概览: sensors={}, trend={}, latest={}, activeWarnings={}",
                overview.environment().sensorCount(),
                overview.concentrationTrend().size(),
                overview.latestReadings().size(),
                overview.activeWarningCount());
        return Result.success(overview);
    }
}

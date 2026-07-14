package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.dto.SensorReadingCreateDTO;
import com.at.pojo.dto.SensorReadingResponseDTO;
import com.at.pojo.dto.SimulationScenarioCreateDTO;
import com.at.pojo.dto.SimulationScenarioResponseDTO;
import com.at.service.SimulationMonitoringService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/simulation-monitoring")
public class SimulationMonitoringController {

    @Resource
    private SimulationMonitoringService simulationMonitoringService;

    @GetMapping("/scenarios/latest")
    public Result<SimulationScenarioResponseDTO> latestScenario() {
        return Result.success(simulationMonitoringService.latestScenario());
    }

    @GetMapping("/scenarios/recent")
    public Result<List<SimulationScenarioResponseDTO>> recentScenarios(@RequestParam(defaultValue = "20") int limit) {
        return Result.success(simulationMonitoringService.recentScenarios(limit));
    }

    @PostMapping("/scenarios/add")
    @RequiresRole("admin")
    public Result<SimulationScenarioResponseDTO> addScenario(@Valid @RequestBody SimulationScenarioCreateDTO dto) {
        return Result.success(simulationMonitoringService.addScenario(dto));
    }

    @GetMapping("/readings/latest")
    public Result<SensorReadingResponseDTO> latestReading() {
        return Result.success(simulationMonitoringService.latestReading());
    }

    @GetMapping("/readings/recent")
    public Result<List<SensorReadingResponseDTO>> recentReadings(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) String sensorId) {
        return Result.success(simulationMonitoringService.recentReadings(limit, sensorId));
    }

    @PostMapping("/readings/add")
    @RequiresRole("admin")
    public Result<SensorReadingResponseDTO> addReading(@Valid @RequestBody SensorReadingCreateDTO dto) {
        return Result.success(simulationMonitoringService.addReading(dto));
    }
}

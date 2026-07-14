package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.dto.EnvironmentReadingCreateDTO;
import com.at.pojo.dto.EnvironmentReadingResponseDTO;
import com.at.service.EnvironmentReadingService;
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
@RequestMapping("/api/environment-reading")
public class EnvironmentReadingController {

    @Resource
    private EnvironmentReadingService environmentReadingService;

    @GetMapping("/latest")
    public Result<EnvironmentReadingResponseDTO> latest() {
        return Result.success(environmentReadingService.latest());
    }

    @GetMapping("/recent")
    public Result<List<EnvironmentReadingResponseDTO>> recent(
            @RequestParam(defaultValue = "50") int limit) {
        return Result.success(environmentReadingService.recent(limit));
    }

    @PostMapping("/add")
    @RequiresRole("admin")
    public Result<EnvironmentReadingResponseDTO> add(@Valid @RequestBody EnvironmentReadingCreateDTO dto) {
        return Result.success(environmentReadingService.add(dto));
    }
}

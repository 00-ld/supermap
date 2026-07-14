package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.MonitorPoint;
import com.at.pojo.Result;
import com.at.pojo.dto.MonitorPointCreateDTO;
import com.at.pojo.dto.MonitorPointResponseDTO;
import com.at.service.MonitorPointService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 监测点管理。读列表登录即可，写操作（新增/删除）要求 admin。
 */
@Slf4j
@RestController
@RequestMapping("/api/monitor-point")
public class MonitorPointController {

    @Resource
    private MonitorPointService monitorPointService;

    @GetMapping("/list")
    public Result<List<MonitorPointResponseDTO>> list() {
        List<MonitorPoint> list = monitorPointService.listPoints();
        return Result.success(list.stream().map(MonitorPointResponseDTO::fromEntity).toList());
    }

    @PostMapping
    @RequiresRole("admin")
    public Result<MonitorPointResponseDTO> create(@Valid @RequestBody MonitorPointCreateDTO dto) {
        MonitorPoint point = monitorPointService.createPoint(dto);
        return Result.success(MonitorPointResponseDTO.fromEntity(point));
    }

    @DeleteMapping("/{id}")
    @RequiresRole("admin")
    public Result<?> delete(@PathVariable Long id) {
        boolean deleted = monitorPointService.deletePoint(id);
        if (!deleted) {
            return Result.error(400, "监测点不存在");
        }
        return Result.success("监测点已删除");
    }
}

package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.WarningHistory;
import com.at.pojo.dto.IntIdDTO;
import com.at.pojo.dto.WarningHistoryResponseDTO;
import com.at.pojo.dto.WarningAddDTO;
import com.at.service.WarningHistoryService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/history")
public class WarningHistoryController {

    @Resource
    private WarningHistoryService warningHistoryService;

    @PostMapping("/add")
    @RequiresRole("admin")
    public Result<?> addWarning(@Valid @RequestBody WarningAddDTO dto) {
        // 区域映射与真实坐标解析下沉到 service；非法 carId 由 service 抛 IllegalArgumentException，
        // 全局异常处理器统一转 400。
        warningHistoryService.addWarningRecord(dto);
        log.info("预警记录已保存, carId: {}, gasType: {}, gasValue: {}",
                dto.getCarId(), dto.getGasType(), dto.getGasValue());
        return Result.success("预警记录已保存");
    }

    @GetMapping("/list")
    public Result<List<WarningHistoryResponseDTO>> getHistoryList() {
        List<WarningHistory> list = warningHistoryService.getAllHistory();
        log.info("查询历史记录, 数量: {}", list.size());
        return Result.success(list.stream().map(WarningHistoryResponseDTO::fromEntity).toList());
    }

    @PostMapping("/delete")
    @RequiresRole("admin")
    public Result<?> deleteHistory(@Valid @RequestBody IntIdDTO dto) {
        boolean deleted = warningHistoryService.deleteHistoryById(dto.getId());
        if (!deleted) {
            return Result.error(404, "预警记录不存在");
        }
        log.info("删除历史记录, id: {}", dto.getId());
        return Result.success("删除成功");
    }
}

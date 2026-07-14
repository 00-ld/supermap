package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.SensorLayout;
import com.at.pojo.SensorLayoutDetail;
import com.at.pojo.dto.IdResponseDTO;
import com.at.pojo.dto.SensorLayoutDetailResponseDTO;
import com.at.pojo.dto.SensorLayoutResponseDTO;
import com.at.pojo.dto.SensorLayoutSaveDTO;
import com.at.pojo.dto.SensorLayoutSummaryResponseDTO;
import com.at.service.SensorLayoutService;
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

@Slf4j
@RestController
@RequestMapping("/api/sensor-layout")
public class SensorLayoutController {

    @Resource
    private SensorLayoutService sensorLayoutService;

    @GetMapping("/list")
    public Result<List<SensorLayoutSummaryResponseDTO>> getAllLayouts() {
        List<SensorLayout> list = sensorLayoutService.getAllLayouts();
        log.info("查询所有布局方案, 数量: {}", list.size());
        return Result.success(list.stream().map(SensorLayoutSummaryResponseDTO::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public Result<?> getLayoutById(@PathVariable Integer id) {
        SensorLayout layout = sensorLayoutService.getLayoutById(id);
        if (layout == null) {
            return Result.error(400, "布局方案不存在");
        }
        List<SensorLayoutDetail> details = sensorLayoutService.getLayoutDetails(id);
        return Result.success(new SensorLayoutResponseDTO(
                SensorLayoutSummaryResponseDTO.fromEntity(layout),
                details.stream().map(SensorLayoutDetailResponseDTO::fromEntity).toList()
        ));
    }

    @PostMapping("/save")
    @RequiresRole("admin")
    public Result<?> saveLayout(@Valid @RequestBody SensorLayoutSaveDTO dto) {
        Integer layoutId = sensorLayoutService.saveLayout(dto);
        log.info("保存布局方案成功: id={}", layoutId);
        return Result.success(new IdResponseDTO(layoutId));
    }

    @DeleteMapping("/{id}")
    @RequiresRole("admin")
    public Result<?> deleteLayout(@PathVariable Integer id) {
        boolean deleted = sensorLayoutService.deleteLayout(id);
        if (!deleted) {
            return Result.error(400, "布局方案不存在");
        }
        log.info("删除布局方案成功: id={}", id);
        return Result.success("布局方案已删除");
    }
}

package com.at.controller;

import com.alibaba.fastjson.JSONObject;
import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.YoloSummary;
import com.at.pojo.dto.InspectRecordResponseDTO;
import com.at.service.ImageAnalysisException;
import com.at.service.ImageAnalysisService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/analysis")
public class ImageAnalysisController {

    @Resource
    private ImageAnalysisService imageAnalysisService;

    @PostMapping("/person")
    @RequiresRole("admin")
    public Result<?> analyzePerson(@RequestParam("file") MultipartFile file) {
        try {
            JSONObject analysisData = imageAnalysisService.analyzePerson(file);
            return Result.success(analysisData);
        } catch (ImageAnalysisException exception) {
            log.warn("人员分析请求失败: code={}, message={}", exception.getCode(), exception.getMessage());
            return Result.error(exception.getCode(), exception.getMessage());
        }
    }

    @GetMapping("/list")
    public Result<List<InspectRecordResponseDTO>> getList() {
        log.info("查询巡检记录列表");
        return Result.success(imageAnalysisService.listRecords());
    }

    @GetMapping("/summary")
    public Result<YoloSummary> getSummary() {
        YoloSummary summary = imageAnalysisService.summary();
        log.info("查询 YOLO 汇总指标: currentCount={}, analysisTime={}, riskCount={}, onlineDevices={}",
                summary.getCurrentCount(), summary.getAnalysisTime(),
                summary.getRiskCount(), summary.getOnlineDevices());
        return Result.success(summary);
    }

    @DeleteMapping("/delete/{id}")
    @RequiresRole("admin")
    public Result<?> delete(@PathVariable Long id) {
        boolean deleted = imageAnalysisService.deleteRecord(id);
        if (!deleted) {
            return Result.error(404, "巡检记录不存在");
        }
        log.info("删除巡检记录，id：{}", id);
        return Result.success("删除成功");
    }
}

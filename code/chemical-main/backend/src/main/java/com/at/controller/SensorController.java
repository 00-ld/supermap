package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.Sensor;
import com.at.pojo.dto.SensorResponseDTO;
import com.at.pojo.dto.SensorSaveDTO;
import com.at.pojo.dto.StringIdDTO;
import com.at.service.SensorService;
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
@RequestMapping("/api/sensor")
public class SensorController {

    @Resource
    private SensorService sensorService;

    @GetMapping("/list")
    public Result<List<SensorResponseDTO>> getAllSensors() {
        List<Sensor> list = sensorService.getAllSensors();
        log.info("查询所有传感器, 数量: {}", list.size());
        return Result.success(list.stream().map(SensorResponseDTO::fromEntity).toList());
    }

    @PostMapping("/add")
    @RequiresRole("admin")
    public Result<?> addSensor(@Valid @RequestBody SensorSaveDTO dto) {
        Sensor sensor = toSensor(dto);
        sensorService.addSensor(sensor);
        log.info("新增传感器成功: id={}", sensor.getId());
        return Result.success("传感器已保存");
    }

    @PostMapping("/update")
    @RequiresRole("admin")
    public Result<?> updateSensor(@Valid @RequestBody SensorSaveDTO dto) {
        Sensor sensor = toSensor(dto);
        boolean updated = sensorService.updateSensor(sensor);
        if (!updated) {
            log.warn("Update sensor rejected because id does not exist: id={}", sensor.getId());
            return Result.error(404, "Sensor not found");
        }
        log.info("更新传感器成功: id={}", sensor.getId());
        return Result.success("传感器已更新");
    }

    @PostMapping("/delete")
    @RequiresRole("admin")
    public Result<?> deleteSensor(@Valid @RequestBody StringIdDTO dto) {
        boolean deleted = sensorService.deleteSensor(dto.getId());
        if (!deleted) {
            log.warn("Delete sensor rejected because id does not exist: id={}", dto.getId());
            return Result.error(404, "Sensor not found");
        }
        log.info("删除传感器成功: id={}", dto.getId());
        return Result.success("传感器已删除");
    }

    private Sensor toSensor(SensorSaveDTO dto) {
        Sensor sensor = new Sensor();
        sensor.setId(trim(dto.getId()));
        sensor.setX(dto.getX());
        sensor.setY(dto.getY());
        sensor.setInstallationHeight(dto.getInstallationHeight());
        sensor.setEffectiveRange(dto.getEffectiveRange());
        sensor.setDetectionRange(trim(dto.getDetectionRange()));
        sensor.setInstallRemark(trim(dto.getInstallRemark()));
        sensor.setPriority(dto.getPriority());
        sensor.setRisk(dto.getRisk());
        sensor.setType(trim(dto.getType()));
        sensor.setMode(trim(dto.getMode()));
        sensor.setLastSampleTime(dto.getLastSampleTime());
        return sensor;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}

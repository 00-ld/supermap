package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Car;
import com.at.pojo.Result;
import com.at.pojo.dto.CarActionDTO;
import com.at.pojo.dto.CarResponseDTO;
import com.at.service.CarService;
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
@RequestMapping("/api/car")
public class CarController {

    @Resource
    private CarService carService;

    @GetMapping("/getAllCars")
    public Result<List<CarResponseDTO>> getAllCars() {
        List<Car> carList = carService.getAllCars();
        log.info("查询所有小车状态, 数量: {}", carList.size());
        return Result.success(carList.stream().map(CarResponseDTO::fromEntity).toList());
    }

    @PostMapping("/setWarning")
    @RequiresRole("admin")
    public Result<?> setWarning(@Valid @RequestBody CarActionDTO dto) {
        int rows = carService.setWarning(dto.getCarId());
        if (rows == 0) {
            return Result.error(404, "小车不存在");
        }
        log.info("小车{}预警设置成功", dto.getCarId());
        return Result.success("预警设置成功");
    }

    @PostMapping("/resetStatus")
    @RequiresRole("admin")
    public Result<?> resetStatus(@Valid @RequestBody CarActionDTO dto) {
        int rows = carService.resetStatus(dto.getCarId());
        if (rows == 0) {
            return Result.error(404, "小车不存在");
        }
        log.info("小车{}状态重置成功", dto.getCarId());
        return Result.success("状态重置成功");
    }
}

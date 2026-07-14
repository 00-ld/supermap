package com.at.service;

import com.at.mapper.CarMapper;
import com.at.pojo.Car;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class CarService {

    @Resource
    private CarMapper carMapper;

    public int setWarning(Integer carId) {
        int rows = carMapper.setWarning(carId);
        log.info("设置小车{}预警, 影响行数: {}", carId, rows);
        return rows;
    }

    public int resetStatus(Integer carId) {
        int rows = carMapper.resetStatus(carId);
        log.info("重置小车{}状态, 影响行数: {}", carId, rows);
        return rows;
    }

    public List<Car> getAllCars() {
        List<Car> list = carMapper.getAllCars();
        log.info("查询所有小车状态, 数量: {}", list.size());
        return list;
    }
}

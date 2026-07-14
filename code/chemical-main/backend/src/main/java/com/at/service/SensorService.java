package com.at.service;

import com.at.mapper.SensorMapper;
import com.at.pojo.Sensor;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class SensorService {

    @Resource
    private SensorMapper sensorMapper;

    public boolean addSensor(Sensor sensor) {
        int rows = sensorMapper.insert(sensor);
        log.info("新增传感器: id={}, x={}, y={}, 影响行数: {}", sensor.getId(), sensor.getX(), sensor.getY(), rows);
        return rows > 0;
    }

    public boolean updateSensor(Sensor sensor) {
        int rows = sensorMapper.updateById(sensor);
        log.info("更新传感器: id={}, 影响行数: {}", sensor.getId(), rows);
        return rows > 0;
    }

    public boolean deleteSensor(String id) {
        int rows = sensorMapper.deleteById(id);
        log.info("删除传感器: id={}, 实际删除行数: {}", id, rows);
        return rows > 0;
    }

    public List<Sensor> getAllSensors() {
        List<Sensor> list = sensorMapper.selectList();
        log.info("查询所有传感器, 数量: {}", list.size());
        return list;
    }

    public Sensor getSensorById(String id) {
        return sensorMapper.selectById(id);
    }
}

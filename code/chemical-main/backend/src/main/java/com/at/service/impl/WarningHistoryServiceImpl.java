package com.at.service.impl;

import com.at.mapper.CarMapper;
import com.at.mapper.WarningHistoryMapper;
import com.at.pojo.Car;
import com.at.pojo.WarningHistory;
import com.at.pojo.dto.WarningAddDTO;
import com.at.service.WarningHistoryService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class WarningHistoryServiceImpl implements WarningHistoryService {

    /** carId → 区域名称的映射。坐标不在这里编造，来自 patrol_car 表的小车真实位置。 */
    private static final Map<Integer, String> CAR_AREA_MAP = Map.of(
            1, "东区",
            2, "南区",
            3, "西区",
            4, "北区"
    );

    @Resource
    private WarningHistoryMapper warningHistoryMapper;

    @Resource
    private CarMapper carMapper;

    @Override
    public boolean addWarningRecord(WarningAddDTO dto) {
        Integer carId = dto.getCarId();
        String areaName = CAR_AREA_MAP.get(carId);
        if (areaName == null) {
            throw new IllegalArgumentException("小车编号无效: " + carId);
        }

        // 坐标取自 patrol_car 表中该小车的真实实时位置，不再用 Random 编造。
        Car car = carMapper.getByCarId(carId);
        if (car == null) {
            throw new IllegalArgumentException("小车不存在: " + carId);
        }

        WarningHistory record = new WarningHistory();
        record.setCarId(carId);
        record.setAreaName(areaName);
        record.setX(car.getX());
        record.setY(car.getY());
        record.setGasType(dto.getGasType());
        record.setGasValue(dto.getGasValue());
        record.setWarningTime(LocalDateTime.now());

        int rows = warningHistoryMapper.insert(record);
        log.info("新增预警记录, carId: {}, gasType: {}, 坐标: ({},{}), rows: {}",
                carId, dto.getGasType(), car.getX(), car.getY(), rows);
        return rows > 0;
    }

    @Override
    public List<WarningHistory> getAllHistory() {
        List<WarningHistory> list = warningHistoryMapper.selectList();
        log.info("查询预警历史, 数量: {}", list.size());
        return list;
    }

    @Override
    public boolean deleteHistoryById(Integer id) {
        int rows = warningHistoryMapper.deleteById(id);
        log.info("删除预警记录, id: {}, 实际删除行数: {}", id, rows);
        return rows > 0;
    }
}

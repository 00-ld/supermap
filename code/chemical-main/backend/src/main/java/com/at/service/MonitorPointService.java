package com.at.service;

import com.at.mapper.MonitorPointMapper;
import com.at.pojo.MonitorPoint;
import com.at.pojo.dto.MonitorPointCreateDTO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class MonitorPointService {

    private static final String DEFAULT_SOURCE_TYPE = "manual";
    private static final String DEFAULT_QUALITY_STATUS = "UNBOUND";

    @Resource
    private MonitorPointMapper monitorPointMapper;

    public List<MonitorPoint> listPoints() {
        List<MonitorPoint> list = monitorPointMapper.selectList();
        log.info("查询监测点列表, 数量: {}", list.size());
        return list;
    }

    public MonitorPoint createPoint(MonitorPointCreateDTO dto) {
        MonitorPoint point = new MonitorPoint();
        point.setName(trim(dto.getName()));
        point.setAreaName(trim(dto.getAreaName()));
        point.setSourceType(defaultIfBlank(dto.getSourceType(), DEFAULT_SOURCE_TYPE));
        point.setSensorId(trim(dto.getSensorId()));
        point.setCameraUrl(trim(dto.getCameraUrl()));
        point.setX(dto.getX());
        point.setY(dto.getY());
        point.setQualityStatus(defaultIfBlank(dto.getQualityStatus(), DEFAULT_QUALITY_STATUS).toUpperCase());
        int rows = monitorPointMapper.insert(point);
        if (rows <= 0) {
            throw new IllegalStateException("监测点保存失败");
        }
        log.info("创建监测点成功: id={}, name={}, affectedRows={}", point.getId(), point.getName(), rows);
        return point;
    }

    public boolean deletePoint(Long id) {
        int rows = monitorPointMapper.deleteById(id);
        log.info("删除监测点, id={}, 实际删除行数: {}", id, rows);
        return rows > 0;
    }

    private static String defaultIfBlank(String value, String fallback) {
        String trimmed = trim(value);
        return trimmed == null || trimmed.isBlank() ? fallback : trimmed;
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}

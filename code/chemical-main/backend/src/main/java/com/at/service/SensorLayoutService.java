package com.at.service;

import com.at.mapper.SensorLayoutMapper;
import com.at.pojo.SensorLayout;
import com.at.pojo.SensorLayoutDetail;
import com.at.pojo.dto.SensorLayoutDetailDTO;
import com.at.pojo.dto.SensorLayoutSaveDTO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class SensorLayoutService {

    @Resource
    private SensorLayoutMapper sensorLayoutMapper;

    @Transactional
    public Integer saveLayout(SensorLayoutSaveDTO dto) {
        validateAndNormalizeUniqueSensorIds(dto.getDetails());

        SensorLayout layout = new SensorLayout();
        layout.setLayoutName(dto.getLayoutName());
        layout.setDescription(dto.getDescription());
        layout.setCoverageRate(dto.getCoverageRate());
        layout.setRiskScore(dto.getRiskScore());
        layout.setSensorCount(dto.getDetails().size());
        layout.setStatus("draft");
        int layoutRows = sensorLayoutMapper.insertLayout(layout);
        if (layoutRows <= 0 || layout.getId() == null) {
            throw new IllegalStateException("布局方案保存失败");
        }
        Integer layoutId = layout.getId();

        for (SensorLayoutDetailDTO d : dto.getDetails()) {
            SensorLayoutDetail detail = new SensorLayoutDetail();
            detail.setLayoutId(layoutId);
            detail.setSensorId(d.getSensorId());
            detail.setX(d.getX());
            detail.setY(d.getY());
            detail.setInstallationHeight(d.getInstallationHeight());
            detail.setEffectiveRange(d.getEffectiveRange());
            detail.setDetectionRange(d.getDetectionRange());
            detail.setPriority(d.getPriority());
            detail.setRisk(d.getRisk());
            int detailRows = sensorLayoutMapper.insertDetail(detail);
            if (detailRows <= 0) {
                throw new IllegalStateException("布局方案明细保存失败: " + detail.getSensorId());
            }
        }

        log.info("保存布局方案: id={}, name={}, 传感器数量: {}, affectedRows: {}",
                layoutId, layout.getLayoutName(), dto.getDetails().size(), layoutRows);
        return layoutId;
    }

    private void validateAndNormalizeUniqueSensorIds(List<SensorLayoutDetailDTO> details) {
        Set<String> sensorIds = new HashSet<>();
        for (SensorLayoutDetailDTO detail : details) {
            String sensorId = normalizeSensorId(detail.getSensorId());
            if (sensorId.isEmpty()) {
                throw new IllegalArgumentException("sensorId 不能为空");
            }
            if (!sensorIds.add(sensorId)) {
                throw new IllegalArgumentException("同一布局方案不能重复包含传感器: " + sensorId);
            }
            detail.setSensorId(sensorId);
        }
    }

    private String normalizeSensorId(String sensorId) {
        return sensorId == null ? "" : sensorId.trim();
    }

    /** 依据 mapper 实际影响行数返回真实结果（明细由外键 ON DELETE CASCADE 级联删除）。 */
    public boolean deleteLayout(Integer id) {
        int rows = sensorLayoutMapper.deleteLayout(id);
        log.info("删除布局方案: id={}, 影响行数: {}", id, rows);
        return rows > 0;
    }

    public List<SensorLayout> getAllLayouts() {
        return sensorLayoutMapper.selectLayoutList();
    }

    public SensorLayout getLayoutById(Integer id) {
        return sensorLayoutMapper.selectLayoutById(id);
    }

    public List<SensorLayoutDetail> getLayoutDetails(Integer layoutId) {
        return sensorLayoutMapper.selectDetailsByLayoutId(layoutId);
    }
}

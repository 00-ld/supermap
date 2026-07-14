package com.at.service;

import com.at.mapper.EnvironmentReadingMapper;
import com.at.pojo.EnvironmentReading;
import com.at.pojo.dto.EnvironmentReadingCreateDTO;
import com.at.pojo.dto.EnvironmentReadingResponseDTO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class EnvironmentReadingService {

    @Resource
    private EnvironmentReadingMapper environmentReadingMapper;

    public EnvironmentReadingResponseDTO latest() {
        return EnvironmentReadingResponseDTO.fromEntity(environmentReadingMapper.selectLatest());
    }

    public List<EnvironmentReadingResponseDTO> recent(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return environmentReadingMapper.selectRecent(safeLimit)
                .stream()
                .map(EnvironmentReadingResponseDTO::fromEntity)
                .toList();
    }

    public EnvironmentReadingResponseDTO add(EnvironmentReadingCreateDTO dto) {
        if (dto.getWindSpeed() == null
                && dto.getWindDirection() == null
                && dto.getTemperature() == null
                && dto.getHumidity() == null
                && dto.getPressure() == null
                && dto.getNoise() == null) {
            throw new IllegalArgumentException("至少需要一个环境观测指标");
        }

        EnvironmentReading reading = new EnvironmentReading();
        reading.setSource(dto.getSource());
        reading.setWindSpeed(dto.getWindSpeed());
        reading.setWindDirection(dto.getWindDirection());
        reading.setTemperature(dto.getTemperature());
        reading.setHumidity(dto.getHumidity());
        reading.setPressure(dto.getPressure());
        reading.setNoise(dto.getNoise());
        reading.setObservedAt(dto.getObservedAt());

        int rows = environmentReadingMapper.insert(reading);
        if (rows <= 0) {
            throw new IllegalStateException("环境观测数据保存失败");
        }
        log.info("环境观测数据已保存: id={}, source={}, observedAt={}, affectedRows={}",
                reading.getId(), reading.getSource(), reading.getObservedAt(), rows);
        return EnvironmentReadingResponseDTO.fromEntity(reading);
    }
}

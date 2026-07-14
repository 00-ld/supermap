package com.at.mapper;

import com.at.pojo.SensorReading;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SensorReadingMapper {
    int insert(SensorReading reading);

    SensorReading selectLatest();

    List<SensorReading> selectRecent(@Param("limit") int limit);

    List<SensorReading> selectRecentBySensor(@Param("sensorId") String sensorId, @Param("limit") int limit);
}

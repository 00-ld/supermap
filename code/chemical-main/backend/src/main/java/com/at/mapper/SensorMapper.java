package com.at.mapper;

import com.at.pojo.Sensor;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SensorMapper {
    int insert(Sensor sensor);
    int updateById(Sensor sensor);
    int deleteById(String id);
    List<Sensor> selectList();
    Sensor selectById(String id);
}

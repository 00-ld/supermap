package com.at.mapper;

import com.at.pojo.SensorLayout;
import com.at.pojo.SensorLayoutDetail;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SensorLayoutMapper {
    int insertLayout(SensorLayout layout);
    int deleteLayout(Integer id);
    List<SensorLayout> selectLayoutList();
    SensorLayout selectLayoutById(Integer id);

    int insertDetail(SensorLayoutDetail detail);
    List<SensorLayoutDetail> selectDetailsByLayoutId(Integer layoutId);
}

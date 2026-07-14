package com.at.mapper;

import com.at.pojo.EnvironmentReading;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EnvironmentReadingMapper {
    int insert(EnvironmentReading reading);

    EnvironmentReading selectLatest();

    List<EnvironmentReading> selectRecent(@Param("limit") int limit);
}

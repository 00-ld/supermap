package com.at.mapper;

import com.at.pojo.EmergencyPlan;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface EmergencyPlanMapper {
    List<EmergencyPlan> selectList();
}

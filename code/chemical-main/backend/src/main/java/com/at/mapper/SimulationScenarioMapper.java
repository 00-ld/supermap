package com.at.mapper;

import com.at.pojo.SimulationScenario;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SimulationScenarioMapper {
    int insert(SimulationScenario scenario);

    SimulationScenario selectLatest();

    SimulationScenario selectByCode(@Param("scenarioCode") String scenarioCode);

    List<SimulationScenario> selectRecent(@Param("limit") int limit);
}

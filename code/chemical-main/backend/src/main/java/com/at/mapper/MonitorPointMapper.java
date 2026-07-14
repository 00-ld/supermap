package com.at.mapper;

import com.at.pojo.MonitorPoint;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MonitorPointMapper {

    @Select("""
            SELECT id,
                   name,
                   area_name AS areaName,
                   source_type AS sourceType,
                   sensor_id AS sensorId,
                   camera_url AS cameraUrl,
                   x,
                   y,
                   quality_status AS qualityStatus,
                   create_time AS createTime,
                   updated_at AS updatedAt
            FROM monitor_point
            ORDER BY id ASC
            """)
    List<MonitorPoint> selectList();

    @Insert("""
            INSERT INTO monitor_point(
                name, area_name, source_type, sensor_id, camera_url, x, y, quality_status, create_time
            ) VALUES(
                #{name}, #{areaName}, #{sourceType}, #{sensorId}, #{cameraUrl}, #{x}, #{y}, #{qualityStatus}, NOW()
            )
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(MonitorPoint point);

    @Delete("DELETE FROM monitor_point WHERE id = #{id}")
    int deleteById(Long id);
}

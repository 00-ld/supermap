package com.at.mapper;

import com.at.pojo.InspectRecord;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface InspectRecordMapper {

    @Insert("INSERT INTO inspect_record(create_time, person_count, location, status, image_base64, analysis_time) " +
            "VALUES(#{createTime}, #{personCount}, #{location}, #{status}, #{imageBase64}, #{analysisTime})")
    int insert(InspectRecord record);

    @Select("SELECT id, create_time, person_count, location, status, analysis_time FROM inspect_record ORDER BY create_time DESC")
    List<InspectRecord> listAll();

    @Select("SELECT id, create_time, person_count, location, status, analysis_time FROM inspect_record ORDER BY create_time DESC, id DESC LIMIT 1")
    InspectRecord findLatest();

    @Select("SELECT COUNT(*) FROM inspect_record WHERE status = '异常'")
    int countRiskRecords();

    @Delete("DELETE FROM inspect_record WHERE id=#{id}")
    int deleteById(Long id);
}

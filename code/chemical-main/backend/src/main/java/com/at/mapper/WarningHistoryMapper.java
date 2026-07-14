package com.at.mapper;

import com.at.pojo.WarningHistory;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface WarningHistoryMapper {
    // 新增记录
    int insert(WarningHistory warningHistory);

    // 查询所有记录（无参数）
    List<WarningHistory> selectList();

    // 删除记录
    int deleteById(Integer id);
}
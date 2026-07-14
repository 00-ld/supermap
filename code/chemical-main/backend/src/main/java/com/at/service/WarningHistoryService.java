package com.at.service;

import com.at.pojo.WarningHistory;
import com.at.pojo.dto.WarningAddDTO;
import java.util.List;

public interface WarningHistoryService {
    // 新增预警记录：区域映射与真实坐标在实现类内解析（坐标取自 patrol_car 表的小车实时位置，不编造）
    boolean addWarningRecord(WarningAddDTO dto);
    // 查询所有历史记录（按预警时间倒序）
    List<WarningHistory> getAllHistory();
    // 删除单条记录
    boolean deleteHistoryById(Integer id);
}

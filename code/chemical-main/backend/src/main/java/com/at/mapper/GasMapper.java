package com.at.mapper;

import com.at.pojo.Gas;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface GasMapper {
    int insert(Gas gas);
    int updateById(Gas gas);
    int deleteById(String id);
    List<Gas> selectList();
    Gas selectById(String id);
}

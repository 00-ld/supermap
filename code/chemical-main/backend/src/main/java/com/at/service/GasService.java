package com.at.service;

import com.at.mapper.GasMapper;
import com.at.pojo.Gas;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class GasService {

    @Resource
    private GasMapper gasMapper;

    public boolean addGas(Gas gas) {
        int rows = gasMapper.insert(gas);
        log.info("新增气体类型: id={}, name={}, 影响行数: {}", gas.getId(), gas.getName(), rows);
        return rows > 0;
    }

    public boolean updateGas(Gas gas) {
        int rows = gasMapper.updateById(gas);
        log.info("更新气体类型: id={}, 影响行数: {}", gas.getId(), rows);
        return rows > 0;
    }

    public boolean deleteGas(String id) {
        int rows = gasMapper.deleteById(id);
        log.info("删除气体类型: id={}, 实际删除行数: {}", id, rows);
        return rows > 0;
    }

    public List<Gas> getAllGases() {
        List<Gas> list = gasMapper.selectList();
        log.info("查询所有气体类型, 数量: {}", list.size());
        return list;
    }

    public Gas getGasById(String id) {
        return gasMapper.selectById(id);
    }
}

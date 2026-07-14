package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Gas;
import com.at.pojo.Result;
import com.at.pojo.dto.GasResponseDTO;
import com.at.pojo.dto.GasSaveDTO;
import com.at.pojo.dto.StringIdDTO;
import com.at.service.GasService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/gas")
public class GasController {

    @Resource
    private GasService gasService;

    @GetMapping("/list")
    public Result<List<GasResponseDTO>> getAllGases() {
        List<Gas> list = gasService.getAllGases();
        log.info("查询所有气体类型, 数量: {}", list.size());
        return Result.success(list.stream().map(GasResponseDTO::fromEntity).toList());
    }

    @PostMapping("/add")
    @RequiresRole("admin")
    public Result<?> addGas(@Valid @RequestBody GasSaveDTO dto) {
        Gas gas = toGas(dto);
        gasService.addGas(gas);
        log.info("新增气体类型成功: id={}, name={}", gas.getId(), gas.getName());
        return Result.success("气体类型已保存");
    }

    @PostMapping("/update")
    @RequiresRole("admin")
    public Result<?> updateGas(@Valid @RequestBody GasSaveDTO dto) {
        Gas gas = toGas(dto);
        boolean updated = gasService.updateGas(gas);
        if (!updated) {
            log.warn("Update gas type rejected because id does not exist: id={}", gas.getId());
            return Result.error(404, "Gas type not found");
        }
        log.info("更新气体类型成功: id={}", gas.getId());
        return Result.success("气体类型已更新");
    }

    @PostMapping("/delete")
    @RequiresRole("admin")
    public Result<?> deleteGas(@Valid @RequestBody StringIdDTO dto) {
        boolean deleted = gasService.deleteGas(dto.getId());
        if (!deleted) {
            log.warn("Delete gas type rejected because id does not exist: id={}", dto.getId());
            return Result.error(404, "Gas type not found");
        }
        log.info("删除气体类型成功: id={}", dto.getId());
        return Result.success("气体类型已删除");
    }

    private Gas toGas(GasSaveDTO dto) {
        Gas gas = new Gas();
        gas.setId(trim(dto.getId()));
        gas.setName(trim(dto.getName()));
        gas.setDetectionRange(trim(dto.getDetectionRange()));
        gas.setInstallationHeight(dto.getInstallationHeight());
        gas.setEffectiveRange(dto.getEffectiveRange());
        gas.setInstallRemark(trim(dto.getInstallRemark()));
        gas.setPriority(dto.getPriority());
        gas.setRisk(dto.getRisk());
        gas.setType(trim(dto.getType()));
        gas.setMode(trim(dto.getMode()));
        return gas;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}

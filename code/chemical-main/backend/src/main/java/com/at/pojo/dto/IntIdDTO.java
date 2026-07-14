package com.at.pojo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 以整型 id 为主键的删除请求体（预警历史）。取代 {@code Map<String,Integer>}。
 */
@Data
public class IntIdDTO {

    @NotNull(message = "id 不能为空")
    private Integer id;
}

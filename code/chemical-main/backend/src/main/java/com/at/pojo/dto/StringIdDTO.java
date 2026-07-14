package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 以字符串 id 为主键的删除请求体（传感器 / 气体类型）。取代 {@code Map<String,String>}。
 */
@Data
public class StringIdDTO {

    @NotBlank(message = "id 不能为空")
    private String id;
}

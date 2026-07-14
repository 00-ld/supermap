package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 更新用户的请求体（admin 权限）。可改角色，可选改密码（留空则不改）。
 */
@Data
public class UserUpdateDTO {

    @NotBlank(message = "角色不能为空")
    private String role;

    /** 留空表示不修改密码；非空则重新哈希。 */
    private String password;
}

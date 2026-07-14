package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建用户的请求体（admin 权限）。role 合法性由 service 强制校验。
 */
@Data
public class UserCreateDTO {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    /** 角色，缺省为 user；只接受 admin / user，由 service 校验。 */
    private String role = "user";
}

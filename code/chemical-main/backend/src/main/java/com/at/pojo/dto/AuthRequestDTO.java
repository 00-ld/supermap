package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录/注册请求体。只允许客户端提交账号和明文密码，不暴露用户实体的 role/id。
 */
@Data
public class AuthRequestDTO {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}

package com.at.pojo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class User {
    private Long id;

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    // 角色：admin 可写，user 只读；注册时统一分配为 user。
    private String role;
}

package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.dto.UserResponseDTO;
import com.at.pojo.dto.UserCreateDTO;
import com.at.pojo.dto.UserUpdateDTO;
import com.at.pojo.User;
import com.at.service.UserService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户管理后台（admin）。登录/注册在 {@link LoginAndRegisterController}，
 * 认证入口使用 /api/auth，用户管理入口使用 /api/user。整个 controller 要求 admin 角色。
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiresRole("admin")
public class UserController {

    @Resource
    private UserService userService;

    @GetMapping("/list")
    public Result<List<UserResponseDTO>> list() {
        List<User> users = userService.listUsers();
        return Result.success(users.stream().map(UserResponseDTO::fromEntity).toList());
    }

    @PostMapping
    public Result<?> create(@Valid @RequestBody UserCreateDTO dto) {
        userService.createUser(dto);
        return Result.success("用户已创建");
    }

    @PutMapping("/{id}")
    public Result<?> update(@PathVariable Long id, @Valid @RequestBody UserUpdateDTO dto) {
        userService.updateUser(id, dto);
        return Result.success("用户已更新");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        if (!deleted) {
            return Result.error(400, "用户不存在");
        }
        return Result.success("用户已删除");
    }
}

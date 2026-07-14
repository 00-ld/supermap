package com.at.service;

import com.at.mapper.UserMapper;
import com.at.pojo.dto.UserCreateDTO;
import com.at.pojo.dto.UserUpdateDTO;
import com.at.pojo.User;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/** Admin user management: role validation, password hashing, and response scrubbing. */
@Slf4j
@Service
public class UserService {

    private static final Set<String> VALID_ROLES = Set.of("admin", "user");
    private static final int MAX_PASSWORD_BYTES = 1024;

    @Resource
    private UserMapper userMapper;

    @Resource
    private PasswordEncoder passwordEncoder;

    public List<User> listUsers() {
        List<User> users = userMapper.selectList();
        users.forEach(user -> user.setPassword(null));
        log.info("Listed users, count={}", users.size());
        return users;
    }

    public void createUser(UserCreateDTO dto) {
        validateRole(dto.getRole());
        validatePasswordLength(dto.getPassword());
        if (userMapper.selectByUsername(dto.getUsername()) != null) {
            throw new IllegalArgumentException("Username already exists: " + dto.getUsername());
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        try {
            int rows = userMapper.insert(user);
            if (rows <= 0) {
                throw new IllegalStateException("用户保存失败");
            }
        } catch (DuplicateKeyException exception) {
            throw new IllegalArgumentException("Username already exists: " + dto.getUsername(), exception);
        }
        log.info("Created user username={}, role={}, affectedRows=1", dto.getUsername(), dto.getRole());
    }

    public void updateUser(Long id, UserUpdateDTO dto) {
        validateRole(dto.getRole());

        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new IllegalArgumentException("User does not exist: " + id);
        }

        existing.setRole(dto.getRole());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            validatePasswordLength(dto.getPassword());
            existing.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        int rows = userMapper.updateById(existing);
        if (rows <= 0) {
            throw new IllegalArgumentException("User does not exist: " + id);
        }
        log.info("Updated user id={}, role={}, passwordChanged={}, affectedRows={}", id, dto.getRole(),
                dto.getPassword() != null && !dto.getPassword().isEmpty(), rows);
    }

    public boolean deleteUser(Long id) {
        int rows = userMapper.deleteById(id);
        log.info("Deleted user request id={}, affectedRows={}", id, rows);
        return rows > 0;
    }

    private void validateRole(String role) {
        if (role == null || !VALID_ROLES.contains(role)) {
            throw new IllegalArgumentException("Invalid role: " + role + ", supported roles: " + VALID_ROLES);
        }
    }

    private void validatePasswordLength(String rawPassword) {
        if (rawPassword != null
                && rawPassword.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new IllegalArgumentException("Password is too long");
        }
    }
}

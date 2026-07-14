package com.at.service.impl;

import com.at.mapper.UserMapper;
import com.at.pojo.User;
import com.at.service.LoginService;
import com.at.utils.JwtUtils;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class LoginServiceImpl implements LoginService {

    @Resource
    private UserMapper userMapper;

    @Resource
    private PasswordEncoder passwordEncoder;

    /** Bound raw password work before hashing so oversized input fails predictably. */
    private static final int MAX_PASSWORD_BYTES = 1024;

    private static final String DUMMY_PASSWORD = "missing-user-dummy-password";

    @Override
    public String login(User user) {
        User loginUser = userMapper.selectByUsername(user.getUsername());
        String encodedPassword = loginUser == null
                ? passwordEncoder.encode(DUMMY_PASSWORD)
                : loginUser.getPassword();
        boolean passwordMatches = passwordEncoder.matches(user.getPassword(), encodedPassword);
        if (loginUser == null || !passwordMatches) {
            log.warn("Login failed for username={}", user.getUsername());
            return null;
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", loginUser.getUsername());
        claims.put("id", loginUser.getId());
        claims.put("role", loginUser.getRole());
        String token = JwtUtils.generateJwt(claims);
        log.info("Login succeeded for username={}", user.getUsername());
        return token;
    }

    @Override
    public boolean register(User user) {
        validatePasswordLength(user.getPassword());
        User existingUser = userMapper.selectByUsername(user.getUsername());
        if (existingUser != null) {
            log.warn("Registration rejected for username={}", user.getUsername());
            return false;
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("user");
        int rows = userMapper.insert(user);
        if (rows <= 0) {
            log.warn("Registration failed because insert affected no rows for username={}", user.getUsername());
            return false;
        }
        log.info("Registration succeeded for username={}, affectedRows={}", user.getUsername(), rows);
        return true;
    }

    private void validatePasswordLength(String rawPassword) {
        if (rawPassword != null
                && rawPassword.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new IllegalArgumentException("Password is too long");
        }
    }
}

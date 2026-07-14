package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.User;
import com.at.pojo.dto.AuthRequestDTO;
import com.at.service.LoginService;
import com.at.service.RateLimiterService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class LoginAndRegisterController {

    @Resource
    private LoginService loginService;

    @Resource
    private RateLimiterService rateLimiterService;

    private static final int MAX_REGISTER_PER_MINUTE = 5;
    private static final int MAX_LOGIN_PER_MINUTE = 10;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        // Only trust proxy headers from local/private reverse proxies; direct clients can spoof them.
        if (isTrustedProxyAddress(remoteAddr)) {
            String realIp = firstHeaderIp(request.getHeader("X-Real-IP"));
            if (realIp != null) {
                return realIp;
            }

            String forwardedForIp = firstForwardedForIp(request.getHeader("X-Forwarded-For"));
            if (forwardedForIp != null) {
                return forwardedForIp;
            }
        }

        String fallback = firstHeaderIp(remoteAddr);
        return fallback == null ? "unknown" : fallback;
    }

    private String firstForwardedForIp(String headerValue) {
        if (headerValue == null) {
            return null;
        }
        for (String part : headerValue.split(",")) {
            String candidate = firstHeaderIp(part);
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private String firstHeaderIp(String headerValue) {
        if (headerValue == null) {
            return null;
        }
        String candidate = headerValue.trim();
        if (candidate.isEmpty() || "unknown".equalsIgnoreCase(candidate)) {
            return null;
        }
        return candidate;
    }

    private boolean isTrustedProxyAddress(String remoteAddr) {
        String candidate = firstHeaderIp(remoteAddr);
        if (candidate == null) {
            return false;
        }
        try {
            InetAddress address = InetAddress.getByName(candidate);
            return address.isAnyLocalAddress()
                    || address.isLoopbackAddress()
                    || address.isSiteLocalAddress()
                    || address.isLinkLocalAddress();
        } catch (UnknownHostException exception) {
            return false;
        }
    }

    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody AuthRequestDTO dto, HttpServletRequest request) {
        String ip = resolveClientIp(request);
        if (rateLimiterService.isRateLimited("login", ip, MAX_LOGIN_PER_MINUTE, RATE_LIMIT_WINDOW)) {
            log.warn("登录频率过高，IP: {}", ip);
            return Result.error(429, "登录过于频繁，请稍后再试");
        }

        User user = toUser(dto);
        String token = loginService.login(user);
        if (token != null) {
            log.info("用户登录成功: {}", user.getUsername());
            return Result.success(token);
        }
        log.warn("用户登录失败: {}", user.getUsername());
        return Result.error(401, "用户名或密码错误");
    }

    @PostMapping("/register")
    public Result<?> register(@Valid @RequestBody AuthRequestDTO dto, HttpServletRequest request) {
        String ip = resolveClientIp(request);
        if (rateLimiterService.isRateLimited("register", ip, MAX_REGISTER_PER_MINUTE, RATE_LIMIT_WINDOW)) {
            log.warn("注册频率过高，IP: {}", ip);
            return Result.error(429, "注册过于频繁，请稍后再试");
        }

        User user = toUser(dto);
        boolean registered = loginService.register(user);
        if (registered) {
            log.info("用户注册成功: {}", user.getUsername());
            return Result.success();
        }
        log.warn("Registration rejected for username={}", user.getUsername());
        return Result.error(400, "注册失败，请检查输入信息");
    }

    private User toUser(AuthRequestDTO dto) {
        User user = new User();
        user.setUsername(trim(dto.getUsername()));
        user.setPassword(dto.getPassword());
        return user;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}

package com.at.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 容器健康探针端点。
 *
 * <p>路径位于 {@code /healthz}（不在 {@code /api} 下），因此不经过
 * {@link com.at.interceptor.TokenInterceptor} / {@link com.at.interceptor.AdminAuthInterceptor}，
 * 无需鉴权即可被 docker-compose healthcheck 访问。仅返回存活状态，不触达数据库，
 * 避免把 DB 抖动误判为应用不健康。
 */
@RestController
public class HealthController {

    @GetMapping("/healthz")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}

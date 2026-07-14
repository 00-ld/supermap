package com.at.interceptor;

import com.at.exception.ApiException;
import com.at.utils.JwtUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;

public class TokenInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TokenInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String jwt = request.getHeader("token");
        if (jwt == null || jwt.isEmpty()) {
            throw new ApiException(HttpServletResponse.SC_UNAUTHORIZED, 401, "未登录");
        }

        try {
            Claims claims = JwtUtils.parseJWT(jwt);
            request.setAttribute("role", claims.get("role"));
            request.setAttribute("userId", claims.get("id"));
            request.setAttribute("username", claims.get("username"));
        } catch (Exception exception) {
            log.warn("令牌无效: {}", exception.getMessage());
            throw new ApiException(HttpServletResponse.SC_UNAUTHORIZED, 401, "令牌无效");
        }

        return true;
    }
}

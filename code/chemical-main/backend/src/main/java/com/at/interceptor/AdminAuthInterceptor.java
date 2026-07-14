package com.at.interceptor;

import com.at.annotation.RequiresRole;
import com.at.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 注解驱动的鉴权拦截器。
 *
 * <p>只对标注了 {@link RequiresRole} 的处理方法（或其所在 controller 类）做角色校验，
 * 角色取自 {@link TokenInterceptor} 写入的 request attribute（来自验签后的 JWT claims，不可伪造）。
 *
 * <p>相比旧版的 WebConfig 手写路径白名单：「需要什么角色」声明在接口自身，
 * 新增写接口只要加 {@code @RequiresRole} 即生效，不存在「忘了补白名单」的越权缺口。
 */
public class AdminAuthInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // 非 controller 方法（静态资源等）直接放行。
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequiresRole requiresRole = resolveRequiresRole(handlerMethod);
        if (requiresRole == null) {
            return true; // 未标注：登录即可访问（认证由 TokenInterceptor 保证）。
        }

        Object role = request.getAttribute("role");
        if (role == null || !requiresRole.value().equals(role.toString())) {
            log.warn("权限不足 {} {}, 需要角色={}, 实际角色={}",
                    request.getMethod(), request.getRequestURI(), requiresRole.value(), role);
            throw new ApiException(HttpServletResponse.SC_FORBIDDEN, 403, "无权限");
        }
        return true;
    }

    /** 方法级注解优先，其次类级注解。 */
    private RequiresRole resolveRequiresRole(HandlerMethod handlerMethod) {
        RequiresRole methodAnno = handlerMethod.getMethodAnnotation(RequiresRole.class);
        if (methodAnno != null) {
            return methodAnno;
        }
        return handlerMethod.getBeanType().getAnnotation(RequiresRole.class);
    }
}

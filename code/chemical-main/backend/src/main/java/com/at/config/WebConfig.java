package com.at.config;

import com.at.interceptor.AdminAuthInterceptor;
import com.at.interceptor.TokenInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 注册 JWT 鉴权拦截器。
 *
 * <p>{@link TokenInterceptor}（order=1）负责认证：校验 token 并解析身份信息（role/userId）。
 * {@link AdminAuthInterceptor}（order=2）负责鉴权：注解驱动，仅对标注
 * {@link com.at.annotation.RequiresRole} 的接口做角色校验。
 *
 * <p>设计原则：只读 GET 接口登录即可访问；写操作必须在接口自身用
 * {@code @RequiresRole("admin")} 声明。新增写接口时同步补注解和拦截器测试，
 * 不再依赖这里维护一张离散的路径白名单（旧设计的越权链根因）。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 认证拦截器：拦截所有业务接口，精确放行登录和注册（auth 域无需 token）。
        registry.addInterceptor(new TokenInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/auth/login",
                        "/api/auth/register"
                )
                .order(1);

        // 鉴权拦截器：注解驱动，挂到全部业务接口，由 @RequiresRole 决定是否校验角色。
        registry.addInterceptor(new AdminAuthInterceptor())
                .addPathPatterns("/api/**")
                .order(2);
    }
}

package com.at.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 声明接口（或整个 controller）所需的角色。
 *
 * <p>由 {@link com.at.interceptor.AdminAuthInterceptor} 在请求级统一拦截：
 * 标注了本注解的处理方法/类，要求请求身份的 role 与 {@link #value()} 一致，否则返回 403。
 *
 * <p>设计意图：把「这是不是写操作 / 需要什么角色」声明在接口自身，
 * 取代 WebConfig 里离散的手写路径白名单，从根上消除「加接口忘补白名单」的越权风险。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresRole {
    String value() default "admin";
}

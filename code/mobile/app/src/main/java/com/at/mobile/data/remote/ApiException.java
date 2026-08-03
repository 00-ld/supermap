package com.at.mobile.data.remote;

/**
 * API 调用异常：统一承载 HTTP 错误、业务错误（code!=200）、401 未登录。
 */
public class ApiException extends Exception {
    private final int code;

    public ApiException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    /** 401：token 失效或未登录 */
    public boolean isUnauthorized() {
        return code == 401;
    }

    /** 409：状态机并发冲突（任务状态已变更） */
    public boolean isConflict() {
        return code == 409;
    }
}

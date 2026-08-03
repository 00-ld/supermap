package com.at.mobile.data.remote;

import com.at.mobile.data.local.SessionManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * OkHttp 拦截器：每请求注入 Header "token"。
 * 后端 TokenInterceptor 读 Header 名为 "token"（非 Authorization Bearer），与网页端 request.ts 一致。
 */
public class TokenInterceptor implements Interceptor {
    private final SessionManager session;

    public TokenInterceptor(SessionManager session) {
        this.session = session;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        Request.Builder builder = original.newBuilder();
        String token = session.getToken();
        if (token != null && !token.isEmpty()) {
            builder.header("token", token);
        }
        return chain.proceed(builder.build());
    }
}

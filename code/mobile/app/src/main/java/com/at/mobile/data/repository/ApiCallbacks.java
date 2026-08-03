package com.at.mobile.data.repository;

import android.content.Context;

import com.at.mobile.data.remote.ApiCallback;
import com.at.mobile.data.remote.ApiException;

/**
 * ApiCallback 到 RepositoryCallback 的通用适配器，消除各 Repository 的匿名样板代码。
 * 所有 Repository 用 {@link #adapt(Context, RepositoryCallback)} 一行包装。
 */
public final class ApiCallbacks {

    private ApiCallbacks() {
    }

    public static <T> ApiCallback<T> adapt(Context ctx, RepositoryCallback<T> cb) {
        return new ApiCallback<T>(ctx) {
            @Override
            public void onSuccess(T data) {
                cb.onSuccess(data);
            }

            @Override
            public void onError(ApiException e) {
                cb.onError(e);
            }
        };
    }
}

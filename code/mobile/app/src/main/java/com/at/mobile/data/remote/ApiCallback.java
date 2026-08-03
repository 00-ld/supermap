package com.at.mobile.data.remote;

import android.content.Context;
import android.util.Log;

import com.at.mobile.data.remote.dto.ApiResult;
import com.at.mobile.data.local.SessionManager;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * 统一回调：拆包 ApiResult，失败转 ApiException。
 * 401 自动清登录态；业务 code!=200 转 ApiException(getMessage)。
 */
public abstract class ApiCallback<T> implements Callback<ApiResult<T>> {
    private static final String TAG = "ApiCallback";
    private final Context ctx;

    protected ApiCallback(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

    /** 业务成功（code==200 且 data 非 null 时） */
    public abstract void onSuccess(T data);

    /** 失败（网络/HTTP/业务/401） */
    public abstract void onError(ApiException e);

    @Override
    public void onResponse(Call<ApiResult<T>> call, Response<ApiResult<T>> response) {
        if (!response.isSuccessful()) {
            if (response.code() == 401) {
                clearSession();
            }
            onError(new ApiException(response.code(), "HTTP " + response.code()));
            return;
        }
        ApiResult<T> body = response.body();
        if (body == null) {
            onError(new ApiException(500, "响应为空"));
            return;
        }
        if (body.getCode() != null && body.getCode() == 401) {
            clearSession();
            onError(new ApiException(401, body.getMessage()));
            return;
        }
        if (!body.isSuccess()) {
            onError(new ApiException(
                    body.getCode() == null ? 500 : body.getCode(),
                    body.getMessage()));
            return;
        }
        onSuccess(body.getData());
    }

    @Override
    public void onFailure(Call<ApiResult<T>> call, Throwable t) {
        Log.e(TAG, "网络请求失败", t);
        onError(new ApiException(-1, t.getMessage() == null ? "网络异常" : t.getMessage()));
    }

    private void clearSession() {
        SessionManager.get(ctx).clear();
    }
}

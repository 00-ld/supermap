package com.at.mobile.data.repository;

import com.at.mobile.data.remote.ApiException;

/**
 * Repository 统一回调。成功给 data，失败给 ApiException（已含 401/409 判定）。
 *
 * @param <T> 数据类型
 */
public interface RepositoryCallback<T> {
    void onSuccess(T data);

    void onError(ApiException e);
}

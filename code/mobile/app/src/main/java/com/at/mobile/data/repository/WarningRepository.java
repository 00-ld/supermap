package com.at.mobile.data.repository;

import android.content.Context;

import com.at.mobile.data.remote.HttpClient;
import com.at.mobile.data.remote.dto.WarningVO;

import java.util.List;

import static com.at.mobile.data.repository.ApiCallbacks.adapt;

/** 告警历史仓库：作事故列表入口。 */
public class WarningRepository {

    private final HttpClient client;

    public WarningRepository(Context ctx) {
        this.client = HttpClient.get(ctx);
    }

    public void listWarnings(RepositoryCallback<List<WarningVO>> cb) {
        client.api().listWarnings().enqueue(adapt(client.context(), cb));
    }
}

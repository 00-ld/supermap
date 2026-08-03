package com.at.mobile.data.repository;

import android.content.Context;

import com.at.mobile.data.remote.HttpClient;
import com.at.mobile.data.remote.dto.CarVO;

import java.util.List;

import static com.at.mobile.data.repository.ApiCallbacks.adapt;

/** 巡检车仓库：列表查询。 */
public class CarRepository {

    private final HttpClient client;

    public CarRepository(Context ctx) {
        this.client = HttpClient.get(ctx);
    }

    public void getAllCars(RepositoryCallback<List<CarVO>> cb) {
        client.api().getAllCars().enqueue(adapt(client.context(), cb));
    }
}

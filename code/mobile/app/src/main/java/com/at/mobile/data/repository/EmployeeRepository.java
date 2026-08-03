package com.at.mobile.data.repository;

import android.content.Context;

import com.at.mobile.data.remote.HttpClient;
import com.at.mobile.data.remote.dto.EmployeeVO;

import java.util.List;

import static com.at.mobile.data.repository.ApiCallbacks.adapt;

/** 员工仓库：指派选人用。 */
public class EmployeeRepository {

    private final HttpClient client;

    public EmployeeRepository(Context ctx) {
        this.client = HttpClient.get(ctx);
    }

    public void listEmployees(RepositoryCallback<List<EmployeeVO>> cb) {
        client.api().listEmployees().enqueue(adapt(client.context(), cb));
    }
}

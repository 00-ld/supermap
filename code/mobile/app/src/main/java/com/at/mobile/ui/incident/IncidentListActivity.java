package com.at.mobile.ui.incident;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.at.mobile.R;
import com.at.mobile.data.local.SessionManager;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.dto.WarningVO;
import com.at.mobile.data.repository.WarningRepository;
import com.at.mobile.ui.common.BaseActivity;
import com.at.mobile.ui.task.TaskCreateActivity;

import java.util.List;

/**
 * 事故列表页：展示告警历史，支持下拉刷新，点击某条进入任务创建页。
 */
public class IncidentListActivity extends BaseActivity {

    private WarningRepository warningRepo;
    private RecyclerView recyclerView;
    private TextView emptyText;
    private ProgressBar progressBar;
    private TextView statusText;
    private TextView toolbarTitle;
    private Button toolbarAction;
    private SwipeRefreshLayout swipeRefresh;
    private IncidentAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_incident_list);
        warningRepo = new WarningRepository(this);
        bindViews();
        setupToolbar();
        bindToolbarBack();
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadIncidents();
    }

    private void bindViews() {
        recyclerView = findViewById(R.id.rvIncidents);
        emptyText = findViewById(R.id.tvEmpty);
        progressBar = findViewById(R.id.progressBar);
        statusText = findViewById(R.id.tvMessage);
        toolbarTitle = findViewById(R.id.tvToolbarTitle);
        toolbarAction = findViewById(R.id.btnToolbarAction);
        swipeRefresh = findViewById(R.id.swipeRefreshIncident);

        if (swipeRefresh != null) {
            swipeRefresh.setColorSchemeResources(R.color.colorPrimary, R.color.danger);
            swipeRefresh.setOnRefreshListener(this::loadIncidents);
        }

        adapter = new IncidentAdapter(this::onIncidentClick);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);
        bindLoadingViews(progressBar, statusText);
    }

    private void setupToolbar() {
        toolbarTitle.setText(R.string.incident_title);
        boolean isAdmin = SessionManager.get(this).isAdmin();
        if (isAdmin) {
            toolbarAction.setText(R.string.btn_create_task);
            toolbarAction.setVisibility(View.VISIBLE);
            toolbarAction.setOnClickListener(v -> {
                Intent intent = new Intent(this, TaskCreateActivity.class);
                startActivity(intent);
            });
        }
    }

    private void loadIncidents() {
        showStatus(null);
        setLoading(true);
        warningRepo.listWarnings(new com.at.mobile.data.repository.RepositoryCallback<List<WarningVO>>() {
            @Override
            public void onSuccess(List<WarningVO> data) {
                setLoading(false);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                adapter.submit(data);
                emptyText.setVisibility(data == null || data.isEmpty() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onError(ApiException e) {
                setLoading(false);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (e.isUnauthorized()) {
                    toast(getString(R.string.session_expired));
                    Intent intent = new Intent(IncidentListActivity.this,
                            com.at.mobile.ui.login.LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                    return;
                }
                showStatus(getString(R.string.incident_load_fail, e.getMessage()));
            }
        });
    }

    private void onIncidentClick(WarningVO warning) {
        Intent intent = new Intent(this, TaskCreateActivity.class);
        if (warning.getId() != null) {
            intent.putExtra(TaskCreateActivity.EXTRA_WARNING_ID, warning.getId().longValue());
        }
        intent.putExtra(TaskCreateActivity.EXTRA_GAS_TYPE, warning.getGasType());
        intent.putExtra(TaskCreateActivity.EXTRA_AREA_NAME, warning.getAreaName());
        if (warning.getCarId() != null) {
            intent.putExtra(TaskCreateActivity.EXTRA_CAR_ID, warning.getCarId());
        }
        if (warning.getX() != null) {
            intent.putExtra(TaskCreateActivity.EXTRA_X, warning.getX());
        }
        if (warning.getY() != null) {
            intent.putExtra(TaskCreateActivity.EXTRA_Y, warning.getY());
        }
        if (warning.getWarningTime() != null) {
            intent.putExtra(TaskCreateActivity.EXTRA_WARNING_TIME, warning.getWarningTime());
        }
        startActivity(intent);
    }
}

package com.at.mobile.ui.main;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.at.mobile.App;
import com.at.mobile.R;
import com.at.mobile.data.local.AppConfig;
import com.at.mobile.data.local.SessionManager;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.HttpClient;
import com.at.mobile.data.remote.dto.CarVO;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.data.remote.dto.WarningVO;
import com.at.mobile.data.repository.CarRepository;
import com.at.mobile.data.repository.RepositoryCallback;
import com.at.mobile.data.repository.TaskRepository;
import com.at.mobile.data.repository.WarningRepository;
import com.at.mobile.ui.incident.IncidentAdapter;
import com.at.mobile.ui.incident.IncidentListActivity;
import com.at.mobile.ui.map.MapActivity;
import com.at.mobile.ui.mine.MyTaskActivity;
import com.at.mobile.ui.task.TaskCreateActivity;
import com.at.mobile.util.GasHazardLevel;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.List;

/**
 * 主页工作台：高保真 iOS 极简 Style 应急处置中心。
 * 包含实时应急概览、核心功能快捷入口、最新告警流与底部 Tab 导航。
 */
public class MainActivity extends AppCompatActivity {

    private TaskRepository taskRepo;
    private SessionManager session;
    private AppConfig appConfig;

    private TextView userWelcomeText;
    private TextView gisStatusTagText;
    private View gisStatusDot;
    private ImageButton serverSettingsBtn;

    private TextView pendingAlarmsText;
    private TextView activeTasksText;
    private TextView onlineCarsText;
    private TextView emergencyLevelText;

    private View quickMapBtn;
    private View quickIncidentBtn;
    private View quickCreateTaskBtn;
    private View quickMyTaskBtn;
    private View quickSettingsBtn;

    private TextView refreshHomeBtn;
    private RecyclerView recentTasksRecycler;
    private TextView emptyRecentText;
    private ProgressBar homeProgressBar;
    private TextView homeMessageText;
    private BottomNavigationView bottomNav;
    private androidx.swiperefreshlayout.widget.SwipeRefreshLayout swipeRefresh;

    private IncidentAdapter incidentAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        taskRepo = TaskRepository.get(this);
        session = SessionManager.get(this);
        appConfig = AppConfig.get(this);

        bindViews();
        setupNavigation();
        setupQuickActions();
        setupRecyclerView();
    }

    @Override
    protected void onResume() {
        super.onResume();
        bottomNav.setSelectedItemId(R.id.nav_home);
        renderHeaderInfo();
        loadDashboardData();
    }

    private void bindViews() {
        userWelcomeText = findViewById(R.id.tvUserWelcome);
        gisStatusTagText = findViewById(R.id.tvGisStatusTag);
        gisStatusDot = findViewById(R.id.viewGisStatusDot);
        serverSettingsBtn = findViewById(R.id.ibServerSettings);

        pendingAlarmsText = findViewById(R.id.tvPendingAlarms);
        activeTasksText = findViewById(R.id.tvActiveTasks);
        onlineCarsText = findViewById(R.id.tvOnlineCars);
        emergencyLevelText = findViewById(R.id.tvEmergencyLevel);

        quickMapBtn = findViewById(R.id.btnQuickMap);
        quickIncidentBtn = findViewById(R.id.btnQuickIncident);
        quickCreateTaskBtn = findViewById(R.id.btnQuickCreateTask);
        // 现场打卡入口：CheckinActivity 必须带 taskId，从首页直接跳会 finish，
        // 改为跳"我的待办"，用户在那里选具体任务 → 详情 → 现场打卡。
        View quickCheckinBtn = findViewById(R.id.btnQuickCheckin);
        if (quickCheckinBtn != null) {
            quickCheckinBtn.setOnClickListener(v ->
                    startActivity(new Intent(this, MyTaskActivity.class)));
        }
        quickMyTaskBtn = findViewById(R.id.btnQuickMyTask);
        quickSettingsBtn = findViewById(R.id.btnQuickSettings);

        refreshHomeBtn = findViewById(R.id.btnRefreshHome);
        recentTasksRecycler = findViewById(R.id.rvRecentTasks);
        emptyRecentText = findViewById(R.id.tvEmptyRecent);
        homeProgressBar = findViewById(R.id.progressBarHome);
        homeMessageText = findViewById(R.id.tvHomeMessage);
        bottomNav = findViewById(R.id.bottomNav);
        swipeRefresh = findViewById(R.id.swipeRefreshHome);

        if (swipeRefresh != null) {
            swipeRefresh.setColorSchemeResources(R.color.colorPrimary, R.color.danger);
            swipeRefresh.setOnRefreshListener(this::loadDashboardData);
        }
    }

    private void setupNavigation() {
        bottomNav.setOnItemSelectedListener(this::onTabSelected);
    }

    private boolean onTabSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        if (id == R.id.nav_home) {
            loadDashboardData();
            return true;
        }
        if (id == R.id.nav_map) {
            startActivity(new Intent(this, MapActivity.class));
            return false;
        }
        if (id == R.id.nav_incident) {
            startActivity(new Intent(this, IncidentListActivity.class));
            return false;
        }
        if (id == R.id.nav_mine) {
            startActivity(new Intent(this, MyTaskActivity.class));
            return false;
        }
        return false;
    }

    private void setupQuickActions() {
        quickMapBtn.setOnClickListener(v -> startActivity(new Intent(this, MapActivity.class)));
        quickIncidentBtn.setOnClickListener(v -> startActivity(new Intent(this, IncidentListActivity.class)));
        quickCreateTaskBtn.setOnClickListener(v -> startActivity(new Intent(this, TaskCreateActivity.class)));
        quickMyTaskBtn.setOnClickListener(v -> startActivity(new Intent(this, MyTaskActivity.class)));
        quickSettingsBtn.setOnClickListener(v -> showServerConfigDialog());
        serverSettingsBtn.setOnClickListener(v -> showServerConfigDialog());
        refreshHomeBtn.setOnClickListener(v -> loadDashboardData());
    }

    private void setupRecyclerView() {
        recentTasksRecycler.setLayoutManager(new LinearLayoutManager(this));
        incidentAdapter = new IncidentAdapter(warning -> {
            Intent intent = new Intent(MainActivity.this, TaskCreateActivity.class);
            Integer warningId = warning.getId();
            if (warningId != null) {
                intent.putExtra(TaskCreateActivity.EXTRA_WARNING_ID, warningId.longValue());
            }
            if (warning.getGasType() != null) {
                intent.putExtra(TaskCreateActivity.EXTRA_GAS_TYPE, warning.getGasType());
            }
            if (warning.getCarId() != null) {
                intent.putExtra(TaskCreateActivity.EXTRA_CAR_ID, warning.getCarId());
            }
            if (warning.getAreaName() != null) {
                intent.putExtra(TaskCreateActivity.EXTRA_AREA_NAME, warning.getAreaName());
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
        });
        recentTasksRecycler.setAdapter(incidentAdapter);
    }

    private void renderHeaderInfo() {
        String username = session.getUsername();
        if (username == null || username.isEmpty()) {
            username = "应急指挥员";
        }
        String role = session.isAdmin() ? "系统管理员" : "现场处置人员";
        userWelcomeText.setText(username + " · " + role);

        boolean licenseOk = App.isLicenseValid();
        gisStatusTagText.setText(licenseOk
                ? "GIS 服务已连接"
                : "GIS 当前离线");
        if (gisStatusDot != null) {
            gisStatusDot.setBackgroundResource(licenseOk
                    ? R.drawable.bg_status_dot_success
                    : R.drawable.bg_status_dot_offline);
        }
    }

    private void loadDashboardData() {
        homeProgressBar.setVisibility(View.VISIBLE);
        homeMessageText.setVisibility(View.GONE);

        // 1. 加载任务数据统计
        taskRepo.listTasks(null, new RepositoryCallback<List<TaskVO>>() {
            @Override
            public void onSuccess(List<TaskVO> tasks) {
                int activeCount = 0;
                if (tasks != null) {
                    for (TaskVO t : tasks) {
                        if ("assigned".equals(t.getStatus())
                                || "processing".equals(t.getStatus())
                                || "pending_review".equals(t.getStatus())) {
                            activeCount++;
                        }
                    }
                }
                activeTasksText.setText(String.valueOf(activeCount));
            }

            @Override
            public void onError(ApiException e) {
                activeTasksText.setText("0");
            }
        });

        // 2. 加载巡检车在线状态（走 Repository 抽象，统一 401 处理）
        new CarRepository(this).getAllCars(new RepositoryCallback<List<CarVO>>() {
            @Override
            public void onSuccess(List<CarVO> cars) {
                onlineCarsText.setText(cars == null ? "0" : String.valueOf(cars.size()));
            }

            @Override
            public void onError(ApiException error) {
                onlineCarsText.setText("0");
            }
        });

        // 3. 加载最新告警记录（走 Repository 抽象）
        new WarningRepository(this).listWarnings(new RepositoryCallback<List<WarningVO>>() {
            @Override
            public void onSuccess(List<WarningVO> warnings) {
                homeProgressBar.setVisibility(View.GONE);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (warnings == null || warnings.isEmpty()) {
                    pendingAlarmsText.setText("0");
                    emergencyLevelText.setText("正常监控");
                    emergencyLevelText.setTextColor(getResources().getColor(R.color.success));
                    emptyRecentText.setVisibility(View.VISIBLE);
                    recentTasksRecycler.setVisibility(View.GONE);
                } else {
                    int total = warnings.size();
                    int highRisk = 0;
                    for (WarningVO w : warnings) {
                        int level = GasHazardLevel.of(w.getGasType());
                        if (level == GasHazardLevel.LEVEL_EXTREME
                                || level == GasHazardLevel.LEVEL_HIGH) {
                            highRisk++;
                        }
                    }
                    pendingAlarmsText.setText(String.valueOf(total));
                    // 园区状态卡：高危>0 红色告警，否则橙色提醒
                    if (highRisk > 0) {
                        emergencyLevelText.setText(highRisk + " 起高危");
                        emergencyLevelText.setTextColor(getResources().getColor(R.color.danger));
                    } else {
                        emergencyLevelText.setText(total + " 起待处置");
                        emergencyLevelText.setTextColor(getResources().getColor(R.color.warning));
                    }
                    emptyRecentText.setVisibility(View.GONE);
                    recentTasksRecycler.setVisibility(View.VISIBLE);
                    incidentAdapter.submit(warnings);
                }
            }

            @Override
            public void onError(ApiException error) {
                homeProgressBar.setVisibility(View.GONE);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                pendingAlarmsText.setText("0");
                emptyRecentText.setVisibility(View.VISIBLE);
                recentTasksRecycler.setVisibility(View.GONE);
                if (error.isUnauthorized()) {
                    session.clear();
                    Toast.makeText(MainActivity.this,
                            getString(R.string.session_expired), Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(MainActivity.this,
                            com.at.mobile.ui.login.LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                } else {
                    homeMessageText.setText(getString(R.string.dashboard_load_fail, error.getMessage()));
                    homeMessageText.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    /** 服务配置弹窗：支持修改与保存 Backend Base URL */
    private void showServerConfigDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("⚙️ 服务端 Endpoint 配置");

        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(appConfig.getBackendBaseUrl());
        input.setHint("http://192.168.x.x:8081/");
        input.setPadding(40, 30, 40, 30);

        builder.setView(input);

        builder.setPositiveButton("保存并测试", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                appConfig.setBackendBaseUrl(newUrl);
                HttpClient.resetInstance();
                Toast.makeText(MainActivity.this, "服务器地址已更新：" + newUrl, Toast.LENGTH_SHORT).show();
                loadDashboardData();
            }
        });

        builder.setNegativeButton("取消", (dialog, which) -> dialog.cancel());
        builder.setNeutralButton("重置默认", (dialog, which) -> {
            appConfig.setBackendBaseUrl("http://localhost:8081/");
            HttpClient.resetInstance();
            Toast.makeText(MainActivity.this, "已重置为默认地址", Toast.LENGTH_SHORT).show();
            loadDashboardData();
        });

        builder.show();
    }
}

package com.at.mobile.ui.mine;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.at.mobile.R;
import com.at.mobile.data.local.SessionManager;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.data.repository.RepositoryCallback;
import com.at.mobile.data.repository.TaskRepository;
import com.at.mobile.ui.common.BaseActivity;
import com.at.mobile.ui.login.LoginActivity;
import com.at.mobile.ui.task.TaskAdapter;
import com.at.mobile.ui.task.TaskDetailActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * 个人中心与我的任务列表页面。
 *
 * <p>支持按状态筛选（全部/进行中/待验收/已完成），默认展示进行中任务（处置中+待验收），
 * 让现场人员快速看到待办。401 时正确跳转登录页并清栈，不再卡空白。</p>
 */
public class MyTaskActivity extends BaseActivity {

    private TaskRepository taskRepo;
    private SessionManager session;

    private TextView userRoleText;
    private TextView carInfoText;
    private RecyclerView recyclerView;
    private TextView emptyText;
    private ProgressBar progressBar;
    private TextView messageText;
    private TextView toolbarTitle;
    private TextView logoutButton;
    private SwipeRefreshLayout swipeRefresh;
    private TaskAdapter taskAdapter;

    /** 当前选中的筛选 Tab view，用于切换背景/文字色。 */
    private TextView selectedFilterTab;

    /** 状态筛选：null=全部，否则按状态过滤。 */
    private String statusFilter;

    private final View.OnClickListener filterClickListener = v -> {
        if (v.getId() == R.id.btnFilterAll) {
            statusFilter = null;
        } else if (v.getId() == R.id.btnFilterActive) {
            // 进行中是客户端聚合，仍拉全部再过滤
            statusFilter = "__active__";
        } else if (v.getId() == R.id.btnFilterReview) {
            statusFilter = "pending_review";
        } else if (v.getId() == R.id.btnFilterDone) {
            statusFilter = "completed";
        }
        updateFilterTabStyle((TextView) v);
        loadMyTasks();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_my_task);
        taskRepo = TaskRepository.get(this);
        session = SessionManager.get(this);

        bindViews();
        renderUserIdentity();
        bindToolbarBack();
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadMyTasks();
    }

    private void bindViews() {
        userRoleText = findViewById(R.id.tvUserRole);
        carInfoText = findViewById(R.id.tvCarInfo);
        recyclerView = findViewById(R.id.rvMyTasks);
        emptyText = findViewById(R.id.tvEmpty);
        progressBar = findViewById(R.id.progressBar);
        messageText = findViewById(R.id.tvMessage);
        toolbarTitle = findViewById(R.id.tvToolbarTitle);
        logoutButton = findViewById(R.id.btnLogout);
        swipeRefresh = findViewById(R.id.swipeRefreshMyTask);

        bindLoadingViews(progressBar, messageText);
        toolbarTitle.setText(R.string.my_task_title);

        if (swipeRefresh != null) {
            swipeRefresh.setColorSchemeResources(R.color.colorPrimary, R.color.danger);
            swipeRefresh.setOnRefreshListener(this::loadMyTasks);
        }

        if (logoutButton != null) {
            logoutButton.setOnClickListener(v -> showLogoutConfirmDialog());
        }

        findViewById(R.id.btnFilterAll).setOnClickListener(filterClickListener);
        findViewById(R.id.btnFilterActive).setOnClickListener(filterClickListener);
        findViewById(R.id.btnFilterReview).setOnClickListener(filterClickListener);
        findViewById(R.id.btnFilterDone).setOnClickListener(filterClickListener);
        selectedFilterTab = findViewById(R.id.btnFilterAll);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        taskAdapter = new TaskAdapter(task -> {
            Intent intent = new Intent(MyTaskActivity.this, TaskDetailActivity.class);
            intent.putExtra(TaskDetailActivity.EXTRA_TASK_ID, task.getId());
            startActivity(intent);
        });
        recyclerView.setAdapter(taskAdapter);
    }

    private void renderUserIdentity() {
        boolean isAdmin = session.isAdmin();
        String username = session.getUsername();
        if (username == null || username.isEmpty()) {
            username = getString(R.string.default_username);
        }
        userRoleText.setText(username + " (" + (isAdmin
                ? getString(R.string.role_admin)
                : getString(R.string.role_field_worker)) + ")");
        carInfoText.setText(session.getToken() != null
                ? getString(R.string.credential_valid)
                : getString(R.string.not_logged_in));
    }

    private void loadMyTasks() {
        showStatus(null);
        setLoading(true);
        taskRepo.listTasks(null, new RepositoryCallback<List<TaskVO>>() {
            @Override
            public void onSuccess(List<TaskVO> data) {
                setLoading(false);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                List<TaskVO> filtered = filterTasks(data);
                if (filtered.isEmpty()) {
                    emptyText.setVisibility(View.VISIBLE);
                    recyclerView.setVisibility(View.GONE);
                } else {
                    emptyText.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.VISIBLE);
                    taskAdapter.submit(filtered);
                }
            }

            @Override
            public void onError(ApiException e) {
                setLoading(false);
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (e.isUnauthorized()) {
                    session.clear();
                    Toast.makeText(MyTaskActivity.this,
                            getString(R.string.session_expired), Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(MyTaskActivity.this, LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                    return;
                }
                showStatus(getString(R.string.my_task_load_fail, e.getMessage()));
            }
        });
    }

    /** 切换筛选 Tab 选中态：选中蓝底白字，未选中白底灰字。 */
    private void updateFilterTabStyle(TextView selected) {
        if (selectedFilterTab != null) {
            selectedFilterTab.setBackgroundResource(R.drawable.bg_filter_unselected);
            selectedFilterTab.setTextColor(getResources().getColor(R.color.textSecondary));
        }
        selected.setBackgroundResource(R.drawable.bg_filter_selected);
        selected.setTextColor(getResources().getColor(R.color.white));
        selectedFilterTab = selected;
    }

    /** 客户端状态过滤：__active__ = assigned+processing+pending_review。 */
    private List<TaskVO> filterTasks(List<TaskVO> data) {
        if (data == null) {
            return new ArrayList<>();
        }
        if (statusFilter == null) {
            return data;
        }
        List<TaskVO> result = new ArrayList<>();
        for (TaskVO t : data) {
            String s = t.getStatus();
            if (s == null) {
                continue;
            }
            if ("__active__".equals(statusFilter)) {
                if ("assigned".equals(s) || "processing".equals(s) || "pending_review".equals(s)) {
                    result.add(t);
                }
            } else if (statusFilter.equals(s)) {
                result.add(t);
            }
        }
        return result;
    }

    private void showLogoutConfirmDialog() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.logout_confirm_title)
                .setMessage(R.string.logout_confirm_message)
                .setPositiveButton(R.string.btn_confirm_logout, (dialog, which) -> {
                    session.clear();
                    Toast.makeText(this, R.string.logout_success, Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(MyTaskActivity.this, LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                })
                .setNegativeButton(R.string.btn_cancel, (dialog, which) -> dialog.dismiss())
                .show();
    }
}

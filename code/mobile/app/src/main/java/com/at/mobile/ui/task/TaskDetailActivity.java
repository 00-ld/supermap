package com.at.mobile.ui.task;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.at.mobile.R;
import com.at.mobile.data.local.SessionManager;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.dto.TaskReviewRequest;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.data.repository.RepositoryCallback;
import com.at.mobile.data.repository.TaskRepository;
import com.at.mobile.ui.checkin.CheckinActivity;
import com.at.mobile.ui.common.BaseActivity;
import com.at.mobile.ui.common.TaskStatusStyle;
import com.at.mobile.ui.map.MapActivity;
import com.at.mobile.util.TimeElapsed;

/**
 * 任务详情页：展示全部字段，按状态/角色显隐操作按钮。
 * assigned→接单；processing→打卡（跳 CheckinActivity）；pending_review→验收（admin）。
 * 所有写操作走 setLoading 联动进度条 + 按钮禁用，防止重复提交。
 */
public class TaskDetailActivity extends BaseActivity {

    public static final String EXTRA_TASK_ID = "task_id";

    private static final int REQ_CHECKIN = 2001;

    private long taskId;
    private TaskRepository taskRepo;
    private boolean isAdmin;

    private TextView titleText;
    private TextView statusText;
    private TextView descriptionText;
    private TextView gasTypeText;
    private TextView areaText;
    private TextView assigneeText;
    private TextView checkinText;
    private TextView reviewText;
    private TextView toolbarTitle;
    private TextView messageText;
    private TextView timeoutWarningText;
    private TextView timelineCreatedText;
    private TextView timelineAssignedText;
    private TextView timelineAcceptedText;
    private TextView timelineCheckinText;
    private TextView timelineReviewText;
    private Button acceptButton;
    private Button navigateButton;
    private Button checkinButton;
    private Button reviewPassButton;
    private Button reviewRejectButton;
    private Button cancelButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_task_detail);
        taskId = getIntent().getLongExtra(EXTRA_TASK_ID, -1L);
        if (taskId <= 0) {
            finish();
            return;
        }
        taskRepo = TaskRepository.get(this);
        isAdmin = SessionManager.get(this).isAdmin();
        bindViews();
        loadTask();
        bindToolbarBack();
    }

    private void bindViews() {
        titleText = findViewById(R.id.tvTitle);
        statusText = findViewById(R.id.tvStatus);
        descriptionText = findViewById(R.id.tvDescription);
        gasTypeText = findViewById(R.id.tvGasType);
        areaText = findViewById(R.id.tvArea);
        assigneeText = findViewById(R.id.tvAssignee);
        checkinText = findViewById(R.id.tvCheckin);
        reviewText = findViewById(R.id.tvReview);
        toolbarTitle = findViewById(R.id.tvToolbarTitle);
        messageText = findViewById(R.id.tvMessage);
        acceptButton = findViewById(R.id.btnAccept);
        navigateButton = findViewById(R.id.btnNavigate);
        checkinButton = findViewById(R.id.btnCheckin);
        reviewPassButton = findViewById(R.id.btnReviewPass);
        reviewRejectButton = findViewById(R.id.btnReviewReject);
        cancelButton = findViewById(R.id.btnCancelTask);
        timeoutWarningText = findViewById(R.id.tvTimeoutWarning);
        timelineCreatedText = findViewById(R.id.tvTimelineCreated);
        timelineAssignedText = findViewById(R.id.tvTimelineAssigned);
        timelineAcceptedText = findViewById(R.id.tvTimelineAccepted);
        timelineCheckinText = findViewById(R.id.tvTimelineCheckin);
        timelineReviewText = findViewById(R.id.tvTimelineReview);
        bindLoadingViews(null, messageText);

        toolbarTitle.setText(R.string.task_detail_title);
        acceptButton.setOnClickListener(v -> acceptTask());
        navigateButton.setOnClickListener(v -> openNavigation());
        checkinButton.setOnClickListener(v -> startActivityForResult(
                new Intent(this, CheckinActivity.class)
                        .putExtra(CheckinActivity.EXTRA_TASK_ID, taskId),
                REQ_CHECKIN));
        reviewPassButton.setOnClickListener(v -> reviewTask("pass"));
        reviewRejectButton.setOnClickListener(v -> reviewTask("reject"));
        cancelButton.setOnClickListener(v -> cancelTask());
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_CHECKIN && resultCode == RESULT_OK) {
            // 打卡成功后任务已变 pending_review，重新拉详情刷新按钮显隐。
            loadTask();
        }
    }

    private void loadTask() {
        setLoading(true);
        taskRepo.getTask(taskId, new RepositoryCallback<TaskVO>() {
            @Override
            public void onSuccess(TaskVO task) {
                setLoading(false);
                renderTask(task);
            }

            @Override
            public void onError(ApiException e) {
                setLoading(false);
                showStatus(getString(R.string.task_action_fail, e.getMessage()));
            }
        });
    }

    private void renderTask(TaskVO task) {
        titleText.setText(task.getTitle());
        String statusStr = task.getStatus();
        statusText.setText(getString(TaskStatusStyle.labelRes(statusStr)));
        statusText.setBackgroundResource(TaskStatusStyle.badgeBackground(statusStr));
        statusText.setTextColor(TaskStatusStyle.badgeTextColor(this, statusStr));

        descriptionText.setText(task.getDescription() == null ? "" : task.getDescription());

        gasTypeText.setText(label(R.string.label_gas_type, task.getGasType()));
        areaText.setText(label(R.string.label_area, task.getAreaName()));
        assigneeText.setText(assigneeLine(task));
        checkinText.setText(checkinLine(task));
        reviewText.setText(reviewLine(task));

        renderTimeline(task);
        renderTimeoutWarning(task);

        renderButtons(task);
        navigateButton.setVisibility(task.getX() != null && task.getY() != null
                ? View.VISIBLE : View.GONE);
        navigateButton.setTag(task);
    }

    private void openNavigation() {
        Object tag = navigateButton.getTag();
        if (!(tag instanceof TaskVO)) {
            showStatus(getString(R.string.task_location_not_ready));
            return;
        }
        TaskVO task = (TaskVO) tag;
        Intent intent = new Intent(this, MapActivity.class);
        intent.putExtra(MapActivity.EXTRA_DESTINATION_X, task.getX());
        intent.putExtra(MapActivity.EXTRA_DESTINATION_Y, task.getY());
        intent.putExtra(MapActivity.EXTRA_DESTINATION_NAME,
                task.getAreaName() == null ? task.getTitle() : task.getAreaName());
        startActivity(intent);
    }

    private void renderButtons(TaskVO task) {
        String status = task.getStatus();
        acceptButton.setVisibility(TaskStatusStyle.ASSIGNED.equals(status) ? View.VISIBLE : View.GONE);
        checkinButton.setVisibility(TaskStatusStyle.PROCESSING.equals(status) ? View.VISIBLE : View.GONE);
        reviewPassButton.setVisibility(
                isAdmin && TaskStatusStyle.PENDING_REVIEW.equals(status) ? View.VISIBLE : View.GONE);
        reviewRejectButton.setVisibility(
                isAdmin && TaskStatusStyle.PENDING_REVIEW.equals(status) ? View.VISIBLE : View.GONE);
        cancelButton.setVisibility(
                isAdmin && (TaskStatusStyle.PENDING.equals(status) || TaskStatusStyle.ASSIGNED.equals(status))
                        ? View.VISIBLE : View.GONE);
    }

    private void acceptTask() {
        lockActionButtons();
        taskRepo.acceptTask(taskId, new RepositoryCallback<TaskVO>() {
            @Override
            public void onSuccess(TaskVO task) {
                unlockActionButtons();
                toast(getString(R.string.btn_accept));
                renderTask(task);
            }

            @Override
            public void onError(ApiException e) {
                unlockActionButtons();
                showStatus(e.isConflict()
                        ? getString(R.string.task_status_changed)
                        : getString(R.string.task_action_fail, e.getMessage()));
            }
        });
    }

    private void reviewTask(String result) {
        lockActionButtons();
        taskRepo.reviewTask(new TaskReviewRequest(taskId, result, null),
                new RepositoryCallback<TaskVO>() {
                    @Override
                    public void onSuccess(TaskVO task) {
                        unlockActionButtons();
                        toast(getString(result.equals("pass")
                                ? R.string.btn_review_pass
                                : R.string.btn_review_reject));
                        renderTask(task);
                    }

                    @Override
                    public void onError(ApiException e) {
                        unlockActionButtons();
                        showStatus(e.isConflict()
                                ? getString(R.string.task_status_changed)
                                : getString(R.string.task_action_fail, e.getMessage()));
                    }
                });
    }

    private void cancelTask() {
        lockActionButtons();
        taskRepo.cancelTask(taskId, new RepositoryCallback<Void>() {
            @Override
            public void onSuccess(Void data) {
                unlockActionButtons();
                toast(getString(R.string.btn_cancel_task));
                finish();
            }

            @Override
            public void onError(ApiException e) {
                unlockActionButtons();
                showStatus(e.isConflict()
                        ? getString(R.string.task_status_changed)
                        : getString(R.string.task_action_fail, e.getMessage()));
            }
        });
    }

    /** 写操作进行中禁用全部操作按钮，防止重复提交。 */
    private void lockActionButtons() {
        setLoading(true);
        acceptButton.setEnabled(false);
        checkinButton.setEnabled(false);
        reviewPassButton.setEnabled(false);
        reviewRejectButton.setEnabled(false);
        cancelButton.setEnabled(false);
    }

    private void unlockActionButtons() {
        setLoading(false);
        acceptButton.setEnabled(true);
        checkinButton.setEnabled(true);
        reviewPassButton.setEnabled(true);
        reviewRejectButton.setEnabled(true);
        cancelButton.setEnabled(true);
    }

    private String assigneeLine(TaskVO task) {
        String type = task.getAssigneeType();
        if (type == null) {
            return label(R.string.label_assignee, getString(R.string.assignee_unassigned));
        }
        if (type.equals("car")) {
            return label(R.string.label_assignee, getString(R.string.assignee_car_detail, task.getCarId()));
        }
        return label(R.string.label_assignee, getString(R.string.assignee_employee_detail, task.getEmployeeId()));
    }

    private String checkinLine(TaskVO task) {
        if (task.getCheckinTime() == null) {
            return label(R.string.label_checkin, getString(R.string.checkin_none));
        }
        String person = task.getYoloPersonCount() == null
                ? getString(R.string.checkin_yolo_unavailable)
                : getString(R.string.checkin_yolo_count, task.getYoloPersonCount());
        String remark = task.getCheckinRemark() == null ? "" : getString(R.string.checkin_remark_suffix, task.getCheckinRemark());
        return label(R.string.label_checkin, task.getCheckinTime() + person + remark);
    }

    private String reviewLine(TaskVO task) {
        if (task.getReviewResult() == null) {
            return label(R.string.label_review, getString(R.string.review_none));
        }
        String remark = task.getReviewRemark() == null ? "" : getString(R.string.review_remark_suffix, task.getReviewRemark());
        return label(R.string.label_review, task.getReviewResult() + remark);
    }

    private String label(int resId, String value) {
        return getString(resId) + "：" + (value == null ? "-" : value);
    }

    /**
     * 渲染处置进度时间线：创建→指派→接单→打卡→验收。
     * 每个节点显示时间，已完成的相邻节点间显示耗时，未到达节点显示"待执行"。
     */
    private void renderTimeline(TaskVO task) {
        String created = task.getCreatedAt();
        String assigned = task.getAssignedTime();
        String accepted = task.getAcceptedTime();
        String checkin = task.getCheckinTime();
        String review = task.getReviewTime();

        timelineCreatedText.setText(timelineLine(R.string.timeline_created, created, null));
        timelineAssignedText.setText(timelineLine(R.string.timeline_assigned, assigned, created));
        timelineAcceptedText.setText(timelineLine(R.string.timeline_accepted, accepted, assigned));
        timelineCheckinText.setText(timelineLine(R.string.timeline_checkin, checkin, accepted));
        timelineReviewText.setText(timelineLine(R.string.timeline_review, review, checkin));
    }

    /** 单行时间线：节点名 + 时间（或待执行）+ 从上一节点耗时。 */
    private String timelineLine(int labelRes, String time, String prevTime) {
        String label = getString(labelRes);
        if (time == null || time.isEmpty()) {
            return label + "：待执行";
        }
        String duration = "";
        if (prevTime != null && !prevTime.isEmpty()) {
            long fromMs = com.at.mobile.util.TimeElapsed.parse(prevTime).getTime();
            long toMs = com.at.mobile.util.TimeElapsed.parse(time).getTime();
            duration = "（耗时 " + com.at.mobile.util.TimeElapsed.duration(fromMs, toMs) + "）";
        }
        return label + "：" + time + duration;
    }

    /** processing 状态超 2 小时显示超时预警横幅。 */
    private void renderTimeoutWarning(TaskVO task) {
        boolean show = TaskStatusStyle.PROCESSING.equals(task.getStatus())
                && com.at.mobile.util.TimeElapsed.isProcessingTimeout(
                        task.getAcceptedTime(), task.getCreatedAt());
        if (show) {
            String elapsed = com.at.mobile.util.TimeElapsed.isProcessingTimeout(
                    task.getAcceptedTime(), task.getCreatedAt())
                    ? processingElapsed(task)
                    : "";
            timeoutWarningText.setText(getString(R.string.task_processing_timeout, elapsed));
            timeoutWarningText.setVisibility(View.VISIBLE);
        } else {
            timeoutWarningText.setVisibility(View.GONE);
        }
    }

    /** processing 已持续时长字符串，优先用 acceptedTime，兜底 createdAt。 */
    private String processingElapsed(TaskVO task) {
        java.util.Date start = com.at.mobile.util.TimeElapsed.parse(task.getAcceptedTime());
        if (start == null) {
            start = com.at.mobile.util.TimeElapsed.parse(task.getCreatedAt());
        }
        if (start == null) {
            return "--";
        }
        return com.at.mobile.util.TimeElapsed.duration(start.getTime(), System.currentTimeMillis());
    }
}

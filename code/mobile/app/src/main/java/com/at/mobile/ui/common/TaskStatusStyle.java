package com.at.mobile.ui.common;

import androidx.annotation.ColorInt;
import androidx.annotation.DrawableRes;
import androidx.annotation.StringRes;

import com.at.mobile.R;

/**
 * 任务状态视觉映射：统一 pending/assigned/processing/pending_review/completed/canceled
 * 六态对应的中文标签、徽章背景、文字色。
 *
 * <p>此前 TaskDetailActivity、TaskAdapter、SuperMapHelper 各自维护一份 switch 分支，
 * 颜色值曾出现漂移（processing 在地图层是 215,0,54，在列表层是 211,47,47）。
 * 本类作为单一事实源，三处共用。</p>
 */
public final class TaskStatusStyle {

    public static final String PENDING = "pending";
    public static final String ASSIGNED = "assigned";
    public static final String PROCESSING = "processing";
    public static final String PENDING_REVIEW = "pending_review";
    public static final String COMPLETED = "completed";
    public static final String CANCELED = "canceled";

    private TaskStatusStyle() {
    }

    /** 状态中文标签，未知状态原样返回。 */
    @StringRes
    public static int labelRes(String status) {
        if (status == null) {
            return R.string.task_status_unknown;
        }
        switch (status) {
            case PENDING: return R.string.task_status_pending;
            case ASSIGNED: return R.string.task_status_assigned;
            case PROCESSING: return R.string.task_status_processing;
            case PENDING_REVIEW: return R.string.task_status_pending_review;
            case COMPLETED: return R.string.task_status_completed;
            case CANCELED: return R.string.task_status_canceled;
            default: return R.string.task_status_unknown;
        }
    }

    /** 状态徽章背景 drawable，未知走 primary。 */
    @DrawableRes
    public static int badgeBackground(String status) {
        if (status == null) {
            return R.drawable.bg_badge_primary;
        }
        switch (status) {
            case PENDING: return R.drawable.bg_badge_danger;
            case ASSIGNED:
            case PROCESSING: return R.drawable.bg_badge_primary;
            case PENDING_REVIEW: return R.drawable.bg_badge_warning;
            case COMPLETED: return R.drawable.bg_badge_success;
            case CANCELED:
            default: return R.drawable.bg_badge_primary;
        }
    }

    /** 状态徽章文字色，未知走次文字色。 */
    @ColorInt
    public static int badgeTextColor(android.content.Context ctx, String status) {
        if (status == null) {
            return ctx.getResources().getColor(R.color.textSecondary);
        }
        switch (status) {
            case PENDING: return ctx.getResources().getColor(R.color.dangerText);
            case ASSIGNED:
            case PROCESSING: return ctx.getResources().getColor(R.color.colorPrimary);
            case PENDING_REVIEW: return ctx.getResources().getColor(R.color.warningText);
            case COMPLETED: return ctx.getResources().getColor(R.color.successText);
            case CANCELED:
            default: return ctx.getResources().getColor(R.color.textSecondary);
        }
    }

    /** 卡片左侧状态色条 drawable：pending 红、assigned/processing 蓝、待验收橙、完成绿、取消灰。 */
    @DrawableRes
    public static int severityBar(String status) {
        if (status == null) {
            return R.drawable.bg_severity_neutral;
        }
        switch (status) {
            case PENDING: return R.drawable.bg_severity_danger;
            case ASSIGNED:
            case PROCESSING: return R.drawable.bg_severity_primary;
            case PENDING_REVIEW: return R.drawable.bg_severity_warning;
            case COMPLETED: return R.drawable.bg_severity_success;
            case CANCELED:
            default: return R.drawable.bg_severity_neutral;
        }
    }
}

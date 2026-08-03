package com.at.mobile.ui.task;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import com.at.mobile.R;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.ui.common.TaskStatusStyle;

import java.util.ArrayList;
import java.util.List;

/**
 * 任务列表适配器。状态徽章配色与标签统一走 {@link TaskStatusStyle}，避免三处漂移。
 */
public class TaskAdapter extends RecyclerView.Adapter<TaskAdapter.Holder> {

    private final List<TaskVO> items = new ArrayList<>();
    private final OnTaskClickListener listener;

    public interface OnTaskClickListener {
        void onTaskClick(TaskVO task);
    }

    public TaskAdapter(OnTaskClickListener listener) {
        this.listener = listener;
    }

    public void submit(List<TaskVO> list) {
        final List<TaskVO> newItems = new ArrayList<>();
        if (list != null) {
            newItems.addAll(list);
        }
        DiffUtil.DiffResult diff = DiffUtil.calculateDiff(new DiffUtil.Callback() {
            @Override
            public int getOldListSize() {
                return items.size();
            }

            @Override
            public int getNewListSize() {
                return newItems.size();
            }

            @Override
            public boolean areItemsTheSame(int oldPos, int newPos) {
                Long oldId = items.get(oldPos).getId();
                Long newId = newItems.get(newPos).getId();
                return oldId != null && oldId.equals(newId);
            }

            @Override
            public boolean areContentsTheSame(int oldPos, int newPos) {
                TaskVO a = items.get(oldPos);
                TaskVO b = newItems.get(newPos);
                return eq(a.getId(), b.getId())
                        && eq(a.getStatus(), b.getStatus())
                        && eq(a.getTitle(), b.getTitle())
                        && eq(a.getGasType(), b.getGasType())
                        && eq(a.getAreaName(), b.getAreaName())
                        && eq(a.getCreatedAt(), b.getCreatedAt());
            }
        });
        items.clear();
        items.addAll(newItems);
        diff.dispatchUpdatesTo(this);
    }

    private static boolean eq(Object a, Object b) {
        return a == null ? b == null : a.equals(b);
    }

    @NonNull
    @Override
    public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_task, parent, false);
        return new Holder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull Holder holder, int position) {
        TaskVO task = items.get(position);
        Context ctx = holder.itemView.getContext();

        holder.title.setText(nullText(task.getTitle(),
                ctx.getString(R.string.task_fallback_title, task.getId())));
        holder.status.setText(ctx.getString(TaskStatusStyle.labelRes(task.getStatus())));
        holder.status.setBackgroundResource(TaskStatusStyle.badgeBackground(task.getStatus()));
        holder.status.setTextColor(TaskStatusStyle.badgeTextColor(ctx, task.getStatus()));
        holder.severityBar.setBackgroundResource(TaskStatusStyle.severityBar(task.getStatus()));

        String gas = task.getGasType();
        if (gas != null && !gas.isEmpty()) {
            holder.gasType.setText(gas);
            holder.gasType.setVisibility(View.VISIBLE);
        } else {
            holder.gasType.setVisibility(View.GONE);
        }

        holder.area.setText(nullText(task.getAreaName(), ctx.getString(R.string.task_fallback_area)));
        holder.time.setText(nullText(task.getCreatedAt(), ""));

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onTaskClick(task);
            }
        });
    }

    private String nullText(String value, String fallback) {
        return (value == null || value.trim().isEmpty()) ? fallback : value;
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class Holder extends RecyclerView.ViewHolder {
        final View severityBar;
        final TextView title;
        final TextView status;
        final TextView gasType;
        final TextView area;
        final TextView time;

        Holder(@NonNull View itemView) {
            super(itemView);
            severityBar = itemView.findViewById(R.id.vTaskSeverityBar);
            title = itemView.findViewById(R.id.tvTaskTitle);
            status = itemView.findViewById(R.id.tvTaskStatus);
            gasType = itemView.findViewById(R.id.tvTaskGasType);
            area = itemView.findViewById(R.id.tvTaskArea);
            time = itemView.findViewById(R.id.tvTaskTime);
        }
    }
}

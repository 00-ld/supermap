package com.at.mobile.ui.incident;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.at.mobile.R;
import com.at.mobile.data.remote.dto.WarningVO;
import com.at.mobile.util.GasHazardLevel;
import com.at.mobile.util.TimeElapsed;

import java.util.ArrayList;
import java.util.List;

/**
 * 事故告警列表适配器。
 *
 * <p>业务深化点：
 * <ul>
 *   <li>左侧色条按气体危险度分级（剧毒/易燃→红，有害→橙，一般→绿）</li>
 *   <li>气体图标圆底按危险度着色</li>
 *   <li>右上角危险等级徽章</li>
 *   <li>底部"已持续 X 分钟"，超 30 分钟显示红色"超时"标签</li>
 * </ul></p>
 */
public class IncidentAdapter extends RecyclerView.Adapter<IncidentAdapter.Holder> {

    private final List<WarningVO> items = new ArrayList<>();
    private final OnIncidentClick listener;

    public interface OnIncidentClick {
        void onClick(WarningVO warning);
    }

    public IncidentAdapter(OnIncidentClick listener) {
        this.listener = listener;
    }

    public void submit(List<WarningVO> list) {
        items.clear();
        if (list != null) {
            items.addAll(list);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_incident, parent, false);
        return new Holder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull Holder holder, int position) {
        WarningVO warning = items.get(position);
        String gasType = warning.getGasType();
        int level = GasHazardLevel.of(gasType);

        // 危险度色条与图标圆底
        holder.severityBar.setBackgroundResource(GasHazardLevel.severityBar(level));
        holder.gasIcon.setBackgroundResource(GasHazardLevel.badgeBackground(level));

        // 气体类型徽章
        holder.gasType.setText(nullText(gasType, "未知气体"));

        // 浓度值
        holder.gasValue.setText(warning.getGasValue() == null ? "" : String.valueOf(warning.getGasValue()));

        // 危险等级徽章
        holder.hazardLevel.setText(holder.itemView.getContext().getString(GasHazardLevel.labelRes(level)));
        holder.hazardLevel.setBackgroundResource(GasHazardLevel.badgeBackground(level));
        holder.hazardLevel.setTextColor(holder.itemView.getContext()
                .getResources().getColor(GasHazardLevel.textColor(level)));

        // 区域 + 巡检车 + 时间
        holder.area.setText(nullText(warning.getAreaName(), "未知区域"));
        holder.car.setText("巡检车 #" + (warning.getCarId() == null ? "-" : warning.getCarId()));
        holder.time.setText(nullText(warning.getWarningTime(), ""));

        // 已持续时长 + 超时标签
        String elapsed = TimeElapsed.incidentElapsed(warning.getWarningTime());
        holder.elapsed.setText(elapsed);
        boolean timeout = TimeElapsed.isIncidentTimeout(warning.getWarningTime());
        holder.timeoutTag.setVisibility(timeout ? View.VISIBLE : View.GONE);
        holder.elapsed.setTextColor(timeout
                ? holder.itemView.getContext().getResources().getColor(R.color.danger)
                : holder.itemView.getContext().getResources().getColor(R.color.textSecondary));

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onClick(warning);
            }
        });
    }

    private String nullText(String value, String fallback) {
        return value == null ? fallback : value;
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class Holder extends RecyclerView.ViewHolder {
        final View severityBar;
        final ImageView gasIcon;
        final TextView gasType;
        final TextView gasValue;
        final TextView hazardLevel;
        final TextView area;
        final TextView car;
        final TextView time;
        final TextView elapsed;
        final TextView timeoutTag;

        Holder(@NonNull View itemView) {
            super(itemView);
            severityBar = itemView.findViewById(R.id.vSeverityBar);
            gasIcon = itemView.findViewById(R.id.ivGasIcon);
            gasType = itemView.findViewById(R.id.tvGasType);
            gasValue = itemView.findViewById(R.id.tvGasValue);
            hazardLevel = itemView.findViewById(R.id.tvHazardLevel);
            area = itemView.findViewById(R.id.tvArea);
            car = itemView.findViewById(R.id.tvCar);
            time = itemView.findViewById(R.id.tvTime);
            elapsed = itemView.findViewById(R.id.tvElapsed);
            timeoutTag = itemView.findViewById(R.id.tvTimeoutTag);
        }
    }
}

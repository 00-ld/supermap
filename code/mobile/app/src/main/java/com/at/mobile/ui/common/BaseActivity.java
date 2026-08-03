package com.at.mobile.ui.common;

import android.view.View;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.at.mobile.R;

/**
 * Activity 公共基类，收口 loading 切换、错误提示、返回箭头绑定，避免每个页面重写样板。
 */
public abstract class BaseActivity extends AppCompatActivity {

    private ProgressBar progressBar;
    private TextView statusText;

    /** 绑定可选的进度条与状态文本控件（页面没有则不接管） */
    public void bindLoadingViews(@Nullable ProgressBar bar, @Nullable TextView text) {
        this.progressBar = bar;
        this.statusText = text;
    }

    /** 进入/退出加载态：进度条显隐 + 传 false 时清空状态文本 */
    public void setLoading(boolean loading) {
        if (progressBar != null) {
            progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        }
    }

    /** 展示错误/状态文本，msg 为 null 时隐藏 */
    public void showStatus(String msg) {
        if (statusText == null) {
            // 没绑状态文本就退化为 Toast，保证用户可见
            if (msg != null) Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
            return;
        }
        if (msg == null) {
            statusText.setVisibility(View.GONE);
        } else {
            statusText.setText(msg);
            statusText.setVisibility(View.VISIBLE);
        }
    }

    public void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }

    /**
     * 绑定 common_toolbar 中的返回箭头：存在则显示并 finish 当前页。
     * 主页等无返回需求的页面不调用即可。
     */
    public void bindToolbarBack() {
        ImageButton backBtn = findViewById(R.id.btnToolbarBack);
        if (backBtn != null) {
            backBtn.setVisibility(View.VISIBLE);
            backBtn.setOnClickListener(v -> finish());
        }
    }
}


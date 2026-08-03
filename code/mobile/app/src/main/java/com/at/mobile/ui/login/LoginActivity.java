package com.at.mobile.ui.login;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.at.mobile.App;
import com.at.mobile.R;
import com.at.mobile.data.local.AppConfig;
import com.at.mobile.data.local.SessionManager;
import com.at.mobile.data.remote.ApiCallback;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.HttpClient;
import com.at.mobile.data.remote.dto.LoginRequest;
import com.at.mobile.ui.main.MainActivity;
import com.at.mobile.util.JwtDecoder;

/** 登录入口：校验账号密码、换取 JWT、解析 claims 落地本地会话后进入主页。 */
public class LoginActivity extends AppCompatActivity {

    private EditText usernameField;
    private EditText passwordField;
    private Button loginButton;
    private ProgressBar loadingBar;
    private TextView statusText;
    private TextView licenseText;
    private ImageButton serverSettingsBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (SessionManager.get(this).isLoggedIn()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }
        setContentView(R.layout.activity_login);
        bindViews();
        showLicenseStatus();
        loginButton.setOnClickListener(v -> submitLogin());
        if (serverSettingsBtn != null) {
            serverSettingsBtn.setOnClickListener(v -> showServerConfigDialog());
        }
    }

    private void bindViews() {
        usernameField = findViewById(R.id.etUsername);
        passwordField = findViewById(R.id.etPassword);
        loginButton = findViewById(R.id.btnLogin);
        loadingBar = findViewById(R.id.progressBar);
        statusText = findViewById(R.id.tvMessage);
        licenseText = findViewById(R.id.tvLicenseStatus);
        serverSettingsBtn = findViewById(R.id.ibServerSettingsLogin);
    }

    private void showLicenseStatus() {
        licenseText.setText(App.isLicenseValid()
                ? "SuperMap 许可已激活 ✓"
                : "SuperMap 许可未激活 ✗（地图功能不可用）");
    }

    private void submitLogin() {
        String username = usernameField.getText().toString().trim();
        String password = passwordField.getText().toString();
        if (TextUtils.isEmpty(username) || TextUtils.isEmpty(password)) {
            showError(getString(R.string.login_empty));
            return;
        }
        toggleLoading(true);
        HttpClient.get(this).api().login(new LoginRequest(username, password))
                .enqueue(new ApiCallback<String>(this) {
                    @Override
                    public void onSuccess(String token) {
                        persistSession(token, username);
                        toggleLoading(false);
                        startActivity(new Intent(LoginActivity.this, MainActivity.class));
                        finish();
                    }

                    @Override
                    public void onError(ApiException error) {
                        toggleLoading(false);
                        showError(getString(R.string.login_fail, error.getMessage()));
                    }
                });
    }

    /** 落地会话：token 持久化，payload 解析失败时退化为仅存 token。 */
    private void persistSession(String token, String fallbackUsername) {
        JwtDecoder.Claims claims = JwtDecoder.decode(token);
        SessionManager manager = SessionManager.get(this);
        if (claims != null) {
            manager.saveLogin(token, claims.getId(), claims.username, claims.role);
        } else {
            manager.saveLogin(token, null, fallbackUsername, null);
        }
    }

    private void toggleLoading(boolean loading) {
        loadingBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        loginButton.setEnabled(!loading);
        loginButton.setText(loading ? R.string.login_loading : R.string.btn_login);
    }

    private void showError(String message) {
        statusText.setText(message);
        statusText.setVisibility(View.VISIBLE);
    }

    private void showServerConfigDialog() {
        AppConfig config = AppConfig.get(this);
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("⚙️ 服务端 Endpoint 配置");

        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(config.getBackendBaseUrl());
        input.setHint("http://192.168.x.x:8081/");
        input.setPadding(40, 30, 40, 30);

        builder.setView(input);

        builder.setPositiveButton("保存配置", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                config.setBackendBaseUrl(newUrl);
                HttpClient.resetInstance();
                Toast.makeText(LoginActivity.this, "服务器地址已更新：" + newUrl, Toast.LENGTH_SHORT).show();
            }
        });

        builder.setNeutralButton("恢复默认 (127.0.0.1)", (dialog, which) -> {
            config.clearBackendBaseUrlOverride();
            HttpClient.resetInstance();
            Toast.makeText(LoginActivity.this, "已恢复默认服务器地址：http://127.0.0.1:8081/", Toast.LENGTH_SHORT).show();
        });

        builder.setNegativeButton("取消", (dialog, which) -> dialog.cancel());

        builder.show();
    }
}

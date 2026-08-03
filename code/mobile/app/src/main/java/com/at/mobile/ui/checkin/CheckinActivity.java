package com.at.mobile.ui.checkin;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.at.mobile.R;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.data.repository.RepositoryCallback;
import com.at.mobile.data.repository.TaskRepository;
import com.at.mobile.device.CameraHelper;
import com.at.mobile.device.LocationProvider;
import com.at.mobile.ui.common.BaseActivity;
import com.at.mobile.util.CheckinDistanceValidator;
import com.at.mobile.util.ImageUtil;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import pub.devrel.easypermissions.EasyPermissions;

/**
 * 现场打卡页：定位 + 拍照 + 备注 + 上传，含进度与重试。
 * 闭环：定位（WGS84）→ 拍照 → 压缩 → multipart 上传 → pending_review。
 */
public class CheckinActivity extends BaseActivity {

    public static final String EXTRA_TASK_ID = "task_id";

    private static final int REQ_PERMISSIONS = 1000;
    private static final int REQ_CAMERA = 1001;
    private static final String[] PERMS = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA
    };

    private final CameraHelper cameraHelper = new CameraHelper();

    private long taskId;
    private TaskRepository taskRepo;
    private LocationProvider locationProvider;

    private TextView locationStatusText;
    private Button locateButton;
    private ImageView photoView;
    private Button takePhotoButton;
    private EditText remarkInput;
    private Button submitButton;
    private ProgressBar progressBar;
    private TextView messageText;
    private TextView toolbarTitle;
    private TextView stepLocateView;
    private TextView stepPhotoView;
    private TextView stepSubmitView;

    private Double latitude;
    private Double longitude;
    private byte[] photoBytes;
    private boolean submitting;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_checkin);
        taskId = getIntent().getLongExtra(EXTRA_TASK_ID, -1L);
        if (taskId <= 0) {
            finish();
            return;
        }
        taskRepo = TaskRepository.get(this);
        locationProvider = new LocationProvider(this);
        bindViews();
        ensurePermissions();
        bindToolbarBack();
    }

    private void bindViews() {
        locationStatusText = findViewById(R.id.tvLocationStatus);
        locateButton = findViewById(R.id.btnLocate);
        photoView = findViewById(R.id.ivPhoto);
        takePhotoButton = findViewById(R.id.btnTakePhoto);
        remarkInput = findViewById(R.id.etRemark);
        submitButton = findViewById(R.id.btnSubmit);
        progressBar = findViewById(R.id.progressBar);
        messageText = findViewById(R.id.tvMessage);
        toolbarTitle = findViewById(R.id.tvToolbarTitle);
        stepLocateView = findViewById(R.id.tvStepLocate);
        stepPhotoView = findViewById(R.id.tvStepPhoto);
        stepSubmitView = findViewById(R.id.tvStepSubmit);
        bindLoadingViews(progressBar, messageText);

        toolbarTitle.setText(R.string.checkin_title);
        locateButton.setOnClickListener(v -> startLocate());
        takePhotoButton.setOnClickListener(v -> startCamera());
        submitButton.setOnClickListener(v -> submitCheckin());
    }

    private void ensurePermissions() {
        if (EasyPermissions.hasPermissions(this, PERMS)) {
            autoLocate();
            return;
        }
        EasyPermissions.requestPermissions(
                this, getString(R.string.checkin_permission_rationale), REQ_PERMISSIONS, PERMS);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // 不依赖 EasyPermissions 的 Callbacks 接口（跨版本签名不一致），
        // 直接重判所需权限是否已授予，足够简单且稳。
        if (EasyPermissions.hasPermissions(this, PERMS)) {
            autoLocate();
        } else {
            locationStatusText.setText(getString(R.string.checkin_location_fail, "权限被拒绝"));
        }
    }

    private void autoLocate() {
        if (LocationProvider.hasPermission(this)) {
            startLocate();
        }
    }

    private void startLocate() {
        locationStatusText.setText(R.string.checkin_locating);
        if (!locationProvider.isAvailable()) {
            locationStatusText.setText(
                    getString(R.string.checkin_location_fail, "无可用定位提供者"));
            return;
        }
        locationProvider.requestSingleUpdate(new LocationProvider.Callback() {
            @Override
            public void onLocation(double lat, double lon) {
                latitude = lat;
                longitude = lon;
                locationStatusText.setText(
                        getString(R.string.checkin_location_ok, lat, lon));
                markStepDone(stepLocateView);
            }

            @Override
            public void onFailed(String reason) {
                locationStatusText.setText(getString(R.string.checkin_location_fail, reason));
            }
        });
    }

    private void startCamera() {
        if (!cameraHelper.dispatch(this, REQ_CAMERA)) {
            toast(getString(R.string.checkin_camera_fail));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_CAMERA) {
            return;
        }
        if (resultCode != Activity.RESULT_OK) {
            return;
        }
        Uri photoUri = cameraHelper.getPhotoUri();
        if (photoUri == null) {
            return;
        }
        showStatus(getString(R.string.checkin_compressing));
        setLoading(true);
        takePhotoButton.setEnabled(false);
        new Thread(() -> {
            byte[] bytes = ImageUtil.compressFromUri(this, photoUri);
            runOnUiThread(() -> {
                setLoading(false);
                takePhotoButton.setEnabled(true);
                showStatus(null);
                if (bytes == null || bytes.length == 0) {
                    toast(getString(R.string.checkin_camera_fail));
                    return;
                }
                photoBytes = bytes;
                photoView.setImageURI(photoUri);
                photoView.setVisibility(View.VISIBLE);
                markStepDone(stepPhotoView);
                markStepActive(stepSubmitView);
            });
        }).start();
    }

    private void submitCheckin() {
        if (submitting) {
            return;
        }
        if (latitude == null || longitude == null) {
            showStatus(getString(R.string.checkin_no_location));
            return;
        }
        if (photoBytes == null || photoBytes.length == 0) {
            showStatus(getString(R.string.checkin_no_photo));
            return;
        }
        // 先拉任务详情获取目标坐标，做距离校验
        showStatus(null);
        setLoading(true);
        taskRepo.getTask(taskId, new RepositoryCallback<TaskVO>() {
            @Override
            public void onSuccess(TaskVO task) {
                setLoading(false);
                lastTaskX = task.getX();
                lastTaskY = task.getY();
                int range = CheckinDistanceValidator.evaluate(
                        task.getX(), task.getY(), longitude, latitude);
                confirmSubmit(range);
            }

            @Override
            public void onError(ApiException e) {
                setLoading(false);
                // 拉任务详情失败不阻塞打卡，直接提交
                confirmSubmit(CheckinDistanceValidator.RANGE_UNKNOWN);
            }
        });
    }

    /** 根据距离范围决定直接提交还是需用户确认。 */
    private void confirmSubmit(int range) {
        if (range == CheckinDistanceValidator.RANGE_OK
                || range == CheckinDistanceValidator.RANGE_UNKNOWN) {
            doSubmit();
            return;
        }
        double distance = CheckinDistanceValidator.distanceMeters(
                lastTaskX, lastTaskY, longitude, latitude);
        String msg = range == CheckinDistanceValidator.RANGE_FAR
                ? getString(R.string.checkin_distance_far, distance)
                : getString(R.string.checkin_distance_warn, distance,
                        (int) CheckinDistanceValidator.thresholdFarMeters());
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("距离校验提示")
                .setMessage(msg + "\n\n是否继续提交？")
                .setPositiveButton("继续提交", (d, w) -> doSubmit())
                .setNegativeButton("取消", (d, w) -> d.dismiss())
                .show();
    }

    private Double lastTaskX;
    private Double lastTaskY;

    /** 实际执行提交。 */
    private void doSubmit() {
        submitting = true;
        submitButton.setEnabled(false);
        showStatus(getString(R.string.checkin_submitting));
        setLoading(true);
        String remark = remarkInput.getText().toString().trim();
        String fileName = "checkin_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.CHINA)
                .format(new Date()) + ".jpg";
        taskRepo.checkin(taskId, latitude, longitude, remark, photoBytes, fileName,
                new RepositoryCallback<TaskVO>() {
                    @Override
                    public void onSuccess(TaskVO task) {
                        markStepDone(stepSubmitView);
                        toast(getString(R.string.checkin_success));
                        setResult(RESULT_OK);
                        finish();
                    }

                    @Override
                    public void onError(ApiException e) {
                        submitting = false;
                        submitButton.setEnabled(true);
                        setLoading(false);
                        showStatus(getString(R.string.checkin_fail, e.getMessage()));
                    }
                });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (locationProvider != null) {
            locationProvider.stop();
        }
    }

    /** 标记某步骤为已完成态（绿色圆圈 + 白字）。 */
    private void markStepDone(TextView stepView) {
        if (stepView == null) {
            return;
        }
        stepView.setBackgroundResource(R.drawable.bg_step_done);
        stepView.setTextColor(getResources().getColor(R.color.white));
    }

    /** 标记某步骤为激活态（蓝色圆圈 + 白字）。 */
    private void markStepActive(TextView stepView) {
        if (stepView == null) {
            return;
        }
        stepView.setBackgroundResource(R.drawable.bg_step_active);
        stepView.setTextColor(getResources().getColor(R.color.white));
    }
}

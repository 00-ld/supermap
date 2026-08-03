package com.at.mobile.ui.map;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.at.mobile.App;
import com.at.mobile.R;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.dto.CarVO;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.data.repository.CarRepository;
import com.at.mobile.data.repository.RepositoryCallback;
import com.at.mobile.data.repository.TaskRepository;
import com.at.mobile.device.LocationProvider;
import com.at.mobile.map.RouteGuidance;
import com.at.mobile.map.SuperMapHelper;
import com.at.mobile.ui.common.BaseActivity;
import com.at.mobile.ui.task.TaskDetailActivity;
import com.at.mobile.util.CoordTransform;
import com.supermap.data.Geometry;
import com.supermap.data.Point2D;
import com.supermap.mapping.Action;
import com.supermap.mapping.GeometrySelectedEvent;
import com.supermap.mapping.GeometrySelectedListener;
import com.supermap.mapping.MapControl;
import com.supermap.mapping.MapParameterChangedListener;
import com.supermap.mapping.MapView;
import com.supermap.mapping.TrackingLayer;

import java.util.List;
import java.util.Locale;

/**
 * 地图页：承载 SuperMap iMobile MapView，加载 iServer REST Map 园区底图。
 *
 * <p>设计沿革：曾尝试接入 iServer 三维厂房场景（SceneControl + ST_NONEARTH），
 * 但备用机 GPU + iMobile 2026 SDK 自带 3dRes.zip 缺 shadow shader，
 * OGRE InitializeShadow → CreateGLSLProgram 空指针 native crash，代码层无法修复。
 * 三维方案已移除，地图页回退二维 REST 叠加 + TrackingLayer 业务点位。</p>
 *
 * <p>坐标显示：地图内部坐标是 PCS_NON_EARTH 米制，UI 经 CoordTransform 反算成 WGS84 经纬度。
 * 平移/缩放回调有 200ms 防抖，避免连续刷新状态栏卡顿。</p>
 */
public class MapActivity extends BaseActivity {

    public static final String EXTRA_DESTINATION_X = "destination_x";
    public static final String EXTRA_DESTINATION_Y = "destination_y";
    public static final String EXTRA_DESTINATION_NAME = "destination_name";

    private static final int REQ_LOCATION_FOR_NAVIGATION = 3101;
    /** 地图加载超时，iServer 不可达时不让 loading 一直转。 */
    private static final long MAP_LOAD_TIMEOUT_MS = 30_000L;
    /** 地图参数变化回调防抖间隔，连续平移缩放只做一次状态栏刷新。 */
    private static final long STATUS_DEBOUNCE_MS = 200L;

    private MapView mapView;
    private SuperMapHelper mapHelper;
    private LinearLayout loadingOverlay;
    private TextView loadStatusText;
    private Button retryButton;
    private TaskRepository taskRepo;
    private CarRepository carRepo;

    private LinearLayout topStatusBar;
    private TextView lngLatText;
    private TextView scaleText;

    private LinearLayout mapToolbar;
    private ImageButton btnZoomIn;
    private ImageButton btnZoomOut;
    private ImageButton btnReset;
    private ImageButton btnLegend;
    private LinearLayout legendPanel;

    /** 点位详情弹窗 */
    private LinearLayout calloutPanel;
    private TextView calloutTitle;
    private TextView calloutDetail;
    private Button calloutActionBtn;
    private ImageButton calloutCloseBtn;

    private LinearLayout navigationPanel;
    private TextView navigationTitleText;
    private TextView navigationInstructionText;
    private ImageButton navigationCloseButton;
    private Button navigationRefreshButton;
    private double destinationX = Double.NaN;
    private double destinationY = Double.NaN;
    private String destinationName;
    private LocationProvider locationProvider;

    /** 防抖 Handler：地图参数变化触发后延迟刷新状态栏，连续触发时只保留最后一次。 */
    private final Handler statusDebounce = new Handler();
    private Runnable statusRefreshTask;

    /** 地图加载超时任务。 */
    private Runnable mapTimeoutTask;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_map);
        readNavigationIntent();
        bindViews();
        if (App.isLicenseValid()) {
            initMap();
        } else {
            showFailed(getString(R.string.license_invalid));
        }
    }

    private void bindViews() {
        mapView = findViewById(R.id.mapView);
        loadingOverlay = findViewById(R.id.loadingOverlay);
        loadStatusText = findViewById(R.id.loadStatusText);
        retryButton = findViewById(R.id.retryButton);
        retryButton.setOnClickListener(v -> initMap());

        topStatusBar = findViewById(R.id.topStatusBar);
        lngLatText = findViewById(R.id.lngLatText);
        scaleText = findViewById(R.id.scaleText);

        mapToolbar = findViewById(R.id.mapToolbar);
        btnZoomIn = findViewById(R.id.btnZoomIn);
        btnZoomOut = findViewById(R.id.btnZoomOut);
        btnReset = findViewById(R.id.btnReset);
        btnLegend = findViewById(R.id.btnLegend);
        legendPanel = findViewById(R.id.legendPanel);

        // 点位详情弹窗
        calloutPanel = findViewById(R.id.calloutPanel);
        calloutTitle = findViewById(R.id.calloutTitle);
        calloutDetail = findViewById(R.id.calloutDetail);
        calloutActionBtn = findViewById(R.id.calloutActionBtn);
        calloutCloseBtn = findViewById(R.id.calloutCloseBtn);
        if (calloutCloseBtn != null) {
            calloutCloseBtn.setOnClickListener(v -> calloutPanel.setVisibility(View.GONE));
        }
        if (calloutActionBtn != null) {
            calloutActionBtn.setOnClickListener(v -> {
                Object tag = calloutActionBtn.getTag();
                if (tag instanceof Long) {
                    // 跳转到任务详情页
                    Intent intent = new Intent(MapActivity.this, TaskDetailActivity.class);
                    intent.putExtra(TaskDetailActivity.EXTRA_TASK_ID, (Long) tag);
                    startActivity(intent);
                }
                calloutPanel.setVisibility(View.GONE);
            });
        }

        navigationPanel = findViewById(R.id.navigationPanel);
        navigationTitleText = findViewById(R.id.tvNavigationTitle);
        navigationInstructionText = findViewById(R.id.tvNavigationInstruction);
        navigationCloseButton = findViewById(R.id.btnCloseNavigation);
        navigationRefreshButton = findViewById(R.id.btnRefreshNavigation);
        locationProvider = new LocationProvider(this);

        btnZoomIn.setOnClickListener(v -> zoomByFactor(0.5));
        btnZoomOut.setOnClickListener(v -> zoomByFactor(2.0));
        btnReset.setOnClickListener(v -> resetView());
        btnLegend.setOnClickListener(v -> toggleLegend());
        navigationCloseButton.setOnClickListener(v -> closeNavigation());
        navigationRefreshButton.setOnClickListener(v -> startTaskNavigation());
    }

    private void readNavigationIntent() {
        destinationX = getIntent().getDoubleExtra(EXTRA_DESTINATION_X, Double.NaN);
        destinationY = getIntent().getDoubleExtra(EXTRA_DESTINATION_Y, Double.NaN);
        destinationName = getIntent().getStringExtra(EXTRA_DESTINATION_NAME);
    }

    private void initMap() {
        showLoading(getString(R.string.map_loading));
        if (mapHelper == null) {
            mapHelper = new SuperMapHelper(this, mapView);
            taskRepo = TaskRepository.get(this);
            carRepo = new CarRepository(this);
        }
        scheduleMapLoadTimeout();
        mapHelper.loadParkMap(new SuperMapHelper.OnLoadListener() {
            @Override
            public void onLoaded() {
                cancelMapLoadTimeout();
                loadingOverlay.setVisibility(View.GONE);
                onMapReady();
            }

            @Override
            public void onFailed(String reason) {
                cancelMapLoadTimeout();
                showFailed(getString(R.string.map_load_fail));
            }
        });
    }

    /** 30s 超时兜底：iServer 不可达时 OkHttp 可能不触发 onFailed，强制终止 loading。 */
    private void scheduleMapLoadTimeout() {
        cancelMapLoadTimeout();
        mapTimeoutTask = () -> {
            if (mapHelper != null && !mapHelper.isLoaded()) {
                showFailed(getString(R.string.map_load_timeout));
            }
        };
        statusDebounce.postDelayed(mapTimeoutTask, MAP_LOAD_TIMEOUT_MS);
    }

    private void cancelMapLoadTimeout() {
        if (mapTimeoutTask != null) {
            statusDebounce.removeCallbacks(mapTimeoutTask);
            mapTimeoutTask = null;
        }
    }

    /**
     * 地图加载就绪：显示状态栏与工具栏，设默认平移动作，
     * 注册参数变化监听器（防抖）实时更新经纬度与比例尺，再叠加业务点。
     */
    private void onMapReady() {
        topStatusBar.setVisibility(View.VISIBLE);
        mapToolbar.setVisibility(View.VISIBLE);
        MapControl mapControl = mapView.getMapControl();
        mapControl.setAction(Action.PAN);
        mapControl.setMapParamChangedListener(new MapParameterChangedListener() {
            @Override
            public void scaleChanged(double scale) {
                debounceUpdateStatusBar();
            }

            @Override
            public void boundsChanged(Point2D center) {
                debounceUpdateStatusBar();
            }

            @Override
            public void angleChanged(double angle) {
            }

            @Override
            public void sizeChanged(int w, int h) {
            }
        });

        // 注册点位点击监听：通过 geometryID 在 TrackingLayer 中查找 tag
        mapControl.addGeometrySelectedListener(new GeometrySelectedListener() {
            @Override
            public void geometrySelected(GeometrySelectedEvent event) {
                try {
                    TrackingLayer layer = mapView.getMapControl().getMap().getTrackingLayer();
                    int geoId = event.getGeometryID();
                    // getTag 按索引取值，遍历所有点位匹配
                    for (int i = 0; i < layer.getCount(); i++) {
                        String tag = layer.getTag(i);
                        if (tag != null) {
                            if (tag.startsWith("task:")) {
                                showTaskCallout(tag.substring(5));
                            } else if (tag.startsWith("car:")) {
                                showCarCallout(tag.substring(4));
                            }
                        }
                    }
                } catch (Exception ex) {
                    Log.w("MapActivity", "点位点击回调异常", ex);
                }
            }

            @Override
            public void geometryMultiSelected(java.util.ArrayList<GeometrySelectedEvent> events) {
            }

            @Override
            public void geometryMultiSelectedCount(int count) {
            }
        });

        updateStatusBar();
        loadOverlays();
        if (hasNavigationDestination()) {
            startTaskNavigation();
        }
    }

    /** 显示任务点位详情弹窗 */
    private void showTaskCallout(String taskIdStr) {
        try {
            long taskId = Long.parseLong(taskIdStr);
            calloutTitle.setText("应急处置任务 #" + taskId);
            calloutDetail.setText("点击查看详情并进行处置操作");
            calloutActionBtn.setTag(taskId);
            calloutActionBtn.setText("查看详情 →");
            calloutActionBtn.setVisibility(View.VISIBLE);
            calloutPanel.setVisibility(View.VISIBLE);
        } catch (NumberFormatException ignored) {
        }
    }

    /** 显示巡检车点位详情弹窗 */
    private void showCarCallout(String carId) {
        calloutTitle.setText("巡检车 #" + carId);
        calloutDetail.setText("在线巡检车辆，正在执行巡检任务");
        calloutActionBtn.setVisibility(View.GONE);
        calloutPanel.setVisibility(View.VISIBLE);
    }

    /** 防抖刷新状态栏：连续平移缩放时 200ms 内只执行最后一次。 */
    private void debounceUpdateStatusBar() {
        if (statusRefreshTask != null) {
            statusDebounce.removeCallbacks(statusRefreshTask);
        }
        statusRefreshTask = this::updateStatusBar;
        statusDebounce.postDelayed(statusRefreshTask, STATUS_DEBOUNCE_MS);
    }

    /** 顶部状态栏：地图中心米制坐标 → WGS84 经纬度 + 当前比例尺。 */
    private void updateStatusBar() {
        if (mapHelper == null || !mapHelper.isLoaded()) {
            return;
        }
        Point2D center = mapHelper.getMapCenter();
        if (center == null) {
            return;
        }
        double[] lngLat = CoordTransform.projectedToLngLat(center.getX(), center.getY());
        lngLatText.setText(String.format(Locale.CHINA, "经度 %.6f°  纬度 %.6f°", lngLat[0], lngLat[1]));
        double scale = mapHelper.getMapScale();
        if (scale > 0) {
            scaleText.setText(String.format(Locale.CHINA, "1:%.0f", scale));
        }
    }

    /** 放大/缩小：scale 乘因子（因子<1 放大、>1 缩小），刷新后状态栏自动更新。 */
    private void zoomByFactor(double factor) {
        if (mapHelper == null || !mapHelper.isLoaded()) {
            return;
        }
        MapControl mapControl = mapView.getMapControl();
        mapControl.getMap().setScale(mapControl.getMap().getScale() * factor);
        mapControl.getMap().refresh();
        updateStatusBar();
    }

    /** 复位：全图自适应 + 中心回园区锚点。 */
    private void resetView() {
        if (mapHelper == null || !mapHelper.isLoaded()) {
            return;
        }
        MapControl mapControl = mapView.getMapControl();
        mapControl.getMap().viewEntire();
        mapControl.getMap().refresh();
        updateStatusBar();
    }

    private void toggleLegend() {
        legendPanel.setVisibility(legendPanel.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE);
    }

    private boolean hasNavigationDestination() {
        return !Double.isNaN(destinationX) && !Double.isNaN(destinationY);
    }

    /**
     * 以当前 GPS 坐标为起点，转换为园区投影坐标后由 iMobile TrackingLayer 绘制任务引导。
     * 位置权限被拒绝时仍会锁定目标位置，让工作人员可以手动查看道路与事故范围。
     */
    private void startTaskNavigation() {
        if (!hasNavigationDestination() || mapHelper == null || !mapHelper.isLoaded()) {
            return;
        }
        navigationPanel.setVisibility(View.VISIBLE);
        navigationTitleText.setText("前往 " + (destinationName == null ? "任务现场" : destinationName));
        navigationInstructionText.setText("正在定位，准备园区引导路线…");
        if (!LocationProvider.hasPermission(this)) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION},
                    REQ_LOCATION_FOR_NAVIGATION);
            return;
        }
        requestNavigationLocation();
    }

    private void requestNavigationLocation() {
        if (!locationProvider.isAvailable()) {
            showDestinationOnly();
            return;
        }
        locationProvider.requestSingleUpdate(new LocationProvider.Callback() {
            @Override
            public void onLocation(double latitude, double longitude) {
                double[] projected = CoordTransform.lngLatToProjected(longitude, latitude);
                showGuidance(new Point2D(projected[0], projected[1]));
            }

            @Override
            public void onFailed(String reason) {
                showDestinationOnly();
            }
        });
    }

    private void showGuidance(Point2D currentLocation) {
        RouteGuidance.Summary summary = mapHelper.showGuidanceRoute(
                currentLocation, new Point2D(destinationX, destinationY));
        if (summary == null) {
            navigationInstructionText.setText("地图尚未就绪，请点击重新定位");
            return;
        }
        String distance = summary.getDistanceMeters() < 1000.0
                ? String.format(Locale.CHINA, "约 %.0f 米", summary.getDistanceMeters())
                : String.format(Locale.CHINA, "约 %.1f 公里", summary.getDistanceMeters() / 1000.0);
        navigationInstructionText.setText(String.format(Locale.CHINA,
                "%s · %s · 蓝线为现场引导", summary.getDirection(), distance));
    }

    private void showDestinationOnly() {
        RouteGuidance.Summary summary = mapHelper.showGuidanceRoute(
                mapHelper.getMapCenter(), new Point2D(destinationX, destinationY));
        navigationInstructionText.setText(summary == null
                ? "无法显示目标位置，请点击重新定位"
                : "未获取到当前位置，已定位到事故目标；开启定位后可显示实时引导");
    }

    private void closeNavigation() {
        if (mapHelper != null) {
            mapHelper.clearGuidanceRoute();
        }
        navigationPanel.setVisibility(View.GONE);
        destinationX = Double.NaN;
        destinationY = Double.NaN;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_LOCATION_FOR_NAVIGATION) {
            if (LocationProvider.hasPermission(this)) {
                requestNavigationLocation();
            } else {
                showDestinationOnly();
            }
        }
    }

    /**
     * 地图就绪后拉取事故任务列表与巡检车列表，叠加到 TrackingLayer。
     * 业务与底图解耦：任一接口失败不影响地图显示，失败时轻提示不遮罩。
     */
    private void loadOverlays() {
        taskRepo.listTasks(null, new RepositoryCallback<List<TaskVO>>() {
            @Override
            public void onSuccess(List<TaskVO> tasks) {
                mapHelper.addTaskMarkers(tasks);
            }

            @Override
            public void onError(ApiException e) {
                // 任务层失败轻提示，不遮挡已加载的底图
                toast(getString(R.string.map_overlay_task_fail));
            }
        });
        carRepo.getAllCars(new RepositoryCallback<List<CarVO>>() {
            @Override
            public void onSuccess(List<CarVO> cars) {
                mapHelper.addCarMarkers(cars);
            }

            @Override
            public void onError(ApiException e) {
                // 巡检车层失败静默降级
            }
        });
    }

    private void showLoading(String text) {
        loadingOverlay.setVisibility(View.VISIBLE);
        loadStatusText.setText(text);
        retryButton.setVisibility(View.GONE);
    }

    private void showFailed(String text) {
        loadingOverlay.setVisibility(View.VISIBLE);
        loadStatusText.setText(text);
        retryButton.setVisibility(View.VISIBLE);
    }

    @Override
    protected void onDestroy() {
        cancelMapLoadTimeout();
        if (statusRefreshTask != null) {
            statusDebounce.removeCallbacks(statusRefreshTask);
            statusRefreshTask = null;
        }
        if (locationProvider != null) {
            locationProvider.stop();
        }
        if (mapHelper != null) {
            mapHelper.dispose();
        }
        super.onDestroy();
    }
}

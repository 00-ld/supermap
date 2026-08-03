package com.at.mobile.map;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.at.mobile.data.local.AppConfig;
import com.at.mobile.data.remote.dto.CarVO;
import com.at.mobile.data.remote.dto.TaskVO;
import com.supermap.data.Color;
import com.supermap.data.Datasource;
import com.supermap.data.DatasourceConnectionInfo;
import com.supermap.data.EngineType;
import com.supermap.data.GeoLine;
import com.supermap.data.GeoPoint;
import com.supermap.data.GeoStyle;
import com.supermap.data.GeoText;
import com.supermap.data.Point2D;
import com.supermap.data.Point2Ds;
import com.supermap.data.Size2D;
import com.supermap.data.TextPart;
import com.supermap.data.Workspace;
import com.supermap.mapping.Action;
import com.supermap.mapping.Layer;
import com.supermap.mapping.Layers;
import com.supermap.mapping.Map;
import com.supermap.mapping.MapControl;
import com.supermap.mapping.MapView;
import com.supermap.mapping.TrackingLayer;

import java.util.List;

/**
 * SuperMap iMobile 地图能力封装。
 *
 * 【超图集成点 2】加载园区底图：用 {@link EngineType#Rest} 直连 iServer 标准 REST Map。
 * iMobile 把复合地图当作单个预渲染瓦片数据集返回，{@code getDatasets().getCount()==1}，
 * 该层是 LayerSettingImage（栅格瓦片），{@code setStyle} 对栅格层无效，建筑/道路直接以
 * iServer 发布的样式呈现，移动端不再尝试差异化设色（曾尝试 DataDownloadService
 * 下载矢量数据集到本地 UDB 再叠加，但 SDK services 包依赖废弃的 Apache HttpClient，
 * 且 UDB 写入触发 iMobile 原生库崩溃，方案已废弃，详见超图集成记录第十一、十二章）。
 *
 * 【超图集成点 3】业务点位叠加：用 {@link TrackingLayer} 叠加动态点位，无需建数据集。
 * tag 格式 "task:{id}" / "car:{carId}" / "navigation:*"，{@link #clearTag} 增量刷新。
 *
 * 坐标系：iServer REST Map 返回 prjCoordSys.epsgCode=-1000（PCS_NON_EARTH 平面非地球米制），
 * task.x/y 与 patrol_car.x/y 同坐标系，直接打点零换算。UI 显示经纬度由 CoordTransform 反算。
 *
 * 线程模型：数据源打开是网络 IO 放工作线程；图层添加/范围设置/刷新必须回主线程
 * （iMobile 的 Map/MapControl 与 GL 线程绑定，跨线程改 map 状态不触发重绘）。
 */
public class SuperMapHelper {
    private static final String TAG = "SuperMapHelper";

    /** iServer REST 地图数据源别名。 */
    private static final String DS_ALIAS = "parkMap";

    private final MapView mapView;
    private final MapControl mapControl;
    private final AppConfig config;
    private final Context context;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private Workspace workspace;
    private Datasource restDatasource;
    private volatile boolean loaded;

    public SuperMapHelper(Context context, MapView mapView) {
        this.context = context;
        this.mapView = mapView;
        this.mapControl = mapView.getMapControl();
        this.config = AppConfig.get(context);
    }

    /** 加载结果回调：成功后地图可交互，失败时 Activity 展示重试浮层。 */
    public interface OnLoadListener {
        void onLoaded();

        void onFailed(String reason);
    }

    /**
     * 加载园区在线底图 + 中国底图（ChinaLight）背景。
     * 先打开园区 REST Map，再在主线程叠加 ChinaLight 底图到最底层。
     * 中国底图加载失败时静默降级，不影响园区地图显示。
     */
    public void loadParkMap(OnLoadListener listener) {
        releasePriorResources();
        workspace = new Workspace();
        mapControl.getMap().setWorkspace(workspace);
        new Thread(() -> {
            try {
                restDatasource = openRestMapDatasource();
                if (restDatasource == null) {
                    notifyFailed(listener, "iServer 地图服务打开失败");
                    return;
                }
                int datasetCount = restDatasource.getDatasets().getCount();
                Log.i(TAG, "iServer REST 地图服务就绪，数据集数=" + datasetCount);

                // 在工作线程中尝试打开中国底图
                Datasource basemapDs = openBasemapDatasource();

                addRestMapLayersOnMain(listener, datasetCount, basemapDs);
            } catch (Exception e) {
                Log.e(TAG, "加载地图失败", e);
                notifyFailed(listener, e.getMessage());
            }
        }).start();
    }

    /** 打开中国底图 ChinaLight 数据源（EPSG:3857 Web Mercator），支持动态投影。 */
    private Datasource openBasemapDatasource() {
        String basemapUrl = config.getBasemapUrl();
        String basemapLayer = config.getBasemapLayer();
        if (basemapUrl == null || basemapUrl.isEmpty() || basemapLayer == null) {
            return null;
        }
        try {
            // ChinaLight 的 REST 地图服务 URL
            String restMapUrl = config.getIServerBaseUrl()
                    + "/services/map-china/rest/maps/" + basemapLayer;
            DatasourceConnectionInfo info = new DatasourceConnectionInfo();
            info.setEngineType(EngineType.Rest);
            info.setServer(restMapUrl);
            info.setAlias("chinaLight");
            Datasource ds = workspace.getDatasources().open(info);
            if (ds != null && ds.getDatasets().getCount() > 0) {
                Log.i(TAG, "中国底图 ChinaLight 数据源就绪，支持动态投影");
                return ds;
            }
        } catch (Exception e) {
            Log.w(TAG, "中国底图数据源打开失败（坐标系不兼容或服务不可达），不影响园区地图", e);
        }
        return null;
    }

    /** 以 EngineType.Rest 直连 iServer 标准 REST Map；不配置代理，使用设备直连网络。 */
    private Datasource openRestMapDatasource() {
        DatasourceConnectionInfo info = new DatasourceConnectionInfo();
        info.setEngineType(EngineType.Rest);
        info.setServer(config.getMapUrl());
        info.setAlias(DS_ALIAS);
        return workspace.getDatasources().open(info);
    }

    /** 主线程叠加 REST 地图数据集并完成初始视图。 */
    private void addRestMapLayersOnMain(OnLoadListener listener, int datasetCount, Datasource basemapDs) {
        mainHandler.post(() -> {
            try {
                if (datasetCount <= 0) {
                    notifyFailed(listener, "iServer 地图服务未返回可渲染图层");
                    return;
                }
                Map map = mapControl.getMap();

                // 0. 设置地图背景色为柔和的蓝灰色（取代默认白色）
                GeoStyle bgStyle = new GeoStyle();
                bgStyle.setFillForeColor(new Color(235, 242, 250));
                map.setBackgroundStyle(bgStyle);
                map.setPaintBackground(true);

                // 1. 先添加园区矢量底图
                for (int i = 0; i < datasetCount; i++) {
                    map.getLayers().add(restDatasource.getDatasets().get(i), true);
                }

                // 2. 尝试插入中国底图到最底层（索引 0）
                //    ChinaLight 支持动态投影（PCS_ALL），理论上可投影到 PCS_NON_EARTH
                if (basemapDs != null && basemapDs.getDatasets().getCount() > 0) {
                    try {
                        Layer basemapLayer = map.getLayers().insert(0, basemapDs.getDatasets().get(0));
                        if (basemapLayer != null) {
                            basemapLayer.setCaption("中国底图");
                            // 设置底图为半透明，让园区矢量数据更清晰
                            basemapLayer.setOpaqueRate(70);
                            Log.i(TAG, "中国底图 ChinaLight 已插入到最底层，透明度 70%");
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "中国底图图层插入失败（坐标系不兼容），跳过", e);
                    }
                }

                map.viewEntire();
                map.refresh();
                loaded = true;
                if (listener != null) {
                    listener.onLoaded();
                }
            } catch (Exception e) {
                Log.e(TAG, "添加 iServer REST 图层失败", e);
                notifyFailed(listener, e.getMessage());
            }
        });
    }

    // ===== 地图状态查询 =====

    /** 地图中心点（米制投影坐标），未加载返回 null。 */
    public Point2D getMapCenter() {
        if (!loaded) {
            return null;
        }
        try {
            return mapControl.getMap().getCenter();
        } catch (Exception e) {
            Log.w(TAG, "getMapCenter 失败", e);
            return null;
        }
    }

    /** 当前地图比例尺分母（如 1000 表示 1:1000），未加载返回 0。 */
    public double getMapScale() {
        if (!loaded) {
            return 0;
        }
        try {
            return mapControl.getMap().getScale();
        } catch (Exception e) {
            Log.w(TAG, "getMapScale 失败", e);
            return 0;
        }
    }

    /** 触发地图刷新（Activity 交互后调用）。 */
    public void refresh() {
        if (!loaded) {
            return;
        }
        try {
            mapControl.getMap().refresh();
        } catch (Exception e) {
            Log.w(TAG, "refresh 失败", e);
        }
    }

    /** 重试场景：先清理上一轮的 workspace 与图层，避免内存泄漏和图层残留。 */
    private void releasePriorResources() {
        try {
            if (mapControl != null && mapControl.getMap() != null) {
                mapControl.getMap().close();
            }
            if (workspace != null) {
                workspace.dispose();
                workspace = null;
            }
        } catch (Exception e) {
            Log.w(TAG, "释放旧地图资源异常", e);
        }
        loaded = false;
    }

    private void notifyFailed(OnLoadListener listener, String reason) {
        loaded = false;
        mainHandler.post(() -> {
            if (listener != null) {
                listener.onFailed(reason);
            }
        });
    }

    public boolean isLoaded() {
        return loaded;
    }

    // ===== 业务点位叠加（TrackingLayer） =====

    /**
     * 【超图集成点 3】事故/任务点叠加：用 TrackingLayer 叠加动态点位，无需建数据集。
     * 使用自定义的复合样式：GeoStyle 加文字标签，搭配 callout 弹窗信息。
     * tag 格式 "task:{id}"，供后续点击拾取跳转详情。
     */
    public void addTaskMarkers(List<TaskVO> tasks) {
        if (!loaded) {
            return;
        }
        try {
            TrackingLayer layer = mapControl.getMap().getTrackingLayer();
            clearTag(layer, "task:");
            if (tasks == null) {
                mapControl.getMap().refresh();
                return;
            }
            for (TaskVO task : tasks) {
                if (task.getX() == null || task.getY() == null) {
                    continue;
                }
                Point2D pt = new Point2D(task.getX(), task.getY());
                GeoPoint point = new GeoPoint(pt);
                point.setStyle(taskStyle(task.getStatus()));
                layer.add(point, "task:" + task.getId());

                // 添加文字标签：事故类型缩写
                addTextLabel(layer, pt, taskLabel(task), task.getStatus());
            }
            mapControl.getMap().refresh();
        } catch (Exception e) {
            Log.w(TAG, "叠加任务点位失败", e);
        }
    }

    /**
     * 【超图集成点 4】巡检车点叠加：warning=1 红色异常、正常绿色。
     * 使用立体感图标（大尺寸 + 光晕背景），带车牌号标签。
     * tag 格式 "car:{carId}"，刷新后异常解除车色自动恢复。
     */
    public void addCarMarkers(List<CarVO> cars) {
        if (!loaded) {
            return;
        }
        try {
            TrackingLayer layer = mapControl.getMap().getTrackingLayer();
            clearTag(layer, "car:");
            if (cars == null) {
                mapControl.getMap().refresh();
                return;
            }
            for (CarVO car : cars) {
                if (car.getX() == null || car.getY() == null) {
                    continue;
                }
                Point2D pt = new Point2D(car.getX().doubleValue(), car.getY().doubleValue());
                GeoPoint point = new GeoPoint(pt);
                point.setStyle(car.isWarning() ? warningStyle() : normalStyle());
                layer.add(point, "car:" + car.getCarId());

                // 车牌号标签
                addTextLabel(layer, pt, "车" + car.getCarId(), car.isWarning() ? "processing" : "completed");
            }
            mapControl.getMap().refresh();
        } catch (Exception e) {
            Log.w(TAG, "叠加巡检车点位失败", e);
        }
    }

    /**
     * 在 iMobile TrackingLayer 叠加一条现场引导线、当前位置和任务目标点。
     *
     * <p>路线基于 iServer 已加载的园区坐标系绘制，不会出现 WGS84 与园区米制坐标错位。
     * 当前版本提供可靠的目标引导；后续只需替换本方法的中间点，即可接入已发布的网络分析服务。</p>
     */
    public RouteGuidance.Summary showGuidanceRoute(Point2D start, Point2D destination) {
        if (!loaded || start == null || destination == null) {
            return null;
        }
        try {
            TrackingLayer layer = mapControl.getMap().getTrackingLayer();
            clearTag(layer, "navigation:");

            Point2Ds routePoints = new Point2Ds();
            routePoints.add(start);
            routePoints.add(destination);
            GeoLine routeLine = new GeoLine(routePoints);
            GeoStyle routeStyle = new GeoStyle();
            routeStyle.setLineColor(new Color(0, 102, 204));
            routeStyle.setLineWidth(4.0);
            routeLine.setStyle(routeStyle);
            layer.add(routeLine, "navigation:route");

            GeoPoint currentPoint = new GeoPoint(start);
            currentPoint.setStyle(navigationPointStyle(new Color(0, 102, 204), 11));
            layer.add(currentPoint, "navigation:current");

            GeoPoint destinationPoint = new GeoPoint(destination);
            destinationPoint.setStyle(navigationPointStyle(new Color(52, 199, 89), 13));
            layer.add(destinationPoint, "navigation:destination");

            RouteGuidance.Summary summary = RouteGuidance.summarize(
                    start.getX(), start.getY(), destination.getX(), destination.getY());
            Map map = mapControl.getMap();
            map.setCenter(new Point2D(summary.getCenterX(), summary.getCenterY()));
            map.setScale(recommendedNavigationScale(summary.getDistanceMeters()));
            map.refresh();
            return summary;
        } catch (Exception e) {
            Log.w(TAG, "绘制导航引导线失败", e);
            return null;
        }
    }

    /** 清除当前导航引导图形，保留事故、巡检车及基础图层。 */
    public void clearGuidanceRoute() {
        if (!loaded) {
            return;
        }
        try {
            TrackingLayer layer = mapControl.getMap().getTrackingLayer();
            clearTag(layer, "navigation:");
            mapControl.getMap().refresh();
        } catch (Exception e) {
            Log.w(TAG, "清除导航引导线失败", e);
        }
    }

    private GeoStyle navigationPointStyle(Color color, int size) {
        GeoStyle style = basePointStyle();
        style.setMarkerSize(new Size2D(size, size));
        style.setFillForeColor(color);
        return style;
    }

    private double recommendedNavigationScale(double distanceMeters) {
        return Math.max(500.0, Math.min(4500.0, distanceMeters * 2.5));
    }

    /** 清掉 TrackingLayer 中指定前缀的 tag 点位，避免叠加重复。 */
    private void clearTag(TrackingLayer layer, String prefix) {
        for (int i = layer.getCount() - 1; i >= 0; i--) {
            String tag = layer.getTag(i);
            if (tag != null && tag.startsWith(prefix)) {
                layer.remove(i);
            }
        }
    }

    private GeoStyle taskStyle(String status) {
        GeoStyle style = basePointStyle();
        style.setFillForeColor(colorForStatus(status));
        return style;
    }

    private GeoStyle warningStyle() {
        GeoStyle style = basePointStyle();
        // 玫红橙 #D70036，替代大红色（苹果风格降饱和危险色）
        style.setFillForeColor(new Color(215, 0, 54));
        return style;
    }

    private GeoStyle normalStyle() {
        GeoStyle style = basePointStyle();
        // 苹果绿 #34C759
        style.setFillForeColor(new Color(52, 199, 89));
        return style;
    }

    private GeoStyle basePointStyle() {
        GeoStyle style = new GeoStyle();
        style.setMarkerSize(new Size2D(14, 14));
        // 351 是 iMobile 内置圆点符号，配合 FillForeColor 实现彩色点位
        style.setMarkerSymbolID(351);
        style.setFillOpaqueRate(100);
        // 加白色描边，让点位更醒目
        style.setLineColor(new Color(255, 255, 255));
        style.setLineWidth(2.0);
        return style;
    }

    /** 事故点位的文字标签（气体类型缩写） */
    private String taskLabel(TaskVO task) {
        String gas = task.getGasType();
        if (gas == null) {
            return "事故";
        }
        if (gas.contains("H2S") || gas.contains("硫化氢")) return "H₂S";
        if (gas.contains("CH4") || gas.contains("甲烷")) return "CH₄";
        if (gas.contains("CO") || gas.contains("一氧化碳")) return "CO";
        if (gas.contains("NH3") || gas.contains("氨")) return "NH₃";
        if (gas.contains("Cl") || gas.contains("氯")) return "Cl₂";
        if (gas.contains("H2") || gas.contains("氢气") || gas.contains("氢")) return "H₂";
        if (gas.contains("SO2") || gas.contains("二氧化硫")) return "SO₂";
        if (gas.contains("可燃") || gas.contains("LEL")) return "可燃";
        return gas.length() > 4 ? gas.substring(0, 4) : gas;
    }

    /** 在 TrackingLayer 上添加文字标签，紧贴点位上方，根据状态配色。 */
    private void addTextLabel(TrackingLayer layer, Point2D position, String text, String status) {
        try {
            if (text == null || text.isEmpty()) return;
            // 使用 GeoText 渲染文字标签，每个标签仅包含一个 TextPart
            TextPart part = new TextPart();
            part.setText(text);
            // 在点位上方偏移显示
            part.setAnchorPoint(new Point2D(position.getX(), position.getY() + 6.0));

            GeoText geoText = new GeoText();
            geoText.addPart(part);

            GeoStyle textStyle = new GeoStyle();
            textStyle.setMarkerSize(new Size2D(0, 0));
            textStyle.setMarkerSymbolID(0);
            // 设置文字背景色（与状态色一致，半透明）
            Color bgColor = colorForStatus(status);
            textStyle.setFillForeColor(new Color(bgColor.getR(), bgColor.getG(), bgColor.getB(), 200));
            geoText.setStyle(textStyle);
            layer.add(geoText, "label:" + text);
        } catch (Exception e) {
            // 标签为辅助信息，静默失败不影响主点位
            Log.w(TAG, "添加文字标签失败", e);
        }
    }

    private Color colorForStatus(String status) {
        if (status == null) {
            return new Color(0, 113, 227);
        }
        switch (status) {
            case "processing": return new Color(215, 0, 54);      // 玫红橙 处置中
            case "assigned": return new Color(255, 149, 0);       // 苹果橙 已指派
            case "pending_review": return new Color(251, 192, 45); // 黄 待验收
            case "completed": return new Color(52, 199, 89);      // 苹果绿 已完成
            case "canceled": return new Color(110, 110, 115);     // 苹果灰 已取消
            default: return new Color(0, 113, 227);               // 沉稳蓝 待指派
        }
    }

    /** 释放 iMobile 资源，顺序对齐官方示例：map.close → workspace.dispose → mapControl.dispose。 */
    public void dispose() {
        try {
            if (mapControl != null && mapControl.getMap() != null) {
                mapControl.getMap().close();
            }
            if (workspace != null) {
                workspace.dispose();
                workspace = null;
            }
            if (mapControl != null) {
                mapControl.dispose();
            }
        } catch (Exception e) {
            Log.e(TAG, "释放地图资源异常", e);
        }
        loaded = false;
    }
}

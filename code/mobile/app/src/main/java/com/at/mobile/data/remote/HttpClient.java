package com.at.mobile.data.remote;

import android.content.Context;
import android.util.Log;

import com.at.mobile.data.local.AppConfig;
import com.at.mobile.data.local.SessionManager;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * 网络层单例：Retrofit + OkHttp。
 * baseUrl 从 AppConfig 读取（assets/config.properties）。
 * OkHttp 复用 iMobile SDK 自带的 4.12.0，无需额外引 okhttp 依赖。
 *
 * <p>超时策略：连接 15s / 读 30s / 写 30s（打卡照片上传兜底）。
 * 失败重试：{@code retryOnConnectionFailure(true)} 对网络抖动自动重试一次。
 * 401 处理由 {@link ApiCallback} 拆包后统一清会话，Activity 层判断 isUnauthorized 跳登录。</p>
 */
public class HttpClient {
    private static final String TAG = "HttpClient";
    private static final Object LOCK = new Object();
    private static volatile HttpClient instance;

    private final Retrofit retrofit;
    private final ApiService apiService;
    private final SessionManager session;
    private final AppConfig config;
    private final Context appContext;

    private HttpClient(Context ctx) {
        appContext = ctx.getApplicationContext();
        config = AppConfig.get(ctx);
        session = SessionManager.get(ctx);

        HttpLoggingInterceptor logging = new HttpLoggingInterceptor(m -> Log.d(TAG, m));
        logging.setLevel(config.isDebugLog()
                ? HttpLoggingInterceptor.Level.HEADERS
                : HttpLoggingInterceptor.Level.NONE);

        OkHttpClient okHttp = new OkHttpClient.Builder()
                .connectTimeout(config.getConnectTimeout(), TimeUnit.MILLISECONDS)
                .readTimeout(config.getReadTimeout(), TimeUnit.MILLISECONDS)
                .writeTimeout(config.getReadTimeout(), TimeUnit.MILLISECONDS)
                .retryOnConnectionFailure(true)
                .addInterceptor(new TokenInterceptor(session))
                .addInterceptor(logging)
                .build();

        Gson gson = new GsonBuilder().create();

        retrofit = new Retrofit.Builder()
                .baseUrl(config.getBackendBaseUrl())
                .client(okHttp)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();

        apiService = retrofit.create(ApiService.class);
    }

    public static HttpClient get(Context ctx) {
        if (instance == null) {
            synchronized (LOCK) {
                if (instance == null) {
                    instance = new HttpClient(ctx.getApplicationContext());
                }
            }
        }
        return instance;
    }

    /** 服务端地址变更后重置单例，下次 get 重建 Retrofit。同步块防止重置时有正在飞的请求拿到半成品。 */
    public static void resetInstance() {
        synchronized (LOCK) {
            instance = null;
        }
    }

    public ApiService api() {
        return apiService;
    }

    public SessionManager session() {
        return session;
    }

    public AppConfig config() {
        return config;
    }

    public Context context() {
        return appContext;
    }
}

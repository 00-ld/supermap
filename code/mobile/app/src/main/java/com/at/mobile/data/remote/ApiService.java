package com.at.mobile.data.remote;

import com.at.mobile.data.remote.dto.ApiResult;
import com.at.mobile.data.remote.dto.CarVO;
import com.at.mobile.data.remote.dto.EmployeeVO;
import com.at.mobile.data.remote.dto.IntIdRequest;
import com.at.mobile.data.remote.dto.LoginRequest;
import com.at.mobile.data.remote.dto.TaskAssignRequest;
import com.at.mobile.data.remote.dto.TaskCreateRequest;
import com.at.mobile.data.remote.dto.TaskReviewRequest;
import com.at.mobile.data.remote.dto.TaskVO;
import com.at.mobile.data.remote.dto.WarningVO;

import java.util.List;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.Path;
import retrofit2.http.Query;

/**
 * 后端 API 接口定义。
 * 鉴权：Header token 由 TokenInterceptor 注入；写操作后端用 @RequiresRole("admin") 拦截。
 */
public interface ApiService {

    /** 登录，返回 JWT token（data 是裸 token 字符串） */
    @POST("api/auth/login")
    Call<ApiResult<String>> login(@Body LoginRequest body);

    /** 全部巡检车（含 warning 状态） */
    @GET("api/car/getAllCars")
    Call<ApiResult<List<CarVO>>> getAllCars();

    /** 告警历史（事故列表入口） */
    @GET("api/history/list")
    Call<ApiResult<List<WarningVO>>> listWarnings();

    /** 员工列表（指派选人用） */
    @GET("api/employee/list")
    Call<ApiResult<List<EmployeeVO>>> listEmployees();

    /** 任务列表，status 可空查全部 */
    @GET("api/task/list")
    Call<ApiResult<List<TaskVO>>> listTasks(@Query("status") String status);

    /** 任务详情 */
    @GET("api/task/{id}")
    Call<ApiResult<TaskVO>> getTask(@Path("id") long id);

    /** 创建任务（admin） */
    @POST("api/task")
    Call<ApiResult<TaskVO>> createTask(@Body TaskCreateRequest body);

    /** 指派（admin） */
    @POST("api/task/assign")
    Call<ApiResult<TaskVO>> assignTask(@Body TaskAssignRequest body);

    /** 接单（登录即可） */
    @POST("api/task/accept")
    Call<ApiResult<TaskVO>> acceptTask(@Body IntIdRequest body);

    /** 打卡（登录即可，multipart：表单字段 + 照片） */
    @Multipart
    @POST("api/task/checkin")
    Call<ApiResult<TaskVO>> checkin(@Part("taskId") RequestBody taskId,
                                   @Part("checkinX") RequestBody checkinX,
                                   @Part("checkinY") RequestBody checkinY,
                                   @Part("checkinRemark") RequestBody checkinRemark,
                                   @Part MultipartBody.Part photo);

    /** 验收（admin） */
    @POST("api/task/review")
    Call<ApiResult<TaskVO>> reviewTask(@Body TaskReviewRequest body);

    /** 取消（admin） */
    @POST("api/task/cancel")
    Call<ApiResult<Void>> cancelTask(@Body IntIdRequest body);

    /** 我的任务 */
    @GET("api/task/my")
    Call<ApiResult<List<TaskVO>>> myTasks(@Query("assigneeType") String assigneeType,
                                          @Query("carId") Integer carId,
                                          @Query("employeeId") Long employeeId);
}

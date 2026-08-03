package com.at.mobile.data.repository;

import android.content.Context;

import com.at.mobile.data.remote.HttpClient;
import com.at.mobile.data.remote.dto.IntIdRequest;
import com.at.mobile.data.remote.dto.TaskAssignRequest;
import com.at.mobile.data.remote.dto.TaskCreateRequest;
import com.at.mobile.data.remote.dto.TaskReviewRequest;
import com.at.mobile.data.remote.dto.TaskVO;

import java.util.List;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

import static com.at.mobile.data.repository.ApiCallbacks.adapt;

/**
 * 任务仓库：封装 ApiService 的 task 域调用，给 Activity 提供简洁回调接口。
 * 照片上传转 MultipartBody.Part（content-type 由 image/jpeg 声明）。
 * 无状态，进程内共享单例，避免每个 Activity 重复 new。
 */
public class TaskRepository {

    private static final MediaType TEXT = MediaType.parse("text/plain");
    private static final MediaType IMAGE_JPEG = MediaType.parse("image/jpeg");
    private static final String DEFAULT_PHOTO_NAME = "checkin.jpg";

    private static volatile TaskRepository instance;

    private final HttpClient client;

    private TaskRepository(HttpClient client) {
        this.client = client;
    }

    public static TaskRepository get(Context ctx) {
        if (instance == null) {
            synchronized (TaskRepository.class) {
                if (instance == null) {
                    instance = new TaskRepository(HttpClient.get(ctx));
                }
            }
        }
        return instance;
    }

    public void listTasks(String status, RepositoryCallback<List<TaskVO>> cb) {
        client.api().listTasks(status).enqueue(adapt(client.context(), cb));
    }

    public void getTask(long id, RepositoryCallback<TaskVO> cb) {
        client.api().getTask(id).enqueue(adapt(client.context(), cb));
    }

    public void createTask(TaskCreateRequest body, RepositoryCallback<TaskVO> cb) {
        client.api().createTask(body).enqueue(adapt(client.context(), cb));
    }

    public void assignTask(TaskAssignRequest body, RepositoryCallback<TaskVO> cb) {
        client.api().assignTask(body).enqueue(adapt(client.context(), cb));
    }

    /** 接单：taskId 用 long 全程传递，避免强转 int 在大 ID 下溢出。 */
    public void acceptTask(long taskId, RepositoryCallback<TaskVO> cb) {
        client.api().acceptTask(new IntIdRequest(taskId)).enqueue(adapt(client.context(), cb));
    }

    /** 取消：同 acceptTask，保持 long。 */
    public void cancelTask(long taskId, RepositoryCallback<Void> cb) {
        client.api().cancelTask(new IntIdRequest(taskId)).enqueue(adapt(client.context(), cb));
    }

    public void reviewTask(TaskReviewRequest body, RepositoryCallback<TaskVO> cb) {
        client.api().reviewTask(body).enqueue(adapt(client.context(), cb));
    }

    public void myTasks(String assigneeType, Integer carId, Long employeeId,
                        RepositoryCallback<List<TaskVO>> cb) {
        client.api().myTasks(assigneeType, carId, employeeId).enqueue(adapt(client.context(), cb));
    }

    /**
     * 现场打卡：multipart 上传 taskId/x/y/remark + 照片。
     * photoBytes 为空时仍发 multipart（后端 photo 可空，照片缺失走降级）。
     */
    public void checkin(long taskId, Double checkinX, Double checkinY,
                        String remark, byte[] photoBytes, String photoFileName,
                        RepositoryCallback<TaskVO> cb) {
        RequestBody taskIdPart = textBody(String.valueOf(taskId));
        RequestBody xPart = textBody(checkinX == null ? "" : String.valueOf(checkinX));
        RequestBody yPart = textBody(checkinY == null ? "" : String.valueOf(checkinY));
        RequestBody remarkPart = textBody(remark == null ? "" : remark);

        MultipartBody.Part photoPart = null;
        if (photoBytes != null && photoBytes.length > 0) {
            RequestBody photoBody = RequestBody.create(photoBytes, IMAGE_JPEG);
            String name = photoFileName == null ? DEFAULT_PHOTO_NAME : photoFileName;
            photoPart = MultipartBody.Part.createFormData("photo", name, photoBody);
        }

        client.api().checkin(taskIdPart, xPart, yPart, remarkPart, photoPart)
                .enqueue(adapt(client.context(), cb));
    }

    private RequestBody textBody(String value) {
        return RequestBody.create(value, TEXT);
    }
}

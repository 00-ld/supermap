package com.at.service;

import com.alibaba.fastjson.JSONObject;
import com.at.mapper.CarMapper;
import com.at.mapper.InspectRecordMapper;
import com.at.pojo.Car;
import com.at.pojo.InspectRecord;
import com.at.pojo.YoloSummary;
import com.at.pojo.dto.InspectRecordResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageAnalysisServiceTest {

    @Mock
    private InspectRecordMapper inspectRecordMapper;

    @Mock
    private CarMapper carMapper;

    private ImageAnalysisService service;

    @BeforeEach
    void setUp() {
        service = new ImageAnalysisService();
        ReflectionTestUtils.setField(service, "inspectRecordMapper", inspectRecordMapper);
        ReflectionTestUtils.setField(service, "carMapper", carMapper);
        ReflectionTestUtils.setField(service, "defaultInspectionLocation", "核心作业区 A7");
    }

    @Test
    void listRecordsReturnsResponseDtosWithoutExposingEntities() {
        LocalDateTime createTime = LocalDateTime.of(2026, 6, 19, 11, 20);
        InspectRecord record = new InspectRecord();
        record.setId(7L);
        record.setCreateTime(createTime);
        record.setPersonCount(3);
        record.setLocation("核心作业区 A7");
        record.setStatus("正常");
        record.setImageBase64(null);
        record.setAnalysisTime(186);
        when(inspectRecordMapper.listAll()).thenReturn(List.of(record));

        List<InspectRecordResponseDTO> body = service.listRecords();

        assertThat(body).containsExactly(new InspectRecordResponseDTO(
                7L,
                createTime,
                3,
                "核心作业区 A7",
                "正常",
                null,
                186
        ));
        verify(inspectRecordMapper).listAll();
    }

    @Test
    void summaryReturnsLatestYoloRecordAndAggregateCounts() {
        LocalDateTime createTime = LocalDateTime.of(2026, 6, 19, 11, 20);
        InspectRecord latest = new InspectRecord();
        latest.setPersonCount(7);
        latest.setAnalysisTime(186);
        latest.setCreateTime(createTime);
        when(inspectRecordMapper.findLatest()).thenReturn(latest);
        when(inspectRecordMapper.countRiskRecords()).thenReturn(3);
        when(carMapper.getAllCars()).thenReturn(List.of(new Car(), new Car(), new Car(), new Car()));

        YoloSummary body = service.summary();

        assertThat(body.getCurrentCount()).isEqualTo(7);
        assertThat(body.getAnalysisTime()).isEqualTo(186);
        assertThat(body.getRiskCount()).isEqualTo(3);
        assertThat(body.getOnlineDevices()).isEqualTo(4);
        assertThat(body.getLastAnalysisTime()).isEqualTo(createTime);
        verify(inspectRecordMapper).findLatest();
        verify(inspectRecordMapper).countRiskRecords();
        verify(carMapper).getAllCars();
    }

    @Test
    void summaryKeepsLatestRecognitionFieldsEmptyWhenNoYoloRecordExists() {
        when(inspectRecordMapper.findLatest()).thenReturn(null);
        when(inspectRecordMapper.countRiskRecords()).thenReturn(0);
        when(carMapper.getAllCars()).thenReturn(List.of(new Car()));

        YoloSummary body = service.summary();

        assertThat(body.getCurrentCount()).isNull();
        assertThat(body.getAnalysisTime()).isNull();
        assertThat(body.getRiskCount()).isZero();
        assertThat(body.getOnlineDevices()).isEqualTo(1);
        assertThat(body.getLastAnalysisTime()).isNull();
    }

    @Test
    void deleteRecordReturnsWhetherMapperDeletedRows() {
        when(inspectRecordMapper.deleteById(7L)).thenReturn(1);
        when(inspectRecordMapper.deleteById(404L)).thenReturn(0);

        assertThat(service.deleteRecord(7L)).isTrue();
        assertThat(service.deleteRecord(404L)).isFalse();
    }

    @Test
    void normalizeAlgorithmResponseUnwrapsSharedEnvelope() {
        JSONObject raw = new JSONObject();
        raw.put("ok", true);
        raw.put("code", 200);
        JSONObject data = new JSONObject();
        data.put("status", "success");
        data.put("count", 3);
        raw.put("data", data);

        JSONObject body = service.normalizeAlgorithmResponse(raw);

        assertThat(body.getString("status")).isEqualTo("success");
        assertThat(body.getInteger("count")).isEqualTo(3);
    }

    @Test
    void normalizeAlgorithmResponseRejectsLegacyBarePayload() {
        JSONObject raw = new JSONObject();
        raw.put("status", "success");
        raw.put("count", 2);

        assertThatThrownBy(() -> service.normalizeAlgorithmResponse(raw))
                .isInstanceOf(ImageAnalysisException.class)
                .hasMessage("算法服务响应缺少统一信封")
                .extracting("code")
                .isEqualTo(500);
    }

    @Test
    void normalizeAlgorithmResponseRejectsFailedEnvelope() {
        JSONObject raw = new JSONObject();
        raw.put("ok", false);
        raw.put("code", 503);
        raw.put("message", "YOLO 服务未配置密钥，拒绝服务");
        raw.put("data", null);

        assertThatThrownBy(() -> service.normalizeAlgorithmResponse(raw))
                .isInstanceOf(ImageAnalysisException.class)
                .hasMessage("YOLO 服务未配置密钥，拒绝服务")
                .extracting("code")
                .isEqualTo(503);
    }

    @Test
    void saveInspectRecordOnlyPersistsSuccessfulAnalysis() {
        JSONObject payload = new JSONObject();
        payload.put("status", "success");
        payload.put("count", 6);
        payload.put("image_base64", "base64-image");
        payload.put("processing_time_ms", 188);
        when(inspectRecordMapper.insert(org.mockito.ArgumentMatchers.any())).thenReturn(1);

        service.saveInspectRecordIfNeeded(payload);

        ArgumentCaptor<InspectRecord> captor = ArgumentCaptor.forClass(InspectRecord.class);
        verify(inspectRecordMapper).insert(captor.capture());
        InspectRecord record = captor.getValue();
        assertThat(record.getPersonCount()).isEqualTo(6);
        assertThat(record.getLocation()).isEqualTo("核心作业区 A7");
        assertThat(record.getStatus()).isEqualTo("异常");
        assertThat(record.getImageBase64()).isEqualTo("base64-image");
        assertThat(record.getAnalysisTime()).isEqualTo(188);
        assertThat(record.getCreateTime()).isNotNull();
    }

    @Test
    void saveInspectRecordIgnoresFailedAnalysisPayload() {
        JSONObject payload = new JSONObject();
        payload.put("status", "failed");
        payload.put("count", 9);

        service.saveInspectRecordIfNeeded(payload);

        verify(inspectRecordMapper, never()).insert(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void saveInspectRecordWrapsMapperFailure() {
        JSONObject payload = new JSONObject();
        payload.put("status", "success");
        payload.put("count", 2);
        when(inspectRecordMapper.insert(org.mockito.ArgumentMatchers.any())).thenThrow(new RuntimeException("db down"));

        assertThatThrownBy(() -> service.saveInspectRecordIfNeeded(payload))
                .isInstanceOf(ImageAnalysisException.class)
                .hasMessage("巡检记录保存失败")
                .extracting("code")
                .isEqualTo(500);
    }

    @Test
    void saveInspectRecordRejectsZeroInsertedRows() {
        JSONObject payload = new JSONObject();
        payload.put("status", "success");
        payload.put("count", 2);
        when(inspectRecordMapper.insert(org.mockito.ArgumentMatchers.any())).thenReturn(0);

        assertThatThrownBy(() -> service.saveInspectRecordIfNeeded(payload))
                .isInstanceOf(ImageAnalysisException.class)
                .hasMessage("巡检记录保存失败")
                .extracting("code")
                .isEqualTo(500);
    }
}

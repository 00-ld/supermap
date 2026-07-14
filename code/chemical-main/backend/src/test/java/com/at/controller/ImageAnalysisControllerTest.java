package com.at.controller;

import com.alibaba.fastjson.JSONObject;
import com.at.pojo.Result;
import com.at.pojo.YoloSummary;
import com.at.pojo.dto.InspectRecordResponseDTO;
import com.at.service.ImageAnalysisException;
import com.at.service.ImageAnalysisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageAnalysisControllerTest {

    @Mock
    private ImageAnalysisService imageAnalysisService;

    private ImageAnalysisController controller;

    @BeforeEach
    void setUp() {
        controller = new ImageAnalysisController();
        ReflectionTestUtils.setField(controller, "imageAnalysisService", imageAnalysisService);
    }

    @Test
    void analyzePersonReturnsServicePayload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "patrol.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3}
        );
        JSONObject payload = new JSONObject();
        payload.put("status", "success");
        payload.put("count", 3);
        when(imageAnalysisService.analyzePerson(file)).thenReturn(payload);

        Result<?> body = controller.analyzePerson(file);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isSameAs(payload);
        verify(imageAnalysisService).analyzePerson(file);
    }

    @Test
    void analyzePersonMapsServiceExceptionToResult() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "patrol.gif",
                "image/gif",
                new byte[]{1, 2, 3}
        );
        when(imageAnalysisService.analyzePerson(file))
                .thenThrow(new ImageAnalysisException(400, "仅支持 JPG/PNG 图片"));

        Result<?> body = controller.analyzePerson(file);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(400);
        assertThat(body.getMessage()).isEqualTo("仅支持 JPG/PNG 图片");
    }

    @Test
    void getListDelegatesToService() {
        LocalDateTime createTime = LocalDateTime.of(2026, 6, 19, 11, 20);
        InspectRecordResponseDTO dto = new InspectRecordResponseDTO(
                7L,
                createTime,
                3,
                "核心作业区 A7",
                "正常",
                null,
                186
        );
        when(imageAnalysisService.listRecords()).thenReturn(List.of(dto));

        Result<List<InspectRecordResponseDTO>> body = controller.getList();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(dto);
        verify(imageAnalysisService).listRecords();
    }

    @Test
    void summaryDelegatesToService() {
        LocalDateTime createTime = LocalDateTime.of(2026, 6, 19, 11, 20);
        YoloSummary summary = new YoloSummary(7, 186, 3, 4, createTime);
        when(imageAnalysisService.summary()).thenReturn(summary);

        Result<YoloSummary> body = controller.getSummary();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData().getCurrentCount()).isEqualTo(7);
        assertThat(body.getData().getAnalysisTime()).isEqualTo(186);
        assertThat(body.getData().getRiskCount()).isEqualTo(3);
        assertThat(body.getData().getOnlineDevices()).isEqualTo(4);
        assertThat(body.getData().getLastAnalysisTime()).isEqualTo(createTime);
        verify(imageAnalysisService).summary();
    }

    @Test
    void deleteReturnsNotFoundWhenRecordDoesNotExist() {
        when(imageAnalysisService.deleteRecord(404L)).thenReturn(false);

        Result<?> body = controller.delete(404L);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getCode()).isEqualTo(404);
        assertThat(body.getMessage()).isEqualTo("巡检记录不存在");
        verify(imageAnalysisService).deleteRecord(404L);
    }

    @Test
    void deleteReturnsOkWhenRecordWasDeleted() {
        when(imageAnalysisService.deleteRecord(7L)).thenReturn(true);

        Result<?> body = controller.delete(7L);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("删除成功");
        verify(imageAnalysisService).deleteRecord(7L);
    }
}

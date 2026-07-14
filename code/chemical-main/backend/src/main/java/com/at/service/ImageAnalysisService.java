package com.at.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.at.context.RequestContext;
import com.at.mapper.CarMapper;
import com.at.mapper.InspectRecordMapper;
import com.at.pojo.InspectRecord;
import com.at.pojo.YoloSummary;
import com.at.pojo.dto.InspectRecordResponseDTO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class ImageAnalysisService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/jpg");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");

    @Resource
    private InspectRecordMapper inspectRecordMapper;

    @Resource
    private CarMapper carMapper;

    @Value("${analysis.service.url:}")
    private String analysisServiceUrl;

    @Value("${algorithm.api-key:}")
    private String algorithmApiKey;

    @Value("${inspection.default-location:核心作业区 A7}")
    private String defaultInspectionLocation;

    public JSONObject analyzePerson(MultipartFile file) {
        String filename = validateFile(file);

        try {
            long startedAt = System.currentTimeMillis();
            String algorithmResult = requestAlgorithmService(file, filename);
            int analysisTimeMs = (int) Math.max(0, System.currentTimeMillis() - startedAt);
            JSONObject analysisData = normalizeAlgorithmResponse(JSONObject.parseObject(algorithmResult));
            analysisData.putIfAbsent("analysisTime", analysisTimeMs);
            saveInspectRecordIfNeeded(analysisData);
            log.info("人员分析请求完成，文件名：{}", filename);
            return analysisData;
        } catch (ImageAnalysisException exception) {
            throw exception;
        } catch (IOException exception) {
            log.error("文件读取失败：{}", filename, exception);
            throw new ImageAnalysisException(500, "文件读取失败", exception);
        } catch (RestClientException exception) {
            log.error("算法服务异常", exception);
            throw new ImageAnalysisException(500, "算法服务异常", exception);
        } catch (Exception exception) {
            log.error("算法服务异常", exception);
            throw new ImageAnalysisException(500, "算法服务异常", exception);
        }
    }

    public List<InspectRecordResponseDTO> listRecords() {
        return inspectRecordMapper.listAll()
                .stream()
                .map(InspectRecordResponseDTO::fromEntity)
                .toList();
    }

    public YoloSummary summary() {
        InspectRecord latestRecord = inspectRecordMapper.findLatest();
        Integer currentCount = latestRecord == null ? null : latestRecord.getPersonCount();
        Integer analysisTime = latestRecord == null ? null : latestRecord.getAnalysisTime();
        Integer riskCount = inspectRecordMapper.countRiskRecords();
        Integer onlineDevices = carMapper.getAllCars().size();
        LocalDateTime lastAnalysisTime = latestRecord == null ? null : latestRecord.getCreateTime();

        return new YoloSummary(
                currentCount,
                analysisTime,
                riskCount,
                onlineDevices,
                lastAnalysisTime
        );
    }

    public boolean deleteRecord(Long id) {
        return inspectRecordMapper.deleteById(id) > 0;
    }

    String validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ImageAnalysisException(400, "未上传文件");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ImageAnalysisException(413, "文件过大，最大支持 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ImageAnalysisException(400, "仅支持 JPG/PNG 图片");
        }

        String filename = normalizeFilename(file.getOriginalFilename());
        if (!hasAllowedExtension(filename)) {
            throw new ImageAnalysisException(400, "文件扩展名不合法");
        }
        return filename;
    }

    JSONObject normalizeAlgorithmResponse(JSONObject rawResponse) {
        if (rawResponse == null) {
            throw new ImageAnalysisException(500, "算法服务响应为空");
        }

        boolean looksLikeEnvelope = rawResponse.containsKey("data")
                && (rawResponse.containsKey("ok")
                || rawResponse.containsKey("code"));
        if (!looksLikeEnvelope) {
            throw new ImageAnalysisException(500, "算法服务响应缺少统一信封");
        }

        Boolean ok = rawResponse.getBoolean("ok");
        Integer code = rawResponse.getInteger("code");
        if (Boolean.FALSE.equals(ok) || (code != null && code >= 400)) {
            String message = rawResponse.getString("message");
            int statusCode = code != null && code >= 400 ? code : 500;
            throw new ImageAnalysisException(statusCode, message == null || message.isBlank() ? "算法服务返回失败" : message);
        }

        Object data = rawResponse.get("data");
        if (data == null) {
            throw new ImageAnalysisException(500, "算法服务响应缺少 data");
        }
        if (data instanceof JSONObject jsonObject) {
            return jsonObject;
        }
        return JSON.parseObject(JSON.toJSONString(data));
    }

    void saveInspectRecordIfNeeded(JSONObject analysisData) {
        if (analysisData == null) {
            return;
        }
        if (!"success".equals(analysisData.getString("status"))) {
            return;
        }

        try {
            Integer personCount = analysisData.getInteger("count");
            InspectRecord record = new InspectRecord();
            record.setCreateTime(LocalDateTime.now());
            record.setPersonCount(personCount);
            record.setLocation(defaultInspectionLocation);
            record.setStatus(personCount != null && personCount > 5 ? "异常" : "正常");
            record.setImageBase64(analysisData.getString("image_base64"));
            record.setAnalysisTime(readAnalysisTime(analysisData));
            int rows = inspectRecordMapper.insert(record);
            if (rows <= 0) {
                throw new IllegalStateException("巡检记录写入影响行数为 0");
            }
            log.info("巡检记录已保存，人数：{}, affectedRows={}", personCount, rows);
        } catch (Exception exception) {
            throw new ImageAnalysisException(500, "巡检记录保存失败", exception);
        }
    }

    private String requestAlgorithmService(MultipartFile file, String filename) throws IOException {
        if (analysisServiceUrl == null || analysisServiceUrl.isBlank()) {
            throw new ImageAnalysisException(503, "人员识别服务未配置");
        }

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(60000);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Request-Id", RequestContext.requestIdForResponse());
        if (algorithmApiKey != null && !algorithmApiKey.isEmpty()) {
            headers.set("X-API-Key", algorithmApiKey);
        }

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        RestTemplate restTemplate = new RestTemplate(factory);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        return restTemplate.postForObject(analysisServiceUrl, requestEntity, String.class);
    }

    private String normalizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "upload";
        }
        return originalFilename
                .replaceAll(".*[\\\\/]", "")
                .replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private boolean hasAllowedExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        String extension = dotIndex >= 0 ? filename.substring(dotIndex + 1).toLowerCase() : "";
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    private Integer readAnalysisTime(JSONObject analysisData) {
        Integer analysisTime = analysisData.getInteger("analysisTime");
        if (analysisTime == null) {
            analysisTime = analysisData.getInteger("analysis_time");
        }
        if (analysisTime == null) {
            analysisTime = analysisData.getInteger("processing_time_ms");
        }
        return analysisTime == null ? 0 : Math.max(0, analysisTime);
    }
}

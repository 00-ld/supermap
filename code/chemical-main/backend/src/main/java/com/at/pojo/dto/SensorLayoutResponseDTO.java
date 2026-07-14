package com.at.pojo.dto;

import java.util.List;

public record SensorLayoutResponseDTO(
        SensorLayoutSummaryResponseDTO layout,
        List<SensorLayoutDetailResponseDTO> details
) {
}

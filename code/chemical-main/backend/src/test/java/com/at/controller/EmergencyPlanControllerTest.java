package com.at.controller;

import com.at.pojo.EmergencyPlan;
import com.at.pojo.Result;
import com.at.pojo.dto.EmergencyPlanResponseDTO;
import com.at.service.EmergencyPlanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmergencyPlanControllerTest {

    @Mock
    private EmergencyPlanService emergencyPlanService;

    private EmergencyPlanController controller;

    @BeforeEach
    void setUp() {
        controller = new EmergencyPlanController();
        ReflectionTestUtils.setField(controller, "emergencyPlanService", emergencyPlanService);
    }

    @Test
    void listReturnsPlansFromService() {
        EmergencyPlan plan = new EmergencyPlan();
        plan.setId(1);
        plan.setName("Methane leak response");
        plan.setType("gas-leak");
        plan.setDescription("Evacuate downwind area");
        plan.setLevel("high");
        plan.setCreatedAt(LocalDateTime.of(2026, 6, 18, 10, 0));
        plan.setUpdatedAt(LocalDateTime.of(2026, 6, 18, 11, 0));
        when(emergencyPlanService.getAllPlans()).thenReturn(List.of(plan));

        Result<List<EmergencyPlanResponseDTO>> body = controller.list();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new EmergencyPlanResponseDTO(
                1,
                "Methane leak response",
                "gas-leak",
                "Evacuate downwind area",
                "high",
                LocalDateTime.of(2026, 6, 18, 10, 0),
                LocalDateTime.of(2026, 6, 18, 11, 0)
        ));
        verify(emergencyPlanService).getAllPlans();
    }
}

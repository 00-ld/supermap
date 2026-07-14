package com.at.service;

import com.at.mapper.GasMapper;
import com.at.pojo.Gas;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GasServiceTest {

    @Mock
    private GasMapper gasMapper;

    private GasService service;

    @BeforeEach
    void setUp() {
        service = new GasService();
        ReflectionTestUtils.setField(service, "gasMapper", gasMapper);
    }

    @Test
    void addGasReportsMissingInsertedRows() {
        Gas gas = new Gas();
        gas.setId("co");
        gas.setName("一氧化碳");
        when(gasMapper.insert(gas)).thenReturn(0);

        assertThat(service.addGas(gas)).isFalse();
    }

    @Test
    void addGasReportsInsertedRows() {
        Gas gas = new Gas();
        gas.setId("co");
        gas.setName("一氧化碳");
        when(gasMapper.insert(gas)).thenReturn(1);

        assertThat(service.addGas(gas)).isTrue();
    }

    @Test
    void updateGasReportsMissingRows() {
        Gas gas = new Gas();
        gas.setId("missing-gas");
        when(gasMapper.updateById(gas)).thenReturn(0);

        assertThat(service.updateGas(gas)).isFalse();
    }

    @Test
    void updateGasReportsUpdatedRows() {
        Gas gas = new Gas();
        gas.setId("co");
        when(gasMapper.updateById(gas)).thenReturn(1);

        assertThat(service.updateGas(gas)).isTrue();
    }

    @Test
    void deleteGasReportsMissingRows() {
        when(gasMapper.deleteById("missing-gas")).thenReturn(0);

        assertThat(service.deleteGas("missing-gas")).isFalse();
    }

    @Test
    void deleteGasReportsDeletedRows() {
        when(gasMapper.deleteById("co")).thenReturn(1);

        assertThat(service.deleteGas("co")).isTrue();
    }
}

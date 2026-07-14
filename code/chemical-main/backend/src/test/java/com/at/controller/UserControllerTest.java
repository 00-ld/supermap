package com.at.controller;

import com.at.pojo.Result;
import com.at.pojo.User;
import com.at.pojo.dto.UserResponseDTO;
import com.at.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController();
        ReflectionTestUtils.setField(controller, "userService", userService);
    }

    @Test
    void listReturnsPasswordFreeResponseDtos() {
        User user = new User();
        user.setId(7L);
        user.setUsername("alice");
        user.setPassword("{argon2id}secret-hash");
        user.setRole("admin");
        when(userService.listUsers()).thenReturn(List.of(user));

        Result<List<UserResponseDTO>> body = controller.list();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(new UserResponseDTO(7L, "alice", "admin"));
        assertThat(body.getData().getFirst().getClass().getRecordComponents())
                .extracting(component -> component.getName())
                .doesNotContain("password");
        verify(userService).listUsers();
    }

    @Test
    void deleteReturnsBadRequestWhenUserDoesNotExist() {
        when(userService.deleteUser(404L)).thenReturn(false);

        Result<?> body = controller.delete(404L);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getMessage()).isEqualTo("用户不存在");
        verify(userService).deleteUser(404L);
    }

    @Test
    void deleteReturnsOkWhenUserWasDeleted() {
        when(userService.deleteUser(7L)).thenReturn(true);

        Result<?> body = controller.delete(7L);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("用户已删除");
        verify(userService).deleteUser(7L);
    }
}

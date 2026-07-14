package com.at.service;

import com.at.mapper.UserMapper;
import com.at.pojo.dto.UserCreateDTO;
import com.at.pojo.dto.UserUpdateDTO;
import com.at.pojo.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void createUserRejectsDuplicateUsernameBeforeInsert() {
        User existing = new User();
        existing.setUsername("alice");
        when(userMapper.selectByUsername("alice")).thenReturn(existing);

        assertThatThrownBy(() -> userService.createUser(buildCreateDTO()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists: alice");

        verify(passwordEncoder, never()).encode(any());
        verify(userMapper, never()).insert(any());
    }

    @Test
    void createUserConvertsDuplicateKeyRaceToBadRequestSemantics() {
        when(userMapper.selectByUsername("alice")).thenReturn(null);
        when(passwordEncoder.encode("strong-password")).thenReturn("{argon2id}hash");
        doThrow(new DuplicateKeyException("uk_user_username"))
                .when(userMapper).insert(any(User.class));

        assertThatThrownBy(() -> userService.createUser(buildCreateDTO()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists: alice");
    }

    @Test
    void createUserRejectsZeroInsertedRows() {
        when(userMapper.selectByUsername("alice")).thenReturn(null);
        when(passwordEncoder.encode("strong-password")).thenReturn("{argon2id}hash");
        when(userMapper.insert(any(User.class))).thenReturn(0);

        assertThatThrownBy(() -> userService.createUser(buildCreateDTO()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("用户保存失败");
    }

    @Test
    void updateUserRejectsMissingRowAfterExistenceCheck() {
        User existing = new User();
        existing.setId(404L);
        existing.setUsername("alice");
        existing.setPassword("{argon2id}old-hash");
        existing.setRole("user");
        when(userMapper.selectById(404L)).thenReturn(existing);
        when(userMapper.updateById(any(User.class))).thenReturn(0);

        assertThatThrownBy(() -> userService.updateUser(404L, buildUpdateDTO()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User does not exist: 404");

        verify(userMapper).updateById(any(User.class));
    }

    @Test
    void deleteUserReturnsFalseWhenNoRowsDeleted() {
        when(userMapper.deleteById(404L)).thenReturn(0);

        org.assertj.core.api.Assertions.assertThat(userService.deleteUser(404L)).isFalse();
    }

    @Test
    void deleteUserReturnsTrueWhenRowsDeleted() {
        when(userMapper.deleteById(7L)).thenReturn(1);

        org.assertj.core.api.Assertions.assertThat(userService.deleteUser(7L)).isTrue();
    }

    private UserCreateDTO buildCreateDTO() {
        UserCreateDTO dto = new UserCreateDTO();
        dto.setUsername("alice");
        dto.setPassword("strong-password");
        dto.setRole("user");
        return dto;
    }

    private UserUpdateDTO buildUpdateDTO() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setRole("admin");
        return dto;
    }
}

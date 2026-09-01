package com.at.service.impl;

import com.at.mapper.UserMapper;
import com.at.pojo.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private LoginServiceImpl loginService;

    @Test
    void missingUserStillChecksArgon2DummyHashBeforeRejectingLogin() {
        User user = new User();
        user.setUsername("missing-user");
        user.setPassword("wrong-password");
        when(userMapper.selectByUsername("missing-user")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("{argon2id}dummy-hash");
        when(passwordEncoder.matches(eq("wrong-password"), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(false);

        String token = loginService.login(user);

        assertThat(token).isNull();
        ArgumentCaptor<String> hashCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).matches(eq("wrong-password"), hashCaptor.capture());
        assertThat(hashCaptor.getValue()).startsWith("{argon2id}");
    }

    @Test
    void registerUsesSharedUserMapperAndForcesUserRole() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword("strong-password");
        user.setRole("admin");
        when(userMapper.selectByUsername("alice")).thenReturn(null);
        when(passwordEncoder.encode("strong-password")).thenReturn("{argon2id}hash");
        when(userMapper.insert(any(User.class))).thenReturn(1);

        boolean registered = loginService.register(user);

        assertThat(registered).isTrue();
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(userCaptor.capture());
        assertThat(userCaptor.getValue().getUsername()).isEqualTo("alice");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("{argon2id}hash");
        assertThat(userCaptor.getValue().getRole()).isEqualTo("user");
        verify(userMapper).selectByUsername("alice");
        verify(passwordEncoder).encode("strong-password");
    }

    @Test
    void registerRejectsZeroInsertedRows() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword("strong-password");
        when(userMapper.selectByUsername("alice")).thenReturn(null);
        when(passwordEncoder.encode("strong-password")).thenReturn("{argon2id}hash");
        when(userMapper.insert(any(User.class))).thenReturn(0);

        boolean registered = loginService.register(user);

        assertThat(registered).isFalse();
        verify(userMapper).insert(any(User.class));
    }

    @Test
    void registerRejectsDuplicateUsernameBeforeHashing() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword("strong-password");
        when(userMapper.selectByUsername("alice")).thenReturn(new User());

        boolean registered = loginService.register(user);

        assertThat(registered).isFalse();
        verify(passwordEncoder, org.mockito.Mockito.never()).encode(any());
        verify(userMapper, org.mockito.Mockito.never()).insert(any());
    }

    @Test
    void loginUpgradesLegacyUnprefixedPasswordAfterSuccessfulMatch() {
        User requestUser = new User();
        requestUser.setUsername("admin");
        requestUser.setPassword("legacy-password");
        User storedUser = new User();
        storedUser.setId(1L);
        storedUser.setUsername("admin");
        storedUser.setPassword("legacy-password");
        storedUser.setRole("admin");
        when(userMapper.selectByUsername("admin")).thenReturn(storedUser);
        when(passwordEncoder.matches("legacy-password", "legacy-password")).thenReturn(true);
        when(passwordEncoder.encode("legacy-password")).thenReturn("{argon2id}upgraded-hash");
        when(userMapper.updateById(storedUser)).thenReturn(1);

        String token = loginService.login(requestUser);

        assertThat(token).isNotBlank();
        assertThat(storedUser.getPassword()).isEqualTo("{argon2id}upgraded-hash");
        verify(userMapper).updateById(storedUser);
    }
}

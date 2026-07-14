package com.at.pojo.dto;

import com.at.pojo.User;

public record UserResponseDTO(
        Long id,
        String username,
        String role
) {
    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getRole()
        );
    }
}

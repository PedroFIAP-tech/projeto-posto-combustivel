package com.posto.dto;

import com.posto.entity.User;

public record UserResponse(
    Integer id,
    String name,
    String email,
    String role
) {

  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole().getValue());
  }
}

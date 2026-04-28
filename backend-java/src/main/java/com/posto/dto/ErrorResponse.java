package com.posto.dto;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
    String error,
    Instant timestamp,
    Map<String, String> fields
) {

  public static ErrorResponse of(String error) {
    return new ErrorResponse(error, Instant.now(), Map.of());
  }

  public static ErrorResponse of(String error, Map<String, String> fields) {
    return new ErrorResponse(error, Instant.now(), fields);
  }
}

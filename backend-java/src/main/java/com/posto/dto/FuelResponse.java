package com.posto.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.posto.entity.Fuel;

public record FuelResponse(
    Integer id,
    String name,
    @JsonProperty("price_per_liter") BigDecimal pricePerLiter,
    @JsonProperty("updated_at") Instant updatedAt
) {

  public static FuelResponse from(Fuel fuel) {
    return new FuelResponse(
        fuel.getId(),
        fuel.getName(),
        fuel.getPricePerLiter(),
        fuel.getUpdatedAt());
  }
}

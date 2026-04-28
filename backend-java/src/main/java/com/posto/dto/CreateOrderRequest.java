package com.posto.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderRequest(
    @NotNull
    @Positive
    @JsonAlias("fuel_id")
    Integer fuelId,

    @NotNull
    @Positive
    @JsonAlias({"liters", "liters_delivered"})
    BigDecimal liters
) {
}

package com.posto.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.posto.entity.OrderMode;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderRequest(
    @NotNull
    @Min(1)
    @JsonProperty("pump_number")
    @JsonAlias("pumpNumber")
    Integer pumpNumber,

    @NotNull
    @Min(1)
    @JsonProperty("nozzle_number")
    @JsonAlias("nozzleNumber")
    Integer nozzleNumber,

    @NotNull
    @Positive
    @JsonProperty("fuel_id")
    @JsonAlias("fuel_id")
    Integer fuelId,

    @NotNull
    @Positive
    @JsonAlias({"liters", "liters_delivered"})
    BigDecimal liters,

    @NotNull
    OrderMode mode
) {
}

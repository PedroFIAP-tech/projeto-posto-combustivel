package com.posto.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateFuelPriceRequest(
    @NotNull
    @Positive
    @JsonProperty("price_per_liter")
    @JsonAlias("price")
    BigDecimal pricePerLiter
) {
}

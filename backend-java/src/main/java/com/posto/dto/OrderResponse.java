package com.posto.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.posto.entity.Order;
import com.posto.entity.OrderMode;

public record OrderResponse(
    Integer id,
    @JsonProperty("pump_number") Integer pumpNumber,
    @JsonProperty("nozzle_number") Integer nozzleNumber,
    OrderMode mode,
    @JsonProperty("total_value") BigDecimal totalValue,
    @JsonProperty("liters_delivered") BigDecimal litersDelivered,
    String status,
    @JsonProperty("created_at") Instant createdAt,
    FuelResponse fuel,
    UserResponse user
) {

  public static OrderResponse from(Order order) {
    return new OrderResponse(
        order.getId(),
        order.getPumpNumber(),
        order.getNozzleNumber(),
        order.getMode(),
        order.getTotalValue(),
        order.getLitersDelivered(),
        order.getStatus().name(),
        order.getCreatedAt(),
        FuelResponse.from(order.getFuel()),
        UserResponse.from(order.getUser()));
  }
}

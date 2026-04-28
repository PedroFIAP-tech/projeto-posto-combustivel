package com.posto.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.posto.dto.CreateOrderRequest;
import com.posto.dto.OrderResponse;
import com.posto.service.OrderService;

import jakarta.validation.Valid;

@RestController
public class OrderController {

  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping("/bomba/abastecer")
  @ResponseStatus(HttpStatus.CREATED)
  public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
    return orderService.create(request);
  }

  @GetMapping("/pedidos/pendentes")
  public List<OrderResponse> pending() {
    return orderService.pending();
  }

  @GetMapping("/pedidos/historico")
  public List<OrderResponse> history(@RequestParam(required = false) String status) {
    return orderService.history(status);
  }

  @PatchMapping("/pedidos/{id}/pagar")
  public OrderResponse pay(@PathVariable Integer id) {
    return orderService.pay(id);
  }
}

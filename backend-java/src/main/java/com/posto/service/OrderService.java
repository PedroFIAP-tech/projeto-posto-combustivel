package com.posto.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.posto.dto.CreateOrderRequest;
import com.posto.dto.OrderResponse;
import com.posto.entity.Order;
import com.posto.entity.OrderStatus;
import com.posto.entity.Role;
import com.posto.exception.ApiException;
import com.posto.repository.FuelRepository;
import com.posto.repository.OrderRepository;
import com.posto.repository.UserRepository;
import com.posto.security.AuthenticatedUser;
import com.posto.security.SecuritySupport;

@Service
public class OrderService {

  private static final ZoneId DEFAULT_ZONE = ZoneId.of("America/Sao_Paulo");

  private final OrderRepository orderRepository;
  private final FuelRepository fuelRepository;
  private final UserRepository userRepository;
  private final SecuritySupport securitySupport;

  public OrderService(
      OrderRepository orderRepository,
      FuelRepository fuelRepository,
      UserRepository userRepository,
      SecuritySupport securitySupport) {
    this.orderRepository = orderRepository;
    this.fuelRepository = fuelRepository;
    this.userRepository = userRepository;
    this.securitySupport = securitySupport;
  }

  @Transactional
  public OrderResponse create(CreateOrderRequest request) {
    AuthenticatedUser currentUser = securitySupport.currentUser();

    if (!securitySupport.isOperational(currentUser)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Acesso negado para registrar abastecimento.");
    }

    var user = userRepository.findById(currentUser.id())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado."));

    var fuel = fuelRepository.findById(request.fuelId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Combustivel nao encontrado."));

    BigDecimal liters = request.liters().setScale(3, RoundingMode.HALF_UP);
    BigDecimal totalValue = fuel.getPricePerLiter()
        .multiply(liters)
        .setScale(2, RoundingMode.HALF_UP);

    Order order = new Order();
    order.setUser(user);
    order.setFuel(fuel);
    order.setLitersDelivered(liters);
    order.setTotalValue(totalValue);
    order.setStatus(OrderStatus.PENDENTE);

    return OrderResponse.from(orderRepository.save(order));
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> pending() {
    AuthenticatedUser user = securitySupport.currentUser();
    List<Order> orders;

    if (user.role() == Role.ADMIN || user.role() == Role.FRENTISTA) {
      orders = orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.PENDENTE);
    } else {
      orders = orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.id(), OrderStatus.PENDENTE);
    }

    return orders.stream().map(OrderResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> history(String status) {
    AuthenticatedUser user = securitySupport.currentUser();
    OrderStatus orderStatus = parseStatus(status);

    if (user.role() == Role.ADMIN) {
      if (orderStatus != null) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(orderStatus).stream()
            .map(OrderResponse::from)
            .toList();
      }

      return orderRepository.findAllByOrderByCreatedAtDesc().stream()
          .map(OrderResponse::from)
          .toList();
    }

    var today = LocalDate.now(DEFAULT_ZONE);
    var start = today.atStartOfDay(DEFAULT_ZONE).toInstant();
    var end = today.plusDays(1).atStartOfDay(DEFAULT_ZONE).toInstant();

    List<Order> orders = orderStatus == null
        ? orderRepository.findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            user.id(), start, end)
        : orderRepository.findByUserIdAndStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            user.id(), orderStatus, start, end);

    return orders.stream().map(OrderResponse::from).toList();
  }

  @Transactional
  public OrderResponse pay(Integer id) {
    AuthenticatedUser user = securitySupport.currentUser();

    var order = orderRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido nao encontrado."));

    boolean canPay = user.role() == Role.ADMIN || user.role() == Role.FRENTISTA || order.getUser().getId().equals(user.id());

    if (!canPay) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Voce nao tem permissao para pagar este pedido.");
    }

    if (order.getStatus() == OrderStatus.PAGO) {
      throw new ApiException(HttpStatus.CONFLICT, "Este pedido ja foi pago.");
    }

    order.setStatus(OrderStatus.PAGO);
    return OrderResponse.from(orderRepository.save(order));
  }

  private OrderStatus parseStatus(String status) {
    if (status == null || status.isBlank()) {
      return null;
    }

    try {
      return OrderStatus.valueOf(status.trim().toUpperCase());
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Status invalido. Use PENDENTE ou PAGO.");
    }
  }
}

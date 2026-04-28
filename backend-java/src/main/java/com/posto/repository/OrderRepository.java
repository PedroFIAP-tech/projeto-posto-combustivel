package com.posto.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.posto.entity.Order;
import com.posto.entity.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Integer> {

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Integer userId, OrderStatus status);

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
      OrderStatus status,
      Instant start,
      Instant end);

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByUserIdAndStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
      Integer userId,
      OrderStatus status,
      Instant start,
      Instant end);

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
      Instant start,
      Instant end);

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
      Integer userId,
      Instant start,
      Instant end);

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findAllByOrderByCreatedAtDesc();

  @EntityGraph(attributePaths = {"fuel", "user"})
  List<Order> findByUserIdOrderByCreatedAtDesc(Integer userId);
}

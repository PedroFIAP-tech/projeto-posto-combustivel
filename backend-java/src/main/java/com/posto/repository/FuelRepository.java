package com.posto.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.posto.entity.Fuel;

public interface FuelRepository extends JpaRepository<Fuel, Integer> {

  List<Fuel> findAllByOrderByNameAsc();

  Optional<Fuel> findByName(String name);
}

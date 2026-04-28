package com.posto.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.posto.entity.Fuel;

public interface FuelRepository extends JpaRepository<Fuel, Integer> {

  List<Fuel> findAllByOrderByNameAsc();

  List<Fuel> findByNameOrderByIdAsc(String name);
}

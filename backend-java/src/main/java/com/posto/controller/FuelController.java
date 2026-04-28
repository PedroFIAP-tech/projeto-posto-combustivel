package com.posto.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.posto.dto.FuelResponse;
import com.posto.dto.UpdateFuelPriceRequest;
import com.posto.service.FuelService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/combustiveis")
public class FuelController {

  private final FuelService fuelService;

  public FuelController(FuelService fuelService) {
    this.fuelService = fuelService;
  }

  @GetMapping
  public List<FuelResponse> list() {
    return fuelService.list();
  }

  @PutMapping("/{id}")
  public FuelResponse updatePrice(
      @PathVariable Integer id,
      @Valid @RequestBody UpdateFuelPriceRequest request) {
    return fuelService.updatePrice(id, request.pricePerLiter());
  }
}

package com.posto.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.posto.dto.FuelResponse;
import com.posto.entity.Role;
import com.posto.exception.ApiException;
import com.posto.repository.FuelRepository;
import com.posto.security.SecuritySupport;

@Service
public class FuelService {

  private final FuelRepository fuelRepository;
  private final SecuritySupport securitySupport;

  public FuelService(FuelRepository fuelRepository, SecuritySupport securitySupport) {
    this.fuelRepository = fuelRepository;
    this.securitySupport = securitySupport;
  }

  @Transactional(readOnly = true)
  public List<FuelResponse> list() {
    securitySupport.currentUser();
    return fuelRepository.findAllByOrderByNameAsc().stream()
        .map(FuelResponse::from)
        .toList();
  }

  @Transactional
  public FuelResponse updatePrice(Integer id, BigDecimal pricePerLiter) {
    securitySupport.requireRole(Role.ADMIN);

    var fuel = fuelRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Combustivel nao encontrado."));

    fuel.setPricePerLiter(pricePerLiter);
    return FuelResponse.from(fuelRepository.save(fuel));
  }
}

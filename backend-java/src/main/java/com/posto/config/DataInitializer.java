package com.posto.config;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.posto.entity.Fuel;
import com.posto.entity.Role;
import com.posto.entity.User;
import com.posto.repository.FuelRepository;
import com.posto.repository.UserRepository;

@Configuration
public class DataInitializer {

  @Bean
  CommandLineRunner seedBaseData(SeedService seedService) {
    return args -> seedService.seed();
  }

  @Configuration
  static class SeedService {

    private final UserRepository userRepository;
    private final FuelRepository fuelRepository;
    private final PasswordEncoder passwordEncoder;

    SeedService(
        UserRepository userRepository,
        FuelRepository fuelRepository,
        PasswordEncoder passwordEncoder) {
      this.userRepository = userRepository;
      this.fuelRepository = fuelRepository;
      this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void seed() {
      upsertUser("admin@posto.com", "Administrador", Role.ADMIN);
      upsertUser("frentista@posto.com", "Frentista", Role.FRENTISTA);

      List<FuelSeed> fuels = List.of(
          new FuelSeed("Gasolina Comum", new BigDecimal("5.89")),
          new FuelSeed("Gasolina Aditivada", new BigDecimal("6.09")),
          new FuelSeed("Etanol", new BigDecimal("3.99")),
          new FuelSeed("Diesel S10", new BigDecimal("5.95")));

      fuels.forEach(this::upsertFuel);
    }

    private void upsertUser(String email, String name, Role role) {
      User user = userRepository.findByEmail(email).orElseGet(User::new);
      user.setEmail(email);
      user.setName(name);
      user.setRole(role);
      user.setPasswordHash(passwordEncoder.encode("123456"));
      userRepository.save(user);
    }

    private void upsertFuel(FuelSeed seed) {
      Fuel fuel = fuelRepository.findByName(seed.name()).orElseGet(Fuel::new);
      fuel.setName(seed.name());
      fuel.setPricePerLiter(seed.pricePerLiter());
      fuelRepository.save(fuel);
    }
  }

  record FuelSeed(String name, BigDecimal pricePerLiter) {
  }
}

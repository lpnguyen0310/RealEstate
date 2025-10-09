package com.backend.be_realestate.seed;

import com.backend.be_realestate.entity.RoleEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.repository.RoleRepository;
import com.backend.be_realestate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SeedData implements CommandLineRunner {
    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        if (roleRepo.count() == 0) {
            roleRepo.saveAll(List.of(
                    RoleEntity.builder().code("ADMIN").name("Administrator").build(),
                    RoleEntity.builder().code("USER").name("User").build()
            ));
        }

        if (userRepo.count() == 0) {
            var roles = roleRepo.findAll();
            userRepo.save(UserEntity.builder()
                    .email("admin@example.com")
                    .phone("0900000000")
                    .passwordHash(encoder.encode("123456"))
                    .firstName("Admin")
                    .lastName("System")
                    .isActive(true)
                    .roles(roles)
                    .build());
        }
    }
}

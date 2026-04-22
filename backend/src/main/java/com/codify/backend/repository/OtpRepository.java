package com.codify.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.codify.backend.model.Otp;
public interface OtpRepository extends JpaRepository<Otp, Long> {
    Otp findByEmail(String email);
    Otp findByEmailAndCode(String email, String code);
    void deleteByEmail(String email);
}

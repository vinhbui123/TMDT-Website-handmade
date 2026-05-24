package com.project.web_hand_made_cd_web.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Quan trọng để React gửi POST được
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // Cho phép tất cả mà không cần đăng nhập
                )
                .httpBasic(basic -> basic.disable()) // Tắt cái bảng đăng nhập bạn đang thấy
                .formLogin(form -> form.disable()); // Tắt luôn trang login mặc định
        return http.build();
    }
}
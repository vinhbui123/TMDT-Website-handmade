package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.Dto.AuthResponse;
import com.project.web_hand_made_cd_web.Dto.LoginRequest;
import com.project.web_hand_made_cd_web.Dto.RegisterRequest;
import com.project.web_hand_made_cd_web.Service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // Vite default port
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody com.project.web_hand_made_cd_web.Dto.SocialLoginRequest request) {
        AuthResponse response = authService.googleLogin(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/facebook")
    public ResponseEntity<AuthResponse> facebookLogin(@RequestBody com.project.web_hand_made_cd_web.Dto.SocialLoginRequest request) {
        AuthResponse response = authService.facebookLogin(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}

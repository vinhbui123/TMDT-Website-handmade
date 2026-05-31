package com.project.web_hand_made_TMDT.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_TMDT.Dto.AuthResponse;
import com.project.web_hand_made_TMDT.Dto.LoginRequest;
import com.project.web_hand_made_TMDT.Dto.RegisterRequest;
import com.project.web_hand_made_TMDT.Dto.SocialLoginRequest;
import com.project.web_hand_made_TMDT.Model.User;
import com.project.web_hand_made_TMDT.Service.AuthService;
import com.project.web_hand_made_TMDT.Service.EmailService;
import com.project.web_hand_made_TMDT.Service.OtpService;
import com.project.web_hand_made_TMDT.Service.SessionManager;
import com.project.web_hand_made_TMDT.Util.HashUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // Vite default port
public class AuthController {
    
    private final AuthService authService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final SessionManager sessionManager;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request);
        if (response.isSuccess() && response.getUser() != null) {
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute("userId", response.getUser().getId());
            sessionManager.addSession(response.getUser().getId(), session);
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
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody SocialLoginRequest request, HttpServletRequest httpRequest) {
        AuthResponse response = authService.googleLogin(request);
        if (response.isSuccess() && response.getUser() != null) {
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute("userId", response.getUser().getId());
            sessionManager.addSession(response.getUser().getId(), session);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/facebook")
    public ResponseEntity<AuthResponse> facebookLogin(@RequestBody SocialLoginRequest request, HttpServletRequest httpRequest) {
        AuthResponse response = authService.facebookLogin(request);
        if (response.isSuccess() && response.getUser() != null) {
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute("userId", response.getUser().getId());
            sessionManager.addSession(response.getUser().getId(), session);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Vui lòng nhập email.", null));
        }
        
        var userOpt = authService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Email không tồn tại trong hệ thống.", null));
        }
        
        try {
            String otp = otpService.generateOtp(email);
            emailService.sendOtpEmail(email, otp);
            return ResponseEntity.ok(new AuthResponse(true, "Mã OTP đã được gửi đến email của bạn.", null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new AuthResponse(false, "Lỗi khi gửi email: " + e.getMessage(), null));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Thiếu thông tin.", null));
        }
        
        boolean isValid = otpService.verifyOtp(email, otp);
        if (isValid) {
            return ResponseEntity.ok(new AuthResponse(true, "OTP hợp lệ.", null));
        } else {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Mã OTP không đúng hoặc đã hết hạn.", null));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        
        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Thiếu thông tin.", null));
        }
        
        // Double check OTP
        boolean isValid = otpService.verifyOtp(email, otp);
        if (!isValid) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Mã OTP không đúng hoặc đã hết hạn.", null));
        }
        
        var userOpt = authService.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(HashUtil.toSHA256(newPassword));
            authService.saveUser(user);
            
            // Clear OTP after successful reset
            otpService.clearOtp(email);
            
            return ResponseEntity.ok(new AuthResponse(true, "Đổi mật khẩu thành công.", null));
        }
        
        return ResponseEntity.badRequest().body(new AuthResponse(false, "Không tìm thấy người dùng.", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Integer userId = (Integer) session.getAttribute("userId");
            if (userId != null) {
                sessionManager.removeSession(userId, session.getId());
            }
            session.invalidate();
        }
        return ResponseEntity.ok(new AuthResponse(true, "Đăng xuất thành công", null));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Integer userId = (Integer) session.getAttribute("userId");
            if (userId != null) {
                var userOpt = authService.findById(userId);
                if (userOpt.isPresent()) {
                    return ResponseEntity.ok(userOpt.get());
                }
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(HttpServletRequest httpRequest, @RequestBody Map<String, String> request) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(false, "Vui lòng đăng nhập.", null));
        }
        
        Integer userId = (Integer) session.getAttribute("userId");
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Thiếu thông tin.", null));
        }
        
        var userOpt = authService.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Nếu người dùng đăng nhập bằng Google/Facebook, họ có thể chưa có password
            if (user.getPassword() == null || user.getPassword().isEmpty() || !user.getAuthProvider().equals("local")) {
                 return ResponseEntity.badRequest().body(new AuthResponse(false, "Tài khoản mạng xã hội không thể đổi mật khẩu qua chức năng này.", null));
            }
            
            // Verify old password
            String hashedCurrent = HashUtil.toSHA256(currentPassword);
            if (!hashedCurrent.equals(user.getPassword())) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Mật khẩu hiện tại không đúng.", null));
            }
            
            // Set new password
            user.setPassword(HashUtil.toSHA256(newPassword));
            authService.saveUser(user);
            
            // Invalidate other sessions
            sessionManager.invalidateOtherSessions(userId, session.getId());
            
            return ResponseEntity.ok(new AuthResponse(true, "Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất.", null));
        }
        return ResponseEntity.badRequest().body(new AuthResponse(false, "Không tìm thấy người dùng.", null));
    }

    @PostMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            HttpServletRequest request,
            @org.springframework.web.bind.annotation.RequestParam(value = "fullName", required = false) String fullName,
            @org.springframework.web.bind.annotation.RequestParam(value = "email", required = false) String email,
            @org.springframework.web.bind.annotation.RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @org.springframework.web.bind.annotation.RequestParam(value = "address", required = false) String address,
            @org.springframework.web.bind.annotation.RequestParam(value = "bio", required = false) String bio,
            @org.springframework.web.bind.annotation.RequestParam(value = "avatarUpload", required = false) org.springframework.web.multipart.MultipartFile avatarUpload) {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(false, "Vui lòng đăng nhập.", null));
        }
        Integer userId = (Integer) session.getAttribute("userId");
        var userOpt = authService.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Không tìm thấy người dùng.", null));
        }
        User user = userOpt.get();

        if (fullName != null) {
            String[] parts = fullName.trim().split(" ", 2);
            user.setFirstName(parts.length > 0 ? parts[0] : "");
            user.setLastName(parts.length > 1 ? parts[1] : "");
        }
        if (email != null && !email.trim().isEmpty()) {
            user.setEmail(email);
        }
        if (phoneNumber != null) {
            user.setPhoneNumber(phoneNumber);
        }
        if (address != null) {
            user.setAddress(address);
        }
        if (bio != null) {
            user.setBio(bio);
        }

        if (avatarUpload != null && !avatarUpload.isEmpty()) {
            try {
                String originalFileName = java.nio.file.Paths.get(avatarUpload.getOriginalFilename()).getFileName().toString();
                String newFileName = System.currentTimeMillis() + "_" + originalFileName;
                
                // Lưu vào thư mục frontend/public/images/avatars/
                String projectRoot = System.getProperty("user.dir");
                java.nio.file.Path frontendAvatarsPath = java.nio.file.Paths.get(projectRoot, "frontend", "public", "images", "avatars");
                
                java.io.File uploadDir = frontendAvatarsPath.toFile();
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }

                java.nio.file.Path filePath = frontendAvatarsPath.resolve(newFileName);
                avatarUpload.transferTo(filePath.toFile());

                user.setAvatar("/images/avatars/" + newFileName);
            } catch (java.io.IOException e) {
                return ResponseEntity.internalServerError().body(new AuthResponse(false, "Lỗi khi tải ảnh lên: " + e.getMessage(), null));
            }
        }

        authService.saveUser(user);
        return ResponseEntity.ok(new AuthResponse(true, "Cập nhật thông tin thành công.", user));
    }
}

package com.project.web_hand_made_TMDT.Service;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.project.web_hand_made_TMDT.Dto.AuthResponse;
import com.project.web_hand_made_TMDT.Dto.LoginRequest;
import com.project.web_hand_made_TMDT.Dto.RegisterRequest;
import com.project.web_hand_made_TMDT.Dto.SocialLoginRequest;
import com.project.web_hand_made_TMDT.Model.User;
import com.project.web_hand_made_TMDT.Repository.UserRepository;
import com.project.web_hand_made_TMDT.Util.HashUtil;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(request.getUsername()); // check email too
        }
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String hashedInput = HashUtil.toSHA256(request.getPassword());
            if (user.getPassword().equals(hashedInput)) {
                if (user.getStatus() != 1) {
                    return new AuthResponse(false, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.", null);
                }
                return new AuthResponse(true, "Đăng nhập thành công", user);
            }
        }
        
        return new AuthResponse(false, "Tài khoản, email hoặc mật khẩu không đúng.", null);
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) return new AuthResponse(false, "Tên không được để trống.", null);
        if (request.getLastName() == null || request.getLastName().trim().isEmpty()) return new AuthResponse(false, "Họ không được để trống.", null);
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) return new AuthResponse(false, "Tên người dùng không được để trống.", null);
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) return new AuthResponse(false, "Email không được để trống.", null);
        
        if (!request.getEmail().matches("^[\\w-]+(?:\\.[\\w-]+)*@(?:[\\w-]+\\.)+[a-zA-Z]{2,7}$")) {
            return new AuthResponse(false, "Email không hợp lệ.", null);
        }
        
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) return new AuthResponse(false, "Mật khẩu không được để trống.", null);
        
        if (!request.getPassword().matches("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$")) {
            return new AuthResponse(false, "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.", null);
        }
        
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return new AuthResponse(false, "Mật khẩu và xác nhận mật khẩu không khớp.", null);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(false, "Tên đăng nhập đã tồn tại.", null);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, "Email đã được sử dụng.", null);
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(HashUtil.toSHA256(request.getPassword()));
        
        User savedUser = userRepository.save(user);
        
        return new AuthResponse(true, "Đăng ký thành công", savedUser);
    }

    @org.springframework.beans.factory.annotation.Value("${social.google.client-id}")
    private String googleClientId;

    public AuthResponse googleLogin(SocialLoginRequest request) {
        try {
            var restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + request.getToken();
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.getForEntity(url, java.util.Map.class);
            java.util.Map<String, Object> userInfo = response.getBody();
            
            if (userInfo != null) {
                String email = (String) userInfo.get("email");
                String name = (String) userInfo.get("name");
                
                if (email != null) {
                    return processSocialLogin(email, name, "google");
                }
            }
            return new AuthResponse(false, "Không thể lấy thông tin Google.", null);
        } catch (org.springframework.web.client.RestClientException e) {
            return new AuthResponse(false, "Lỗi xác thực Google: " + e.getMessage(), null);
        }
    }

    public AuthResponse facebookLogin(com.project.web_hand_made_TMDT.Dto.SocialLoginRequest request) {
        try {
            var restTemplate = new RestTemplate();
            String url = "https://graph.facebook.com/me?fields=id,name,email&access_token=" + request.getToken();
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> userInfo = response.getBody();
            
            if (userInfo != null) {
                String email = (String) userInfo.get("email");
                String name = (String) userInfo.get("name");
                String id = (String) userInfo.get("id");
                
                if (email == null) {
                    email = id + "@facebook.com"; // Fallback if no email provided
                }
                
                return processSocialLogin(email, name, "facebook");
            }
            return new AuthResponse(false, "Không thể lấy thông tin Facebook.", null);
        } catch (RestClientException e) {
            return new AuthResponse(false, "Lỗi xác thực Facebook: " + e.getMessage(), null);
        }
    }

    private AuthResponse processSocialLogin(String email, String name, String provider) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            if (user.getAuthProvider() == null || user.getAuthProvider().equals("local")) {
                user.setAuthProvider(provider);
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(email);
            user.setUsername(email.split("@")[0]);
            
            String[] nameParts = name != null ? name.split(" ", 2) : new String[]{"User", ""};
            user.setFirstName(nameParts[0]);
            user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
            
            user.setAuthProvider(provider);
            user.setPassword(HashUtil.toSHA256(java.util.UUID.randomUUID().toString()));
            user.setStatus(1); 
            user.setRole(0); 
            user = userRepository.save(user);
        }
        return new AuthResponse(true, "Đăng nhập thành công", user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Integer id) {
        return userRepository.findById(id);
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }
}

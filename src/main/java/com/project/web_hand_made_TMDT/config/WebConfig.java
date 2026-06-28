package com.project.web_hand_made_TMDT.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    // 1. CẤU HÌNH CORS
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5000", "http://localhost:5173") // React Vite dev server
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    // 2. CẤU HÌNH INTERCEPTOR BẢO MẬT
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/orders/**", "/api/cart/**"); // Chặn chưa đăng nhập
    }

    // 3. 🔥 BỔ SUNG: Cấu hình đường dẫn ảo để hiển thị ảnh logo từ thư mục ngoài uploads/
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Lấy đường dẫn tuyệt đối của thư mục ngoài "uploads/images/logos/" trên ổ cứng máy tính
        String uploadPath = Paths.get("uploads/images/logos/").toAbsolutePath().toUri().toString();

        // Khi Frontend (React) gọi link ảnh dạng /images/logos/ten_file.png,
        // Server sẽ tự động móc file từ thư mục vật lý này ra trả về cho trình duyệt xem thời gian thực
        registry.addResourceHandler("/images/logos/**")
                .addResourceLocations(uploadPath);
    }
}
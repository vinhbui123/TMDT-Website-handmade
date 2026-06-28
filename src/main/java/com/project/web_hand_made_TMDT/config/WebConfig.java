package com.project.web_hand_made_TMDT.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.beans.factory.annotation.Autowired;
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5000", "http://localhost:5173") // React Vite dev server
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/orders/**", "/api/cart/**"); // Chặn chưa đăng nhập
    }

    // 3. BỔ SUNG: Cấu hình đường dẫn ảo để hiển thị ảnh logo từ thư mục ngoài uploads/
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Lấy đường dẫn tuyệt đối của thư mục ngoài "uploads/images/logos/" trên ổ cứng máy tính
        String logosPath = Paths.get("uploads/images/logos/").toAbsolutePath().toUri().toString();
        
        // Thư mục chứa ảnh mẫu ban đầu của Frontend
        String frontendImagesPath = Paths.get("frontend/public/images/").toAbsolutePath().toUri().toString();
        
        // Thư mục chứa ảnh mới upload của Backend
        String backendUploadsPath = Paths.get("src/main/resources/static/images/").toAbsolutePath().toUri().toString();

        // Khi Frontend (React) gọi link ảnh dạng /images/logos/ten_file.png,
        registry.addResourceHandler("/images/logos/**")
                .addResourceLocations(logosPath);

        // Phục vụ tất cả ảnh khác từ cả thư mục frontend và backend
        registry.addResourceHandler("/images/**")
                .addResourceLocations(frontendImagesPath, backendUploadsPath);
    }
}

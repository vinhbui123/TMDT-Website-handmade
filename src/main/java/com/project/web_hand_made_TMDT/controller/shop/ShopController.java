package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.model.User;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import com.project.web_hand_made_TMDT.repository.UserRepository;
import com.project.web_hand_made_TMDT.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class ShopController {

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // Bộ nhớ tạm lưu trữ mã OTP Đăng ký Shop (Key: UserId, Value: Mã OTP)
    private static final Map<Integer, String> shopRegisterOtpMap = new ConcurrentHashMap<>();

    // 🔥 ĐỒNG BỘ: Đường dẫn đổi ra ngoài thư mục nguồn src để tránh lỗi bị Tomcat chặn hiển thị thời gian thực
    private static final String UPLOAD_DIR = "uploads/images/logos/";

    // --- 1. API GỬI OTP XÁC THỰC MỞ SHOP QUA EMAIL ---
    @PostMapping("/auth/shop-send-otp")
    public ResponseEntity<?> sendShopOtp(
            @RequestParam("user_id") Integer userId,
            @RequestParam("shop_name") String shopName) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getEmail() == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Không tìm thấy thông tin Email tài khoản người dùng!");
                return ResponseEntity.badRequest().body(response);
            }

            // Sinh mã OTP ngẫu nhiên gồm 6 chữ số
            String otp = String.format("%06d", new Random().nextInt(999999));
            shopRegisterOtpMap.put(userId, otp);

            // Gửi Email thông qua EmailService (hàm sendShopRegisterOtpEmail bạn đã tạo)
            emailService.sendShopRegisterOtpEmail(user.getEmail(), shopName, otp);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Mã xác thực OTP đã được gửi đến Email của bạn!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Lỗi gửi mã OTP: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // --- 2. API ĐĂNG KÝ SHOP (Nhận dạng mã OTP và MultipartFile tệp ảnh logo) ---
    @PostMapping("/auth/register-shop")
    public ResponseEntity<?> registerShop(
            @RequestParam("shop_name") String shopName,
            @RequestParam("shop_address") String shopAddress,
            @RequestParam("description") String description,
            @RequestParam("user_id") Integer userId,
            @RequestParam("otp") String otpRequest,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            // KIỂM TRA MÃ OTP HỢP LỆ
            String savedOtp = shopRegisterOtpMap.get(userId);
            if (savedOtp == null || !savedOtp.equals(otpRequest.trim())) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Mã OTP không chính xác hoặc đã hết hạn!");
                return ResponseEntity.badRequest().body(response);
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Không tìm thấy thông tin người dùng!");
                return ResponseEntity.badRequest().body(response);
            }

            // Xử lý lưu File Ảnh vào thư mục vật lý hệ thống
            String dbImagePath = null;
            if (file != null && !file.isEmpty()) {
                File directory = new File(UPLOAD_DIR);
                if (!directory.exists()) {
                    directory.mkdirs(); // Tự động tạo cây thư mục "uploads/images/logos/" nếu chưa tồn tại trên máy người dùng
                }
                String originalFileName = file.getOriginalFilename();
                String fileExtension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String newFileName = UUID.randomUUID().toString() + fileExtension;
                Path path = Paths.get(UPLOAD_DIR + newFileName);
                Files.write(path, file.getBytes());
                dbImagePath = "/images/logos/" + newFileName; // Giữ nguyên đường dẫn tương đối khớp cấu hình WebMvcConfigurer
            }

            // Tìm kiếm xem người dùng này đã từng tạo yêu cầu chưa
            Shop shop = shopRepository.findByUserId(userId).orElse(null);
            if (shop == null) {
                shop = Shop.builder()
                        .user(user)
                        .rating(0.0)
                        .createdAt(new Date())
                        .build();
            } else {
                if (dbImagePath == null) {
                    dbImagePath = shop.getShopLogo(); // Giữ nguyên logo cũ nếu không tải file mới lên
                }
            }

            shop.setShopName(shopName);
            shop.setShopAddress(shopAddress);
            shop.setDescription(description);
            shop.setShopLogo(dbImagePath);
            shop.setStatus(0); // 0: PENDING (Chờ phê duyệt)
            shop.setUpdatedAt(new Date());

            shopRepository.save(shop);

            // Xóa mã OTP ngay sau khi đăng ký thành công
            shopRegisterOtpMap.remove(userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Gửi đơn đăng ký thành công! Vui lòng chờ Admin phê duyệt.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Lỗi hệ thống khi lưu Database: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // --- 3. API LẤY DANH SÁCH ĐƠN CHỜ PHÊ DUYỆT (Admin) ---
    @GetMapping("/admin/shops/pending")
    public ResponseEntity<?> getPendingShops() {
        try {
            List<Shop> pendingShops = shopRepository.findByStatus(0);
            return ResponseEntity.ok(pendingShops);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi lấy danh sách đơn: " + e.getMessage());
        }
    }

    // --- 4. API DUYỆT SHOP ---
    @PutMapping("/admin/shops/approve/{id}")
    public ResponseEntity<?> approveShop(@PathVariable("id") Integer shopId) {
        try {
            Shop shop = shopRepository.findById(shopId).orElse(null);
            if (shop == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Không tìm thấy thông tin shop!");
                return ResponseEntity.badRequest().body(response);
            }

            shop.setStatus(1); // 1: APPROVED
            shop.setUpdatedAt(new Date());

            if (shop.getUser() != null) {
                User owner = shop.getUser();
                owner.setRole(2); // Nâng quyền thành Chủ cửa hàng (Role = 2)
                userRepository.save(owner);
            }

            shopRepository.save(shop);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã duyệt đơn đăng ký shop thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Lỗi xử lý duyệt: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // --- 5. API TỪ CHỐI SHOP ---
    @PutMapping("/admin/shops/reject/{id}")
    public ResponseEntity<?> rejectShop(@PathVariable("id") Integer shopId) {
        try {
            Shop shop = shopRepository.findById(shopId).orElse(null);
            if (shop == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Không tìm thấy thông tin shop!");
                return ResponseEntity.badRequest().body(response);
            }

            shop.setStatus(2); // 2: REJECTED
            shop.setUpdatedAt(new Date());
            shopRepository.save(shop);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã từ chối đơn đăng ký thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Lỗi xử lý từ chối: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // --- 6. API HỦY YÊU CẦU ĐĂNG KÝ SHOP ---
    @DeleteMapping("/auth/cancel-shop/{userId}")
    public ResponseEntity<?> cancelRegisterShop(@PathVariable("userId") Integer userId) {
        try {
            Shop shop = shopRepository.findByUserId(userId).orElse(null);
            if (shop == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Không tìm thấy đơn đăng ký để hủy!");
                return ResponseEntity.badRequest().body(response);
            }

            if (shop.getStatus() != 0) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Đơn đã được xử lý từ trước, bạn không thể hủy!");
                return ResponseEntity.badRequest().body(response);
            }

            shopRepository.delete(shop);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã hủy yêu cầu đăng ký mở cửa hàng thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Lỗi hệ thống khi thực hiện hủy: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
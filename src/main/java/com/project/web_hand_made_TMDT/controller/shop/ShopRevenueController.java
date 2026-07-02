package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.OrderDetail;
import com.project.web_hand_made_TMDT.model.Order;
import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.repository.OrderDetailRepository;
import com.project.web_hand_made_TMDT.repository.OrderRepository;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shop/revenue")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopRevenueController {

    private final OrderDetailRepository orderDetailRepository;
    private final OrderRepository orderRepository;
    private final ShopRepository shopRepository;

    public ShopRevenueController(OrderDetailRepository orderDetailRepository, OrderRepository orderRepository, ShopRepository shopRepository) {
        this.orderDetailRepository = orderDetailRepository;
        this.orderRepository = orderRepository;
        this.shopRepository = shopRepository;
    }

    @GetMapping
    public ResponseEntity<?> getShopRevenue(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Bạn chưa có shop"));
        }

        int shopId = shopOpt.get().getId();

        // Lấy tất cả OrderDetails của shop này có trạng thái = 3 (Đã giao hàng)
        List<OrderDetail> details = orderDetailRepository.findByProductShopIdAndStatus(shopId, 3);

        int totalRevenue = 0;
        int totalProductsSold = 0;
        Set<Integer> uniqueOrders = new HashSet<>();

        // Group doanh thu theo tháng (VD: "2023-10")
        Map<String, Integer> revenueByMonthMap = new TreeMap<>(); // TreeMap để tự động sort theo tháng
        
        // Group doanh thu/số lượng theo sản phẩm
        Map<Integer, ProductSaleStats> productStatsMap = new HashMap<>();

        for (OrderDetail od : details) {
            totalRevenue += od.getTotalMoney();
            totalProductsSold += od.getQuantity();
            uniqueOrders.add(od.getOrderId());

            // Lấy tháng của Order tương ứng
            Optional<Order> orderOpt = orderRepository.findById(od.getOrderId());
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                if (order.getCreatedAt() != null) {
                    String monthStr = order.getCreatedAt().format(DateTimeFormatter.ofPattern("MM/yyyy"));
                    revenueByMonthMap.put(monthStr, revenueByMonthMap.getOrDefault(monthStr, 0) + od.getTotalMoney());
                }
            }

            // Tính doanh số cho từng sản phẩm
            int productId = od.getProductId();
            ProductSaleStats stats = productStatsMap.getOrDefault(productId, new ProductSaleStats(od.getProduct().getName(), od.getProduct().getImg(), 0, 0));
            stats.quantity += od.getQuantity();
            stats.revenue += od.getTotalMoney();
            productStatsMap.put(productId, stats);
        }

        // Chuyển map revenue theo tháng sang danh sách object cho recharts
        List<Map<String, Object>> revenueByMonth = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : revenueByMonthMap.entrySet()) {
            revenueByMonth.add(Map.of("name", entry.getKey(), "revenue", entry.getValue()));
        }

        // Sắp xếp sản phẩm bán chạy (theo số lượng bán) và lấy Top 5
        List<Map<String, Object>> topProducts = productStatsMap.values().stream()
                .sorted((a, b) -> Integer.compare(b.quantity, a.quantity))
                .limit(5)
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", s.name);
                    map.put("img", s.img != null ? s.img : "");
                    map.put("quantity", s.quantity);
                    map.put("revenue", s.revenue);
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("totalOrders", uniqueOrders.size());
        result.put("totalProductsSold", totalProductsSold);
        result.put("revenueByMonth", revenueByMonth);
        result.put("topProducts", topProducts);

        return ResponseEntity.ok(result);
    }

    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }

    // Helper class
    static class ProductSaleStats {
        String name;
        String img;
        int quantity;
        int revenue;

        ProductSaleStats(String name, String img, int quantity, int revenue) {
            this.name = name;
            this.img = img;
            this.quantity = quantity;
            this.revenue = revenue;
        }
    }
}

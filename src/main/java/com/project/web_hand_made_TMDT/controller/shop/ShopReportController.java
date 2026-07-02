package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Inventory;
import com.project.web_hand_made_TMDT.model.Order;
import com.project.web_hand_made_TMDT.model.OrderDetail;
import com.project.web_hand_made_TMDT.model.OrderReport;
import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.repository.InventoryRepository;
import com.project.web_hand_made_TMDT.repository.OrderReportRepository;
import com.project.web_hand_made_TMDT.repository.OrderRepository;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/shop/reports")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopReportController {

    private final OrderReportRepository orderReportRepository;
    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    public ShopReportController(OrderReportRepository orderReportRepository, ShopRepository shopRepository,
                                OrderRepository orderRepository, InventoryRepository inventoryRepository) {
        this.orderReportRepository = orderReportRepository;
        this.shopRepository = shopRepository;
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * Lấy danh sách yêu cầu hoàn hàng của shop hiện tại.
     */
    @GetMapping
    public ResponseEntity<?> getShopReports(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        int shopId = shopOpt.get().getId();
        List<OrderReport> reports = orderReportRepository.findByShopId(shopId);

        return ResponseEntity.ok(reports);
    }

    /**
     * Cập nhật trạng thái yêu cầu hoàn hàng.
     * Nếu chấp nhận (status=1): tự động cộng lại kho tùy theo lý do.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReportStatus(
            @PathVariable("id") int id,
            @RequestParam("status") int status,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        // Validate status: 1 = Accept, 2 = Reject
        if (status != 1 && status != 2) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Trạng thái không hợp lệ"));
        }

        Optional<OrderReport> reportOpt = orderReportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        OrderReport report = reportOpt.get();

        // Verify shop ownership
        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Không có quyền thay đổi"));
        }

        report.setStatus(status);
        orderReportRepository.save(report);

        // Nếu chấp nhận hoàn hàng → xử lý cộng lại kho
        if (status == 1) {
            restoreInventory(report);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái thành công"));
    }

    /**
     * Logic cộng lại kho khi chấp nhận hoàn hàng.
     * - WRONG_ITEM, WRONG_COLOR, MISSING_ITEM, OTHER: cộng lại quantity_returned (hàng trả về kho)
     * - DAMAGED: tăng quantity_damaged (hàng hỏng, không bán lại)
     * - NOT_RECEIVED: không thay đổi kho (hàng thất lạc)
     */
    private void restoreInventory(OrderReport report) {
        // Lý do mà hàng sẽ được trả lại kho (bán lại được)
        Set<String> returnableReasons = Set.of("WRONG_ITEM", "WRONG_COLOR", "MISSING_ITEM", "OTHER");
        // Lý do mà hàng bị hỏng (không bán lại)
        Set<String> damagedReasons = Set.of("DAMAGED");

        String reason = report.getReason();

        Optional<Order> orderOpt = orderRepository.findById(report.getOrderId());
        if (orderOpt.isEmpty()) return;

        Order order = orderOpt.get();
        List<OrderDetail> details = order.getOrderDetails();
        if (details == null || details.isEmpty()) return;

        for (OrderDetail detail : details) {
            int productId = detail.getProductId();
            int qty = detail.getQuantity();

            Optional<Inventory> invOpt = inventoryRepository.findById(productId);
            if (invOpt.isEmpty()) continue;

            Inventory inv = invOpt.get();

            if (returnableReasons.contains(reason)) {
                // Hàng trả lại kho → tăng quantity_returned (DB tự tính lại quantity)
                inv.setQuantityReturned((inv.getQuantityReturned() != null ? inv.getQuantityReturned() : 0) + qty);
            } else if (damagedReasons.contains(reason)) {
                // Hàng hỏng → tăng quantity_damaged
                inv.setQuantityDamaged((inv.getQuantityDamaged() != null ? inv.getQuantityDamaged() : 0) + qty);
            }
            // NOT_RECEIVED: không thay đổi kho

            inventoryRepository.save(inv);
        }
    }

    /**
     * Helper: Lấy userId từ session.
     */
    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }
}

package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.model.Order;
import com.project.web_hand_made_cd_web.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop/orders")
@CrossOrigin(origins = "*")
public class ShopOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable int id, @RequestParam int status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status); // 0: Chờ duyệt, 1: Đã duyệt, 2: Đang giao, 3: Hoàn thành, 4: Hủy
            orderRepository.save(order);
            return ResponseEntity.ok().body("Cập nhật trạng thái thành công");
        }).orElse(ResponseEntity.notFound().build());
    }
}
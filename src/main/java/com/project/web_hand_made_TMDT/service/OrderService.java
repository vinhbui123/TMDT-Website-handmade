package com.project.web_hand_made_TMDT.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.web_hand_made_TMDT.model.*;
import com.project.web_hand_made_TMDT.repository.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final GHNService ghnService;
    private final CouponRepository couponRepository;

    @Transactional
    public Order placeOrder(int userId, String paymentMethod, List<Integer> selectedProductIds, Map<String, Object> payload) {
        Cart cart = cartService.getCart();

        List<CartItem> itemsToOrder = cart.getItems().stream()
                .filter(item -> selectedProductIds.contains(item.getProductId()))
                .collect(Collectors.toList());

        if (itemsToOrder.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất một sản phẩm!");
        }

        int paymentId = "cash_on_delivery".equalsIgnoreCase(paymentMethod) ? 1 : 2;
        int selectedTotal = itemsToOrder.stream().mapToInt(CartItem::getSubtotal).sum();

        int shippingFee = payload.containsKey("shippingFee") ? Integer.parseInt(payload.get("shippingFee").toString()) : 0;

        Order order = Order.builder()
                .userId(userId)
                .status(0)
                .paymentTypeId(paymentId)
                .freeShipping(selectedTotal > 500000)
                .shippingFee(shippingFee)
                .build();

        Order savedOrder = orderRepository.save(order);

        for (CartItem item : itemsToOrder) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + item.getProductId()));

            if (product.getQuantity() < item.getQuantity()) {
                throw new RuntimeException("Sản phẩm \"" + product.getName() + "\" không đủ số lượng!");
            }

            OrderDetail detail = OrderDetail.builder()
                    .orderId(savedOrder.getId())
                    .productId(item.getProductId())
                    .price(item.getPrice())
                    .quantity(item.getQuantity())
                    .totalMoney(item.getSubtotal())
                    .discountPercentage(item.getDiscount())
                    .discountAmount((int)(item.getPrice() * item.getDiscount() / 100.0 * item.getQuantity()))
                    .status(0)
                    .customText(item.getCustomText())
                    .selectedColor(item.getSelectedColor())
                    .build();
            orderDetailRepository.save(detail);

            if (product.getInventory() != null) {
                int currentOut = product.getInventory().getQuantityOut() != null ? product.getInventory().getQuantityOut() : 0;
                product.getInventory().setQuantityOut(currentOut + item.getQuantity());
                productRepository.save(product);
            }

            cartService.removeProductFromCart(item.getProductId());
        }

        // Xử lý mã giảm giá nếu có
        if (payload.containsKey("couponCode") && payload.get("couponCode") != null) {
            String couponCode = payload.get("couponCode").toString().trim().toUpperCase();
            if (!couponCode.isEmpty()) {
                Optional<Coupon> couponOpt = couponRepository.findByCode(couponCode);
                if (couponOpt.isPresent()) {
                    Coupon coupon = couponOpt.get();
                    coupon.setUsedCount(coupon.getUsedCount() + 1);
                    couponRepository.save(coupon);
                }
            }
        }

        return savedOrder;
    }

    // PHẦN LẤY LỊCH SỬ ĐƠN HÀNG
    public List<Order> getUserOrders(int userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
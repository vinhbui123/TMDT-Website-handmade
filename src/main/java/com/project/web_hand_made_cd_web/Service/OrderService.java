package com.project.web_hand_made_cd_web.Service;

import com.project.web_hand_made_cd_web.Model.*;
import com.project.web_hand_made_cd_web.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    @Transactional
    public Order placeOrder(int userId, String paymentMethod, List<Integer> selectedProductIds) {
        Cart cart = cartService.getCart();

        List<CartItem> itemsToOrder = cart.getItems().stream()
                .filter(item -> selectedProductIds.contains(item.getProductId()))
                .collect(Collectors.toList());

        if (itemsToOrder.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất một sản phẩm!");
        }

        int paymentId = "cash_on_delivery".equalsIgnoreCase(paymentMethod) ? 1 : 2;
        int selectedTotal = itemsToOrder.stream().mapToInt(CartItem::getSubtotal).sum();

        Order order = Order.builder()
                .userId(userId)
                .status(0)
                .paymentTypeId(paymentId)
                .freeShipping(selectedTotal > 500000)
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
                    .build();
            orderDetailRepository.save(detail);

            product.setQuantity(product.getQuantity() - item.getQuantity());
            productRepository.save(product);

            cartService.removeProductFromCart(item.getProductId());
        }

        return savedOrder;
    }

    // PHẦN LẤY LỊCH SỬ ĐƠN HÀNG
    public List<Order> getUserOrders(int userId) {
        // Sau khi ông thêm @OneToMany(fetch = FetchType.EAGER) vào Model Order,
        // hàm này sẽ tự động lấy kèm list OrderDetails và Product bên trong.
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
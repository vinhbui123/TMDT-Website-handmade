package com.project.web_hand_made_TMDT.model;

import lombok.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart implements Serializable {
    private static final long serialVersionUID = 1L;

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    public void addItem(CartItem item) {
        if (items == null) items = new ArrayList<>();
        items.stream()
                .filter(i -> i.getProductId() == item.getProductId())
                .findFirst()
                .ifPresentOrElse(
                        exist -> exist.setQuantity(exist.getQuantity() + item.getQuantity()), // Cộng dồn số lượng
                        () -> items.add(item)
                );
    }

    public void updateItemQuantity(int productId, int quantity) {
        if (items == null) return;
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        items.stream()
                .filter(i -> i.getProductId() == productId)
                .findFirst()
                .ifPresent(item -> item.setQuantity(quantity));
    }

    public void removeItem(int productId) {
        items.removeIf(i -> i.getProductId() == productId);
    }

    public int calculateTotal() {
        return items.stream().mapToInt(CartItem::getSubtotal).sum();
    }

    // Hàm cực kỳ quan trọng để trả về số lượng hiển thị trên icon giỏ hàng
    public int getTotalQuantity() {
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }

    public int getItemQuantity(int productId) {
        return items.stream()
                .filter(i -> i.getProductId() == productId)
                .mapToInt(CartItem::getQuantity)
                .sum();
    }
}
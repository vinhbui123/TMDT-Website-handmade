package com.project.web_hand_made_TMDT.service;

import com.project.web_hand_made_TMDT.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.web_hand_made_TMDT.repository.DbCartItemRepository;
import com.project.web_hand_made_TMDT.repository.ProductCustomizeFieldRepository;
import com.project.web_hand_made_TMDT.repository.ProductRepository;
import com.project.web_hand_made_TMDT.repository.UserRepository;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequiredArgsConstructor
public class CartService {

    private final ProductRepository productRepository;
    private final DbCartItemRepository dbCartItemRepository;
    private final UserRepository userRepository;
    private final ProductCustomizeFieldRepository customizeFieldRepository;
    private final HttpSession session;

    private Cart sessionCart = new Cart();

    private Integer getUserId() {
        return (Integer) session.getAttribute("userId");
    }

    public Cart getCart() {
        Integer userId = getUserId();
        if (userId != null) {
            return getDbCart(userId);
        }
        return sessionCart;
    }

    private Cart getDbCart(Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return new Cart();

        List<DbCartItem> dbItems = dbCartItemRepository.findByUser(user);
        Cart cart = new Cart();
        for (DbCartItem dbItem : dbItems) {
            Product product = dbItem.getProduct();
            int surcharge = calculateCustomSurcharge(product.getId(), dbItem.getCustomText());
            CartItem cartItem = CartItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImage(product.getImg())
                    .price(product.getPrice() + surcharge)
                    .quantity(dbItem.getQuantity())
                    .discount(product.getDiscount())
                    .customText(dbItem.getCustomText())
                    .selectedColor(dbItem.getSelectedColor())
                    .build();
            cart.getItems().add(cartItem);
        }
        return cart;
    }

    @Transactional
    public Cart addProductToCart(int productId, int quantity, String customText, String selectedColor) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        Integer userId = getUserId();
        
        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow();
            Cart currentCart = getDbCart(userId);
            int currentInCart = currentCart.getItemQuantity(productId);
            if (currentInCart + quantity > product.getQuantity()) {
                throw new RuntimeException("Kho chỉ còn " + product.getQuantity() + " sản phẩm.");
            }

            List<DbCartItem> userItems = dbCartItemRepository.findByUser(user);
            Optional<DbCartItem> existingItemOpt = userItems.stream().filter(item -> 
                item.getProduct().getId() == productId &&
                Objects.equals(item.getCustomText(), customText) &&
                Objects.equals(item.getSelectedColor(), selectedColor)
            ).findFirst();

            if (existingItemOpt.isPresent()) {
                DbCartItem existingItem = existingItemOpt.get();
                existingItem.setQuantity(existingItem.getQuantity() + quantity);
                dbCartItemRepository.save(existingItem);
            } else {
                DbCartItem newItem = DbCartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(quantity)
                        .customText(customText)
                        .selectedColor(selectedColor)
                        .build();
                dbCartItemRepository.save(newItem);
            }
            return getDbCart(userId);
        } else {
            // Guest mode
            int currentInCart = sessionCart.getItemQuantity(productId);
            if (currentInCart + quantity > product.getQuantity()) {
                throw new RuntimeException("Kho chỉ còn " + product.getQuantity() + " sản phẩm.");
            }

            int surcharge = calculateCustomSurcharge(product.getId(), customText);
            CartItem cartItem = CartItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImage(product.getImg())
                    .price(product.getPrice() + surcharge)
                    .quantity(quantity)
                    .discount(product.getDiscount())
                    .customText(customText)
                    .selectedColor(selectedColor)
                    .build();

            sessionCart.addItem(cartItem);
            return sessionCart;
        }
    }

    @Transactional
    public Cart updateProductQuantity(int productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (quantity > product.getQuantity()) {
            throw new RuntimeException("Số lượng vượt quá tồn kho (" + product.getQuantity() + ")");
        }

        Integer userId = getUserId();
        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow();
            if (quantity <= 0) {
                removeProductFromCart(productId);
            } else {
                List<DbCartItem> userItems = dbCartItemRepository.findByUser(user);
                for (DbCartItem item : userItems) {
                    if (item.getProduct().getId() == productId) {
                        item.setQuantity(quantity);
                        dbCartItemRepository.save(item);
                    }
                }
            }
            return getDbCart(userId);
        } else {
            if (quantity <= 0) {
                sessionCart.removeItem(productId);
            } else {
                sessionCart.updateItemQuantity(productId, quantity);
            }
            return sessionCart;
        }
    }

    @Transactional
    public Cart removeProductFromCart(int productId) {
        Integer userId = getUserId();
        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow();
            List<DbCartItem> userItems = dbCartItemRepository.findByUser(user);
            for (DbCartItem item : userItems) {
                if (item.getProduct().getId() == productId) {
                    dbCartItemRepository.delete(item);
                }
            }
            return getDbCart(userId);
        } else {
            sessionCart.removeItem(productId);
            return sessionCart;
        }
    }

    @Transactional
    public void clearCart() {
        Integer userId = getUserId();
        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow();
            dbCartItemRepository.deleteByUser(user);
        } else {
            this.sessionCart = new Cart();
        }
    }

    @Transactional
    public void mergeSessionCartToDb(Integer userId) {
        if (sessionCart == null || sessionCart.getItems().isEmpty()) {
            return;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        List<DbCartItem> userItems = dbCartItemRepository.findByUser(user);

        for (CartItem sessionItem : sessionCart.getItems()) {
            Product product = productRepository.findById(sessionItem.getProductId()).orElse(null);
            if (product == null) continue;

            Optional<DbCartItem> existingItemOpt = userItems.stream().filter(item -> 
                item.getProduct().getId() == sessionItem.getProductId() &&
                Objects.equals(item.getCustomText(), sessionItem.getCustomText()) &&
                Objects.equals(item.getSelectedColor(), sessionItem.getSelectedColor())
            ).findFirst();

            if (existingItemOpt.isPresent()) {
                DbCartItem existingItem = existingItemOpt.get();
                // Gộp số lượng
                int newQuantity = existingItem.getQuantity() + sessionItem.getQuantity();
                if (newQuantity > product.getQuantity()) {
                    newQuantity = product.getQuantity(); // Không vượt quá tồn kho
                }
                existingItem.setQuantity(newQuantity);
                dbCartItemRepository.save(existingItem);
            } else {
                DbCartItem newItem = DbCartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(sessionItem.getQuantity())
                        .customText(sessionItem.getCustomText())
                        .selectedColor(sessionItem.getSelectedColor())
                        .build();
                dbCartItemRepository.save(newItem);
                userItems.add(newItem); // Để tránh add trùng nếu session có trùng item (dù ít khi xảy ra)
            }
        }
        
        // Clear session cart sau khi merge
        sessionCart.getItems().clear();
    }

    private int calculateCustomSurcharge(int productId, String customText) {
        if (customText == null || customText.isEmpty()) return 0;
        int surcharge = 0;
        try {
            List<ProductCustomizeField> fields = customizeFieldRepository.findByProductIdOrderBySortOrderAsc(productId);
            if (fields == null || fields.isEmpty()) return 0;

            String[] parts = customText.split(" \\| ");
            for (String part : parts) {
                String[] kv = part.split(": ", 2);
                if (kv.length < 2) continue;
                String label = kv[0].trim();
                String selectedValue = kv[1].trim();

                for (ProductCustomizeField field : fields) {
                    if ("select".equalsIgnoreCase(field.getFieldType()) && field.getFieldLabel().trim().equals(label)) {
                        String optionsStr = field.getOptions();
                        String pricesStr = field.getOptionPrices();
                        if (optionsStr != null && pricesStr != null) {
                            String[] options = optionsStr.split(",");
                            String[] prices = pricesStr.split(",");
                            for (int i = 0; i < options.length; i++) {
                                if (options[i].trim().equals(selectedValue)) {
                                    if (i < prices.length) {
                                        surcharge += Integer.parseInt(prices[i].trim());
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi tính surcharge: " + e.getMessage());
        }
        return surcharge;
    }
}
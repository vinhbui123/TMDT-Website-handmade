package com.project.web_hand_made_TMDT.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Service;

import com.project.web_hand_made_TMDT.model.Cart;
import com.project.web_hand_made_TMDT.model.CartItem;
import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.repository.ProductRepository;

@Service
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequiredArgsConstructor
public class CartService {

    private final ProductRepository productRepository;
    private Cart cart = new Cart();

    public Cart addProductToCart(int productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        int currentInCart = cart.getItemQuantity(productId);
        if (currentInCart + quantity > product.getQuantity()) {
            throw new RuntimeException("Kho chỉ còn " + product.getQuantity() + " sản phẩm.");
        }

        CartItem cartItem = CartItem.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productImage(product.getImg())
                .price(product.getPrice())
                .quantity(quantity)
                .discount(product.getDiscount())
                .build();

        cart.addItem(cartItem);
        return cart;
    }

    public Cart updateProductQuantity(int productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (quantity > product.getQuantity()) {
            throw new RuntimeException("Số lượng vượt quá tồn kho (" + product.getQuantity() + ")");
        }

        if (quantity <= 0) {
            cart.removeItem(productId);
        } else {
            cart.updateItemQuantity(productId, quantity);
        }
        return cart;
    }

    public Cart removeProductFromCart(int productId) {
        cart.removeItem(productId);
        return cart;
    }

    public Cart getCart() {
        return cart;
    }

    public void clearCart() {
        this.cart = new Cart();
    }

}
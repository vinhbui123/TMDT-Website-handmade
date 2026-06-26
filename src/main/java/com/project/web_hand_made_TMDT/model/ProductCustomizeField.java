package com.project.web_hand_made_TMDT.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_customize_fields")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCustomizeField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "field_label", nullable = false, length = 100)
    private String fieldLabel;

    // "text", "textarea", "select"
    @Column(name = "field_type", nullable = false, length = 20)
    private String fieldType;

    @Column(name = "placeholder", length = 255)
    private String placeholder;

    // Cho field_type="select": các option cách nhau bằng dấu phẩy. VD: "Ngắn,Vừa,Dài"
    @Column(name = "options", columnDefinition = "TEXT")
    private String options;

    // Giá cộng thêm tương ứng với các options. VD: "0,5000,10000"
    @Column(name = "option_prices", columnDefinition = "TEXT")
    private String optionPrices;

    @Column(name = "max_length")
    private Integer maxLength;

    @Column(name = "is_required")
    private Boolean isRequired;

    @Column(name = "sort_order")
    private Integer sortOrder;
}

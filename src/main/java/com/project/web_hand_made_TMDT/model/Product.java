package com.project.web_hand_made_TMDT.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Formula;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "catalog_id")
    private Integer catalog_id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    @Column(name = "name")
    private String name;

    @Column(name = "img")
    private String img;

    @Column(name = "price")
    private Integer price;

    @Column(name = "discount")
    private Integer discount;

    @Column(name = "view")
    private Integer view;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private Date created_at;

    @Column(name = "updated_at")
    private Date updated_at;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "img_path")
    private List<String> subImg;

    // Lấy thông tin từ bảng inventory thông qua relationship
    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL)
    @PrimaryKeyJoinColumn
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Inventory inventory;

    // Custom getter để giữ nguyên logic cũ getQuantity()
    public int getQuantity() {
        return inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
    }

    @Transient
    private Integer stock; // Biến tạm để tính toán nếu cần

    // Kết nối bảng màu sắc
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "product_color",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "color_id")
    )
    private Set<Color> colors = new HashSet<>();

    // Kết nối bảng chất liệu (Lấy từ bản của Vinh)
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "product_materials",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "material_id")
    )
    private Set<Material> materials = new HashSet<>();

    @Formula("(SELECT COALESCE(AVG(f.rating), 0) FROM comments f WHERE f.product_id = id)")
    private Double averageRating;

    @OneToMany(mappedBy = "product")
    @JsonIgnore
    private List<Comment> comments;
}
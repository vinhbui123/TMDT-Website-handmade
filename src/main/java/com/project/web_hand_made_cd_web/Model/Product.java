package com.project.web_hand_made_cd_web.Model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    private int id;

    @Column(name = "catalog_id")
    private int catalog_id;

    @Column(name = "name")
    private String name;

    @Column(name = "img")
    private String img;

    @Column(name = "price")
    private int price;

    @Column(name = "discount")
    private int discount;

    @Column(name = "view")
    private int view;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    private Date created_at;

    @Column(name = "updated_at")
    private Date updated_at;

    @Transient
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
    private int stock; // Biến tạm để tính toán nếu cần

    // Kết nối bảng màu sắc
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "product_color",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "color_id")
    )
    private List<Color> colors;

    // Kết nối bảng chất liệu (Lấy từ bản của Vinh)
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "product_materials",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "material_id")
    )
    private List<Material> materials;
}
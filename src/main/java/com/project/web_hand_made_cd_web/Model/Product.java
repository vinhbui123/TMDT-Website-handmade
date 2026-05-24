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

    // FIX: Đã xóa @Transient để nhận giá trị từ cột 'quantity' trong DB
    @Column(name = "quantity")
    private int quantity;

    @Transient
    private int stock;

    @ManyToMany(fetch = FetchType.EAGER) // THÊM DÒNG NÀY VÀO ĐÂY
    @JoinTable(
            name = "product_color",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "color_id")
    )
    private List<Color> colors;
}
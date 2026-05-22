package com.project.web_hand_made_cd_web.Model;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "products")
@Data // Tự động tạo Getter, Setter, toString, equals, hashCode
@NoArgsConstructor // Tạo constructor không tham số (bắt buộc cho JPA)
@AllArgsConstructor // Tạo constructor đầy đủ tham số
@Builder
public class Product {
    @Id
    private int id;
    @Column
    private int catalog_id;
    @Column
    private String name;
    @Column
    private String img;
    @Column
    private int price;
    @Column
    private int discount;
    @Column
    private int view;
    @Column
    private String description;
    @Column
    private Date created_at;
    @Column
    private Date updated_at;
    @Transient
    private List<String> subImg;
    @Transient // Hibernate will not look for this in the database
    private int quantity;
    @Transient // Hibernate will not look for this in the database
    private int stock;
    @ManyToMany
    @JoinTable(
            name = "product_color", // The name of your junction table in SQL
            joinColumns = @JoinColumn(name = "product_id"), // FK to products table
            inverseJoinColumns = @JoinColumn(name = "color_id") // FK to colors table
    )
    private List<Color> colors;

    @ManyToMany
    @JoinTable(
            name = "product_materials",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "material_id")
    )
    private List<Material> materials;
}


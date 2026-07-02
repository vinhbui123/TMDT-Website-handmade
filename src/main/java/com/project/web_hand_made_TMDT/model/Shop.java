package com.project.web_hand_made_TMDT.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.List;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "shops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    public Integer getId() {
        return id;
    }

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Transient
    @JsonProperty("userId")
    public Integer getOwnerId() {
        return user != null ? user.getId() : null;
    }

    @Column(name = "shop_name")
    private String shopName;

    @Column(name = "shop_logo")
    private String shopLogo;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "shop_address")
    private String shopAddress;

    @Formula("(SELECT COALESCE(AVG(c.rating), 0) FROM comments c JOIN products p ON c.product_id = p.id WHERE p.shop_id = id)")
    private Double rating;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "identity_card_number")
    private String identityCardNumber;

    @Column(name = "identity_card_front")
    private String identityCardFront;

    @Column(name = "identity_card_back")
    private String identityCardBack;

    @Column(name = "tax_code")
    private String taxCode;

    // 0 = Pending, 1 = Approved, 2 = Rejected
    private Integer status = 0;

    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Product> products;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}

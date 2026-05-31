package com.project.web_hand_made_TMDT.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "materials")
@Data // Tự động tạo Getter, Setter, toString, equals, hashCode
@NoArgsConstructor // Tạo constructor không tham số (bắt buộc cho JPA)
@AllArgsConstructor // Tạo constructor đầy đủ tham số
@Builder
public class Material {
    @Id
    private int id;
    @Column(name = "name")
    private String name;
}


package com.project.web_hand_made_cd_web.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "colors")
@Data // Tự động tạo Getter, Setter, toString, equals, hashCode
@NoArgsConstructor // Tạo constructor không tham số (bắt buộc cho JPA)
@AllArgsConstructor // Tạo constructor đầy đủ tham số
@Builder
public class Color {
    @Id
    private int id;
    @Column(name = "name")
    private String name;
}


package com.project.web_hand_made_cd_web.Dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductDTO {

    private Integer id;

    private String name;

    private String img;

    private Integer price;

    private Integer discount;

    private List<ColorDTO> colors;

    private List<MaterialDTO> materials;

    private Double rating;
}
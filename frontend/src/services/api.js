const BASE_URL = "http://localhost:8080/api";

// Lấy danh sách sản phẩm
export const getProducts = async (page = 0, size = 12, sort = "default", colorId = null, materialId, maxPrice, keyword = null) => {
  try {
    // Tự nối các tham số phân trang vào URL
    let url = `${BASE_URL}/products/page?page=${page}&size=${size}&sort=${sort}`;

    if (colorId) {
      url += `&colorId=${colorId}`;
    }

    if (materialId) {
      url += `&materialId=${materialId}`;
    }

    if (maxPrice) {
      url += `&maxPrice=${maxPrice}`;
    }
    
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Lỗi mạng! Mã lỗi: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    throw error;
  }
};
package com.project.web_hand_made_TMDT.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GHNService {

    private final RestTemplate restTemplate;

    // Hardcoded for now (as requested)
    private static final String TOKEN = "53953c8b-4c11-11f1-a973-aee5264794df";
    private static final int SHOP_ID = 200253;
    public static final int FROM_DISTRICT_ID = 1463;

    private static final String BASE_URL_V2 = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2";
    private static final String BASE_URL_MASTER = "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data";

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", TOKEN);
        headers.set("ShopId", String.valueOf(SHOP_ID));
        return headers;
    }

    private HttpHeaders createHeadersNoShop() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", TOKEN);
        return headers;
    }

    public Object getProvinces() {
        try {
            String url = BASE_URL_MASTER + "/province";
            HttpEntity<String> entity = new HttpEntity<>(createHeadersNoShop());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return response.getBody().get("data");
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Object getDistricts(int provinceId) {
        try {
            String url = BASE_URL_MASTER + "/district?province_id=" + provinceId;
            HttpEntity<String> entity = new HttpEntity<>(createHeadersNoShop());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return response.getBody().get("data");
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Object getWards(int districtId) {
        try {
            String url = BASE_URL_MASTER + "/ward?district_id=" + districtId;
            HttpEntity<String> entity = new HttpEntity<>(createHeadersNoShop());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return response.getBody().get("data");
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public int calculateFee(int toDistrictId, String toWardCode, int totalWeight, int length, int width, int height, int insuranceValue, List<Map<String, Object>> items) {
        try {
            String url = BASE_URL_V2 + "/shipping-order/fee";
            
            // Default sizes if 0
            if (totalWeight < 10) totalWeight = 10;
            if (length < 1) length = 1;
            if (width < 1) width = 1;
            if (height < 1) height = 1;

            int dimensionalWeight = (length * width * height) / 5;
            int finalChargeWeight = Math.max(totalWeight, dimensionalWeight);
            int serviceTypeId = (finalChargeWeight > 20000) ? 5 : 2;

            Map<String, Object> body = new HashMap<>();
            body.put("from_district_id", FROM_DISTRICT_ID);
            body.put("to_district_id", toDistrictId);
            body.put("to_ward_code", toWardCode);
            body.put("service_type_id", serviceTypeId);
            body.put("weight", totalWeight);
            body.put("length", length);
            body.put("width", width);
            body.put("height", height);
            body.put("insurance_value", insuranceValue);
            body.put("cod_failed_amount", 0);
            body.put("items", items);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            Map<String, Object> resBody = response.getBody();
            if (resBody != null && resBody.containsKey("data") && resBody.get("data") != null) {
                Map<String, Object> data = (Map<String, Object>) resBody.get("data");
                return Integer.parseInt(data.get("total").toString());
            }
        } catch (Exception e) {
            System.err.println("[GHN_CALCULATE_FEE] Error: " + e.getMessage());
        }
        return 0; 
    }

    public String createShippingOrder(String toName, String toPhone, String addressDetail, String wardCode, int districtId, int codAmount, List<Map<String, Object>> items) {
        try {
            String url = BASE_URL_V2 + "/shipping-order/create";

            Map<String, Object> body = new HashMap<>();
            body.put("payment_type_id", codAmount > 0 ? 2 : 1); // 1: Shop trả phí, 2: Người nhận trả phí (COD) - Nếu COD = 0 thì shop đã thu trước qua VNPay
            body.put("note", "Hàng dễ vỡ, xin nhẹ tay");
            body.put("required_note", "CHOXEMHANGKHONGTHU");
            body.put("to_name", toName);
            body.put("to_phone", toPhone);
            body.put("to_address", addressDetail);
            body.put("to_ward_code", wardCode);
            body.put("to_district_id", districtId);
            body.put("cod_amount", codAmount);

            // Default dimensions
            body.put("weight", 500);
            body.put("length", 20);
            body.put("width", 15);
            body.put("height", 10);
            
            body.put("service_type_id", 2);
            body.put("items", items);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            Map<String, Object> resBody = response.getBody();
            if (resBody != null && resBody.containsKey("data") && resBody.get("data") != null) {
                Map<String, Object> data = (Map<String, Object>) resBody.get("data");
                return data.get("order_code").toString();
            }
        } catch (Exception e) {
            System.err.println("[GHN_CREATE_ORDER] Error: " + e.getMessage());
        }
        return null;
    }
}

package com.project.web_hand_made_TMDT.service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class OtpService {
    
    // Store OTPs with their expiration time (email -> OTPData)
    private final Map<String, OTPData> otpCache = new ConcurrentHashMap<>();
    
    private static final long EXPIRE_MINS = 5;

    public String generateOtp(String email) {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // Generate 6 digit OTP
        String otpStr = String.valueOf(otp);
        
        long expiryTime = System.currentTimeMillis() + (EXPIRE_MINS * 60 * 1000);
        otpCache.put(email, new OTPData(otpStr, expiryTime));
        
        return otpStr;
    }

    public boolean verifyOtp(String email, String otp) {
        OTPData data = otpCache.get(email);
        if (data == null) {
            return false;
        }
        
        if (data.expiryTime < System.currentTimeMillis()) {
            otpCache.remove(email); // OTP expired
            return false;
        }
        
        return data.otp.equals(otp);
    }
    
    public void clearOtp(String email) {
        otpCache.remove(email);
    }

    private static class OTPData {
        String otp;
        long expiryTime;

        OTPData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}

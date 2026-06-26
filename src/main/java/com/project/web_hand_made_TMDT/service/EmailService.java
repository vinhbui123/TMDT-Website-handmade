package com.project.web_hand_made_TMDT.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã xác nhận khôi phục mật khẩu - HandMade");
        message.setText("Chào bạn,\n\n"
                + "Bạn đã yêu cầu khôi phục mật khẩu. Dưới đây là mã OTP của bạn:\n\n"
                + "Mã OTP: " + otp + "\n\n"
                + "Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ HandMade");

        mailSender.send(message);
    }
}

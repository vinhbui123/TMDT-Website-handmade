import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/Login.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    
    // Form data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Status
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message);
                setStep(2); // Go to OTP step
            } else {
                setError(data.message || 'Lỗi gửi email.');
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message);
                setStep(3); // Go to Reset Password step
            } else {
                setError(data.message || 'Mã OTP không hợp lệ.');
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message);
                setTimeout(() => navigate('/login'), 2000); // Redirect to login
            } else {
                setError(data.message || 'Đổi mật khẩu thất bại.');
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-screen">
                <div className="login-title">
                    <h3>Khôi phục mật khẩu</h3>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Step 1: Nhập Email */}
                {step === 1 && (
                    <form className="login-form" onSubmit={handleSendEmail}>
                        <p style={{textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#555'}}>
                            Vui lòng nhập địa chỉ email bạn đã đăng ký để nhận mã xác minh.
                        </p>
                        <div className="login__field">
                            <i className="login__icon fas fa-envelope"></i>
                            <input
                                type="email"
                                className="login__input"
                                placeholder="Email của bạn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login__submit" disabled={loading}>
                            <span className="button__text">{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</span>
                        </button>
                    </form>
                )}

                {/* Step 2: Nhập OTP */}
                {step === 2 && (
                    <form className="login-form" onSubmit={handleVerifyOtp}>
                        <p style={{textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#555'}}>
                            Mã OTP 6 số đã được gửi đến email <strong>{email}</strong>. Mã này sẽ hết hạn trong 5 phút.
                        </p>
                        <div className="login__field">
                            <i className="login__icon fas fa-key"></i>
                            <input
                                type="text"
                                className="login__input"
                                placeholder="Nhập mã OTP (VD: 123456)"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength="6"
                            />
                        </div>
                        <button type="submit" className="login__submit" disabled={loading}>
                            <span className="button__text">{loading ? 'Đang xác minh...' : 'Xác minh OTP'}</span>
                        </button>
                        <div style={{textAlign: 'center', marginTop: '15px'}}>
                            <button type="button" onClick={() => setStep(1)} style={{background:'none', border:'none', color:'#1877f2', cursor:'pointer'}}>
                                Trở lại
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: Đổi mật khẩu */}
                {step === 3 && (
                    <form className="login-form" onSubmit={handleResetPassword}>
                        <p style={{textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#555'}}>
                            Mã OTP hợp lệ! Hãy nhập mật khẩu mới của bạn.
                        </p>
                        <div className="login__field">
                            <i className="login__icon fas fa-lock"></i>
                            <input
                                type="password"
                                className="login__input"
                                placeholder="Mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="login__field">
                            <i className="login__icon fas fa-lock"></i>
                            <input
                                type="password"
                                className="login__input"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login__submit" disabled={loading}>
                            <span className="button__text">{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
                        </button>
                    </form>
                )}

                <div className="login__options">
                    <Link to="/login" className="login__link">Quay lại trang Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

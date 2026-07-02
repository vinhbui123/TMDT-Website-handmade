import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Đăng ký thành công! Đang chuyển hướng...');
                // Save user info to local storage for auto-login
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.dispatchEvent(new Event('storage')); // Trigger App.jsx to update header
                }
                setTimeout(() => navigate('/'), 1000);
            } else {
                setError(data.message || 'Đăng ký thất bại.');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server.');
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-inner">
                <form className="register-form" onSubmit={handleRegister}>
                    <h3 className="register-title">Đăng Kí</h3>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="register-form-group">
                        <div className="register-form-wrapper">
                            <label>Họ</label>
                            <input
                                type="text"
                                name="firstName"
                                className="register-form-control"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="register-form-wrapper">
                            <label>Tên</label>
                            <input
                                type="text"
                                name="lastName"
                                className="register-form-control"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="register-form-wrapper">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="register-form-control"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="register-form-wrapper">
                        <label>Tên người dùng</label>
                        <input
                            type="text"
                            name="username"
                            className="register-form-control"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="register-form-wrapper">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            className="register-form-control"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            pattern="^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$"
                            title="Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!)"
                        />
                    </div>

                    <div className="register-form-wrapper">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="register-form-control"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="register-checkbox">
                        <label>
                            <input type="checkbox" required />
                            Tôi chấp nhận Điều khoản sử dụng & Chính sách bảo mật.
                        </label>
                    </div>

                    <div className="register-submit-btn">
                        <button type="submit">Đăng Kí Ngay</button>
                    </div>

                    <div className="login-redirect">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;

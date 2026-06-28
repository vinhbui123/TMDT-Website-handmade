import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/UpdateProfile.css';

const UpdateProfile = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (res.ok) {
                    const user = await res.json();
                    setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
                    setEmail(user.email || '');
                    setPhoneNumber(user.phoneNumber || '');
                    setAddress(user.address || '');
                    setBio(user.bio || '');
                    setAvatarUrl(user.avatar || '');
                } else {
                    navigate('/login');
                }
            } catch (err) {
                setError('Không thể tải thông tin người dùng.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('phoneNumber', phoneNumber);
        formData.append('address', address);
        formData.append('bio', bio);
        if (avatarFile) {
            formData.append('avatarUpload', avatarFile);
        }

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccess(data.message || 'Cập nhật thông tin thành công.');
                window.dispatchEvent(new Event('storage')); // Trigger header update
            } else {
                setError(data.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server.');
        }
    };

    if (loading) return <div className="profile-container"><p>Đang tải...</p></div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <form onSubmit={handleSubmit}>
                    <div className="profile-header">
                        <h3>Thông Tin Tài Khoản</h3>
                        <p>Quản lý thông tin cá nhân của bạn</p>
                    </div>

                    {error && <div className="profile-alert error"><i className="fas fa-exclamation-circle" style={{marginRight: '8px'}}></i>{error}</div>}
                    {success && <div className="profile-alert success"><i className="fas fa-check-circle" style={{marginRight: '8px'}}></i>{success}</div>}

                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrapper">
                            <img 
                                src={avatarUrl || '/images/default-avatar.png'} 
                                alt="Avatar" 
                                className="profile-avatar-img" 
                                onError={(e) => { e.target.src = '/images/default-avatar.png' }}
                            />
                            <div className="profile-avatar-upload-btn" onClick={() => fileInputRef.current.click()}>
                                <i className="fas fa-camera"></i> Thay đổi
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="profile-file-input" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="profile-form-grid">
                        <div className="profile-input-group">
                            <label>Họ và Tên</label>
                            <input
                                type="text"
                                className="profile-input"
                                placeholder="Nhập họ và tên"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                            <i className="fas fa-user"></i>
                        </div>

                        <div className="profile-input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="profile-input"
                                placeholder="Nhập email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <i className="fas fa-envelope"></i>
                        </div>

                        <div className="profile-input-group">
                            <label>Số Điện Thoại</label>
                            <input
                                type="text"
                                className="profile-input"
                                placeholder="Nhập số điện thoại"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            <i className="fas fa-phone"></i>
                        </div>

                        <div className="profile-input-group">
                            <label>Địa Chỉ</label>
                            <input
                                type="text"
                                className="profile-input"
                                placeholder="Nhập địa chỉ"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            <i className="fas fa-map-marker-alt"></i>
                        </div>

                        <div className="profile-input-group full-width">
                            <label>Tiểu Sử (Bio)</label>
                            <textarea
                                className="profile-textarea"
                                placeholder="Viết vài dòng giới thiệu về bản thân..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                            <i className="fas fa-info-circle" style={{top: '30px'}}></i>
                        </div>

                        <button type="submit" className="profile-btn">
                            <i className="fas fa-save" style={{marginRight: '8px'}}></i> Lưu Thay Đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateProfile;

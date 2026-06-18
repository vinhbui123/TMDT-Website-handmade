import React from 'react';

// Giao diện Móc khóa (Có kiểm tra xem có phải Móc khóa Gỗ không)
export const KeychainCustomizer = ({ customData, setCustomData, materials }) => {
    const isWood = materials?.some(m => m.name.trim().toLowerCase() === 'gỗ');

    return (
        <div className="customizer-box" style={{ margin: '15px 0', padding: '15px', backgroundColor: '#f9f9f9', border: '1px dashed #c97a3e', borderRadius: '8px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                <i className="fa-solid fa-key"></i> Tùy chỉnh Móc Khóa {isWood ? '(Khắc gỗ)' : '(In màu)'}
            </p>
            <input
                type="text"
                placeholder={isWood ? "Nhập tên muốn khắc (Tối đa 10 chữ cái)..." : "Nhập nội dung in..."}
                maxLength="10"
                value={customData.nameToEngrave || ''}
                onChange={(e) => setCustomData({ ...customData, nameToEngrave: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
        </div>
    );
};

// Giao diện Combo quà tặng
export const GiftComboCustomizer = ({ customData, setCustomData }) => {
    return (
        <div className="customizer-box" style={{ margin: '15px 0', padding: '15px', backgroundColor: '#f9f9f9', border: '1px dashed #c97a3e', borderRadius: '8px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                <i className="fa-solid fa-envelope-open-text"></i> Ghi chú cho Thiệp chúc mừng
            </p>
            <textarea
                placeholder="Nhập lời chúc của bạn (Shop sẽ viết tay lên thiệp nhé)..."
                rows="3"
                value={customData.greetingMessage || ''}
                onChange={(e) => setCustomData({ ...customData, greetingMessage: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
            />
        </div>
    );
};

// Giao diện Hoa len
export const WoolFlowerCustomizer = ({ customData, setCustomData, materials }) => {
    return (
        <div className="customizer-box" style={{ margin: '15px 0', padding: '15px', backgroundColor: '#f9f9f9', border: '1px dashed #c97a3e', borderRadius: '8px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                <i className="fa-brands fa-pagelines"></i> Chọn màu giấy gói hoa
            </p>
            <select
                value={customData.wrapperColor || ''}
                onChange={(e) => setCustomData({ ...customData, wrapperColor: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
                <option value="">-- Chọn màu giấy --</option>
                <option value="vintage">Giấy Kraft Vintage (Nâu)</option>
                <option value="pastel_pink">Hồng Pastel ngọt ngào</option>
                <option value="white">Trắng tinh khôi</option>
            </select>
        </div>
    );
};

// Giao diện Phụ kiện
export const AccessoryCustomizer = ({ product, customData, setCustomData }) => {
    const productName = (product?.name || '').toLowerCase();

    const isBracelet = productName.includes('vòng tay');
    const isBag = productName.includes('túi');
    const isHairClip = productName.includes('cài tóc') || productName.includes('kẹp tóc');
    const isNecklace = productName.includes('dây chuyền');

    return (
        <div className="customizer-box" style={{ margin: '15px 0', padding: '15px', backgroundColor: '#f9f9f9', border: '1px dashed #c97a3e', borderRadius: '8px' }}>
            <p style={{ fontWeight: 600, marginBottom: '12px' }}>
                <i className="fa-solid fa-wand-magic-sparkles"></i> Tùy chỉnh Phụ kiện
            </p>

            {/* --- TRƯỜNG HỢP 1: VÒNG TAY --- */}
            {isBracelet && (
                <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>📏 Số đo cổ tay (cm):</label>
                    <input
                        type="number"
                        placeholder="Ví dụ: 15"
                        value={customData.wristSize || ''}
                        onChange={(e) => setCustomData({ ...customData, wristSize: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '10px' }}
                    />

                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>🔠 Chữ cái muốn mix (nếu có):</label>
                    <input
                        type="text"
                        placeholder="Nhập tối đa 10 chữ cái..."
                        maxLength="5"
                        value={customData.mixLetters || ''}
                        onChange={(e) => setCustomData({ ...customData, mixLetters: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                </div>
            )}

            {/* --- TRƯỜNG HỢP 2: TÚI LEN --- */}
            {isBag && (
                <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>👜 Chiều dài dây đeo:</label>
                    <select
                        value={customData.strapLength || ''}
                        onChange={(e) => setCustomData({ ...customData, strapLength: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="">-- Chọn chiều dài --</option>
                        <option value="ngan">Đeo kẹp nách (Ngắn)</option>
                        <option value="vua">Đeo chéo ngang hông (Vừa)</option>
                        <option value="dai">Đeo chéo dài (Dài)</option>
                    </select>
                </div>
            )}

            {/* --- TRƯỜNG HỢP 3: CÀI TÓC / KẸP TÓC --- */}
            {isHairClip && (
                <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>🎀 Loại kẹp:</label>
                    <select
                        value={customData.clipType || ''}
                        onChange={(e) => setCustomData({ ...customData, clipType: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="">-- Chọn loại kẹp --</option>
                        <option value="mo-vit">Kẹp mỏ vịt</option>
                        <option value="kep-bam">Kẹp bấm</option>
                        <option value="cot-toc">Dây chun cột</option>
                    </select>
                </div>
            )}

            {/* --- TRƯỜNG HỢP 4: DÂY CHUYỀN --- */}
            {isNecklace && (
                <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>📏 Số đo cổ (cm):</label>
                    <input
                        type="number"
                        placeholder="Ví dụ: 45"
                        value={customData.wristSize || ''}
                        onChange={(e) => setCustomData({ ...customData, wristSize: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '10px' }}
                    />
                </div>
            )}

            {/* --- TRƯỜNG HỢP 5: CÁC PHỤ KIỆN KHÁC --- */}
            {!isBracelet && !isBag && !isHairClip && (
                <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>📝 Ghi chú thiết kế riêng:</label>
                    <textarea
                        placeholder="Bạn muốn phối màu nào, hay có yêu cầu gì thêm cứ ghi chú ở đây nhé..."
                        value={customData.extraNote || ''}
                        onChange={(e) => setCustomData({ ...customData, extraNote: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '60px', resize: 'vertical' }}
                    />
                </div>
            )}
        </div>
    );
};
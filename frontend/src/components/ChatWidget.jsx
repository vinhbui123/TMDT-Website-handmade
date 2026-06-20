import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config.js';
import {
    collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, updateDoc, increment, where, or
} from 'firebase/firestore';

const ChatWidget = ({ product, user, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }) => {
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
    const setIsOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setLocalIsOpen;

    const [activeTab, setActiveTab] = useState('all');
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef(null);

    // ========================================================
    // ĐỒNG BỘ ĐỊNH DANH USER (HỖ TRỢ NGƯỜI BÁN ĐI MUA HÀNG)
    // ========================================================
    const currentUserId = user?.id ? String(user.id) : null;
    const currentRole = user?.role !== undefined ? Number(user.role) : 0;

    const currentUserName = user?.last_name || user?.username || "Ẩn danh";
    const currentUserAvatar = user?.avatar || "";

    // Phát hiện ID của Shop và Tên Shop từ sản phẩm đang xem
    const detectedShopId = product?.shop_id || product?.user_id || product?.userId || product?.shop?.id || product?.id_user;
    const detectedShopName = product?.shop_name || product?.shopName || product?.shop?.name || product?.user?.username || "Cửa hàng";

    const adminId = "1";
    const shopOwnerId = detectedShopId ? String(detectedShopId) : adminId;
    const shopOwnerName = detectedShopId ? detectedShopName : "Quản trị hệ thống (Admin)";

    // QUAN TRỌNG: Kiểm tra xem tài khoản hiện tại có phải chính là chủ của sản phẩm đang xem hay không
    const isActingAsBuyerForCurrentProduct = currentUserId && (currentUserId !== shopOwnerId);

    // Quy tắc tạo Room ID cố định giữa Người mua và Shop (Sắp xếp theo thứ tự bảng chữ cái)
    const activeProductRoomId = currentUserId
        ? [currentUserId, shopOwnerId].sort().join("_")
        : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Khi có sản phẩm đang xem và mình không phải chủ shop sản phẩm đó, tự động hướng mục tiêu chat vào phòng này
    useEffect(() => {
        if (isOpen && activeProductRoomId && isActingAsBuyerForCurrentProduct) {
            setSelectedRoomId(activeProductRoomId);
        }
    }, [isOpen, activeProductRoomId, isActingAsBuyerForCurrentProduct]);

    // 1. LẮNG NGHE REAL-TIME DANH SÁCH PHÒNG CHAT
    useEffect(() => {
        if (!currentUserId || !isOpen) return;

        const q = query(
            collection(db, "chats"),
            or(
                where("customerId", "==", currentUserId),
                where("shopId", "==", currentUserId)
            ),
            orderBy("updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChatRooms(rooms);

            // Tự động chọn phòng đầu tiên nếu chưa chọn phòng nào
            if (!selectedRoomId && rooms.length > 0) {
                setSelectedRoomId(rooms[0].id);
            }
        }, (error) => {
            console.error("Lỗi đồng bộ danh sách phòng chat Firebase:", error);
        });

        return () => unsubscribe();
    }, [currentUserId, isOpen]);

    // 2. LẮNG NGHE REAL-TIME TIN NHẮN TRONG PHÒNG ĐANG CHỌN
    useEffect(() => {
        if (!isOpen || !selectedRoomId) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, "chats", selectedRoomId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgList);
            setTimeout(scrollToBottom, 100);

            // Tự động đánh dấu "Đã xem" tin nhắn từ đối phương gửi tới
            snapshot.docs.forEach((msgDoc) => {
                const msgData = msgDoc.data();
                if (currentUserId && String(msgData.senderId) !== currentUserId && msgData.status !== 'seen') {
                    updateDoc(doc(db, "chats", selectedRoomId, "messages", msgDoc.id), {
                        status: 'seen'
                    }).catch(() => {});
                }
            });

            // Reset bộ đếm chưa đọc về 0 khi nhấp vào phòng chat đó
            updateDoc(doc(db, "chats", selectedRoomId), { unreadCount: 0 }).catch(() => {});
        }, (error) => {
            console.error("Lỗi đồng bộ tin nhắn:", error);
        });

        return () => unsubscribe();
    }, [isOpen, selectedRoomId, currentUserId]);

    // 3. HÀM XỬ LÝ GỬI TIN NHẮN
    const handleSendMessage = async (type = 'text', payload = {}) => {
        if (!currentUserId) {
            alert(`Vui lòng đăng nhập để thực hiện gửi tin nhắn.`);
            return;
        }

        const targetRoomId = selectedRoomId || activeProductRoomId;
        if (!targetRoomId) return;

        if (type === 'text' && !inputText.trim() && !payload.text) return;

        try {
            const chatRoomRef = doc(db, "chats", targetRoomId);
            const messagesCollectionRef = collection(db, "chats", targetRoomId, "messages");

            let lastMsgText = "";
            let messageBody = {
                senderId: currentUserId,
                senderName: currentUserName,
                senderRole: currentRole,
                type: type,
                status: 'sent',
                createdAt: new Date().toISOString()
            };

            if (type === 'text') {
                const textContent = payload.text || inputText;
                messageBody.text = textContent;
                lastMsgText = textContent;
            } else if (type === 'product') {
                messageBody.productInfo = payload.productInfo;
                lastMsgText = `[Sản phẩm] ${payload.productInfo.name}`;
            }

            const existingRoom = chatRooms.find(r => r.id === targetRoomId);

            const amIBuyerInThisRoom = existingRoom
                ? (existingRoom.customerId === currentUserId)
                : isActingAsBuyerForCurrentProduct;

            const chatRoomData = {
                chatId: targetRoomId,
                lastMessage: lastMsgText,
                updatedAt: new Date().toISOString(),

                // Thông tin Khách hàng
                customerId: amIBuyerInThisRoom ? currentUserId : (existingRoom?.customerId || targetRoomId.split('_')[0]),
                customerName: amIBuyerInThisRoom ? currentUserName : (existingRoom?.customerName || "Khách hàng"),
                customerAvatar: amIBuyerInThisRoom ? currentUserAvatar : (existingRoom?.customerAvatar || ""),

                // Thông tin Cửa hàng
                shopId: !amIBuyerInThisRoom ? currentUserId : shopOwnerId,
                shopName: !amIBuyerInThisRoom ? currentUserName : (existingRoom?.shopName || shopOwnerName)
            };

            await setDoc(chatRoomRef, chatRoomData, { merge: true });
            await updateDoc(chatRoomRef, { unreadCount: increment(1) }).catch(() => {});
            await addDoc(messagesCollectionRef, messageBody);

            if (!selectedRoomId) {
                setSelectedRoomId(targetRoomId);
            }

            if (type === 'text' && !payload.text) setInputText('');
        } catch (error) {
            console.error("Lỗi gửi tin nhắn/Tạo dữ liệu phòng chat:", error);
        }
    };

    const faqQuestions = [
        "Sản phẩm này có miễn phí vận chuyển không?",
        "Sản phẩm này có sẵn hàng không?",
        "Có thể thanh toán bằng COD được không?"
    ];

    // Lọc danh sách phòng chat hiển thị bên cột trái tùy theo vai trò linh động của từng phòng
    const filteredRooms = chatRooms.filter(room => {
        const iAmBuyerHere = room.customerId === currentUserId;
        const nameToSearch = iAmBuyerHere ? room.shopName : room.customerName;

        const matchesSearch = nameToSearch?.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'unread') {
            return matchesSearch && room.unreadCount > 0;
        }
        return matchesSearch;
    });

    const displayRooms = [...filteredRooms];

    // Hiển thị phòng chat mẫu khi chưa nhắn tin trước đây
    if (activeProductRoomId && !displayRooms.some(r => r.id === activeProductRoomId) && isActingAsBuyerForCurrentProduct) {
        displayRooms.unshift({
            id: activeProductRoomId,
            shopName: shopOwnerName,
            customerName: currentUserName,
            lastMessage: "Bấm vào để bắt đầu cuộc trò chuyện...",
            unreadCount: 0,
            customerId: currentUserId
        });
    }

    // Xác định vai trò tiêu đề hiển thị dựa trên phòng đang chọn hiện tại
    const currentSelectedRoom = chatRooms.find(r => r.id === selectedRoomId);
    const iAmBuyerInSelectedRoom = currentSelectedRoom ? (currentSelectedRoom.customerId === currentUserId) : isActingAsBuyerForCurrentProduct;

    // Lấy tên đối phương động dựa trên phòng đang xem để in lên Header cột phải
    const opposingName = currentSelectedRoom
        ? (iAmBuyerInSelectedRoom ? currentSelectedRoom.shopName : currentSelectedRoom.customerName)
        : shopOwnerName;

    return (
        <div className="shopee-chat-wrapper" style={{ position: 'fixed', bottom: '0px', right: '90px', zIndex: 9999, fontFamily: 'Arial, sans-serif' }}>

            {/* BONG BÓNG CHAT THU NHỎ */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ backgroundColor: '#ee4d2d', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px 12px 0 0', cursor: 'pointer', boxShadow: '0 -2px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}
                >
                    <i className="fas fa-comments"></i> Chat
                </button>
            )}

            {/* KHUNG GENERAL CHAT TOÀN DIỆN */}
            {isOpen && (
                <div style={{ width: '680px', height: '520px', backgroundColor: '#fff', borderRadius: '8px 8px 0 0', boxShadow: '0 4px 25px rgba(0,0,0,0.18)', display: 'flex', overflow: 'hidden', border: '1px solid #e8e8e8' }}>

                    {/* CỘT TRÁI: DANH SÁCH PHÒNG CHAT */}
                    <div style={{ width: '220px', borderRight: '1px solid #ececec', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                        <div style={{ padding: '10px', fontWeight: 'bold', fontSize: '16px', color: '#ee4d2d', borderBottom: '1px solid #f4f4f4' }}>Chat</div>

                        <div style={{ padding: '6px 10px' }}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm theo tên..."
                                style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid #e0e0e0', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', borderBottom: '1px solid #f4f4f4', fontSize: '13px', textAlign: 'center', cursor: 'pointer' }}>
                            <div onClick={() => setActiveTab('all')} style={{ flex: 1, padding: '8px 0', color: activeTab === 'all' ? '#ee4d2d' : '#555', borderBottom: activeTab === 'all' ? '2px solid #ee4d2d' : 'none', fontWeight: activeTab === 'all' ? 'bold' : 'normal' }}>Tất cả</div>
                            <div onClick={() => setActiveTab('unread')} style={{ flex: 1, padding: '8px 0', color: activeTab === 'unread' ? '#ee4d2d' : '#555', borderBottom: activeTab === 'unread' ? '2px solid #ee4d2d' : 'none', fontWeight: activeTab === 'unread' ? 'bold' : 'normal' }}>Chưa đọc</div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {displayRooms.length > 0 ? (
                                displayRooms.map((room) => {
                                    const isSelected = selectedRoomId === room.id;
                                    const iAmBuyerHere = room.customerId === currentUserId;
                                    const roomDisplayName = iAmBuyerHere ? room.shopName : room.customerName;
                                    return (
                                        <div
                                            key={room.id}
                                            onClick={() => setSelectedRoomId(room.id)}
                                            style={{ display: 'flex', padding: '10px', alignItems: 'center', gap: '8px', backgroundColor: isSelected ? '#fdf5f4' : '#fff', cursor: 'pointer', borderBottom: '1px solid #f9f9f9' }}
                                        >
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: iAmBuyerHere ? '#ee4d2d' : '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>
                                                {iAmBuyerHere ? "MUA" : "BÁN"}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontSize: '13px', fontWeight: isSelected ? 'bold' : '500', color: '#333' }}>
                                                    {roomDisplayName}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {room.lastMessage}
                                                </div>
                                            </div>
                                            {room.unreadCount > 0 && (
                                                <div style={{ backgroundColor: '#ee4d2d', color: '#fff', fontSize: '10px', minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                                                    {room.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px' }}>
                                    Chưa có người liên hệ
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: CHI TIẾT NỘI DUNG CUỘC TRÒ CHUYỆN */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9' }}>

                        <div style={{ padding: '12px', backgroundColor: '#fff', borderBottom: '1px solid #ececec', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                                {iAmBuyerInSelectedRoom ? `Mua hàng từ: ${opposingName}` : `Khách hàng: ${opposingName}`}
                            </span>
                            <span onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', color: '#888', fontSize: '13px' }}>Thu nhỏ ▽</span>
                        </div>

                        {product && (selectedRoomId === activeProductRoomId) && (
                            <div style={{ display: 'flex', padding: '8px 12px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={product.img} alt={product.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ maxWidth: '240px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                                        <div style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '13px' }}>{product.price?.toLocaleString()}đ</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendMessage('product', { productInfo: { id: product.id, name: product.name, price: product.price, image: product.img } })}
                                    style={{ backgroundColor: '#ee4d2d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Gửi Link
                                </button>
                            </div>
                        )}

                        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {messages.map((msg) => {
                                const isMe = String(msg.senderId) === currentUserId;
                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ backgroundColor: isMe ? '#ffe3e0' : '#fff', color: '#333', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            {msg.type === 'text' && <span>{msg.text}</span>}
                                            {msg.type === 'product' && (
                                                <div style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '4px', width: '160px' }}>
                                                    <img src={msg.productInfo?.image} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '2px' }} />
                                                    <div style={{ fontSize: '12px', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.productInfo?.name}</div>
                                                    <div style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '12px' }}>{msg.productInfo?.price?.toLocaleString()}đ</div>
                                                </div>
                                            )}
                                        </div>
                                        {isMe && (
                                            <span style={{ fontSize: '10px', color: '#a0a0a0', marginTop: '3px', paddingRight: '2px' }}>
                                                {msg.status === 'seen' ? 'Đã xem' : 'Đã gửi'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}

                            {selectedRoomId && messages.length === 0 && iAmBuyerInSelectedRoom && (
                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '12px', color: '#757575' }}>Bạn có thể muốn hỏi:</div>
                                    {faqQuestions.map((q, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSendMessage('text', { text: q })}
                                            style={{ backgroundColor: '#fff', border: '1px solid #ee4d2d', color: '#ee4d2d', padding: '6px 12px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer', width: 'fit-content' }}
                                        >
                                            {q}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!selectedRoomId && displayRooms.length === 0 && (
                                <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                                    Vui lòng chọn hoặc tìm kiếm một đối tác để bắt đầu trò chuyện.
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* PHẦN FOOTER CHAT: Chỉ còn Khung nhập text + Nút gửi */}
                        <div style={{ padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #e8e8e8', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <textarea
                                value={inputText}
                                disabled={!selectedRoomId && !activeProductRoomId}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage('text');
                                    }
                                }}
                                placeholder={(!selectedRoomId && !activeProductRoomId) ? "Chọn một phòng để chat..." : "Nhập nội dung tin nhắn..."}
                                style={{
                                    flex: 1,
                                    resize: 'none',
                                    height: '34px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    padding: '6px 10px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                onClick={() => handleSendMessage('text')}
                                disabled={!selectedRoomId && !activeProductRoomId}
                                style={{
                                    backgroundColor: '#ee4d2d',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                    opacity: (!selectedRoomId && !activeProductRoomId) ? 0.5 : 1
                                }}
                            >
                                Gửi
                            </button>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
};

export default ChatWidget;
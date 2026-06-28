import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
    
    // STOMP Client ref
    const stompClientRef = useRef(null);

    const messagesEndRef = useRef(null);

    // ========================================================
    // ĐỒNG BỘ ĐỊNH DANH USER (HỖ TRỢ NGƯỜI BÁN ĐI MUA HÀNG)
    // ========================================================
    const currentUserId = user?.id ? String(user.id) : null;
    const currentRole = user?.role !== undefined ? Number(user.role) : 0;
    const currentUserName = user?.last_name || user?.username || "Ẩn danh";
    const currentUserAvatar = user?.avatar || "";

    const detectedShopId = product?.shop?.userId || product?.shop_id || product?.user_id || product?.userId || product?.shop?.id || product?.id_user;
    const detectedShopName = product?.shop?.shopName || product?.shop_name || product?.shopName || product?.shop?.name || product?.user?.username || "Cửa hàng";

    const shopOwnerId = detectedShopId ? String(detectedShopId) : null;
    const shopOwnerName = detectedShopId ? detectedShopName : null;

    const isActingAsBuyerForCurrentProduct = currentUserId && shopOwnerId && (currentUserId !== shopOwnerId);

    const activeProductRoomId = (currentUserId && shopOwnerId && (currentUserId !== shopOwnerId))
        ? [currentUserId, shopOwnerId].sort().join("_")
        : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && activeProductRoomId && isActingAsBuyerForCurrentProduct) {
            setSelectedRoomId(activeProductRoomId);
        }
    }, [isOpen, activeProductRoomId, isActingAsBuyerForCurrentProduct]);

    // FETCH INITIAL ROOMS
    const fetchRooms = async () => {
        if (!currentUserId) return;
        try {
            const res = await fetch(`/api/chat/rooms/${currentUserId}`);
            if (res.ok) {
                const data = await res.json();
                setChatRooms(data);
                if (!selectedRoomId && data.length > 0) {
                    setSelectedRoomId(data[0].id);
                }
            }
        } catch (err) {
            console.error("Lỗi fetch danh sách phòng:", err);
        }
    };

    // 1. WEBSOCKET SETUP
    useEffect(() => {
        if (!currentUserId) return;

        fetchRooms();

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: (str) => {
                // console.log(str);
            },
            reconnectDelay: 5000,
            onConnect: () => {
                // Lắng nghe cập nhật phòng (khi có tin nhắn mới cho user này)
                client.subscribe(`/topic/user/${currentUserId}/rooms`, (msg) => {
                    fetchRooms();
                });

                // Lắng nghe lỗi hệ thống (ví dụ: bị chặn do từ ngữ thô tục)
                client.subscribe(`/topic/user/${currentUserId}/errors`, (msg) => {
                    const errorText = msg.body;
                    setMessages(prev => [...prev, {
                        id: 'err_' + Date.now(),
                        senderId: 'system',
                        type: 'text',
                        text: errorText,
                        isError: true
                    }]);
                    setTimeout(scrollToBottom, 100);
                });
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [currentUserId]);

    // 2. FETCH MESSAGES KHI CHỌN PHÒNG & SUBSCRIBE VÀO PHÒNG
    useEffect(() => {
        if (!isOpen || !selectedRoomId || !currentUserId) return;

        const fetchMessagesAndMarkSeen = async () => {
            try {
                // Mark seen
                await fetch(`/api/chat/rooms/${selectedRoomId}/read?userId=${currentUserId}`, { method: 'POST' });
                
                // Refresh rooms to reset unreadCount
                fetchRooms();

                // Load messages
                const res = await fetch(`/api/chat/rooms/${selectedRoomId}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                    setTimeout(scrollToBottom, 100);
                }
            } catch (err) {
                console.error("Lỗi fetch messages:", err);
            }
        };

        fetchMessagesAndMarkSeen();

        // Subscribe to this room's messages
        if (stompClientRef.current && stompClientRef.current.connected) {
            const subscription = stompClientRef.current.subscribe(`/topic/chat/${selectedRoomId}`, (msg) => {
                const newMsg = JSON.parse(msg.body);
                setMessages(prev => [...prev, newMsg]);
                setTimeout(scrollToBottom, 100);
                
                // Nếu mình đang mở chat mà người kia gửi, gọi mark seen
                if (String(newMsg.senderId) !== currentUserId) {
                    fetch(`/api/chat/rooms/${selectedRoomId}/read?userId=${currentUserId}`, { method: 'POST' })
                        .then(() => fetchRooms());
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [isOpen, selectedRoomId, currentUserId]);


    // 3. HÀM XỬ LÝ GỬI TIN NHẮN
    const handleSendMessage = (type = 'text', payload = {}) => {
        if (!currentUserId) {
            alert(`Vui lòng đăng nhập để thực hiện gửi tin nhắn.`);
            return;
        }

        const targetRoomId = selectedRoomId || activeProductRoomId;
        if (!targetRoomId) return;

        if (type === 'text' && !inputText.trim() && !payload.text) return;

        try {
            const existingRoom = chatRooms.find(r => r.id === targetRoomId);
            const amIBuyerInThisRoom = existingRoom
                ? (String(existingRoom.customerId) === currentUserId)
                : isActingAsBuyerForCurrentProduct;

            const textContent = type === 'text' ? (payload.text || inputText) : null;
            const productInfoJson = type === 'product' ? JSON.stringify(payload.productInfo) : null;

            const messagePayload = {
                roomId: targetRoomId,
                senderId: Number(currentUserId),
                senderName: currentUserName,
                senderRole: currentRole,
                type: type,
                text: textContent,
                productInfo: productInfoJson,
                
                // Thông tin Khách hàng
                customerId: amIBuyerInThisRoom ? Number(currentUserId) : (existingRoom?.customerId || Number(targetRoomId.split('_')[0])),
                customerName: amIBuyerInThisRoom ? currentUserName : (existingRoom?.customerName || "Khách hàng"),
                customerAvatar: amIBuyerInThisRoom ? currentUserAvatar : (existingRoom?.customerAvatar || ""),

                // Thông tin Cửa hàng
                shopId: !amIBuyerInThisRoom ? Number(currentUserId) : (existingRoom?.shopId || Number(shopOwnerId)),
                shopName: !amIBuyerInThisRoom ? currentUserName : (existingRoom?.shopName || shopOwnerName)
            };

            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify(messagePayload)
                });
            } else {
                alert("Mất kết nối server. Đang thử lại...");
            }

            if (!selectedRoomId) {
                setSelectedRoomId(targetRoomId);
            }

            if (type === 'text' && !payload.text) setInputText('');
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
        }
    };

    const faqQuestions = [
        "Sản phẩm này có miễn phí vận chuyển không?",
        "Sản phẩm này có sẵn hàng không?",
        "Có thể thanh toán bằng COD được không?"
    ];

    const filteredRooms = chatRooms.filter(room => {
        const iAmBuyerHere = String(room.customerId) === currentUserId;
        const nameToSearch = iAmBuyerHere ? room.shopName : room.customerName;
        const matchesSearch = nameToSearch?.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'unread') return matchesSearch && room.unreadCount > 0;
        return matchesSearch;
    });

    const displayRooms = [...filteredRooms];

    if (activeProductRoomId && !displayRooms.some(r => r.id === activeProductRoomId) && isActingAsBuyerForCurrentProduct) {
        displayRooms.unshift({
            id: activeProductRoomId,
            shopName: shopOwnerName,
            customerName: currentUserName,
            lastMessage: "Bấm vào để bắt đầu cuộc trò chuyện...",
            unreadCount: 0,
            customerId: Number(currentUserId)
        });
    }

    const currentSelectedRoom = chatRooms.find(r => r.id === selectedRoomId);
    const iAmBuyerInSelectedRoom = currentSelectedRoom 
        ? (String(currentSelectedRoom.customerId) === currentUserId) 
        : isActingAsBuyerForCurrentProduct;

    const opposingName = currentSelectedRoom
        ? (iAmBuyerInSelectedRoom ? currentSelectedRoom.shopName : currentSelectedRoom.customerName)
        : shopOwnerName;

    return (
        <div className="shopee-chat-wrapper" style={{ position: 'fixed', bottom: '0px', right: '90px', zIndex: 9999, fontFamily: 'Arial, sans-serif' }}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ backgroundColor: '#ee4d2d', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px 12px 0 0', cursor: 'pointer', boxShadow: '0 -2px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}
                >
                    <i className="fas fa-comments"></i> Chat
                </button>
            )}

            {isOpen && (
                <div style={{ width: '680px', height: '520px', backgroundColor: '#fff', borderRadius: '8px 8px 0 0', boxShadow: '0 4px 25px rgba(0,0,0,0.18)', display: 'flex', overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                    
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
                                    const iAmBuyerHere = String(room.customerId) === currentUserId;
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
                                            {room.unreadCount > 0 && !isSelected && (
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

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9' }}>
                        <div style={{ padding: '12px', backgroundColor: '#fff', borderBottom: '1px solid #ececec', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                                {!currentUserId ? 'Vui lòng đăng nhập' : (opposingName ? (iAmBuyerInSelectedRoom ? `Shop: ${opposingName}` : `Khách hàng: ${opposingName}`) : 'Tin nhắn')}
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
                                const isSystem = msg.senderId === 'system';
                                const prodInfo = msg.productInfo ? JSON.parse(msg.productInfo) : null;
                                
                                if (isSystem) {
                                    return (
                                        <div key={msg.id} style={{ alignSelf: 'center', margin: '8px 0' }}>
                                            <div style={{ backgroundColor: '#fff', color: '#ee4d2d', padding: '6px 12px', borderRadius: '15px', fontSize: '12px', border: '1px solid #ee4d2d', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(238,77,45,0.1)' }}>
                                                <i className="fas fa-exclamation-circle"></i>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ backgroundColor: isMe ? '#ffe3e0' : '#fff', color: '#333', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            {msg.type === 'text' && <span>{msg.text}</span>}
                                            {msg.type === 'product' && prodInfo && (
                                                <div style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '4px', width: '160px' }}>
                                                    <img src={prodInfo.image} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '2px' }} />
                                                    <div style={{ fontSize: '12px', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prodInfo.name}</div>
                                                    <div style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '12px' }}>{prodInfo.price?.toLocaleString()}đ</div>
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
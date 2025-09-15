import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function ChatBox() {
    const [messages, setMessages] = useState([
        { from: "bot", text: "Xin chào! Bạn cần hỏi gì về sản phẩm?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userMsg = { from: "user", text: input };
        setMessages((msgs) => [...msgs, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await axios.post("https://api.huytehuy.id.vn/chat", {
                question: input
            });
            // Không thêm answer vào messages nữa
            if (res.data.sources && Array.isArray(res.data.sources) && res.data.sources.length > 0) {
                setMessages((msgs) => [
                    ...msgs,
                    ...res.data.sources.map(item => ({
                        from: "bot",
                        product: item
                    }))
                ]);
            }
        } catch (err) {
            setMessages((msgs) => [
                ...msgs,
                { from: "bot", text: "Có lỗi xảy ra, vui lòng thử lại." }
            ]);
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            width: 350,
            maxHeight: 500,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999
        }}>
            <div style={{
                padding: 10,
                borderBottom: "1px solid #eee",
                fontWeight: "bold",
                background: "#f7f7f7"
            }}>
                Chat hỗ trợ sản phẩm
            </div>
            <div style={{
                flex: 1,
                overflowY: "auto",
                padding: 10,
                background: "#fafbfc"
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        textAlign: msg.from === "user" ? "right" : "left",
                        margin: "8px 0"
                    }}>
                        <span style={{
                            display: "inline-block",
                            background: msg.from === "user" ? "#00897B" : "#e9ecef",
                            color: msg.from === "user" ? "#fff" : "#333",
                            borderRadius: 16,
                            padding: "8px 14px",
                            maxWidth: "80%",
                            wordBreak: "break-word"
                        }}>
                            {/* Nếu là sản phẩm */}
                            {msg.product ? (
                                <div style={{ textAlign: "left" }}>
                                    {msg.product.image && (
                                        <img src={msg.product.image} alt={msg.product.name} style={{ maxWidth: 180, borderRadius: 8, marginBottom: 6 }} />
                                    )}
                                    <div style={{ fontWeight: "bold" }}>{msg.product.name}</div>
                                    {msg.product.price && (
                                        <div>
                                            Giá: {new Intl.NumberFormat('vi-VN').format(msg.product.price)} VNĐ
                                        </div>
                                    )}
                                    {msg.product.url && (
                                        <div>
                                            <a href={msg.product.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00897B" }}>
                                                Xem chi tiết
                                            </a>
                                        </div>
                                    )}
                                    {msg.product.snippet && <div style={{ fontSize: 13, color: "#555" }}>{msg.product.snippet}</div>}
                                    {msg.product.id && <div style={{ fontSize: 12, color: "#888" }}>Mã sản phẩm: {msg.product.id}</div>}
                                </div>
                            ) : (
                                msg.text
                            )}
                        </span>
                    </div>
                ))}
                {loading && (
                    <div style={{ color: "#888", fontStyle: "italic", margin: "8px 0" }}>
                        Đang lấy dữ liệu sản phẩm...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ display: "flex", borderTop: "1px solid #eee" }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Nhập câu hỏi..."
                    style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        padding: 10,
                        fontSize: 15,
                        borderRadius: "0 0 0 10px"
                    }}
                    disabled={loading}
                />
                <button
                    type="submit"
                    style={{
                        border: "none",
                        background: "#00897B",
                        color: "#fff",
                        padding: "0 18px",
                        borderRadius: "0 0 10px 0",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                    disabled={loading}
                >
                    Gửi
                </button>
            </form>
        </div>
    );
}

export default ChatBox;
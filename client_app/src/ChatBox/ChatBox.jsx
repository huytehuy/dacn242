import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function ChatBox() {
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState([
        { from: "bot", text: "Xin chào! Bạn cần hỏi gì về sản phẩm?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, visible]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!input.trim()) return;
        const userMsg = { from: "user", text: input };
        setMessages((msgs) => [...msgs, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const CHAT_URL = process.env.REACT_APP_CHAT_URL || "http://localhost:5000/chat";
            const res = await axios.post(CHAT_URL, { question: input });

            // only add product sources (no summary answer)
            if (res.data?.sources && Array.isArray(res.data.sources) && res.data.sources.length > 0) {
                setMessages((msgs) => [
                    ...msgs,
                    ...res.data.sources.map((item) => ({
                        from: "bot",
                        product: item
                    }))
                ]);
            } else {
                // optional: show a short fallback message
                setMessages((msgs) => [...msgs, { from: "bot", text: "Chưa tìm thấy sản phẩm phù hợp." }]);
            }
        } catch (err) {
            setMessages((msgs) => [
                ...msgs,
                { from: "bot", text: "Có lỗi xảy ra, vui lòng thử lại." }
            ]);
        } finally {
            setLoading(false);
            // ensure chat visible when results arrive
            setVisible(true);
        }
    };

    // Toggle visibility (minimize / restore)
    const toggleVisible = () => setVisible((v) => !v);

    return (
        <>
            {/* Floating toggle button when chat is hidden or to open/close */}
            {!visible && (
                <button
                    onClick={toggleVisible}
                    aria-label="Mở chat"
                    style={{
                        position: "fixed",
                        right: 30,
                        bottom: 30,
                        zIndex: 9999,
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#00897B",
                        color: "#fff",
                        border: "none",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Chat
                </button>
            )}

            {/* Chat panel */}
            {visible && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 30,
                        right: 30,
                        width: 360,
                        maxHeight: 520,
                        background: "#fff",
                        borderRadius: 10,
                        boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        zIndex: 9998,
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            padding: 12,
                            borderBottom: "1px solid #eee",
                            background: "#f7f7f7",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <div style={{ fontWeight: "600" }}>Chat hỗ trợ sản phẩm</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setVisible(false)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    fontSize: 16
                                }}
                                aria-label="Minimize chat"
                            >
                                _
                            </button>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: 12,
                            background: "#fafbfc"
                        }}
                    >
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    textAlign: msg.from === "user" ? "right" : "left",
                                    margin: "8px 0"
                                }}
                            >
                                <div
                                    style={{
                                        display: "inline-block",
                                        background: msg.from === "user" ? "#00897B" : "#e9ecef",
                                        color: msg.from === "user" ? "#fff" : "#222",
                                        borderRadius: 14,
                                        padding: "8px 12px",
                                        maxWidth: "80%",
                                        wordBreak: "break-word",
                                        textAlign: "left"
                                    }}
                                >
                                    {msg.product ? (
                                        <div style={{ textAlign: "left" }}>
                                            {msg.product.image && (
                                                <img
                                                    src={msg.product.image}
                                                    alt={msg.product.name}
                                                    style={{ maxWidth: 200, borderRadius: 8, marginBottom: 8, display: "block" }}
                                                />
                                            )}
                                            <div style={{ fontWeight: "700", marginBottom: 4 }}>{msg.product.name}</div>
                                            {msg.product.price && (
                                                <div style={{ marginBottom: 6 }}>
                                                    Giá: {new Intl.NumberFormat("vi-VN").format(msg.product.price)} VNĐ
                                                </div>
                                            )}
                                            {msg.product.url && (
                                                <div style={{ marginBottom: 6 }}>
                                                    <a href={msg.product.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00897B" }}>
                                                        Xem chi tiết
                                                    </a>
                                                </div>
                                            )}
                                            {msg.product.snippet && (
                                                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>{msg.product.snippet}</div>
                                            )}
                                            {msg.product.id && <div style={{ fontSize: 12, color: "#666" }}>Mã sản phẩm: {msg.product.id}</div>}
                                        </div>
                                    ) : (
                                        <div>{msg.text}</div>
                                    )}
                                </div>
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
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập câu hỏi..."
                            style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                padding: 12,
                                fontSize: 14
                            }}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            style={{
                                border: "none",
                                background: "#00897B",
                                color: "#fff",
                                padding: "0 16px",
                                cursor: "pointer",
                                fontWeight: "600"
                            }}
                            disabled={loading}
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

export default ChatBox;
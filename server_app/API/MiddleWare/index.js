const jwt = require('jsonwebtoken');

const auth = {
  // Verify Token (bỏ qua nếu không có token)
  optionalVerifyToken: (req, res, next) => {
    try {
      const token = req.header("Authorization");
      if (!token) {
        req.user = null;  // Không có token, user = null
        return next();    // Bỏ qua, không lỗi
      }

      // Xóa "Bearer " nếu có
      const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

      // Verify token
      jwt.verify(tokenString, "abc", (err, user) => {
        if (err) {
          req.user = null; // Token không hợp lệ, cũng bỏ qua
          return next();
        }
        req.user = user; // Token hợp lệ
        next();
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Các hàm khác giữ nguyên
  verifyToken: (req, res, next) => {
    try {
      const token = req.header("Authorization");
      if (!token) return res.status(401).json({ msg: "Không có token, quyền truy cập bị từ chối" });

      const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

      jwt.verify(tokenString, "abc", (err, user) => {
        if (err) return res.status(403).json({ msg: "Token không hợp lệ hoặc đã hết hạn" });
        req.user = user;
        next();
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  generateAccessToken: (userId) => {
    return jwt.sign({ id: userId }, "abc", { expiresIn: '1h' });
  },

  generateRefreshToken: (userId) => {
    return jwt.sign({ id: userId }, "refresh_secret", { expiresIn: '7d' });
  },

  verifyRefreshToken: (req, res, next) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ msg: "Không có refresh token" });

    try {
      jwt.verify(refreshToken, "refresh_secret", (err, user) => {
        if (err) return res.status(403).json({ msg: "Refresh token không hợp lệ" });
        req.user = user;
        next();
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = auth;

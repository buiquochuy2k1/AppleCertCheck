# 🔐 P12 Certificate Checker

Một ứng dụng web đơn giản dùng để **kiểm tra chứng chỉ `.p12 / .pfx`** (Apple Developer Certificate hoặc các loại certificate khác) xem còn hợp lệ, đã hết hạn hay đã bị thu hồi (**revoked**) bằng cách sử dụng **OCSP (Online Certificate Status Protocol)**.

---

## 🚀 Tính năng

- Upload file `.p12 / .pfx` trực tiếp từ trình duyệt.
- Nhập mật khẩu cho file `.p12` (có thể để trống nếu file không có pass).
- Parse certificate bằng **node-forge**.
- Tự động tải về **issuer certificate** từ Apple CA.
- Kiểm tra tình trạng chứng chỉ qua **OCSP**:
  - 🟢 Hợp lệ
  - 🔴 Thu hồi (Revoked)
  - ❓ Unknown
- Giao diện đẹp, hiệu ứng **glassmorphism + animate.css**.

---

## 🛠 Công nghệ sử dụng

- [Express.js](https://expressjs.com/) - server backend
- [Multer](https://github.com/expressjs/multer) - upload file
- [node-forge](https://github.com/digitalbazaar/forge) - parse file P12, xử lý certificate
- [ocsp](https://github.com/indutny/node-ocsp) - kiểm tra OCSP
- [Axios](https://axios-http.com/) - tải issuer cert
- HTML, CSS (Glassmorphism + Animate.css) cho UI

---

## 📂 Cấu trúc thư mục

```
project-p12-checker/
│── server.js          # Backend Express
│── public/
│    └── index.html    # UI chính
│── uploads/           # Nơi lưu file upload tạm thời
│── package.json
│── README.md
```

---

## ⚡ Cài đặt

### 1. Clone project
```bash
git clone https://github.com/your-username/project-p12-checker.git
cd project-p12-checker
```

### 2. Cài dependencies
```bash
npm install
```

### 3. Chạy server
```bash
node server.js
```

Mặc định server chạy tại:
👉 [http://localhost:3000](http://localhost:3000)

---

## 💻 Sử dụng

1. Truy cập `http://localhost:3000`
2. Upload file `.p12 / .pfx`
3. Nhập mật khẩu (nếu có, có thể để trống)
4. Nhấn **Kiểm tra**
5. Xem kết quả:
   - 🟢 **Hợp lệ**
   - 🔴 **Thu hồi / Revoked**
   - ❓ **Unknown**

---

## 📝 Ví dụ kết quả

```html
<div class="text-center">
  Tên chứng chỉ: Nguyen Tang Hung<br/>
  Ngày hết hạn: 27/07/2026<br/>
  Tình trạng: <span style="color:red; font-weight:bold;">🔴 Thu hồi / Revoked 🔴</span><br/>
</div>
```

---

## ⚠️ Lưu ý

- Một số chứng chỉ `.p12` có **password rỗng**, hãy thử để trống nếu nhập sai báo lỗi.
- OCSP check cần kết nối Internet đến Apple CA (`ocsp.apple.com`).
- Nếu cert không có **Authority Info Access (AIA)** extension → không check được OCSP.

---

## 📜 License

MIT License © 2025  
Developed by [Bui Quoc Huy + AI]

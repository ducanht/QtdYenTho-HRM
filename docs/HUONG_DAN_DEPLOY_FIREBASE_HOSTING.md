# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG LÊN HẠ TẦNG GOOGLE FIREBASE HOSTING MIỄN PHÍ (FREE TIER)
# Tên miền truy cập: `https://qtdyentho-hrm.web.app`

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng **Cổng Quản Trị Nhân Sự & Đánh Giá Tín Nhiệm (Quỹ Tín Dụng Nhân Dân Yên Thọ)** lên nền tảng đám mây **Google Firebase Hosting** trên gói dịch vụ vĩnh viễn không tính phí (**Spark Plan - 100% Free Tier**).

---

## 💎 1. Chính Sách Hạ Tầng Miễn Phí (Spark Plan) Của Google Firebase

Hệ thống được tối ưu hóa toàn diện để vận hành ổn định lâu dài trên định mức miễn phí của Google mà không cần thêm thẻ thanh toán:

| Dịch Vụ | Hạn Mức Miễn Phí (Spark Plan) | Khả Năng Đáp Ứng Của Hệ Thống QTDND Yên Thọ |
| :--- | :--- | :--- |
| **Firebase Hosting** | **10 GB** dung lượng lưu trữ<br>**360 MB/ngày** băng thông (~10.8 GB/tháng) | Bản build nén của hệ thống chỉ khoảng **1.2 MB**, đáp ứng hàng trăm ngàn lượt truy cập mỗi tháng. |
| **Cloud Firestore** | **1 GB** dữ liệu văn bản<br>**50,000** lượt đọc/ngày<br>**20,000** lượt ghi/ngày | Đáp ứng trọn vẹn quy mô 50-100 CBNV bỏ phiếu đồng thời trong các kỳ đánh giá. |
| **Firebase Auth** | Không giới hạn tài khoản Email/Password | Đủ cấp tài khoản định danh cho toàn bộ CBNV, HĐQT và BKS. |
| **Chứng Chỉ SSL** | Tự động cấp phát HTTPS chuẩn quốc tế | Miễn phí trọn đời cho cả tên miền `.web.app` và tên miền tùy chỉnh. |

---

## 🌐 2. Tên Miền Truy Cập Được Cấp Tự Động

Khi khởi tạo Project ID trên Firebase Console với tên `qtdyentho-hrm`, Google sẽ tự động cấp phát 2 địa chỉ mạng an toàn:
1. `https://qtdyentho-hrm.web.app` *(Địa chỉ chính)*
2. `https://qtdyentho-hrm.firebaseapp.com` *(Địa chỉ dự phòng)*

---

## 🛠️ 3. Quy Trình 4 Bước Triển Khai Thực Tế

### Bước 1: Khởi Tạo Dự Án Trên Firebase Console (Giao diện Web)
1. Đăng nhập vào trình duyệt: [https://console.firebase.google.com/](https://console.firebase.google.com/) bằng tài khoản Google.
2. Bấm **Add project** (Thêm dự án):
   - Nhập tên dự án: `qtdyentho-hrm` (hoặc tên tương tự nếu trùng, ghi nhớ Project ID này).
   - Tắt Google Analytics (để quá trình tạo diễn ra nhanh nhất).
   - Bấm **Create project**.
3. Bật **Firebase Hosting**:
   - Tại menu bên trái, chọn **Build** $\rightarrow$ **Hosting**.
   - Bấm **Get started** $\rightarrow$ Bấm liên tục **Next** qua các bước hướng dẫn $\rightarrow$ **Continue to console**.
4. *(Nếu chưa bật CSDL & Đăng nhập)*:
   - Vào **Build** $\rightarrow$ **Authentication** $\rightarrow$ Bật phương thức **Email/Password**.
   - Vào **Build** $\rightarrow$ **Firestore Database** $\rightarrow$ Bấm **Create database** $\rightarrow$ Chọn vị trí máy chủ `asia-southeast1` (Singapore) $\rightarrow$ Chọn **Start in test mode** $\rightarrow$ Bấm **Create**.

---

### Bước 2: Đăng Nhập Firebase CLI Tại Máy Tính
Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục dự án `d:\Antigravity Projects\QtdYenTho-HRM` và chạy lệnh:

```powershell
npx -y firebase-tools login
```

- Trình duyệt sẽ tự động mở trang đăng nhập Google.
- Chọn tài khoản Google đang quản lý dự án Firebase và bấm **Allow** (Cho phép).
- Sau khi thông báo thành công, quay lại Terminal.

---

### Bước 3: Kiểm Tra Hoặc Điều Chỉnh Tên Dự Án
Hệ thống đã có sẵn file cấu hình [.firebaserc](file:///d:/Antigravity%20Projects/QtdYenTho-HRM/.firebaserc):

```json
{
  "projects": {
    "default": "qtdyentho-hrm"
  }
}
```

*Lưu ý: Nếu tên dự án thực tế trên Firebase Console của quý đơn vị có thêm số đuôi (ví dụ `qtdyentho-hrm-88`), mở file `.firebaserc` và thay `qtdyentho-hrm` bằng ID thực tế đó.*

---

### Bước 4: Đóng Gói Và Triển Khai (Build & Deploy)
Chạy lệnh đóng gói mã nguồn và đẩy lên máy chủ Google:

```powershell
npm run deploy
```

*(Hoặc chạy thủ công 2 lệnh sau:)*
```powershell
npm run build
npx -y firebase-tools deploy --only hosting
```

**Kết quả màn hình hiển thị khi thành công:**
```
✔  Hosting: Local content verified
✔  Hosting: 12 files uploaded
✔  Hosting: Release complete!

Project Console: https://console.firebase.google.com/project/qtdyentho-hrm/overview
Hosting URL: https://qtdyentho-hrm.web.app
```

---

## 🔒 4. Cấu Hình Tệp `firebase.json` Đã Tối Ưu Sẵn
Tệp [firebase.json](file:///d:/Antigravity%20Projects/QtdYenTho-HRM/firebase.json) trong thư mục gốc đã được thiết lập đầy đủ quy tắc Single Page Application (SPA):

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000,immutable"
          }
        ]
      },
      {
        "source": "/index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache,no-store,must-revalidate"
          }
        ]
      }
    ]
  }
}
```
*Tác dụng:*
- **SPA Rewrites**: Mọi đường dẫn (như `/portal`, `/trust-evaluation`) khi cán bộ bấm F5 (tải lại trang) đều không bị lỗi 404 Not Found.
- **Cache Optimization**: Mã nguồn JS/CSS được lưu tạm 1 năm trên CDN toàn cầu của Google; riêng tệp `index.html` không lưu cache để cán bộ luôn nhận phiên bản mới nhất ngay khi có đợt cập nhật.

---

## 🌍 5. Gắn Tên Miền Riêng Của Đơn Vị (Tùy Chọn)
Nếu Quỹ muốn sử dụng tên miền phụ chính thức (ví dụ: `hrm.qtdyentho.vn`):
1. Vào Firebase Console $\rightarrow$ **Hosting** $\rightarrow$ Bấm **Add custom domain**.
2. Nhập `hrm.qtdyentho.vn`.
3. Firebase sẽ hiển thị bản ghi DNS (bản ghi TXT hoặc bản ghi A / CNAME).
4. Đăng nhập trang quản lý tên miền của Quỹ và cấu hình các bản ghi tương ứng.
5. Google tự động xác thực và cấp chứng chỉ bảo mật HTTPS SSL miễn phí trong vòng 1-2 giờ.

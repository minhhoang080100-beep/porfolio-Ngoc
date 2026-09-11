**Portfolio Hà Ngọc**

Website HTML/CSS/JavaScript, đọc nội dung từ Supabase và chỉnh sửa trực tiếp qua chế độ quản trị. Giữ nguyên giao diện xanh/kem, lựa chọn sáng/tối, hai ngôn ngữ và cơ chế PIN hiện có.

**Chạy trên máy**

Cần Node.js 22.13 trở lên; khuyến nghị Node.js 24 như môi trường CI.

```sh
npm ci
npm run dev
```

Mở `http://localhost:4173`; trang quản trị tại `/admin`. Máy chủ đọc trực tiếp mã/tài sản trong danh sách công khai và các thư viện đã khóa; refresh trình duyệt để xem thay đổi. Có thể đặt biến môi trường `PORT` nếu cổng mặc định đang được dùng.

**Kiểm tra và build**

```sh
npm run verify
npm run test:browser
```

`verify` kiểm tra cú pháp JavaScript/CSS, ID HTML, tham chiếu tài sản, chạy test Node với DOM/API giả lập và tạo thư mục `dist/`. Test browser dùng Chrome trên Windows; trên Linux/macOS cài Chromium bằng `npx playwright install chromium` trước khi chạy. GitHub Actions cài Chromium và chạy cả hai nhóm kiểm tra.

Các bài kiểm thử trình duyệt chặn toàn bộ request tới Supabase và trả dữ liệu giả, kể cả request ghi. Chúng không sửa portfolio đang chạy thật. Kết quả lỗi và trace nằm trong `test-results/` và được loại khỏi Git.

`npm run build` tạo lại riêng thư mục `dist/`, gồm các trang, mã ứng dụng, CV, ảnh/clip source và thư viện trình duyệt. Supabase và Sortable được sao chép từ các phiên bản npm đã khóa, kèm giấy phép; trình duyệt không tải bản `latest` từ CDN. Không sửa trực tiếp nội dung `dist/`.

**Triển khai**

`vercel.json` cấu hình build bằng `npm run build` và xuất bản `dist/`, giữ clean URL `/admin`. Có thể host `dist/` trên máy chủ tĩnh khác; cần hỗ trợ các MIME type ảnh, MP4, PDF và ánh xạ `/admin` sang `admin.html` nếu muốn URL tương tự. Font chữ Google Fonts và Font Awesome vẫn dùng URL stylesheet hiện có.

**Các phần chính**

| File | Vai trò |
| --- | --- |
| `portfolio-core.js` | Cấu hình Supabase/bucket, kiểm tra URL, xử lý text và dialog có focus/Escape |
| `main.js` | Tải từng phần độc lập, render nội dung, ngôn ngữ/theme, menu và xem media |
| `admin-mode.js` | Editor, lưu/xóa/sắp xếp và upload với kiểm tra lỗi |
| `index.html`, `style.css` | Cấu trúc, responsive, trạng thái tải/lỗi/rỗng và giao diện |
| `admin.html` | Trang nhập PIN hiện có |
| `tests/` | Test hồi quy DOM/API và thao tác trình duyệt |
| `scripts/` | Build, kiểm tra và máy chủ local |

**Dữ liệu hiện có**

- `settings`: các dòng `key`, `value` cho `intro_vi`, `intro_en`, `hero_subtitle`, `hero_image_url`, `contact_phone`, `contact_email`, `contact_fb`, `cv_url`.
- `experience_items`: `id`, `company`, `year`, `role_vi`, `role_en`, `sort_order`.
- `skill_items`: `id`, `title_en`, `icon_class`, `desc_vi`, `desc_en`, `sort_order`.
- `album_items`: `id`, `type`, `url`, `file_path`, `sort_order`, `category`, `experience_id`. Với `text_link`, `file_path` chứa JSON `{ "title": "...", "preview_image": "..." }`; với ảnh/video, trường này lưu đường dẫn object Storage.
- Upload mới dùng bucket `media`, cấu hình một lần trong `portfolio-core.js`. URL preview cũ ở bucket khác vẫn đọc được. Phiên bản này không yêu cầu thêm bảng, cột hoặc RPC.

PIN và cờ `sessionStorage.adminMode` được giữ nguyên theo yêu cầu. Không có thay đổi Auth, policy hay schema Supabase. Trường năm kinh nghiệm tiếp tục được ẩn trên trang công khai như lựa chọn trước đó.

**Chỉnh sửa nội dung**

Editor giữ ID khi sửa link dự án; chuyển giữa các link không xóa bản gốc. Khi lưu thất bại, giữ nội dung đang nhập và hiển thị lỗi để thử lại. Đợi thao tác lưu/upload kết thúc trước khi đóng editor. Chỉ hiện thông báo thành công sau khi kiểm tra kết quả các bước liên quan.

Việc thay đổi DB và dọn file Storage là các bước riêng; lỗi dọn file cần được báo rõ và xử lý lại. Các test mô phỏng lỗi từng bước để tránh xóa file khi bản ghi chưa được xóa thành công. Không có transaction chung giữa DB và Storage trong ứng dụng này.

Tài sản gốc trong `source/` được giữ lại. Báo cáo `AUDIT_REPORT.vi.md` là ảnh chụp kết quả kiểm tra trước lần cải tiến này; xem phần trạng thái bổ sung ở đầu báo cáo để phân biệt lỗi cũ và thay đổi đã thực hiện.

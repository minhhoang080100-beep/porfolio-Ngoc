**Báo cáo kiểm tra dự án portfolio Hà Ngọc — 08/09/2026**

**Trạng thái sau cải tiến:** Theo yêu cầu của chủ website, mục 1 về PIN/xác thực được giữ nguyên. Các mục 2–14 đã được xử lý trong mã ứng dụng: render nội dung an toàn, giữ bản nháp/ID khi sửa link, kiểm tra lỗi ghi, xóa DB trước khi dọn Storage, chờ tải dữ liệu editor, phục hồi nút Lưu, tải từng phần độc lập, sửa cursor/bàn phím/tương phản, trạng thái album rỗng/ngôn ngữ và khóa dependency. Bổ sung chuyển ảnh trước/sau, sắp xếp bằng bàn phím, kiểm thử và quy trình build. Phần bên dưới là báo cáo gốc trước khi sửa; số dòng được giữ để làm hồ sơ và có thể không còn khớp với mã mới. Hướng dẫn vận hành hiện tại ở [README.md](<D:/Ngoc selection/Ngọc/README.md>).

Việc lưu nhiều bản ghi và dọn Storage vẫn là các thao tác riêng vì đợt này không thay đổi schema/backend. Khi kết quả tạo mới không xác định do mất kết nối, giao diện giữ file và yêu cầu tải lại để đối chiếu trước khi tạo lại; không tự báo thành công hoặc xóa file có thể đang được tham chiếu. Các file gốc và bản trùng trong source được giữ nguyên.

Kiểm tra sau cải tiến: `npm run verify` đạt với 34 kiểm thử Node/DOM và build thành công; 5 kiểm thử Chrome đạt. Kiểm tra thêm kéo thả album thực tế với API giả xác nhận đổi thứ tự và không mở nhầm ảnh. Bản local đọc dữ liệu Supabase thật hiển thị đủ 9 kinh nghiệm, 4 kỹ năng, 19 ảnh/video và 32 link, không lỗi JavaScript hoặc tràn ngang ở 390/1440px. Script PIN được so sánh với Git HEAD và giữ nguyên. Không triển khai hoặc ghi/xóa dữ liệu Supabase thật trong quá trình kiểm thử.

Website hiện đọc được dữ liệu và các tài sản đang được tham chiếu trên Supabase. Tuy nhiên, luồng quản trị có các lỗi có thể mất dữ liệu, cơ chế PIN không xác thực người dùng ở backend, và phần render nội dung có đường chèn HTML/XSS. Nên xử lý các mục P1 trước khi tiếp tục mở rộng chức năng.

Phạm vi: đọc toàn bộ mã ứng dụng `index.html`, `admin.html`, `main.js`, `admin-mode.js`, `style.css`, SVG, cấu hình package/lockfile/deploy/gitignore; kiểm kê 81 tài sản trong `source/`; kiểm tra API và URL Storage ở chế độ chỉ đọc. Không duyệt mã bên thứ ba trong `node_modules`, không thẩm định nội dung CV/DOCX hay xem toàn bộ video. Không sửa mã ứng dụng, ghi dữ liệu thật, xóa file hoặc triển khai website.

P1 = cần sửa trước vì liên quan quyền truy cập hoặc mất dữ liệu; P2 = ảnh hưởng chức năng và trải nghiệm; P3 = cải thiện độ bền và khả năng bảo trì.

**14 phát hiện được ưu tiên**

**1. P1 — Cổng quản trị chỉ được bảo vệ bằng PIN phía trình duyệt.**

Vị trí: [admin.html:98](<D:/Ngoc selection/Ngọc/admin.html:98>), [main.js:626](<D:/Ngoc selection/Ngọc/main.js:626>), [admin-mode.js:5](<D:/Ngoc selection/Ngọc/admin-mode.js:5>).

PIN nằm trực tiếp trong HTML; kiểm tra đúng PIN chỉ đặt `sessionStorage.adminMode`. Người xem có thể tự bật cờ này để mở giao diện quản trị. Client Supabase không có bước đăng nhập trong dự án. Chưa có bằng chứng về quyền ghi thật: nếu RLS chặn khách vãng lai thì admin hiện cũng thiếu cách lấy quyền ghi; nếu admin hoạt động khi không có phiên xác thực khác, các thao tác đó không được phân biệt với khách vãng lai ở backend.

Đề xuất: dùng Supabase Auth; chỉ tài khoản quản trị được ghi các bảng và Storage; khách vãng lai chỉ đọc nội dung công khai. Lưu migration và policy trong repo, kiểm thử cho cả khách vãng lai, người dùng thường và admin. Publishable key xuất hiện trong frontend tự nó không phải lỗi: quyền dữ liệu cần được kiểm soát bằng Auth, grants và RLS. [Tài liệu Supabase về bảo vệ dữ liệu](https://supabase.com/docs/guides/database/secure-data).

**2. P1 — Nội dung động được chèn trực tiếp vào HTML.**

Vị trí: [main.js:220](<D:/Ngoc selection/Ngọc/main.js:220>), [main.js:226](<D:/Ngoc selection/Ngọc/main.js:226>), [main.js:283](<D:/Ngoc selection/Ngọc/main.js:283>), [admin-mode.js:323](<D:/Ngoc selection/Ngọc/admin-mode.js:323>), [admin-mode.js:562](<D:/Ngoc selection/Ngọc/admin-mode.js:562>).

Đã tái hiện offline: vai trò `Lead "actress"` bị hiển thị thành `Lead `; một trường company chứa phần tử ảnh có handler `onerror` tạo được phần tử và thực thi handler khi phát sự kiện lỗi giả lập. Tên, mô tả, title và URL đều có điểm nội suy không escape. Dữ liệu hiện tại không có dấu nháy kép trong các trường attribute đã kiểm tra; lỗi xuất hiện khi nội dung tương ứng được nhập về sau. Khả năng người ngoài ghi payload còn phụ thuộc quyền backend chưa được xác minh.

Đề xuất: tạo phần tử bằng DOM API, gán nội dung bằng `textContent`, form bằng `.value`, thuộc tính dữ liệu bằng `dataset`; kiểm tra URL chỉ chấp nhận giao thức phù hợp, thường là HTTPS/HTTP. Không đưa chuỗi nội dung vào template HTML. [MDN về rủi ro của innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).

**3. P1 — Sửa liên tiếp hai link có thể làm mất link đầu tiên.**

Vị trí: [admin-mode.js:595](<D:/Ngoc selection/Ngọc/admin-mode.js:595>), [admin-mode.js:702](<D:/Ngoc selection/Ngọc/admin-mode.js:702>), [admin-mode.js:733](<D:/Ngoc selection/Ngọc/admin-mode.js:733>).

Bấm Sửa link A, chưa thêm lại A, rồi bấm Sửa link B và Lưu. Handler Sửa đã lấy A khỏi danh sách và đưa ID vào danh sách xóa; ô nhập bị B ghi đè. Kiểm thử giả lập xác nhận kết quả chỉ còn B và vẫn báo thành công. Giữ ID/vị trí của link đang sửa, cập nhật tại chỗ và xử lý bản nháp trước khi chuyển sang link khác; không đưa ID vào danh sách xóa khi chỉ mở trình sửa.

**4. P1 — Bỏ qua lỗi lưu link, có thể mất bản gốc nhưng vẫn báo thành công.**

Vị trí: [admin-mode.js:735](<D:/Ngoc selection/Ngọc/admin-mode.js:735>), [admin-mode.js:749](<D:/Ngoc selection/Ngọc/admin-mode.js:749>), [admin-mode.js:756](<D:/Ngoc selection/Ngọc/admin-mode.js:756>).

Các lệnh xóa/cập nhật/thêm link không kiểm tra `error`. Tái hiện: sửa một link, cho bước insert trả lỗi sau khi delete thành công → không còn link nào nhưng giao diện báo “Đã lưu thành công!”. Cùng kiểu bỏ qua kết quả xuất hiện ở lưu ảnh đại diện tại [dòng 103](<D:/Ngoc selection/Ngọc/admin-mode.js:103>) và hai bước xử lý link trước khi xóa kinh nghiệm tại [dòng 470](<D:/Ngoc selection/Ngọc/admin-mode.js:470>).

Đề xuất: kiểm tra mọi kết quả, giữ bản nháp khi thất bại, cập nhật link theo ID thay vì xóa rồi tạo lại; gom các thay đổi DB liên quan vào transaction/RPC. `try/catch` đơn thuần không bắt được trường hợp SDK trả `{ data, error }`. [Tài liệu Supabase về update và xử lý lỗi](https://supabase.com/docs/reference/javascript/update).

**5. P1 — Xóa file Storage trước khi xóa được bản ghi DB.**

Vị trí: [admin-mode.js:882](<D:/Ngoc selection/Ngọc/admin-mode.js:882>).

Đã tái hiện offline: Storage remove thành công rồi DB delete thất bại → bản ghi và phần tử giao diện vẫn còn nhưng file đã bị xóa. Nên đánh dấu/xóa bản ghi thành công trước, rồi đưa việc dọn Storage vào cơ chế có retry. DB và Storage không nên được coi là một transaction chung. Khi upload thành công nhưng insert DB thất bại ở [dòng 937](<D:/Ngoc selection/Ngọc/admin-mode.js:937>), cũng cần cleanup để tránh file mồ côi.

**6. P2 — Lưu liên hệ trước khi tải xong có thể xóa URL CV.**

Vị trí: [admin-mode.js:394](<D:/Ngoc selection/Ngọc/admin-mode.js:394>), [admin-mode.js:436](<D:/Ngoc selection/Ngọc/admin-mode.js:436>).

CV được nạp bất đồng bộ nhưng nút Lưu hoạt động ngay; giá trị ô trống vẫn được upsert. Kiểm thử giữ truy vấn CV chưa trả kết quả rồi bấm Lưu ghi nhận `{key: 'cv_url', value: ''}`. Chỉ cho lưu khi tải ban đầu thành công, hoặc chỉ cập nhật CV khi người dùng thực sự thay đổi trường đó. Việc này làm mất tham chiếu CV đã tải lên, không xóa file PDF khỏi Storage.

**7. P2 — Lỗi lưu kỹ năng khóa nút Lưu.**

Vị trí: [admin-mode.js:848](<D:/Ngoc selection/Ngọc/admin-mode.js:848>), [admin-mode.js:862](<D:/Ngoc selection/Ngọc/admin-mode.js:862>).

Nhánh catch chỉ báo lỗi, không bỏ `disabled`. Kiểm thử xác nhận nút vẫn bị khóa sau update thất bại; các editor còn dùng chung nút này. Khôi phục trạng thái trong `finally` và reset khi mở editor.

**8. P2 — Một API lỗi làm toàn bộ portfolio bị che.**

Vị trí: [main.js:100](<D:/Ngoc selection/Ngọc/main.js:100>), [main.js:368](<D:/Ngoc selection/Ngọc/main.js:368>).

Cho riêng `skill_items` trả lỗi, ba API còn lại thành công: toàn trang hiện overlay, thông tin liên hệ và kinh nghiệm không được render. Đã tái hiện bằng mock fetch. Render từng phần độc lập, giữ phần đã tải thành công và chỉ báo lỗi tại phần bị ảnh hưởng; có timeout, nút retry theo phần và thông tin liên hệ dự phòng.

**9. P2 — Con trỏ biến mất trên cửa sổ desktop nhỏ.**

Vị trí: [style.css:853](<D:/Ngoc selection/Ngọc/style.css:853>), [style.css:1246](<D:/Ngoc selection/Ngọc/style.css:1246>).

CSS dưới 768px ẩn custom cursor, còn rule `pointer: fine` vẫn ẩn con trỏ hệ thống. Chrome headless với stylesheet thật xác nhận: `innerWidth=584`, `pointerFine=true`, body/link cursor đều `none`, custom cursor cũng `display:none`. Ở 1184px, custom cursor hiển thị. Error overlay còn có z-index cao hơn custom cursor tại [dòng 1325](<D:/Ngoc selection/Ngọc/style.css:1325>).

Đề xuất: dùng cùng điều kiện kích hoạt cho cả hai rule, chỉ ẩn con trỏ gốc sau khi JS sẵn sàng; giữ con trỏ gốc khi custom cursor không hoạt động.

**10. P2 — Các thao tác chính không sử dụng được bằng bàn phím.**

Vị trí: [index.html:36](<D:/Ngoc selection/Ngọc/index.html:36>), [index.html:51](<D:/Ngoc selection/Ngọc/index.html:51>), [index.html:126](<D:/Ngoc selection/Ngọc/index.html:126>), [main.js:300](<D:/Ngoc selection/Ngọc/main.js:300>).

Đổi ngôn ngữ/theme, mở/đóng menu, ảnh album và đóng modal dùng div/span chỉ có click handler. Kiểm thử sáu control cho kết quả `tabIndex=-1`, không nhận focus. Mở ảnh rồi nhấn Escape vẫn không đóng. Menu đóng chỉ bị đẩy ra ngoài màn hình nên các link vẫn nằm trong luồng Tab.

Đề xuất: dùng button hoặc link đúng chức năng, nhãn truy cập cho nút icon, `hidden`/`inert` cho menu đóng; modal có tên, semantics dialog, quản lý và khôi phục focus, đóng bằng Escape.

**11. P2 — Chữ trên nút và tiêu đề dark mode thiếu tương phản.**

Vị trí: [style.css:141](<D:/Ngoc selection/Ngọc/style.css:141>), [style.css:1094](<D:/Ngoc selection/Ngọc/style.css:1094>), [style.css:1147](<D:/Ngoc selection/Ngọc/style.css:1147>), [style.css:1230](<D:/Ngoc selection/Ngọc/style.css:1230>).

Tính từ màu CSS: chữ trắng trên nút xanh đạt khoảng 1,62:1; chữ kem trên nút ngôn ngữ đạt 1,53:1; heading admin màu tối trên nền dark chỉ 1,22:1. Dùng chữ tối trên nền xanh và màu heading sáng trong dark mode. Đặt mục tiêu tối thiểu 4,5:1 cho chữ thông thường theo [hướng dẫn W3C](https://www.w3.org/WAI/WCAG22/Techniques/general/G18.html).

**12. P3 — Tải lại album rỗng vẫn giữ ảnh cũ.**

Vị trí: [main.js:294](<D:/Ngoc selection/Ngọc/main.js:294>).

Fetch lần đầu có một ảnh; lần tiếp theo trả `[]`: ảnh cũ vẫn còn, `albumLoaded` không phát. Đã tái hiện offline. Đưa thao tác clear grid và thông báo hoàn tất ra ngoài điều kiện `albumItems.length > 0`, hiển thị trạng thái rỗng. Lỗi này thuộc luồng fetch lại; thao tác xóa hiện tại của admin tự xóa DOM riêng.

**13. P3 — Thuộc tính ngôn ngữ tài liệu không đồng bộ nội dung.**

Vị trí: [index.html:2](<D:/Ngoc selection/Ngọc/index.html:2>), [main.js:73](<D:/Ngoc selection/Ngọc/main.js:73>).

Trang mặc định hiển thị tiếng Anh sau fetch nhưng `html.lang` vẫn là `vi`. Cập nhật `document.documentElement.lang` trong `applyLanguage`, bổ sung các chuỗi còn thiếu bản dịch như Retry.

**14. P3 — Lockfile không khóa thư viện thực chạy trong trình duyệt.**

Vị trí: [main.js:627](<D:/Ngoc selection/Ngọc/main.js:627>), [package.json](<D:/Ngoc selection/Ngọc/package.json>).

Trình duyệt tải Supabase bằng `@2` và Sortable bằng `@latest`; phiên bản khóa trong npm không được luồng này dùng. Script tải lỗi vẫn được coi là hoàn tất rồi tiếp tục chạy admin, dẫn tới thiếu `supabase` hoặc `Sortable`. Ghim phiên bản cụ thể, thống nhất pipeline dependency, phân biệt load success/failure và báo lỗi tải công cụ quản trị. `npm audit` sạch không bao phủ các phiên bản CDN trôi này.

**Kết quả kiểm tra**

| Kiểm tra | Kết quả |
| --- | --- |
| `node --check main.js`, `node --check admin-mode.js` | Qua |
| Parse JavaScript inline trong admin.html | Qua |
| Parse style.css bằng css-tree | Không có lỗi parse; không đồng nghĩa layout đúng |
| Đường dẫn src/href nội bộ trong index.html | Không thấy file bị thiếu |
| `npm audit --json` | 0 lỗ hổng được báo trong dependency lockfile tại thời điểm kiểm tra |
| Smoke test DOM, dữ liệu giả hợp lệ | Render được kinh nghiệm, kỹ năng, album; đổi ngôn ngữ/theme; mở/đóng CV rồi mở ảnh |
| Mock lỗi và phản hồi chậm | Tái hiện mất link, success sai, khóa nút Lưu, ghi rỗng CV, xóa Storage trước DB, lỗi một API che cả trang |
| Mock render | Tái hiện chèn HTML/handler, cắt chữ có dấu nháy, album cũ sau phản hồi rỗng, thiếu điều khiển bàn phím |
| Chrome headless, stylesheet thật | Tái hiện mất con trỏ khi cửa sổ hẹp |
| GET bốn API Supabase hiện tại | Tất cả HTTP 200: 8 settings, 9 kinh nghiệm, 4 kỹ năng, 51 album_items |
| Phân loại album_items hiện tại | 32 text_link, 16 ảnh, 3 video |
| HEAD các URL Supabase Storage đang được tham chiếu | 21 URL riêng biệt, tất cả HTTP 200; tổng Content-Length 17.275.900 byte |
| Tài sản source/ | 53 JPEG kiểm tra cấu trúc bằng Pillow đều qua; 28 MP4 có header ftyp, chưa giải mã video đầy đủ |

Các API live chỉ được đọc như trang công khai; không thử ghi/xóa để dò quyền. Chưa có schema/migration/RLS trong repo để xác minh chính sách DB và Storage; cần kiểm tra trực tiếp cấu hình đó trước khi kết luận mức độ khai thác từ người ngoài. Chưa đo Lighthouse/Core Web Vitals hay kiểm thử toàn trang trên thiết bị thật. Tổng dung lượng asset qua HEAD không phải số byte của lần tải trang đầu.

**Cải tiến tiếp theo**

- Sau nhóm P1, xử lý P2 về trạng thái lưu, tải dữ liệu, cursor và bàn phím. Bổ sung test hồi quy cho đúng các kịch bản lỗi đã tái hiện và test quyền truy cập với database thử nghiệm.
- Tách `main.js`/`admin-mode.js` thành phần tải dữ liệu, render, modal và editor; dùng chung hàm lưu có kiểm tra lỗi. Không cần chuyển framework chỉ để thực hiện việc này.
- Thêm README mô tả chạy local, deploy, bảng/bucket cần có; thêm scripts kiểm tra và CI. `package.json` hiện không có scripts test/lint/build; jsdom/css-tree đang có sẵn cục bộ nhưng là dependency ngoài khai báo, không bảo đảm có trong cài đặt mới.
- Thống nhất cấu hình bucket: preview link dùng `portfolio_media`, còn hero/CV/album dùng `media`. Kiểm tra URL đọc hiện tại không xác nhận được bucket preview đã có cấu hình và policy upload đúng.
- Thêm trạng thái ảnh/video lỗi để skeleton không chạy mãi; dọn IntersectionObserver khi render lại. Cân nhắc poster và tải video theo nhu cầu, ảnh nhiều kích cỡ, bỏ lazy loading khỏi ảnh hero sau khi đo LCP; hỗ trợ reduced motion.
- Cung cấp HTML nội dung cơ bản và meta description/canonical để tăng khả năng đọc nội dung khi API/JS lỗi và phục vụ SEO; ưu tiên tên, giới thiệu, liên hệ và liên kết CV.
- Dọn tính năng dang dở: [main.js:673](<D:/Ngoc selection/Ngọc/main.js:673>) gọi `openMediaModal` chưa được định nghĩa. Đã tái hiện ReferenceError khi gọi trực tiếp trình xem dự án rồi bấm ảnh, nhưng `openProjectModal` hiện không có callsite, nên đây là mã không được sử dụng, không phải lỗi của album chính. Nếu giữ lại thì thống nhất với lightbox đang dùng.
- Hợp nhất các định nghĩa custom cursor bị lặp, kiểm tra các class không còn được dùng. `favicon.png` thực chất chứa JPEG; website hiện dùng SVG nên đây là lỗi vệ sinh tài sản.

**Kiểm kê dung lượng và file trùng**

`source/` có 81 file, tổng 118.972.912 byte (~113,46 MiB): JPEG chiếm 29.443.085 byte, MP4 chiếm 89.529.827 byte. Đây là dung lượng kho source, không phải dung lượng tải trang hiện tại. Ba cặp trùng hoàn toàn theo SHA-256, phần dung lượng trùng tổng cộng 1.494.613 byte:

| File thứ nhất trong source/ | File trùng | Byte mỗi file |
| --- | --- | ---: |
| `8055902059897.mp4` | `8055902059897 (1).mp4` | 820.216 |
| `z8055881350692_c640930cbf541607279dc1e90bb6e7b5.jpg` | `z8055881424036_c00df5a652c8da1c0fd597cc74196b60.jpg` | 363.082 |
| `z8055881373366_70d163a6aa5d15ff8acaa683a3968cf3.jpg` | `z8055881430465_b5f993892b822cc8bbde1753b946f9d0.jpg` | 311.315 |

Kiểm kê tham chiếu và nhu cầu lưu bản gốc trước khi gộp/xóa tài sản. Đợt kiểm tra này giữ nguyên toàn bộ tài sản và mã ứng dụng; chỉ thêm báo cáo này.

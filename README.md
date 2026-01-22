# WORKSHOP: Giải bài toán kỹ thuật bằng Workflow + Prompt (dành cho non-tech & vibe coder)

## 1) Mở đầu workshop (nói 2–3 phút)
Hôm nay mục tiêu không phải là dạy mọi người thành lập trình viên.
Mục tiêu là: sau buổi này, dù không rành kỹ thuật, mọi người vẫn có thể dùng AI để tự giải một số bài toán đơn giản theo đúng quy trình.

Trong thực tế, rất nhiều việc bình thường phải nhờ dev hoặc cả một team phía sau: làm một trang quản lý đơn giản, kết nối dữ liệu, xuất file, sửa lỗi khi code chạy hỏng…
Workshop này “đóng gói” những phần khó đó thành một workflow dễ làm theo.

Điểm quan trọng: workshop không dạy thao tác tool kiểu “bấm nút A rồi bấm nút B”.
Workshop tập trung vào 3 kỹ năng thực dụng:
- Biết xác định mình đang muốn giải quyết bài toán gì (để không lan man).
- Biết viết prompt đúng kiểu “ra yêu cầu rõ ràng” để AI làm ra thứ dùng được.
- Biết sửa lỗi theo quy trình, không sửa theo cảm tính.

Cuối buổi mọi người sẽ thấy: mình không cần giỏi code, nhưng mình cần biết “ra đề” đúng.


## 2) Vì sao nhiều người dùng AI vẫn hay bị kẹt (nói 3–4 phút)
Rất nhiều người hiện nay làm theo kiểu “vibe coding”: hỏi AI → copy code → chạy được là xong.
Cách đó giúp đi nhanh ở bước đầu, nhưng thường vỡ ở 3 chỗ:
- Muốn thêm tính năng thì code rối, không biết sửa ở đâu.
- Bị lỗi thì log dài, không biết đọc, AI trả lời vòng vòng.
- Làm xong vài hôm quay lại nhìn lại không hiểu mình đã làm gì.

Vấn đề không phải do AI kém.
Vấn đề là cách mình hỏi quá mơ hồ, AI phải “đoán”, và kết quả thường chỉ là code demo.

Khác biệt lớn nhất giữa “vibe coding” và “ra lệnh kiểu dev” là:
- Vibe coding: “Viết cho tôi app quản lý nhân viên”.
- Kiểu dev: “Đây là dữ liệu cần lưu, đây là màn hình cần có, đây là đầu vào/đầu ra, yêu cầu code gọn – dễ sửa – không viết thừa”.

Workshop này không bắt mọi người học kỹ thuật sâu,
nhưng sẽ đưa cho mọi người cách “ra lệnh kiểu dev” để AI làm đúng.


## 3) Workflow tổng thể hôm nay (nói 1–2 phút)
Hôm nay sẽ đi theo một workflow rất dễ nhớ, làm xong có kết quả:
1) Chọn bài toán nhỏ nhưng đủ “thật”
2) Chốt những thứ cần thiết trước khi nhờ AI viết
3) Dùng prompt ngắn, rõ, ra từng phần (không yêu cầu AI viết cả hệ thống một lần)
4) Chạy thử – lỗi thì sửa theo quy trình
5) Thêm tối ưu “vừa đủ” để chạy ổn và đỡ tốn chi phí
6) Khi cần dữ liệu ngoài → dùng tool có sẵn (demo Apify)

Bài toán xuyên suốt workshop: làm một trang “Quản lý nhân viên” đơn giản.
Lý do chọn bài toán này:
- Ai cũng hiểu: có danh sách, thêm/sửa/xóa, tìm kiếm.
- Nó đại diện cho rất nhiều bài toán khác: quản lý khách hàng, quản lý đơn, quản lý lead…
- Nó đủ để thấy rõ cách làm đúng: có dữ liệu, có backend, có giao diện, có lỗi thực tế.


## 4) Thực hành phần A — “Chốt bài toán” (5 phút)
Trước khi prompt, cả phòng sẽ chốt nhanh 4 thứ, không cần kỹ thuật sâu.

**A1. Màn hình cần có**
- Màn hình danh sách nhân viên
- Nút “Thêm nhân viên”
- Sửa / Xóa trên từng dòng
- Ô tìm kiếm theo tên hoặc email

**A2. Dữ liệu cần lưu**
Nhân viên tối thiểu có:
- name (tên)
- email (email)
- role (vai trò)
- status (trạng thái)
- createdAt (ngày tạo)

**A3. Luật cơ bản**
- Email không được trùng.
- Status mặc định là active.
- Tìm kiếm theo name/email.

**A4. Kết quả cần thấy khi xong**
- Thêm được nhân viên mới.
- Danh sách hiện đúng.
- Tìm kiếm ra kết quả.
- Xuất được danh sách ra file (CSV/Excel) ở mức demo (tuỳ thời gian).

Chốt xong 4 thứ này là đủ để AI không “đoán bừa”.


## 5) Thực hành phần B — Prompt ngắn gọn nhưng “ra lệnh kiểu dev” (phần quan trọng nhất)
Nguyên tắc: AI làm tốt khi mình đưa đúng 3 thứ:
- Mình muốn làm gì (mục tiêu)
- Mình có gì (ngữ cảnh)
- Mình muốn AI trả ra cái gì (đầu ra)

Dưới đây là các prompt mẫu để mọi người copy dùng ngay.
Lưu ý: mỗi prompt chỉ làm 1 việc. Không yêu cầu AI làm tất cả trong một lần.

### Prompt 1 — Chốt “dữ liệu cần lưu” (database)
Copy prompt này:

**PROMPT**
Bạn là người thiết kế dữ liệu cho một app quản lý nhân viên đơn giản.
Mục tiêu: lưu và tìm kiếm danh sách nhân viên.
Hãy đề xuất cấu trúc dữ liệu cho bảng employees với các trường: name, email, role, status, createdAt.
Yêu cầu:
- email phải là duy nhất (không trùng)
- status mặc định là "active"
- đề xuất thêm 1–2 trường nếu thật sự cần (ví dụ id)
Output:
- Danh sách field + giải thích 1 dòng mỗi field
- Gợi ý 2 rule validate quan trọng

Kết quả mong đợi: ai không biết code vẫn hiểu “mình đang lưu gì”.

---

### Prompt 2 — Chốt “các API cần có” (backend sẽ làm gì)
**PROMPT**
Bạn đang giúp thiết kế API cho app quản lý nhân viên.
Tính năng: xem danh sách, thêm, sửa, xoá, tìm kiếm theo name/email.
Yêu cầu:
- List có phân trang (page, pageSize)
- Có format trả về thống nhất
Output:
- Danh sách endpoint (GET/POST/PATCH/DELETE)
- Ví dụ request/response ngắn cho 2 endpoint: list và create
Không viết code.

Kết quả mong đợi: frontend và backend “nói cùng ngôn ngữ”.

---

### Prompt 3 — Sinh backend theo kiểu dễ sửa (không cần hiểu sâu)
Ở đây mọi người chỉ cần hiểu: backend là phần xử lý dữ liệu và API.
**PROMPT**
Bạn là dev backend. Hãy tạo backend tối thiểu cho app quản lý nhân viên theo API contract phía trên.
Stack: NodeJS + Express (hoặc NestJS nếu bạn muốn, nhưng ưu tiên Express cho đơn giản).
Yêu cầu:
- Tách code theo file rõ ràng: routes/controller/service/db
- Có validate input cơ bản (email hợp lệ, name không rỗng)
- Có xử lý lỗi rõ ràng (trùng email trả về message dễ hiểu)
Output:
- Cấu trúc thư mục
- Code mẫu cho 2 API: list + create
Không viết dài toàn bộ hệ thống.

Kết quả mong đợi: code chạy được, nhưng gọn, dễ sửa.

---

### Prompt 4 — Sinh frontend “đủ dùng” (không làm màu)
Frontend là phần giao diện.
**PROMPT**
Bạn là dev frontend. Hãy tạo giao diện quản lý nhân viên tối giản.
Yêu cầu:
- Có bảng danh sách nhân viên
- Có ô tìm kiếm
- Có form thêm nhân viên
- Có trạng thái: loading / error / empty
- Tách phần gọi API ra 1 file riêng (api.js/api.ts)
Output:
- Danh sách file cần có
- Code mẫu cho trang danh sách + file gọi API

Kết quả mong đợi: chạy được và nhìn thấy dữ liệu.

---

### Prompt 5 — “Mở rộng tính năng mà không phá code”
Đây là prompt để dạy cách nói chuyện với AI khi muốn thêm tính năng.
**PROMPT**
Hiện tại app quản lý nhân viên đã có list + create.
Bây giờ cần thêm tính năng: update employee.
Yêu cầu:
- Giữ nguyên cấu trúc code hiện tại
- Chỉ nói rõ cần sửa file nào + thêm đoạn nào
Output:
- Danh sách file cần chỉnh
- Patch code ngắn cho update
Không viết lại toàn bộ dự án.

Kết quả: người non-tech vẫn làm theo được, không bị AI “viết lại từ đầu”.


## 6) Thực hành phần C — Debug cho vibe coder (10–15 phút)
Mục tiêu phần này: khi bị lỗi, mọi người không hoảng và không sửa bừa.

Quy trình 3 bước (luôn làm theo đúng thứ tự):
1) Khoanh vùng: lỗi ở giao diện hay ở backend?
2) Lấy bằng chứng: copy nguyên văn log lỗi (đừng kể lại)
3) Prompt sửa lỗi đúng cách: yêu cầu giải thích + đưa patch

Copy prompt debug này (cực hiệu quả):

**PROMPT DEBUG**
Mục tiêu của tôi: [mô tả 1 câu: ví dụ "tạo nhân viên mới"].
Tôi gặp lỗi sau (log nguyên văn):
[PASTE LOG Ở ĐÂY]

Ngữ cảnh:
- Tôi đang chạy: frontend (React) + backend (Node)
- File nghi ngờ: [tên file nếu biết]

Hãy làm 3 việc:
1) Giải thích nguyên nhân gốc (root cause) bằng lời dễ hiểu
2) Đề xuất cách sửa nhanh nhất
3) Đưa patch cụ thể: chỉ sửa đúng chỗ cần sửa, không viết lại toàn bộ

Lưu ý quan trọng: “log nguyên văn” giúp AI trả lời đúng.
Nếu chỉ nói “bị lỗi”, AI thường đoán và trả lời chung chung.


## 7) Thực hành phần D — Tối ưu “vừa đủ” để tiết kiệm thời gian/chi phí (5–7 phút)
Không cần tối ưu nâng cao. Chỉ cần 4 thứ để hệ thống không “chết” khi dữ liệu nhiều:
- List có phân trang (đừng tải tất cả một lần)
- Search hợp lý (tránh query nặng)
- Backend trả về đúng thứ cần (đừng trả dư)
- Frontend đừng gọi API liên tục (debounce search)

Copy prompt tối ưu này:

**PROMPT**
App quản lý nhân viên hiện đã chạy được.
Hãy đề xuất 4 cải tiến “vừa đủ” để:
- chạy ổn khi dữ liệu tăng
- tiết kiệm tài nguyên
- vẫn dễ sửa
Output:
- Danh sách cải tiến + lý do 1 câu
- Nếu cần sửa code, chỉ rõ file nào và sửa đoạn nào


## 8) Demo Apify — dùng tool sẵn để lấy dữ liệu (để app có data thật)
Đến lúc này app chạy ổn nhưng thường trống dữ liệu.
Nhập tay 200 dòng thì không ai muốn làm.

Phần này minh hoạ tư duy cực thực tế:
- “Core logic của mình” thì tự build
- “Lấy dữ liệu từ bên ngoài” thì dùng tool sẵn cho nhanh

Demo Apify theo flow:
- vào Apify Store
- chọn một Actor có sẵn (ví dụ scrape Google Maps / scrape website)
- nhập đầu vào
- chạy
- xem dataset
- export CSV/JSON

Sau đó nối lại với bài toán chính:
- dùng dataset export từ Apify làm dữ liệu mẫu
- import vào app quản lý nhân viên (ở mức demo có thể chỉ cần đọc CSV rồi hiển thị)

Copy prompt import dữ liệu này:

**PROMPT**
Tôi có file CSV/JSON export từ Apify.
Mục tiêu: nhập dữ liệu này vào app quản lý nhân viên.
Hãy hướng dẫn cách làm đơn giản nhất:
- Nếu là CSV: đọc file và tạo employee tương ứng
- Nếu là JSON: map field vào employee
Output:
- Các bước thao tác
- Code mẫu ngắn cho import (Node script)
Không giải thích dài.

Điểm mấu chốt: Apify không phải “nhảy chủ đề”.
Nó là cách giải quyết vấn đề dữ liệu đầu vào để hệ thống nhìn “thật” và dùng được ngay.


## 9) Kết thúc workshop (nói 1–2 phút)
Cuối buổi không cần nhớ code.
Chỉ cần nhớ workflow:

- Chốt bài toán trước (màn hình + dữ liệu + luật)
- Prompt ngắn, rõ, ra từng phần
- Debug theo log, không theo cảm giác
- Tối ưu vừa đủ để chạy ổn
- Khi cần dữ liệu ngoài → dùng tool sẵn như Apify

Sau workshop, người tham gia có thể tự giải các bài toán đơn giản tương tự:
quản lý khách hàng, quản lý đơn, quản lý lead… bằng đúng workflow này.

Điều quan trọng nhất: AI rất nhanh, nhưng chỉ giỏi khi mình ra đề đúng.

# WORKSHOP: GIẢI QUYẾT BÀI TOÁN KỸ THUẬT BẰNG WORKFLOW & PROMPT ĐÚNG

## 1. Mở đầu workshop

Workshop này được thiết kế để người tham gia giải được các bài toán kỹ thuật thực tế theo một cách dễ tiếp cận hơn. Trong thực tế, có rất nhiều việc nếu muốn làm nhanh và làm đúng thì thường phải cần người rất rành kỹ thuật, hoặc cả một team phía sau. Workshop muốn đưa mọi người đến gần cách làm đó, nhưng theo hướng có quy trình rõ ràng và làm được ngay, chứ không phải học lý thuyết rồi để đó.

Trong suốt buổi workshop, người tham gia không cần biết sâu về code, không cần hiểu chi tiết backend chạy ra sao, cũng không cần bận tâm hạ tầng đặt ở đâu. Những phần phức tạp đã được đóng gói thành workflow và các công thức prompt, để ai cũng có thể theo được và áp dụng lại sau buổi học.

Workshop này không tập trung vào việc dạy thao tác tool kiểu manual từng bước, mà tập trung vào tư duy giải quyết vấn đề:

- Hiểu bài toán cho đúng ngay từ đầu  
- Biết cách đặt prompt đủ ngữ cảnh để AI trả về output đúng chuẩn dev  
- Biết cách xử lý lỗi theo quy trình, không sửa theo cảm tính  
- Biết cách chọn giải pháp tiết kiệm thời gian và chi phí  

Mục tiêu cuối cùng của workshop là giúp người tham gia làm ra được một thứ chạy được, nhìn thấy kết quả rõ ràng, và quan trọng hơn là hiểu “tại sao làm như vậy” để có thể áp dụng cùng một cách làm cho các bài toán khác sau workshop.

## 2. Vì sao workshop này cần thiết 

Hiện nay có một nhóm người dùng rất phổ biến khi làm việc với AI và code, thường được gọi một cách không chính thức là “vibe coding”. Cách làm này khá quen thuộc: hỏi AI cho nhanh, copy code, chạy thấy được là tạm ổn.

Cách tiếp cận này giúp bắt đầu rất nhanh, đặc biệt phù hợp khi thử ý tưởng hoặc làm demo. Tuy nhiên, khi bài toán bắt đầu có thêm frontend, backend, database và các tình huống thực tế thì những vấn đề quen thuộc dần xuất hiện:

- Code chạy được ở bước đầu, nhưng chỉ cần thêm tính năng là lỗi
- Log dài, stacktrace nhiều, không biết nên đọc từ đâu
- Hỏi AI thì nhận được câu trả lời chung chung, sửa chỗ này lại hỏng chỗ khác
- Càng sửa càng rối, thời gian debug còn nhiều hơn cả thời gian viết mới

Điểm đáng chú ý là phần lớn các vấn đề này không đến từ việc thiếu công cụ hay thiếu AI đủ mạnh, mà đến từ cách tiếp cận bài toán:

- Bài toán chưa được bóc tách rõ trước khi đặt prompt
- Đầu vào và đầu ra không được chốt nên AI phải “đoán”
- Việc debug dựa trên cảm giác thay vì dựa trên log và bằng chứng cụ thể

Workshop này được thiết kế để giải quyết đúng những điểm đó. Thay vì dạy thêm công cụ mới, workshop tập trung vào việc xây dựng một cách làm có thể lặp lại: từ cách hiểu bài toán, cách ra lệnh cho AI, cho đến cách xử lý lỗi khi hệ thống bắt đầu phức tạp hơn.

Mục tiêu là giúp người tham gia không chỉ viết được code với AI, mà còn kiểm soát được chất lượng, hướng đi và chi phí của giải pháp mình đang xây dựng.

## 3. Workflow tổng thể của buổi workshop (và vì sao chọn bài toán quản lý nhân viên)

Buổi workshop được xây dựng xoay quanh một workflow cố định, mô phỏng đúng cách làm việc trong thực tế, nhưng được tinh giản để người tham gia có thể theo kịp trong một buổi.

Thay vì chạy qua nhiều bài toán rời rạc, workshop chọn **một bài toán xuyên suốt** để làm từ đầu đến cuối: xây dựng một trang quản lý nhân viên đơn giản.

Việc chọn bài toán này không phải ngẫu nhiên, mà vì nó hội tụ đủ những yếu tố quan trọng nhất của một hệ thống kỹ thuật thực tế:

Thứ nhất, đây là bài toán dễ hiểu với mọi đối tượng.  
Ai cũng có thể hình dung được quản lý nhân viên là gì: có danh sách, có thêm – sửa – xoá, có tìm kiếm. Người không rành kỹ thuật vẫn hiểu được mục tiêu, còn người có nền tảng dev thì thấy quen thuộc.

Thứ hai, bài toán này bắt buộc phải có đủ frontend, backend và database.  
Không thể giải quyết chỉ bằng một đoạn script hay một file code. Khi làm đến nơi đến chốn, nó tự nhiên kéo theo API, validate dữ liệu, xử lý lỗi, trạng thái giao diện, truy vấn database… đúng những điểm mà vibe coding thường bắt đầu gặp khó.

Thứ ba, đây là bài toán rất dễ “vibe”, nhưng cũng rất dễ “vỡ”.  
Nếu làm nhanh cho có, mọi thứ có thể nhét vào một file và chạy được. Nhưng chỉ cần thêm pagination, thêm search, hoặc sửa cấu trúc dữ liệu là code bắt đầu rối. Điều này giúp workshop chỉ ra rất rõ sự khác biệt giữa:
- Code chạy được một lần
- Và code có thể sửa, mở rộng và maintain

Từ bài toán quản lý nhân viên, workshop dẫn người tham gia đi theo một workflow rõ ràng:

- Chốt phạm vi trước khi code để tránh lan man và phình bài toán
- Chốt data model và API contract để frontend và backend nói cùng một ngôn ngữ
- Đặt prompt có cấu trúc để AI sinh code theo kiến trúc dễ maintain
- Thực hành debug theo quy trình cụ thể, không sửa theo cảm tính
- Tối ưu vừa đủ để hệ thống chạy ổn trong thực tế mà không tốn chi phí không cần thiết
- Và cuối cùng là minh hoạ khi nào nên tự build, khi nào nên dùng công cụ có sẵn để tiết kiệm thời gian

Toàn bộ workflow này không chỉ áp dụng cho trang quản lý nhân viên, mà có thể tái sử dụng cho rất nhiều bài toán khác sau workshop: từ quản lý đơn hàng, quản lý khách hàng, cho đến các hệ thống automation hoặc dashboard nội bộ.

Trang quản lý nhân viên chỉ là “vật mẫu” để học cách làm. Giá trị thật của workshop nằm ở workflow và tư duy phía sau nó.

## 4. Bước 1: Chốt bài toán và phạm vi trước khi code (để AI không viết lan man)

Trước khi viết bất kỳ dòng code nào, workshop dừng lại ở một bước rất quan trọng: chốt bài toán và phạm vi.

Đây là bước mà vibe coding thường bỏ qua. Rất nhiều người có thói quen mở AI lên và hỏi ngay:
“Viết cho tôi một app quản lý nhân viên”

Kết quả thường là:
- AI viết rất nhiều thứ
- Có chỗ dùng được, có chỗ dư thừa
- Kiến trúc không rõ ràng
- Sửa một chỗ thì vỡ chỗ khác

Không phải vì AI kém, mà vì **bài toán chưa được khoanh lại**.

### 4.1. Chốt phạm vi chức năng ở mức “đủ dùng”

Trong workshop, trang quản lý nhân viên không làm mọi thứ có thể làm, mà chỉ làm những thứ thực sự cần để phản ánh hệ thống thật:

- Hiển thị danh sách nhân viên
- Có phân trang
- Thêm, sửa, xoá nhân viên
- Tìm kiếm theo tên hoặc email
- Validate dữ liệu đầu vào
- Hiển thị lỗi rõ ràng cho người dùng
- Có loading state, empty state và error state

Không có:
- Phân quyền phức tạp
- Workflow duyệt nhiều bước
- Tối ưu sớm hoặc cache nâng cao

Mục tiêu là:
- Đủ để thấy frontend, backend và database phối hợp với nhau
- Đủ để thấy code dễ vỡ ở đâu nếu làm sai
- Nhưng không quá nhiều để workshop bị loãng

### 4.2. Chốt tiêu chuẩn kỹ thuật ngay từ đầu

Song song với phạm vi chức năng, workshop chốt luôn tiêu chuẩn kỹ thuật tối thiểu. Đây là phần rất quan trọng để AI không tự “sáng tác”.

Backend phải:
- Tách lớp rõ ràng, không nhét hết logic vào controller
- Có DTO để validate dữ liệu
- Có xử lý lỗi tử tế, không throw bừa
- Có cấu trúc dễ mở rộng

Frontend phải:
- Tách UI và logic gọi API
- Không gọi API trực tiếp trong component
- Có xử lý loading, lỗi và dữ liệu rỗng
- Dễ sửa khi API thay đổi

Database phải:
- Có schema rõ ràng
- Có ràng buộc unique cho email
- Có index cho các field tìm kiếm
- Không để AI tự thêm field không cần thiết

Những tiêu chuẩn này không phải để làm khó, mà để:
- Giảm số quyết định AI phải tự đoán
- Giữ code nằm trong “khuôn” ngay từ đầu
- Tránh việc viết xong rồi mới quay lại sửa kiến trúc

### 4.3. Vì sao chốt phạm vi trước giúp tiết kiệm thời gian

Nhiều người nghĩ chốt phạm vi là chậm.
Thực tế thì ngược lại.

Nếu không chốt:
- AI viết nhanh nhưng sai hướng
- Mỗi lần sửa là một lần đập đi xây lại
- Tốn thời gian debug vì cấu trúc không rõ

Nếu chốt từ đầu:
- AI viết chậm hơn một chút
- Nhưng output dùng được lâu
- Mỗi lần sửa chỉ sửa đúng chỗ cần sửa

Workshop nhấn mạnh rằng:
**10 phút chốt phạm vi trước khi code có thể tiết kiệm hàng giờ sửa về sau.**

Đây cũng là bước đầu tiên giúp vibe coder chuyển từ “code cho chạy” sang “code để dùng”.

## 5. Bước 2: Prompt thế nào để AI viết code đúng chuẩn dev

Phần này là **trọng tâm quan trọng nhất của workshop**.

Workshop không nhằm biến người tham gia thành senior developer,
mà giúp người tham gia **ra lệnh cho AI theo tư duy của senior developer**.

Sự khác biệt giữa:
- code “chạy được”
- và code “dùng được lâu dài”

không nằm ở AI, mà nằm ở **cách đặt prompt**.

---

## 5.1. Vì sao vibe coding không thể bằng dev ra lệnh

AI không tự phân biệt được:
- code demo hay code production
- code viết cho nhanh hay code để maintain
- code dùng 1 lần hay dùng lâu dài

AI chỉ làm đúng theo **độ rõ ràng của yêu cầu**.

Vibe coding thường đặt prompt kiểu:

“Viết cho tôi một app quản lý nhân viên”

Prompt này có các vấn đề:
- Không chốt phạm vi → AI viết lan man
- Không chốt kiến trúc → AI tự chọn pattern, thư viện
- Không chốt tiêu chuẩn → AI viết theo kiểu demo

Kết quả thường là:
- Code chạy được
- Nhưng cấu trúc rối
- Thêm tính năng là vỡ
- Debug rất tốn thời gian

Dev ra lệnh thì khác.

Dev không hỏi “viết cho tôi cái gì”,
mà nói rõ:
- bài toán là gì
- phạm vi đến đâu
- tiêu chuẩn kỹ thuật thế nào
- AI được làm gì và **không được làm gì**

Workshop này giúp người tham gia **chuyển từ vibe coding sang “engineering prompt”**.

---

## 5.2. Công thức prompt chuẩn dùng xuyên suốt workshop

Trong workshop, mọi prompt đều tuân theo **một công thức cố định**.

Công thức này giúp:
- AI không đoán
- AI không sáng tác
- AI viết code có cấu trúc, dễ maintain

Một prompt chuẩn luôn có 4 phần:

**Role**  
AI đang đóng vai ai? (Backend, Frontend, Senior hay Junior)

**Task**  
Một nhiệm vụ cụ thể, không gom nhiều việc vào một prompt

**Context**  
Ngữ cảnh kỹ thuật: schema, API contract, dữ liệu, mục tiêu

**Constraint**  
Ràng buộc bắt buộc: kiến trúc, pattern, phạm vi output

Nguyên tắc quan trọng:

- Thiếu Context → AI phải đoán
- Thiếu Constraint → AI viết kiểu demo
- Gom nhiều Task → AI trả lời nửa vời

Workshop **không cho AI toàn quyền quyết định**.
Người ra lệnh phải khoanh rõ đường đi.

---

## 5.3. Chiến lược dùng prompt trong workshop

Workshop **không bao giờ** dùng một prompt để sinh cả hệ thống.

Thay vào đó, workflow luôn là:

- Một prompt → một nhiệm vụ
- Một output → dùng làm context cho prompt tiếp theo

Ví dụ:
- Prompt thiết kế schema
- Prompt thiết kế API contract
- Prompt sinh code backend theo contract đó
- Prompt sinh frontend theo API đã chốt

Cách này giúp:
- AI viết chính xác hơn
- Dễ debug từng phần
- Dễ thay đổi từng module mà không vỡ cả hệ thống

## 5.4. Prompt mẫu – Backend (thực hành trực tiếp trong workshop)

Phần này workshop không nói lý thuyết nhiều, mà **làm trực tiếp từng prompt** để người tham gia thấy rõ:
- đặt prompt khác đi → chất lượng code khác hẳn
- AI không “ngu”, chỉ là đang bị hỏi sai cách

### Prompt 1: Thiết kế schema Employee

Mục tiêu của prompt này không phải là viết code ngay,
mà là **chốt dữ liệu trước khi code**, để mọi phần phía sau không bị lệch.

Prompt mẫu:

Bạn là Senior Backend Developer.

Task:  
Thiết kế schema cho bảng `employees`.

Context:  
Ứng dụng quản lý nhân viên đơn giản.  
Sử dụng PostgreSQL.

Constraint:  
- Email phải unique  
- Status có default value là `active`  
- Có `created_at` và `updated_at`  
- Không thêm field thừa  
- Viết dưới dạng SQL migration hoặc schema rõ ràng  

Output:  
Chỉ trả về phần schema. Không giải thích dài dòng.

Workshop nhấn mạnh:
Nếu schema chưa chốt, **đừng vội viết backend hay frontend**.
Mọi thứ phía sau đều phụ thuộc vào quyết định này.

---

### Prompt 2: Thiết kế API contract cho module nhân viên

Sau khi đã có schema, bước tiếp theo là chốt cách frontend và backend nói chuyện với nhau.

Prompt mẫu:

Bạn là Senior Backend Developer.

Task:  
Thiết kế API contract cho module quản lý nhân viên.

Context:  
- Đã có schema bảng `employees`  
- Frontend cần danh sách, tạo mới, cập nhật, xoá  

Constraint:  
- API list có pagination (page, limit)  
- Response format thống nhất  
- Error trả về message rõ ràng  
- Không viết code, chỉ mô tả API  

Output:  
Danh sách endpoint + request/response mẫu (JSON).

Workshop giải thích rõ:
API contract là “luật chơi”.
Nếu không chốt từ đầu, frontend và backend sẽ kéo nhau sửa liên tục.

---

### Prompt 3: Sinh code backend theo kiến trúc chuẩn

Chỉ khi schema và API contract đã chốt xong,
workshop mới cho AI sinh code backend.

Prompt mẫu:

Bạn là Senior Backend Developer.

Task:  
Viết module quản lý nhân viên.

Context:  
- Database PostgreSQL  
- Đã có schema `employees`  
- Đã có API contract  
- Sử dụng NestJS (hoặc Express nếu đã chốt từ đầu)  

Constraint:  
- Tách rõ controller, service, repository  
- Không viết business logic trong controller  
- Có DTO validate dữ liệu đầu vào  
- Có try-catch và error handling rõ ràng  
- Không viết code ngoài phạm vi module nhân viên  

Output:  
Chỉ sinh code backend cho module này. Không giải thích thêm.

Workshop nhấn mạnh một điểm rất quan trọng:
AI **không được quyền tự chọn kiến trúc**.
Toàn bộ cấu trúc đã được người ra lệnh khoanh sẵn.

---

### Điều workshop muốn người tham gia rút ra ở phần này

- AI viết code tốt hay không phụ thuộc vào **chất lượng prompt**
- Prompt tốt không phải prompt dài, mà là prompt **đủ ngữ cảnh và đủ ràng buộc**
- Viết chậm hơn một chút ở đầu → tiết kiệm rất nhiều thời gian debug về sau

Đây là điểm khác biệt lớn nhất giữa:
- vibe coding (hỏi cho có)
- và engineering prompt (ra lệnh có kiểm soát)

## 5.5. Prompt mẫu – Frontend (kết nối đúng với API, không làm UI cho có)

Sau khi backend đã có schema rõ ràng và API contract ổn định,
frontend **không được làm theo kiểu vẽ giao diện trước rồi cầu backend chạy theo**.

Workshop nhấn mạnh:
Frontend chuẩn không phải là UI đẹp,
mà là **UI gắn chặt với API contract và xử lý đầy đủ trạng thái thực tế**.

---

### Vấn đề vibe coder hay gặp ở frontend

Rất nhiều người vibe coding frontend theo kiểu:

- AI vẽ giao diện rất nhanh
- Call API trực tiếp trong component
- Không có loading / error / empty state
- Khi API đổi format → UI vỡ toàn bộ

Nguyên nhân không phải do React hay framework,
mà do **prompt không đặt frontend vào vai trò đúng**.

---

### Nguyên tắc frontend trong workshop

Trước khi prompt frontend, workshop chốt 4 nguyên tắc:

1. Frontend **phải dựa trên API contract đã chốt**
2. Logic gọi API phải tách khỏi UI
3. UI phải xử lý đủ 3 trạng thái: loading – error – empty
4. Không hard-code dữ liệu giả trong component chính

---

### Prompt 4: Tạo service layer cho frontend

Workshop luôn bắt đầu frontend từ **service layer**, không phải từ UI.

Prompt mẫu:

Bạn là Senior Frontend Developer.

Task:  
Viết service layer cho module quản lý nhân viên.

Context:  
- Đã có API contract cho employees  
- Frontend dùng React (hoặc NextJS nếu đã chốt)  

Constraint:  
- Tách riêng file gọi API  
- Mỗi function tương ứng một endpoint  
- Xử lý response và error tập trung  
- Không viết UI  

Output:  
Code service layer cho module employees.

Workshop giải thích:
Nếu API có thay đổi,
chỉ sửa service layer → UI không bị ảnh hưởng dây chuyền.

---

### Prompt 5: Sinh UI danh sách nhân viên dựa trên service layer

Chỉ sau khi service layer xong,
workshop mới cho AI sinh UI.

Prompt mẫu:

Bạn là Senior Frontend Developer.

Task:  
Xây dựng màn hình danh sách nhân viên.

Context:  
- Đã có service layer cho employees  
- API list có pagination  
- Dữ liệu trả về gồm: id, name, email, status  

Constraint:  
- Không gọi API trực tiếp trong JSX  
- Có loading state  
- Có empty state khi không có dữ liệu  
- Có error state khi API lỗi  
- Code dễ đọc, không viết dồn vào một component  

Output:  
Code component danh sách nhân viên.

Workshop nhấn mạnh:
UI không xử lý logic phức tạp,
UI chỉ **render theo state**.

---

### Prompt 6: Form thêm / sửa nhân viên

Đây là chỗ vibe coder hay làm ẩu nhất: form không validate, submit là xong.

Prompt mẫu:

Bạn là Senior Frontend Developer.

Task:  
Xây dựng form thêm / sửa nhân viên.

Context:  
- Có service create/update employee  
- Backend đã validate email, status  

Constraint:  
- Validate cơ bản ở frontend  
- Hiển thị lỗi từ backend rõ ràng  
- Không hard-code status  
- Không duplicate logic create và update  

Output:  
Code form component.

Workshop chỉ ra:
Frontend không thay thế backend validate,
nhưng phải **hiển thị lỗi đúng và đủ để người dùng hiểu**.

---

### Điều workshop muốn người tham gia rút ra ở phần frontend

- Frontend không phải là “vẽ UI”
- Frontend là **kết nối đúng với backend**
- Prompt frontend phải dựa trên contract, không dựa trên tưởng tượng
- Nếu frontend viết đúng từ đầu, backend đổi cũng không vỡ

Đây chính là khác biệt giữa:
- vibe frontend (chạy được là xong)
- và frontend có thể sống trong dự án thật


## 6. Debug cho vibe coder – sửa lỗi theo workflow, không sửa theo cảm tính

Đây là phần quan trọng nhất của workshop.

Rất nhiều người bỏ cuộc không phải vì không biết viết code,
mà vì **không biết sửa lỗi khi code bắt đầu sai**.

Workshop không dạy debug theo kiểu đọc tài liệu hay đoán mò,
mà đưa ra **một workflow debug cố định**, áp dụng được cho cả frontend, backend và database.

---

### Vấn đề cốt lõi của vibe coding khi gặp lỗi

Khi gặp lỗi, vibe coder thường làm một trong ba việc:

- Nhìn log thấy sợ → bỏ qua
- Copy log hỏi AI nhưng không giải thích gì thêm
- Bảo AI “sửa giúp tôi” → AI viết lại cả đống code

Kết quả:
- Không hiểu lỗi ở đâu
- Sửa xong vẫn không biết vì sao đúng
- Lỗi mới phát sinh tiếp

Workshop nhấn mạnh:
**AI không tự debug được nếu người dùng không biết đưa bằng chứng.**

---

### Workflow debug chuẩn dùng xuyên suốt workshop

Mọi lỗi trong workshop đều được xử lý theo **3 bước cố định**.
Không nhảy bước. Không làm tắt.

---

### Bước 1: Khoanh vùng lỗi (Locate)

Câu hỏi đầu tiên **không phải là “lỗi gì”**, mà là:

> Lỗi nằm ở đâu?

Workshop hướng dẫn cách khoanh vùng rất thực tế:

- Frontend hay backend?
- Request có được gửi đi không? (Network tab)
- Backend có nhận request không?
- Response trả về status gì?

Chỉ cần trả lời được:
> “Lỗi chắc chắn nằm ở FE / BE / DB”

là đã loại được 70% đoán mò.

---

### Bước 2: Lấy bằng chứng (Log-based)

Workshop cấm một việc:
**diễn giải log bằng lời**.

Không được nói kiểu:
> “Nó báo lỗi connect database”

Mà bắt buộc phải:

- Copy **nguyên văn** log hoặc stacktrace
- Giữ nguyên format
- Không cắt bớt

Vì:
AI không sửa lỗi dựa trên cảm giác,
AI sửa lỗi dựa trên **dòng log cụ thể**.

---

### Bước 3: Prompt sửa lỗi đúng cách (Fix with context)

Đây là chỗ vibe coder khác dev nhiều nhất.

#### Vibe coder hay prompt kiểu:
“Sửa lỗi giúp tôi”

#### Workshop bắt buộc prompt theo cấu trúc:

- Mục tiêu đoạn code là gì
- Log lỗi nguyên văn
- File hoặc module liên quan
- Phạm vi sửa cho phép

---

### Prompt mẫu sửa lỗi (mọi người dùng lại được)

Prompt debug chuẩn:

Bạn là Senior Developer.

Context:
Đây là mục tiêu của đoạn code:
[Mô tả ngắn mục tiêu]

Log lỗi (nguyên văn):
[Paste log]

File nghi ngờ:
[Tên file hoặc module]

Task:
1. Giải thích root cause của lỗi
2. Đưa ra hướng sửa cụ thể
3. Chỉ sửa phần liên quan, không viết lại toàn bộ hệ thống

Constraint:
- Không thay đổi kiến trúc
- Không thêm thư viện mới nếu không cần thiết

Output:
Giải thích ngắn gọn + đoạn code sửa.

Workshop nhấn mạnh:
**AI sửa rất tốt khi bị giới hạn phạm vi.**
AI phá rất nhanh khi được “toàn quyền”.

---

### Các nhóm lỗi workshop sẽ demo

Trong workshop, các lỗi được chia theo nhóm để dễ nhận diện:

- Lỗi environment (env, database connection)
- Lỗi validate dữ liệu
- Lỗi query / ORM
- Lỗi gọi API frontend
- Lỗi state / async ở frontend

Mỗi nhóm lỗi đều áp dụng **chung một workflow debug**,
chỉ khác vị trí khoanh vùng.

---

### Điều workshop muốn người tham gia rút ra ở phần debug

- Debug không phải kỹ năng cao siêu
- Debug là **quy trình**
- Có quy trình → không hoảng
- Có bằng chứng → AI làm việc tốt hơn rất nhiều

Sau phần này, người tham gia không còn “sợ log”,
mà biết log là **manh mối**.

## 7. Tối ưu vừa đủ – làm hệ thống sống được, không khoe kỹ thuật

Sau khi hệ thống đã chạy đúng, workshop **không** đi theo hướng tối ưu phức tạp.
Không benchmark, không micro-optimization, không tuning để “cho ngầu”.

Workshop chỉ tập trung vào một câu hỏi duy nhất:

> Nếu hệ thống này dùng thật, thì những chỗ nào cần tối ưu ngay để:
> - không chậm
> - không tốn tài nguyên
> - không tự bắn vào chân mình

---

### Vì sao vibe coder hay tối ưu sai chỗ

Vibe coder thường rơi vào hai thái cực:

- Không tối ưu gì cả → hệ thống chậm, tốn tiền
- Hoặc tối ưu quá sớm → code phức tạp, khó sửa

Workshop nhấn mạnh:
**tối ưu là để giải quyết vấn đề thật, không phải để khoe kỹ năng.**

---

### Nguyên tắc tối ưu của workshop

Workshop dùng 3 nguyên tắc xuyên suốt:

1. Tối ưu những chỗ người dùng chạm vào nhiều nhất  
2. Tối ưu những chỗ ảnh hưởng trực tiếp đến chi phí  
3. Tối ưu nhưng không làm code khó hiểu hơn

---

### Backend: những tối ưu bắt buộc phải có

#### Pagination – không bao giờ load tất cả

Danh sách nhân viên **bắt buộc** có pagination.

Workshop nhấn mạnh:
- Không bao giờ trả về 1000 bản ghi
- Không tin vào câu “sau này dữ liệu ít”

Pagination giúp:
- Response nhẹ
- Query nhanh
- Frontend dễ xử lý

---

#### Index – đánh đúng chỗ, không đánh bừa

Index được tạo cho:
- email
- name (nếu có search)

Không index mọi field.
Chỉ index field **dùng để query nhiều**.

Index sai còn làm chậm hơn không index.

---

### Frontend: tối ưu trải nghiệm & API call

#### Debounce search

Workshop chỉ rõ:
- Không gọi API mỗi lần gõ phím
- Debounce là tối ưu **rẻ nhưng hiệu quả cao**

Chỉ cần debounce 300–500ms:
- Giảm số request
- Backend nhẹ hơn
- UI mượt hơn

---

#### Không fetch lại dữ liệu vô ích

Frontend không được:
- Reload toàn bộ list sau mỗi thao tác nhỏ
- Gọi API trùng lặp không cần thiết

Workshop hướng dẫn cách:
- Update state cục bộ
- Re-fetch có kiểm soát

---

### Response format – trả đúng cái cần dùng

List API:
- Chỉ trả field cần hiển thị

Detail API:
- Trả đầy đủ hơn

Workshop tránh kiểu:
> “cứ trả hết cho tiện”

Vì:
- Response nặng
- Frontend dễ phụ thuộc bừa
- Sau này khó tối ưu lại

---

### Tối ưu để tiết kiệm chi phí (không chỉ tốc độ)

Workshop nhấn mạnh:
tối ưu không chỉ là nhanh hơn,
mà là **ít tài nguyên hơn**.

- Ít query hơn → ít CPU
- Ít data hơn → ít bandwidth
- Ít request hơn → ít tiền server

Đây là tư duy rất quan trọng khi dùng AI + automation + cloud.

---

### Điều workshop muốn người tham gia rút ra

- Tối ưu không phải làm càng nhiều càng tốt
- Tối ưu đúng chỗ → hệ thống sống lâu
- Code dễ hiểu quan trọng hơn code “ngầu”

Sau phần này, hệ thống quản lý nhân viên:
- Chạy ổn
- Không tốn tài nguyên vô ích
- Dễ mở rộng khi cần


## 8. Lồng Apify vào đúng chỗ – Build vs Use Tool

Sau khi hệ thống quản lý nhân viên đã chạy ổn, workshop cố tình dừng lại ở một câu hỏi rất thực tế:

> Dữ liệu đâu ra?

Nếu chỉ demo vài bản ghi thì có thể nhập tay.
Nhưng nếu cần vài chục, vài trăm, hoặc dữ liệu thật từ bên ngoài thì nhập tay là không khả thi.

Đây là thời điểm rất nhiều người mắc sai lầm:
- Hoặc là cố tự viết scraper
- Hoặc là bỏ qua luôn bài toán dữ liệu

Workshop dùng phần này để đặt lại tư duy.

---

### Tư duy cốt lõi: Build vs Use Tool

Không phải bài toán nào cũng nên tự code.

Workshop phân biệt rất rõ hai loại việc:

**Những thứ nên tự build**
- Core business logic
- CRUD, phân quyền, workflow
- Những thứ gắn chặt với sản phẩm

**Những thứ nên dùng tool**
- Thu thập dữ liệu từ website bên ngoài
- Scrape lead, profile, danh sách
- Những thứ dễ bị block, dễ hỏng, tốn công maintain

Trang quản lý nhân viên là core → tự build  
Lấy dữ liệu nhân viên / lead từ bên ngoài → dùng tool

---

### Vì sao không tự viết scraper trong workshop

Workshop giải thích rất rõ lý do:

- Website bên ngoài thay đổi liên tục
- Có chống bot, rate limit, captcha
- Viết xong chưa chắc chạy lâu
- Bảo trì tốn công hơn giá trị mang lại

Đây là dạng bài toán:
**dùng tool là quyết định kỹ thuật tốt hơn**.

---

### Apify được đưa vào với đúng vai trò

Apify không xuất hiện như một công cụ rời rạc.
Nó xuất hiện để giải quyết **bài toán dữ liệu đầu vào cho chính hệ thống đang làm**.

Workflow demo Apify trong workshop:

1. Chọn một Actor có sẵn (scraper)
2. Nhập input (URL, keyword, location…)
3. Chạy task
4. Theo dõi trạng thái
5. Xem dataset kết quả
6. Export dữ liệu (JSON / CSV)

Workshop không dạy “cách scrape cho giỏi”,
mà dạy cách **dùng tool có sẵn một cách đúng chỗ**.

---

### Kết nối Apify với hệ thống đã build

Sau khi có dataset từ Apify, workshop quay lại hệ thống quản lý nhân viên:

- Dùng dataset làm dữ liệu mẫu
- Hoặc import trực tiếp vào database
- Hoặc dùng để demo list/search/pagination

Điểm quan trọng:
Apify **không thay thế hệ thống**,
mà **bơm dữ liệu cho hệ thống sống được**.

---

### Điều workshop muốn người tham gia hiểu

- Không phải cứ code được là nên code
- Biết bỏ tiền đúng chỗ là một kỹ năng kỹ thuật
- Tool không làm dev yếu đi, mà làm dev hiệu quả hơn

Với AI + tool:
- Dev tập trung vào quyết định
- Tool làm việc nặng
- Hệ thống dễ sống lâu hơn

---

### Sau phần này, hệ thống đạt được gì

- Có dữ liệu thật để chạy
- Không mất công nhập tay
- Không cần viết scraper phức tạp
- Workflow end-to-end hoàn chỉnh

Từ prompt → code → debug → tối ưu → dữ liệu thật
## 9. Tổng kết workflow – Điều quan trọng nhất của workshop

Workshop không được thiết kế để người tham gia nhớ từng dòng code,
mà để nhớ **cách làm việc với bài toán kỹ thuật và AI**.

Toàn bộ buổi workshop xoay quanh một workflow duy nhất,
có thể áp dụng lại cho hầu hết các bài toán sau này.

---

### Workflow chuẩn đã đi qua trong workshop

1. **Chốt bài toán trước khi code**
   - Xác định rõ mình đang giải quyết vấn đề gì
   - Phạm vi đến đâu thì dừng
   - Không làm mọi thứ cùng lúc

2. **Chốt data model và API contract**
   - Data quyết định 80% cấu trúc hệ thống
   - FE và BE phải nói cùng một ngôn ngữ
   - Không để AI tự “sáng tạo” cấu trúc

3. **Ra lệnh cho AI bằng prompt có cấu trúc**
   - Role rõ ràng
   - Task cụ thể
   - Context đầy đủ
   - Constraint chặt chẽ

   AI không thông minh hơn người đặt câu hỏi.
   Người đặt prompt càng giống dev thật, output càng giống code thật.

4. **Sinh code theo module, không sinh cả hệ thống**
   - Mỗi lần chỉ sinh một phần
   - Kiểm soát được output
   - Dễ sửa, dễ thay

5. **Debug theo log, không theo cảm giác**
   - Khoanh vùng
   - Lấy bằng chứng
   - Prompt sửa lỗi có ngữ cảnh

   Không hỏi AI kiểu “sao lỗi vậy”.
   Hỏi AI bằng dữ liệu, log và mục tiêu rõ ràng.

6. **Tối ưu vừa đủ**
   - Không over-engineering
   - Không code demo
   - Tối ưu đúng chỗ ảnh hưởng đến chi phí và trải nghiệm

7. **Biết khi nào nên build, khi nào nên dùng tool**
   - Core logic → build
   - Việc nặng, rủi ro, dễ hỏng → dùng tool
   - Không ôm hết mọi thứ về mình

---

### Vì sao workshop chọn bài toán quản lý nhân viên

Workshop không chọn bài toán “cho hay”,
mà chọn bài toán **cho thấy rõ sự khác biệt giữa vibe coding và engineering**.

Trang quản lý nhân viên có đủ mọi thứ:
- CRUD
- Frontend + backend + database
- Validate
- Pagination
- Debug
- Tối ưu
- Dữ liệu thật

Nếu làm được bài toán này theo workflow,
thì:
- Làm dashboard
- Làm CRM
- Làm tool nội bộ
- Làm automation
- Làm data pipeline

… đều dùng lại được tư duy y hệt.

---

### Điều workshop không cố làm

- Không biến mọi người thành senior dev
- Không dạy framework chi tiết
- Không dạy tool theo kiểu “click vào đâu”

Workshop chỉ làm một việc:
**giúp người tham gia kiểm soát được AI và bài toán**.

---

### Thông điệp cuối cùng

AI rất nhanh.
AI rất mạnh.
Nhưng AI không có trách nhiệm với hệ thống của bạn.

Người dùng AI phải là người:
- Chốt bài toán
- Đặt luật chơi
- Đọc log
- Quyết định build hay dùng tool

Nếu không, AI sẽ viết code cho bạn,
nhưng bạn sẽ là người gánh hậu quả.

Workshop kết thúc ở đây,
nhưng workflow này có thể dùng cho rất nhiều bài toán khác sau này.



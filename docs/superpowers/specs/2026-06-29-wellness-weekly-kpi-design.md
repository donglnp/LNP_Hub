# Wellness Challenge — Mô hình tuần & headline Dashboard

Ngày: 2026-06-29
Phạm vi: `src/games/wellness-challenge/` (chủ yếu `lib/data.js`, `pages/Dashboard.jsx`, `pages/Rules.jsx`) + i18n keys trong `src/lib/i18n.jsx`.

## Vấn đề

`<h1>` hero trên Dashboard nói về **tuần**, trong khi Ring ngay cạnh nói về **tháng** → lệch nhau, cuối tháng/đầu tuần hiển thị vô lý ("cuối tháng rồi vẫn báo cần thêm trọn KPI"). Ngoài ra tuần đang đếm theo ISO liên tục (Thứ 2→CN suốt 3 tháng) nên có tuần vắt qua 2 tháng, dính 2 bậc KPI khác nhau.

## Quyết định thiết kế

### 1. Định nghĩa tuần — theo NGÀY TRONG THÁNG
Tuần reset mỗi tháng, **bỏ qua thứ trong tuần**:
- Tuần 1 = ngày 1–7, Tuần 2 = 8–14, Tuần 3 = 15–21, Tuần 4 = 22–28
- **Ngày 29/30/31 = "ngày lẻ"** → nghỉ/bù, KHÔNG gắn KPI tuần

Mọi tháng đều ra đúng 4 tuần đều nhau, khớp `monthlyKpi = weeklyKpi × 4`.

### 2. THÁNG là nguồn sự thật, TUẦN chỉ để nhắc nhịp
- **Giải thưởng & "đạt KPI" đánh giá theo tổng THÁNG** (`monthKcal ≥ monthlyKpi`). Cả 3 giải hiện tại đều theo tháng nên tháng vốn đã là cái quyết định tiền thưởng.
- **"Bù" tự động:** kcal log vào ngày lẻ (29–31) cộng thẳng vào tổng tháng. Ai hụt tuần nào vẫn gỡ được bằng tổng tháng → đúng tinh thần "bù vào tuần trước" mà **không cần** logic gán-bù-từng-tuần.
- **Tuần** chỉ còn vai trò: (a) gợi ý nhịp ("tuần này nên đạt ~N kcal"), (b) chỉ số động viên "số tuần đạt KPI" — đếm 4 tuần thật của mỗi tháng; ngày lẻ không phải tuần nên không tính.

### 3. Headline Dashboard — hiện CẢ tháng (chính) + tuần (nhịp)
H1 nói theo THÁNG để khớp Ring; dòng phụ nói nhịp TUẦN với chữ tử tế hơn.

| Tình huống | H1 (theo THÁNG, khớp Ring) | Dòng phụ (nhịp TUẦN) |
|---|---|---|
| Chưa đạt KPI tháng | "Cần thêm **{X} kcal** để đạt KPI tháng {tháng}." | "Tuần này nên đạt ~{kpi} kcal · còn {n} ngày" |
| Đã đạt KPI tháng | "Đã đạt KPI tháng {tháng}. Tuyệt vời! 🔥" | "Giữ nhịp tuần để săn giải calo cao nhất 🔥" |
| Đang ở ngày lẻ (29–31) | (giữ câu theo tháng ở trên) | "Ngày nghỉ/bù — tuần KPI đã khép, kcal vẫn cộng vào tháng" |
| Đầu tuần mới (tuần chưa log) | (giữ câu theo tháng) | "Tuần mới — mục tiêu ~{kpi} kcal 💪" (không hét "cần thêm trọn KPI") |

## Thay đổi kỹ thuật

### `lib/data.js`
Thêm helper tính tuần theo ngày-trong-tháng; KHÔNG dùng `isoWeek/weekKey/startOfIsoWeek/endOfIsoWeek` cho phần Wellness nữa (có thể giữ lại nếu nơi khác dùng — kiểm tra trước khi xóa):
- `monthWeekIndex(date)` → `1..4`, hoặc `0`/`null` nếu là ngày lẻ (ngày ≥ 29).
- `monthWeekRange(year, monthNum, weekIdx)` → `{start, end}` (ngày 1–7, 8–14, 15–21, 22–28).
- `isLeftoverDay(date)` → `true` nếu ngày ≥ 29.
- `sumKcalThisMonthWeek(entries, now)` → tổng kcal của tuần-trong-tháng hiện tại (rỗng nếu đang ngày lẻ).
- `daysLeftInMonthWeek(now)` → số ngày còn lại trong tuần-trong-tháng hiện tại (0 nếu ngày lẻ).
- `weeksMetKpi(entries, gender)` → sửa: gom theo `(tháng, weekIdx 1..4)`, bỏ entry ngày lẻ; đếm bucket có `kcal ≥ weeklyKpi(gender, tháng)`. Hàm này còn dùng ở `Leaderboard.jsx` (`weeks_hit`) → định nghĩa mới áp dụng nhất quán cho cả leaderboard.

`weeklyKpi`, `monthlyKpi`, `sumKcalThisMonth`, `clampToProgram`, `currentMonthInfo`, `programState/Progress` giữ nguyên.

### `pages/Dashboard.jsx`
- H1 chuyển sang trạng thái theo THÁNG (dùng `monthKcal`/`monthKpi`).
- Dòng phụ dùng nhịp tuần mới (`sumKcalThisMonthWeek`, `daysLeftInMonthWeek`, `isLeftoverDay`).
- Ring giữ nguyên (đang theo tháng).
- StatCard "số tuần đạt" dùng `weeksMetKpi` đã sửa.

### `pages/Rules.jsx` + i18n
Bổ sung "Cách chơi": một mục mô tả cách tính tuần mới (ngày 1–7 / 8–14 / 15–21 / 22–28, ngày 29–31 là ngày nghỉ/bù, kcal ngày lẻ cộng vào tổng tháng, giải thưởng tính theo tháng). Cập nhật `wc.rules_kpi_note` nếu cần cho rõ.

### i18n
Tất cả chuỗi mới thêm key `wc.*` đủ 3 ngôn ngữ (en/vi/ja). Không hardcode.

## Ngoài phạm vi (YAGNI)
- Không làm cơ chế gán-bù-từng-tuần riêng (tổng tháng đã xử lý).
- Không đổi schema DB, không đổi cấu trúc giải thưởng.

import { createContext, useContext, useEffect, useState } from "react";

export const LANGS = [
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "vi", label: "Tiếng Việt", short: "VI", flag: "🇻🇳" },
  { code: "ja", label: "日本語", short: "JA", flag: "🇯🇵" },
];

const STORAGE_KEY = "arena-lang";

const dict = {
  // ---------- Common ----------
  "common.system_online": {
    en: "◆ System Online",
    vi: "◆ Hệ thống đang hoạt động",
    ja: "◆ システム稼働中",
  },
  "common.copyright": {
    en: "© 2026 LNP Fun",
    vi: "© 2026 LNP Fun",
    ja: "© 2026 LNP Fun",
  },
  "common.source": { en: "source", vi: "nguồn", ja: "ソース" },
  "common.loading": { en: "Loading…", vi: "Đang tải…", ja: "読み込み中…" },
  "common.saving": { en: "Saving…", vi: "Đang lưu…", ja: "保存中…" },
  "common.you": { en: "You", vi: "Bạn", ja: "あなた" },

  // ---------- Catalog (home) ----------
  "catalog.welcome": { en: "Welcome", vi: "Chào mừng", ja: "ようこそ" },
  "catalog.tagline": {
    en: "Pick a game to jump into. Your sign-in works across every game in the Arena.",
    vi: "Chọn một hoạt động để bắt đầu. Tài khoản của bạn dùng chung cho mọi hoạt động.",
    ja: "ゲームを選んで参加しよう。サインインは Arena 内のすべてのゲームで共通です。",
  },
  "catalog.tag_play": { en: "Play", vi: "Tham gia", ja: "プレイ" },
  "catalog.tag_coming_soon": {
    en: "Coming Soon",
    vi: "Sắp có",
    ja: "近日公開",
  },
  "catalog.tag_upcoming": {
    en: "Upcoming",
    vi: "Sắp diễn ra",
    ja: "開催予定",
  },
  "catalog.tag_upcoming_date": {
    en: "Upcoming · {date}",
    vi: "Sắp diễn ra · {date}",
    ja: "開催予定 · {date}",
  },
  "catalog.tag_running": { en: "Live", vi: "Đang diễn ra", ja: "開催中" },
  "catalog.tag_ended": { en: "Ended", vi: "Đã kết thúc", ja: "終了" },
  "catalog.tag_suggest": { en: "Suggest", vi: "Góp ý", ja: "提案" },
  "catalog.wc_name": {
    en: "World Cup 2026",
    vi: "World Cup 2026",
    ja: "ワールドカップ 2026",
  },
  "catalog.wc_desc": {
    en: "Predict every FIFA World Cup 2026 match and climb the company leaderboard.",
    vi: "Dự đoán mọi trận FIFA World Cup 2026 và leo top bảng xếp hạng công ty.",
    ja: "FIFA ワールドカップ 2026 の全試合を予想し、社内ランキングで上位を目指そう。",
  },
  "catalog.wellness_name": {
    en: "Wellness Challenge",
    vi: "Wellness Challenge",
    ja: "Wellness Challenge",
  },
  "catalog.wellness_desc": {
    en: "3-month wellness program — log kcal, hit weekly KPI, win prizes.",
    vi: "Chương trình rèn luyện sức khoẻ 3 tháng — ghi calo, đạt KPI tuần, săn giải thưởng.",
    ja: "3か月のウェルネスプログラム — kcalを記録し、週間KPIを達成して賞品を獲得。",
  },
  "catalog.suggest_name": {
    en: "Suggest an activity",
    vi: "Đề xuất hoạt động",
    ja: "アクティビティを提案",
  },
  "catalog.suggest_desc": {
    en: "Got an idea for a new activity? Share it with us right away.",
    vi: "Bạn có ý tưởng cho hoạt động mới? Hãy chia sẻ với chúng tôi ngay.",
    ja: "新しいアクティビティのアイデアはありますか？ぜひ共有してください。",
  },
  "catalog.suggest_subject": {
    en: "New activity suggestion",
    vi: "Đề xuất hoạt động mới",
    ja: "新しいアクティビティの提案",
  },
  "catalog.lw_name": {
    en: "Lucky Wheel",
    vi: "Lucky Wheel",
    ja: "Lucky Wheel",
  },
  "catalog.lw_desc": {
    en: "Spin the wheel and test your luck.",
    vi: "Quay vòng quay thử vận may.",
    ja: "ホイールを回して運試し。",
  },

  // ---------- Lucky Wheel ----------
  "lw.brand_tag": { en: "Lucky", vi: "May mắn", ja: "ラッキー" },
  "lw.tag": { en: "◆ Lucky Wheel", vi: "◆ Vòng quay", ja: "◆ ラッキーホイール" },
  "lw.title": {
    en: "Spin to Win",
    vi: "Quay là trúng",
    ja: "回して当てよう",
  },
  "lw.tagline": {
    en: "Add your own options, spin the wheel, get a random pick.",
    vi: "Tự thêm lựa chọn, quay và để vòng quay chọn giúp bạn.",
    ja: "選択肢を追加してホイールを回し、ランダムに選ぼう。",
  },
  "lw.spin": { en: "Spin", vi: "Quay", ja: "スピン" },
  "lw.spinning": { en: "Spinning…", vi: "Đang quay…", ja: "回転中…" },
  "lw.result": { en: "Result", vi: "Kết quả", ja: "結果" },
  "lw.history": { en: "Recent spins", vi: "Lượt quay gần đây", ja: "最近のスピン" },
  "lw.history_empty": {
    en: "No spins yet. Give the wheel a whirl!",
    vi: "Chưa có lượt nào. Hãy thử quay nhé!",
    ja: "まだスピンがありません。回してみよう!",
  },
  "lw.clear": { en: "Clear", vi: "Xoá", ja: "クリア" },
  "lw.options_title": { en: "Options", vi: "Danh sách", ja: "選択肢" },
  "lw.options_hint": {
    en: "One per line — or separate with commas.",
    vi: "Mỗi dòng một mục — hoặc cách nhau bằng dấu phẩy.",
    ja: "1行に1つ、またはカンマで区切ってください。",
  },
  "lw.options_placeholder": {
    en: "Option A\nOption B\nOption C",
    vi: "Lựa chọn A\nLựa chọn B\nLựa chọn C",
    ja: "選択肢 A\n選択肢 B\n選択肢 C",
  },
  "lw.options_count": {
    en: "{n} options",
    vi: "{n} mục",
    ja: "{n} 項目",
  },
  "lw.apply": { en: "Apply", vi: "Áp dụng", ja: "適用" },
  "lw.load_users": {
    en: "Load users",
    vi: "Lấy danh sách user",
    ja: "ユーザー読込",
  },

  // ---------- Nav ----------
  "nav.dashboard": { en: "Dashboard", vi: "Tổng quan", ja: "ダッシュボード" },
  "nav.matches": { en: "Matches", vi: "Trận đấu", ja: "試合" },
  "nav.leaderboard": {
    en: "Leaderboard",
    vi: "Bảng xếp hạng",
    ja: "ランキング",
  },

  // ---------- Login ----------
  "login.headline_1": { en: "Welcome to", vi: "Chào mừng đến", ja: "ようこそ" },
  "login.headline_2": { en: "LNP", vi: "LNP", ja: "LNP" },
  "login.headline_3": { en: "Hub.", vi: "Hub.", ja: "Hub。" },
  "login.tagline": {
    en: "Internal playground for the LNP team — pick a game and play.",
    vi: "Sân chơi nội bộ cho team LNP — chọn một game và bắt đầu.",
    ja: "LNP チーム向けの社内プレイグラウンド — ゲームを選んで遊ぼう。",
  },
  "login.subtitle": {
    en: "Sign in with your Google account — no password required.",
    vi: "Đăng nhập bằng tài khoản Google — không cần mật khẩu.",
    ja: "Google アカウントでサインイン — パスワード不要。",
  },
  "login.continue_google": {
    en: "Continue with Google",
    vi: "Tiếp tục với Google",
    ja: "Google で続行",
  },
  "login.signing": {
    en: "Redirecting…",
    vi: "Đang chuyển hướng…",
    ja: "リダイレクト中…",
  },
  "login.err_supabase": {
    en: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
    vi: "Supabase chưa được cấu hình. Thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong .env.",
    ja: "Supabase が未設定です。.env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。",
  },
  "login.env_missing": {
    en: "Supabase env vars missing — see .env.example.",
    vi: "Thiếu biến môi trường Supabase — xem .env.example.",
    ja: "Supabase 環境変数が未設定 — .env.example を参照してください。",
  },

  // ---------- Dashboard ----------
  "dash.up_next": { en: "Up Next", vi: "Trận kế tiếp", ja: "次の試合" },
  "dash.starts_in": { en: "STARTS IN", vi: "BẮT ĐẦU SAU", ja: "開始まで" },
  "dash.group": { en: "Group", vi: "Bảng", ja: "グループ" },
  "dash.later_today": {
    en: "Later Today",
    vi: "Tiếp theo hôm nay",
    ja: "本日の残り",
  },
  "dash.no_more": {
    en: "No more matches in queue.",
    vi: "Không còn trận nào trong hàng đợi.",
    ja: "他に予定されている試合はありません。",
  },
  "dash.my_stats": {
    en: "My Stats",
    vi: "Thống kê của tôi",
    ja: "マイ統計",
  },
  "dash.current_rank": {
    en: "Current Rank",
    vi: "Hạng hiện tại",
    ja: "現在の順位",
  },
  "dash.total_pts": { en: "Total Pts", vi: "Tổng điểm", ja: "合計ポイント" },
  "dash.locked": {
    en: "Locked",
    vi: "Đã khóa",
    ja: "ロック済み",
  },
  "dash.top5": { en: "Top 5", vi: "Top 5", ja: "トップ5" },
  "dash.no_predictions": {
    en: "No predictions yet. Be the first!",
    vi: "Chưa có dự đoán nào. Hãy là người đầu tiên!",
    ja: "予想はまだありません。最初の予想者になろう！",
  },
  "dash.edit_prediction": {
    en: "Edit Prediction",
    vi: "Sửa dự đoán",
    ja: "予想を編集",
  },
  "dash.lock_prediction": {
    en: "Lock Prediction",
    vi: "Khóa dự đoán",
    ja: "予想をロック",
  },
  "dash.pts": { en: "pts", vi: "điểm", ja: "pt" },
  "dash.pending": { en: "Pending", vi: "Chờ", ja: "保留中" },
  "dash.locked_badge": {
    en: "● Locked",
    vi: "● Đã khóa",
    ja: "● ロック済み",
  },

  // ---------- Matches ----------
  "matches.title": {
    en: "Match Center",
    vi: "Trung tâm trận đấu",
    ja: "マッチセンター",
  },
  "matches.all": {
    en: "All Matches",
    vi: "Tất cả trận",
    ja: "すべての試合",
  },
  "matches.knockouts": {
    en: "Knockouts",
    vi: "Vòng loại trực tiếp",
    ja: "決勝トーナメント",
  },
  "matches.none": {
    en: "No matches available.",
    vi: "Không có trận nào.",
    ja: "試合がありません。",
  },
  "matches.edit": { en: "Edit", vi: "Sửa", ja: "編集" },
  "matches.save": { en: "Save", vi: "Lưu", ja: "保存" },
  "matches.lock_in": { en: "Lock In", vi: "Khóa", ja: "ロック" },
  "matches.closed": { en: "Closed", vi: "Đã đóng", ja: "締切" },
  "matches.full_time": { en: "FT", vi: "KT", ja: "FT" },
  "status.locked": {
    en: "Prediction Locked",
    vi: "Đã khóa dự đoán",
    ja: "予想ロック済み",
  },
  "status.editing": { en: "Editing", vi: "Đang sửa", ja: "編集中" },
  "status.pending": { en: "Pending", vi: "Chờ", ja: "保留中" },
  "status.final": { en: "Final", vi: "Kết thúc", ja: "終了" },

  // ---------- Leaderboard ----------
  "lb.title": {
    en: "Company Leaderboard",
    vi: "Bảng xếp hạng công ty",
    ja: "社内ランキング",
  },
  "lb.subtitle": {
    en: "Global rankings updated in real-time after every match.",
    vi: "Bảng xếp hạng cập nhật trực tiếp sau mỗi trận.",
    ja: "試合ごとにリアルタイムで更新されます。",
  },
  "lb.your_rank": { en: "Your Rank", vi: "Hạng của bạn", ja: "あなたの順位" },
  "lb.your_points": {
    en: "Your Points",
    vi: "Điểm của bạn",
    ja: "あなたのポイント",
  },
  "lb.col_rank": { en: "Rank", vi: "Hạng", ja: "順位" },
  "lb.col_employee": { en: "Employee", vi: "Nhân viên", ja: "社員" },
  "lb.col_exact": {
    en: "Exact Scores",
    vi: "Tỉ số chính xác",
    ja: "完全一致" ,
  },
  "lb.col_correct": {
    en: "Correct Results",
    vi: "Kết quả đúng",
    ja: "結果正解",
  },
  "lb.col_points": {
    en: "Total Points",
    vi: "Tổng điểm",
    ja: "合計ポイント",
  },
  "lb.empty": {
    en: "No predictions yet. Be the first to play!",
    vi: "Chưa có dự đoán nào. Hãy là người đầu tiên!",
    ja: "予想はまだありません。最初の参加者になろう！",
  },

  // ---------- Profile ----------
  "profile.rank": { en: "Rank", vi: "Hạng", ja: "順位" },
  "profile.total_points": {
    en: "Total Points",
    vi: "Tổng điểm",
    ja: "合計ポイント",
  },
  "profile.sign_out": { en: "Sign out", vi: "Đăng xuất", ja: "サインアウト" },
  "profile.accuracy_breakdown": {
    en: "Accuracy Breakdown",
    vi: "Phân tích độ chính xác",
    ja: "正答率の内訳",
  },
  "profile.exact_matches": {
    en: "Exact Matches",
    vi: "Tỉ số chính xác",
    ja: "完全一致",
  },
  "profile.correct_outcomes": {
    en: "Correct Outcomes",
    vi: "Kết quả đúng",
    ja: "結果正解",
  },
  "profile.locked_predictions": {
    en: "Locked Predictions",
    vi: "Dự đoán đã khóa",
    ja: "ロック済み予想",
  },
  "profile.accuracy": { en: "Accuracy", vi: "Độ chính xác", ja: "正答率" },
  "profile.history": {
    en: "Prediction History",
    vi: "Lịch sử dự đoán",
    ja: "予想履歴",
  },
  "profile.empty": {
    en: "You haven't made any predictions yet. Head to Matches to start.",
    vi: "Bạn chưa có dự đoán nào. Vào Trận đấu để bắt đầu.",
    ja: "まだ予想していません。試合ページで始めましょう。",
  },
  "profile.col_match": { en: "Match", vi: "Trận", ja: "試合" },
  "profile.col_prediction": {
    en: "Your Prediction",
    vi: "Dự đoán của bạn",
    ja: "あなたの予想",
  },
  "profile.col_result": { en: "Result", vi: "Kết quả", ja: "結果" },
  "profile.col_status": { en: "Status", vi: "Trạng thái", ja: "状態" },
  "profile.col_updated": {
    en: "Updated",
    vi: "Cập nhật",
    ja: "更新日時",
  },
  "profile.status_locked": {
    en: "Locked",
    vi: "Đã khóa",
    ja: "ロック済み",
  },
  "profile.status_editing": {
    en: "Editing",
    vi: "Đang sửa",
    ja: "編集中",
  },

  // ---------- TeamSheet ----------
  "team.coach": { en: "Coach", vi: "HLV", ja: "監督" },
  "team.empty": {
    en: "Squad data not available yet.",
    vi: "Chưa có dữ liệu đội hình.",
    ja: "選手データはまだ利用できません。",
  },
  "team.col_name": { en: "Player", vi: "Cầu thủ", ja: "選手" },
  "team.col_role": { en: "Position", vi: "Vị trí", ja: "ポジション" },
  "team.col_age": { en: "Age", vi: "Tuổi", ja: "年齢" },
  "team.pos_goalkeeper": {
    en: "Goalkeepers",
    vi: "Thủ môn",
    ja: "ゴールキーパー",
  },
  "team.pos_defence": { en: "Defenders", vi: "Hậu vệ", ja: "ディフェンダー" },
  "team.pos_midfield": {
    en: "Midfielders",
    vi: "Tiền vệ",
    ja: "ミッドフィルダー",
  },
  "team.pos_offence": { en: "Forwards", vi: "Tiền đạo", ja: "フォワード" },
  "team.pos_other": { en: "Other", vi: "Khác", ja: "その他" },

  // ---------- Matches view toggle + bracket ----------
  "matches.view_list": { en: "List", vi: "Danh sách", ja: "リスト" },
  "matches.view_bracket": { en: "Bracket", vi: "Sơ đồ", ja: "トーナメント表" },
  "bracket.empty": {
    en: "Knockout bracket will appear here once the group stage concludes.",
    vi: "Sơ đồ vòng loại trực tiếp sẽ hiện khi vòng bảng kết thúc.",
    ja: "グループステージ終了後にトーナメント表が表示されます。",
  },
  "bracket.tbd": { en: "TBD", vi: "Chưa xác định", ja: "未定" },
  "bracket.r32": {
    en: "Round of 32",
    vi: "Vòng 1/16",
    ja: "ラウンド32",
  },
  "bracket.r16": {
    en: "Round of 16",
    vi: "Vòng 1/8",
    ja: "ラウンド16",
  },
  "bracket.qf": { en: "Quarter-finals", vi: "Tứ kết", ja: "準々決勝" },
  "bracket.sf": { en: "Semi-finals", vi: "Bán kết", ja: "準決勝" },
  "bracket.f": { en: "Final", vi: "Chung kết", ja: "決勝" },
  "bracket.tp": {
    en: "Third Place",
    vi: "Tranh hạng 3",
    ja: "3位決定戦",
  },

  // ---------- Rules ----------
  "rules.cta": { en: "How it works", vi: "Cách chơi", ja: "ルール" },
  "rules.title": {
    en: "How LNP Arena Works",
    vi: "Cách chơi LNP Arena",
    ja: "LNP Arena ルール",
  },
  "rules.section_scoring": {
    en: "Scoring",
    vi: "Cách tính điểm",
    ja: "得点方式",
  },
  "rules.scoring_exact": {
    en: "Exact score — predict the final score correctly (e.g. 2-1 vs actual 2-1).",
    vi: "Tỉ số chính xác — dự đoán đúng tỉ số (vd. 2-1 đúng với kết quả 2-1).",
    ja: "完全一致 — 正確なスコアを当てる（例：2-1 で実際も 2-1）。",
  },
  "rules.scoring_correct": {
    en: "Correct outcome — predict the right winner or a draw, but wrong score (e.g. 2-1 vs actual 3-0).",
    vi: "Kết quả đúng — đoán đúng đội thắng hoặc hòa nhưng sai tỉ số (vd. 2-1 và thực tế 3-0).",
    ja: "結果正解 — 勝者または引き分けを当てるがスコアは違う（例：2-1 で実際 3-0）。",
  },
  "rules.scoring_wrong": {
    en: "Wrong — anything else.",
    vi: "Sai — mọi trường hợp khác.",
    ja: "不正解 — それ以外。",
  },
  "rules.pts_exact": { en: "15 pts", vi: "15 điểm", ja: "15 pt" },
  "rules.pts_correct": { en: "5 pts", vi: "5 điểm", ja: "5 pt" },
  "rules.pts_wrong": { en: "0 pts", vi: "0 điểm", ja: "0 pt" },

  "rules.section_locking": {
    en: "Locking predictions",
    vi: "Khóa dự đoán",
    ja: "予想のロック",
  },
  "rules.locking_1": {
    en: "Edit your prediction freely until you click Lock Prediction.",
    vi: "Bạn có thể sửa dự đoán đến khi bấm Khóa dự đoán.",
    ja: "「予想をロック」を押すまで自由に編集できます。",
  },
  "rules.locking_2": {
    en: "Predictions must be locked before kick-off to count.",
    vi: "Dự đoán phải được khóa trước giờ thi đấu mới được tính.",
    ja: "予想はキックオフ前にロックする必要があります。",
  },
  "rules.locking_3": {
    en: "You can re-open and edit a locked prediction any time before kick-off.",
    vi: "Bạn có thể mở lại và sửa dự đoán bất cứ lúc nào trước trận đấu.",
    ja: "キックオフ前であればロックを解除して編集できます。",
  },

  "rules.section_ranking": {
    en: "Leaderboard",
    vi: "Bảng xếp hạng",
    ja: "ランキング",
  },
  "rules.ranking_1": {
    en: "Ranking is by total points. Ties broken by # exact scores, then # correct outcomes.",
    vi: "Xếp hạng theo tổng điểm. Cùng điểm thì xét số tỉ số chính xác, rồi đến số kết quả đúng.",
    ja: "順位は合計ポイント順。同点の場合は完全一致数、次に結果正解数で判定。",
  },
  "rules.ranking_2": {
    en: "Updated live after every match.",
    vi: "Cập nhật trực tiếp sau mỗi trận.",
    ja: "試合ごとにリアルタイムで更新されます。",
  },

  "rules.section_fairplay": {
    en: "Fair play",
    vi: "Fair play",
    ja: "フェアプレー",
  },
  "rules.fairplay_1": {
    en: "One account per employee. Use your company email.",
    vi: "Mỗi nhân viên 1 tài khoản. Dùng email công ty.",
    ja: "社員一人につき1アカウント。社用メールを使用してください。",
  },
  "rules.fairplay_2": {
    en: "Have fun and root for your team! 🏆",
    vi: "Chơi vui và cổ vũ đội mình nhé! 🏆",
    ja: "楽しんで応援しよう！🏆",
  },

  "rules.section_prizes": {
    en: "Prizes",
    vi: "Giải thưởng",
    ja: "賞品",
  },
  "rules.prizes_updating": {
    en: "Coming soon — details will be announced shortly.",
    vi: "Đang cập nhật — sẽ công bố trong thời gian tới.",
    ja: "近日公開 — 詳細は後日発表します。",
  },

  // ---------- Wellness Challenge: Layout / nav ----------
  "wc.brand_tag": { en: "Wellness", vi: "Wellness", ja: "Wellness" },
  "wc.tab_overview": { en: "Overview", vi: "Tổng quan", ja: "概要" },
  "wc.tab_history": { en: "History", vi: "Lịch sử", ja: "履歴" },
  "wc.tab_leaderboard": {
    en: "Leaderboard",
    vi: "Bảng xếp hạng",
    ja: "ランキング",
  },
  "wc.tab_rules": { en: "Rules", vi: "Cách chơi", ja: "ルール" },
  "wc.tab_log": { en: "Log workout", vi: "Ghi buổi tập", ja: "記録する" },

  // ---------- Wellness: self-submit (Log page) ----------
  "wc.btn_log": { en: "Log workout", vi: "Ghi buổi tập", ja: "記録する" },
  "wc.log_eyebrow": { en: "Self-submit", vi: "Tự ghi nhận", ja: "自己申告" },
  "wc.log_title": {
    en: "Log a workout",
    vi: "Ghi nhận buổi tập",
    ja: "ワークアウトを記録",
  },
  "wc.log_subtitle": {
    en: "Submit your session. Admin will review and attach photos.",
    vi: "Gửi buổi tập của bạn. Admin sẽ duyệt và đính kèm ảnh sau.",
    ja: "セッションを送信してください。管理者が確認し、写真を添付します。",
  },
  "wc.log_pending_hint": {
    en: "Entry will be marked Pending until an admin approves it.",
    vi: "Buổi tập sẽ ở trạng thái Chờ duyệt cho tới khi admin duyệt.",
    ja: "管理者が承認するまで「保留中」になります。",
  },
  "wc.log_field_date": { en: "Date", vi: "Ngày tập", ja: "日付" },
  "wc.log_field_exercise": { en: "Exercise", vi: "Loại hình", ja: "種目" },
  "wc.log_field_exercise_other": {
    en: "Specify exercise",
    vi: "Tên môn cụ thể",
    ja: "種目を入力",
  },
  "wc.log_field_duration": {
    en: "Minutes (≤120)",
    vi: "Phút (≤120)",
    ja: "分 (≤120)",
  },
  "wc.log_field_kcal": { en: "Calories (kcal)", vi: "Calo (kcal)", ja: "カロリー (kcal)" },
  "wc.log_field_device": { en: "Device", vi: "Thiết bị", ja: "デバイス" },
  "wc.log_field_device_other": {
    en: "Specify device",
    vi: "Tên thiết bị cụ thể",
    ja: "デバイスを入力",
  },
  "wc.log_field_photo_before": {
    en: "Photo BEFORE URL (optional)",
    vi: "URL ảnh TRƯỚC khi tập (tuỳ chọn)",
    ja: "運動前の写真URL (任意)",
  },
  "wc.log_field_photo_after": {
    en: "Photo AFTER URL (optional)",
    vi: "URL ảnh SAU khi tập (tuỳ chọn)",
    ja: "運動後の写真URL (任意)",
  },
  "wc.log_field_notes": {
    en: "Notes (optional)",
    vi: "Ghi chú (tuỳ chọn)",
    ja: "メモ (任意)",
  },
  "wc.log_ph_exercise_other": {
    en: "e.g. Yoga, Pickleball…",
    vi: "VD: Yoga, Pickleball…",
    ja: "例: ヨガ、ピックルボール…",
  },
  "wc.log_ph_device_other": {
    en: "e.g. Huawei Watch…",
    vi: "VD: Huawei Watch…",
    ja: "例: Huawei Watch…",
  },
  "wc.log_ph_notes": {
    en: "Slack link, comment…",
    vi: "Link Slack, ghi chú…",
    ja: "Slackリンク、メモ…",
  },
  "wc.log_btn_cancel": { en: "Cancel", vi: "Huỷ", ja: "キャンセル" },
  "wc.log_btn_submit": { en: "Submit", vi: "Gửi", ja: "送信" },
  "wc.log_btn_saving": { en: "Saving…", vi: "Đang lưu…", ja: "保存中…" },
  "wc.log_err_date": { en: "Pick a date", vi: "Chọn ngày", ja: "日付を選択" },
  "wc.log_err_exercise_other": {
    en: "Enter exercise name",
    vi: "Nhập tên môn",
    ja: "種目名を入力",
  },
  "wc.log_err_device_other": {
    en: "Enter device name",
    vi: "Nhập tên thiết bị",
    ja: "デバイス名を入力",
  },
  "wc.log_err_duration": {
    en: "1–120 minutes",
    vi: "1–120 phút",
    ja: "1〜120分",
  },
  "wc.log_err_kcal": { en: "Required > 0", vi: "Bắt buộc > 0", ja: "0より大きい値" },
  "wc.log_err_duplicate_day": {
    en: "You can only log one entry per day (see Rules). Edit today's entry in History instead.",
    vi: "Theo Thể lệ, mỗi ngày chỉ ghi nhận 1 buổi tập. Hãy chỉnh sửa buổi hôm nay trong mục Lịch sử.",
    ja: "ルールに従い、1日1件のみ記録できます。今日の記録は履歴から編集してください。",
  },
  "wc.log_prefilled_hint": {
    en: "Pre-filled from your last entry — adjust the numbers for today before submitting.",
    vi: "Đã điền sẵn theo buổi tập gần nhất — nhớ chỉnh lại số liệu cho hôm nay trước khi gửi.",
    ja: "前回の記録を自動入力しました。送信前に今日の数値に修正してください。",
  },
  "wc.upload_help_title": {
    en: "How to upload photos",
    vi: "Hướng dẫn upload hình",
    ja: "写真のアップロード手順",
  },
  "wc.upload_help_drive_heading": {
    en: "Google Drive",
    vi: "Google Drive",
    ja: "Google ドライブ",
  },
  "wc.upload_help_slack_heading": { en: "Slack", vi: "Slack", ja: "Slack" },
  "wc.upload_help_step_open": {
    en: "Open {link} and sign in with your Google account.",
    vi: "Mở {link} và đăng nhập bằng tài khoản Google của bạn.",
    ja: "{link} を開き、Google アカウントでサインインします。",
  },
  "wc.upload_help_step_name": {
    en: "Name the photo as {format} — for example {ex1} and {ex2}.",
    vi: "Đặt tên ảnh theo định dạng {format} — ví dụ {ex1} và {ex2}.",
    ja: "写真を {format} の形式で命名します — 例：{ex1} と {ex2}。",
  },
  "wc.upload_help_step_name_format": {
    en: "daymonthyear_in / out",
    vi: "ngàythángnăm_in / out",
    ja: "日月年_in / out",
  },
  "wc.upload_help_step_upload": {
    en: "Click {action} and choose the photo to upload.",
    vi: "Bấm {action} và chọn ảnh cần upload.",
    ja: "{action} をクリックしてアップロードする写真を選びます。",
  },
  "wc.upload_help_step_upload_action": {
    en: "New → Upload file",
    vi: "Mới → Tải tệp lên",
    ja: "新規 → ファイルをアップロード",
  },
  "wc.upload_help_step_share": {
    en: "After uploading, right-click the photo → {action}.",
    vi: "Sau khi tải xong, chuột phải vào ảnh → {action}.",
    ja: "アップロード後、写真を右クリック → {action}。",
  },
  "wc.upload_help_step_share_action": { en: "Share", vi: "Chia sẻ", ja: "共有" },
  "wc.upload_help_step_access": {
    en: "Under {section}, change it to {value}.",
    vi: "Trong mục {section}, đổi sang {value}.",
    ja: "{section} で {value} に変更します。",
  },
  "wc.upload_help_step_access_section": {
    en: "General access",
    vi: "Quyền truy cập chung",
    ja: "一般的なアクセス",
  },
  "wc.upload_help_step_access_value": {
    en: "Anyone with the link",
    vi: "Bất kỳ ai có đường liên kết",
    ja: "リンクを知っている全員",
  },
  "wc.upload_help_step_copy": {
    en: "Click {action} and paste it into the field here.",
    vi: "Bấm {action} rồi dán vào ô nhập ở đây.",
    ja: "{action} をクリックし、ここの入力欄に貼り付けます。",
  },
  "wc.upload_help_step_copy_action": {
    en: "Copy link",
    vi: "Sao chép đường liên kết",
    ja: "リンクをコピー",
  },
  "wc.upload_help_slack_intro": {
    en: "Prefer Slack? Send the photo there and paste its link instead.",
    vi: "Thích dùng Slack hơn? Gửi ảnh lên đó rồi dán liên kết vào đây.",
    ja: "Slack を使う場合は、そこに写真を送ってリンクを貼り付けてください。",
  },
  "wc.upload_help_slack_step_send": {
    en: "Send the photo to the program Slack channel, named {format} (e.g. {ex1}, {ex2}).",
    vi: "Gửi ảnh vào kênh Slack của chương trình, đặt tên theo định dạng {format} (ví dụ {ex1}, {ex2}).",
    ja: "プログラムの Slack チャンネルに写真を送信し、{format} の形式で命名します（例：{ex1}、{ex2}）。",
  },
  "wc.upload_help_slack_step_copy": {
    en: "Hover the photo → {action} → {copy}.",
    vi: "Di chuột vào ảnh → {action} → {copy}.",
    ja: "写真にカーソルを合わせ → {action} → {copy}。",
  },
  "wc.upload_help_slack_step_copy_action": {
    en: "More actions",
    vi: "Tuỳ chọn khác",
    ja: "その他の操作",
  },
  "wc.upload_help_slack_step_copy_link": {
    en: "Copy link",
    vi: "Sao chép liên kết",
    ja: "リンクをコピー",
  },
  "wc.upload_help_slack_step_paste": {
    en: "Paste the link into the field here.",
    vi: "Dán liên kết vào ô nhập ở đây.",
    ja: "そのリンクをここの入力欄に貼り付けます。",
  },
  "wc.upload_help_close": { en: "Close", vi: "Đóng", ja: "閉じる" },
  "wc.history_btn_delete": { en: "Delete", vi: "Xoá", ja: "削除" },
  "wc.history_confirm_delete": {
    en: "Delete this pending entry?",
    vi: "Xoá buổi tập đang chờ duyệt này?",
    ja: "保留中のこの記録を削除しますか？",
  },

  // ---------- Wellness: months / common ----------
  "wc.month_6": { en: "June", vi: "Tháng 6", ja: "6月" },
  "wc.month_7": { en: "July", vi: "Tháng 7", ja: "7月" },
  "wc.month_8": { en: "August", vi: "Tháng 8", ja: "8月" },
  "wc.gender_male": { en: "Male", vi: "Nam", ja: "男性" },
  "wc.gender_female": { en: "Female", vi: "Nữ", ja: "女性" },
  "wc.minutes_short": { en: "min", vi: "ph", ja: "分" },
  "wc.loading": { en: "Loading…", vi: "Đang tải…", ja: "読み込み中…" },

  // ---------- Wellness: exercises ----------
  "wc.ex_run": { en: "Running", vi: "Chạy bộ", ja: "ランニング" },
  "wc.ex_walk": { en: "Walking", vi: "Đi bộ", ja: "ウォーキング" },
  "wc.ex_cycle": { en: "Cycling", vi: "Đạp xe", ja: "サイクリング" },
  "wc.ex_swim": { en: "Swimming", vi: "Bơi lội", ja: "水泳" },
  "wc.ex_gym": { en: "Gym", vi: "Tập gym", ja: "ジム" },
  "wc.ex_other": { en: "Other", vi: "Khác", ja: "その他" },

  // ---------- Wellness: devices ----------
  "wc.dev_apple_watch": {
    en: "Apple Watch",
    vi: "Apple Watch",
    ja: "Apple Watch",
  },
  "wc.dev_garmin": { en: "Garmin", vi: "Garmin", ja: "Garmin" },
  "wc.dev_fitbit": { en: "Fitbit", vi: "Fitbit", ja: "Fitbit" },
  "wc.dev_strava": { en: "Strava", vi: "Strava", ja: "Strava" },
  "wc.dev_gym_machine": {
    en: "Gym machine",
    vi: "Máy tập tại gym",
    ja: "ジムマシン",
  },
  "wc.dev_apple_health": {
    en: "Apple Health",
    vi: "Apple Health",
    ja: "Apple Health",
  },
  "wc.dev_google_fit": {
    en: "Google Fit",
    vi: "Google Fit",
    ja: "Google Fit",
  },
  "wc.dev_other": { en: "Other", vi: "Khác", ja: "その他" },

  // ---------- Wellness: prizes ----------
  "wc.prize_monthly_kpi": {
    en: "Hit the monthly KPI",
    vi: "Đạt KPI hàng tháng",
    ja: "月間KPI達成",
  },
  "wc.prize_top_burner": {
    en: "Top kcal of the month (1 male + 1 female)",
    vi: "Calo cao nhất tháng (1 nam + 1 nữ)",
    ja: "月間最多カロリー(男女各1名)",
  },
  "wc.prize_streak": {
    en: "Hit KPI 3 months in a row",
    vi: "Đạt KPI 3 tháng liên tiếp",
    ja: "3か月連続でKPI達成",
  },
  "wc.prize_amount_monthly": {
    en: "500,000 VND / person / month",
    vi: "500.000 VND / người / tháng",
    ja: "500,000 VND / 人 / 月",
  },
  "wc.prize_amount_streak": {
    en: "500,000 VND / person",
    vi: "500.000 VND / người",
    ja: "500,000 VND / 人",
  },

  // ---------- Wellness: empty / setup states ----------
  "wc.empty_not_joined_title": {
    en: "You haven't joined the Wellness Challenge",
    vi: "Bạn chưa tham gia Wellness Challenge",
    ja: "Wellness Challenge に未参加です",
  },
  "wc.empty_not_joined_sub": {
    en: "Contact an admin to be added to the program.",
    vi: "Liên hệ admin để được thêm vào chương trình.",
    ja: "管理者に連絡してプログラムに追加してもらってください。",
  },
  "wc.empty_need_kpi_title": {
    en: "KPI setup required",
    vi: "Cần thiết lập KPI",
    ja: "KPI の設定が必要です",
  },
  "wc.empty_need_kpi_sub": {
    en: "Admin hasn't set your gender yet. Weekly KPI depends on gender — ask admin to activate it.",
    vi: "Admin chưa cập nhật giới tính cho bạn. KPI hàng tuần phụ thuộc vào giới — liên hệ admin để được kích hoạt.",
    ja: "管理者があなたの性別を未設定です。週間KPIは性別により決まります — 管理者に有効化を依頼してください。",
  },
  "wc.empty_upcoming_title": {
    en: "Program starts in {days} days",
    vi: "Chương trình bắt đầu sau {days} ngày",
    ja: "プログラム開始まで{days}日",
  },
  "wc.empty_upcoming_sub": {
    en: "Kick-off date: {date}. Read the rules and get your tracking devices ready.",
    vi: "Ngày khởi động: {date}. Hãy đọc cách chơi và chuẩn bị thiết bị đo nhé.",
    ja: "開始日: {date}。ルールを読んで計測機器を準備しましょう。",
  },
  "wc.empty_upcoming_cta": {
    en: "Read the rules",
    vi: "Đọc cách chơi",
    ja: "ルールを読む",
  },
  "wc.empty_ended_title": {
    en: "Program has ended",
    vi: "Chương trình đã kết thúc",
    ja: "プログラムは終了しました",
  },
  "wc.empty_ended_sub": {
    en: "Thanks for taking part! Check the leaderboard for final results.",
    vi: "Cảm ơn bạn đã tham gia! Xem bảng xếp hạng để biết kết quả cuối.",
    ja: "ご参加ありがとうございました！最終結果はランキングをご覧ください。",
  },

  // ---------- Wellness: Dashboard ----------
  "wc.ring_label_week": {
    en: "kcal this week",
    vi: "kcal tuần này",
    ja: "今週の kcal",
  },
  "wc.ring_label_month": {
    en: "kcal this month",
    vi: "kcal tháng này",
    ja: "今月の kcal",
  },
  "wc.hero_tagline": {
    en: "{month} · current week",
    vi: "{month} · Tuần hiện tại",
    ja: "{month} · 今週",
  },
  "wc.hero_kpi_hit": {
    en: "Weekly KPI hit.",
    vi: "Đã đạt KPI tuần.",
    ja: "週間KPI達成。",
  },
  "wc.hero_keep_going": {
    en: "Keep it up! 🔥",
    vi: "Tiếp lửa nào! 🔥",
    ja: "この調子で！🔥",
  },
  "wc.hero_need_part1": { en: "Need", vi: "Cần thêm", ja: "あと" },
  "wc.hero_need_part2": {
    en: "to hit this week's KPI.",
    vi: "để đạt KPI tuần.",
    ja: "で週間KPI達成。",
  },
  "wc.hero_target_line": {
    en: "Weekly target: {kpi} kcal · {days} days left this week",
    vi: "Mục tiêu tuần: {kpi} kcal · Còn {days} ngày trong tuần",
    ja: "週間目標: {kpi} kcal · 今週残り {days} 日",
  },
  "wc.btn_history": { en: "History", vi: "Xem lịch sử", ja: "履歴を見る" },
  "wc.btn_rules": { en: "Rules", vi: "Cách chơi", ja: "ルール" },
  "wc.stat_this_month": {
    en: "This month",
    vi: "Tháng hiện tại",
    ja: "今月",
  },
  "wc.stat_month_sub": {
    en: "{pct}% of target {kpi}",
    vi: "{pct}% mục tiêu {kpi}",
    ja: "目標 {kpi} の {pct}%",
  },
  "wc.stat_weeks_hit": {
    en: "Weeks KPI met",
    vi: "Số tuần đạt KPI",
    ja: "KPI達成週",
  },
  "wc.stat_weeks_unit": { en: "weeks", vi: "tuần", ja: "週" },
  "wc.stat_weeks_sub": {
    en: "of 12 program weeks",
    vi: "trong 12 tuần chương trình",
    ja: "プログラム12週中",
  },
  "wc.stat_progress": {
    en: "Program progress",
    vi: "Tiến độ chương trình",
    ja: "プログラム進捗",
  },
  "wc.stat_progress_sub": {
    en: "June → August 2026",
    vi: "Tháng 6 → Tháng 8 năm 2026",
    ja: "2026年6月 → 8月",
  },
  "wc.stat_progress_upcoming": {
    en: "Starts in {days} days",
    vi: "Còn {days} ngày khởi động",
    ja: "あと{days}日で開始",
  },
  "wc.stat_gender_kpi": {
    en: "Gender · group KPI",
    vi: "Giới tính · KPI nhóm",
    ja: "性別 · グループKPI",
  },
  "wc.stat_per_week": {
    en: "{kpi} kcal/week",
    vi: "{kpi} kcal/tuần",
    ja: "{kpi} kcal/週",
  },
  "wc.track_title": {
    en: "3-month track",
    vi: "Lộ trình 3 tháng",
    ja: "3か月のロードマップ",
  },
  "wc.track_subtitle": {
    en: "KPI ramps up",
    vi: "KPI tăng dần",
    ja: "KPI 段階的に上昇",
  },
  "wc.track_current": {
    en: "In progress",
    vi: "Đang diễn ra",
    ja: "進行中",
  },
  "wc.track_past": { en: "Done", vi: "Đã qua", ja: "完了" },
  "wc.track_upcoming": { en: "Upcoming", vi: "Sắp tới", ja: "予定" },
  "wc.track_per_week": { en: "/ week", vi: "/ tuần", ja: "/ 週" },
  "wc.track_month_total": {
    en: "Month: {kpi} kcal",
    vi: "Tháng: {kpi} kcal",
    ja: "月間: {kpi} kcal",
  },
  "wc.recent_title": {
    en: "Recent sessions",
    vi: "Buổi tập gần đây",
    ja: "最近のセッション",
  },
  "wc.recent_view_all": {
    en: "View all →",
    vi: "Xem tất cả →",
    ja: "すべて表示 →",
  },
  "wc.recent_empty": {
    en: "No sessions yet — admin will record them after you submit photos via Slack.",
    vi: "Chưa có buổi tập nào — admin sẽ ghi nhận sau khi bạn gửi ảnh qua Slack.",
    ja: "セッションはまだありません — Slack で写真を送ると管理者が記録します。",
  },
  "wc.prizes_title": {
    en: "🏆 Prize structure",
    vi: "🏆 Cơ cấu giải thưởng",
    ja: "🏆 賞品",
  },

  // ---------- Wellness: History ----------
  "wc.history_filter_all": { en: "All", vi: "Tất cả", ja: "すべて" },
  "wc.history_header_meta": {
    en: "History · {count} sessions · {kcal} kcal",
    vi: "Lịch sử · {count} buổi · {kcal} kcal",
    ja: "履歴 · {count} 回 · {kcal} kcal",
  },
  "wc.history_title": {
    en: "Training history",
    vi: "Lịch sử tập luyện",
    ja: "トレーニング履歴",
  },
  "wc.history_empty": {
    en: "No sessions in this period.",
    vi: "Không có buổi tập nào trong khoảng thời gian này.",
    ja: "この期間のセッションはありません。",
  },
  "wc.history_col_date": { en: "Date", vi: "Ngày", ja: "日付" },
  "wc.history_col_type": { en: "Type", vi: "Loại", ja: "種別" },
  "wc.history_col_duration": {
    en: "Duration",
    vi: "Thời gian",
    ja: "時間",
  },
  "wc.history_col_kcal": { en: "kcal", vi: "kcal", ja: "kcal" },
  "wc.history_col_device": { en: "Device", vi: "Thiết bị", ja: "デバイス" },
  "wc.history_col_photos": { en: "Photos", vi: "Ảnh", ja: "写真" },
  "wc.history_col_status": {
    en: "Status",
    vi: "Trạng thái",
    ja: "ステータス",
  },
  "wc.history_program_range": {
    en: "Program {start} — {end}",
    vi: "Chương trình {start} — {end}",
    ja: "プログラム {start} — {end}",
  },
  "wc.history_photo_view": {
    en: "View photo",
    vi: "Xem ảnh",
    ja: "写真を見る",
  },
  "wc.history_photo_close": { en: "✕ Close", vi: "✕ Đóng", ja: "✕ 閉じる" },
  "wc.status_approved": { en: "Approved", vi: "Đã duyệt", ja: "承認済み" },
  "wc.status_pending": {
    en: "Pending",
    vi: "Chờ duyệt",
    ja: "保留中",
  },
  "wc.status_rejected": { en: "Rejected", vi: "Từ chối", ja: "却下" },

  // ---------- Wellness: Leaderboard ----------
  "wc.lb_gender_all": { en: "All", vi: "Tất cả", ja: "すべて" },
  "wc.lb_scope_month": { en: "This month", vi: "Tháng này", ja: "今月" },
  "wc.lb_scope_total": {
    en: "3-month total",
    vi: "Tổng 3 tháng",
    ja: "3か月合計",
  },
  "wc.lb_header_meta": {
    en: "Leaderboard · {month} 2026",
    vi: "Bảng xếp hạng · {month} 2026",
    ja: "ランキング · {month} 2026",
  },
  "wc.lb_title": {
    en: "Top kcal burned",
    vi: "Top calo tiêu hao",
    ja: "消費カロリーランキング",
  },
  "wc.lb_subtitle": {
    en: "The top burner of each gender wins 500,000 VND at month end.",
    vi: "Người dẫn đầu mỗi giới sẽ được tặng 500.000 VND vào cuối tháng.",
    ja: "性別ごとのトップが月末に 500,000 VND を獲得します。",
  },
  "wc.lb_empty": {
    en: "No participants yet. Admin needs to add members to the program.",
    vi: "Chưa có người tham gia nào. Admin cần thêm thành viên vào chương trình.",
    ja: "まだ参加者がいません。管理者がメンバーを追加する必要があります。",
  },
  "wc.lb_col_name": { en: "Name", vi: "Tên", ja: "名前" },
  "wc.lb_col_gender": { en: "Gender", vi: "Giới", ja: "性別" },
  "wc.lb_col_kcal_month": {
    en: "kcal (month)",
    vi: "kcal tháng",
    ja: "kcal (月)",
  },
  "wc.lb_col_kcal_total": {
    en: "kcal (3 mo)",
    vi: "kcal 3 tháng",
    ja: "kcal (3か月)",
  },
  "wc.lb_col_weeks_hit": {
    en: "Weeks KPI met",
    vi: "Tuần đạt KPI",
    ja: "KPI達成週",
  },
  "wc.lb_col_status": { en: "Status", vi: "Trạng thái", ja: "ステータス" },
  "wc.lb_you_marker": { en: "· you", vi: "· bạn", ja: "· あなた" },
  "wc.lb_status_hit": {
    en: "KPI met",
    vi: "Đạt KPI",
    ja: "KPI達成",
  },
  "wc.lb_status_trying": {
    en: "Working on it",
    vi: "Đang cố",
    ja: "挑戦中",
  },

  // ---------- Wellness: Rules ----------
  "wc.rules_eyebrow": {
    en: "🌿 Rules",
    vi: "🌿 Cách chơi",
    ja: "🌿 ルール",
  },
  "wc.rules_title": {
    en: "3-month wellness program",
    vi: "Chương trình rèn luyện sức khỏe 3 tháng",
    ja: "3か月ウェルネスプログラム",
  },
  "wc.rules_intro_a": { en: "LNP runs the", vi: "LNP triển khai chương trình", ja: "LNP は" },
  "wc.rules_intro_name": {
    en: "\"Train Together for Health\"",
    vi: "\"Cùng Rèn Luyện Sức Khỏe\"",
    ja: "「みんなで健康に」",
  },
  "wc.rules_intro_b": {
    en: "program to help everyone build healthy movement habits.",
    vi: "nhằm hỗ trợ mọi người duy trì thói quen vận động lành mạnh.",
    ja: "プログラムを通じて、健康的な運動習慣を支援します。",
  },
  "wc.rules_sec_time": {
    en: "Time frame",
    vi: "Thời gian tổ chức",
    ja: "開催期間",
  },
  "wc.rules_time_body": {
    en: "June – August 2026 (3 months)",
    vi: "Tháng 6 – Tháng 8 năm 2026 (3 tháng)",
    ja: "2026年6月 – 8月 (3か月間)",
  },
  "wc.rules_sec_form": {
    en: "Activity types",
    vi: "Hình thức vận động",
    ja: "運動の種類",
  },
  "wc.rules_form_body": {
    en: "Pick whatever suits you: running, walking, cycling, swimming, gym, etc.",
    vi: "Mỗi người tự do lựa chọn loại hình tập luyện phù hợp: chạy bộ, đi bộ, đạp xe, bơi lội, tập gym, v.v.",
    ja: "ランニング、ウォーキング、サイクリング、水泳、ジムなどお好みのものを選んでください。",
  },
  "wc.rules_form_note": {
    en: "→ Scoring is based on kcal burned per week.",
    vi: "→ Tiêu chí đánh giá dựa trên lượng calo tiêu hao (kcal) mỗi tuần.",
    ja: "→ 評価は週ごとの消費カロリー(kcal)に基づきます。",
  },
  "wc.rules_sec_kpi": {
    en: "Weekly KPI targets",
    vi: "Mục tiêu KPI hàng tuần",
    ja: "週間KPI目標",
  },
  "wc.rules_kpi_col_gender": { en: "Gender", vi: "Giới", ja: "性別" },
  "wc.rules_kpi_note": {
    en: "※ Monthly target = weekly KPI × 4",
    vi: "※ Mục tiêu tháng = KPI tuần × 4",
    ja: "※ 月間目標 = 週間KPI × 4",
  },
  "wc.rules_sec_capture": {
    en: "Result tracking rules",
    vi: "Quy định ghi nhận kết quả",
    ja: "結果記録のルール",
  },
  "wc.rules_capture_1": {
    en: "Counted once per day, up to 120 minutes per session",
    vi: "Chỉ tính 1 lần/ngày, mỗi lần tập tối đa 120 phút",
    ja: "1日1回まで、1回あたり最大120分",
  },
  "wc.rules_capture_2": {
    en: "Two photos required: before and after the session",
    vi: "Bắt buộc có 2 ảnh: trước và sau khi tập",
    ja: "セッション前後の写真2枚が必須",
  },
  "wc.rules_capture_3": {
    en: "Photos must show date, month and time (use a camera app with timestamp)",
    vi: "Ảnh phải hiển thị rõ ngày, tháng, giờ chụp (dùng app camera có timestamp)",
    ja: "写真には日付・月・時刻が必要(タイムスタンプ付きカメラアプリを使用)",
  },
  "wc.rules_capture_4": {
    en: "Photos must clearly show kcal burned",
    vi: "Ảnh phải hiển thị rõ lượng calo tiêu hao (kcal)",
    ja: "消費カロリー(kcal)がはっきり写っていること",
  },
  "wc.rules_sec_how_photo": {
    en: "How to capture (Apple Watch example)",
    vi: "Cách chụp ảnh (ví dụ: Apple Watch)",
    ja: "撮影方法(Apple Watch の例)",
  },
  "wc.rules_how_1": {
    en: "Before exercise → screenshot the activity screen (kcal ≈ 0)",
    vi: "Trước khi tập → chụp màn hình hoạt động (kcal ≈ 0)",
    ja: "運動前 → アクティビティ画面をスクリーンショット(kcal ≈ 0)",
  },
  "wc.rules_how_2": {
    en: "Do the workout (run, gym…)",
    vi: "Thực hiện bài tập (chạy, gym...)",
    ja: "運動を実施(ランニング、ジムなど)",
  },
  "wc.rules_how_3": {
    en: "After → screenshot the result (kcal + end time)",
    vi: "Sau khi tập → chụp màn hình kết quả (hiển thị kcal + giờ kết thúc)",
    ja: "運動後 → 結果画面をスクリーンショット(kcal + 終了時刻)",
  },
  "wc.rules_example_title": {
    en: "Example",
    vi: "Ví dụ minh họa",
    ja: "例",
  },
  "wc.rules_example_body": {
    en: "Photo 1: 5:09 start, kcal ≈ 5 → Photo 2: 5:57 end, kcal = 185 →",
    vi: "Ảnh 1: 5:09 bắt đầu, kcal ≈ 5 → Ảnh 2: 5:57 kết thúc, kcal = 185 →",
    ja: "写真1: 5:09 開始, kcal ≈ 5 → 写真2: 5:57 終了, kcal = 185 →",
  },
  "wc.rules_example_result": {
    en: " recorded: 180 kcal",
    vi: " kết quả ghi nhận: 180 kcal",
    ja: " 記録: 180 kcal",
  },
  "wc.rules_sec_invalid": {
    en: "Invalid photos",
    vi: "Ảnh không hợp lệ",
    ja: "無効な写真",
  },
  "wc.rules_invalid_1": {
    en: "Photo of another device's screen",
    vi: "Ảnh chụp lại từ màn hình thiết bị khác",
    ja: "他のデバイスの画面を撮影したもの",
  },
  "wc.rules_invalid_2": {
    en: "Cropped photo missing date/time or kcal",
    vi: "Ảnh bị cắt xén, không thấy ngày giờ hoặc kcal",
    ja: "日時または kcal が見えないトリミング画像",
  },
  "wc.rules_invalid_3": {
    en: "Manually entered data",
    vi: "Dữ liệu nhập tay",
    ja: "手入力のデータ",
  },
  "wc.rules_sec_submit": {
    en: "How to submit",
    vi: "Cách gửi kết quả",
    ja: "提出方法",
  },
  "wc.rules_submit_body": {
    en: "Upload photos to the \"Log session\" screen during the training week, by end of week at latest. (Or send to the program Slack channel as instructed.)",
    vi: "Tải ảnh lên màn hình \"Ghi kết quả\" trong tuần tập luyện, chậm nhất cuối tuần. (Hoặc gửi vào kênh Slack của chương trình theo hướng dẫn.)",
    ja: "トレーニング週内に「結果記録」画面へアップロード、遅くとも週末まで。(または案内に従いプログラムの Slack チャンネルへ送信)",
  },
  "wc.rules_devices_title": {
    en: "Accepted devices",
    vi: "Thiết bị được chấp nhận",
    ja: "対応デバイス",
  },
  "wc.rules_dev_1": {
    en: "Gym machine screens (treadmill, bike…)",
    vi: "Màn hình máy tập tại gym (máy chạy bộ, xe đạp...)",
    ja: "ジムマシンの画面(トレッドミル、バイクなど)",
  },
  "wc.rules_dev_2": {
    en: "Apple Watch / Garmin / Fitbit or other smartwatches",
    vi: "Apple Watch / Garmin / Fitbit hoặc smartwatch khác",
    ja: "Apple Watch / Garmin / Fitbit などのスマートウォッチ",
  },
  "wc.rules_dev_3": {
    en: "Strava app (outdoor running/cycling)",
    vi: "Ứng dụng Strava (chạy/đạp xe ngoài trời)",
    ja: "Strava アプリ(屋外ランニング/サイクリング)",
  },
  "wc.rules_dev_4": {
    en: "Apple Health / Google Fit (only if none of the above are available)",
    vi: "Apple Health / Google Fit (chỉ dùng khi không có các thiết bị trên)",
    ja: "Apple Health / Google Fit(上記が利用できない場合のみ)",
  },
  "wc.rules_sec_prizes": {
    en: "Prize structure",
    vi: "Cơ cấu giải thưởng",
    ja: "賞品体系",
  },
  "wc.rules_footer": {
    en: "Train hard and stay healthy, everyone! 💪🔥",
    vi: "Chúc mọi người tập luyện vui vẻ và khỏe mạnh! 💪🔥",
    ja: "みなさん、楽しく健康に頑張りましょう！💪🔥",
  },
  "wc.rules_cta": {
    en: "Start logging a session",
    vi: "Bắt đầu ghi buổi tập",
    ja: "セッション記録を始める",
  },

  // ---------- Secret Santa ----------
  "santa.brand_tag": { en: "Santa", vi: "Secret Santa", ja: "サンタ" },
  "santa.tag": { en: "◆ Secret Santa", vi: "◆ Trao quà bí mật", ja: "◆ シークレットサンタ" },
  "santa.title": { en: "Secret Santa Exchange", vi: "Trao Quà Bí Mật", ja: "シークレットサンタ交換" },
  "santa.tagline": {
    en: "Spread holiday cheer! Sign up, write your wishlist, and swap gifts secretly with a random colleague.",
    vi: "Lan tỏa niềm vui ấm áp! Đăng ký, viết điều ước và trao quà bí mật cho một đồng nghiệp ngẫu nhiên.",
    ja: "ホリデーの喜びを分かち合おう！ウィッシュリストを書いて、ランダムに同僚とギフトを交換しよう。"
  },
  "santa.reg_title": { en: "Join the Exchange", vi: "Tham gia trao quà", ja: "イベントに参加する" },
  "santa.reg_subtitle": { en: "Fill out your wishlist so your secret Santa knows what you want.", vi: "Viết lời nhắn gửi/món quà bạn thích để Secret Santa biết ý bạn nhé.", ja: "サンタが何を用意すればいいか分かるように、ウィッシュリストを記入してください。" },
  "santa.wishlist_label": { en: "Your Wishlist", vi: "Món quà mong muốn của bạn", ja: "ウィッシュリスト" },
  "santa.wishlist_placeholder": {
    en: "e.g., Mechanical keyboard, Coffee mug, Lego, Tech books...",
    vi: "Ví dụ: Bàn phím cơ, Cốc cà phê, Bộ Lego, Sách công nghệ, Cà phê hạt...",
    ja: "例：メカニカルキーボード、マグカップ、レゴ、技術書..."
  },
  "santa.btn_join": { en: "Join Event", vi: "Đăng ký tham gia", ja: "参加登録する" },
  "santa.btn_saving": { en: "Saving...", vi: "Đang lưu...", ja: "保存中..." },
  "santa.btn_update_wishlist": { en: "Update Wishlist", vi: "Cập nhật mong ước", ja: "ウィッシュリストを更新" },
  "santa.reg_success": { en: "You're in! 🎅", vi: "Đăng ký thành công! 🎅", ja: "Đăng ký thành công! 🎅" },
  "santa.reg_waiting": {
    en: "Registration complete. Waiting for matching to start!",
    vi: "Đã ghi nhận đăng ký. Đang chờ admin đóng đăng ký và bắt cặp ngẫu nhiên!",
    ja: "登録完了。マッチング開始をお待ちください！"
  },
  "santa.participants_joined": {
    en: "Participants Joined ({n})",
    vi: "Danh sách tham gia ({n})",
    ja: "参加者一覧 ({n})"
  },
  "santa.unwrap_cta": { en: "Tap to Unwrap Your Target 🎁", vi: "Bấm để mở gói quà bí mật 🎁", ja: "タップして相手を確認する 🎁" },
  "santa.giver_card_title": { en: "Your Gift Target", vi: "Đối tượng tặng quà của bạn", ja: "あなたのプレゼント相手" },
  "santa.giver_card_desc": {
    en: "You are the Secret Santa for this colleague. Keep it a secret!",
    vi: "Bạn chính là Secret Santa của đồng nghiệp này. Hãy giữ bí mật nhé!",
    ja: "あなたはこの同僚のシークレットサンタです。秘密にしてください！"
  },
  "santa.target_wishlist": { en: "Their Wishlist", vi: "Mong ước của họ", ja: "相手のウィッシュリスト" },
  "santa.budget_info": { en: "Event Budget", vi: "Ngân sách sự kiện", ja: "イベント予算" },
  "santa.delivery_instructions": {
    en: "Instructions: Buy a gift within the budget. Put it under the office tree before the deadline!",
    vi: "Hướng dẫn: Chuẩn bị món quà phù hợp ngân sách và đặt dưới cây thông Noel công ty trước hạn nhé!",
    ja: "案内：予算内のプレゼントを用意し、締切日までにオフィスのツリーの下に置いてください！"
  },
  "santa.status_sent_label": { en: "I have prepared & delivered the gift", vi: "Tôi đã chuẩn bị và gửi quà", ja: "プレゼントを発送しました" },
  "santa.status_received_label": { en: "I have received my gift", vi: "Tôi đã nhận được quà của mình", ja: "プレゼントを受け取りました" },
  "santa.my_santa_status": { en: "Your Santa Status", vi: "Tình trạng quà gửi cho bạn", ja: "サンタからの状況" },
  "santa.my_santa_sent": { en: "Your Secret Santa has delivered your gift under the tree! 🎁", vi: "Secret Santa của bạn đã đặt quà dưới cây thông rồi! 🎁", ja: "サンタがツリーの下にプレゼントを置きました！🎁" },
  "santa.my_santa_preparing": { en: "Your Secret Santa is preparing your gift... 🎄", vi: "Secret Santa của bạn đang chuẩn bị quà... 🎄", ja: "サンタがプレゼントを準備中です... 🎄" },
  "santa.completed_title": { en: "Exchange Completed!", vi: "Sự kiện kết thúc!", ja: "交換完了！" },
  "santa.completed_desc": {
    en: "Thank you for participating in Secret Santa! Hope you had a wonderful holiday.",
    vi: "Cảm ơn bạn đã tham gia Secret Santa! Chúc bạn có những ngày lễ thật ấm áp và vui vẻ.",
    ja: "シークレットサンタへのご参加ありがとうございました！素晴らしいホリデーになりますように。"
  },
  "santa.admin_panel": { en: "Santa Admin Console", vi: "Bảng Quản Trị Secret Santa", ja: "サンタ管理画面" },
  "santa.admin_event_title": { en: "Event Title", vi: "Tên sự kiện", ja: "イベント名" },
  "santa.admin_budget": { en: "Budget Limit", vi: "Giới hạn ngân sách", ja: "予算制限" },
  "santa.admin_status": { en: "Event Phase", vi: "Giai đoạn sự kiện", ja: "イベントフェーズ" },
  "santa.admin_status_reg": { en: "Registration Open", vi: "Mở đăng ký", ja: "登録受付中" },
  "santa.admin_status_matched": { en: "Matched (Gifting Live)", vi: "Đã bắt cặp (Đang tặng quà)", ja: "マッチング完了" },
  "santa.admin_status_completed": { en: "Completed", vi: "Đã kết thúc", ja: "終了済み" },
  "santa.btn_draw": { en: "Draw Secret Santa Matches 🎲", vi: "Bắt cặp ngẫu nhiên 🎲", ja: "マッチング抽選 🎲" },
  "santa.btn_reset_draw": { en: "Reset Matches", vi: "Xóa kết quả bắt cặp", ja: "マッチングをリセット" },
  "santa.admin_draw_confirm": {
    en: "Are you sure you want to draw matches? This will pair up all registered participants.",
    vi: "Bạn có chắc chắn muốn bắt cặp? Hệ thống sẽ tạo cặp ngẫu nhiên cho tất cả thành viên đăng ký.",
    ja: "マッチング抽選を実行しますか？登録されたすべての参加者がペアリングされます。"
  },
  "santa.admin_reset_confirm": {
    en: "Are you sure you want to reset matches? All current pairings will be deleted.",
    vi: "Bạn có chắc chắn muốn xóa kết quả bắt cặp? Toàn bộ dữ liệu ghép cặp hiện tại sẽ bị xóa sạch.",
    ja: "マッチングをリセットしますか？現在のすべてのペアリングデータが削除されます。"
  },
  "santa.admin_participants_list": { en: "Participant Management", vi: "Quản lý người tham gia", ja: "参加者管理" },
  "santa.admin_no_event": { en: "No active Secret Santa event. Create one below to start!", vi: "Chưa có sự kiện Secret Santa nào. Hãy tạo sự kiện mới bên dưới để bắt đầu!", ja: "アクティブなイベントはありません。以下から新規作成してください！" },
  "santa.user_no_event_title": {
    en: "The North Pole is still quiet... 🎅",
    vi: "Bắc Cực vẫn còn yên tĩnh... 🎅",
    ja: "北極はまだ静かです... 🎅",
  },
  "santa.user_no_event_desc": {
    en: "Santa hasn't opened registration yet. Hang your stockings — the magic begins soon. Please check back a little later! ✨🎄",
    vi: "Ông già Noel chưa mở đăng ký đâu. Hãy treo tất lên và kiên nhẫn chờ một chút — phép màu sắp bắt đầu rồi! ✨🎄",
    ja: "サンタはまだ受付を始めていません。靴下を吊るしてもう少しお待ちください — まもなく魔法が始まります！✨🎄",
  },
  "santa.admin_create_event": { en: "Create New Event", vi: "Tạo sự kiện mới", ja: "新規イベント作成" },
  "santa.err_min_participants": { en: "Need at least 2 participants to run matching!", vi: "Cần ít nhất 2 người đăng ký tham gia để thực hiện bắt cặp!", ja: "マッチングを実行するには少なくとも2人の参加者が必要です！" },
  "santa.admin_save_settings": { en: "Save Changes", vi: "Lưu thay đổi", ja: "変更を保存" },
  "santa.admin_close_event": { en: "Close Event", vi: "Đóng sự kiện", ja: "イベントを終了" },
  "santa.admin_close_confirm": {
    en: "Are you sure you want to close (delete) this event? All registrations and matches will be removed permanently.",
    vi: "Bạn có chắc muốn đóng (xóa) sự kiện này? Toàn bộ đăng ký và kết quả bắt cặp sẽ bị xóa vĩnh viễn.",
    ja: "本当にこのイベントを閉じますか？すべての登録とマッチングが完全に削除されます。",
  },
  "santa.rules_title": { en: "How It Works", vi: "Cách chơi", ja: "ルール" },
  "santa.rule_1": {
    en: "Register your wishlist during the open registration phase.",
    vi: "Đăng ký danh sách quà mong muốn trong giai đoạn mở đăng ký.",
    ja: "登録期間中にウィッシュリストを送信してください。",
  },
  "santa.rule_2": {
    en: "When matching opens, you'll be paired randomly with one teammate to gift to. Your identity stays secret!",
    vi: "Khi bắt cặp, bạn sẽ được ghép ngẫu nhiên với một người trong team để tặng quà. Danh tính được giữ bí mật!",
    ja: "マッチング開始後、ランダムに1人とペアリングされ、その人にプレゼントを贈ります。あなたの正体は秘密です！",
  },
  "santa.rule_3": {
    en: "Prepare a gift within the event budget, then deliver it secretly (anonymous wrap, no name tag).",
    vi: "Chuẩn bị quà trong ngân sách quy định, rồi gửi quà bí mật (gói ẩn danh, không ghi tên người tặng).",
    ja: "予算内でプレゼントを用意し、匿名で贈ってください（名前を書かない包装で）。",
  },
  "santa.rule_4": {
    en: "Mark gift as 'Sent' once delivered, and 'Received' when your gift arrives.",
    vi: "Đánh dấu 'Đã gửi' khi đã trao quà, và 'Đã nhận' khi nhận được quà từ Santa của bạn.",
    ja: "プレゼントを贈ったら『送信済み』、受け取ったら『受領済み』にチェックを入れてください。",
  },
  "santa.rule_5": {
    en: "Have fun and keep the secret until the big reveal! 🎁",
    vi: "Vui vẻ và giữ bí mật cho đến phút khám phá cuối cùng! 🎁",
    ja: "楽しみながら、最後の発表まで秘密を守りましょう！🎁",
  },
  "catalog.section_events": { en: "Events", vi: "Sự kiện", ja: "イベント" },
  "catalog.section_minigames": { en: "Mini Games", vi: "Mini Game", ja: "ミニゲーム" },
  "catalog.section_suggest": { en: "Suggest", vi: "Đề xuất hoạt động", ja: "提案" },
  "catalog.santa_name": { en: "Secret Santa", vi: "Secret Santa", ja: "Secret Santa" },
  "catalog.santa_desc": {
    en: "Register your wishlist and swap gifts secretly.",
    vi: "Đăng ký điều ước và trao quà bí mật.",
    ja: "ウィッシュリストを書いて、秘密のプレゼント交換。"
  },

  // ---------- Coworking day ----------
  "catalog.coworking_name": {
    en: "Coworking day",
    vi: "Coworking day",
    ja: "コワーキングデー",
  },
  "catalog.coworking_desc": {
    en: "Mark the days you'll be in the office so teammates can come in together.",
    vi: "Đánh dấu ngày lên cty để mọi người tự rủ nhau lên cùng.",
    ja: "出社する日を登録して、みんなで一緒にオフィスへ。",
  },
  "coworking.brand_tag": { en: "Coworking", vi: "Coworking", ja: "コワーキング" },
  "coworking.tag": {
    en: "◆ Coworking day",
    vi: "◆ Ngày lên cty",
    ja: "◆ コワーキングデー",
  },
  "coworking.title": {
    en: "Who's in the office?",
    vi: "Ai lên cty ngày nào?",
    ja: "オフィスには誰がいる？",
  },
  "coworking.tagline": {
    en: "Pick the days you'll be in. See who else is coming and plan a coworking day together.",
    vi: "Chọn ngày bạn lên cty. Xem ai cũng lên ngày đó để rủ nhau lên cùng.",
    ja: "出社する日を選び、同じ日に来る人を見て、一緒に作業する日を計画しましょう。",
  },
  "coworking.this_week": { en: "This week", vi: "Tuần này", ja: "今週" },
  "coworking.next_week": { en: "Next week", vi: "Tuần sau", ja: "来週" },
  "coworking.prev_month": { en: "Prev", vi: "Trước", ja: "前月" },
  "coworking.next_month": { en: "Next", vi: "Sau", ja: "次月" },
  "coworking.empty_day": { en: "—", vi: "—", ja: "—" },
  "coworking.empty_day_long": {
    en: "No one has signed up yet. Be the first!",
    vi: "Chưa ai đăng ký. Bạn đi đầu nhé!",
    ja: "まだ誰も登録していません。最初の一人になりましょう！",
  },
  "coworking.count_people": {
    en: "{n} people",
    vi: "{n} người",
    ja: "{n}人",
  },
  "coworking.btn_join": {
    en: "I'll be in this day",
    vi: "Tôi cũng lên ngày này",
    ja: "この日に出社する",
  },
  "coworking.btn_leave": {
    en: "Remove me from this day",
    vi: "Bỏ ngày này",
    ja: "この日をやめる",
  },
  "coworking.pattern_title": {
    en: "Repeating schedule",
    vi: "Lịch lặp lại",
    ja: "繰り返しスケジュール",
  },
  "coworking.pattern_desc": {
    en: "Pick weekdays — auto-fills the next 4 weeks. Override single days anytime.",
    vi: "Chọn các thứ trong tuần — tự điền 4 tuần tới. Vẫn bỏ/sửa từng ngày được.",
    ja: "曜日を選ぶと、向こう4週間が自動入力されます。個別の日はいつでも変更可能。",
  },
  "coworking.pattern_save": {
    en: "Save pattern",
    vi: "Lưu lịch lặp",
    ja: "パターンを保存",
  },
  "coworking.tips_title": { en: "Tips", vi: "Mẹo", ja: "ヒント" },
  "coworking.tip_1": {
    en: "Click any day to see who's coming and join in.",
    vi: "Bấm vào ngày bất kỳ để xem ai lên và tham gia.",
    ja: "日付をクリックすると、出社する人が見えます。",
  },
  "coworking.tip_2": {
    en: "Set a repeating pattern to skip manual ticking each week.",
    vi: "Đặt lịch lặp để khỏi phải tick lại mỗi tuần.",
    ja: "繰り返しパターンを設定すれば、毎週のチェックが不要に。",
  },
  "coworking.tip_3": {
    en: "Found a busy day? Hop on so the team has critical mass!",
    vi: "Thấy ngày nào đông là vào ngay để team đủ vui!",
    ja: "盛り上がる日があれば、ぜひ参加して仲間を増やそう！",
  },
};

export function localeOf(lang) {
  if (lang === "vi") return "vi-VN";
  if (lang === "ja") return "ja-JP";
  return "en-US";
}

export function formatNum(n, lang) {
  return Number(n || 0).toLocaleString(localeOf(lang));
}

function detectInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.find((l) => l.code === saved)) return saved;
  } catch {}
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  if (nav === "vi" || nav === "ja") return nav;
  return "en";
}

const I18nContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(code) {
    if (LANGS.find((l) => l.code === code)) setLangState(code);
  }

  function t(key, vars) {
    const entry = dict[key];
    let str = (entry && (entry[lang] || entry.en)) || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}

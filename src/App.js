import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = {
  blue: "#378ADD",
  green: "#1D9E75",
  coral: "#D85A30",
  pink: "#D4537E",
  lightBlue: "#B5D4F4",
};

// B2B Events
const EVENTS = {
  himart_guide: '로그인_홈_메인배너_제휴페이지_하이마트상세활용가이드자세히보기',
  safecare_guide: '로그인_홈_메인배너_제휴페이지_안심케어가이드자세히보기',
  alimtalk_send_home: '로그인_홈_메인배너_제휴페이지_알림톡발송',
  safecare_external: '로그인_홈_메인배너_제휴페이지_이실장안심케어바로가기',
  himartcare_external: '로그인_홈_메인배너_제휴페이지_하이마트안심케어바로가기',
  store_view: '로그인_홈_메인배너_제휴페이지_파트너십혜택적용가능한하이마트지점전체보기',
  scroll: '로그인_홈_메인배너_제휴페이지_스크롤',
  banner_detail: '로그인_홈_매물관리_매물광고_자세히보기',
  banner_dismiss: '로그인_홈_매물관리_매물광고_자세히보기_오늘하루보지않기',
  modal_detail: '로그인_홈_매물관리_매물광고_자세히보기_자세히보기',
  alimtalk_send_listing: '로그인_홈_매물관리_매물광고_자세히보기_알림톡발송',
  contract_send_btn: '로그인_홈_계약관리_계약리스트_하이마트제휴정보발송',
  contract_next: '로그인_홈_계약관리_계약리스트_하이마트제휴정보발송_다음',
  alimtalk_send_contract: '로그인_홈_계약관리_계약리스트_하이마트제휴정보발송_다음_알림톡발송',
};

// B2C Events
const B2C_EVENTS = {
  page_view: 'page_view',
  gnb_reqReserveBtn: 'GNB_상담신청하기',
  gnb_couponBtn: 'GNB_쿠폰받기',
  lease_tab: '거래유형_임대차탭',
  mid_reqReserveBtn: '중반_상담신청하기',
  low_reqReserveBtn: '하단_상담신청하기',
  buy_tab: '거래유형_매매탭',
  buy_fee: '매매이용료 조회',
  coupon_detail: '쿠폰_안심케어알아보기',
  coupon_phone: '쿠폰_인증번호전송',
  coupon_get: '쿠폰_쿠폰받기',
  android_down: '앱설치_구글플레이',
  apple_down: '앱설치_애플스토어',
  pop_reqReserveBtn: '상담예약_상담신청',
};

// Date Parsing Utilities
const parseDate = (str) => {
  const s = str.replace(/-/g, "");
  const y = parseInt(s.slice(0, 4));
  const m = parseInt(s.slice(4, 6)) - 1;
  const d = parseInt(s.slice(6, 8));
  return new Date(y, m, d);
};

const formatDateYmd = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

const formatDateInput = (ymd) => {
  if (!ymd || ymd.length !== 8) return "";
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
};

const formatDateInputToYmd = (inputVal) => {
  return inputVal.replace(/-/g, "");
};

function aggregateDataForRange(dailyEvents, startYmd, endYmd, updatedAt) {
  const startDate = parseDate(startYmd);
  const endDate = parseDate(endYmd);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 이전 기간 계산 (동일 일수만큼 직전으로 설정)
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(startDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevEndDate.getDate() - diffDays + 1);

  const prevStartYmd = formatDateYmd(prevStartDate);
  const prevEndYmd = formatDateYmd(prevEndDate);

  const c = {};
  const p = {};
  const dailyTrend = {};

  const allNames = [...Object.values(EVENTS), ...Object.values(B2C_EVENTS)];
  for (const name of allNames) {
    c[name] = 0;
    p[name] = 0;
  }

  for (const [dateStr, events] of Object.entries(dailyEvents || {})) {
    if (dateStr >= startYmd && dateStr <= endYmd) {
      for (const [name, val] of Object.entries(events)) {
        c[name] = (c[name] || 0) + val;
      }
      const sendCount = (events[EVENTS.alimtalk_send_home] || 0) + (events[EVENTS.alimtalk_send_listing] || 0) + (events[EVENTS.alimtalk_send_contract] || 0);
      dailyTrend[dateStr] = sendCount;
    } else if (dateStr >= prevStartYmd && dateStr <= prevEndYmd) {
      for (const [name, val] of Object.entries(events)) {
        p[name] = (p[name] || 0) + val;
      }
    }
  }

  const totalSend = (c[EVENTS.alimtalk_send_home] || 0) + (c[EVENTS.alimtalk_send_listing] || 0) + (c[EVENTS.alimtalk_send_contract] || 0);
  const prevTotalSend = (p[EVENTS.alimtalk_send_home] || 0) + (p[EVENTS.alimtalk_send_listing] || 0) + (p[EVENTS.alimtalk_send_contract] || 0);
  const pageInflow = (c[EVENTS.scroll] || 0);
  const prevPageInflow = (p[EVENTS.scroll] || 0);

  const b2cPageInflow = c[B2C_EVENTS.page_view] || 0;
  const prevB2cPageInflow = p[B2C_EVENTS.page_view] || 0;
  const b2cCouponGet = c[B2C_EVENTS.coupon_get] || 0;
  const prevB2cCouponGet = p[B2C_EVENTS.coupon_get] || 0;
  const b2cReqReserve = c[B2C_EVENTS.pop_reqReserveBtn] || 0;
  const prevB2cReqReserve = p[B2C_EVENTS.pop_reqReserveBtn] || 0;

  return {
    updatedAt: updatedAt || new Date().toISOString(),
    summary: {
      totalSend,
      totalSendChange: prevTotalSend ? Math.round(((totalSend - prevTotalSend) / prevTotalSend) * 100) : 0,
      pageInflow,
      pageInflowChange: prevPageInflow ? Math.round(((pageInflow - prevPageInflow) / prevPageInflow) * 100) : 0,
      conversionRate: pageInflow ? Math.round((totalSend / pageInflow) * 1000) / 10 : 0,
      bannerDismissRate: c[EVENTS.banner_detail]
        ? Math.round((c[EVENTS.banner_dismiss] / (c[EVENTS.banner_detail] + c[EVENTS.banner_dismiss])) * 1000) / 10
        : 0,
    },
    sendBySource: {
      home: c[EVENTS.alimtalk_send_home] || 0,
      listing: c[EVENTS.alimtalk_send_listing] || 0,
      contract: c[EVENTS.alimtalk_send_contract] || 0,
    },
    pageActions: {
      alimtalk: c[EVENTS.alimtalk_send_home] || 0,
      guide: (c[EVENTS.himart_guide] || 0) + (c[EVENTS.safecare_guide] || 0),
      external: (c[EVENTS.safecare_external] || 0) + (c[EVENTS.himartcare_external] || 0),
      store: c[EVENTS.store_view] || 0,
    },
    listingFunnel: {
      bannerClick: c[EVENTS.banner_detail] || 0,
      modalSend: c[EVENTS.alimtalk_send_listing] || 0,
      dismiss: c[EVENTS.banner_dismiss] || 0,
    },
    contractFunnel: {
      sendBtn: c[EVENTS.contract_send_btn] || 0,
      next: c[EVENTS.contract_next] || 0,
      complete: c[EVENTS.alimtalk_send_contract] || 0,
    },
    dailyTrend,
    dailyEvents,
    b2cSummary: {
      pageInflow: b2cPageInflow,
      pageInflowChange: prevB2cPageInflow ? Math.round(((b2cPageInflow - prevB2cPageInflow) / prevB2cPageInflow) * 100) : 0,
      couponGet: b2cCouponGet,
      couponGetChange: prevB2cCouponGet ? Math.round(((b2cCouponGet - prevB2cCouponGet) / prevB2cCouponGet) * 100) : 0,
      reqReserve: b2cReqReserve,
      reqReserveChange: prevB2cReqReserve ? Math.round(((b2cReqReserve - prevB2cReqReserve) / prevB2cReqReserve) * 100) : 0,
      conversionRate: b2cPageInflow ? Math.round((b2cReqReserve / b2cPageInflow) * 1000) / 10 : 0,
    },
    b2cCounselingPaths: {
      gnb: c[B2C_EVENTS.gnb_reqReserveBtn] || 0,
      mid: c[B2C_EVENTS.mid_reqReserveBtn] || 0,
      low: c[B2C_EVENTS.low_reqReserveBtn] || 0,
    },
    b2cTabs: {
      lease: c[B2C_EVENTS.lease_tab] || 0,
      buy: c[B2C_EVENTS.buy_tab] || 0,
    },
    b2cFunnel: {
      detail: c[B2C_EVENTS.coupon_detail] || 0,
      phone: c[B2C_EVENTS.coupon_phone] || 0,
      get: b2cCouponGet,
    },
    b2cOther: {
      gnbCoupon: c[B2C_EVENTS.gnb_couponBtn] || 0,
      buyFee: c[B2C_EVENTS.buy_fee] || 0,
      androidDown: c[B2C_EVENTS.android_down] || 0,
      appleDown: c[B2C_EVENTS.apple_down] || 0,
    }
  };
}

function KpiCard({ label, value, change, unit = "" }) {
  const isPos = change >= 0;
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "16px 20px",
      border: "1px solid #eee", flex: 1, minWidth: 0,
      boxShadow: "0 2px 5px rgba(0,0,0,0.01)"
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#222" }}>
        {typeof value === "number" ? value.toLocaleString() : value}{unit}
      </div>
      {change !== undefined && (
        <div style={{ fontSize: 12, marginTop: 4, color: isPos ? "#1D9E75" : "#E24B4A" }}>
          {isPos ? "▲" : "▼"} {Math.abs(change)}% vs 이전 기간
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "16px 20px",
      border: "1px solid #eee", ...style,
    }}>
      {children}
    </div>
  );
}

const CUSTOM_TOOLTIP_STYLE = {
  background: "#fff", border: "1px solid #eee", borderRadius: 8,
  padding: "8px 12px", fontSize: 12,
};

function formatKoreanUpdatedDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `마지막 업데이트: ${year}년 ${month}월 ${day}일 ${hour}:${minute}`;
  } catch (e) {
    return "";
  }
}

export default function App() {
  const [period, setPeriod] = useState(30);
  const [rawFetchedData, setRawFetchedData] = useState(null);
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDateVal, setStartDateVal] = useState("");
  const [endDateVal, setEndDateVal] = useState("");
  const [activeTab, setActiveTab] = useState("b2b");

  useEffect(() => {
    setLoading(true);
    fetch(process.env.PUBLIC_URL + `/data-${period}.json`)
      .then((r) => r.json())
      .then((d) => {
        setRawFetchedData(d);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        fetch(process.env.PUBLIC_URL + "/data.json")
          .then((r) => r.json())
          .then((d) => {
            setRawFetchedData(d);
            setLoading(false);
            setError(null);
          })
          .catch(() => {
            setError("데이터를 불러올 수 없습니다.");
            setLoading(false);
          });
      });
  }, [period]);

  useEffect(() => {
    if (rawFetchedData) {
      const dates = Object.keys(rawFetchedData.dailyEvents || {}).sort();
      if (dates.length > 0) {
        const N = period;
        const currentDates = dates.slice(dates.length - N);
        const start = currentDates[0] || dates[0];
        const end = dates[dates.length - 1];
        setStartDateVal(formatDateInput(start));
        setEndDateVal(formatDateInput(end));
        setDisplayData(rawFetchedData);
      }
    }
  }, [rawFetchedData, period]);

  const applyCustomRange = () => {
    if (!startDateVal || !endDateVal || !rawFetchedData) return;
    const startYmd = formatDateInputToYmd(startDateVal);
    const endYmd = formatDateInputToYmd(endDateVal);
    if (startYmd > endYmd) {
      alert("시작일은 종료일보다 빨라야 합니다.");
      return;
    }
    const aggregated = aggregateDataForRange(
      rawFetchedData.dailyEvents,
      startYmd,
      endYmd,
      rawFetchedData.updatedAt
    );
    setDisplayData(aggregated);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888", fontFamily: "'Pretendard', sans-serif" }}>
      데이터 불러오는 중...
    </div>
  );

  if (error || !displayData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#E24B4A", fontFamily: "'Pretendard', sans-serif" }}>
      {error || "데이터 없음"}
    </div>
  );

  const {
    summary,
    sendBySource,
    pageActions,
    listingFunnel,
    contractFunnel,
    dailyTrend,
    updatedAt,
    b2cSummary = { pageInflow: 0, pageInflowChange: 0, couponGet: 0, couponGetChange: 0, reqReserve: 0, reqReserveChange: 0, conversionRate: 0 },
    b2cCounselingPaths = { gnb: 0, mid: 0, low: 0 },
    b2cTabs = { lease: 0, buy: 0 },
    b2cFunnel = { detail: 0, phone: 0, get: 0 },
    b2cOther = { gnbCoupon: 0, buyFee: 0, androidDown: 0, appleDown: 0 }
  } = displayData;

  const dates = Object.keys(rawFetchedData?.dailyEvents || {}).sort();
  const minSelectableDate = dates[0] ? formatDateInput(dates[0]) : "";
  const maxSelectableDate = dates[dates.length - 1] ? formatDateInput(dates[dates.length - 1]) : "";

  // B2B Chart Data
  const sourceData = [
    { name: "계약관리", value: sendBySource.contract, fill: COLORS.blue },
    { name: "제휴페이지", value: sendBySource.home, fill: COLORS.green },
    { name: "매물광고", value: sendBySource.listing, fill: COLORS.coral },
  ];

  const pieData = [
    { name: "알림톡 발송", value: pageActions.alimtalk },
    { name: "가이드 열람", value: pageActions.guide },
    { name: "외부링크 이동", value: pageActions.external },
    { name: "지점 전체보기", value: pageActions.store },
  ];
  const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.coral, COLORS.pink];

  const trendData = Object.entries(dailyTrend || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: date.slice(4, 6) + "/" + date.slice(6, 8),
      발송: count,
    }));

  const listingMax = listingFunnel.bannerClick || 1;
  const listingFunnelData = [
    { name: "배너 클릭", value: listingFunnel.bannerClick, pct: 100 },
    { name: "모달 발송", value: listingFunnel.modalSend, pct: Math.round((listingFunnel.modalSend / listingMax) * 100) },
  ];

  const contractMax = contractFunnel.sendBtn || 1;
  const contractFunnelData = [
    { name: "발송 버튼", value: contractFunnel.sendBtn, pct: 100 },
    { name: "고객 선택", value: contractFunnel.next, pct: Math.round((contractFunnel.next / contractMax) * 100) },
    { name: "발송 완료", value: contractFunnel.complete, pct: Math.round((contractFunnel.complete / contractMax) * 100) },
  ];

  // B2C Chart Data
  const b2cCounselingData = [
    { name: "GNB", value: b2cCounselingPaths.gnb, fill: COLORS.blue },
    { name: "중반", value: b2cCounselingPaths.mid, fill: COLORS.green },
    { name: "하단", value: b2cCounselingPaths.low, fill: COLORS.coral },
  ];

  const b2cTabsData = [
    { name: "임대차 (전월세)", value: b2cTabs.lease, fill: COLORS.blue },
    { name: "매매", value: b2cTabs.buy, fill: COLORS.coral },
  ];

  const couponMax = b2cFunnel.detail || 1;
  const b2cFunnelData = [
    { name: "안심케어 알아보기", value: b2cFunnel.detail, pct: 100 },
    { name: "인증번호 전송", value: b2cFunnel.phone, pct: Math.round((b2cFunnel.phone / couponMax) * 100) },
    { name: "쿠폰 받기 (핵심전환)", value: b2cFunnel.get, pct: Math.round((b2cFunnel.get / couponMax) * 100) },
  ];

  return (
    <div style={{ background: "#f5f6f8", minHeight: "100vh", padding: "24px", fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 대시보드 헤더 */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>🛒 하이마트 제휴 대시보드</div>
          <div style={{ fontSize: 13, color: "#777", marginTop: 4, fontWeight: 500 }}>
            {formatKoreanUpdatedDate(updatedAt)}
          </div>
        </div>

        {/* 날짜 필터 제어 영역 */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* 기간 선택 세그먼트 버튼 */}
          <div style={{ display: "flex", gap: "4px", background: "#e4e6eb", padding: "3px", borderRadius: "8px" }}>
            {[7, 14, 30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setPeriod(r)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: period === r ? "#fff" : "transparent",
                  color: period === r ? "#222" : "#666",
                  fontWeight: period === r ? 600 : 400,
                  fontSize: "12px",
                  cursor: "pointer",
                  boxShadow: period === r ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {r}일
              </button>
            ))}
          </div>

          {/* 달력 날짜 피커 (Date Picker) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff", padding: "4px 8px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <input
              type="date"
              value={startDateVal}
              min={minSelectableDate}
              max={maxSelectableDate}
              onChange={(e) => setStartDateVal(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: "12px", color: "#333", cursor: "pointer" }}
            />
            <span style={{ fontSize: "12px", color: "#999" }}>~</span>
            <input
              type="date"
              value={endDateVal}
              min={minSelectableDate}
              max={maxSelectableDate}
              onChange={(e) => setEndDateVal(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: "12px", color: "#333", cursor: "pointer" }}
            />
            <button
              onClick={applyCustomRange}
              style={{
                background: COLORS.blue,
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => e.target.style.background = "#2a70b8"}
              onMouseOut={(e) => e.target.style.background = COLORS.blue}
            >
              적용
            </button>
          </div>
        </div>
      </div>

      {/* ================= 공통 KPI 카드 섹션 (상단 고정) ================= */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <KpiCard label="[B2B] 총 알림톡 발송" value={summary.totalSend} change={summary.totalSendChange} />
        <KpiCard label="[B2B] 제휴페이지 유입" value={summary.pageInflow} change={summary.pageInflowChange} />
        <KpiCard label="[B2C] CC 페이지 유입" value={b2cSummary.pageInflow} change={b2cSummary.pageInflowChange} />
        <KpiCard label="[B2C] 상담 신청 수" value={b2cSummary.reqReserve} change={b2cSummary.reqReserveChange} />
      </div>

      {/* ================= 탭 메뉴 분리 레이아웃 ================= */}
      <div style={{ display: "flex", borderBottom: "2px solid #e4e6eb", marginBottom: 20, gap: "8px" }}>
        <button
          onClick={() => setActiveTab("b2b")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "b2b" ? `3px solid ${COLORS.blue}` : "3px solid transparent",
            color: activeTab === "b2b" ? COLORS.blue : "#666",
            fontWeight: activeTab === "b2b" ? 700 : 500,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-2px",
          }}
        >
          B2B (이실장 → 하이마트)
        </button>
        <button
          onClick={() => setActiveTab("b2c")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "b2c" ? `3px solid ${COLORS.blue}` : "3px solid transparent",
            color: activeTab === "b2c" ? COLORS.blue : "#666",
            fontWeight: activeTab === "b2c" ? 700 : 500,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-2px",
          }}
        >
          B2C (하이마트 → 이실장)
        </button>
      </div>

      {/* ================= 탭 콘텐츠 렌더링 ================= */}
      {activeTab === "b2b" ? (
        <div>
          {/* B2B 세부 KPI (전환율, 거부율) */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <KpiCard label="B2B 유입→발송 전환율" value={summary.conversionRate} unit="%" />
            <KpiCard label="B2B 매물배너 거부율" value={summary.bannerDismissRate} unit="%" />
          </div>

          {/* B2B 주요 시각화 */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 16 }}>
            <Card>
              <SectionTitle>진입점별 알림톡 발송 수</SectionTitle>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={sourceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "건"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, marginTop: 4 }}>
                <SectionTitle>일별 발송 추이</SectionTitle>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={trendData} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                    <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "건", "발송"]} />
                    <Line type="monotone" dataKey="발송" stroke={COLORS.blue} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionTitle>제휴페이지 내 행동 분포</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "회"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card>
              <SectionTitle>매물광고 배너 퍼널</SectionTitle>
              {listingFunnelData.map((step, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
                    <span>{step.name}</span>
                    <span style={{ fontWeight: 600, color: "#222" }}>{step.value.toLocaleString()}명</span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: 4, height: 22, overflow: "hidden" }}>
                    <div style={{
                      width: step.pct + "%", height: "100%", borderRadius: 4,
                      background: i === 0 ? COLORS.lightBlue : COLORS.blue,
                      display: "flex", alignItems: "center", paddingLeft: 8,
                      transition: "width 0.5s",
                    }}>
                      <span style={{ fontSize: 10, color: i === 0 ? "#185FA5" : "#fff", fontWeight: 500 }}>{step.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#E24B4A", marginTop: 8 }}>
                배너 거부(오늘 하루 보지 않기): {listingFunnel.dismiss.toLocaleString()}명
              </div>
            </Card>

            <Card>
              <SectionTitle>계약관리 퍼널</SectionTitle>
              {contractFunnelData.map((step, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
                    <span>{step.name}</span>
                    <span style={{ fontWeight: 600, color: "#222" }}>{step.value.toLocaleString()}명</span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: 4, height: 22, overflow: "hidden" }}>
                    <div style={{
                      width: step.pct + "%", height: "100%", borderRadius: 4,
                      background: ["#9FE1CB", "#1D9E75", "#0F6E56"][i],
                      display: "flex", alignItems: "center", paddingLeft: 8,
                      transition: "width 0.5s",
                    }}>
                      <span style={{ fontSize: 10, color: i === 0 ? "#085041" : "#fff", fontWeight: 500 }}>{step.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#1D9E75", marginTop: 8 }}>
                최종 전환율: {contractFunnel.sendBtn ? Math.round((contractFunnel.complete / contractFunnel.sendBtn) * 1000) / 10 : 0}%
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div>
          {/* B2C 세부 KPI (쿠폰받기, 상담예약 전환율) */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <KpiCard label="B2C 쿠폰 받기 전환 수" value={b2cSummary.couponGet} change={b2cSummary.couponGetChange} />
            <KpiCard label="B2C 상담 예약 전환율" value={b2cSummary.conversionRate} unit="%" />
          </div>

          {/* B2C 주요 시각화 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {/* 쿠폰 받기 퍼널 */}
            <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <SectionTitle>쿠폰 받기 퍼널</SectionTitle>
                {b2cFunnelData.map((step, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
                      <span>{step.name}</span>
                      <span style={{ fontWeight: 600, color: "#222" }}>{step.value.toLocaleString()}명</span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 4, height: 22, overflow: "hidden" }}>
                      <div style={{
                        width: step.pct + "%", height: "100%", borderRadius: 4,
                        background: ["#B5D4F4", "#5DA2E8", "#378ADD"][i],
                        display: "flex", alignItems: "center", paddingLeft: 8,
                        transition: "width 0.5s",
                      }}>
                        <span style={{ fontSize: 10, color: i === 0 ? "#185FA5" : "#fff", fontWeight: 500 }}>{step.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
                <span>앱 설치 (AOS / iOS)</span>
                <span style={{ fontWeight: 600, color: "#222" }}>
                  {b2cOther.androidDown || 0}건 / {b2cOther.appleDown || 0}건
                </span>
              </div>
            </Card>

            {/* 상담신청 경로 비교 */}
            <Card>
              <SectionTitle>상담신청 경로 비교</SectionTitle>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={b2cCounselingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "건"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={25}>
                    {b2cCounselingData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 전월세 vs 매매 탭 비율 */}
            <Card>
              <SectionTitle>전월세 vs 매매 탭 비율</SectionTitle>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={b2cTabsData} cx="50%" cy="45%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={2}>
                    {b2cTabsData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "회"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, marginTop: 5 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

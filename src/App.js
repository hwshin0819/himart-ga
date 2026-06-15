import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
  LabelList,
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

const formatDateInputToYmd = (inputVal) => {
  return inputVal.replace(/-/g, "");
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const getWeekday = (dateStr) => {
  const d = parseDate(dateStr);
  return WEEKDAYS[d.getDay()];
};

function aggregateDataForRange(rawFetchedData, startYmd, endYmd) {
  const dailyEvents = rawFetchedData.dailyEvents || {};
  const dailyHourly = rawFetchedData.dailyHourly || {};
  const updatedAt = rawFetchedData.updatedAt;

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
  const hourlyTrend = {};
  for (let h = 0; h < 24; h++) {
    const hStr = String(h).padStart(2, '0');
    hourlyTrend[hStr] = 0;
    hourlyTrend[hStr + "_user"] = 0;
  }

  const allNames = [...Object.values(EVENTS), ...Object.values(B2C_EVENTS)];
  const allNamesWithUsers = [];
  for (const name of allNames) {
    allNamesWithUsers.push(name);
    allNamesWithUsers.push(name + "_user");
  }
  for (const name of allNamesWithUsers) {
    c[name] = 0;
    p[name] = 0;
  }

  for (const [dateStr, events] of Object.entries(dailyEvents)) {
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

  for (const [dateStr, hours] of Object.entries(dailyHourly)) {
    if (dateStr >= startYmd && dateStr <= endYmd) {
      for (const [hourStr, val] of Object.entries(hours)) {
        hourlyTrend[hourStr] = (hourlyTrend[hourStr] || 0) + val;
      }
    }
  }

  const totalSend = (c[EVENTS.alimtalk_send_home] || 0) + (c[EVENTS.alimtalk_send_listing] || 0) + (c[EVENTS.alimtalk_send_contract] || 0);
  const totalSendUser = (c[EVENTS.alimtalk_send_home + "_user"] || 0) + (c[EVENTS.alimtalk_send_listing + "_user"] || 0) + (c[EVENTS.alimtalk_send_contract + "_user"] || 0);
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
      totalSendUser,
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
      home_user: c[EVENTS.alimtalk_send_home + "_user"] || 0,
      listing: c[EVENTS.alimtalk_send_listing] || 0,
      listing_user: c[EVENTS.alimtalk_send_listing + "_user"] || 0,
      contract: c[EVENTS.alimtalk_send_contract] || 0,
      contract_user: c[EVENTS.alimtalk_send_contract + "_user"] || 0,
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
    dailyHourly,
    hourlyTrend,

    // B2C Data
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

function KpiCard({ label, value, change, unit = "", valueColor, icon, showChange, userCount }) {
  const isPos = change >= 0;
  return (
    <div style={{
      background: "#fff", borderRadius: "8px", padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
      flex: 1, minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start"
    }}>
      <div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px", fontWeight: 500 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", flexWrap: "wrap" }}>
          <div style={{ fontSize: userCount !== undefined ? "18px" : "24px", fontWeight: 700, color: "#222" }}>
            {typeof value === "number" ? value.toLocaleString() : value}{unit}
            {userCount !== undefined && (
              <span style={{ fontSize: "12px", color: "#666", fontWeight: 500, marginLeft: "4px" }}>
                (중개사 {userCount.toLocaleString()}명)
              </span>
            )}
          </div>
          {valueColor && (
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: valueColor,
              marginLeft: "4px",
              transform: "translateY(-2px)"
            }} />
          )}
        </div>
        {showChange && change !== undefined && (
          <div style={{ fontSize: "11px", marginTop: "4px", color: isPos ? "#1D9E75" : "#E24B4A", fontWeight: 500 }}>
            {isPos ? "▲" : "▼"} {Math.abs(change)}% vs 이전 기간
          </div>
        )}
      </div>
      {icon && (
        <div style={{
          fontSize: "18px", background: "#f5f6f8", width: "36px", height: "36px",
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {icon}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 8, padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)", ...style,
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

function Funnel({ title, steps, footerText, footerColor }) {
  const maxVal = steps[0]?.value || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#444", marginBottom: "8px" }}>{title}</div>
      <div style={{ fontFamily: "'Pretendard', monospace", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {steps.map((step, idx) => {
          let dropRateText = "";
          if (idx > 0 && steps[idx - 1].value > 0) {
            const prevVal = steps[idx - 1].value;
            const currVal = step.value;
            const drop = Math.round((1 - currVal / prevVal) * 100);
            const clampedDrop = Math.max(0, Math.min(100, drop));
            dropRateText = `▼ ${clampedDrop}% 이탈`;
          } else {
            dropRateText = "100%";
          }
          
          const blockCount = Math.max(0, Math.min(16, Math.round((step.value / maxVal) * 16)));
          const fillBlocks = "█".repeat(blockCount);
          const emptyBlocks = "░".repeat(Math.max(0, 16 - blockCount));
          const blockStr = fillBlocks + emptyBlocks;

          return (
            <div key={idx} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8f9fa",
              padding: "8px 12px",
              borderRadius: "6px",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
            }}>
              <div style={{ width: "95px", fontWeight: 600, color: "#555" }}>
                {step.name}
              </div>
              
              <div style={{
                flex: 1,
                textAlign: "left",
                color: step.color || COLORS.blue,
                letterSpacing: "0.5px",
                marginLeft: "8px",
                marginRight: "8px",
                fontSize: "13px",
                userSelect: "none"
              }}>
                {blockStr}
              </div>
              
              <div style={{ width: "55px", textAlign: "right", fontWeight: 600, color: "#333" }}>
                {step.value.toLocaleString()}명
              </div>
              
              <div style={{
                width: "80px",
                textAlign: "right",
                fontWeight: 600,
                color: idx === 0 ? "#666" : "#E24B4A",
                fontSize: "11px"
              }}>
                {dropRateText}
              </div>
            </div>
          );
        })}
      </div>
      {footerText && (
        <div style={{ fontSize: "11px", color: footerColor || "#666", marginTop: "4px", textAlign: "right", fontWeight: 500 }}>
          {footerText}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ totalSend, totalSendUser, pageInflow, homeSend, bannerClick, listingSend, sendBtn, contractSend, bannerDismissRate }) {
  const channels = [
    { name: "계약관리", inflow: sendBtn, send: contractSend },
    { name: "제휴페이지", inflow: pageInflow, send: homeSend },
    { name: "매물광고", inflow: bannerClick, send: listingSend }
  ];
  
  let bestChannelName = "계약관리";
  let bestRate = 0;
  
  channels.forEach(ch => {
    const rate = ch.inflow ? (ch.send / ch.inflow) * 100 : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestChannelName = ch.name;
    }
  });

  const dismissStatus = bannerDismissRate >= 50 ? "주의" : "양호";
  const dismissColor = bannerDismissRate >= 50 ? "#E24B4A" : "#1D9E75";
  
  return (
    <div style={{
      fontSize: "12px",
      color: "#666",
      fontWeight: 500,
      marginTop: "-12px",
      marginBottom: "16px",
      paddingLeft: "4px",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    }}>
      <span style={{ color: "#378ADD" }}>ℹ️</span>
      <span>
        선택 기간 총 <strong style={{ color: "#222" }}>{totalSend.toLocaleString()}건{totalSendUser ? ` (중개사 ${totalSendUser.toLocaleString()}명)` : ""}</strong> 발송 · 
        <strong style={{ color: "#222" }}> {bestChannelName}</strong> 경로 효율 1위 ({bestRate.toFixed(1)}%) · 
        배너 거부율 
        <span style={{
          color: dismissColor,
          fontWeight: 700,
          marginLeft: "4px"
        }}>
          {dismissStatus} ({bannerDismissRate.toFixed(1)}%)
        </span>
      </span>
    </div>
  );
}

function EntryPointEfficiencyCard({ pageInflow, homeSend, bannerClick, listingSend, sendBtn, contractSend }) {
  const list = [
    {
      name: "매물광고",
      exposed: bannerClick,
      sent: listingSend,
      label: "exposed",
      color: COLORS.coral
    },
    {
      name: "계약관리",
      exposed: sendBtn,
      sent: contractSend,
      label: "clicked",
      color: COLORS.blue
    },
    {
      name: "제휴페이지",
      exposed: pageInflow,
      sent: homeSend,
      label: "visited",
      color: COLORS.green
    }
  ].map(item => {
    const rawRate = item.exposed ? (item.sent / item.exposed) * 100 : 0;
    const rate = Math.min(100, rawRate);
    return { ...item, rate };
  });

  return (
    <Card style={{ marginBottom: "16px" }}>
      <SectionTitle>진입점별 효율 비교 (전환율)</SectionTitle>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
        {list.map((item, idx) => (
          <div key={idx} style={{
            flex: 1, minWidth: "180px", background: "#f8f9fa", padding: "12px",
            borderRadius: "6px", border: "1px solid #eee"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>{item.name}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: item.color }}>{item.rate.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>
              {item.exposed.toLocaleString()} {item.label} → {item.sent.toLocaleString()} sent
            </div>
            <div style={{ background: "#e4e6eb", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                background: item.color, height: "100%", width: `${item.rate}%`,
                transition: "width 0.5s ease-in-out"
              }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
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
  const [pieCardCollapsed, setPieCardCollapsed] = useState(false);

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
      setStartDateVal("");
      setEndDateVal("");
      const dates = Object.keys(rawFetchedData.dailyEvents || {}).sort();
      if (dates.length > 0) {
        const start = dates[0];
        const end = dates[dates.length - 1];
        const aggregated = aggregateDataForRange(rawFetchedData, start, end);
        setDisplayData(aggregated);
      } else {
        setDisplayData(rawFetchedData);
      }
    }
  }, [rawFetchedData]);

  const applyCustomRange = () => {
    if (!startDateVal || !endDateVal || !rawFetchedData) return;
    const startYmd = formatDateInputToYmd(startDateVal);
    const endYmd = formatDateInputToYmd(endDateVal);
    if (startYmd > endYmd) {
      alert("시작일은 종료일보다 빨라야 합니다.");
      return;
    }
    const aggregated = aggregateDataForRange(
      rawFetchedData,
      startYmd,
      endYmd
    );
    setDisplayData(aggregated);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      데이터 불러오는 중...
    </div>
  );

  if (error || !displayData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#E24B4A", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
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
    hourlyTrend,
    updatedAt,
    b2cSummary = { pageInflow: 0, pageInflowChange: 0, couponGet: 0, couponGetChange: 0, reqReserve: 0, reqReserveChange: 0, conversionRate: 0 },
    b2cCounselingPaths = { gnb: 0, mid: 0, low: 0 },
    b2cTabs = { lease: 0, buy: 0 },
    b2cFunnel = { detail: 0, phone: 0, get: 0 },
    b2cOther = { gnbCoupon: 0, buyFee: 0, androidDown: 0, appleDown: 0 }
  } = displayData;

  // B2B Chart Data
  const sourceData = [
    { name: "계약관리", value: sendBySource.contract, userValue: sendBySource.contract_user, fill: COLORS.blue },
    { name: "제휴페이지", value: sendBySource.home, userValue: sendBySource.home_user, fill: COLORS.green },
    { name: "매물광고", value: sendBySource.listing, userValue: sendBySource.listing_user, fill: COLORS.coral },
  ];

  const renderBarLabel = (props) => {
    const { x, y, width, height, index } = props;
    const entry = sourceData[index];
    if (!entry) return null;
    const labelText = `${entry.value}건 (중개사 ${entry.userValue}명)`;
    return (
      <text x={x + width + 5} y={y + height / 2} fill="#333" fontSize={10} fontWeight={600} textAnchor="start" dominantBaseline="middle">
        {labelText}
      </text>
    );
  };

  const pieData = [
    { name: "알림톡 발송", value: pageActions.alimtalk },
    { name: "가이드 열람", value: pageActions.guide },
    { name: "외부링크 이동", value: pageActions.external },
    { name: "지점 전체보기", value: pageActions.store },
  ];
  const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.coral, COLORS.pink];
  const totalPieVal = pieData.reduce((sum, item) => sum + item.value, 0) || 1;
  const renderPieLegend = (value, entry) => {
    const val = entry.payload.value;
    const pct = Math.round((val / totalPieVal) * 100);
    return `${value} ${val.toLocaleString()}건 (${pct}%)`;
  };

  const trendData = Object.entries(dailyTrend || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      const weekday = getWeekday(date);
      const isWeekend = weekday === "토" || weekday === "일";
      
      const eventsForDay = displayData.dailyEvents?.[date] || {};
      const homeUser = eventsForDay[EVENTS.alimtalk_send_home + "_user"] || 0;
      const listingUser = eventsForDay[EVENTS.alimtalk_send_listing + "_user"] || 0;
      const contractUser = eventsForDay[EVENTS.alimtalk_send_contract + "_user"] || 0;
      const totalUser = homeUser + listingUser + contractUser;
      
      return {
        dateStr: date,
        date: `${date.slice(4, 6)}/${date.slice(6, 8)} (${weekday})`,
        발송: count,
        중개사: totalUser,
        isWeekend,
      };
    });

  const hourlyChartData = Object.entries(hourlyTrend || {})
    .filter(([hour]) => !hour.endsWith("_user"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({
      hour: hour + "시",
      발송: count,
      중개사: hourlyTrend[hour + "_user"] || 0,
    }));

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

  return (
    <div style={{ background: "#f5f6f8", minHeight: "100vh", padding: "16px 24px", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      {/* 대시보드 헤더 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#222" }}>
          🛒 하이마트 제휴 대시보드
        </div>

        {/* 날짜 필터 및 업데이트 정보 영역 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* 달력 날짜 피커 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#fff",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
              <input
                type={startDateVal ? "date" : "text"}
                placeholder="시작일 (날짜를 선택해주세요)"
                value={startDateVal}
                onFocus={(e) => e.target.type = "date"}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                onChange={(e) => setStartDateVal(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "11px", color: "#333", cursor: "pointer", width: "135px" }}
              />
              <span style={{ fontSize: "11px", color: "#999" }}>~</span>
              <input
                type={endDateVal ? "date" : "text"}
                placeholder="종료일 (날짜를 선택해주세요)"
                value={endDateVal}
                onFocus={(e) => e.target.type = "date"}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                onChange={(e) => setEndDateVal(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "11px", color: "#333", cursor: "pointer", width: "135px" }}
              />
              <button
                onClick={applyCustomRange}
                style={{
                  background: COLORS.blue,
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  padding: "4px 10px",
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

            {/* 프리셋 버튼 */}
            <div style={{
              display: "flex",
              gap: "2px",
              background: "#e4e6eb",
              padding: "2px",
              borderRadius: "8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
              {[7, 14, 30, 90].map((r) => (
                <button
                  key={r}
                  onClick={() => setPeriod(r)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: period === r ? "#fff" : "transparent",
                    color: period === r ? "#222" : "#555",
                    fontWeight: period === r ? 600 : 400,
                    fontSize: "11px",
                    cursor: "pointer",
                    boxShadow: period === r ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {r}일
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 500, marginRight: "4px" }}>
            {formatKoreanUpdatedDate(updatedAt)}
          </div>
        </div>
      </div>

      {/* ================= 공통 KPI 카드 섹션 ================= */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <KpiCard label="총 알림톡 발송" value={summary.totalSend} change={summary.totalSendChange} icon="💬" showChange={startDateVal !== ""} userCount={summary.totalSendUser} />
        <KpiCard label="제휴페이지 유입" value={summary.pageInflow} change={summary.pageInflowChange} icon="💻" showChange={startDateVal !== ""} />
        <KpiCard label="CC 페이지 유입" value={b2cSummary.pageInflow} change={b2cSummary.pageInflowChange} icon="📱" showChange={startDateVal !== ""} />
        <KpiCard label="상담 신청 수" value={b2cSummary.reqReserve} change={b2cSummary.reqReserveChange} icon="📞" showChange={startDateVal !== ""} />
      </div>

      {/* ================= 동적 주간 요약 텍스트 라인 ================= */}
      <SummaryBar
        totalSend={summary.totalSend}
        totalSendUser={summary.totalSendUser}
        pageInflow={summary.pageInflow}
        homeSend={sendBySource.home}
        bannerClick={listingFunnel.bannerClick}
        listingSend={sendBySource.listing}
        sendBtn={contractFunnel.sendBtn}
        contractSend={sendBySource.contract}
        bannerDismissRate={summary.bannerDismissRate}
      />

      {/* ================= 탭 메뉴 분리 레이아웃 ================= */}
      <div style={{ display: "flex", borderBottom: "2px solid #e4e6eb", marginBottom: 16, gap: "8px" }}>
        <button
          onClick={() => setActiveTab("b2b")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "b2b" ? `3px solid ${COLORS.blue}` : "3px solid transparent",
            color: activeTab === "b2b" ? COLORS.blue : "#666",
            fontWeight: activeTab === "b2b" ? 700 : 500,
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-2px",
          }}
        >
          이실장 → 하이마트
        </button>
        <button
          onClick={() => setActiveTab("b2c")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "b2c" ? `3px solid ${COLORS.blue}` : "3px solid transparent",
            color: activeTab === "b2c" ? COLORS.blue : "#666",
            fontWeight: activeTab === "b2c" ? 700 : 500,
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-2px",
          }}
        >
          하이마트 → 이실장
        </button>
      </div>

      {/* ================= 탭 콘텐츠 렌더링 ================= */}
      {activeTab === "b2b" ? (
        <div>
          {/* B2B 세부 KPI (전환율, 거부율) */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <KpiCard
              label="B2B 유입→발송 전환율"
              value={summary.conversionRate}
              unit="%"
              valueColor={summary.conversionRate >= 30 ? "#1D9E75" : "#E24B4A"}
              icon="📈"
              showChange={false}
            />
            <KpiCard
              label="B2B 매물배너 거부율"
              value={summary.bannerDismissRate}
              unit="%"
              valueColor={summary.bannerDismissRate >= 50 ? "#E24B4A" : "#1D9E75"}
              icon="📉"
              showChange={false}
            />
          </div>

          {/* 진입점별 효율 비교 카드 */}
          <EntryPointEfficiencyCard
            pageInflow={summary.pageInflow}
            homeSend={sendBySource.home}
            bannerClick={listingFunnel.bannerClick}
            listingSend={sendBySource.listing}
            sendBtn={contractFunnel.sendBtn}
            contractSend={sendBySource.contract}
          />

          {/* B2B 주요 시각화 */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 12 }}>
            <Card style={{ padding: "12px 16px" }}>
              <SectionTitle>진입점별 알림톡 발송 수</SectionTitle>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={sourceData} layout="vertical" margin={{ left: 10, right: 110, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11, fill: "#666" }} />
                  <Tooltip
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                    formatter={(value, name, props) => {
                      const { userValue } = props.payload;
                      return [
                        userValue !== undefined
                          ? `${value.toLocaleString()}건 (중개사 ${userValue.toLocaleString()}명)`
                          : `${value.toLocaleString()}건`,
                        "발송"
                      ];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                    <LabelList content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, marginTop: 4 }}>
                <SectionTitle>일별 발송 추이</SectionTitle>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={trendData} margin={{ left: -20, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#888" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                    <Tooltip
                      contentStyle={CUSTOM_TOOLTIP_STYLE}
                      formatter={(v, name, props) => {
                        const { 중개사 } = props.payload;
                        return [
                          중개사 !== undefined
                            ? `${v.toLocaleString()}건 (중개사 ${중개사.toLocaleString()}명)`
                            : `${v.toLocaleString()}건`,
                          "발송"
                        ];
                      }}
                    />
                    <Bar dataKey="발송" radius={[3, 3, 0, 0]}>
                      {trendData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.isWeekend ? COLORS.coral : COLORS.blue}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionTitle>제휴페이지 내 행동 분포</SectionTitle>
                <button
                  onClick={() => setPieCardCollapsed(!pieCardCollapsed)}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.blue,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#f0f4f8"}
                  onMouseOut={(e) => e.target.style.background = "none"}
                >
                  {pieCardCollapsed ? "펼치기 ▲" : "접기 ▼"}
                </button>
              </div>

              {!pieCardCollapsed && (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="32%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "회"]} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={8}
                        formatter={renderPieLegend}
                        wrapperStyle={{ right: 0, fontSize: 10, lineHeight: "18px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, marginTop: 10 }}>
                    <SectionTitle>시간대별 알림톡 발송 분포 (24시간)</SectionTitle>
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart data={hourlyChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#aaa" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                        <Tooltip
                          contentStyle={CUSTOM_TOOLTIP_STYLE}
                          formatter={(v, name, props) => {
                            const { 중개사 } = props.payload;
                            return [
                              중개사 !== undefined
                                ? `${v.toLocaleString()}건 (중개사 ${중개사.toLocaleString()}명)`
                                : `${v.toLocaleString()}건`,
                              "발송"
                            ];
                          }}
                        />
                        <Bar dataKey="발송" fill={COLORS.green} radius={[2, 2, 0, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card style={{ padding: "12px 16px" }}>
              <Funnel
                title="매물광고 배너 퍼널"
                steps={[
                  { name: "배너 클릭", value: listingFunnel.bannerClick, color: COLORS.lightBlue },
                  { name: "모달 발송", value: listingFunnel.modalSend, color: COLORS.blue }
                ]}
                footerText={`배너 거부(오늘 하루 보지 않기): ${listingFunnel.dismiss.toLocaleString()}명`}
                footerColor="#E24B4A"
              />
            </Card>

            <Card style={{ padding: "12px 16px" }}>
              <Funnel
                title="계약관리 퍼널"
                steps={[
                  { name: "발송 버튼 클릭", value: contractFunnel.sendBtn, color: "#9FE1CB" },
                  { name: "고객 선택 (다음)", value: contractFunnel.next, color: "#1D9E75" },
                  { name: "발송 완료", value: contractFunnel.complete, color: "#0F6E56" }
                ]}
                footerText={`최종 전환율: ${contractFunnel.sendBtn ? Math.round((contractFunnel.complete / contractFunnel.sendBtn) * 1000) / 10 : 0}%`}
                footerColor="#1D9E75"
              />
            </Card>
          </div>
        </div>
      ) : (
        <div>
          {/* B2C 세부 KPI (쿠폰받기, 상담예약 전환율) */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <KpiCard label="B2C 쿠폰 받기 전환 수" value={b2cSummary.couponGet} change={b2cSummary.couponGetChange} icon="🎫" showChange={false} />
            <KpiCard label="B2C 상담 예약 전환율" value={b2cSummary.conversionRate} unit="%" icon="📈" showChange={false} />
          </div>

          {/* B2C 주요 시각화 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {/* 쿠폰 받기 퍼널 */}
            <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "12px 16px" }}>
              <Funnel
                title="쿠폰 받기 퍼널"
                steps={[
                  { name: "안심케어 알아보기", value: b2cFunnel.detail, color: "#B5D4F4" },
                  { name: "인증번호 전송", value: b2cFunnel.phone, color: "#5DA2E8" },
                  { name: "쿠폰 받기 (핵심전환)", value: b2cFunnel.get, color: COLORS.blue }
                ]}
                footerText={`앱 설치 (AOS / iOS): ${b2cOther.androidDown || 0}건 / ${b2cOther.appleDown || 0}건`}
                footerColor="#666"
              />
            </Card>

            {/* 상담신청 경로 비교 */}
            <Card style={{ padding: "12px 16px" }}>
              <SectionTitle>상담신청 경로 비교</SectionTitle>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={b2cCounselingData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString() + "건"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={25}>
                    {b2cCounselingData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="top" formatter={(v) => `${v}건`} style={{ fill: "#333", fontSize: 11, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 전월세 vs 매매 탭 비율 */}
            <Card style={{ padding: "12px 16px" }}>
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

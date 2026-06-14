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

export default function App() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(process.env.PUBLIC_URL + `/data-${period}.json`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        // Fallback to data.json if period-specific file is missing (e.g. for local dev before fetching all)
        fetch(process.env.PUBLIC_URL + "/data.json")
          .then((r) => r.json())
          .then((d) => {
            setData(d);
            setLoading(false);
            setError(null);
          })
          .catch(() => {
            setError("데이터를 불러올 수 없습니다.");
            setLoading(false);
          });
      });
  }, [period]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888", fontFamily: "'Pretendard', sans-serif" }}>
      데이터 불러오는 중...
    </div>
  );

  if (error || !data) return (
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
    // B2C Data (Fallbacks for compatibility)
    b2cSummary = { pageInflow: 0, pageInflowChange: 0, couponGet: 0, couponGetChange: 0, reqReserve: 0, reqReserveChange: 0, conversionRate: 0 },
    b2cCounselingPaths = { gnb: 0, mid: 0, low: 0 },
    b2cTabs = { lease: 0, buy: 0 },
    b2cFunnel = { detail: 0, phone: 0, get: 0 },
    b2cOther = { gnbCoupon: 0, buyFee: 0, androidDown: 0, appleDown: 0 }
  } = data;

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

  // B2C Data formatting
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

  const updatedDate = new Date(updatedAt).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ background: "#f5f6f8", minHeight: "100vh", padding: "24px", fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 대시보드 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#222" }}>🛒 하이마트 제휴 대시보드</div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>최근 {period}일 기준 · 업데이트: {updatedDate}</div>
        </div>

        {/* 기간 선택용 세그먼트 버튼 */}
        <div style={{ display: "flex", gap: "6px", background: "#e4e6eb", padding: "4px", borderRadius: "8px" }}>
          {[7, 14, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setPeriod(r)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: period === r ? "#fff" : "transparent",
                color: period === r ? "#222" : "#666",
                fontWeight: period === r ? 600 : 400,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: period === r ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {r}일
            </button>
          ))}
        </div>
      </div>

      {/* ================= B2B 섹션 (이실장 -> 하이마트) ================= */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#444", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span>📊 B2B 제휴 현황</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: "#888" }}>(이실장 중개사 → 고객에게 할인쿠폰 발송)</span>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <KpiCard label="총 알림톡 발송" value={summary.totalSend} change={summary.totalSendChange} />
        <KpiCard label="제휴페이지 유입" value={summary.pageInflow} change={summary.pageInflowChange} />
        <KpiCard label="유입→발송 전환율" value={summary.conversionRate} unit="%" />
        <KpiCard label="매물배너 거부율" value={summary.bannerDismissRate} unit="%" />
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
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

      {/* ================= B2C 섹션 (하이마트 -> 이실장) ================= */}
      <div style={{ borderTop: "1px dashed #ddd", paddingTop: 20, marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#444", display: "flex", alignItems: "center", gap: 6 }}>
          <span>🛒 B2C 제휴 현황</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: "#888" }}>(하이마트 → 고객을 이실장 CC 페이지로 송객)</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <KpiCard label="CC 페이지 유입 수" value={b2cSummary.pageInflow} change={b2cSummary.pageInflowChange} />
        <KpiCard label="쿠폰 받기 전환 수" value={b2cSummary.couponGet} change={b2cSummary.couponGetChange} />
        <KpiCard label="상담 신청 수" value={b2cSummary.reqReserve} change={b2cSummary.reqReserveChange} />
        <KpiCard label="상담 예약 전환율" value={b2cSummary.conversionRate} unit="%" />
      </div>

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
  );
}

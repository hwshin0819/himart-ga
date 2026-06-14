const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');
const path = require('path');

const credentialsJson = process.env.GA_CREDENTIALS;
const propertyId = process.env.GA_PROPERTY_ID;

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

let client;
if (credentialsJson && propertyId) {
  try {
    const credentials = JSON.parse(credentialsJson);
    client = new BetaAnalyticsDataClient({ credentials });
  } catch (err) {
    console.error('GA_CREDENTIALS parsing failed, running in Mock Mode.', err.message);
  }
}

function generateMockDataForPeriod(period) {
  const N = parseInt(period);
  const dailyTrend = {};
  const today = new Date();
  for (let i = N; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}${mm}${dd}`;
    dailyTrend[key] = Math.floor(Math.random() * 30) + 10;
  }

  const totalSend = Math.floor(Math.random() * 200) + 100;
  const pageInflow = Math.floor(Math.random() * 1000) + 800;

  const b2cPageInflow = Math.floor(Math.random() * 800) + 500;
  const b2cCouponGet = Math.floor(b2cPageInflow * 0.25) + 10;
  const b2cReqReserve = Math.floor(b2cPageInflow * 0.08) + 5;

  return {
    updatedAt: new Date().toISOString(),
    summary: {
      totalSend,
      totalSendChange: Math.floor(Math.random() * 30) - 10,
      pageInflow,
      pageInflowChange: Math.floor(Math.random() * 20) - 5,
      conversionRate: pageInflow ? Math.round((totalSend / pageInflow) * 1000) / 10 : 0,
      bannerDismissRate: Math.round((Math.random() * 15 + 5) * 10) / 10,
    },
    sendBySource: {
      home: Math.floor(totalSend * 0.4),
      listing: Math.floor(totalSend * 0.3),
      contract: totalSend - Math.floor(totalSend * 0.4) - Math.floor(totalSend * 0.3),
    },
    pageActions: {
      alimtalk: Math.floor(totalSend * 0.4),
      guide: Math.floor(pageInflow * 0.3),
      external: Math.floor(pageInflow * 0.15),
      store: Math.floor(pageInflow * 0.1),
    },
    listingFunnel: {
      bannerClick: Math.floor(totalSend * 1.5),
      modalSend: Math.floor(totalSend * 0.3),
      dismiss: Math.floor(totalSend * 0.1),
    },
    contractFunnel: {
      sendBtn: Math.floor(totalSend * 2),
      next: Math.floor(totalSend * 1.2),
      complete: Math.floor(totalSend * 0.3),
    },
    dailyTrend,
    // B2C Data
    b2cSummary: {
      pageInflow: b2cPageInflow,
      pageInflowChange: Math.floor(Math.random() * 25) - 5,
      couponGet: b2cCouponGet,
      couponGetChange: Math.floor(Math.random() * 30) - 5,
      reqReserve: b2cReqReserve,
      reqReserveChange: Math.floor(Math.random() * 20) - 10,
      conversionRate: b2cPageInflow ? Math.round((b2cReqReserve / b2cPageInflow) * 1000) / 10 : 0,
    },
    b2cCounselingPaths: {
      gnb: Math.floor(b2cReqReserve * 0.5),
      mid: Math.floor(b2cReqReserve * 0.3),
      low: b2cReqReserve - Math.floor(b2cReqReserve * 0.5) - Math.floor(b2cReqReserve * 0.3),
    },
    b2cTabs: {
      lease: Math.floor(b2cPageInflow * 0.6),
      buy: b2cPageInflow - Math.floor(b2cPageInflow * 0.6),
    },
    b2cFunnel: {
      detail: Math.floor(b2cPageInflow * 0.5),
      phone: Math.floor(b2cPageInflow * 0.35),
      get: b2cCouponGet,
    },
    b2cOther: {
      gnbCoupon: Math.floor(b2cPageInflow * 0.1),
      buyFee: Math.floor(b2cPageInflow * 0.05),
      androidDown: Math.floor(Math.random() * 20) + 5,
      appleDown: Math.floor(Math.random() * 15) + 3,
    }
  };
}

async function fetchEventCounts(startDate, endDate) {
  const eventNames = Object.values(EVENTS);
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: eventNames },
      },
    },
  });

  const counts = {};
  for (const row of response.rows || []) {
    counts[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value);
  }
  return counts;
}

async function fetchB2CEventCounts(startDate, endDate) {
  const eventNames = Object.values(B2C_EVENTS);
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                inListFilter: { values: eventNames },
              },
            },
            {
              filter: {
                fieldName: 'customEvent:service_name',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'himart',
                },
              },
            },
          ],
        },
      },
    });

    const counts = {};
    for (const row of response.rows || []) {
      counts[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value);
    }
    return counts;
  } catch (error) {
    console.warn(`Warning: B2C query with service_name filter failed for [${startDate} ~ ${endDate}]. Retrying without filter...`, error.message);
    try {
      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: eventNames },
          },
        },
      });

      const counts = {};
      for (const row of response.rows || []) {
        counts[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value);
      }
      return counts;
    } catch (fallbackError) {
      console.error('Error: Fallback B2C query also failed. Returning empty counts.', fallbackError.message);
      return {};
    }
  }
}

async function fetchDailyTrend(startDate, endDate) {
  const alimtalkEvents = [
    EVENTS.alimtalk_send_home,
    EVENTS.alimtalk_send_listing,
    EVENTS.alimtalk_send_contract,
  ];

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: alimtalkEvents },
      },
    },
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });

  const daily = {};
  for (const row of response.rows || []) {
    const date = row.dimensionValues[0].value;
    const count = parseInt(row.metricValues[0].value);
    daily[date] = (daily[date] || 0) + count;
  }
  return daily;
}

async function fetchDataForPeriod(N) {
  const currentStart = `${N}daysAgo`;
  const currentEnd = 'today';
  const prevStart = `${2 * N}daysAgo`;
  const prevEnd = `${N + 1}daysAgo`;

  const [c, p, daily, b2cC, b2cP] = await Promise.all([
    fetchEventCounts(currentStart, currentEnd),
    fetchEventCounts(prevStart, prevEnd),
    fetchDailyTrend(currentStart, currentEnd),
    fetchB2CEventCounts(currentStart, currentEnd),
    fetchB2CEventCounts(prevStart, prevEnd),
  ]);

  const E = EVENTS;
  const B2CE = B2C_EVENTS;

  // B2B Calculations
  const totalSend = (c[E.alimtalk_send_home] || 0) + (c[E.alimtalk_send_listing] || 0) + (c[E.alimtalk_send_contract] || 0);
  const prevTotalSend = (p[E.alimtalk_send_home] || 0) + (p[E.alimtalk_send_listing] || 0) + (p[E.alimtalk_send_contract] || 0);
  const pageInflow = (c[E.scroll] || 0);
  const prevPageInflow = (p[E.scroll] || 0);

  // B2C Calculations
  const b2cPageInflow = b2cC[B2CE.page_view] || 0;
  const prevB2cPageInflow = b2cP[B2CE.page_view] || 0;
  const b2cCouponGet = b2cC[B2CE.coupon_get] || 0;
  const prevB2cCouponGet = b2cP[B2CE.coupon_get] || 0;
  const b2cReqReserve = b2cC[B2CE.pop_reqReserveBtn] || 0;
  const prevB2cReqReserve = b2cP[B2CE.pop_reqReserveBtn] || 0;

  return {
    updatedAt: new Date().toISOString(),
    summary: {
      totalSend,
      totalSendChange: prevTotalSend ? Math.round(((totalSend - prevTotalSend) / prevTotalSend) * 100) : 0,
      pageInflow,
      pageInflowChange: prevPageInflow ? Math.round(((pageInflow - prevPageInflow) / prevPageInflow) * 100) : 0,
      conversionRate: pageInflow ? Math.round((totalSend / pageInflow) * 1000) / 10 : 0,
      bannerDismissRate: c[E.banner_detail]
        ? Math.round((c[E.banner_dismiss] / (c[E.banner_detail] + c[E.banner_dismiss])) * 1000) / 10
        : 0,
    },
    sendBySource: {
      home: c[E.alimtalk_send_home] || 0,
      listing: c[E.alimtalk_send_listing] || 0,
      contract: c[E.alimtalk_send_contract] || 0,
    },
    pageActions: {
      alimtalk: c[E.alimtalk_send_home] || 0,
      guide: (c[E.himart_guide] || 0) + (c[E.safecare_guide] || 0),
      external: (c[E.safecare_external] || 0) + (c[E.himartcare_external] || 0),
      store: c[E.store_view] || 0,
    },
    listingFunnel: {
      bannerClick: c[E.banner_detail] || 0,
      modalSend: c[E.alimtalk_send_listing] || 0,
      dismiss: c[E.banner_dismiss] || 0,
    },
    contractFunnel: {
      sendBtn: c[E.contract_send_btn] || 0,
      next: c[E.contract_next] || 0,
      complete: c[E.alimtalk_send_contract] || 0,
    },
    dailyTrend: daily,

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
      gnb: b2cC[B2CE.gnb_reqReserveBtn] || 0,
      mid: b2cC[B2CE.mid_reqReserveBtn] || 0,
      low: b2cC[B2CE.low_reqReserveBtn] || 0,
    },
    b2cTabs: {
      lease: b2cC[B2CE.lease_tab] || 0,
      buy: b2cC[B2CE.buy_tab] || 0,
    },
    b2cFunnel: {
      detail: b2cC[B2CE.coupon_detail] || 0,
      phone: b2cC[B2CE.coupon_phone] || 0,
      get: b2cCouponGet,
    },
    b2cOther: {
      gnbCoupon: b2cC[B2CE.gnb_couponBtn] || 0,
      buyFee: b2cC[B2CE.buy_fee] || 0,
      androidDown: b2cC[B2CE.android_down] || 0,
      appleDown: b2cC[B2CE.apple_down] || 0,
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  const periodArg = args[0] || 'all';

  console.log(`GA4 데이터 수집 시작 (인자: ${periodArg})...`);

  const periods = periodArg === 'all' ? [7, 14, 30, 90] : [parseInt(periodArg)];

  for (const period of periods) {
    if (isNaN(period)) {
      console.error(`올바르지 않은 기간 인자: ${period}`);
      continue;
    }

    console.log(`[${period}일] 데이터 생성 중...`);
    let data;

    if (client) {
      try {
        data = await fetchDataForPeriod(period);
      } catch (err) {
        console.error(`[${period}일] GA4 API 데이터 조회 실패. Mock 데이터로 대체합니다.`, err.message);
        data = generateMockDataForPeriod(period);
      }
    } else {
      data = generateMockDataForPeriod(period);
    }

    const outFilename = `data-${period}.json`;
    const outPath = path.join(__dirname, '..', 'public', outFilename);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`[${period}일] 데이터 저장 완료:`, outPath);

    // 30일짜리 데이터이거나 첫 번째로 처리하는 데이터인 경우 기본 data.json으로 복사
    if (period === 30 || periods.indexOf(period) === 0) {
      const defaultPath = path.join(__dirname, '..', 'public', 'data.json');
      fs.writeFileSync(defaultPath, JSON.stringify(data, null, 2));
      console.log(`[기본값] data.json 저장 완료 (복사본: ${outFilename})`);
    }
  }

  console.log('GA4 데이터 수집 및 갱신 프로세스 완료!');
}

main().catch(console.error);

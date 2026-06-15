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
let clientEmail = 'Unknown';
if (credentialsJson && propertyId) {
  try {
    const credentials = JSON.parse(credentialsJson);
    client = new BetaAnalyticsDataClient({ credentials });
    clientEmail = credentials.client_email || 'Unknown';
    console.log(`GA4 client initialized successfully for service account: ${clientEmail}`);
  } catch (err) {
    console.error('GA_CREDENTIALS parsing failed, running in Mock Mode.', err.message);
  }
}

function generateMockDataForPeriod(period) {
  const N = parseInt(period);
  const dailyEvents = {};
  const today = new Date();
  
  const allEventNames = [
    ...Object.values(EVENTS),
    ...Object.values(B2C_EVENTS)
  ];

  // 이전 기간을 포함하여 충분한 일별 데이터(2 * N일) 생성
  for (let i = N * 2; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}${mm}${dd}`;
    
    dailyEvents[key] = {};
    for (const name of allEventNames) {
      let count = 0;
      if (key === '20260612') {
        if (name === EVENTS.alimtalk_send_home) {
          count = 36;
        } else if (name === EVENTS.alimtalk_send_listing) {
          count = 15;
        } else if (name === EVENTS.alimtalk_send_contract) {
          count = 8;
        } else if (name === EVENTS.scroll) {
          count = 120; // B2B page inflow
        } else if (name === EVENTS.banner_detail) {
          count = 30;
        } else if (name === EVENTS.banner_dismiss) {
          count = 12; // 12 / (30 + 12) = 28.5% dismiss rate
        } else if (name === EVENTS.contract_send_btn) {
          count = 20;
        } else if (name === EVENTS.contract_next) {
          count = 15;
        } else if (name === B2C_EVENTS.page_view) {
          count = 200; // B2C page inflow
        } else if (name === B2C_EVENTS.coupon_get) {
          count = 25;
        } else if (name === B2C_EVENTS.pop_reqReserveBtn) {
          count = 12; // 12 / 200 = 6% conversion rate
        } else if (name === B2C_EVENTS.gnb_reqReserveBtn) {
          count = 4;
        } else if (name === B2C_EVENTS.mid_reqReserveBtn) {
          count = 5;
        } else if (name === B2C_EVENTS.low_reqReserveBtn) {
          count = 3;
        } else {
          count = Math.floor(Math.random() * 5);
        }
      } else {
        if (name === EVENTS.scroll || name === B2C_EVENTS.page_view) {
          count = Math.floor(Math.random() * 80) + 30;
        } else if (name === EVENTS.alimtalk_send_home || name === EVENTS.alimtalk_send_listing || name === EVENTS.alimtalk_send_contract) {
          count = Math.floor(Math.random() * 15) + 3;
        } else if (name === B2C_EVENTS.coupon_get || name === B2C_EVENTS.pop_reqReserveBtn) {
          count = Math.floor(Math.random() * 8) + 1;
        } else {
          count = Math.floor(Math.random() * 20);
        }
      }
      dailyEvents[key][name] = count;
    }
  }

  const c = {};
  const p = {};
  const dailyTrend = {};
  
  const dates = Object.keys(dailyEvents).sort();
  const currentDates = dates.slice(dates.length - N - 1);
  const prevDates = dates.slice(dates.length - 2 * N - 1, dates.length - N - 1);

  for (const name of allEventNames) {
    c[name] = 0;
    p[name] = 0;
  }

  for (const date of currentDates) {
    const events = dailyEvents[date] || {};
    for (const [name, count] of Object.entries(events)) {
      c[name] = (c[name] || 0) + count;
    }
    const sendCount = (events[EVENTS.alimtalk_send_home] || 0) + (events[EVENTS.alimtalk_send_listing] || 0) + (events[EVENTS.alimtalk_send_contract] || 0);
    dailyTrend[date] = sendCount;
  }

  for (const date of prevDates) {
    const events = dailyEvents[date] || {};
    for (const [name, count] of Object.entries(events)) {
      p[name] = (p[name] || 0) + count;
    }
  }

  const dailyHourly = {};
  for (const date of dates) {
    dailyHourly[date] = {};
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      dailyHourly[date][hStr] = 0;
    }
    if (date === '20260612') {
      const distribution = {
        "09": 5, "10": 8, "11": 10, "12": 3, "13": 4,
        "14": 7, "15": 8, "16": 6, "17": 5, "18": 3
      };
      for (const [hStr, val] of Object.entries(distribution)) {
        dailyHourly[date][hStr] = val;
      }
    } else {
      const events = dailyEvents[date] || {};
      const home = events[EVENTS.alimtalk_send_home] || 0;
      const listing = events[EVENTS.alimtalk_send_listing] || 0;
      const contract = events[EVENTS.alimtalk_send_contract] || 0;
      let totalForDay = home + listing + contract;
      while (totalForDay > 0) {
        const h = Math.floor(Math.random() * 10) + 9;
        const hStr = String(h).padStart(2, '0');
        dailyHourly[date][hStr] = (dailyHourly[date][hStr] || 0) + 1;
        totalForDay--;
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
    updatedAt: new Date().toISOString(),
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
    dailyHourly,
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

async function fetchDailyHourlyTrend(startDate, endDate) {
  const alimtalkEvents = [
    EVENTS.alimtalk_send_home,
    EVENTS.alimtalk_send_listing,
    EVENTS.alimtalk_send_contract,
  ];

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }, { name: 'hour' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: alimtalkEvents },
      },
    },
  });

  const dailyHourly = {};
  for (const row of response.rows || []) {
    const date = row.dimensionValues[0].value;
    const hour = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);
    if (!dailyHourly[date]) dailyHourly[date] = {};
    dailyHourly[date][hour] = (dailyHourly[date][hour] || 0) + count;
  }
  return dailyHourly;
}

async function fetchDailyEvents(startDate, endDate) {
  const b2bNames = Object.values(EVENTS);
  const b2cNames = Object.values(B2C_EVENTS);
  
  const [b2bResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: b2bNames },
      },
    },
  });

  let b2cRows = [];
  try {
    const [b2cResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                inListFilter: { values: b2cNames },
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
    b2cRows = b2cResponse.rows || [];
  } catch (error) {
    console.warn(`Warning: B2C daily query with service_name filter failed. Retrying without filter...`, error.message);
    try {
      const [b2cResponse] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: b2cNames },
          },
        },
      });
      b2cRows = b2cResponse.rows || [];
    } catch (fallbackError) {
      console.error('Error: Fallback B2C daily query failed.', fallbackError.message);
    }
  }

  const daily = {};
  for (const row of b2bResponse.rows || []) {
    const date = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);
    if (!daily[date]) daily[date] = {};
    daily[date][eventName] = (daily[date][eventName] || 0) + count;
  }
  for (const row of b2cRows) {
    const date = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);
    if (!daily[date]) daily[date] = {};
    daily[date][eventName] = (daily[date][eventName] || 0) + count;
  }

  return daily;
}

async function fetchDataForPeriod(N) {
  const currentStart = `${N}daysAgo`;
  const currentEnd = 'today';
  const prevStart = `${2 * N}daysAgo`;
  const prevEnd = `${N + 1}daysAgo`;

  const [c, p, daily, b2cC, b2cP, dailyEvents, dailyHourly] = await Promise.all([
    fetchEventCounts(currentStart, currentEnd),
    fetchEventCounts(prevStart, prevEnd),
    fetchDailyTrend(currentStart, currentEnd),
    fetchB2CEventCounts(currentStart, currentEnd),
    fetchB2CEventCounts(prevStart, prevEnd),
    fetchDailyEvents(prevStart, currentEnd),
    fetchDailyHourlyTrend(prevStart, currentEnd),
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
    dailyEvents: dailyEvents,
    dailyHourly: dailyHourly,

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
        console.warn(`[도움말] PERMISSION_DENIED 에러인 경우, GA4 속성(속성 ID: ${propertyId}) 관리자 페이지에서 서비스 계정 이메일(${clientEmail})을 '뷰어(Viewer)' 권한으로 등록해주시기 바랍니다.`);
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

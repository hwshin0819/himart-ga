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

// GA start date: June 13, 2026
const DATA_START_DATE = '20260613';

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

function calculateUserCount(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  const ratio = 0.6 + Math.random() * 0.3; // 60% to 90%
  const users = Math.round(count * ratio);
  return Math.max(1, Math.min(count, users));
}

/**
 * Generate fully random mock data (no hardcoded dates).
 * All data starts from DATA_START_DATE (June 13, 2026).
 */
function generateMockDataForPeriod(period) {
  const N = parseInt(period);
  const dailyEvents = {};
  const today = new Date();

  const allEventNames = [
    ...Object.values(EVENTS),
    ...Object.values(B2C_EVENTS)
  ];

  // Generate 2*N days of history for previous-period comparison
  for (let i = N * 2; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}${mm}${dd}`;

    // Skip any dates before June 13, 2026 (data is incomplete before this)
    if (key < DATA_START_DATE) continue;

    dailyEvents[key] = {};

    for (const name of allEventNames) {
      let count = 0;

      // Random counts - no hardcoded date-specific values
      if (name === EVENTS.scroll || name === B2C_EVENTS.page_view) {
        count = Math.floor(Math.random() * 80) + 100;
      } else if (
        name === EVENTS.alimtalk_send_home ||
        name === EVENTS.alimtalk_send_listing
      ) {
        count = Math.floor(Math.random() * 10) + 5;
      } else if (name === EVENTS.alimtalk_send_contract) {
        // 계약관리 알림톡 발송은 낮을 수 있음 (실제 GA4에서도 적은 수치)
        count = Math.floor(Math.random() * 5);
      } else if (
        name === B2C_EVENTS.coupon_get ||
        name === B2C_EVENTS.pop_reqReserveBtn
      ) {
        count = Math.floor(Math.random() * 8) + 1;
      } else {
        count = Math.floor(Math.random() * 20);
      }

      dailyEvents[key][name] = count;
      dailyEvents[key][name + '_user'] = calculateUserCount(count);
    }

    // 데이터 정합성 보정: 퍼널 순서 유지
    const homeSend = dailyEvents[key][EVENTS.alimtalk_send_home] || 0;
    const listingSend = dailyEvents[key][EVENTS.alimtalk_send_listing] || 0;
    const contractSend = dailyEvents[key][EVENTS.alimtalk_send_contract] || 0;

    // 1. 매물 배너 클릭(노출)은 모달 발송보다 항상 크게
    if ((dailyEvents[key][EVENTS.banner_detail] || 0) <= listingSend) {
      dailyEvents[key][EVENTS.banner_detail] = listingSend + Math.floor(Math.random() * 20) + 20;
      dailyEvents[key][EVENTS.banner_detail + '_user'] = calculateUserCount(dailyEvents[key][EVENTS.banner_detail]);
    }

    // 2. 계약관리: 발송버튼(1단계) > 다음(2단계) > 발송완료(3단계)
    if ((dailyEvents[key][EVENTS.contract_next] || 0) <= contractSend) {
      dailyEvents[key][EVENTS.contract_next] = contractSend + Math.floor(Math.random() * 5) + 3;
      dailyEvents[key][EVENTS.contract_next + '_user'] = calculateUserCount(dailyEvents[key][EVENTS.contract_next]);
    }
    if ((dailyEvents[key][EVENTS.contract_send_btn] || 0) <= dailyEvents[key][EVENTS.contract_next]) {
      dailyEvents[key][EVENTS.contract_send_btn] = dailyEvents[key][EVENTS.contract_next] + Math.floor(Math.random() * 5) + 5;
      dailyEvents[key][EVENTS.contract_send_btn + '_user'] = calculateUserCount(dailyEvents[key][EVENTS.contract_send_btn]);
    }

    // 3. 제휴페이지 방문(스크롤)은 알림톡 발송보다 크게
    if ((dailyEvents[key][EVENTS.scroll] || 0) <= homeSend) {
      dailyEvents[key][EVENTS.scroll] = homeSend + Math.floor(Math.random() * 30) + 50;
      dailyEvents[key][EVENTS.scroll + '_user'] = calculateUserCount(dailyEvents[key][EVENTS.scroll]);
    }

    // 4. B2C 쿠폰 퍼널: 알아보기 > 인증번호전송 > 쿠폰받기
    const cGet = dailyEvents[key][B2C_EVENTS.coupon_get] || 0;
    if ((dailyEvents[key][B2C_EVENTS.coupon_phone] || 0) <= cGet) {
      dailyEvents[key][B2C_EVENTS.coupon_phone] = cGet + Math.floor(Math.random() * 5) + 5;
      dailyEvents[key][B2C_EVENTS.coupon_phone + '_user'] = calculateUserCount(dailyEvents[key][B2C_EVENTS.coupon_phone]);
    }
    if ((dailyEvents[key][B2C_EVENTS.coupon_detail] || 0) <= dailyEvents[key][B2C_EVENTS.coupon_phone]) {
      dailyEvents[key][B2C_EVENTS.coupon_detail] = dailyEvents[key][B2C_EVENTS.coupon_phone] + Math.floor(Math.random() * 10) + 10;
      dailyEvents[key][B2C_EVENTS.coupon_detail + '_user'] = calculateUserCount(dailyEvents[key][B2C_EVENTS.coupon_detail]);
    }
  }

  const c = {};
  const p = {};
  const dailyTrend = {};

  const dates = Object.keys(dailyEvents).sort();
  const currentDates = dates.slice(Math.max(0, dates.length - N));
  const prevDates = dates.slice(Math.max(0, dates.length - N * 2), Math.max(0, dates.length - N));

  const allNamesWithUsers = [];
  for (const name of allEventNames) {
    allNamesWithUsers.push(name);
    allNamesWithUsers.push(name + '_user');
  }

  for (const name of allNamesWithUsers) {
    c[name] = 0;
    p[name] = 0;
  }

  for (const date of currentDates) {
    const events = dailyEvents[date] || {};
    for (const [name, count] of Object.entries(events)) {
      c[name] = (c[name] || 0) + count;
    }
    const sendCount =
      (events[EVENTS.alimtalk_send_home] || 0) +
      (events[EVENTS.alimtalk_send_listing] || 0) +
      (events[EVENTS.alimtalk_send_contract] || 0);
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
      dailyHourly[date][hStr + '_user'] = 0;
    }
    // Distribute daily alimtalk sends across business hours (9~18)
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
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      const cnt = dailyHourly[date][hStr];
      dailyHourly[date][hStr + '_user'] = calculateUserCount(cnt);
    }
  }

  const totalSend =
    (c[EVENTS.alimtalk_send_home] || 0) +
    (c[EVENTS.alimtalk_send_listing] || 0) +
    (c[EVENTS.alimtalk_send_contract] || 0);
  const prevTotalSend =
    (p[EVENTS.alimtalk_send_home] || 0) +
    (p[EVENTS.alimtalk_send_listing] || 0) +
    (p[EVENTS.alimtalk_send_contract] || 0);
  const pageInflow = c[EVENTS.scroll] || 0;
  const prevPageInflow = p[EVENTS.scroll] || 0;

  const b2cPageInflow = c[B2C_EVENTS.page_view] || 0;
  const prevB2cPageInflow = p[B2C_EVENTS.page_view] || 0;
  const b2cCouponGet = c[B2C_EVENTS.coupon_get] || 0;
  const prevB2cCouponGet = p[B2C_EVENTS.coupon_get] || 0;
  const b2cReqReserve = c[B2C_EVENTS.pop_reqReserveBtn] || 0;
  const prevB2cReqReserve = p[B2C_EVENTS.pop_reqReserveBtn] || 0;

  return {
    updatedAt: new Date().toISOString(),
    period: N,
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
      home_user: c[EVENTS.alimtalk_send_home + '_user'] || 0,
      listing: c[EVENTS.alimtalk_send_listing] || 0,
      listing_user: c[EVENTS.alimtalk_send_listing + '_user'] || 0,
      contract: c[EVENTS.alimtalk_send_contract] || 0,
      contract_user: c[EVENTS.alimtalk_send_contract + '_user'] || 0,
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
      pageInflowChange: prevB2cPageInflow
        ? Math.round(((b2cPageInflow - prevB2cPageInflow) / prevB2cPageInflow) * 100)
        : 0,
      couponGet: b2cCouponGet,
      couponGetChange: prevB2cCouponGet
        ? Math.round(((b2cCouponGet - prevB2cCouponGet) / prevB2cCouponGet) * 100)
        : 0,
      reqReserve: b2cReqReserve,
      reqReserveChange: prevB2cReqReserve
        ? Math.round(((b2cReqReserve - prevB2cReqReserve) / prevB2cReqReserve) * 100)
        : 0,
      conversionRate: b2cPageInflow
        ? Math.round((b2cReqReserve / b2cPageInflow) * 1000) / 10
        : 0,
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
    },
  };
}

async function fetchEventCounts(startDate, endDate) {
  const eventNames = Object.values(EVENTS);
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: eventNames },
      },
    },
  });

  const counts = {};
  for (const row of response.rows || []) {
    const eventName = row.dimensionValues[0].value;
    counts[eventName] = parseInt(row.metricValues[0].value);
    counts[eventName + '_user'] = parseInt(row.metricValues[1].value);
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
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
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
      const eventName = row.dimensionValues[0].value;
      counts[eventName] = parseInt(row.metricValues[0].value);
      counts[eventName + '_user'] = parseInt(row.metricValues[1].value);
    }
    return counts;
  } catch (error) {
    console.warn(
      `Warning: B2C query with service_name filter failed for [${startDate} ~ ${endDate}]. Retrying without filter...`,
      error.message
    );
    try {
      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: eventNames },
          },
        },
      });

      const counts = {};
      for (const row of response.rows || []) {
        const eventName = row.dimensionValues[0].value;
        counts[eventName] = parseInt(row.metricValues[0].value);
        counts[eventName + '_user'] = parseInt(row.metricValues[1].value);
      }
      return counts;
    } catch (fallbackError) {
      console.error(
        'Error: Fallback B2C query also failed. Returning empty counts.',
        fallbackError.message
      );
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
    // Exclude any data before June 13
    if (date < DATA_START_DATE) continue;
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
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
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
    if (date < DATA_START_DATE) continue;
    const hour = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);
    const users = parseInt(row.metricValues[1].value);
    if (!dailyHourly[date]) dailyHourly[date] = {};
    dailyHourly[date][hour] = (dailyHourly[date][hour] || 0) + count;
    dailyHourly[date][hour + '_user'] = (dailyHourly[date][hour + '_user'] || 0) + users;
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
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
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
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
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
    console.warn(
      'Warning: B2C daily query with service_name filter failed. Retrying without filter...',
      error.message
    );
    try {
      const [b2cResponse] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
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
    if (date < DATA_START_DATE) continue;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);
    const users = parseInt(row.metricValues[1].value);
    if (!daily[date]) daily[date] = {};
    daily[date][eventName] = (daily[date][eventName] || 0) + count;
    daily[date][eventName + '_user'] = (daily[date][eventName + '_user'] || 0) + users;
  }
  for (const row of b2cRows) {
    const date = row.dimensionValues[0].value;
    if (date < DATA_START_DATE) continue;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);
    const users = parseInt(row.metricValues[1].value);
    if (!daily[date]) daily[date] = {};
    daily[date][eventName] = (daily[date][eventName] || 0) + count;
    daily[date][eventName + '_user'] = (daily[date][eventName + '_user'] || 0) + users;
  }

  return daily;
}

function resolveStartDate(N) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - N + 1);
  const limit = new Date(2026, 5, 13); // June 13, 2026
  return start < limit ? limit : start;
}

function formatDateYmd(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchDataForPeriod(N) {
  const today = new Date();
  const currentStartDate = resolveStartDate(N);
  const currentEndDate = today;

  const diffTime = Math.abs(currentEndDate - currentStartDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prevEndDate = new Date(currentStartDate);
  prevEndDate.setDate(currentStartDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevEndDate.getDate() - diffDays + 1);

  const limit = new Date(2026, 5, 13);
  const safePrevStartDate = prevStartDate < limit ? limit : prevStartDate;
  const safePrevEndDate = prevEndDate < limit ? limit : prevEndDate;

  const currentStart = formatDateYmd(currentStartDate);
  const currentEnd = formatDateYmd(currentEndDate);
  const prevStart = formatDateYmd(safePrevStartDate);
  const prevEnd = formatDateYmd(safePrevEndDate);

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
  const totalSend =
    (c[E.alimtalk_send_home] || 0) +
    (c[E.alimtalk_send_listing] || 0) +
    (c[E.alimtalk_send_contract] || 0);
  const prevTotalSend =
    (p[E.alimtalk_send_home] || 0) +
    (p[E.alimtalk_send_listing] || 0) +
    (p[E.alimtalk_send_contract] || 0);
  const pageInflow = c[E.scroll] || 0;
  const prevPageInflow = p[E.scroll] || 0;

  // B2C Calculations
  const b2cPageInflow = b2cC[B2CE.page_view] || 0;
  const prevB2cPageInflow = b2cP[B2CE.page_view] || 0;
  const b2cCouponGet = b2cC[B2CE.coupon_get] || 0;
  const prevB2cCouponGet = b2cP[B2CE.coupon_get] || 0;
  const b2cReqReserve = b2cC[B2CE.pop_reqReserveBtn] || 0;
  const prevB2cReqReserve = b2cP[B2CE.pop_reqReserveBtn] || 0;

  return {
    updatedAt: new Date().toISOString(),
    period: N,
    summary: {
      totalSend,
      totalSendChange: prevTotalSend
        ? Math.round(((totalSend - prevTotalSend) / prevTotalSend) * 100)
        : 0,
      pageInflow,
      pageInflowChange: prevPageInflow
        ? Math.round(((pageInflow - prevPageInflow) / prevPageInflow) * 100)
        : 0,
      conversionRate: pageInflow ? Math.round((totalSend / pageInflow) * 1000) / 10 : 0,
      bannerDismissRate: c[E.banner_detail]
        ? Math.round(
            (c[E.banner_dismiss] / (c[E.banner_detail] + c[E.banner_dismiss])) * 1000
          ) / 10
        : 0,
    },
    sendBySource: {
      home: c[E.alimtalk_send_home] || 0,
      home_user: c[E.alimtalk_send_home + '_user'] || 0,
      listing: c[E.alimtalk_send_listing] || 0,
      listing_user: c[E.alimtalk_send_listing + '_user'] || 0,
      contract: c[E.alimtalk_send_contract] || 0,
      contract_user: c[E.alimtalk_send_contract + '_user'] || 0,
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
      pageInflowChange: prevB2cPageInflow
        ? Math.round(((b2cPageInflow - prevB2cPageInflow) / prevB2cPageInflow) * 100)
        : 0,
      couponGet: b2cCouponGet,
      couponGetChange: prevB2cCouponGet
        ? Math.round(((b2cCouponGet - prevB2cCouponGet) / prevB2cCouponGet) * 100)
        : 0,
      reqReserve: b2cReqReserve,
      reqReserveChange: prevB2cReqReserve
        ? Math.round(((b2cReqReserve - prevB2cReqReserve) / prevB2cReqReserve) * 100)
        : 0,
      conversionRate: b2cPageInflow
        ? Math.round((b2cReqReserve / b2cPageInflow) * 1000) / 10
        : 0,
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
    },
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
        console.error(
          `[${period}일] GA4 API 데이터 조회 실패. Mock 데이터로 대체합니다.`,
          err.message
        );
        console.warn(
          `[도움말] PERMISSION_DENIED 에러인 경우, GA4 속성(속성 ID: ${propertyId}) 관리자 페이지에서 서비스 계정 이메일(${clientEmail})을 '뷰어(Viewer)' 권한으로 등록해주시기 바랍니다.`
        );
        data = generateMockDataForPeriod(period);
      }
    } else {
      data = generateMockDataForPeriod(period);
    }

    // Output file names follow the pattern: data-7d.json, data-14d.json, etc.
    const outFilename = `data-${period}d.json`;
    const outPath = path.join(__dirname, '..', 'public', outFilename);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`[${period}일] 데이터 저장 완료:`, outPath);
  }

  console.log('GA4 데이터 수집 및 갱신 프로세스 완료!');
}

main().catch(console.error);

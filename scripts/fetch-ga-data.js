const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');
const path = require('path');

const credentials = JSON.parse(process.env.GA_CREDENTIALS);
const propertyId = process.env.GA_PROPERTY_ID;

const client = new BetaAnalyticsDataClient({ credentials });

const EVENTS = {
  himart_guide: 'GTM_login_collaboration_himart_himartguide_detail',
  safecare_guide: 'GTM_login_collaboration_himart_safecareguide_detail',
  alimtalk_send_home: 'GTM_login_collaboration_himart_alimtalk_send',
  safecare_external: 'GTM_login_collaboration_himart_safecare_external',
  himartcare_external: 'GTM_login_collaboration_himart_himartcare_external',
  store_view: 'GTM_login_collaboration_himart_store',
  scroll: 'GTM_login_collaboration_himart_scroll',
  banner_detail: 'GTM_login_main_offeings_ad_list_banner_himart_detail',
  banner_dismiss: 'GTM_login_main_offeings_ad_list_banner_himart_dismiss',
  modal_detail: 'GTM_login_main_offeings_ad_list_modal_himart_detail',
  alimtalk_send_listing: 'GTM_login_main_offeings_ad_list_modal_himart_alimtalk_send',
  contract_send_btn: 'GTM_login_main_contract_list_himart_benefit_send',
  contract_next: 'GTM_login_main_contract_list_himart_benefit_target_select_next',
  alimtalk_send_contract: 'GTM_login_main_contract_list_himart_benefit_alimtalk_send',
};

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

async function fetchPrevEventCounts() {
  return fetchEventCounts('60daysAgo', '31daysAgo');
}

async function main() {
  console.log('GA4 데이터 수집 시작...');

  const [current, prev, daily] = await Promise.all([
    fetchEventCounts('30daysAgo', 'today'),
    fetchPrevEventCounts(),
    fetchDailyTrend('30daysAgo', 'today'),
  ]);

  const c = current;
  const p = prev;
  const E = EVENTS;

  const totalSend = (c[E.alimtalk_send_home] || 0) + (c[E.alimtalk_send_listing] || 0) + (c[E.alimtalk_send_contract] || 0);
  const prevTotalSend = (p[E.alimtalk_send_home] || 0) + (p[E.alimtalk_send_listing] || 0) + (p[E.alimtalk_send_contract] || 0);
  const pageInflow = (c[E.scroll] || 0);
  const prevPageInflow = (p[E.scroll] || 0);

  const data = {
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
  };

  const outPath = path.join(__dirname, '..', 'public', 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('데이터 저장 완료:', outPath);
  console.log('총 발송:', totalSend);
}

main().catch(console.error);

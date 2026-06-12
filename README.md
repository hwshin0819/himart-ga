# 하이마트 제휴 대시보드

GA4 데이터를 기반으로 하이마트 제휴 알림톡 발송 현황을 시각화하는 대시보드입니다.

## 구조

- **GitHub Actions**: 매일 오전 10시(KST) GA4 Data API 호출 → `public/data.json` 생성
- **React**: `data.json`을 읽어 대시보드 렌더링
- **GitHub Pages**: 정적 사이트 배포

## 필요한 Secrets

| 이름 | 설명 |
|------|------|
| `GA_CREDENTIALS` | Google 서비스 계정 JSON 키 전체 내용 |
| `GA_PROPERTY_ID` | GA4 속성 ID (숫자만, 예: 322311477) |

## 수동 데이터 갱신

GitHub → Actions → "GA4 Data Fetch & Deploy" → "Run workflow"

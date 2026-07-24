// 이력서 데이터 (단일 소스) — 내용만 여기서 바꾸면 웹/‑추후 PDF 모두 갱신
import snsGateway from '../assets/sns-gateway-compact.png'

export default {
  name: `김종환`,
  role: `Backend Developer`,
  summary: `의료 SaaS 백엔드 · NestJS / Go · 이벤트 드리븐 MSA`,
  quote: `프로그래밍은 가치를 창출하는 수단이라고 생각합니다. 피자 한 조각을 만드는 개발자보다, 피자 한 판을 만들어 팔 줄 아는 개발자가 되고 싶습니다. 반복되는 문제를 더 나은 방식으로 바꾸는 일에 재미를 느낍니다.`,
  contacts: [
    { icon: ``, label: `jongdeug2021@gmail.com`, href: `mailto:jongdeug2021@gmail.com` },
    { icon: ``, label: `GitHub`, href: `https://github.com/JongDeug` },
    { icon: ``, label: `Blog`, href: `https://jongdeug.duckdns.org/blog/@jongdeug` },
    { icon: ``, label: `군필`, href: null },
  ],

  about: [
    {
      title: `의료 SaaS 백엔드`,
      sub: `병원·요양기관 대상 의료 소프트웨어 개발·운영 (2025.03 ~ 재직 중)`,
      items: [
        { k: `비용 절감`, v: `여러 SNS 채널을 하나의 병원용 메신저로 묶는 옴니채널 구축. 외부 SaaS(Respond.io) 대신 SNS 통합 게이트웨이 자체 구축. 월 최대 약 196만 원(2만 MAC 기준) 운영비 절감` },
        { k: `장애 해결`, v: `표면이 아니라 근본 원인까지 추적. 수년간 방치되던 간헐적 강제 로그아웃을 종결하고, 청구·정산 데이터 정합성 버그(금액 계산·중복 집계 등)도 다수 바로잡음.` },
        { k: `쿼리 최적화`, v: `월말 결산·입원 청구 등 무거운 집계 쿼리를 상관 서브쿼리 재작성 등으로 개선. (결산 1분+ → 2초, 입원 보험집계 30초 → 5초)` },
        { k: `자동화`, v: `DB 오류 감지·데이터 모니터링 슬랙 봇을 구축해 반복 업무를 시스템화하고 팀 효율을 높임.` },
      ],
    },
    {
      title: `기록하고 공유하는 개발자`,
      sub: null,
      items: [
        { k: null, v: `PARA(Project·Area·Resource·Archive) 지식관리 체계를 사내 컨퍼런스에서 발표.` },
        { k: null, v: `사내 챗봇 RAG를 직접 개발·발표해 1등 팀 선정 → 개인 기록을 의사결정에 활용하는 개인용 RAG 서비스로 발전.` },
      ],
    },
  ],

  skills: [
    { k: `Languages`, items: [`TypeScript`, `Go`] },
    { k: `Framework`, items: [`NestJS`, `Express`, `Gin`] },
    { k: `Messaging`, items: [`NATS`, `RabbitMQ`] },
    { k: `DB / ORM`, items: [`MySQL`, `MariaDB`, `Redis`, `Prisma`, `TypeORM`] },
    { k: `Frontend`, items: [`HTML`, `CSS`, `SvelteKit`, `React`] },
    { k: `Tooling / DevOps`, items: [`Docker`, `Docker-Compose`, `Harbor`, `Git`, `GitHub Actions`, `Vim`, `tmux`] },
  ],

  projectsNote: `2025.03 ~ 재직 중`,
  projects: [
    {
      title: `병원용 메신저 플랫폼`,
      badge: `B2B 백엔드`,
      stack: [`Go`, `NATS`, `MariaDB`, `Redis`, `KrakenD`, `WebSocket`],
      items: [
        { k: `배경`, v: `신규 사업으로 출범한 Go·NATS 이벤트 드리븐 MSA에 합류. 서비스 간 비동기 통신(NATS)과 실시간 WebSocket을 함께 다루는 환경이며, 실제 병원 현장에 출시돼 의료진이 매일 쓰는 메신저로 운영 중.` },
        { k: `기여`, v: `WebSocket 실시간 연결·그룹 멘션·SNS 옴니채널 연동 등 도메인 기능을 이벤트 드리븐 아키텍처와 NATS 메시지 브로커 위에서 구현.` },
        { k: `설계 개선`, v: `NATS 구조 재설계를 제안. 기존 '연결당 consumer' 방식이 동시접속이 늘수록 consumer·메모리 부하로 확장성에 한계가 있다고 판단해, '인스턴스당 consumer 1개 + 메모리 fan-out + subject 라우팅' 구조를 제안했고 재설계안이 채택됨.` },
        { k: `배포`, v: `GitHub 셀프 호스트 러너를 구축해 테스트 환경에서 CI/CD 파이프라인을 자체 구축.` },
      ],
      sub: [
        {
          title: `외부 SNS 채널 7종 통합 연동 게이트웨이`,
          badge: null,
          stack: [`NestJS`, `TypeScript`, `MariaDB`, `Prisma`, `NATS`, `Docker`],
          figure: snsGateway,
          figureAlt: `SNS 채널 7종(카카오·Meta·LINE·WeChat 외) → Integration Gateway(webhook 수집·정규화·팩토리 패턴) → NATS → 병원용 통합 인박스 흐름도`,
          items: [
            { k: `문제`, v: `여러 SNS 채널(Kakao·Meta·LINE·WeChat 등)로 인입되는 고객 메시지를 하나의 병원용 메신저 플랫폼에서 처리해야 했고, 초기 구조는 외부 SaaS(Respond.io)에 의존.` },
            { k: `결정`, v: `각 SNS 공식 문서를 수집해 API 및 공통 DTO 설계.` },
            { k: `임팩트`, v: `회사 부담 운영비 월 최대 약 196만 원(2만 MAC 기준) → 0원 (카카오 제외).` },
            { k: `설계`, v: `webhook 수집 → 표준 이벤트 정규화 → NATS 전파로 이어지는 중계 게이트웨이 구조 설계.` },
            { k: `구현`, v: `연동 채널이 늘어남에 따라 팩토리 패턴을 도입해 신규 채널을 기존 코드 수정 없이 추가하는 구조(OCP)로 구현. Meta 앱 검수 후 OAuth 채널 인증도 구현.` },
            { k: `개선`, v: `병목 지점을 AI와 함께 분석해 캐싱·timeout 적용. 다중 인스턴스를 위한 서버 간 NATS 통신 적용.` },
          ],
        },
      ],
    },
    {
      title: `한방 진료 차트(EMR) 서비스 운영·고도화`,
      badge: null,
      stack: [`Node.js(Koa)`, `TypeScript`, `MariaDB`, `RabbitMQ`, `PM2`],
      items: [
        { k: `세션 강제 로그아웃 종결`, v: `수년간 재현이 어려워 방치되던 간헐적 강제 로그아웃. 세션 생존을 RabbitMQ 큐 존재 여부로만 판단해, 네트워크가 잠깐 끊기면 곧 세션 종료로 처리하던 게 원인이었음. API 활동 시 갱신되는 lastAccessTime 가드로 해결 — 종결 후 재발 문의 없음. (해결 과정에서 정리한 RabbitMQ + STOMP 이벤트 구조는 사내 세미나로 발표)` },
        { k: `쿼리 성능 최적화`, v: `1분 넘게 걸리던 월말 결산·입원 청구 쿼리를 EXISTS 상관 서브쿼리에서 UNION ALL로 재작성해 2초로 단축. 입원 보험집계 쿼리도 인덱스·구조 개선으로 30초 → 5초.` },
        {
          k: `교부번호 동시성 (MC-7863)`,
          v: `로컬에서 검증한 해법이 운영 인프라(분산 DB)에선 통하지 않을 수 있음을 배운 트러블슈팅`,
          italic: true,
          sub: [
            `동시 저장 시 교부번호가 중복·NaN 발급되는 race condition 발견`,
            `채번을 백엔드로 이관하고 SELECT ... FOR UPDATE 기반으로 직렬화하여 로컬 환경에서 해결`,
            `운영과 동일한 Galera 클러스터 테스트 환경에 적용했을 때 기대대로 동작하지 않아 변경을 롤백(revert)`,
            `현재 인프라에선 비관적 락이 맞지 않다고 판단`,
            `이후 동시성·락 설계 시 운영 인프라 특성을 먼저 검증하는 관점을 갖게 됨`,
          ],
        },
        { k: `운영·장애 대응`, v: `약 700건의 운영 이슈를 직접 처리하며 실서비스 디버깅·장애 대응 역량을 쌓음.` },
      ],
    },
    {
      title: `사내 CS 응대`,
      badge: `Internal Product`,
      stack: [`NestJS`, `TypeScript`, `TypeORM`, `Redis`, `WebSocket`, `Nginx`, `Docker`],
      items: [
        { k: `문제`, v: `동작하지 않는 기능이 누적된 노후 레거시 CS 시스템. 내선 전화 수·발신 중계도 레거시 호환 문제로 미동작 상태였음.` },
        { k: `결정`, v: `사내 CS팀이 매일 쓰는 시스템을 짧은 기간에 신규 스택(NestJS)으로 마이그레이션. 향후 사용 확대를 대비해 다중 서버 수평 확장을 염두에 두고 Redis로 세션·상태를 공유하도록 설계. 내선 전화 중계 서버(NASCA)를 연동해 전화 수·발신 중계 기능을 신규 개발.` },
        { k: `결과`, v: `하루 약 300통의 전화 응대를 버그 없이 처리하고, 미동작하던 웹 발신 기능을 정상화해 CS팀 만족도 확보. ISMS 취약점 대응(권한 우회 차단 · 개인정보 마스킹 · 세션 재사용 차단)까지 수행.` },
      ],
    },
    {
      title: `Chaos — AI를 활용한 세컨 브레인`,
      badge: `개인 프로젝트`,
      stack: [`홈 라즈베리파이 운영`, `Express`, `PostgreSQL(pgvector)`, `React`],
      items: [
        { k: `문제`, v: `단어 일치 검색으로는 과거에 기록한 생각을 '의미'로 다시 찾기 어려웠음.` },
        { k: `결정`, v: `모든 기록을 임베딩해 의미가 가까우면 걸리는 벡터 검색으로 구현(PostgreSQL pgvector). MCP 서버로 Claude Code에 직접 연결.` },
        { k: `결과`, v: `개발 중 떠오른 생각·플로우차트를 적재·검색하는 흐름을 일상에 녹임. 라즈베리파이에서 직접 운영.` },
      ],
    },
  ],

  education: [
    { school: `국립금오공과대학교`, period: `2021.03 – 2024.08`, desc: `컴퓨터소프트웨어공학과 졸업 · 학점 3.63` },
    { school: `경운대학교`, period: `2017.03 – 2020.12`, desc: `항공소프트웨어공학과 수료 · 학점 4.2` },
  ],
  certs: [
    `2024.07 · 토익스피킹 140 / IH`,
    `2023.12 · 리눅스마스터 2급`,
    `2023.10 · SQLD`,
    `2023.09 · 정보처리기사`,
  ],

  cover: {
    title: `실패에서 배운 태도`,
    paragraphs: [
      { text: `2020년 팬데믹으로 증시가 폭락하던 때, 여러 금융 기업이 블록체인 서비스를 테스트한다는 신호를 보고 투자를 시작했습니다. 인내 끝에 큰 수익을 얻었지만, 거기서 멈추지 않고 더 욕심을 내다 하락장과 맞물려 원금으로 돌아오는 큰 실패를 맛봤습니다.` },
      { text: `힘든 시간이었지만, 돌아보니 이 실패가 제게 남긴 건 돈에 대한 교훈뿐만 아니라 삶을 대하는 태도였습니다. 그 시간을 버티며 끊임없이 사색했고, 세 가지 교훈을 얻었습니다.` },
      { strong: `1. 우리는 마음에 집어넣은 것으로 세상을 경험한다`, text: `"안 된다"는 생각에 사로잡히면 정말 안 됩니다. 무너진 상황을 부정적으로만 보지 않고 마음부터 다시 세우는 법, 스트레스를 다스리고 여유를 가지는 법을 배웠습니다.` },
      { strong: `2. 겸손`, text: `"성공이 성공이 아니고 실패가 실패가 아니다"라는 말을 그제야 이해했습니다. 어떤 결과도 영원하지 않기에, 잘될 때 들뜨지 않고 안될 때 크게 낙담하지 않는 법을 배웠습니다.` },
      { strong: `3. 한 번에 되는 건 없다`, text: `빠르고 쉽게 얻으려 한 순간 모든 게 무너졌습니다. 그래서 삶의 방식을 바꿨습니다. 완벽하지 않아도 "지금 할 수 있는 것"에 집중하고 매일 반복하는 것. 운동도 2년째 그렇게 해오며, 작은 꾸준함이 실력이 된다는 걸 깨닫고 있는 중입니다.` },
      { text: `이런 교훈들이 지금 일하는 방식의 바탕이 되었습니다. 하고자 하는 일에 진심을 다하고, 막힐 때도 '지금 할 수 있는 것'부터 하나씩 해내려고 합니다. 앞으로도 맡은 서비스를 안정적으로 책임지는 개발자가 되겠습니다.`, quote: true },
    ],
  },
}

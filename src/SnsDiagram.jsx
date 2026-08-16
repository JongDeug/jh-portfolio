// SNS 통합 게이트웨이 다이어그램 — PNG 대신 HTML/CSS (색인 문법, 인쇄에도 선명)
// 채널 7종은 Starfruit 실제 지원 목록(home.starfruit.chat) 기준.
import {
  siKakaotalk,
  siInstagram,
  siFacebook,
  siWhatsapp,
  siWechat,
  siNaver,
  siLine,
} from 'simple-icons'

const CHANNELS = [
  ['카카오톡', siKakaotalk],
  ['인스타그램', siInstagram],
  ['페이스북', siFacebook],
  ['왓츠앱', siWhatsapp],
  ['위챗', siWechat],
  ['네이버 톡톡', siNaver],
  ['라인', siLine],
]

const STEPS = [
  { n: '01', t: 'Webhook 수집', d: '채널별 인입 이벤트 수신' },
  { n: '02', t: '표준 이벤트 정규화', d: '공통 DTO로 변환' },
  { n: '03', t: '팩토리 패턴 · OCP', d: '기존 코드 수정 없이 채널 추가' },
]

const INBOX = ['상담사 한 화면 · 전 채널 응대', '담당자 배정 · 답변 · 이력 관리', '다국어 번역 상담']

export default function SnsDiagram() {
  return (
    <div className="dg" role="img" aria-label="SNS 채널 7종이 Integration Gateway를 거쳐 NATS로 Starfruit 통합 인박스에 전달되는 흐름도">
      <div className="dg-bar">
        <span>SNS INTEGRATION GATEWAY</span>
        <span>FLOW</span>
      </div>

      <div className="dg-cols">
        {/* 채널 */}
        <div className="dg-col">
          <p className="dg-h">CHANNELS ×7</p>
          <ul className="dg-list dg-ch">
            {CHANNELS.map(([name, ic]) => (
              <li key={name}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={ic.path} />
                </svg>
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="dg-arrow" aria-hidden="true">
          <span className="dg-arrow-lab">WEBHOOK</span>→
        </div>

        {/* 게이트웨이 */}
        <div className="dg-col dg-col-main">
          <p className="dg-h">
            GATEWAY <small>NestJS · TypeScript</small>
          </p>
          <ol className="dg-steps">
            {STEPS.map((s) => (
              <li key={s.n}>
                <b className="n">{s.n}</b>
                <span>
                  <b>{s.t}</b>
                  <small>{s.d}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="dg-arrow" aria-hidden="true">
          <span className="dg-arrow-lab dg-red">NATS</span>→
        </div>

        {/* 인박스 */}
        <div className="dg-col">
          <p className="dg-h">
            INBOX <small>Starfruit</small>
          </p>
          <ul className="dg-list">
            {INBOX.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dg-foot">회사 부담 운영비 월 최대 약 196만 원 → 0원 (외부 SaaS 대체, 카카오 제외)</div>
    </div>
  )
}

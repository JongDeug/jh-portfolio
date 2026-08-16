---
title: "My Pi Stack: 라즈베리파이 하나로 만든 개인 인프라"
slug: my-pi-stack-라즈베리파이-하나로-만든-개인-인프라
date: 2026-06-16
summary: "라즈베리파이 한 대에 올린 개인 인프라를 현재 구조 기준으로 다시 정리했습니다. nginx·DuckDNS 공개 경로와 Tailscale VPN·방화벽 프라이빗 경로, 텔레그램 게이트웨이→Claude Code 흐름, chaos·Nextcloud까지 한 장의 구조도로."
tags: [라즈베리파이, 인프라, 셀프호스팅, Tailscale, 보안]
---

## 들어가기에 앞서

집에 **Raspberry Pi 한 대**를 두고, 그 위에 제가 쓰는 서비스들을 올려 두었습니다.

텔레그램 봇, 세컨드브레인 ‘카오스’, 옵시디언, 셀프호스팅 클라우드, 그리고 그 사이를 잇는 **Claude Code 에이전트**까지 한 대에 얹었습니다.

이 글은 Pi 위에서 지금 무엇이 어떻게 돌아가고 있는지를 정리해 둔 기록입니다. (한 번에 설계한 게 아니라 계속 갈아엎으며 바뀌어 온 터라, 이번에 현재 상태 기준으로 다시 정리했습니다.)

---

## 전체 흐름

크게 **두 갈래의 입구**가 있습니다. 바깥(인터넷)에서는 nginx의 **80/443만** 열어 두고, 그 외 관리 접근은 전부 **Tailscale VPN**으로만 들어옵니다. 그렇게 Pi 안으로 들어온 요청이 **사용자 → Telegram → 게이트웨이 → Claude Code → 유저별 워크스페이스** 순으로 흐릅니다.

아래는 지금 돌아가는 구조를 그린 그림입니다.

<div style="margin:24px 0;font-family:'Inter','Noto Sans KR',sans-serif;">

<!-- ── 네트워크 경계(엣지): 공개 경로 vs 프라이빗 VPN ── -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
  <!-- 공개 경로 -->
  <div style="border:1.5px solid rgba(6,182,212,0.25);border-radius:14px;padding:14px;background:linear-gradient(135deg,rgba(6,182,212,0.06),rgba(6,182,212,0.02));">
    <div style="font-size:10px;font-weight:700;color:#06b6d4;letter-spacing:1px;margin-bottom:10px;">
      <i class="fa-solid fa-globe" style="margin-right:4px;"></i>PUBLIC · 인터넷
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;">
      <div style="font-weight:600;">방문자 / 브라우저</div>
      <i class="fa-solid fa-arrow-down" style="color:#6b7280;"></i>
      <div style="width:100%;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:8px;text-align:center;color:#ef4444;font-weight:600;">
        <i class="fa-solid fa-shield-halved"></i> Firewall (ufw) · 80 / 443만 개방
      </div>
      <i class="fa-solid fa-arrow-down" style="color:#6b7280;"></i>
      <div style="width:100%;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:8px;text-align:center;font-weight:600;">
        nginx · TLS 종단
        <div style="font-size:10px;color:#8b949e;font-weight:500;margin-top:2px;">Let’s Encrypt + DuckDNS</div>
      </div>
    </div>
  </div>
  <!-- 프라이빗 경로 -->
  <div style="border:1.5px solid rgba(124,58,237,0.25);border-radius:14px;padding:14px;background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(124,58,237,0.02));">
    <div style="font-size:10px;font-weight:700;color:#7c3aed;letter-spacing:1px;margin-bottom:10px;">
      <i class="fa-solid fa-lock" style="margin-right:4px;"></i>PRIVATE · Tailscale VPN
    </div>
    <div style="display:flex;justify-content:center;gap:6px;margin-bottom:6px;font-size:18px;color:#7c3aed;">
      <i class="fa-solid fa-mobile-screen" title="iPhone"></i>
      <i class="fa-solid fa-laptop" title="MacBook"></i>
      <i class="fa-solid fa-desktop" title="Desktop"></i>
    </div>
    <div style="text-align:center;font-size:11px;color:#8b949e;margin-bottom:6px;">iPhone · MacBook · Desktop</div>
    <div style="text-align:center;color:#6b7280;"><i class="fa-solid fa-arrows-up-down"></i></div>
    <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);border-radius:8px;padding:8px;text-align:center;color:#7c3aed;font-weight:600;font-size:12px;margin-top:6px;">
      WireGuard 메시 · SSH / 관리 전용
      <div style="font-size:10px;color:#8b949e;font-weight:500;margin-top:2px;">공개 포트 없이 접근</div>
    </div>
  </div>
</div>

<!-- 두 경로 → Pi -->
<div style="text-align:center;color:#6b7280;margin:2px 0;"><i class="fa-solid fa-arrow-down"></i></div>
<div style="text-align:center;background:linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.03));border:1.5px solid rgba(34,197,94,0.3);border-radius:12px;padding:10px;font-weight:700;color:#22c55e;margin-bottom:18px;">
  <i class="fa-brands fa-raspberry-pi"></i> Raspberry Pi · 단일 호스트
</div>

<!-- ── 요청 흐름(세로) ── -->
<div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:18px;">
  <div style="width:170px;background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(124,58,237,0.03));border:1.5px solid rgba(124,58,237,0.2);border-radius:14px;padding:14px;text-align:center;">
    <i class="fa-solid fa-user" style="font-size:18px;color:#7c3aed;"></i>
    <div style="font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:1px;margin-top:4px;">USER</div>
    <div style="font-size:12px;font-weight:600;">jongdeug / 0deug</div>
  </div>
  <div style="color:#6b7280;"><i class="fa-solid fa-arrow-down"></i></div>
  <div style="width:170px;background:linear-gradient(135deg,rgba(6,182,212,0.08),rgba(6,182,212,0.03));border:1.5px solid rgba(6,182,212,0.2);border-radius:14px;padding:14px;text-align:center;">
    <i class="fa-brands fa-telegram" style="font-size:20px;color:#06b6d4;"></i>
    <div style="font-size:11px;font-weight:700;color:#06b6d4;letter-spacing:1px;margin-top:4px;">TELEGRAM</div>
    <div style="font-size:12px;font-weight:600;">Bot API</div>
  </div>
  <div style="color:#6b7280;"><i class="fa-solid fa-arrow-down"></i></div>
  <div style="width:230px;background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(249,115,22,0.03));border:1.5px solid rgba(249,115,22,0.25);border-radius:14px;padding:14px;text-align:center;">
    <i class="fa-solid fa-diagram-project" style="font-size:18px;color:#f97316;"></i>
    <div style="font-size:11px;font-weight:700;color:#f97316;letter-spacing:1px;margin-top:4px;">GATEWAY</div>
    <div style="font-size:12px;font-weight:600;">claude-telegram-gateway</div>
    <div style="font-size:10px;color:#8b949e;margin-top:2px;">유저별 라우팅</div>
  </div>
  <div style="color:#6b7280;"><i class="fa-solid fa-arrow-down"></i></div>
  <div style="width:230px;background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(249,115,22,0.03));border:1.5px solid rgba(249,115,22,0.25);border-radius:14px;padding:14px;text-align:center;">
    <i class="fa-solid fa-robot" style="font-size:18px;color:#f97316;"></i>
    <div style="font-size:11px;font-weight:700;color:#f97316;letter-spacing:1px;margin-top:4px;">CLAUDE CODE</div>
    <div style="font-size:12px;font-weight:600;">AI Agent</div>
  </div>
  <div style="color:#6b7280;"><i class="fa-solid fa-arrow-down"></i></div>
  <!-- 워크스페이스 2개 -->
  <div style="display:flex;gap:8px;width:100%;max-width:440px;">
    <div style="flex:1;background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(124,58,237,0.02));border:1.5px solid rgba(124,58,237,0.15);border-radius:12px;padding:10px;text-align:center;color:#7c3aed;">
      <div style="font-size:11px;font-weight:700;margin-bottom:6px;">jongdeug workspace</div>
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px;padding:6px;font-size:10px;color:#22c55e;font-weight:600;">
        <i class="fa-brands fa-docker"></i> Obsidian (Docker)
      </div>
      <div style="font-size:10px;color:#8b949e;margin-top:4px;">+ Nextcloud 동기화</div>
    </div>
    <div style="flex:1;background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(124,58,237,0.02));border:1.5px solid rgba(124,58,237,0.15);border-radius:12px;padding:10px;text-align:center;color:#7c3aed;">
      <div style="font-size:11px;font-weight:700;margin-bottom:6px;">0deug workspace</div>
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px;padding:6px;font-size:10px;color:#22c55e;font-weight:600;">
        <i class="fa-brands fa-docker"></i> Obsidian (Docker)
      </div>
      <div style="font-size:10px;color:#8b949e;margin-top:4px;">+ Nextcloud 동기화</div>
    </div>
  </div>
</div>

<!-- ── 서비스 그리드 ── -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;padding:16px;border:1.5px dashed rgba(34,197,94,0.25);border-radius:14px;background:rgba(34,197,94,0.02);">
  <div style="font-size:10px;font-weight:700;color:#22c55e;letter-spacing:1px;grid-column:1/-1;margin-bottom:6px;">
    <i class="fa-solid fa-server" style="margin-right:4px;"></i>SERVICES · on Pi
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">nginx</div>
    <div style="font-size:10px;color:#8b949e;">HTTPS + Reverse Proxy</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">Tailscale</div>
    <div style="font-size:10px;color:#8b949e;">VPN 메시 (관리 접근)</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">ufw</div>
    <div style="font-size:10px;color:#8b949e;">방화벽 (80/443만)</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">Let’s Encrypt + DuckDNS</div>
    <div style="font-size:10px;color:#8b949e;">TLS 인증서 · 동적 DNS</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">chaos</div>
    <div style="font-size:10px;color:#8b949e;">API + PostgreSQL 16 (pgvector)</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">Nextcloud</div>
    <div style="font-size:10px;color:#8b949e;">셀프호스팅 클라우드 (PG17 + Redis)</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">Docker</div>
    <div style="font-size:10px;color:#8b949e;">유저별 서비스 격리</div>
  </div>
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;">
    <div style="font-weight:600;margin-bottom:2px;">Cron Jobs</div>
    <div style="font-size:10px;color:#8b949e;">상태 수집 · PG 백업 · 모닝브리프</div>
  </div>
</div>
</div>

핸드폰에서 텔레그램으로 메시지를 보내면, Pi 안의 **claude-telegram-gateway**가 그 메시지를 받아 유저별 워크스페이스로 라우팅하고, 거기서 **Claude Code**가 실행됩니다.

각 워크스페이스 안에서 **옵시디언은 유저별 Docker 컨테이너**로 띄워 두었습니다. vault는 **Nextcloud**로 핸드폰·데스크톱과 맞춰 주고요. 덕분에 유저마다 환경이 깔끔하게 분리됩니다.

---

## 각 워크스페이스 구성

워크스페이스는 유저별로 **같은 뼈대**를 깔아 두었습니다. 워크스페이스 자체는 Pi 호스트 파일 시스템 위에 올라가 있고, 그중 **옵시디언만 Docker 컨테이너**로 띄워 유저별로 격리한 구조입니다.

Claude Code가 세션을 시작할 때 아래 파일들을 순서대로 읽으면서 "자기가 누구인지"와 "어떻게 일해야 하는지"를 로드합니다.

```
workspace/
├── CLAUDE.md        # 세션 시작 진입점, 읽을 파일 순서 지정
├── IDENTITY.md      # 에이전트 이름, 호출 규칙
├── SOUL.md          # 가치관, 일하는 태도
├── USER.md          # 유저 컨텍스트
├── AGENTS.md        # 운영 규칙, 그룹 채팅 가이드
├── TOOLS.md         # 쓸 수 있는 도구·스킬 인덱스
├── HEARTBEAT.md     # 장기 진행 작업 추적
├── memory/          # 날짜별 기록 (YYYY-MM-DD.md)
├── obsidian/        # 옵시디언 vault (Docker 옵시디언이 마운트, Nextcloud로 동기화)
├── scripts/         # 자동화 스크립트
└── logs/            # 크론·봇 로그
```

진입점은 **`CLAUDE.md`**입니다. 세션이 시작되면 이 파일이 먼저 로드되고, 페르소나(IDENTITY/SOUL)와 유저 컨텍스트(USER), 운영 규칙(AGENTS), 단기 기억(memory/)을 **레이어로 분리**해 두었습니다.

---

## 서비스 카탈로그

서비스 전체는 위 구조도에 있고, 여기서는 그중 **손이 제일 많이 간 다섯 개**만 한 줄로 정리했습니다.

### 1. nginx

**모든 외부 트래픽의 입구**. HTTPS 종단과 경로별 리버스 프록시를 맡습니다. 인증서는 Let’s Encrypt, 도메인은 DuckDNS 동적 DNS로 붙여 두었습니다.

### 2. Tailscale + 방화벽

**바깥에 굳이 열지 않는 것들의 통로**. 방화벽(ufw)으로 공개 포트를 80/443으로 막아 두고, SSH나 관리용 접근은 Tailscale **WireGuard 메시 VPN**으로만 들어옵니다. 핸드폰·맥북·데스크톱이 Pi와 같은 사설망에 묶여 있어, 포트를 인터넷에 노출하지 않고도 어디서든 붙을 수 있습니다.

### 3. chaos

**제 세컨드브레인이자 이 블로그의 엔진**. Node API + PostgreSQL 16(pgvector) 한 쌍으로, 지식 기록과 시맨틱 검색, 운동·캘린더·인사이트까지 묶여 있습니다. 지금 읽고 계신 이 글도 chaos가 정적 HTML로 구워 내보냅니다.

### 4. Nextcloud

**셀프호스팅 클라우드**. 예전엔 Syncthing으로 옵시디언 vault만 맞췄는데, 지금은 Nextcloud(PostgreSQL 17 + Redis)로 파일 동기화를 통합했습니다.

### 5. Docker

**유저별 격리용**. 옵시디언을 비롯한 서비스를 컨테이너로 띄워 vault·환경이 서로 섞이지 않게 했습니다.

---

## 시행착오: OpenClaw → Claude Code

### 문제 직면

처음에는 **OpenClaw**로 개인 AI 비서를 세팅해 봤습니다.

쓰는 도중 Claude Code 쪽에서 third-party 기능을 막는 변화가 있었고, 제가 설계했던 흐름이 그대로 움직이지 않게 됐습니다.

### 문제 해결

결국 OpenClaw를 빼고 **Claude Code 기본 기능 + 직접 만든 텔레그램 게이트웨이** 조합으로 갈아탔습니다. 텔레그램 수신·유저별 라우팅·페르소나 주입을 게이트웨이가 맡고, 실제 작업은 Claude Code가 합니다.

돌이켜 보면 한 레일로 통일한 덕분에 디버깅할 지점이 줄었습니다. 이중 레이어를 걷어 낸 게 결과적으로 정답이었습니다.

---

## 지금의 상태

아직 완성된 건 아닙니다.

필요한 것을 하나씩 얹으면서 제 인프라를 채워 가는 중입니다. 그사이 Syncthing이 Nextcloud로 바뀌고, 흩어져 있던 대시보드가 chaos 한 곳으로 모이고, 보안은 Tailscale로 정리되는 식으로 계속 모양이 달라졌습니다.

텔레그램 메시지 한 줄로 Pi 위의 서비스들을 움직이게 해 두는 과정 자체가, 저에게는 꽤 재미있는 작업이기도 합니다.

한 번에 설계한 스택이 아니라 **시도의 결과물**입니다. 앞으로도 필요에 따라 하나씩 더 얹어 갈 생각입니다!!

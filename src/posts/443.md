---
title: "443 하나에 서버 여러 대를 어떻게 붙이지"
slug: 443-하나에-서버-여러-대를-어떻게-붙이지
date: 2026-06-16
summary: "공인 IP 하나 · 포트 443 하나에 어떻게 내부 개발 서버 여러 대가 붙어 돌아가는지 — 방화벽 NAT 와 nginx L7 라우팅의 역할 분담."
tags: [nginx, 인프라, 네트워킹, 방화벽]
---

회사 인프라를 들여다보다가 **"공인 IP 하나 · 포트 443 하나인데, 어떻게 내부 개발 서버 여러 대가 도메인별로 붙어 돌아가지?"** 가 궁금해졌습니다. 포트로만 따지면 "포트 하나 = 서비스 하나" 여야 할 것 같은데, 실제로는 수십 개 서비스가 같은 443 으로 들어와서 각자 자기 서버로 잘 갈라졌습니다.

---

## 답: 두 레이어의 역할 분담

방화벽과 nginx 가 서로 다른 레이어에서 일을 나눠 맡고 있었습니다.

<div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin: 24px 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; line-height: 1.6;">
  <div style="display: grid; gap: 12px;">
    <div style="border: 1px dashed var(--border); border-radius: 10px; padding: 12px 14px;">
      <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">외부 클라이언트</div>
      <div><code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">https://*.example.com</code> → 공인 IP:443</div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 18px;">↓</div>
    <div style="border: 2px solid var(--accent); border-radius: 10px; padding: 12px 14px;">
      <div style="color: var(--accent); font-weight: 600; font-size: 14px;">① 방화벽 (Zyxel 등)</div>
      <div style="color: var(--text-muted); font-size: 12px; margin: 4px 0;">Layer 3/4 · 포트 포워딩만</div>
      <div>공인 443 → 내부 nginx 서버:443</div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 18px;">↓</div>
    <div style="border: 2px solid var(--accent); border-radius: 10px; padding: 12px 14px; background: var(--accent-bg);">
      <div style="color: var(--accent); font-weight: 600; font-size: 14px;">② 공통 nginx 서버</div>
      <div style="color: var(--text-muted); font-size: 12px; margin: 4px 0;">Layer 7 · SNI + Host 헤더로 분기</div>
      <div><code style="background: var(--bg); padding: 2px 6px; border-radius: 4px;">server_name</code> 매칭해서 백엔드 선택</div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 18px;">↓</div>
    <div style="display: grid; gap: 8px;">
      <div style="border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;">
        <code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">gateway-dev.example.com</code> → 192.168.x.41:3001
      </div>
      <div style="border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;">
        <code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">api-dev.example.com</code> → 192.168.x.42:3002
      </div>
      <div style="border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;">
        <code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">admin-dev.example.com</code> → 192.168.x.43:3003
      </div>
    </div>
  </div>
</div>

---

## ① 방화벽은 포트만 본다 (L3/L4)

방화벽이 하는 일은 단순합니다. "공인 443 으로 들어온 패킷은 내부 nginx 서버:443 으로 NAT 해라" 딱 한 줄입니다. **도메인 이름은 모르고, 알 필요도 없습니다.** 포트/IP 레벨만 다루는 레이어니까요.

그래서 방화벽 설정은 건드릴 일이 거의 없습니다. 문을 한 번 열어두면 끝입니다.

---

## ② nginx 가 이름으로 가른다 (L7)

"포트 하나에 서버 여럿" 이 가능해지는 건 여기서부터입니다. HTTPS 요청은 포트 번호만 들고 오는 게 아니라 **도메인 이름** 을 두 군데에 싣고 옵니다.

- **SNI (Server Name Indication)** — TLS 핸드셰이크에서 평문으로 "내가 붙으려는 도메인은 X" 라고 먼저 알려줍니다. nginx 는 이걸 보고 어느 SSL 인증서를 쓸지 정합니다.
- **Host 헤더** — TLS 가 끝난 뒤 보내는 HTTP 요청에 `Host: X` 로 들어옵니다. nginx 는 이걸로 어느 `server { }` 블록을 쓸지 정합니다.

그래서 같은 443 으로 들어와도 도메인별로 갈라질 수 있습니다. 이게 **name-based virtual hosting**, 20년 넘은 웹서버 기본기입니다.

---

## 설정의 핵심

실제 nginx 블록은 이 두 덩어리의 반복입니다.

```nginx
upstream gateway_backend {
    server 192.168.x.41:3001;
}

server {
    listen 443 ssl;
    server_name gateway-dev.example.com;

    ssl_certificate      ssl/star.example.com.cert.pem;
    ssl_certificate_key  ssl/star.example.com.key.pem;

    location / {
        proxy_pass http://gateway_backend;
    }
}
```

- `server_name` — 이 블록이 어느 도메인 요청을 받을지
- `upstream` — 요청을 실제로 보낼 내부 서버
- `proxy_pass` — 둘을 이어주는 줄

새 서비스를 추가할 땐 방화벽은 그대로 두고 **nginx conf 에 이 블록 하나 더 얹고 DNS 에 A 레코드만 추가** 하면 끝납니다.

---

## DNS 전제

이 구조가 성립하려면 DNS 에서 **모든 하위 도메인이 같은 공인 IP 를 가리키고** 있어야 합니다.

- `*.example.com` 와일드카드 A 레코드
- 또는 각 서브도메인마다 같은 IP 로 A 레코드 개별 등록

그래야 `gateway-dev` / `api-dev` / `admin-dev` 가 전부 공인 IP 로 모이고, 포트도 전부 443 으로 모이고, 그 안에서 **이름만 달라서** nginx 에서 갈라질 수 있습니다.

---

## 디버깅 명령

```bash
# 도메인이 어떤 IP 로 풀리는지 확인 (DNS 단계 먼저)
nslookup gateway-dev.example.com
# 또는
dig +short gateway-dev.example.com

# 설정 문법 체크 (reload 전 필수)
sudo nginx -t

# 실제 요청이 어느 블록으로 매칭됐는지 실시간 확인
sudo tail -f /var/log/nginx/access.log
```

디버깅은 늘 **바깥에서 안쪽으로** 갑니다. 먼저 `nslookup` 으로 도메인이 공인 IP 로 잘 풀리는지 보고 (안 풀리면 nginx 가 아니라 DNS 문제입니다), 그다음 nginx 까지 패킷이 닿는지, 마지막으로 어느 `server { }` 블록에 매칭됐는지를 봅니다.

"이 도메인이 왜 엉뚱한 서버로 가지?" 싶을 땐 access.log 의 `$host` 와 실제 백엔드 응답을 비교하는 게 가장 빠릅니다.

---

## 정리

- 공인 IP·443 한 개 → 방화벽이 NAT → 내부 nginx → `server_name` 분기 → 각 개발 서버
- 방화벽(L3/L4) 과 nginx(L7) 가 서로 다른 레이어의 일을 함
- "포트 하나에 서버 여럿" 이 가능한 핵심 = HTTPS 가 SNI + Host 헤더로 도메인 이름을 같이 싣고 오는 덕분
- 서비스 추가는 nginx conf + DNS 두 곳만 건드리면 됨

---
title: "서버 인스턴스 둘로 늘리기 — 서버끼리 어떻게 통신하게 했나"
slug: 서버-인스턴스-둘로-늘리기-서버끼리-어떻게-통신하게-했나
date: 2026-06-16
summary: "게이트웨이 서버를 둘로 늘리면서, 외부 요청 받기 / 서버 간 req-reply / 서버 간 broadcast 세 층위의 통신 경로를 각자 다른 방식으로 설계한 기록."
tags: [인프라, nginx, nats, 메시지브로커, 분산]
---

게이트웨이 서버 하나로 버티던 구성을 **두 개**로 늘렸습니다. 장애 격리와 수평 확장의 기본 단계인데, 막상 들어가보니 진짜 설계가 필요한 지점은 배포 구성이 아니라 **"서버끼리 어떻게 얘기하느냐"** 였습니다.

인스턴스가 하나일 때는 고민할 필요가 없던 질문이 한 번에 셋 튀어나옵니다.

- 외부에서 들어온 요청을 **어느 인스턴스가 받을지**
- 서버끼리 주고받는 메시지를 **둘 중 하나만** 처리할지
- 어떤 이벤트는 **양쪽 다** 받아야 하는지

셋 다 "통신" 이지만 층위가 다르고 각자 다른 전략을 요구합니다. 이 글은 그 세 층위를 어떻게 나눠 설계했는지 적은 기록입니다.

---

## 전체 구조

<div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin: 24px 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; line-height: 1.6;">
  <div style="display: grid; gap: 12px;">
    <div style="border: 1px dashed var(--border); border-radius: 10px; padding: 12px 14px;">
      <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">외부 Webhook</div>
      <div>HTTPS → <code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">nginx:443</code></div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 18px;">↓ least_conn</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="border: 2px solid #7c3aed; border-radius: 10px; padding: 12px; background: var(--bg);">
        <div style="color: #7c3aed; font-weight: 600;">gateway-1</div>
        <div style="color: var(--text-muted); font-size: 12px;">:3001</div>
      </div>
      <div style="border: 2px solid #06b6d4; border-radius: 10px; padding: 12px; background: var(--bg);">
        <div style="color: #06b6d4; font-weight: 600;">gateway-2</div>
        <div style="color: var(--text-muted); font-size: 12px;">:3002</div>
      </div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 18px;">↕ NATS</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="border: 1px dashed var(--border); border-radius: 10px; padding: 10px 12px;">
        <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">req/reply</div>
        <div>queue group → 둘 중 하나만</div>
      </div>
      <div style="border: 1px dashed var(--border); border-radius: 10px; padding: 10px 12px;">
        <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">broadcast</div>
        <div>no group → 양쪽 모두</div>
      </div>
    </div>
  </div>
</div>

세 경로가 각자 다른 층에서, 다른 방식으로 분산됩니다.

---

## 1. 외부에서 들어오는 요청 — nginx `least_conn`

외부에서 들어오는 webhook 은 L7 에서 nginx 가 받습니다. 기존 upstream 블록을 **서버 둘**로 바꾸고 [`least_conn`](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#least_conn) 전략을 택했습니다.

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=10s;
}
```

> `least_conn` 은 **활성 연결 수가 적은 쪽**으로 요청을 보냅니다. 기본 `round_robin` 과 달리 한쪽이 느린 요청에 묶여 있을 때 자연스럽게 반대편으로 밀어줍니다. webhook 처리 시간 편차가 제법 있는 환경에 잘 맞습니다.

keepalive 는 일부러 뺐습니다. 같은 nginx 에서 WebSocket 업그레이드를 같이 처리 중이라 `Connection "upgrade"` 와 충돌할 여지가 있었고, 현재 트래픽 규모에서 체감 차이가 거의 없어서 **단순함을 택했습니다**.

이 층위는 "외부가 어느 인스턴스에 도달하느냐" 만 정할 뿐, 서버끼리의 통신은 여기서 시작되지 않습니다. 진짜 통신은 그 다음 두 층에서 일어납니다.

---

## 2. 서버끼리 req/reply — NATS queue group

내부 서비스끼리는 NATS 로 req/reply 를 주고받습니다. 여기서 **가장 조심해야 할 것**이 중복 수신입니다. 같은 요청을 인스턴스 두 개가 모두 받아서 각각 처리해버리면 외부 API 를 두 번 호출하는 식의 사고가 납니다.

다행히 NATS 는 이 문제를 [**queue group**](https://docs.nats.io/nats-concepts/core-nats/queue) 이라는 개념으로 이미 해결해둡니다.

> Queue group 에 속한 여러 구독자가 같은 subject 를 구독하면, 메시지는 **그 중 한 명에게만** 전달됩니다. 사실상 메시지 브로커 단에서 워커 풀을 만들어주는 구조입니다.

기존 코드에서 이미 queue group 을 쓰고 있었기 때문에 **추가 작업이 필요 없었습니다**. 인스턴스를 N 개로 늘려도 queue group 이 알아서 균등 분배합니다.

Kafka 의 consumer group 도 개념적으로는 비슷합니다. 다만 이 서비스의 트래픽 성격이 **짧은 req/reply 중심**이라 로그 보관·재처리가 강점인 Kafka 를 들일 이유가 약했습니다. NATS 는 연결 한 개로 pub/sub 과 req/reply 를 같이 쓸 수 있어서, 인프라 구성 요소를 하나 덜 두는 쪽으로 기울었습니다.

이 층에서 서버끼리의 통신은 "둘 중 하나만 받는다" 가 규칙입니다. 그런데 곧바로 **양쪽이 다 받아야 하는** 통신이 따로 필요해졌습니다.

---

## 3. 서버끼리 broadcast — 캐시 무효화 fan-out

### 왜 필요했나

인스턴스를 둘로 늘리자 눈에 잘 안 보이는 문제가 하나 생겼습니다. **인스턴스 로컬 메모리에 들고 있던 캐시**입니다.

각 인스턴스가 외부 자격증명 같은 값을 자기 프로세스 메모리에 5분 TTL 로 캐싱하고 있었는데, 이게 인스턴스별로 **완전히 독립**이었습니다. 한쪽이 DB 업데이트 후 자기 캐시만 지우면, 다른 쪽은 **최대 5분간 옛날 값**을 들고 다닙니다.

실제 시나리오에서 나오는 문제였습니다.

- 자격증명이 재발급됐는데 한쪽은 옛 토큰으로 요청 → 401 응답 → 메시지 유실
- 매핑이 삭제됐는데 한쪽은 살아있다고 판단 → 존재하지 않는 대상에 계속 호출

"둘 중 하나만 처리" 규칙이 여기선 오히려 독이 됩니다. **양쪽이 동시에 알아야** 합니다.

원래 쓰던 NATS 연결을 **그대로 재사용**해서 캐시 무효화 이벤트를 뿌리기로 했습니다.

```
Subject:  internal.cache.invalidate
Payload:  { key: string }
구독:     queue group 없이 subscribe → 모든 인스턴스가 수신 (fan-out)
```

### 흐름과 타임라인

![](/jh/media/af22189d-6fd8-46fb-b78c-16a6f00a5a99.svg)

실제 타임라인 로그도 같은 순서로 찍힙니다.

```
gateway-1  18:17:19.074  Cache invalidated: key=...          ← 로컬 del
gateway-1  18:17:19.075  Publishing invalidation event       ← NATS 발행
gateway-1  18:17:19.077  Cache invalidated via broadcast     ← self-receive (no-op)
gateway-2  18:17:19.077  Cache invalidated via broadcast     ← 다른 인스턴스 수신 후 del
```

**약 3ms 안에 양쪽 캐시가 같이 정리됩니다.** 5분 stale 문제가 사라졌습니다.

> payload 에 **자격증명 값 자체는 절대 싣지 않았습니다**. key 만 실어 보내고, 받은 쪽이 자기 캐시를 지우는 방식입니다. 브로커에 민감정보를 흘려보낼 이유가 없습니다.

### 장애 내성

- NATS 연결이 끊어져도 로컬 del 은 무조건 수행 → 자기 인스턴스는 즉시 정합
- broadcast 를 자기가 다시 수신해도 이미 del 한 키라 no-op
- 잘못된 payload 는 로그만 남기고 무시

---

## 돌아보니

인스턴스를 둘로 늘리는 일은 처음엔 "docker compose 에 블록 하나 더 붙이면 되겠지" 정도로 가볍게 봤습니다. 막상 들어가보니 본 문제는 배포 구성이 아니라 **서버끼리의 통신을 어떤 층위에서 어떻게 나누느냐** 였습니다.

- 외부가 어느 인스턴스에 도달하느냐 → nginx `least_conn`
- 서버끼리 **둘 중 하나만** 처리 → NATS queue group
- 서버끼리 **양쪽이 다 알아야 함** → NATS fan-out (queue group 없이 subscribe)

세 층위를 구분하고 나니 다음 인스턴스를 붙이는 작업은 compose 블록 하나 + nginx upstream 한 줄 추가 정도로 가벼워졌습니다.

---
title: "Docker 컨테이너에서 호스트 서비스 부르기"
slug: docker-컨테이너에서-호스트-서비스-부르기
date: 2026-06-16
summary: "Podman 환경에서 컨테이너가 호스트 서비스를 부르려고 박은 extra_hosts 한 줄의 의도와 동작 정리. A:B 포맷, host-gateway 치환, 네트워크 게이트웨이 IP 까지."
tags: [Docker, Podman, 네트워크, 트러블슈팅]
---

Podman 으로 띄운 백엔드 컨테이너가 호스트에서 돌고 있는 서비스를 호출해야 할 일이 있었습니다. 이때 compose 파일에 박은 한 줄이 정확히 뭘 하는지 정리한 글입니다.

```yaml
services:
  backend:
    extra_hosts:
      - "host.containers.internal:host-gateway"
    networks:
      - contact-center-network
```

이 한 줄(`extra_hosts`) 이 본 주제입니다. 다만 여기까지 닿으려면 컨테이너 네트워킹이 어떤 단계로 넓어지는지 한 번 훑고 가는 편이 이해가 빨라서, 그 흐름부터 짧게 정리한 뒤 본 주제로 들어갑니다.

흐름은 이렇게 갑니다:

1. **같은 compose 안 통신** — compose 가 알아서 해 줌
2. **다른 compose 끼리 통신** — 외부 네트워크 공유로 해결
3. **컨테이너 → 호스트 통신** — `extra_hosts` 가 등장하는 지점 (본 주제)

---

## 1. 같은 compose 안에서 네트워킹

compose 파일 하나에 여러 서비스를 정의해 두면 compose 가 자동으로 그 프로젝트 전용 네트워크(이름은 `<프로젝트명>_default`) 를 만들고 모든 서비스를 거기에 묶어 줍니다. **`networks:` 한 줄도 안 적어도 됩니다.** 그 안에서는 서비스 이름이 곧 호스트네임이 됩니다.

```yaml
services:
  backend:
    image: my-backend
  redis:
    image: redis:7-alpine
```

이 파일만 띄워도 `backend` 컨테이너에서 `redis://redis:6379` 가 바로 동작합니다. compose 의 내장 DNS 가 `redis` 라는 이름을 redis 컨테이너 IP 로 풀어 주기 때문입니다.

`networks:` 를 명시하는 건 어디까지나 옵션입니다 — 네트워크 이름을 직접 짓고 싶거나, 한 컨테이너를 여러 망에 동시에 붙이거나, 외부 네트워크를 가져다 쓸 때만 쓰면 됩니다.

---

## 2. 다른 compose 파일끼리 통신

문제는 **compose 파일을 둘로 나눠 띄우는 순간** 생깁니다. 각 compose 가 자기만의 `_default` 네트워크를 따로 만들기 때문에 서로 다른 망에 갇히고, 한쪽 컨테이너에서 다른쪽 서비스명을 불러도 DNS 가 안 잡힙니다.

해결은 외부에 공용 네트워크를 하나 만들어 두고 양쪽 compose 가 그 네트워크에 같이 붙는 것입니다. 단계별로 보면 이렇습니다.

**1단계 — 호스트에서 공용 네트워크를 만듭니다 (한 번만)**

```bash
docker network create shared-net
```

**2단계 — compose A 가 그 네트워크를 가져다 씁니다**

```yaml
# compose-a.yml
services:
  backend:
    image: my-backend
    networks:
      - shared-net

networks:
  shared-net:
    external: true   # 외부에 이미 있는 shared-net 을 가져다 쓰겠다는 의미
```

**3단계 — compose B 도 똑같이 가져다 씁니다**

```yaml
# compose-b.yml
services:
  worker:
    image: my-worker
    networks:
      - shared-net

networks:
  shared-net:
    external: true
```

**4단계 — 호출**

이제 `compose-b` 의 `worker` 컨테이너 안에서 그냥 서비스 이름으로 부르면 됩니다.

```bash
curl http://backend:3000/health
```

같은 `shared-net` 안에 들어와 있어서 Docker 내부 DNS 가 `backend` 라는 이름을 `compose-a` 의 backend 컨테이너 IP 로 풀어 줍니다.

> 같은 compose 안 통신은 그냥 `networks:` 한 줄로 끝나지만, **다른 compose 끼리는 "둘이 공유할 네트워크를 외부에 미리 만들고, 양쪽이 그걸 `external: true` 로 가져다 쓴다"** 가 핵심 차이입니다.

---

## 3. 컨테이너 → 호스트 통신 (extra_hosts)

여기서부터가 본 주제입니다. 1·2 단계는 컨테이너끼리의 통신이었고, 이제 컨테이너에서 **호스트 머신에서 직접 돌고 있는 서비스** (compose 바깥에 떠 있는 Postgres, ngrok, 디버거 등) 를 부르려는 상황입니다.

컨테이너 안에서 `localhost` 는 컨테이너 자기 자신이라 호스트에 안 닿습니다. 호스트의 IP 를 직접 박을 수도 있지만 환경마다 IP 가 달라서 하드코딩이 곤란합니다. 그래서 `host.containers.internal` 같은 고정 이름을 컨테이너 안에 박아두고 그 이름으로 부르도록 한 것이 처음에 보여 드린 그 한 줄입니다.

```yaml
extra_hosts:
  - "host.containers.internal:host-gateway"
```

---

### 한 줄이 실제로 하는 일

`extra_hosts` 는 컨테이너 안 `/etc/hosts` 에 "이름 → IP" 매핑을 직접 박는 기능입니다. `A:B` 포맷이고, A 는 컨테이너 안에서 쓸 이름, B 는 그 이름이 가리킬 IP 입니다.

오른쪽의 `host-gateway` 는 IP 자체가 아니라 Docker / Podman 이 이해하는 예약 키워드입니다. 컨테이너가 뜨는 순간 엔진이 이 키워드를 **컨테이너가 속한 네트워크의 게이트웨이 IP** 로 치환해서 `/etc/hosts` 에 적습니다.

```
# 컨테이너 안 /etc/hosts 결과
172.20.0.1  host.containers.internal
```

왼쪽 이름은 자유라서 `banana` 라고 써도 동작합니다. 진짜 일하는 건 `host-gateway` 쪽입니다.

---

### 왜 게이트웨이 IP 가 곧 호스트인가

호스트 PC 는 Docker 를 설치하는 순간 네트워크 인터페이스를 두 개 갖게 됩니다 — 물리 랜카드와 도커가 만든 가상 랜카드. 가상 랜카드의 IP (게이트웨이 자리에 호스트가 앉아 있음) 가 컨테이너 입장에서 호스트로 닿는 유일한 주소입니다.

<div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin: 24px 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; line-height: 1.6;">
  <div style="border: 2px solid var(--border); border-radius: 10px; padding: 16px; background: var(--bg);">
    <div style="color: var(--accent); font-weight: 600; margin-bottom: 12px; font-size: 14px;">호스트 PC</div>
    <div style="display: grid; gap: 10px;">
      <div style="border: 1px dashed var(--border); border-radius: 8px; padding: 10px;">
        <div style="color: var(--text-muted); font-size: 12px;">물리 랜카드 · eth0</div>
        <div><code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">192.168.0.5</code></div>
      </div>
      <div style="border: 1px dashed var(--accent); border-radius: 8px; padding: 10px; background: var(--accent-bg);">
        <div style="color: var(--text-muted); font-size: 12px;">가상 랜카드 · 도커 브리지</div>
        <div><code style="background: var(--bg); padding: 2px 6px; border-radius: 4px;">172.20.0.1</code> ← <strong>host-gateway</strong></div>
      </div>
    </div>
    <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--border);">
      <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">컨테이너 가상망</div>
      <div style="border: 1px solid var(--border); border-radius: 8px; padding: 10px;">
        <div style="color: var(--text-muted); font-size: 12px;">backend 컨테이너</div>
        <div><code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">172.20.0.3</code> → 호스트 부를 때 <code style="background: var(--accent-bg); padding: 2px 6px; border-radius: 4px;">172.20.0.1</code></div>
      </div>
    </div>
  </div>
</div>

치환되는 IP 는 컨테이너가 어떤 네트워크에 속해 있는지에 따라 달라집니다. 기본 브리지(`docker0`) 면 `172.17.0.1`, 커스텀 브리지면 그 망의 게이트웨이 (예: `172.20.0.1`) 입니다. 확인은 `docker network inspect <network-name>` 의 `Gateway` 값으로 합니다.

---

### Podman 과 Docker 동작 차이

같은 줄을 양쪽에서 쓸 수 있지만 기본 동작이 다릅니다.

- **Podman** — `host.containers.internal` 을 자동으로 `/etc/hosts` 에 박아 줍니다. 다만 rootless + 커스텀 네트워크 같은 조합에서 자동 주입이 빠지거나 IP 가 엉뚱하게 잡히는 경우가 있어, 명시적으로 `extra_hosts` 를 박아두는 게 안전합니다.
- **Docker 네이티브 (Linux)** — 자동 주입이 없습니다. `extra_hosts` 를 쓰지 않으면 `host.docker.internal` / `host.containers.internal` 이름 자체가 컨테이너 안에 존재하지 않습니다.
- **Docker Desktop (Mac, Windows)** — `host.docker.internal` 을 엔진이 자동으로 박아 줍니다.

---

## 덧붙임: networks 대신 network_mode

지금까지는 "컨테이너를 **어느 가상 네트워크에 붙일지**" 를 `networks:` 로 정하는 얘기였습니다. 그런데 compose 에는 한 레벨 더 위의 스위치가 있습니다 — `network_mode`. 이건 "컨테이너가 **네트워크 네임스페이스 자체를 어떻게 쓸지**" 를 정하는 옵션이라 결이 다릅니다.

```yaml
services:
  backend:
    image: my-backend
    network_mode: host
```

대표적인 값 몇 개:

- **`host`** — 호스트의 네트워크 네임스페이스를 그대로 공유. 컨테이너 안에서 `localhost:5432` 로 호스트 Postgres 가 그냥 잡힙니다. `extra_hosts` · `host-gateway` 조합이 필요 없어지는 지점입니다.
- **`service:<name>`** — 같은 compose 안의 다른 서비스와 네트워크 네임스페이스 공유. 사이드카 패턴 같은 데서 씁니다.
- **`container:<name>`** — 이미 떠 있는 임의의 컨테이너 네임스페이스에 올라탐.
- **`none`** — 네트워크 없음. 완전히 고립.

대신 제약이 붙습니다. `network_mode: host` 를 쓰면 같은 compose 의 `networks:` 설정은 그 컨테이너에 대해 무시되고, 포트 매핑(`ports:`) 도 의미를 잃습니다 (이미 호스트 포트를 그대로 쓰니까).

일반 브리지 모드와 대비하면 포트를 점유하는 방식 자체가 다릅니다.

- **브리지** — 컨테이너가 자기 가상 공간에 포트를 열고, `ports: "8080:3000"` 같은 배달 규칙으로 호스트 8080 과 이어줍니다. 호스트 포트는 도커가 예약해두는 느낌.
- **host 모드** — 컨테이너 코드가 `listen(3000)` 하는 순간 **호스트 PC 의 3000 번이 그대로 점유**됩니다. 호스트에서 이미 3000 을 쓰고 있으면 컨테이너가 안 뜨고 죽습니다.

그래서 주의할 지점 몇 개:

- **포트 충돌** — 호스트의 다른 프로세스와 정면 충돌 가능.
- **보안 경계 약화** — 컨테이너가 뚫리면 호스트 네트워크 전체가 훨씬 가까워짐. 격리 효과를 스스로 반납하는 선택.
- **플랫폼 차이** — 리눅스 Docker 에선 문자 그대로 "호스트 네임스페이스" 지만, **Docker Desktop (Mac/Windows) 은 내부적으로 VM 을 거쳐서 동작이 제한적이거나 다릅니다.** "내 PC 의 localhost" 와 동의어가 아닙니다.

그래서 이 글 주제인 "컨테이너 → 호스트 서비스 부르기" 는 두 갈래가 됩니다.

- 격리는 그대로 두고 호스트만 특정 이름으로 부르고 싶으면 → `extra_hosts: host.containers.internal:host-gateway`
- 아예 네트워크 경계를 걷어내고 호스트처럼 취급하고 싶으면 → `network_mode: host`

보통은 격리가 필요한 상황이 많아서 `extra_hosts` 쪽을 기본으로 두고, 네트워크 복잡도가 유난히 크거나 성능이 중요한 경우에 `network_mode: host` 로 내려가는 식으로 씁니다.

---

## 정리

- 의도 — 컨테이너에서 호스트 서비스를 환경 무관한 이름으로 부르기 위해 박은 한 줄
- `extra_hosts: "A:B"` — A 는 이름, B 는 IP. 컨테이너 `/etc/hosts` 에 그대로 박힘
- `host-gateway` — B 자리에 쓰는 예약 키워드. 컨테이너가 속한 네트워크의 게이트웨이 IP 로 치환됨
- 그 게이트웨이 IP = 호스트가 도커 가상망 안에서 갖는 주소 = 컨테이너에서 호스트로 닿는 유일한 길
- Podman 은 자동 주입, Docker 네이티브 Linux 는 직접 선언 필요

![](/jh/media/58f8b2c0-ca4f-44a9-838d-df9c19102ab0.png)

![](/jh/media/d679c71f-11fe-4924-9304-33e02fd71510.png)

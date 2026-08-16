---
title: "nginx 프록시 뒤에서 WebSocket과 secure 쿠키"
slug: nginx-프록시-뒤에서-websocket과-secure-쿠키
date: 2026-06-16
summary: "nginx에서 HTTPS를 종단하고 내부는 HTTP로 프록시하는 구조에서 secure 쿠키가 안 찍히던 문제와, WebSocket 프록시에 필요한 최소 설정."
tags: [nginx, WebSocket, NestJS, 세션, 트러블슈팅]
---

nginx로 HTTPS를 종단하고 내부 NestJS 컨테이너로 HTTP 프록시하는 구조에서 막혔던 지점 두 가지입니다. 핵심은 secure 쿠키 쪽이고, WebSocket은 같이 잡아 둔 메모입니다.

---

## secure 쿠키가 브라우저에 안 찍히는 문제

세션 쿠키를 `secure: true`로 내려 보냈는데, HTTPS로 접속해도 브라우저에 쿠키가 저장되지 않았습니다.

애플리케이션 입장에서는 들어오는 요청이 HTTP 로 보입니다. nginx 가 TLS 를 끊고 내부로는 `http://` 로 프록시하기 때문입니다. 프레임워크는 "HTTP 응답에 secure 쿠키를 넣을 수 없다"고 판단해 쿠키를 응답에서 떨어뜨립니다.

해결책은 프록시가 남긴 `X-Forwarded-Proto` 를 애플리케이션이 신뢰하게 만드는 것입니다. nginx 는 이미 넘기고 있으니 앱에서 받기만 하면 됩니다.

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

```ts
// 프록시가 남긴 X-Forwarded-Proto 를 신뢰 → secure 쿠키 판정이 정상화
if (nodeEnv === 'production') {
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
}
```

### 쿠키에는 sid 만 들어 있다

디버깅하다 잠깐 헷갈렸던 지점입니다. 브라우저 쿠키에는 세션 식별자(`sid`) 만 있고, 실제 세션 데이터는 서버 저장소(메모리, Redis 등) 에 있습니다. 쿠키를 디코딩해도 내용이 안 보이는 게 정상입니다.

---

## WebSocket 프록시에 필요한 세 줄

`/socket.io/` 는 일반 API 프록시 설정으론 핸드셰이크가 깨집니다. WebSocket 은 `Upgrade` 헤더로 TCP 연결을 양방향 소켓으로 전환하는데, nginx 기본값(HTTP/1.0, `Connection` 은 hop-by-hop 으로 끊김) 이 그 헤더를 다음 hop 으로 넘기지 않기 때문입니다.

```nginx
location /socket.io/ {
    proxy_pass http://backend-upstream;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

- `proxy_http_version 1.1` — `Upgrade` 는 HTTP/1.1 이상에서만 유효
- `Upgrade $http_upgrade` — 클라이언트의 `Upgrade: websocket` 을 백엔드까지 전달
- `Connection "upgrade"` — hop-by-hop 이라 nginx 에서 끊기므로 명시적으로 재설정

---

## 정리

- secure 쿠키: 내부는 HTTP → 앱이 HTTP 로 인식 → `trust proxy` 로 `X-Forwarded-Proto` 신뢰
- 세션 쿠키에 들어있는 건 `sid` 뿐, 실제 데이터는 서버 저장소
- WebSocket: `proxy_http_version 1.1` + `Upgrade`/`Connection` 세 줄이 핵심

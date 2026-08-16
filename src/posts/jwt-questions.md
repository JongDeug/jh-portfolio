---
title: "JWT에 대한 궁금증"
slug: jwt에-대한-궁금증
date: 2026-06-16
summary: "JWT 인증 구현 시 궁금했던 3가지. 세션 vs JWT, Refresh Token 저장 이유, 토큰 전달 방법."
tags: [인증, JWT, 백엔드]
---

## 문제 직면

개인 블로그 서비스에서 JWT(Json Web Token)로 인증 기능을 구현했습니다.
구현하면서 크게 세 가지가 궁금했습니다.

1. Session ID 방식보다 JWT 방식이 선호되는 이유
2. DB나 Redis에 Refresh Token을 저장하는 이유
3. 서버에서 클라이언트로 토큰을 전달하는 방법

---

## 문제 해결

### 1. JWT가 선호되는 이유

세션 방식과 JWT의 가장 큰 차이점은 클라이언트의 상태를 관리하는 방식입니다.

세션 방식은 서버가 클라이언트의 인증 정보를 들고 있어서 **Stateful(상태 유지)** 특징을 가집니다.

![](/jh/media/469c1311-e62f-449e-981c-7a17a7d8ee29.png)


반면 JWT는 토큰 자체에 클라이언트의 인증 정보가 모두 담겨 있어서 서버가 클라이언트의 상태를 저장할 필요가 없습니다. 서버는 토큰을 검증하고 그 데이터를 쓰기만 하면 되므로 **Stateless(무상태성)** 특징을 가집니다.

![](/jh/media/e9a385ee-3e24-445a-ae01-93a5ba7188e8.png)

**무상태성의 장점:**

클라우드 환경에서는 로드 밸런서와 오토 스케일링을 쓸 수 있어서 수평 확장(Scale-out)이 쉬워졌습니다. 다만 서버가 늘어나면 데이터 분리가 생깁니다. 세션 방식이라면 현재 접근한 서버 인스턴스에 클라이언트의 상태가 없을 수도 있습니다.

JWT는 서버 간 동기화가 필요하지 않습니다. 토큰 자체에 인증 정보가 들어 있어서 분산 시스템에 잘 맞습니다.

### 2. DB에 Refresh Token을 저장하는 이유

DB나 캐시 메모리에 Refresh Token을 저장하는 주된 목적은 어떤 사용자의 토큰인지 알기 위해서가 아니라 토큰을 무력화하기 위해서입니다.

```javascript
// 토큰 인증
const payload = await this.jwtService.verifyAsync(token, {
  secret: this.configService.get(envVariableKeys.refreshTokenSecret),
});
if (payload.type !== 'refresh') {
  throw new UnauthorizedException('잘못된 토큰입니다');
}

// 캐시값과 비교
const cachedRefreshToken = await this.cacheManager.get(
  `REFRESH_TOKEN_${payload.sub}`,
);
if (cachedRefreshToken !== token) {
  throw new UnauthorizedException('유효하지 않는 토큰입니다');
}

// 토큰 재발급
const accessToken = await this.issueToken(
  { id: payload.sub, role: payload.role, email: payload.email },
  false,
);
```

클라이언트로 받은 Refresh Token과 캐시(또는 DB)에 저장된 Refresh Token을 비교하는 로직입니다. 이 로직으로 다음 상황에서 토큰을 무력화할 수 있습니다.

1. **로그아웃 시:** DB(또는 캐시)에서 Refresh Token을 삭제하므로 해당 토큰을 쓸 수 없음
2. **관리자에 의한 강제 로그아웃:** 관리자가 특정 사용자의 Refresh Token을 삭제하면 더 이상 그 토큰을 쓸 수 없음

> DB에 토큰을 저장하면 인증 과정이 무거워질 수 있어서, 빠른 읽기/쓰기와 TTL(Time-To-Live)을 지원하는 Redis 같은 메모리 기반 데이터베이스를 많이 씁니다.

### 3. 서버에서 클라이언트로 토큰을 전달하는 방법

서버에서 만든 토큰을 클라이언트로 보내는 방법은 크게 두 가지입니다.

1. JSON 형식으로 전달
2. Cookie를 사용해 전달

처음에는 Cookie를 썼지만 백엔드와 프론트엔드를 직접 연동해 보니 불편해서 JSON 형식으로 바꿨습니다.

```javascript
res.cookie('session', 'value', { 
  maxAge: 24 * 60 * 60 * 1000, // 만료 기간 설정 
  httpOnly: true, // XSS 방지
  secure: true, // HTTPS 사용, 스니핑 방지 
  sameSite: 'strict' // CSRF 방지 
});
```

**CSR(Client Side Rendering) 환경에서의 문제점**

- **토큰 접근 불가:** httpOnly 설정 때문에 클라이언트 측에서 토큰을 읽어 활용할 수 없음
- **인증 상태 관리:** 클라이언트 측에서 토큰을 읽을 수 없으니 토큰의 만료 시간이나 사용자 정보를 확인할 수 없음

지금은 서버에서 JSON 형식으로 전달하고, Next.js로 CSR과 SSR을 적절히 섞어 처리하고 있습니다.

---

## 참고 링크

- [HttpOnly와 Secure Cookie - velog](https://velog.io/@eeeve/HttpOnly%EC%99%80-Secure-Cookie)
- [JWT 토큰 전달 방식 관련 논의 - OKKY](https://okky.kr/questions/1409503)

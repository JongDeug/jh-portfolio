---
title: "Yarn Berry 환경에서 Prisma 사용하기"
slug: yarn-berry-환경에서-prisma-사용하기
date: 2026-06-16
summary: "Yarn Berry PnP 환경에서 Prisma Client 생성 오류 해결. pnpify와 경로 설정."
tags: [Prisma, YarnBerry, 트러블슈팅]
---

## 문제 직면

Yarn Berry 패키지 매니저를 쓰는 환경에서 Prisma Client가 생성되지 않는 오류를 만났습니다.

### 오류가 발생한 과정

1. `yarn prisma migrate dev` 명령어로 schema.prisma 파일 내용을 기반으로 DB 업데이트
2. `yarn prisma generate` 명령어로 schema.prisma 파일 내용을 기반으로 Prisma Client 생성

```
Error: Could not resolve @prisma/client despite the installation that we just tried.
```

2번 과정에서 "@prisma/client를 확인할 수 없다는 에러"를 맞닥뜨렸습니다.

---

## 문제 해결

### 1. @yarnpkg/pnpify 패키지 설치

Yarn Berry의 PnP(Plug'n'Play)는 node_modules 폴더 없이 패키지를 효율적으로 관리하는 기능입니다. Prisma는 기본 설정이 node_modules 폴더에 의존하기 때문에, PnP 방식과 호환되도록 도와주는 @yarnpkg/pnpify 패키지를 함께 써야 합니다.

패키지를 설치한 뒤 `yarn pnpify prisma generate` 명령어로 문제를 해결할 수 있었습니다.

> ify는 어떤 것을 특정한 상태로 만들거나 변환할 때 쓰는 접미사입니다. 그러니 PnP 방식으로 변환한다는 뜻으로 보면 됩니다.

### 2. 경로 설정

"Prisma Client의 기본 생성 경로는 node_modules/.prisma/client 폴더"입니다.

따라서 prisma/schema.prisma 파일에서 Prisma Client 자원이 생성될 경로를 따로 설정해 줘야 합니다.

```
generator client {  
  provider = "prisma-client-js"  
  output   = "./generate(마음대로)"  
}
```

---

## 참고 링크

- [Yarn Berry 환경과 PnP 기능에서 Prisma 사용](https://velog.io/@pyo-sh/Yarn-Berry-%ED%99%98%EA%B2%BD%EA%B3%BC-PnP-%EA%B8%B0%EB%8A%A5%EC%97%90%EC%84%9C-Prisma-%EC%82%AC%EC%9A%A9)

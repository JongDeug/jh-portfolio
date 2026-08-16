---
title: "두 번째 요청부터 서버가 죽었던 이유"
slug: 두-번째-요청부터-서버가-죽었던-이유
date: 2026-06-16
summary: "첫 요청은 OK, 두 번째부터 뻗어버리는 증상의 원인이 logs/ 디렉토리 권한이었던 기록. Dockerfile 에서 근본적으로 잡는 방법까지."
tags: [NestJS, Docker, 트러블슈팅, 권한]
---

NestJS 서버에서 **첫 요청은 정상, 두 번째 요청부터 뻗어 버리는** 증상이 있었습니다.

---

## 원인

에러를 따라가 보니 로그 파일 write 에서 `EACCES` 가 떨어졌습니다. 범인은 `logs/` 디렉토리 권한이었습니다.

컨테이너가 처음 올라올 때 `logs/` 와 로그 파일을 만드는 주체는 root, 요청을 처리하며 append 하는 주체는 비-root node 프로세스라 서로 엇갈려 있었습니다. 첫 요청은 파일 생성 타이밍에 맞물려 운 좋게 통과했지만, 두 번째부터는 append 가 막혔습니다. 그러자 로거가 throw 했고, 그 예외가 그대로 전파되면서 요청 처리 자체가 죽었습니다.

---

## 해결

권한이 원인인지 판별할 때만 임시로 씁니다.

```bash
sudo chmod -R 777 logs   # 확인용, 배포엔 남기지 않음
```

근본 해결은 Dockerfile 에서 유저와 소유권을 맞춰 두는 것입니다.

```Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

# logs 미리 만들고 소유권을 node 유저로
RUN mkdir -p /app/logs && chown -R node:node /app

# 이후 프로세스는 node 로 실행 — 생성/append 주체가 엇갈리지 않음
USER node

CMD ["node", "dist/main.js"]
```

볼륨으로 호스트 디렉토리를 마운트한다면 호스트 쪽 UID 와 `node` 유저 UID 를 맞추거나, named volume 으로 옮기는 편이 안전합니다.

---

## 정리

- "두 번째 요청부터" 패턴이면 파일/리소스 쪽부터 보는 게 빠릅니다
- `chmod 777` 은 원인 확인용 디버그 도구로만 쓰고, 배포엔 남기지 않습니다
- Dockerfile 에서 `mkdir + chown + USER` 로 유저를 고정해 두면 재발하지 않습니다
- 로그 쓰기 실패가 본 요청을 죽이지 않도록 로거 에러 핸들러도 같이 달아두면 좋습니다

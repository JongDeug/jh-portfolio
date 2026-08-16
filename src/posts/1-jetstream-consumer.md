---
title: "연결마다 consumer를 만들던 구조를 다시 설계한 이유"
slug: 동접-1만이-벽이었다-jetstream-consumer를-연결에서-떼어내기
date: 2026-07-12
summary: "실시간 채팅을 NATS JetStream으로 짰더니 consumer 수가 곧 동접 수였습니다. 어디서 터지고(메타레이어), 어떻게 푸는지(인스턴스당 consumer + Direct Get) 정리한 기록."
tags: [nats, jetstream, 아키텍처, 트러블슈팅]
---

실시간 채팅을 NATS JetStream으로 짰습니다. WebSocket 연결이 열릴 때마다 consumer를 하나씩 만들어, 밀린 메시지를 따라잡은 뒤 실시간으로 tailing하는 구조였습니다. 잘 돌아갑니다. 그런데 이 구조는 **consumer 수가 곧 동시접속 수**입니다. 연결이 1만 개면 consumer도 1만 개가 됩니다.

이게 어디서, 왜 터지는지 파고든 기록입니다.

![현재 구조 — 연결당 consumer](/jh/media/808171c8-208b-4cac-80b7-5fc58868c45d.svg)

---

## 원인

처음엔 "consumer가 많으면 CPU가 못 버티겠지"라고 막연히 생각했습니다. 그런데 실제로 먼저 무너지는 건 **메타레이어**였습니다.

consumer는 공짜가 아닙니다. consumer 하나는 메타 메모리를 차지하고, 생성·삭제 때마다 클러스터 raft에 트래픽을 만들고, delivery 상태를 계속 추적해야 합니다. 연결이 붙었다 떨어질 때마다 이 비용이 발생합니다. 그러니 병목은 메시지를 처리하는 CPU가 아니라, consumer 상태를 클러스터 전체에 복제하는 **raft와 메타리더**에서 먼저 터집니다.

Synadia가 JetStream 스케일 안티패턴을 정리하면서 이 지점을 못 박았습니다. consumer가 **10만을 넘어서면** 상태 복제 트래픽과 메타리더 부하 때문에 클러스터가 불안정해진다는 것입니다. 우리 구조에선 consumer 수가 곧 동접 수이니, 이 숫자가 그대로 동접 상한이 됩니다.

| 동접(=consumer 수) | 상태 |
|---|---|
| ~1,000 | 여유 |
| ~5,000 | 돌아감 |
| ~10,000 | 경계선 |
| 100,000 | 모델 부적합 |

한 가지 짚어둘 게 있습니다. 지금 이 구조가 버티는 건 설계가 강해서가 아니라 **부하가 작아서**입니다. B2B라 상담원만 접속하니 동접 자체가 작습니다. 이걸 "구조가 튼튼하다"로 착각하면 안 됩니다.

---

## 해결

방향은 한 줄입니다. **consumer 수를 "연결 수"가 아니라 "인스턴스 수"에 묶습니다.**

![리팩터 — 인스턴스당 consumer + Direct Get replay](/jh/media/4f652df4-563d-40a8-ae4b-8c50ceef7f9a.svg)

인스턴스마다 ordered consumer를 딱 하나만 둡니다. 이 consumer는 실시간(`DeliverNew`)만 담당하고, 받은 메시지를 인메모리 상태로 fan-out합니다. 소켓 하나에 1:1로 push하는 게 아니라, 그 방에 속한 로컬 소켓 전부에 1:N으로 뿌립니다. 이러면 consumer 수가 동접이 아니라 인스턴스 수가 됩니다. 인스턴스 수십 대면 consumer도 수십 개라, 10만 벽에서 완전히 벗어납니다.

replay는 consumer에서 떼어냅니다. 기존 구조는 재접속 시 "밀린 구간 따라잡기(replay)"와 "실시간 tailing"을 한 consumer가 겸직했습니다. 그런데 replay는 결국 **특정 seq 범위를 집어오는 일**이라, consumer 없이 stream에서 바로 읽는 **Direct Get**(`$JS.API.DIRECT.GET`)의 정의와 정확히 맞습니다. Synadia도 "특정 메시지를 집어올 때는 consumer를 만들지 말고 Direct Get을 쓰라"고 권합니다. 개인 커서 seq만 있으면 consumer 하나 없이 놓친 구간을 조회할 수 있습니다.

여기서 커서를 클라이언트가 소유한다는 점이 열쇠가 됩니다. seq는 consumer가 발급하는 값이 아니라 stream이 메시지에 박아둔 값입니다. 택배 송장번호 같은 것이라, 배달부(consumer)가 바뀌어도 번호는 그대로입니다. 클라이언트가 마지막으로 받은 seq를 들고 있다가 재접속 때 넘기면, 그 지점부터 Direct Get으로 따라잡으면 됩니다.

다행히 절반은 이미 와 있었습니다. 기존 구조에도 방 멤버십을 들고 있는 인메모리 필터맵이 있어서, 인스턴스가 받은 메시지를 방 멤버에게 뿌리는 로직은 존재했습니다. 실제로 바꿀 곳은 두 군데였습니다 — "consumer를 연결당에서 인스턴스당으로", 그리고 "1:1 push를 1:N fan-out으로".

---

## 정리

- **consumer는 공짜가 아닙니다.** 하나당 메타 메모리·raft 트래픽·delivery 추적이 붙습니다. "연결마다 consumer 1개"는 곧 "동접마다 비용 1개"입니다.
- **병목은 CPU가 아니라 메타레이어입니다.** consumer가 많아지면 상태를 복제하는 raft와 메타리더가 먼저 무너집니다. Synadia 기준 consumer 10만이 벽입니다.
- **consumer 수는 인스턴스 수에 묶어야 합니다.** 인스턴스당 consumer 1개 + 인메모리 1:N fan-out으로 바꾸면 동접과 consumer가 분리됩니다.
- **replay와 실시간은 다른 도구로 풉니다.** 실시간은 ordered consumer, 밀린 구간 따라잡기는 Direct Get(2.9+, 배치는 2.11+). seq는 stream이 소유하니 클라이언트가 커서만 들고 있으면 됩니다.
- **버티는 이유가 "설계"인지 "작은 부하"인지 구분해야 합니다.** 부하가 작아서 안 터지는 걸 구조가 튼튼하다고 착각하면, 한계선을 놓칩니다.

---

*참고: [JetStream Design Patterns for Scale — Synadia](https://www.synadia.com/blog/jetstream-design-patterns-for-scale)*

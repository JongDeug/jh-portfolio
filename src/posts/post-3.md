---
title: "라즈베리파이 한 대를 외부망에 닿게 만들기까지"
slug: 라즈베리파이-한-대를-외부망에-닿게-만들기까지
date: 2026-06-16
summary: "Ubuntu Server 를 깐 라즈베리파이를 부팅하고 유선 네트워크를 잡고, 이중 NAT 를 풀어 외부망에서 SSH·HTTPS 로 닿게 만들기까지의 기록."
tags: [라즈베리파이, 온프레미스, 네트워크, 트러블슈팅]
---

## 시작 — 왜 Pi 로 온프레미스

집에 작은 서버 한 대를 두고 직접 굴려 보고 싶어서 라즈베리파이를 들였습니다.

세팅할 때는 막히는 단계마다 검색하고 풀고 다음으로 넘어가는 식이라 과정을 자세히 적어 두지 못했습니다. 이 글은 그중 큼직하게 막혔던 지점만 골라 정리한 기록입니다.

대체로 흐름은 이랬습니다.

1. 부팅 — 화면이 안 떠서 한참 헤맸습니다
2. 네트워크 — 유선을 자동으로 붙이고 내부 IP 를 고정했습니다
3. SSH — 내부망에선 잘 됐지만 외부망에서 안 됐습니다
4. 이중 NAT — 결국 두 단의 라우터 모두를 건드려야 했습니다
5. 그 위에 Nginx 와 DDNS — 도메인으로 닿게 했습니다

---

## 부팅이 안 됐다 — config.txt 의 hdmi 설정

처음 한 일은 단순했습니다. Ubuntu Server 이미지를 SD 카드에 굽고, 카드를 Pi 에 꽂고, 전원을 넣었습니다.

그런데 **전원만 들어오고 모니터엔 아무것도 뜨지 않았습니다.** 케이블을 바꿔 끼우고 모니터를 다른 걸로 바꿔 봐도 똑같았습니다.

원인은 Pi 의 부팅 파티션 안에 있는 `config.txt` 였습니다. 부팅 파티션을 다른 PC 에서 마운트해서 `/boot/firmware/config.txt` 를 열어 보면 hdmi 관련 옵션 몇 줄이 주석 처리된 채로 들어가 있습니다. 모니터가 핫플러그를 잘 잡지 못하거나 출력 모드가 맞지 않을 때 이 옵션들을 살려 두면 부팅 직후 화면이 강제로 잡혔습니다.

옵션 한두 개의 주석을 풀고 다시 꽂으니 콘솔이 정상으로 떴습니다.

> 같은 모니터·같은 케이블이어도 Pi 모델이나 펌웨어 버전에 따라 hdmi 동작이 미묘하게 달라서, "전원만 들어오고 화면 안 뜸" 류는 일단 이 파일부터 보는 편이 빠릅니다.

---

## 네트워크 자동 연결과 내부 IP 고정 — netplan

부팅이 되고 나서 다음 막힘은 네트워크였습니다.

연결 자체는 무선(`wlan`) 과 유선(`eth`) 이 다 있었는데 저는 안정성이 좋은 **유선** 으로 정했습니다. 그런데 리눅스 서버는 데스크톱 OS 와 달리 기본적으로 네트워크 인터페이스를 자동으로 올려 주지 않습니다. 부팅할 때마다 손으로 `ip` 명령으로 인터페이스를 깨워 줘야 한다는 뜻이었습니다.

이걸 자동화하는 자리가 Ubuntu 의 **netplan** 입니다. `/etc/netplan/50-cloud-init.yaml` 같은 파일에 인터페이스 설정을 적어 두면 부팅할 때 systemd-networkd 가 그대로 적용해 줍니다.

저는 같은 파일에서 두 가지를 같이 잡았습니다.

- 유선 인터페이스를 부팅 시 자동으로 올리기
- 그 인터페이스에 **내부망 고정 IP** 를 주기

대략 이런 형태였습니다. (값은 환경에 맞게)

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses: [192.168.0.10/24]
      routes:
        - to: default
          via: 192.168.0.1
      nameservers:
        addresses: [168.126.63.1, 168.126.63.2]
```

`dhcp4: false` 로 DHCP 자동 할당을 끄고, `addresses` 에 사설 대역 안에서 안 쓰는 IP 를 박아 둔 식입니다. `nameservers` 는 통신사가 안내하는 DNS 주소를 넣어 두면 됩니다.

저장하고 `sudo netplan apply` 한 번 하면 즉시 반영됐습니다.

---

## DHCP 고정 할당 — 공유기에서 IP 가 흔들리지 않게

netplan 으로 Pi 쪽에서 IP 를 박아 둬도, **공유기 쪽 DHCP 가 같은 IP 를 다른 기기에 줘 버리면** 충돌이 납니다. SSH 로 들어가서 일을 보고 있다가 IP 가 흔들려 끊기는 일이 그렇게 생깁니다.

그래서 공유기 관리 페이지에 들어가서 **DHCP 고정 할당** 메뉴를 찾았습니다. Pi 의 MAC 주소에 위에서 박아 둔 IP 를 묶어 두는 설정입니다. 이렇게 해 두면 공유기가 다른 기기에는 그 IP 를 절대 안 주고, Pi 가 다시 켜져도 늘 같은 자리로 돌아옵니다.

이제 SSH 가 끊길 일은 줄었습니다.

---

## 외부망 SSH 가 안 됐다 — 이중 NAT 와 포트포워딩

여기까지 하고 나서 같은 공유기 아래의 노트북에서 사설 IP 로 SSH 를 쳐 보면 잘 들어갔습니다.

문제는 **회선을 LTE 로 바꿔 외부에서 들어가려는 순간** 부터였습니다.

처음에는 평범하게 공유기 한쪽에만 포트포워딩을 잡아 두었습니다. 외부 22 번 → Pi 의 사설 IP:22. 외부 회선에서 공인 IP 로 SSH 를 시도해 봤는데 응답이 오지 않았습니다.

방화벽인지, 포트인지, 매핑 자체인지 한참을 잡고 있다가 [lamanus.kr/75](https://lamanus.kr/75) 에서 결정적인 단서를 얻었습니다. 제가 쓰는 회선이 **이중 NAT** 라는 점이었습니다.

통신사 쪽 **기가게이트웨이** 가 1차 NAT 를 잡고 있고, 그 아래에 제 **공유기** 가 또 한 단의 NAT 를 잡고 있는 구조였습니다. 외부에서 들어오는 패킷은 공유기 앞에서 한 번 더 막혀 있었던 겁니다.

<!-- diagram:dual-nat -->
<div style="margin:24px 0;font-family:'Inter','Noto Sans KR',sans-serif;font-size:13px;">
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:20px;">
    <div style="font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:1.5px;margin-bottom:14px;">DUAL NAT &middot; SSH 22</div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="width:100%;max-width:380px;border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center;background:var(--bg);">
        <div style="font-size:10px;color:var(--text-muted);letter-spacing:1.2px;font-weight:700;">EXTERNAL</div>
        <div style="font-weight:600;margin-top:2px;">외부망 (인터넷)</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;font-family:'JetBrains Mono',ui-monospace,monospace;">ssh user@&lt;공인 IP&gt;:22</div>
      </div>
      <div style="font-size:16px;color:var(--text-muted);line-height:1;">↓</div>
      <div style="width:100%;max-width:380px;border:1.5px solid #f97316;border-radius:10px;padding:12px 14px;background:rgba(249,115,22,0.06);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>
            <div style="font-size:10px;color:#f97316;letter-spacing:1.2px;font-weight:700;">NAT 1차 &middot; ISP</div>
            <div style="font-weight:600;margin-top:2px;">기가게이트웨이</div>
          </div>
          <div style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',ui-monospace,monospace;text-align:right;">WAN: 공인 IP<br/>LAN: 공유기 사설 IP</div>
        </div>
        <div style="margin-top:10px;padding:8px 10px;border:1px dashed #f97316;border-radius:6px;background:var(--bg);font-size:11px;font-family:'JetBrains Mono',ui-monospace,monospace;">
          <span style="color:#f97316;font-weight:700;">PF ①</span> <span style="color:var(--text-muted);">공인:22 → 공유기 WAN:22</span>
        </div>
      </div>
      <div style="font-size:16px;color:var(--text-muted);line-height:1;">↓</div>
      <div style="width:100%;max-width:380px;border:1.5px solid #f97316;border-radius:10px;padding:12px 14px;background:rgba(249,115,22,0.06);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>
            <div style="font-size:10px;color:#f97316;letter-spacing:1.2px;font-weight:700;">NAT 2차 &middot; HOME</div>
            <div style="font-weight:600;margin-top:2px;">공유기 (가정용 라우터)</div>
          </div>
          <div style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',ui-monospace,monospace;text-align:right;">WAN: 사설 IP＃1<br/>LAN: 사설 IP＃2</div>
        </div>
        <div style="margin-top:10px;padding:8px 10px;border:1px dashed #f97316;border-radius:6px;background:var(--bg);font-size:11px;font-family:'JetBrains Mono',ui-monospace,monospace;">
          <span style="color:#f97316;font-weight:700;">PF ②</span> <span style="color:var(--text-muted);">공유기 WAN:22 → Pi LAN IP:22</span>
        </div>
      </div>
      <div style="font-size:16px;color:var(--text-muted);line-height:1;">↓</div>
      <div style="width:100%;max-width:380px;border:1.5px solid #22c55e;border-radius:10px;padding:12px 14px;text-align:center;background:rgba(34,197,94,0.06);">
        <div style="font-size:10px;color:#22c55e;letter-spacing:1.2px;font-weight:700;">TARGET</div>
        <div style="font-weight:600;margin-top:2px;">Raspberry Pi</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;font-family:'JetBrains Mono',ui-monospace,monospace;">sshd listen :22</div>
      </div>
    </div>
    <div style="margin-top:18px;padding-top:14px;border-top:1px dashed var(--border);font-size:11px;color:var(--text-muted);line-height:1.6;">
      포트포워딩이 <strong style="color:#f97316;">두 단</strong> 모두 필요합니다. 공유기 한 단만 열어 두면 ISP 게이트웨이에서 패킷이 끊겨 Pi 까지 닿지 않습니다.
    </div>
  </div>
</div>

해결 자체는 단순했습니다.

기가게이트웨이 관리 페이지에 들어가서 외부 22 번을 공유기의 WAN 사설 IP 로 한 번 떨어뜨리고, 공유기에서 같은 22 번을 다시 Pi 의 사설 IP 로 떨어뜨리는 식으로 두 단을 모두 풀어 두었습니다.

이렇게 두 단을 통과시키고 나서야 외부에서 공인 IP 로 SSH 가 한 번에 붙었습니다.

> 안 되면 일단 공유기의 WAN IP 가 사설 대역(`10.x` / `172.16~31.x` / `192.168.x`) 인지부터 확인하면 빠릅니다. 사설 대역이면 그 위에 NAT 가 한 단 더 있다는 뜻입니다.

---

## 도메인으로 닿게 — Nginx 와 DDNS

SSH 가 풀리고 나서 그 위에 웹 서비스 한 단을 더 얹었습니다.

먼저 80 번 포트를 같은 방식으로 두 단의 라우터 모두에서 풀었습니다. 그리고 Pi 에 **Nginx** 를 깔고 `/etc/nginx/sites-enabled/` 안에 가상호스트 파일 하나를 둬서 기본 응답을 잡아 두는 정도부터 시작했습니다. 자세한 설정보다 이 시점에 한 일은 "외부에서 80 번이 들어오면 Pi 의 Nginx 가 받아 준다" 까지였습니다.

다만 가정용 회선에서 받는 공인 IP 는 **수시로 바뀝니다.** IP 가 바뀌면 외부에서 SSH·웹 모두 다시 IP 를 알아내야 하는데 매번 그러긴 어려워서 도메인을 붙이기로 했습니다.

도메인은 **freedns** 에서 무료로 받았고, 그걸 통신사 기가게이트웨이의 **DDNS** 메뉴에 묶어 뒀습니다. 이렇게 해 두면 게이트웨이가 자기 공인 IP 가 바뀔 때마다 freedns 쪽으로 새 IP 를 통보해 줘서, 도메인은 늘 현재 공인 IP 를 가리키게 됩니다.

이때부터 외부에서는 공인 IP 대신 도메인으로 들어올 수 있게 됐습니다.

---

## 이후로 챙기게 된 것들

큰 막힘은 여기까지였고, 그 뒤로는 운영하면서 자연스럽게 추가로 챙기게 된 것들이 있었습니다.

- **공개키 SSH** — 비밀번호 대신 SSH 키로 들어오도록 바꿔 두었습니다. 외부망에 22 번을 열어 두면 무차별 로그인 시도가 꽤 들어와서, 키 인증으로 바꾸고 비밀번호 로그인은 막아 두는 편이 마음이 편했습니다.
- **HTTPS** — 80 번 위에 그대로 둘 게 아니라면 인증서가 필요합니다. 인증서는 평문 통신을 막고 도메인 진위도 함께 보장해 주는 장치라서, 도메인까지 붙이고 나면 자연스럽게 다음 단계가 됩니다.
- **Pi 안전하게 끄기** — Pi 는 그대로 전원을 뽑으면 SD 카드의 파일시스템이 망가질 수 있습니다. 끄기 전에 `sudo poweroff` 로 OS 가 알아서 디스크를 정리하고 멈춘 뒤 전원을 빼는 편이 좋습니다.

---

## 정리

- 부팅 안 되면 일단 `/boot/firmware/config.txt` 의 hdmi 옵션부터 본다
- 유선 네트워크 자동 연결과 내부 IP 고정은 **netplan** 한 파일에서 같이 잡힌다
- 공유기 **DHCP 고정 할당** 으로 IP 가 흔들리지 않게 묶어 둔다
- 회선이 **이중 NAT** 면 공유기 한 단만 풀어 두면 안 닿는다 — 기가게이트웨이까지 두 단 모두 포트포워딩
- 가정용 회선의 공인 IP 는 수시로 바뀌므로 **DDNS + 무료 도메인** 으로 묶어 두면 외부에서는 도메인 한 줄로 들어올 수 있다

한 번에 그려진 그림이 아니라 단계마다 다른 레이어 — 커널 부팅, 리눅스 네트워크, 가정용 NAT, DNS — 에서 막히고 풀린 기록입니다. Pi 한 대가 외부에서 닿는 상태가 되고 나니, 그 위에 서비스를 하나씩 얹어 갈 출발선이 생겼습니다.

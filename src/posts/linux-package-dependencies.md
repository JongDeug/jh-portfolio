---
title: "리눅스 패키지 의존성(Linux Package Dependencies)"
slug: 리눅스-패키지-의존성linux-package-dependencies
date: 2026-06-16
summary: "리눅스 패키지 시스템 이해. 소스/바이너리 패키지, 의존성, 패키지 관리자(dpkg, apt)."
tags: [리눅스, CS]
---

## 리눅스 패키지

먼저 의존성을 이해하려면 리눅스 패키지(Linux Package)부터 알아야 합니다.

**리눅스 패키지는 소프트웨어의 실행에 필요한 모든 파일과 설치 정보를 담은 압축된 아카이브 파일**(Archive file)입니다. 윈도우의 EXE 파일과 비슷한 개념이라고 보면 됩니다.

### 1. 패키지 형태

소프트웨어를 배포하는 형태는 크게 두 가지로 나뉩니다. 소스 코드 형태로 배포되는 **소스 패키지 방식**, 그리고 이미 컴파일된 파일이 들어 있는 **바이너리 패키지 방식**입니다.

#### 1.1 소스 패키지

소스 패키지는 소프트웨어를 이루는 소스 코드만 담은 단순한 패키지(tar.gz)입니다. 그래서 사용자가 직접 컴파일하고 설치해야 하는 불편함이 있습니다.

- **TAR 아카이브(tar)**: 여러 파일과 폴더를 모아 파일 하나로 만든 것. 압축은 하지 않음.
- **TGZ 아카이브(tgz)**: TAR 아카이브이지만, GNU Zip 압축 기술을 사용해 압축.
- **GZip 아카이브(gz)**: GZip 유틸리티를 사용해 압축.

```bash
# 소스코드 설치
wget http://nginx.org/download/nginx-.tar.gz 
# 압축 해제
tar -zxvf nginx-1.20.2.tar.gz
# 파일 이동
cd nginx-1.20.2 

# 환경 설정
# ... 생략

# 빌드 및 설치
make && make install 
```

#### 1.2 바이너리 패키지

바이너리 패키지는 소스 패키지와 달리 이미 모든 것이 구축(컴파일)되어 있어 설치만 하면 됩니다. 바이너리 패키지에는 프로그램을 설치하는 데 필요한 파일, 메타데이터(버전 정보, 의존성) 등이 들어 있습니다.

- **Debian 패키지(deb)**: Debian Linux 배포판에서 사용. dpkg, apt 등 여러 패키지 관리자 존재.
- **RPM 패키지(rpm)**: Red Hat Linux 배포판에서 사용. RPM(Red Hat Package Manager) 사용.

```bash
sudo apt update
sudo apt install nginx
```

> wget, apt는 패키지 형태에 따라 다르게 쓰는 명령어라는 걸 알게 됐습니다!!

---

## 리눅스 패키지 의존성

의존성이란 패키지가 다른 소프트웨어의 기능과 리소스를 필요로 하는 것을 말합니다.

컴퓨터에 Python 버전 3.1이 필요한 "소프트웨어"가 이미 설치돼 있다고 해봅시다. 다른 소프트웨어를 설치하려는데 이 친구는 Python 버전 3.3을 필요로 합니다. 그럼 설치 과정에서 충돌이 생깁니다.

옛날에는 이 의존성 충돌을 사용자가 직접 수동으로 관리해야 했습니다. 다행히 지금은 아주 똑똑한 패키지 관리자가 있어서 걱정 없습니다.

---

## 리눅스 패키지 관리자

리눅스 패키지 관리자(Linux Package Manager)란 패키지를 관리하는 데 쓰는 소프트웨어 도구입니다. 데비안 계열에서는 dpkg, apt 같은 친구들이 패키지 관리자이며, 바이너리 패키지를 관리해 주는 도구입니다.

### 1. 구분

#### Low-level Package management tools

데비안 계열에서 dpkg가 바로 저수준 패키지 관리 도구입니다. 주로 설치, 삭제, 업그레이드에 쓰이며 **의존성을 수동으로 관리**해야 하는 불편함이 있습니다.

#### High-level Package management tools

저수준 패키지 관리 도구가 하는 기능에 더해 **의존성 문제를 자동으로 해결**해 줍니다.

데비안 계열에서 apt가 바로 고수준 패키지 관리 도구입니다.

![](/jh/media/3e5076bf-acb0-43b2-be05-2a4180bafcc5.png)
출처: https://itsfoss.com/package-manager/

#### 저장소(Repository)

저장소는 메타데이터 파일(버전 정보, 의존성, 패키지 이름)들을 가진 공간입니다. 패키지 관리자는 먼저 이 메타데이터와 상호작용해 리눅스 시스템에 로컬 캐시를 만듭니다.

#### apt show

패키지의 메타데이터 파일들을 확인하는 명령어입니다.

#### apt update

저장소의 메타데이터를 참조해 리눅스 시스템에 만들어진 로컬 캐시를 업데이트합니다.

#### apt install

로컬 캐시를 참고해 패키지 정보를 찾습니다. 그 후 인터넷에 접속해 적절한 저장소를 찾아 해당 패키지를 다운로드합니다. 패키지에 의존성이 있을 수 있는데, 이걸 알아서 똑똑하게 설치해 줍니다.

---

## 요약

- **리눅스 패키지**: 소스 패키지와 바이너리 패키지로 구분.
- **패키지 의존성**: 소프트웨어 설치 시 다른 프로그램이 필요한 경우 발생.
- **패키지 관리자**: dpkg(저수준), apt(고수준) 사용, 고수준 패키지 관리자는 의존성을 자동으로 해결함.

---

## 참고 링크

- [리눅스 패키지 개념 정리 - IT Friends](https://itfriends.tistory.com/1)
- [Linux Package Manager 개념 가이드 - It's FOSS](https://itsfoss.com/package-manager/)
- [Linux 패키지 관리 - Bradbury](https://bradbury.tistory.com/227)
- [Package Management in Linux - Scaler](https://www.scaler.com/topics/cyber-security/package-management-in-linux/)
- [Linux Package Dependencies - LinuxSimply](https://linuxsimply.com/linux-basics/package-management/dependencies/)

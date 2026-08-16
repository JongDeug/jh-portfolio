---
title: "WSL(Window Subsystem for Linux) npm 속도 문제"
slug: wslwindow-subsystem-for-linux-npm-속도-문제
date: 2026-06-16
summary: "WSL에서 npm 실행 속도가 비정상적으로 느린 문제. /mnt/c 대신 리눅스 파일시스템 사용으로 해결."
tags: [WSL, 리눅스, 트러블슈팅]
---

## 문제 직면

WSL(Window Subsystem for Linux)에서 프로젝트를 실행하는 데 걸리는 시간이 유난히 길었습니다. 다른 환경에서는 잘 돌아갔으니, 제 WSL 환경 문제였습니다.

---

## 문제 해결

프로젝트를 /mnt/c 디렉토리에서 개발했는데, 이곳은 window의 C드라이브입니다. WSL은 Window 드라이브에 액세스하는 속도가 무척 느립니다. (리눅스를 잘 모르던 시절이었습니다.)

프로젝트 폴더를 ~/src로 옮기니 속도 문제가 풀렸습니다!!

![](/jh/media/b8ffb516-0ba0-41ca-a05e-1bc4c7019552.png)

---

## 참고 링크

- [WSL 속도 문제 이슈](https://github.com/microsoft/WSL/issues/9555)
- [WSL 파일 저장소 설정](https://learn.microsoft.com/en-us/windows/wsl/setup/environment#file-storage)

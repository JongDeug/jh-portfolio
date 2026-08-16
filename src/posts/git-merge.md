---
title: "Git Merge 종류 — 네 가지 방식과 히스토리 선택"
slug: git-merge-종류-네-가지-방식과-히스토리-선택
date: 2026-06-16
summary: "Fast-forward, 3-way merge, Squash, Rebase — 네 가지 merge 방식의 구조와 차이를 정리한다."
tags: [git, CS, 버전관리, merge, rebase]
---

`git merge` 를 실행하면 브랜치가 합쳐집니다.

그런데 "합친다"는 결과는 같아도 방식마다 **커밋 그래프 모양**이 달라집니다.

어떤 히스토리를 남길 것인가. merge 방식을 고르는 일은 결국 이 질문에 답하는 것입니다.

## Fast-forward merge

**target 브랜치에 신규 커밋이 없을 때** 자동으로 발동됩니다.

source 브랜치의 커밋들을 그대로 target 위에 이어 붙입니다.

merge commit 이 추가되지 않으니 히스토리가 직선으로 유지됩니다.

```
Before:

main      *---*
               \
feature         *---*

After (fast-forward):

main       *---*---*---*
                        ^
                   main & feature
```

```bash
git merge feature          # target에 신규 커밋이 없으면 자동 FF
git merge --no-ff feature  # FF 조건이어도 강제로 3-way merge
```

`--no-ff` 는 merge commit 을 남깁니다. "이 시점에 브랜치가 합쳐졌다"는 흔적을 보존하고 싶을 때 씁니다.

## 3-way merge

base(공통 조상)·source·target, 세 버전을 비교해서 합치는 방식입니다.

**target 에 신규 커밋이 있을 때** 발동됩니다.

merge commit 하나가 새로 생기고, 브랜치 연결선이 그래프에 남습니다.

```
Before:

main      *---*-------*
               \
feature         *---*

After (3-way merge):

main      *---*-------*-------M (merge commit)
               \              |
feature         *---*---------+
```

```bash
git pull --no-rebase  # 원격 브랜치를 3-way merge 로 통합
```

`git pull --no-rebase` 의 기본 동작이 이 방식입니다.

target 에 내 작업도 있고 원격에도 새 커밋이 있을 때 merge commit 이 생기고, 이력이 갈라진 모양으로 남습니다.

## Squash merge

source 브랜치의 커밋들을 **하나로 뭉쳐** target 위에 올립니다.

3-way merge 와 달리 브랜치 연결선은 남기지 않습니다.

```
Before:

main      *---*-------*
               \
feature         *---*

After (squash & merge):

main      *---*-------*---S (squashed)

feature        (*)---(*)    <- 내용만 반영, 히스토리에서 사라짐
```

```bash
git merge --squash feature
git commit -m "feat: feature 완료"  # squash 후 직접 커밋해야 함
```

피처 브랜치의 작업 내역이 단일 커밋으로 정리되어 target 히스토리가 깔끔해집니다.

다만 원래 커밋들이 사라지므로 `git blame` 으로 세부 변경 이력을 추적하기 어려워집니다.

## Rebase

source 브랜치의 **시작점**을 target 의 마지막 커밋으로 옮긴 뒤 fast-forward 합니다.

커밋들이 새로 재작성되어 target 위에 직선으로 쌓입니다.

```
Before:

main      *---*-------*
               \
feature         *---*

After (rebase):

               (*)---(*)       <- 원본 (사라짐)

main      *---*-------*---*'---*' (rebased)
                              ^
                           feature
```

```bash
git rebase main   # source 브랜치에서 실행
```

히스토리가 직선이 되어 읽기 쉬워집니다.

단, **이미 push 한 브랜치에서는 rebase 를 쓰지 않습니다.**

커밋 해시가 바뀌기 때문에 같은 브랜치를 참조하던 다른 사람과 충돌이 납니다.

> push 후 rebase 위험: 원격 브랜치는 원본 커밋 해시를 기억하는데, rebase 로 해시가 바뀐 커밋을 force push 하면 다른 작업자의 히스토리가 엉킵니다.

## 네 가지 비교

| 방식 | merge commit | 브랜치 선 | 커밋 재작성 |
|:---|:---:|:---:|:---:|
| **Fast-forward** | ✕ | ✕ | ✕ |
| **3-way** | ○ | ○ | ✕ |
| **Squash** | ○ (수동) | ✕ | ✕ (뭉침) |
| **Rebase** | ✕ | ✕ | ○ |

**Fast-forward vs Rebase**: target 에 신규 커밋이 있는가 없는가.

**3-way vs Squash**: 병합 후 source 브랜치 선이 그래프에 남는가 아닌가.

## git pull 전략과의 연결

`git pull` 은 내부적으로 fetch + merge 입니다.

어떤 merge 전략을 쓰느냐가 `--no-rebase` / `--rebase` 플래그로 갈립니다.

```bash
git pull --no-rebase   # 3-way merge. 내 브랜치 위에 merge commit 생성
git pull --rebase      # rebase. 내 작업을 원격 브랜치 위로 올려 붙임
```

`--no-rebase` 는 원격과 로컬이 갈라진 모양이 히스토리에 남습니다.

`--rebase` 는 히스토리가 직선이 되지만, 로컬 커밋 해시가 바뀝니다.

pull 할 때는 rebase 를 써도 괜찮습니다.

push 전 작업이라 다른 사람과 해시가 충돌할 일이 없기 때문입니다.

push 한 이후라면 rebase 대신 `--no-rebase` 를 씁니다!!

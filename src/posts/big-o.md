---
title: "Big O 표기법"
slug: big-o-표기법
date: 2026-06-16
summary: "알고리즘의 효율성을 나타내는 Big O 표기법. 실행 시간 측정의 한계와 시간 복잡도 분석."
tags: [알고리즘, CS]
---

## 실행 시간 측정

코드의 성능을 분석할 때 실행 시간을 직접 재는 방법은 비효율적입니다. 기기마다 성능이 다르고 측정 방법도 제각각이기 때문입니다. 무엇보다 오래 걸리는 코드를 일일이 측정하기는 매우 번거롭습니다.

---

## Big O 표기법

이 문제를 해결하려고 **Big O 표기법**을 씁니다. Big O 표기법은 알고리즘의 효율성을 나타내며, 다음 특징이 있습니다.

- **입력 크기에 따라 코드가 몇 번 실행되는지가 연산 개수보다 중요하다**
- **전체적인 추세에만 관심이 있으므로 최고차항만 신경 쓰면 된다**

삽입 정렬 코드는 이중 반복문 구조입니다. 외부 루프는 n-1번 돌고 내부 루프는 최악의 경우 i번씩 돌기 때문에 총 n×(n-1)/2번 비교합니다. 입력 크기가 커질수록 최고차항이 지배하므로 시간 복잡도는 최종적으로 O(n²)이 됩니다.

```javascript
const insertionSortV1 = (arr) => {
  for (let i = 1; i < arr.length; i++) {
    for (let j = i; j >= 0; j--) {
      if (arr[j] < arr[j - 1]) swap(arr, j, j - 1);
      else break;
    }
  }
  return arr;
};
```

O(n²)은 그다지 좋은 성능이 아닙니다.

아래 차트를 보면 각 시간 복잡도별 성능 차이를 한눈에 확인할 수 있습니다.

<div style="margin:24px 0;font-family:'Inter','Noto Sans KR',sans-serif;">
<div style="padding:24px;border-radius:12px;border:1px solid var(--border);background:var(--bg-secondary);">
<div style="font-size:14px;font-weight:700;margin-bottom:16px;color:var(--text);display:flex;align-items:center;gap:8px;">
<i class="fa-solid fa-chart-line" style="color:var(--accent);"></i> Big O Complexity Chart
</div>
<!-- Bar chart -->
<div style="display:flex;flex-direction:column;gap:8px;">
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(1)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:5%;height:100%;border-radius:6px;background:linear-gradient(90deg,#22c55e,#4ade80);display:flex;align-items:center;padding-left:8px;">
      </div>
    </div>
    <div style="width:70px;font-size:11px;color:#22c55e;font-weight:600;flex-shrink:0;">Excellent</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(log n)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:15%;height:100%;border-radius:6px;background:linear-gradient(90deg,#84cc16,#a3e635);"></div>
    </div>
    <div style="width:70px;font-size:11px;color:#84cc16;font-weight:600;flex-shrink:0;">Good</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(n)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:30%;height:100%;border-radius:6px;background:linear-gradient(90deg,#eab308,#facc15);"></div>
    </div>
    <div style="width:70px;font-size:11px;color:#eab308;font-weight:600;flex-shrink:0;">Fair</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(n log n)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:50%;height:100%;border-radius:6px;background:linear-gradient(90deg,#f97316,#fb923c);"></div>
    </div>
    <div style="width:70px;font-size:11px;color:#f97316;font-weight:600;flex-shrink:0;">Bad</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(n<sup>2</sup>)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:70%;height:100%;border-radius:6px;background:linear-gradient(90deg,#ef4444,#f87171);"></div>
    </div>
    <div style="width:70px;font-size:11px;color:#ef4444;font-weight:600;flex-shrink:0;">Horrible</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(2<sup>n</sup>)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:88%;height:100%;border-radius:6px;background:linear-gradient(90deg,#dc2626,#b91c1c);"></div>
    </div>
    <div style="width:70px;font-size:11px;color:#dc2626;font-weight:600;flex-shrink:0;">Horrible</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:80px;font-size:13px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;">O(n!)</div>
    <div style="flex:1;height:28px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.05);">
      <div style="width:100%;height:100%;border-radius:6px;background:linear-gradient(90deg,#991b1b,#7f1d1d);"></div>
    </div>
    <div style="width:70px;font-size:11px;color:#991b1b;font-weight:600;flex-shrink:0;">Horrible</div>
  </div>
</div>
<div style="margin-top:12px;font-size:11px;color:var(--text-faint);display:flex;justify-content:space-between;">
  <span>Operations <i class="fa-solid fa-arrow-right" style="font-size:9px;margin:0 4px;"></i></span>
  <span>n = Elements</span>
</div>
</div>
</div>

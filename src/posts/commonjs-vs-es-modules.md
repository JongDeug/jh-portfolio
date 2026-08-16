---
title: "CommonJS vs ES Modules"
slug: commonjs-vs-es-modules
date: 2026-06-16
summary: "CommonJS와 ES Modules 비교. 동기/비동기, 트리셰이킹, Top-level await."
tags: [javascript, 모듈, CS]
---

## 모듈
한 파일에 모든 기능을 다 때려 박으면 가독성도 떨어지고 유지 보수도 힘듭니다.
그래서 기능별로 파일을 나누어 쓰는데, 이것을 '모듈'이라고 합니다.

![](/jh/media/9784dcd0-2e46-457f-b131-eb65f3880a3b.png)
특정 기능을 하는 JavaScript 파일 하나가 곧 모듈입니다.

## 모듈 시스템
모듈 시스템은 모듈을 가져오고, 내보내고, 사용하는 등의 기능을 제공해 코드를 구조화하고 관리하는 시스템입니다.

대표적인 모듈 시스템에는 CommonJS와 ES Modules이 있습니다.
### CommonJs
CommonJS는 전통적인 방식으로, `require`, `exports` 명령어로 모듈을 가져오고 내보냅니다.
```js
// math.js
function add(a, b) {
  return a + b;
}
module.exports = { add };

// main.js
const math = require('./math');
console.log(math.add(2, 3));
```

### ES Modules
ES Modules은 ES6(ECMAScript 2015)에서 도입된 모듈 시스템으로, `import`, `export`로 모듈을 가져오고 내보냅니다.
`.mjs` 확장자를 사용하거나, `package.json`에서 `"type": "module"`을 설정하여 사용할 수 있습니다.
```js
// math.mjs
export function add(a, b) {
  return a + b;
}

// main.mjs
import { add } from './math.mjs';
console.log(add(2, 3));
```

## CommonJS vs ES Modules

### 정적, 동적 import 용어 정리
정적 import는 빌드 타임에 결정되고, 동적 import는 런타임에 결정됩니다.

정적 import는 다음 특징들을 만족해야 합니다.

1. 모듈의 최상위 레벨에서만 사용 가능
```js
// 올바른 사용: 최상위 레벨
import fs from 'fs';

function someFunction() {
    // 잘못된 사용: 함수 내부
    import fs from 'fs';  // 오류!
}
```

2. if문, for문 등의 제어문 안에서 사용 불가
```js
// ❌ 잘못된 사용: 조건문 내부
if (condition) {
    import mod1 from './mod1.js';  // 오류!
} else {
    import mod2 from './mod2.js';  // 오류!
}
```

3. 문자열 리터럴만 사용 가능
```js
// ✅ 올바른 사용: 문자열 리터럴
import myModule from './myModule.js';

// ❌ 잘못된 사용: 변수나 표현식
const modulePath = './myModule.js';
import myModule from modulePath;  // 오류!
```

### 동기적 vs 비동기적 로드

CommonJS
- 동적 import로 **런타임**에 동작
- `require()`는 항상 동기적으로 실행됨

```js
// 정적 import
// 코드의 최상단에 있고 변수를 사용하지 않는 점에서 정적으로 보이지만 실제로는 런타임에 작동
let foo = require("./mod1.js");

// 동적 import
let foo;
if (someCondition) {
    foo = require("./mod1.js");
} else {
    foo = require("./mod2.js");
}

// 또는
const foo = require(someCondition ? "./mod1.js" : "./mod2.js");
```

동기적: 모듈을 불러올 때까지 코드가 블로킹됨
```js
const fs = require('fs'); // 파일 불러올 때까지 기다림
console.log('파일 불러옴');
```

ES Modules
- 정적 import(`import`) **파싱 단계**에 분석됨
- 동적 import(`import()`)는 **런타임**에 실행됨
- 비동기적으로 작동(브라우저 환경에서도 사용될 수 있도록 설계)

정적 import: `import`문
```js
// 유효함
import foo from "./mod1.js";

// 유효하지 않음
if (someCondition) {
    import foo from "./mod1.js";
} else {
    import foo from "./mod2.js";
}
```

동적 import: `import()`문
```js
if (someCondition) {
	const mod1 = await import("./mod1.js");
} else {
	const mod2 = await import("./mod2.js");
}

// 또는
const foo = await import(someCondition ? "./mod1.js" : "./mod2.js").default;
```

비동기적: 다른 코드의 실행을 막지 않음
```js
import fs from 'fs';
console.log('파일 불러오기 전에 이게 찍힘');
```

### 트리셰이킹(Tree Shaking)
트리셰이킹은 미사용 코드를 번들에서 제거하는 최적화 기법입니다.

ES Modules는 정적 분석(코드를 실행하지 않고 단순히 파싱만으로 모듈 간의 의존성을 파악하는 것)이 가능해 번들러가 미사용 코드를 쉽게 탐지하고 제거할 수 있습니다. (다만, `import()`를 사용한 동적 import는 트리셰이킹 대상이 아닙니다.)

CommonJS는 런타임에 모듈을 가져오기 때문에 불필요한 코드를 제거하기 어렵습니다.

mathUtils.js
```js
// 유틸 함수들 (모듈화)
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;
export const divide = (a, b) => a / b;
```

main.js
```js
import { add } from './mathUtils.js';

console.log(add(2, 3));
```

### 최상위 레벨에서 `await`
ES Modules은 최상위 레벨에서 `await`를 사용할 수 있습니다. 코드를 직접 보면 이해가 빠릅니다.

CommonJS
```js
const fetchData = async () => {
  return '데이터';
};

// 함수 밖에서 await를 사용하면 에러가 발생합니다.
(async () => {
  const data = await fetchData();
  console.log(data);
})();
```

ES Modules
```js
const fetchData = async () => {
  return '데이터';
};

// 함수 밖에서도 await 사용이 가능합니다.
const data = await fetchData();
console.log(data);
```

## 모듈 시스템 흐름

![](/jh/media/cde1760e-5204-4a62-a31c-14d7724e5ef4.png)

출처: 재그지그,  https://wormwlrm.github.io/2020/08/12/History-of-JavaScript-Modules-and-Bundlers.html

---

## 참고 링크

- [자바스크립트의 표준 정의: CommonJS vs ES Modules - Medium](https://medium.com/@hong009319/%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8%EC%9D%98-%ED%91%9C%EC%A4%80-%EC%A0%95%EC%9D%98-commonjs-vs-es-modules-306e5f0a74b1)
- [What is the meaning of static import in ES6? - Stack Overflow](https://stackoverflow.com/questions/52965907/what-is-the-meaning-of-static-import-in-es6)

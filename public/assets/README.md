# 게임 이미지 에셋 구조

## 폴더 구조
```
assets/
├── restaurant/          ← 🍽️ 식당 시나리오
│   ├── backgrounds/     ← 배경 이미지
│   └── characters/
│       └── sarah/       ← NPC: SARAH (웨이터)
│           ├── expressions/  ← 표정 변화
│           └── motions/      ← 상황별 모션
│
├── airport/             ← ✈️ 공항 시나리오
│   ├── backgrounds/
│   └── characters/
│       └── mike/        ← NPC: MIKE (항공사 직원)
│           ├── expressions/
│           └── motions/
│
└── hotel/               ← 🏨 호텔 시나리오
    ├── backgrounds/
    └── characters/
        └── emma/        ← NPC: EMMA (프런트 직원)
            ├── expressions/
            └── motions/
```

## 이미지 규격 권장사항

### 배경 이미지 (backgrounds/)
- 파일명: `main.png`, `night.png`, `day.png` 등
- 해상도: 1080×1920px (모바일 세로 기준)
- 포맷: PNG 또는 WebP
- 예시: `restaurant/backgrounds/main.png`

### 캐릭터 기본 이미지 (characters/[name]/)
- 파일명: `default.png`
- 해상도: 600×900px (반신 캐릭터)
- 배경: 투명(PNG)

### 표정 변화 (expressions/)
| 파일명 | 설명 |
|--------|------|
| `neutral.png` | 기본 표정 |
| `happy.png` | 기쁜/환영 표정 |
| `surprised.png` | 놀란 표정 |
| `thinking.png` | 생각하는 표정 |
| `sad.png` | 실망한 표정 |

### 상황별 모션 (motions/)
| 파일명 | 설명 |
|--------|------|
| `greeting.png` | 인사하는 모션 |
| `waiting.png` | 기다리는 모션 |
| `explaining.png` | 설명하는 모션 |
| `approving.png` | 승인/OK 모션 |
| `writing.png` | 메모/기록 모션 |

## 코드에서 사용하는 방법

이미지를 폴더에 넣으면 `GameScene.tsx`에서 다음과 같이 참조됩니다:

```tsx
// 배경
<img src={`/assets/${scenarioSlug}/backgrounds/main.png`} />

// NPC 캐릭터 (표정)
<img src={`/assets/${scenarioSlug}/characters/${npcSlug}/expressions/${expression}.png`} />

// 표정이 없으면 자동으로 이모지 폴백
```

scenarioSlug: `restaurant` | `airport` | `hotel`
npcSlug: `sarah` | `mike` | `emma`

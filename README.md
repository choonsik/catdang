# 🐾 캣당 (CatDang) · 온라인 고양이 평화 공원

> **"발소리도 숨소리도 조용한 동화 속 공원.  
> 귀여운 고양이가 되어 친구들과 함께 산책하고, 캣타워에 올라 식빵을 구우세요."**

[![Deploy CatDang to GitHub Pages](https://github.com/choonsik/catdang/actions/workflows/deploy.yml/badge.svg)](https://github.com/choonsik/catdang/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fchoonsik.github.io%2Fcatdang%2F-blue?style=flat&logo=github)](https://choonsik.github.io/catdang/)

'청계천 산책', '세월낚시터', '무교당', '길냥이 책방' 등 웹 브라우저에서 가볍게 접속해 일하거나 공부하며 곁에 켜두는 **'산사라이크(Sansa-like)' 앰비언트 메타버스 문화**에서 영감을 받은 **100% 영구 무료(0원) 고양이 중심 힐링 웹 메타버스** 프로젝트입니다.

👉 **지금 바로 플레이하기**: [**https://choonsik.github.io/catdang/**](https://choonsik.github.io/catdang/)

---

## 🏛️ 참고한 레퍼런스 ('산사라이크' 모음)

본 프로젝트는 웹 기반 켜두는 힐링 메타버스 문화를 이끈 다양한 선행 레퍼런스들의 정수를 벤치마킹하여 제작되었습니다:

| 서비스명 | URL | 주요 특징 및 영감 요소 |
| :--- | :--- | :--- |
| **청계천 산책** | [cheonggye-healing.vercel.app](https://cheonggye-healing.vercel.app/) | Three.js 경량 3D 지형, '산책하기' vs '멍때리기' 2트랙 UX, 실시간 Web Audio 합성 |
| **세월낚시터** | [studio-meot.github.io/sewol](https://studio-meot.github.io/sewol/) | 곧은 바늘로 세월을 낚는 강가, 한지·먹빛 한국적 미학, 고운바탕 웹폰트, 100% 무료 GitHub Pages 호스팅 |
| **무교당** | [mugyo.zacra007.workers.dev](https://mugyo.zacra007.workers.dev/) | 45억 년 시간과 은하를 걸으며 쉬는 '멍마당', 걷기·앉기·눕기 액션, 경량 P2P 통신 |
| **길냥이 책방** | [stray-cat-books.pages.dev](https://stray-cat-books.pages.dev/) | 고양이가 되어 서점 평대를 둘러보는 3D 책방, 귀여운 냥이 모션 및 상호작용 |
| **온라인 경주** | [gyeongjuwalk.com](http://www.gyeongjuwalk.com/) | 첨성대와 대릉원 능(陵)을 바라보는 고요한 여백의 미 |
| **온라인 사우나** | `saunagoyo.com` | 장작 타는 소리와 수증기 속 멍때리기 ASMR |
| **소원트리 만들기** | `thevisl.com/xmas` | 익명 방문자들의 따뜻한 소원과 메시지 공유 |
| **순례길 걷기** | `sanctuary.dxstudiobiz.workers.dev` | 천천히 길을 걸으며 마음을 정돈하는 순례 인터랙션 |
| **온천마을** | `onsenvillage.com` | 밤하늘과 등불 아래 온천물 소리를 듣는 힐링 공간 |

---

## ✨ 핵심 기능

### 1. 🌈 4대 정예 테마 공간 (World System)
상단 헤더의 `[📍 공간 이동]` 버튼을 눌러 언제든 원하는 감성의 공간으로 순간이동할 수 있습니다.
- **🌳 평화 공원 (`park`)**: 백옥 대리석 & 황금 고양이 분수대, 솟구치는 물기둥, 크림 베이지 곡선 오솔길, 아치 다리와 연못, 벤치와 츄르 매점
- **👾 레트로 도트 마을 (`pixel`)**: 아기자기한 8-bit 고전 게임 스타일의 픽셀 타일과 미니 가옥
- **🕊️ 하늘을 나는 고양이 (`sky`)**: 솜사탕 구름 천공섬과 무지개 다리, 날개 달린 고양이들의 유영 (낭떠러지 낙하 방지 안전 경계 구축)
- **🪵 포근 다락방 찻집 (`attic`)**: 타닥타닥 벽난로와 찻상, 탁 트인 남쪽 테라스와 4대 캣타워·캣워크 3D 등반 시스템 (오른쪽 오픈 뷰 디오라마)

### 2. 🐾 스페이스바 '폴짝!' 점프 물리 & 캣타워 3D 등반
- **포물선 도약 & 착지 스쿼시 탄성**: 스페이스바를 누르면 체공 곡선을 그리며 도약하고, 착지 시 젤리 발바닥 충격 흡수(Squash) 모션 발생
- **3D 플랫폼 높이맵 연동**:
  - 다락방의 **초대형 4단 캣 콘도(2.75m)**, **나선형 캣타워(2.75m)**, **벽면 캣워크 및 벽난로 상단(2.6m)**, **테라스 바스켓(1.2m)** 계단을 차례차례 밟고 뛰어올라 꼭대기 구름 조망대까지 등반 가능
  - 소파, 찻상, 공원 벤치 위에도 점프로 훌쩍 뛰어올라 앉아 쉴 수 있음

### 3. 🌐 서버비 0원 실시간 P2P 멀티플레이어
- **WebRTC P2P (PeerJS)**: 중앙 게임 서버 없이 브라우저 간 직접 통신으로 영구 서버 유지비 0원 달성
- 전 세계 접속자들의 고양이 위치, 방향, 점프, 모션 실시간 동기화
- 카툰 말풍선 채팅 및 닉네임 표시

### 4. 🐱 살아 숨쉬는 자율 냥이 생태계 (AI)
- 혼자 접속해도 외롭지 않도록 `보리(삼색)`, `치즈(치즈냥)`, `까망(깜냥)`, `턱시(턱시도)` 등의 자율 냥이들이 각 공간을 사뿐사뿐 거닐며 식빵을 굽고 기지개를 켭니다.

### 5. 🎵 Web Audio 실시간 사운드스케이프
- 외부 음원 스트리밍 0B, 100% 코드 기반 실시간 신디사이징
- 도약 점프음(`playJump`) 및 푹신한 착지음(`playLand`)
- 저주파 진동 **골골송(Purr)** (식빵 구울 때 증폭) + 영롱한 묘당 풍경(鈴) + 바람 소리

---

## 🎮 조작 방법

| 조작키 / 버튼 | 기능 |
| :--- | :--- |
| **`W, A, S, D` / 방향키** | 고양이 사뿐사뿐 4방향 이동 |
| **`Spacebar` / [🐾 폴짝!]** | **폴짝 점프! (캣타워 계단 등반, 벤치/소파 오르기)** |
| **`E` 키 / [🐱 야옹!]** | 야옹 울기 & 귀여운 말풍선 띄우기 |
| **[🍞 식빵 굽기]** | 웅크려 식빵 굽기 (실시간 골골송 사운드 ON) |
| **[🧘 기지개]** | 앞다리 쭉 뻗고 시원하게 기지개 켜기 |
| **[🌿 멍때리기]** | 카메라가 공간을 천천히 회전하며 비추는 시네마틱 힐링 뷰 |
| **마우스 바닥 클릭** | 원하는 지점으로 자동 사뿐사뿐 이동 (Click-to-Move) |
| **마우스 드래그 / 휠** | 시점 패닝(Pan) 및 부드러운 줌인/줌아웃 |
| **하단 채팅창** | 엔터 키로 머리 위에 실시간 카툰 말풍선 띄우기 |

---

## 🛠️ 기술 스택

- **Frontend Core**: [Vite 5](https://vitejs.dev/) + Vanilla JavaScript (ES Module)
- **3D Graphics**: [Three.js r160](https://threejs.org/) (OrthographicCamera 2.5D, PCFSoftShadowMap)
- **Physics**: 자체 구현 초경량 3D 플랫폼 높이맵 & 슬라이딩 충돌 엔진 (`src/physics.js`)
- **P2P Network**: [PeerJS](https://peerjs.com/) (WebRTC DataChannel - 서버비 0원)
- **Audio Engine**: Web Audio API (실시간 오실레이터, 노이즈 필터, 사운드 합성)
- **CI/CD & Hosting**: GitHub Pages + GitHub Actions (`.github/workflows/deploy.yml`)

---

## 🚀 로컬 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/choonsik/catdang.git
cd catdang

# 2. 의존성 설치
npm install

# 3. 로컬 개발 서버 실행
npm run dev

# 4. 프로덕션 빌드 (압축 번들링)
npm run build
```

브라우저에서 `http://localhost:5173/` 접속!  
*(브라우저 창을 2개 띄워 서로 다른 닉네임으로 입장하면 실시간 P2P 멀티플레이를 즉시 테스트할 수 있습니다.)*

---

## 📁 프로젝트 구조

```text
catdang/
├── .github/workflows/
│   └── deploy.yml            # GitHub Pages 자동 배포 CI/CD 파이프라인
├── docs/                     # 기획서, 워크스루 및 레퍼런스 일러스트
│   ├── PLAN.md               # 초기 기획 및 아키텍처 설계서
│   ├── WALKTHROUGH.md        # 최종 구현 워크스루 보고서
│   └── reference_isometric_park.png # 디자인 기준 일러스트
├── src/
│   ├── audio.js              # Web Audio 골골송/풍경/점프/착지 실시간 합성기
│   ├── cat.js                # 고양이 3D 모델, 애니메이션, 점프 물리, 말풍선
│   ├── network.js            # WebRTC P2P 멀티플레이어 & 자율 냥이 AI
│   ├── physics.js            # 3D 플랫폼 높이맵 & 슬라이딩 충돌 감지 엔진
│   ├── world.js              # 월드 베이스 클래스
│   ├── worlds/
│   │   ├── index.js          # 월드 정의 및 팩토리
│   │   ├── park.js           # 🌳 평화 공원 (분수대, 곡선 오솔길, 아치 다리)
│   │   ├── pixel.js          # 👾 레트로 도트 마을 (8-bit 타일)
│   │   ├── sky.js            # 🕊️ 하늘을 나는 고양이 (구름 천공섬)
│   │   └── attic.js          # 🪵 포근 다락방 찻집 (루프탑 테라스, 4대 캣타워)
│   └── main.js               # 카메라 조작, UI 바인딩, 메인 렌더 루프
├── index.html                # 엔트리 HTML & 미니멀 UI
├── style.css                 # 파스텔 공원 테마 & 글래스모피즘 스타일
├── vite.config.js            # 프로덕션 번들링 & 청크 분할 설정
└── package.json
```

---

## 📄 라이선스
MIT License © 2026 choonsik

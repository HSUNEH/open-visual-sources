# Open Visuals

오픈소스의 결과물을 직접 보고 만지는 전체 화면 전시. 제공된 `index-opensource.csv`에서 고른 20개 항목과 요청한 Tileable Volume Noise 참고 작품을 네 테마로 묶었습니다. 총 21개이며 첫 화면은 fishdraw입니다. 사용자 요청으로 Lenia와 사운드 테마는 전시에서 제외했습니다. 이전 원본 스냅샷과 라이선스는 출처 보존을 위해 유지합니다.

**가벼운 체험 추가**: Mapgen4는 산맥·평지·바다를 그리며 강수량을 조절합니다. Soft Physics는 원본 XPBD 솔버로 말랑한 토끼와 매달린 천을 직접 잡아 변형합니다. 블랙홀은 원본의 큰 별 텍스처 메모리 요구량 때문에 이번 추가에서 제외했습니다.

**Neural CA**: 도마뱀·나비·무당벌레의 일부를 드래그해서 지우면 남은 세포들이 학습한 형태를 복원합니다. ‘세포 성장 속도’를 0.25–4배로 조절해 성장과 복원을 관찰할 수 있습니다(모바일 포함). 클릭 가능한 ‘한 조각 지우기’와 ‘씨앗부터 다시’도 제공합니다. 임의의 입력 사진을 변환하는 기능이 아니라, 사전 학습된 목표 형태로 자라나는 원본 신경망입니다. 모두 지운 상태에서는 자동 복원이 불가능하므로 씨앗을 다시 시작하세요.

최근 추가: **p5.brush, Path Tracing**, 그리고 **Sandspiel, Field Play, Wave Function Collapse**. 원본 질감 붓, 재질별 광선 추적기, Rust/WASM 셀룰러 솔버, GPU 벡터장 엔진, WFC JavaScript 포트를 로컬에서 실행합니다. Primitive에는 고흐 〈아를의 침실〉, 모네 〈수련〉, 호쿠사이 〈큰 파도〉를, Threading에는 얼굴 중심으로 자른 모나리자·진주 귀걸이 소녀·고흐 자화상을 제공합니다.

체험 개선: ln은 도시·구의 군집·산의 능선을 3초 주기로 바꾸며, 선 위에서 채취한 9,000개의 작은 입자가 1초 동안 흩어졌다 다음 선화로 모입니다. 다음 장면의 계산이 늦으면 현재 장면을 유지합니다. Fluid는 클릭 없이 마우스를 움직이면 색을 주입하며 터치는 기존 그리기 동작을 유지합니다. 페이지 진입 시 암호학적 난수 시드를 사용해 물고기와 산수가 다시 그려집니다. Primitive는 SVG, Threading은 1200px 선화로 출력합니다. Delaunay는 커서 미리보기와 점 추가·드래그·삭제, 영역/삼각형 비교를 지원합니다. Volume noise는 움직이는 밀도장의 입체와 같은 위치의 단면을 나란히 보여 줍니다. Motion에는 진자·도미노와 수동 형태 보간을 제공합니다.

## 실행

```sh
npm ci
npm run dev
```

기본 주소: http://127.0.0.1:5173

```sh
npm run build
npm run preview
```

`main` 브랜치에 push하면 GitHub Actions가 테스트·빌드 후 GitHub Pages에 배포합니다.

- 웹: https://hsuneh.github.io/open-visual-sources/
- 저장소: https://github.com/HSUNEH/open-visual-sources
- 저장소 하위 경로로 빌드: `PAGES_BASE_PATH=/open-visual-sources/ npm run build`
- 원본 CSV와 로컬 작업 기록은 공개 저장소에 포함하지 않습니다.

`dist/`는 다른 정적 호스팅에도 배포할 수 있습니다. 로컬 개발은 `/`, Pages는 `/open-visual-sources/`를 사용하며 이미지·Worker·원본 시뮬레이터도 동일한 경로 기준을 따릅니다.

## 탐색

- 위아래 스크롤·스와이프: 같은 테마의 작품 이동.
- 마우스 휠·트랙패드는 작품 위와 바깥 여백 모두 한 제스처에 한 작품씩 이동하며, 잔여 관성은 중복 이동으로 처리하지 않습니다. 터치 스와이프는 기본 스크롤을 유지합니다.
- 좌우 스크롤·스와이프와 상단 메뉴: 테마 이동. 테마별 마지막 위치를 기억합니다.
- 방향키: 테마와 작품 이동. 스페이스: 움직임 일시정지. 입력 컨트롤 조작 중에는 해당 컨트롤의 키 동작을 우선합니다.
- 작품 목록: 이름·작가·테마 검색. URL 해시로 작품에 바로 연결할 수 있습니다.
- 작품과 코드: 작가, 구현 방식, 원본 저장소, 라이선스 확인.
- 전체 화면 아이콘: 브라우저 창 크기 안에서 UI를 숨겨 작품만 감상. Escape로 복귀.
- 이미지 업로드는 브라우저 내부에서 처리하며 서버로 전송하지 않습니다. 10MB 이하 JPG/PNG/WebP/AVIF 권장. 정사각형으로 중앙 크롭합니다.

## 전시와 실제 구현

| 테마 | 항목 | 실행 코드 |
|---|---|---|
| 계속 생성 | fishdraw | Lingdong Huang 원본 JS, Web Worker 실행, SVG 저장 |
| 계속 생성 | Shan Shui Infinite | Lingdong Huang 원본 HTML/JS, 별도 프레임 안에서 자동 이동, SVG 저장 |
| 계속 생성 | ln | `@lnjs/core` 실제 브라우저 포트, Worker 은선 제거 |
| 계속 생성 | Volume noise | TileableVolumeNoise 원리를 참고한 자체 GLSL 레이마칭. 원본 C++는 실행하지 않음 |
| 계속 생성 | Field Play | 원본 GPU 벡터장 엔진, 65,536개 입자 · 전시용 수식 3종 |
| 계속 생성 | Wave Function Collapse | kchapelier 실제 JS 포트, mxgmn 원본 꽃밭·길·미로 표본. Worker에서 단계별 제약 전파 |
| 직접 만지기 | Mapgen4 | Red Blob Games 원본 지형·강 생성기와 WebGL2 렌더러. 산맥·평지·바다 그리기 및 강수량 조절 |
| 직접 만지기 | WebGL Fluid Simulation | Pavel Dobryakov 원본 GPU 유체 솔버. 마우스 호버·터치 그리기·색 주입·소용돌이 |
| 직접 만지기 | p5.brush | 원본 독립 실행형 WebGL2 붓 엔진. 수채화·연필·목탄, 5색 팔레트, 직접 그리기·PNG 저장 |
| 직접 만지기 | Growing Neural Cellular Automata | Distill 원본 WebGL 엔진 + ex3 복원 학습 모델 3종. 실제 16채널 세포 상태 삭제·성장·복원 |
| 직접 만지기 | Sandspiel | 원본 Rust/WASM 셀룰러 솔버. 8개 물질 붓, 모래와 얼음·작은 숲. 자체 Canvas 렌더러; GPU 바람/압력 솔버 제외 |
| 직접 만지기 | Primitive | `ondras/primitive.js`의 실제 Shape/Step/Canvas/State 코드. 전시용 수명·스케줄 어댑터 추가 |
| 직접 만지기 | Threading | 자체 작성한 탐욕적 실선 근사 체험. piellardj 원본 코드를 포함하지 않으며 원본 데모 링크 제공 |
| 직접 만지기 | d3-delaunay | 실제 Delaunay / Voronoi 라이브러리 |
| 3D 공간 | Origami Simulator | Amanda Ghassaei 원본 GPU 동적 솔버. 물폭탄·미우라·종이학 패턴과 접힘 조절 |
| 3D 공간 | Soft Physics | Ten Minute Physics 원본 XPBD 소프트바디·천 솔버. 직접 잡기·단단함·누르기/바람 |
| 3D 공간 | Path Tracing | Erich Loftis 원본 Material Roughness 장면·GLSL 광선 추적. 유리·금·구리 및 시점 이동 |
| 3D 공간 | Three.js | Three.js + React Three Fiber로 작성한 회전 조각 |
| 3D 공간 | Three Mesh BVH | 40,960개 삼각형의 자체 지형과 실제 가속 레이캐스트. 자동 스캔·포인터 탐사 |
| 움직임과 패턴 | Matter.js | 실제 물리 엔진, 물체 생성·드래그·중력 조절 |
| 움직임과 패턴 | Flubber | 실제 윤곽 보간 라이브러리 |

Threading과 Volume noise는 원본 프로젝트를 그대로 옮긴 전시가 아닌 **원리 체험용 데모**입니다. 나머지도 자체 장면을 사용하는 라이브러리와 원본 작품을 구분해 앱에 표기합니다. 추후 원본 Threading 통합 시 iframe 초기화 제한과 GPL 배포 요건을 확인해야 합니다.

## 디자인 출발점

전시 작품이 중심이므로 **Motion의 테마 이동 피드백 + 직접 디자인한 얇은 전시 UI**를 선택했습니다. Three.js / React Three Fiber는 3D 작품 실행에 사용하고, 선화에는 SVG·Canvas를 유지합니다.

## 구성

Mapgen4는 고정 커밋 `c1d8cb018a11a8b9e17d59233c36c176429d37eb`을 체크아웃하고 의존성을 설치한 뒤 `node scripts/vendor-mapgen.mjs /path/to/mapgen4`로 생성합니다. 원본 소스와 설치 잠금 파일, 의존성 라이선스, 생성물 해시는 `public/vendor/mapgen/` 및 `mapgen-manifest.json`에 있습니다. 빌드 어댑터만 격자 간격을 10으로, 내부 버퍼를 1024px, 출력 캔버스를 768px로 제한합니다. 지형 계산은 Worker에서 입력이 있을 때만 수행합니다. 새로운 장면은 crypto 랜덤 시드를 사용합니다.

Soft Physics는 `node scripts/vendor-physics.mjs`로 고정 커밋의 MIT 데모 10·15를 받습니다. 원본 파일을 보존하고 전시용 어댑터로 333점 토끼 한 개 또는 900점 천, 8 substeps, DPR 최대 1.5, 무그림자 조명을 설정합니다. 물체 추가 기능은 노출하지 않습니다. 작품이 비활성화되면 iframe이 제거되고, 일시정지 시 계산·렌더링 RAF가 중단됩니다. 성능은 기기별로 다릅니다.

NCA는 `node scripts/vendor-nca.mjs`로 Distill의 고정 커밋에서 원본 엔진·가중치를 받습니다. `public/vendor/nca-manifest.json`에 URL과 해시를 기록합니다. 원본 소스는 수정하지 않으며, 64×64 격자·지우기 입력·일시정지·모델 교체·성장 배속은 전시용 래퍼가 담당합니다. 1배는 초당 180회 업데이트를 목표로 하며, 느린 기기에서는 프레임당 최대 12회로 제한합니다. 드래그 중에는 성장을 잠시 멈추고 놓으면 재개합니다. 기본 WebGL로 동작하며 학습이나 서버 추론은 실행하지 않습니다. 원본 엔진 Apache-2.0, 배포 모델 저장소 CC BY 4.0, 당시 목표 Noto Emoji 이미지 Apache-2.0을 각각 고지합니다.

p5.brush·Path Tracing은 `node scripts/vendor-brush-pathtrace.mjs`로 고정 커밋의 원본을 받으며, `public/vendor/brush-pathtrace-manifest.json`에 해시를 보관합니다. 붓의 자동 꽃 그림과 조작부는 전시용 코드입니다. 광선 추적은 원본 재질 비교 장면을 사용하고 포인터 잠금을 비활성화했습니다. 두 엔진 모두 WebGL2가 필요합니다.

`src/catalog.js`는 테마·작품·출처의 단일 목록입니다. `src/scenes/`는 매체별 지연 로딩 구현입니다. 현재 보이는 작품만 마운트되며 이전 작품의 Worker, 타이머, 물리 엔진, 오디오를 정리합니다. `prefers-reduced-motion`에서는 일시정지 상태로 시작합니다.

`public/vendor/`에는 수정하지 않은 upstream 소스와 저작권·라이선스 원문이 있습니다. `manifest.json`에 다운로드 출처와 SHA-256을 기록했습니다. 초기 vendoring을 재현하거나 의도적으로 갱신할 때 `npm run vendor`를 사용합니다. 이 명령은 upstream의 현재 master를 받으므로 업데이트 시 변경 내용을 검토해야 합니다.

Sandspiel·Field Play·WFC 표본은 `node scripts/vendor-expansion.mjs`로 고정된 커밋에서 받습니다. `public/vendor/expansion-manifest.json`이 URL과 SHA-256을 기록합니다. Field Play의 원본 사이트 UI·분석 태그는 로딩하지 않으며 마이크/녹음 기능을 노출하거나 시작하지 않습니다. WFC는 성공하면 멈추고 다시 생성 버튼으로 재시도합니다.

추가된 네 시뮬레이터와 명화는 `npm run vendor:exhibits`로 다운로드하며, `public/vendor/exhibits-manifest.json`에 출처와 해시를 기록합니다. 기본적으로 로컬 스냅샷을 유지하고 `-- --refresh`를 지정해야 새로 받습니다. 이미지의 CC0 근거·미술관 레코드·Wikimedia 배포 경로는 `public/artworks/`에 보관합니다.

`src/scenes/Originals.jsx`는 원본 HTML을 로컬 iframe으로 감싸고 외부 추적 스크립트·불필요한 원본 메뉴를 제거합니다. 별도 어댑터로 컨트롤을 연결하며, 원본 파일 자체는 수정하지 않습니다. GPU 작업의 프레임 루프와 발성 오디오는 전시의 일시정지에 연동합니다. 프레임 위에서도 휠과 방향키로 전시를 이동할 수 있습니다. 터치로 작품을 조작할 때에는 하단 다음 작품 버튼·상단 테마 메뉴로 이동하세요.

`qa/mobile.html`은 개발 서버 전용 390×844 iframe 테스트 틀입니다. 프로덕션 빌드의 진입점이 아니며 배포되지 않습니다. 터치 기기 자체를 대신하는 테스트는 아닙니다.

모바일은 작품 우선 배치입니다. 프리셋은 작품 위에 남기고, 슬라이더·이미지 선택·저장·팔레트는 하단 ‘조작’ 패널에서 엽니다. 패널을 닫아도 엔진과 설정은 유지됩니다. 설명·작가·출처는 ‘작품 정보’에서 확인하며, ‘작품만 보기’는 데모 영역을 더 넓힙니다. 320×568, 390×844, 가로 844×390 레이아웃과 Chromium 마우스 조작을 확인했습니다. 실제 iOS/Android 터치와 Safari 검증은 별도로 필요합니다.

## 확인 범위

Vite 프로덕션 빌드, Aside 브라우저의 작품별 실제 렌더링, 테마/작품 이동, 데스크톱 및 모바일 CSS 뷰포트 390×844를 확인했습니다. 보존된 Lenia 소스의 기존 회귀 테스트는 유지하지만 활성 전시에는 포함하지 않습니다. Safari·실기기 터치·성능 하위 기기의 WebGL은 별도 검증 대상입니다. 3D 모듈은 약 1MB의 지연 로딩 청크이며 첫 2D 작품 진입 시에는 로드하지 않습니다.

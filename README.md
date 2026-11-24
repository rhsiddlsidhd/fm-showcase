# FM Showcase

Frontend Mentor 챌린지 구현물을 모은 단일 페이지 쇼케이스. 챌린지 카드를 누르면 그 챌린지의 구현 화면으로 이동한다.

이 프로젝트의 목적은 사이트 자체보다, AI가 작성한 코드를 신뢰할 근거를 구조로 갖추는 데 있다. 사이트는 그 구조 아래에서 만든 수단이자 결과물이다. 자세한 내용은 [프로젝트 방법론](#프로젝트-방법론)에 있다.

지금까지 구현한 챌린지는 Room homepage와 Weather app이다.

## 기술 스택

| 영역          | 선택                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 빌드          | Vite                                                                                                                                        |
| 언어          | TypeScript                                                                                                                                  |
| UI 라이브러리 | React (React Compiler 적용)                                                                                                                 |
| 스타일링      | Tailwind CSS                                                                                                                                |
| 컴포넌트      | shadcn/ui (Base UI 기반, 소스를 저장소에 복사해 사용)                                                                                       |
| 애니메이션    | Motion                                                                                                                                      |
| 라우팅        | React Router                                                                                                                                |
| 테스트        | Vitest, React Testing Library (jsdom, user-event, jest-dom), MSW, Playwright (E2E)                                                          |
| 린트·포맷     | ESLint (typescript-eslint, react-hooks, jsx-a11y, testing-library, better-tailwindcss, check-file), Stylelint, Prettier (Tailwind 플러그인) |
| 아키텍처 린터 | Steiger (`@feature-sliced/steiger-plugin`) — FSD 디렉토리 구조 검사                                                                         |
| 런타임        | Node.js 24.17.0 (`Dockerfile`과 CI 워크플로에 지정)                                                                                         |
| 배포          | Vercel                                                                                                                                      |
| AI 개발 도구  | OMC (외부 도구, `ralplan`, `tdd`, `verify`)                                                                                                 |

## 시작하기

### 요구사항

- Node.js 24.17.0 이상. git 훅이 TypeScript 파일을 `node`로 바로 실행하므로 이 버전이 필요하다.
- Docker (선택). Docker로 개발 서버를 띄울 때만 필요하다.

### 설치

```bash
git clone https://github.com/rhsiddlsidhd/fm-showcase.git
cd fm-showcase
npm ci
git config core.hooksPath scripts/features/git-hooks
```

마지막 줄은 로컬 git 훅을 켠다. 훅은 커밋 메시지·브랜치 이름 규칙과 AI 관여 선언을 검사하고, `main`에 직접 커밋·push하는 것을 막는다. 훅은 조기 피드백용이며, 최종 판정은 CI가 한다.

### 개발 서버 실행

호스트에서 직접 실행:

```bash
npm run dev
```

Docker로 실행:

```bash
docker compose up
```

둘 다 `http://localhost:5173`에서 열린다. Docker는 `docker compose down`으로 종료한다.

Docker를 쓰는 중에 `package.json`이나 `package-lock.json`이 바뀌면(`git pull` 포함) 이미지를 다시 만든다.

```bash
docker compose build
docker compose down -v
docker compose up
```

### E2E 테스트 준비

`npm run test:e2e`를 처음 실행하기 전에 브라우저를 설치한다.

```bash
npx playwright install chromium
```

### 스크립트

| 명령                   | 용도                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run dev`          | 개발 서버                                                                 |
| `npm run build`        | 타입 검사 후 프로덕션 빌드                                                |
| `npm run preview`      | 빌드 결과 미리 보기                                                       |
| `npm run test`         | 테스트를 한 번 실행                                                       |
| `npm run test:e2e`     | 빌드한 앱을 띄워 Playwright E2E 테스트를 실행                             |
| `npm run typecheck`    | 앱과 스크립트의 타입 검사                                                 |
| `npm run lint`         | ESLint                                                                    |
| `npm run lint:fsd`     | Steiger. FSD 디렉토리 구조 검사 ([아키텍처](docs/architecture/README.md)) |
| `npm run lint:css`     | Stylelint. 슬라이스의 CSS 파일 검사                                       |
| `npm run format`       | Prettier로 파일을 고친다                                                  |
| `npm run format:check` | Prettier 검사. 파일을 고치지 않는다 (CI가 쓴다)                           |

## 환경 변수

필요한 환경 변수는 없다. `.env` 파일 없이 바로 실행된다.

## 외부 API

| API                                                           | 쓰는 곳     | 인증    |
| ------------------------------------------------------------- | ----------- | ------- |
| [Open-Meteo](https://open-meteo.com/en/docs) (예보, 지오코딩) | Weather app | 키 없음 |

키가 필요하거나 CORS를 막은 API는 브라우저에서 직접 부르지 않고 루트 `api/`의 Vercel Functions로 중계한다([ADR 0001](adr/0001-external-api-vercel-functions.md)).

## 기여 방법

1. `main`에서 규칙에 맞는 이름으로 브랜치를 만든다. 브랜치·커밋·PR 규칙은 [`docs/git/README.md`](docs/git/README.md)에 있다.
2. 커밋 메시지에 AI 관여를 선언한다. AI가 관여했으면 `Co-Authored-By` 트레일러를, 관여하지 않았으면 `AI-Assisted: none` 트레일러를 단다.
3. push 전에 로컬에서 CI와 같은 검사를 돌린다.

   ```bash
   npm run typecheck && npm run lint && npm run lint:fsd && npm run lint:css && npm run format:check && npm run test && npm run build && npm run test:e2e
   ```

4. PR을 연다. 본문은 [PR 템플릿](.github/pull_request_template.md)을 따른다.
5. `main`은 보호된다. PR과 CI(`verify`) 통과가 필수이고, merge commit으로만 합친다.

코드 위치, 테스트, 화면 규칙 등 작업별 문서는 [`AGENTS.md`](AGENTS.md)의 Context 표에서 찾는다.

## 프로젝트 방법론

### 목표

OMC(oh-my-claudecode, Claude Code용 플러그인)를 만들지 않고 가져다 쓰되, 그 위에 결정론적 구조를 얹어 AI의 비결정성을 통제하고, 통제가 작동했다는 근거를 저장소에 남긴다.

- 증명하는 것은 AI 도구를 만드는 능력이 아니라, 외부 도구를 가져와 의도대로 통제하는 능력이다.
- 쇼케이스 사이트는 그 통제 아래 만든 **수단이자 결과물**이다.

### 결정

| 결정                                                 | 기록                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| OMC 위에 결정론적 구조를 얹는다                      | [ADR 0002](adr/0002-ai-control-deterministic-structure-on-omc.md)   |
| 기계로 판정할 수 있는 기준은 설정·검증 코드로 올린다 | [ADR 0003](adr/0003-criteria-config-and-verification-code-first.md) |

### 증거

증거는 주장을 받치는 개별 산출물이다. 브라우저 UI가 아니라 저장소와 GitHub에 남긴다. 구현된 것과 아닌 것은 상태 열에서 구분한다.

| 주장                              | 증거                                                                       | 만드는 주체                           | 상태                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 병합된 코드는 검증을 통과했다     | CI(`verify`) 실행 결과. 커밋 SHA에 결속되고, `main` 보호가 통과를 강제한다 | GitHub Actions (결정론)               | 있음                                                                                                                                                                        |
| 테스트를 구현보다 먼저 썼다       | 작업 브랜치의 커밋 순서(테스트 → 구현)와 그 이력의 보존(merge commit)      | git (결정론)                          | 이력 보존만 있음. 순서를 CI가 재현해 확인하지는 않는다                                                                                                                      |
| AI와 사람의 기여가 구분된다       | 커밋의 `Co-Authored-By` 또는 `AI-Assisted: none` 트레일러                  | 커밋 작성 시 표기                     | 훅을 설정한 로컬에서 `commit-msg` 훅이 선언을 검사한다. 훅의 판정 로직(메시지·브랜치 이름·커밋 대상 브랜치·push 대상)은 테스트로 검증한다. 자기 선언이라 위조는 막지 못한다 |
| AI의 오류를 사람이 걸러냈다       | 오류·교정 사례 (주장 ↔ 실제 결과 ↔ 발견 방법 ↔ 조치)                       | 사람이 작성하고 원본 실행 결과를 링크 | 없음                                                                                                                                                                        |
| 설계 결정의 이유를 설명할 수 있다 | 결정 기록                                                                  | 사람이 작성                           | [`adr/`](adr/)에 쌓는다. 그 전의 결정은 이유가 문서마다 흩어져 있다                                                                                                         |

- 증거는 신뢰를 증명하지 않고 판단의 근거를 준다. CI 통과는 테스트의 품질을 보장하지 않는다.
- 사람이 쓰는 증거는 결정론적이지 않다. 원본 실행 결과를 링크해 확인할 수 있게 한다.
- 한계: 차단이 한 번도 없었던 챌린지는 통과 기록만 남는다.
- 증거는 [면접 문항지](docs/interview/questions.md) 가운데 산출물로 답할 수 있는 문항을 채점한다. 문항지는 목표가 아니라 채점표다.

## 현재 상태

| 항목                                                                                    | 상태                                                                  |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 쇼케이스 사이트                                                                         | 챌린지 카드 목록 구현됨. 난이도·기술 필터는 미구현                    |
| 챌린지 구현                                                                             | Room homepage, Weather app                                            |
| CI (`verify`: typecheck, lint, lint:fsd, lint:css, format:check, test, build, test:e2e) | 구현됨                                                                |
| `main` 보호 (PR 필수, `verify` 통과 필수), merge commit만 허용                          | 적용됨                                                                |
| 로컬 git 훅 (커밋 메시지·이름 규칙과 AI 관여 선언, `main` 직접 커밋·push 차단)          | 구현됨. clone 뒤 [설치](#설치)에서 켜야 한다                          |
| 에이전트 안내 (`AGENTS.md`)                                                             | 문서 인덱스(Context), 우선순위, 하네스 안내                           |
| 테스트                                                                                  | 단위·통합 테스트는 `src/`와 `scripts/`, E2E는 `e2e/`에 있다           |
| 디렉토리 구조 (FSD, Steiger 검사)                                                       | `src/`는 `app`/`pages`/`shared`. `verify`가 Steiger를 돌린다          |
| 증거 모델                                                                               | 정의함([증거](#증거)). 일부 증거는 아직 없다. 검증 로그 훅은 폐기했다 |

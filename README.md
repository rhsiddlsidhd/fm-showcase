# FM Showcase

Frontend Mentor 챌린지 구현물을 모은 단일 페이지 쇼케이스. 챌린지 카드를 누르면 그 챌린지의 구현 화면으로 이동한다. 지금까지 구현한 챌린지는 Room homepage와 Weather app이다.

이 프로젝트의 목적은 사이트 자체보다, AI가 작성한 코드를 신뢰할 근거를 구조로 갖추는 데 있다. OMC(oh-my-claudecode, Claude Code용 플러그인)를 만들지 않고 가져다 쓰되, 그 위에 결정론적 구조를 얹어 AI의 비결정성을 통제하고, 통제가 작동했다는 근거를 저장소에 남긴다. 사이트는 그 통제 아래 만든 수단이자 결과물이다. 주요 결정과 이유는 [`adr/`](adr/)에 있다.

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
git config core.hooksPath .githooks
```

마지막 줄은 로컬 git 훅을 켠다. 훅은 커밋 메시지·브랜치 이름 규칙을 검사하고, `main`에 직접 커밋·push하는 것을 막는다. 이 규칙은 로컬 훅에서만 검사하고, 코드 검사는 CI가 merge 전에 한다.

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

1. 브랜치를 만든다. 이름과 구조(Issue 브랜치, 작업 브랜치)는 [`docs/git/branch.md`](docs/git/branch.md)를, 커밋·PR 규칙은 [`docs/git/README.md`](docs/git/README.md)를 따른다.
2. push 전에 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)의 검사 단계를 로컬에서 차례로 실행한다. 같은 검사를 CI가 다시 돌려 merge 여부를 판정한다.
3. PR을 연다. 본문은 [PR 템플릿](.github/pull_request_template.md)을 따른다.
4. `main`은 보호된다. PR과 CI(`verify`) 통과가 필수이고, merge commit으로만 합친다.

코드 위치, 테스트, 화면 규칙 등 작업별 문서는 [`AGENTS.md`](AGENTS.md)의 Context 표에서 찾는다.

# Issue 규칙

전역 `GIT.md`에는 Issue 규칙이 없다. 이 문서가 이 저장소의 Issue 작성 기준이다.

## 템플릿과 라벨

- Issue는 `.github/ISSUE_TEMPLATE/`의 템플릿 중 하나로 만든다. 템플릿마다 종류 라벨 하나와 제목 접두사가 정해져 있다.
- 템플릿은 바뀌는 파일의 위치가 아니라 Issue가 해결하려는 것으로 고른다. 앱 코드 구조를 위한 변경은 설정 파일만 바꿔도 `refactor`다.
- 기대 동작이 어디에도 정해져 있지 않으면 `bug`가 아니라 `feature`다.
- 종류 라벨은 Issue마다 하나다. 저장소 라벨은 `bug`, `feature`, `refactor`, `docs`, `chore`이고, 이 목록은 GitHub 저장소 설정에 있다.
- 웹이 아닌 `gh`나 MCP로 Issue를 만들면 템플릿이 적용되지 않는다. 템플릿의 칸 구성, 제목 접두사, 라벨을 직접 맞춘다.

## 이유

커밋 접두사는 무엇을 어떻게 바꿨는지를, Issue 라벨은 무엇을 해결해야 하는지를 나타낸다. 한 Issue 안에 여러 접두사의 커밋이 섞이므로 Issue는 커밋과 별개의 라벨을 쓴다.

## 제목

- 제목은 `{prefix}: {한국어 메시지}` 형식으로 쓴다. `prefix`는 고른 템플릿의 제목 기본값이다.
- 메시지에는 해결할 문제나 도달할 상태를 쓴다. 도구·수단 이름은 쓰지 않는다.

## 본문 범위

- 본문에는 템플릿의 칸만 쓴다.
- 해결안(구현 방식·설계), 해결 과정, 결정 경위, 검증 결과, 진행 기록은 Issue 본문과 댓글에 쓰지 않는다. PR 본문에 둔다([`pullRequest.md`](./pullRequest.md)).

Issue에 해결안을 쓰면 조사하기 전에 수단이 정해지고, 실행 세션은 그 설계를 따르기만 한다. 같은 문제를 다른 방법으로 풀 여지를 남기고, 설계는 PR에서 근거와 함께 리뷰한다.

## 관계

- Issue 사이의 관계는 GitHub Relationships로만 건다. 본문에 "선행: #N" 같은 관계 문장이나 순서도를 쓰지 않는다.
- 각 관계는 GitHub 공식 정의대로 쓴다.
  - 상위·하위: [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues)
  - blocked by, blocking: [Creating issue dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies)
  - relates to: [GitHub Changelog 2026-08-07](https://github.blog/changelog/2026-08-07-connecting-issues-and-multi-select-field-support/)
  - security alert: [GitHub Changelog 2026-04-14](https://github.blog/changelog/2026-04-14-link-code-scanning-alerts-to-github-issues/)

본문 문장은 사람이 쓰는 방식마다 표현이 달라 에이전트가 관계를 놓치거나 잘못 읽는다. Relationships는 API로 같은 값을 돌려주고, 한쪽에 걸면 반대쪽에도 표시된다.

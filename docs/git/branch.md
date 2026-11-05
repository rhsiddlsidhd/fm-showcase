# Branch 규칙

전역 `GIT.md`의 Branch 규칙에 아래 항목을 더한다.

## Issue 브랜치

Issue 브랜치는 Issue에 연결된 브랜치다. Issue 하나의 작업을 모으고, `main`에 merge되면 그 Issue를 닫는다.

- Issue 작업은 Issue 브랜치 하나에서 한다. `gh issue develop <번호> --name {prefix}/{이름}`으로 `main`에서 만든다.
- 기본 이름은 전역 규칙에 맞지 않으므로 `--name`을 쓴다.
- 이미 쓴 이름은 다시 쓰지 않는다. PR 목록을 브랜치 이름으로 찾으므로 옛 PR이 섞인다.
- 상위 묶음 Issue는 Issue 브랜치를 만들지 않는다. 자기 완료 조건을 확인한 뒤 따로 닫는다.
- Issue 없는 작업은 Issue 브랜치 없이 `main`으로 PR을 연다.

## 작업 브랜치

- Issue 브랜치에서 작업 브랜치를 만들어 그 Issue 브랜치로 PR을 연다.
- 작업 브랜치 아래에 다시 작업 브랜치를 두지 않는다. 그 PR은 목록에서 빠진다.
- 작업이 하나면 작업 브랜치 없이 Issue 브랜치에서 바로 `main`으로 PR을 열어도 된다.

## Issue 닫기

- Issue 브랜치의 `main` PR은 Issue당 하나이고, merge되면 Issue가 닫힌다. PR 본문에 아무것도 쓰지 않아도 닫히고, 막을 수 없다.
- 이 PR은 merge되면 Issue의 완료 조건이 전부 충족될 때만 연다.
- merge 뒤에야 확인할 수 있는 조건이 있으면 merge 후 확인하고, 실패하면 Issue를 다시 연다.

## 이유

닫힘이 완료 기록의 근거이고, 기록에는 그 작업의 PR이 모두 보여야 한다. GitHub는 `main` 대상 PR만 Issue에 연결하므로 작업 PR은 Issue에 직접 잇지 못한다. 대신 Issue를 닫은 PR의 head 브랜치를 대상으로 merge된 PR을 조회하면 전부 나온다. 이 조회는 브랜치를 지운 뒤에도 된다.

PR 본문에 번호를 적는 방식은 빠뜨리면 조용히 누락된다. 브랜치 구조는 merge 자체가 기록이라 적을 것이 없다.

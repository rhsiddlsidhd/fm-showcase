# Merge 규칙

전역 `GIT.md`의 Pull Request 규칙 중 merge 방식을 덮어쓴다. 나머지는 전역 규칙을 따른다.

## 방식

- 작업 브랜치 PR은 merge commit으로 합친다. squash merge와 rebase merge는 쓰지 않는다.
- merge commit의 제목은 PR 제목을 쓴다.

## 이유

이 저장소는 AI가 작업한 과정을 이력으로 남기는 것이 목적이다. 작업 브랜치의 커밋이 기본 브랜치에도 그대로 남아야 한다.

- squash merge는 브랜치의 커밋을 하나로 합친다. 커밋 순서(테스트 커밋 → 구현 커밋)와 커밋마다 붙은 저자 표기(`Co-Authored-By`)가 사라진다.
- rebase merge는 커밋을 새로 만들어 해시가 바뀐다. PR에서 본 커밋과 기본 브랜치의 커밋이 달라진다.
- merge commit은 원래 커밋과 해시를 그대로 두고, 브랜치가 갈라졌다 합쳐진 모양도 이력에 남긴다.

## 설정

GitHub 저장소 설정에서 merge commit만 허용한다. squash merge와 rebase merge는 끈다.

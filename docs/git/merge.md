# Merge 규칙

전역 `GIT.md`의 Pull Request 규칙 중 merge 방식을 덮어쓴다. 나머지는 전역 규칙을 따른다.

## 방식

- 작업 브랜치 PR은 merge commit으로 합친다. squash merge와 rebase merge는 쓰지 않는다.
- merge commit의 제목은 PR 제목을 쓴다.

## 이유

검증 기록의 `head`는 기록을 남긴 시점의 커밋 해시다. 이 해시가 기본 브랜치 이력에서도 유효해야 기록이 가리키는 코드를 찾을 수 있다. squash merge와 rebase merge는 커밋을 새로 만들어 해시가 바뀌므로, 합친 뒤에는 `head`가 기본 브랜치 이력에 없다.

## 설정

GitHub 저장소 설정에서 merge commit만 허용한다. squash merge와 rebase merge는 끈다.

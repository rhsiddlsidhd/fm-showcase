# Commit 규칙

전역 `GIT.md`의 Commit 규칙에 아래 항목을 더한다.

## AI 관여 선언

- 모든 커밋은 마지막 문단에 AI 관여 여부를 트레일러로 선언한다.
- AI가 관여했으면 `Co-Authored-By: 이름 <이메일>`을 쓴다. 이름과 이메일은 에이전트가 정하는 대로 쓰고, 모델이나 도구를 가리지 않는다.
- 사람 단독이면 `AI-Assisted: none`을 쓴다.
- 두 표기를 함께 쓰지 않는다. `AI-Assisted`에는 `none` 외의 값을 쓰지 않는다.

```
chore: add foo

Co-Authored-By: 이름 <이메일>
```

## 이유

README의 증거 표는 "AI와 사람의 기여가 구분된다"를 커밋 트레일러로 받친다. 표기가 없으면 사람 단독인지 누락인지 구별되지 않으므로, 둘 중 하나를 반드시 쓰게 한다.

## 판정

`scripts/git-hooks`의 `commit-msg` 훅이 로컬 커밋에서 검사한다.

- 한계: 자기 선언이라 위조를 막지 못한다. AI가 관여했는데 `AI-Assisted: none`을 쓴 경우도 잡지 못한다.
- GitHub에서 만드는 merge commit은 로컬 훅이 돌지 않아 검사하지 않는다.

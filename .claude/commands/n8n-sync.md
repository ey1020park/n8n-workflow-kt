---
description: n8n 워크플로우 pull → validate → creds를 순서대로 실행하고 결과를 요약
allowed-tools: Bash(npm run pull:*), Bash(npm run validate:*), Bash(npm run creds:*), Bash(git status:*), Bash(git diff:*)
---

## 실행

아래 순서대로 실행하고, 각 단계의 출력을 확인한다.

1. `npm run pull` — 서버의 워크플로우를 로컬로 동기화
2. `npm run validate` — 구조 검증 및 시크릿 하드코딩 점검
3. `npm run creds` — credential 참조 맵(`credential-map.md`) 갱신

## 보고

세 명령이 모두 끝난 뒤 다음을 정리해서 보고한다:

- `git status` / `git diff` 기준으로 `workflows/*.json` 중 실제로 변경된 파일 목록 (신규/수정/삭제 구분)
- `validate` 단계에서 나온 에러·경고 (없으면 "이상 없음"이라고 명시)
- `credential-map.md` 기준 orphaned credential 또는 미사용 credential 경고
- 다음에 할 일이 있다면 (예: validate 실패 수정, orphaned credential 정리) 짧게 제안

각 npm 명령 실행 중 에러가 발생하면 즉시 멈추고 에러 내용을 그대로 보여준다. 임의로 다음 단계를 건너뛰지 않는다.

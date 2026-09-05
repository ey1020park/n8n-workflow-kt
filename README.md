# n8n Workflow Kit

기존 n8n 서버의 워크플로우를 버전 관리하기 위한 최소 스타터킷.

## 기능

- **pull**: 서버의 모든 워크플로우를 `workflows/*.json`으로 내려받기
- **push**: 로컬 JSON을 서버에 반영 (스키마 검증 + 시크릿 하드코딩 검사를 통과해야 push됨)
- **validate**: 로컬 워크플로우 JSON의 구조 검증 및 시크릿 하드코딩 여부 점검
- **creds**: 서버 credential 메타데이터와 로컬 워크플로우의 참조 관계를 `credential-map.md`로 정리 (orphaned/미사용 credential 경고 포함)

credential의 실제 값(시크릿)은 절대 로컬 파일에 저장되지 않습니다. n8n API는 credential 조회 시 `id`/`name`/`type` 메타데이터만 반환하며, 워크플로우 노드에도 credential 값이 아닌 참조(id/name)만 export됩니다.

## 설치

```bash
npm install
cp .env.example .env
# .env에 N8N_API_URL, N8N_API_KEY 입력
```

## 사용법

```bash
npm run pull            # 서버 → 로컬
npm run validate        # 로컬 워크플로우 검증
npm run creds           # credential 참조 맵 생성
npm run push            # 로컬 → 서버 (전체)
npm run push -- workflows/xxx.json   # 특정 파일만 push
```

## 워크플로우

1. `npm run pull`로 현재 서버 상태를 받아온다
2. n8n UI 또는 로컬 파일 편집으로 워크플로우 변경
3. `npm run validate`로 문제 확인
4. `npm run creds`로 credential 참조 상태 확인
5. `npm run push`로 반영, 변경 사항은 git commit

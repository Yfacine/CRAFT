# replica-skill

CRAFT에서는 원본 절차를 프로젝트 사본에서 읽고 현재 대상에 적용한다. 분석 담당은 기능·구현 요구와 인수 사례를 작성하고, 제품 코드는 코딩 담당에게 인계한다. 작업 중 필요한 단계의 `.tools/replica-skill/replica-<단계>/SKILL.md`와 해당 양식만 읽는다.

- `recon`에서 REA 근거를 기능표와 사용자 흐름에 연결한다.
- `architect`, `design`, `build`, 필요한 경우 `backend`로 기술 구조와 구현을 정한다. 화면 없는 대상에서는 화면 설계 대신 명령·데이터 계약을 정의한다.
- `test`와 `diff`에서 원본과 복제품의 같은 기능 ID, 입력, 관찰 조건을 대조한다. 필요할 때만 사본의 Python 비교 도구를 검토해 실행한다.
- 원본 템플릿의 기본 경로는 대상별 작업 폴더에 맞춘다. 단계별 산출물의 위치를 대상 계획에 기록한다.

[공식 단계 목록 및 기준 리비전](https://github.com/Jakeschincariol/replica-skill/tree/77c9436fb3d18c3d58169efb8caf4fe906b0dc51)

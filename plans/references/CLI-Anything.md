# CLI-Anything

분석 담당은 자동화 경로, 입출력 계약과 대조 방법을 정리한다. 실제 백엔드를 호출하는 명령줄 하네스와 테스트 코드는 코딩 담당이 작성한다. 프로젝트 사본 `.tools/cli-anything`에서 다음 자료를 순서대로 사용한다.

1. `codex-skill/SKILL.md`의 저장소 사본 경로 안내와 `cli-anything-plugin/HARNESS.md`를 읽는다.
2. `cli-anything-plugin/commands/`의 build, refine, test, validate 중 필요한 절차와 그 단계의 가이드를 읽는다. build의 파일명은 `cli-anything.md`다.
3. 코딩 담당은 대상 복제품의 실제 코드나 채택한 백엔드를 입력으로 사용한다. 원본에 공식 자동화 경로가 있으면 기준 결과 수집용으로 구분해 둔다.
4. 생성한 CLI를 격리 환경에서 설치·실행하고 성공·실패 종료 코드, 구조화 출력과 파일 결과를 확인한다. 파일은 형식과 필요한 내용도 검사한다. GUI가 있는 복제품은 사용자 흐름에서도 검증한다.

프로젝트 사본에서 Codex용 원문 절차를 읽어 실행하는 방식이다. 전역 설치는 CRAFT의 실행 조건에 포함되지 않는다.

[공식 Codex 워크플로](https://github.com/HKUDS/CLI-Anything/tree/34f519533bc175d2fe287ab8316b0dd99bb9cc43/codex-skill) · [공식 하네스 절차](https://github.com/HKUDS/CLI-Anything/blob/34f519533bc175d2fe287ab8316b0dd99bb9cc43/cli-anything-plugin/HARNESS.md)

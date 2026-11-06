# CRAFT 변경 이력

## v0.2.1 · 2026-11-06 (261106)

`v0.2`의 GitHub Release에서 전체 ZIP을 다시 받아 신규 설치를 검증했다. Windows x64의 한글·공백 경로에서 핵심 기능은 동작했으나, 처음 설정할 때 실행 정책과 프로젝트 신뢰 순서가 명확하지 않았고, 비대화형 실행에서는 REA 호출이 승인 단계에서 멈췄다. 이 패치는 설치 순서와 승인 방법을 재현 가능한 명령으로 정리한다.

| `v0.2`에서 확인한 문제 | 원인과 영향 | `v0.2.1`의 해결 |
| --- | --- | --- |
| Windows PowerShell 5.1에서 초기화 스크립트가 `PSSecurityException`으로 차단됐다. | 빠른 시작에 PowerShell 버전이 없어 Windows 기본 셸에서도 같은 명령이 바로 실행될 것으로 읽혔다. 테스트 PC의 5.1 실행 정책은 스크립트 실행을 허용하지 않았다. | PowerShell 7을 기본 설치 경로로 지정했다. 5.1만 사용할 때는 체크섬을 검증한 스크립트를 실행할 프로세스에만 정책을 적용하는 명령을 추가했다. |
| 신규 Codex 프로필에서 초기화 직후 `codex mcp get rea --json`이 실패했다. | `v0.2`에서는 명령 예제가 신뢰 설정 안내보다 앞에 있었다. Codex는 신뢰가 설정되기 전까지 프로젝트 MCP 설정을 읽지 않았다. | ZIP 검증 → 초기화 → 프로젝트 신뢰 → 새 세션 → MCP 경로 확인 → 스킬 호출 순서로 정리했다. 다른 위치로 옮길 때 다시 할 단계도 명시했다. |
| 비대화형 `codex exec`에서 REA `open_binary`가 `MCP tool call requires approval, but approval policy is never`로 차단됐다. | REA 서버는 실행됐으나 Codex가 해당 호출에 필요한 승인을 받을 수 없었다. 다음 조사·닫기 호출은 실행되지 않았다. | 대화형 승인과 비대화형 실행을 구분했다. 비대화형 예제에서 `open_binary`, `inspect_artifact`, `close_binary`만 한 번의 실행에 허용한다. 로컬 REA CLI를 쓰는 경로도 연결했다. |

- [빠른 시작](README.md#windows-x64-빠른-시작)에 다운로드 체크섬 대조 방법과 MCP의 실행 파일·스크립트·작업 경로 확인 항목을 추가했다.
- 도구 6종과 기존 버전, 초기화 스크립트, `craft-replica` 스킬, SUB 역할 설정을 그대로 사용한다. 변경 범위는 설치·REA 사용 안내와 검증 기록이다.
- [작업공간 검증 기록](plans/03_verification.md#36-v021-공개-zip-신규-설치-검증)에 검사 범위와 결과를 기록한다.

## v0.2 · 2026-11-06 (261106)

- CRAFT 문서, 스킬, SUB 역할 10개와 도구 6종을 포함한 첫 공개 Windows x64 배포본을 게시했다. 프로젝트 루트에서 REA MCP 경로를 생성하는 초기화 스크립트와 외부 도구 고지를 포함했다. [v0.2 Release](https://github.com/Yfacine/CRAFT/releases/tag/v0.2)

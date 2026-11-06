# REA

원본 동작을 조사하고 관찰 근거를 확보한다. CRAFT 루트에서 [초기화 스크립트](../../scripts/Initialize-Craft.ps1)를 실행하면 그 위치에 맞는 프로젝트 MCP 설정 `.codex/config.toml`을 생성한다. 해당 루트를 새 Codex 세션에서 열어 REA를 사용한다. `codex mcp get rea --json`으로 로컬 경로를 확인하고, 대상에 맞는 작은 읽기 호출부터 실행한다.

- 웹은 `capture_web_screenshot` 또는 `capture_browser_scenario`로 시작한다. 시나리오에는 고유한 `step_id`가 있는 동작을 하나 이상 넣는다. DOM·스크립트 조사는 합의한 범위에서 수집 항목을 확인한 뒤 진행한다.
- 데스크톱은 허용 범위에 따라 `observe_native_ui` 등으로 좁힌다. 파일 조사에는 MCP의 `open_binary` → `inspect_artifact` 또는 CLI의 `inspect-artifact`를 사용한다. 활성 분석 대상은 증거를 남긴 뒤 `close_binary`로 닫는다.
- 관찰·추론·미확인을 구분하고 근거 ID, 입력, 도구 버전과 한계를 기록한다. 네이티브 내부 조사는 대상별 제공자가 필요할 수 있다.
- MCP 경로가 제한된 경우, 허용된 파일 조사는 동일한 CRAFT 로컬 CLI로 실행할 수 있다. 실행 정책이 차단한 조작은 상태와 다음 조건을 기록한다.

CRAFT 루트에서 실행한다.

```powershell
$reaNode = '.\.tools\node\24.22.2\node.exe'
$reaCli = '.\.tools\rea\6.8.0\node_modules\rea-agents\scripts\rea.mjs'
& $reaNode $reaCli --version
& $reaNode $reaCli inspect-artifact '<ZIP 절대경로>' --format json --full-output
```

6.8.0의 MCP 함수 분석 기본 응답은 보관된 요약이다. 인라인 전체 분석이 필요하면 해당 호출에서 `detail: "complete"`를 지정한다. 완전한 JSON 문서가 필요한 기존 소비자는 `--format json`을 사용한다. `jsonl`은 행과 메타데이터 레코드를 나눠 처리한다.

[공식 저장소](https://github.com/morluto/rea) · [6.8.0 릴리스와 호환성 변경](https://github.com/morluto/rea/releases/tag/rea-agents-6.8.0) · [Node.js Windows 배포](https://nodejs.org/en/download/archive/v24.22.2)

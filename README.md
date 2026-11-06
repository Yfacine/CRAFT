# CRAFT

상용 프로그램의 업무 흐름을 분석하고, 실제 사용 환경에서 대체할 수 있는 복제품을 만드는 작업공간입니다.

| 항목 | 값 |
| --- | --- |
| CRAFT 버전 | `v0.2.1` |
| 버전 기준일 | `261106` (2026-11-06, 한국 시간) |

[v0.2.1에서 해결한 문제와 변경 이력](CHANGELOG.md)

## 문서 순서

| 순번 | 문서 | 역할 |
| --- | --- | --- |
| 01 | [메인 계획서](plans/01_main-plan.md) | 목표, 역할, 작업 순서와 인계 기준 |
| 02 | [Gate](plans/02_gates.md) | 구현·실측 착수와 최종 인수의 통과 및 보류 조건 |
| 03 | [검증](plans/03_verification.md) | 확인 범위, 결과와 검증 근거 |
| 04 | [대상계획 양식](plans/04_target-plan-template.md) | 대상별 작업·증거·Gate 판정 기록 |

- [.tools 도구 버전과 가져온 날짜](plans/references/README.md#도구-도입-및-업데이트-이력)에서 현재 도구와 변경 이력을 확인합니다.

## Windows x64 빠른 시작

Windows x64에서 Codex CLI를 설치하고 로그인한다. CRAFT 전체 ZIP에는 REA와 실행용 Node.js를 포함한 도구 6종이 들어 있다.

1. GitHub Release의 전체 ZIP과 `.sha256` 파일을 받는다. `Get-FileHash -LiteralPath '<다운로드한 ZIP 경로>' -Algorithm SHA256`으로 구한 해시를 `.sha256`의 첫 값과 대조한 뒤 압축을 푼다.
2. 압축을 푼 `CRAFT` 폴더에서 **PowerShell 7 (`pwsh`)**을 열고 `.\scripts\Initialize-Craft.ps1`을 실행한다. [초기화 스크립트](scripts/Initialize-Craft.ps1)가 현재 설치 경로를 기준으로 프로젝트의 `.codex/config.toml`을 생성한다.
3. Codex에서 같은 `CRAFT` 폴더를 열고 신뢰할 수 있는 프로젝트로 설정한다. 기존에 이 폴더를 열어 둔 세션이 있다면 새 세션을 시작한다.
4. 같은 폴더에서 `codex mcp get rea --json`을 실행한다. `transport.command`, `transport.args[0]`, `transport.cwd`가 모두 압축을 푼 CRAFT 폴더를 가리키는지 확인한다.
5. Codex 세션에서 `$craft-replica` 스킬을 호출한다. 역할 이름과 인계 순서는 [메인 계획서](plans/01_main-plan.md)에 있다.

Windows PowerShell 5.1에서 스크립트 실행이 차단되면 PowerShell 7을 사용한다. 5.1만 있는 경우, 체크섬을 확인한 CRAFT 스크립트는 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Initialize-Craft.ps1`로 실행할 수 있다. 이 옵션은 해당 프로세스에만 적용되며 조직 정책이 적용되는 환경에서는 조직 절차를 따른다.

CRAFT를 다른 경로로 옮겼다면 새 폴더에서 초기화와 프로젝트 신뢰 설정을 다시 진행한다. 비대화형 Codex 실행에서 REA 승인 오류가 나면 [REA 호출 승인과 재현 방법](plans/references/REA.md#비대화형-codex에서-파일-읽기)을 확인한다.

## 배포와 라이선스

- Release ZIP은 CRAFT 문서·설정 소스·스크립트와 `.tools` 도구 파일을 함께 제공한다. 로컬에서 생성한 `.codex/config.toml`, 내부 Git 관리 정보와 배포 산출물 폴더 `dist/`는 공개 사본에서 분리한다.
- Git에 등록할 공개 사본에도 `.tools` 파일을 포함한다. 내장 도구의 버전·도입일과 공식 출처는 [도구 이력](plans/references/README.md)에 있다.
- 공개 사본에서 `git add -- .` 실행 후 `git add -f -- .tools`를 실행한다. 내장 도구의 원본 `.gitignore`가 자체 배포 파일 일부를 숨길 수 있으므로 `.tools`까지 명시적으로 등록한다.
- CRAFT 자체 파일은 [Yfacine](https://github.com/Yfacine)의 [MIT 라이선스](LICENSE)를 따른다. 외부 도구에는 [각 라이선스와 고지](THIRD-PARTY-NOTICES.md)가 적용된다.

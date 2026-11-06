# CRAFT

상용 프로그램의 업무 흐름을 분석하고, 실제 사용 환경에서 대체할 수 있는 복제품을 만드는 작업공간입니다.

| 항목 | 값 |
| --- | --- |
| CRAFT 버전 | `v0.2` |
| 버전 기준일 | `261106` (2026-11-06, 한국 시간) |

## 문서 순서

| 순번 | 문서 | 역할 |
| --- | --- | --- |
| 01 | [메인 계획서](plans/01_main-plan.md) | 목표, 역할, 작업 순서와 인계 기준 |
| 02 | [Gate](plans/02_gates.md) | 구현·실측 착수와 최종 인수의 통과 및 보류 조건 |
| 03 | [검증](plans/03_verification.md) | 확인 범위, 결과와 검증 근거 |
| 04 | [대상계획 양식](plans/04_target-plan-template.md) | 대상별 작업·증거·Gate 판정 기록 |

- [.tools 도구 버전과 가져온 날짜](plans/references/README.md#도구-도입-및-업데이트-이력)에서 현재 도구와 변경 이력을 확인합니다.

## Windows x64 빠른 시작

CRAFT 전체 ZIP을 원하는 폴더에 풀고 해당 폴더에서 PowerShell을 연다. 배포본에는 여섯 도구가 포함된다. Codex는 사용자가 설치한 환경을 사용한다.

```powershell
.\scripts\Initialize-Craft.ps1
codex mcp get rea --json
```

[초기화 스크립트](scripts/Initialize-Craft.ps1)는 자신의 위치에서 CRAFT 루트를 찾아 프로젝트의 REA MCP 설정을 생성한다. Codex에서 해당 폴더를 신뢰할 수 있는 프로젝트로 열고 `$craft-replica` 스킬을 사용한다. CRAFT를 다른 폴더로 옮기면 초기화를 다시 실행한다.

## 배포와 라이선스

- Release ZIP은 CRAFT 문서·설정 소스·스크립트와 `.tools` 도구 파일을 함께 제공한다. 로컬에서 생성한 `.codex/config.toml`, 내부 Git 관리 정보와 배포 산출물 폴더 `dist/`는 공개 사본에서 분리한다.
- Git에 등록할 공개 사본에도 `.tools` 파일을 포함한다. 내장 도구의 버전·도입일과 공식 출처는 [도구 이력](plans/references/README.md)에 있다.
- 공개 사본에서 `git add -- .` 실행 후 `git add -f -- .tools`를 실행한다. 내장 도구의 원본 `.gitignore`가 자체 배포 파일 일부를 숨길 수 있으므로 `.tools`까지 명시적으로 등록한다.
- CRAFT 자체 파일은 [Yfacine](https://github.com/Yfacine)의 [MIT 라이선스](LICENSE)를 따른다. 외부 도구에는 [각 라이선스와 고지](THIRD-PARTY-NOTICES.md)가 적용된다.

# Craft Anything

분석 담당은 원본 관찰과 비교를 수행한다. 제품용 재구현 도구 실행과 제품 코드 작성은 코딩 담당이 맡는다. CRAFT 루트에서 Windows x64 포터블을 직접 호출한다.

```powershell
$craftCli = '.\.tools\craft-anything\0.4.0\craft-anything-0.4.0-windows-x64-portable\craft-anything-cli.exe'
& $craftCli --version
& $craftCli doctor
& $craftCli commands
& $craftCli rebuild --help
```

- 관찰 전용이면 `--clean-room`을 명시한다. 목록에서 실제 제공되는 도구를 골라 해당 도구의 `--help`를 확인한다. 도구 증거는 `--project`에 대상별 `.cany` 위치를 지정한다.
- `rebuild`를 쓸 때는 인증이 끝난 지원 빌더와 새 작업 폴더를 지정한다. 기존 폴더라면 `--existing`의 동작을 확인한 뒤 대상 계획과 맞는 값을 사용한다. 대상을 지정할 때는 URL 또는 절대경로를 넘긴다.
- 빌더가 없거나 연동이 실패하면 프로젝트 안에서 CLI의 관찰·증거 또는 비교 도구를 실제 실행하고, 코딩 담당이 합의한 명세로 구현한다. 대상별 캡처와 비교 산출물을 연결한다.
- 정적 웹 작업은 원본 URL이 있으면 대상에 명시한다. 대상 없는 실행에서 정적 HTML을 생성했는데 내장 검사가 실행 파일을 요구하면, 종료 상태와 별개로 브라우저에서 생성물을 직접 실행하고 대상 계획의 기준으로 결과를 판정한다.
- 포터블의 `doctor` 결과에서 MCP 자체 테스트와 설치 상태, AI 빌더 설정을 구분한다. 전체 재구현을 실행할 때 `ai detect`로 설치된 빌더를 확인한다. Codex가 감지되고 인증된 환경에서는 `rebuild --backend Codex`를 사용할 수 있다. 파일명, 대상 유형과 도구가 실제 실행한 인수 체크를 기록한다.

[공식 README](https://github.com/storytold/craft-anything/blob/fc93bd091e7810e08b540a67487e3bf5f2b7da2b/README.md) · [Windows 포터블 배포와 체크섬](https://github.com/storytold/craft-anything/releases/tag/v0.4.0)

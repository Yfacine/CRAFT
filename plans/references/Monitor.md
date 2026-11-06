# CRAFT 작업 현황판

별도 Windows 터미널에서 공식 6단계, MAIN과 SUB 10명의 상태, 확인된 인계와 Gate를 표시한다. 상태의 출처는 MAIN의 실제 배정·결과와 대상계획이다. `실행`은 확인된 실행, `대기`는 배정 후 착수 대기, `비활성`은 미배정, `미확인`은 상태 정보가 없음을 뜻한다. 실행 표시만 점멸한다.

## 시작과 갱신

실제 대상의 복제 작업을 시작할 때 MAIN이 CRAFT 루트에서 한 번 실행하고 반환된 절대 `StatePath`를 보관한다. 별도 PowerShell 호출에서는 반환된 실제 경로를 넘긴다. 화면에서 `T`는 팀 맵, `L`은 역할 목록, `Q`는 현황판 닫기다. 좁은 창의 목록은 `B`와 `N`으로 이동한다.

```powershell
$monitor = .\scripts\Craft-Monitor.ps1 -Target '<대상 프로그램명>'
$monitor | ConvertTo-Json -Compress
```

별도 창을 열 수 없는 실행 환경에는 `-NoWindow`를 사용해 상태를 기록한다. 종료한 화면을 다시 열려면 번들 Node로 `scripts/craft-progress-monitor.cjs --state <StatePath>`를 실행한다. 창을 닫아도 해당 작업의 계획이나 실행 기록은 유지된다.

MAIN이 확인한 사항만 갱신한다. 아래 예시는 분석 단계에 들어가 `craft_rea` 실행을 확인한 직후의 입력 형식이다. 대상의 실제 작업과 근거로 값을 채운다.

```powershell
.\scripts\Craft-Monitor.ps1 -StatePath $monitor.StatePath -Patch @{
    stage = 2
    task = '원본 저장 동작 관찰'
    next = '관찰 근거를 명세 담당에게 인계'
    agents = @(@{ name = 'craft_rea'; status = 'running'; task = '원본 저장 동작 관찰' })
    handoff = @{ from = 'MAIN'; to = 'craft_rea'; task = '승인된 범위의 저장 동작 조사' }
    event = 'craft_rea 실행 확인 및 조사 입력 전달'
}
```

- MAIN이 한 실행의 상태를 갱신한다. 단계·현재 작업·최근 확인 결과·다음 조치는 `stage`(1~6), `task`, `result`, `next`로 보낸다. 실행의 `status`는 `running`, `waiting`, `held`, `passed`를 사용한다.
- `agents`에는 변경된 역할만 보낸다. `name`은 역할 ID, `status`는 `running`, `waiting`, `inactive`, `done`, `held`, `task`는 확인된 작업이다. 확인된 활동을 함께 표시할 때 `activity = @{time='…'; source='reported'; detail='…'}`를 넣는다. `source`는 `reported`, `observed`, `inferred`로 구분한다. 활동이 다음 배정과 관계없으면 `activity = $null`로 지운다.
- `handoff`는 실제 인계의 `from`, `to`, `task`를 기록한다. `event`는 표시할 한 줄의 사실이다. 두 항목에 UTC 기록 시각을 붙인다. 장기 증거와 판정 이력은 대상계획에 보존한다.
- `candidate`는 코드 리비전과 연결된 현재 배포 후보의 식별자다. 새 후보를 등록하면 이전 후보의 G02·G03 상태가 `PENDING`으로 돌아간다. 기준·계약이 바뀌면 MAIN이 02로 돌아가 G01과 후속 판정을 갱신한다. `05 수정과 재검증`을 수행한 경우 `rework='done'`, 변경이 없었던 경우 `rework='skipped'`로 06에 진입한다.
- Gate는 대상계획에서 판정한 뒤 `gates=@{G01='PASS'}`와 `gateEvidence=@{G01='<대상계획의 실제 판정 행 또는 근거 ID>'}`를 함께 보낸다. `G02`는 현재 후보 기준으로 기록한다. `status='passed'`는 06에서 G01~G03이 모두 `PASS`인 경우만 저장된다. 근거 참조의 실제 적합성은 MAIN이 대상계획에서 확인한다.

상태 파일은 프로젝트 루트의 `.craft-monitor/<실행 ID>/state.json`에 있다. 실행마다 경로가 다르며 Git 배포에서 제외한다. 읽기 오류가 나면 화면에는 마지막 상태와 연결 오류가 표시된다. 갱신 충돌로 쓰기가 거부되면 다른 쓰기가 끝난 뒤 MAIN이 다시 갱신한다. 상태 요약에는 복제 대상의 비공개 내용, 입력 전문이나 비밀값을 넣을 필요가 없다.

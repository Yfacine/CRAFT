"use strict";

const CraftMonitor = (() => {
  const WIDTH = 76;
  const HEIGHT = 24;
  const colors = { ink:"#101010", line:"#8a8a8a", dim:"#d2d2d2", text:"#ffffff", shadow:"#535353" };
  const brand = [
    "   ▄████████▄  ",
    "  ██▀░░░░░░▀█  ",
    "  ██   ▄▄      ",
    "  ██▄  ▀▀  ▄█  ",
    "   ▀████████▀  "
  ];
  const phases = ["범위 초안","분석 및 구현 전 확정","구현과 후보 고정","실측","수정과 재검증","최종 인수"];
  const roster = [
    "MAIN","craft_rea","craft_anything","craft_reap","craft_replica_spec","craft_cli_anything",
    "craft_coder","craft_code_review","craft_tf_design","craft_tf_alignment","craft_tf_acceptance"
  ];
  const assignments = [
    { MAIN:"대상·허용 범위 확인", craft_tf_design:"계획 누락 확인" },
    { MAIN:"조사 범위 조율", craft_rea:"저장 동작 관찰" },
    { MAIN:"후보 고정 확인", craft_coder:"자체 테스트" },
    { MAIN:"실측 조건 확인", craft_tf_acceptance:"재열기 실측" },
    { MAIN:"실패·영향 범위 판정", craft_coder:"저장 처리 수정" },
    { MAIN:"필수 증거 대조", craft_tf_alignment:"정합성 확인", craft_tf_acceptance:"인수 근거 정리" }
  ];
  const gates = ["G01","G02","G03"];
  const labels = { running:"진행 중", waiting:"승인 대기", held:"보류", passed:"인수 통과", connecting:"연결 대기" };
  const agentLabels = {running:"실행",inactive:"비활성",waiting:"대기",held:"보류",done:"완료",unknown:"미확인"};
  const agentMarks = {running:"●",inactive:"·",waiting:"○",held:"!",done:"✓",unknown:"?"};
  const activitySources = {reported:"보고",observed:"관찰",inferred:"추론"};
  const groups = [
    ["분석 5",[["craft_reap","REAP"],["craft_rea","REA"],["craft_replica_spec","명세"],
      ["craft_anything","Craft Anything"],["craft_cli_anything","CLI-Anything"]]],
    ["코딩 1",[["craft_coder","구현 담당"]]],
    ["코드 검토 1",[["craft_code_review","코드 검토"]]],
    ["TF 3",[["craft_tf_design","작업 설계"],["craft_tf_alignment","정합성"],
      ["craft_tf_acceptance","품질·인수"]]]
  ];
  const handoffRoutes = [
    "MAIN → 작업 설계 TF → MAIN · 범위와 자원 배정 검토",
    "REAP 질문 → REA 조사 → 명세 → MAIN · G01 판정",
    "MAIN → 코딩 → MAIN 후보 고정 → 독립 코드 검토",
    "MAIN · G02 → 품질·인수 TF → MAIN · 실측 증거",
    "MAIN → 수정 담당 → 새 후보 G02 → 품질·인수 TF 재실측",
    "코드 검토·정합성·품질 TF → MAIN · G03 최종 인수"
  ];
  const demoHandoffs = [
    {from:"MAIN",to:"craft_tf_design",task:"대상 버전과 허용 범위 검토 요청"},
    {from:"craft_reap",to:"craft_rea",task:"저장 동작 관찰 질문 인계"},
    {from:"MAIN",to:"craft_coder",task:"확정 명세와 자체 테스트 기준 배정"},
    {from:"MAIN",to:"craft_tf_acceptance",task:"고정 후보와 실측 조건 전달"},
    {from:"MAIN",to:"craft_coder",task:"재열기 실패 근거와 수정 범위 전달"},
    {from:"craft_tf_acceptance",to:"MAIN",task:"현재 후보 실측 근거 전달"}
  ];
  function teamList(state) {
    const reported = new Map((state.agents || []).map(agent => [agent.name,agent]));
    return [...new Set([...roster,...reported.keys()])].map(name =>
      reported.get(name) || {name,status:"unknown",task:""});
  }
  const teamPageSize = height => Math.max(1,height - 6);
  const teamPages = (state,height) => Math.ceil(teamList(state).length / teamPageSize(height));
  const samples = [
    ["대상 버전·대체 업무·분석 허용 범위 확인", "작업 요청 접수", "필수 관찰 목록 초안을 정리합니다."],
    ["REA 원본 조사와 필수 관찰 기준 확정", "대상과 분석 허용 범위 확인", "사전 검토와 명세를 확인하고 G01을 판정합니다."],
    ["코딩·자체 테스트 및 검증할 배포 후보 고정", "G01 통과 · 명세와 합격 기준 확정", "후보 지문과 실행 조건을 확인하고 G02를 판정합니다."],
    ["고정 후보의 저장·재열기를 실제 진입점에서 실측", "G02 통과 · 후보와 실측 환경 확인", "결함이 있으면 수정과 재검증으로 이동합니다."],
    ["저장 처리 수정 후 새 배포 후보를 고정", "이전 후보의 재열기 실패 증거 보존", "새 후보 G02 판정 후 실측 단계로 돌아갑니다."],
    ["현재 후보의 필수 결과와 독립 검토 대조", "현재 후보 실측 결과 접수", "MAIN이 G03 통과 또는 보류를 판정합니다."]
  ];
  const sampleEvents = [
    ["00:00:08","범위 초안 · 대상과 허용 범위 기록"],
    ["00:03:12","REA 원본 관찰과 명세 정리"],
    ["00:07:04","G01 통과 · 구현 착수"],
    ["00:19:25","G02 통과 · 고정 후보 실측 착수"],
    ["00:22:05","재열기 차이 발견 · 실패 증거 보존"],
    ["00:24:05","현재 후보 실측과 독립 검토 결과 대조"]
  ];
  const clipControls = value => value.replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g," ");
  // Windows Console renders the text-style play triangle in one cell.
  const widthOf = ch => ch === "▶" ? 1 : /\p{Mark}/u.test(ch) ? 0 :
    /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff01-\uff60\uffe0-\uffe6]|\p{Extended_Pictographic}/u.test(ch) ? 2 : 1;
  function makeDemo(stage = 3, status = "running", rework = stage === 6 ? "skipped" : "pending") {
    const [task,result,next] = samples[stage - 1];
    const agents = roster.map(name => ({
      name,
      status: status === "passed" ? "done" : status === "held" && name === "craft_tf_acceptance" ? "held" :
        status === "waiting" && name === "craft_rea" ? "waiting" :
        status === "running" && assignments[stage - 1][name] ? "running" :
        assignments[stage - 1][name] ? "waiting" : "inactive",
      task: assignments[stage - 1][name] || "",
      ...(status === "running" && assignments[stage - 1][name] ? {
        activity:{time:sampleEvents[stage - 1][0],source:"reported",detail:assignments[stage - 1][name]}
      } : {})
    }));
    return {
      target:"A 프로그램", runId:"0042", stage, status, rework, agents,
      handoffs:[demoHandoffs[stage - 1]],demo:true,
      task: status === "waiting" ? "REA에서 원본 파일을 여는 데 승인이 필요합니다." :
        status === "held" ? "저장 후 재열기 결과가 원본과 다릅니다." :
        status === "passed" ? "현재 후보의 필수 검증과 독립 검토를 확인했습니다." :
        stage === 4 && rework === "done" ? "새 후보로 이전 실패와 영향받은 사례를 재실측" : task,
      result: status === "passed" ? "원본과 복제본의 저장·재열기 결과 일치" :
        stage === 4 && rework === "done" ? "새 후보 고정 및 현재 후보 G02 통과" : result,
      next: status === "waiting" ? "Codex에서 해당 요청을 승인하면 원본 분석을 재개합니다." :
        status === "held" ? "저장 처리 수정 후 같은 입력으로 다시 검증합니다." :
        status === "passed" ? "최종 인수 기록과 검증 증거를 확인합니다." : next,
      gates:{G01:stage >= 3 ? "PASS" : "PENDING",G02:stage >= 4 && stage !== 5 ? "PASS" : "PENDING",
        G03:status === "passed" ? "PASS" : status === "held" ? "HOLD" : "PENDING"},
      events:sampleEvents.slice(0,stage).filter((_,i) => !(i === 4 && rework === "skipped"))
        .concat(rework === "done" ? (stage === 4 ? [sampleEvents[4]] : [])
          .concat([["00:23:16","수정·새 후보 고정 · G02 통과 후 재실측"]]) : [])
        .concat(status === "running" ? [] :
        [["00:24:17",status === "waiting" ? "REA 파일 열기 승인 요청" :
          status === "passed" ? "G03 통과 · 현재 후보 최종 인수" : "G03 보류 · 재열기 결과 차이"]])
        .sort((a,b) => a[0].localeCompare(b[0]))
    };
  }
  function keyName(input) {
    const text = input.toLowerCase().normalize("NFKC");
    const korean = { "ᄌ":"w", "ᄀ":"r", "ᅩ":"h", "ᅦ":"p", "ᄇ":"q", "ᄉ":"t", "ᅮ":"n", "ᅲ":"b", "ᅵ":"l" };
    return korean[text] || text;
  }
  function demoKey(state,input) {
    const key = keyName(input);
    if (/^[1-6]$/.test(key)) {
      const stage = Number(key);
      if (stage === 6 && state.stage === 5) return {...state,viewStage:6,
        notice:"최종 인수 대기 · R로 새 후보 실측을 먼저 확인합니다."};
      if (stage === 6 && state.status === "held") return {...state,notice:"최종 인수 보류 · 5에서 수정과 재검증을 시작합니다."};
      return stage >= 4 && stage !== 5 && state.rework === "done" ? makeDemo(stage,"running","done") : makeDemo(stage);
    }
    if (key === "w") return state.status === "waiting" ? makeDemo(2) : makeDemo(2,"waiting");
    if (key === "r") return state.stage === 5 ? makeDemo(4,"running","done") :
      {...state,notice:"R 재실측 · 5 수정과 재검증 단계에서 사용할 수 있습니다."};
    if (key === "p" || key === "h") {
      if (state.stage === 6 && state.status === "running") {
        return key === "p" ? makeDemo(6,"passed",state.rework) : makeDemo(6,"held","pending");
      }
      return {...state,notice: state.stage === 5 ? "판정 대기 · R로 새 후보 실측을 먼저 확인합니다." :
        state.status === "held" ? "보류 유지 · 수정과 재검증을 먼저 진행합니다." :
        state.status === "passed" ? "최종 인수 통과 상태입니다." : "H/P 인수 판정 · 6 최종 인수 화면에서 사용할 수 있습니다."};
    }
    return state;
  }
  function normalize(input) {
    const {target,runId,stage,status,task,result,next,rework = "pending"} = input;
    if (!Number.isInteger(stage) || stage < 1 || stage > phases.length ||
        !["running","waiting","held","passed"].includes(status) ||
        !["pending","done","skipped"].includes(rework) ||
        (stage === 6 && status !== "held" && rework === "pending") || (stage < 6 && rework === "skipped") ||
        [target,runId,task,result,next].some(value => typeof value !== "string")) {
      throw Error("상태 형식 오류");
    }
    const acceptedGates = {};
    for (const gate of gates) {
      const value = input.gates?.[gate];
      if (!["PENDING","PASS","HOLD"].includes(value)) throw Error("Gate 형식 오류");
      acceptedGates[gate] = value;
    }
    if ((acceptedGates.G03 === "PASS") !== (status === "passed") ||
        (status === "passed" && (stage !== 6 || gates.some(gate => acceptedGates[gate] !== "PASS")))) {
      throw Error("인수 판정과 Gate 불일치");
    }
    if (!Array.isArray(input.events) || input.events.some(item =>
      !Array.isArray(item) || item.length !== 2 || item.some(value => typeof value !== "string"))) throw Error("이력 형식 오류");
    const agents = input.agents;
    if (agents !== undefined) {
      if (!Array.isArray(agents) || agents.length > 64 || agents.some(agent =>
        !agent || typeof agent.name !== "string" || !agent.name.trim() || typeof agent.task !== "string" ||
        !["running","waiting","done","held","inactive"].includes(agent.status) ||
        (agent.activity !== undefined && (!agent.activity ||
          typeof agent.activity.time !== "string" || typeof agent.activity.detail !== "string" ||
          !Object.hasOwn(activitySources,agent.activity.source)))) ||
        new Set(agents.map(agent => agent.name)).size !== agents.length) throw Error("팀 상태 형식 오류");
    }
    const handoffs = input.handoffs;
    if (handoffs !== undefined && (!Array.isArray(handoffs) || handoffs.length > 64 || handoffs.some(item =>
      !item || ["from","to","task"].some(field => typeof item[field] !== "string" || !item[field].trim()) ||
      (item.at !== undefined && typeof item.at !== "string")))) {
      throw Error("인계 형식 오류");
    }
    return {target,runId,stage,status,task,result,next,rework,gates:acceptedGates,
      events:input.events.slice(-3),agents,handoffs:handoffs?.slice(-3),demo:false};
  }
  function connecting(message, previous) {
    if (previous) return {...previous, connection:message};
    return {
      ...makeDemo(1), target:"—", runId:"—", status:"connecting", demo:false,
      task:"실행 상태를 기다리는 중", result:"—", next:"상태 파일이 갱신되면 자동으로 표시합니다.",
      events:[], agents:undefined, handoffs:undefined, connection:message
    };
  }
  function screen(state, width = WIDTH, height = HEIGHT, teamPage = -1, teamMode = "diagram", pulse = true) {
    const rows = [];
    const word = (text,fg = "text",bg) => ({text,fg,bg});
    const isDone = i => i === 4 ? state.rework === "done" : state.status === "passed" || i < state.stage - 1;
    const applicable = state.rework === "skipped" ? phases.length - 1 : phases.length;
    const completed = phases.filter((_,i) => isDone(i)).length;
    const caution = ["held","waiting","connecting"].includes(state.status) || Boolean(state.connection);
    const wide = width >= 56;
    const full = height >= 18 && width >= 30;
    const splitTeam = width >= 76 && height >= 24;
    const teamAt = 39;
    const bordered = width >= 24 && height >= 7;
    const edge = bordered ? 1 : 0;
    const pad = width >= 38 ? "  " : " ";
    const status = state.connection && state.status !== "connecting" ? "연결 끊김" : labels[state.status];
    const pulseOn = pulse || Boolean(state.connection);
    const dotColor = pulseOn ? "text" : "shadow";
    const viewingAcceptance = state.viewStage === 6 && state.stage === 5;
    const displayStage = viewingAcceptance ? "06 · 최종 인수 · 착수 대기" :
      "0" + state.stage + " · " + phases[state.stage - 1] + " · " + status;
    const displayTask = state.notice || state.task;
    const teamRows = teamList(state);
    const activeAgents = teamRows.filter(agent => agent.status === "running").length;
    const inactiveAgents = teamRows.filter(agent => agent.status === "inactive").length;
    const teamSummary = state.agents === undefined ? "상태 미연결" :
      "실행 " + activeAgents + " · 비활성 " + inactiveAgents + " / " + teamRows.length +
      (state.connection ? " · 마지막 상태" : "");
    const measure = text => [...text].reduce((n,ch) => n + widthOf(ch),0);
    const small = (value,n,fill = false) => {
      const cap = Math.max(0,n);
      const chars = [...clipControls(value)];
      const limit = chars.reduce((n,ch) => n + widthOf(ch),0) > cap && cap > 0 ? cap - 1 : cap;
      let output = "", used = 0;
      for (const ch of chars) {
        const w = widthOf(ch);
        if (used + w > limit) break;
        output += ch; used += w;
      }
      if (limit < cap) { output += "…"; used++; }
      return fill ? output + " ".repeat(cap - used) : output;
    };
    const bar = (left,mark,right,junction) => {
      if (bordered) rows.push([{ch:left,fg:"line"},
        ...Array.from({length:width - 2},(_,i) => ({
          ch:splitTeam && junction && i === teamAt ? junction : mark,fg:"line"
        })),{ch:right,fg:"line"}]);
    };
    function line(...pieces) {
      if (rows.length >= height) return;
      const row = bordered ? [{ch:"│",fg:"line"}] : [];
      let count = edge;
      for (const {text,fg,bg} of pieces) {
        for (const ch of clipControls(text)) {
          const w = widthOf(ch);
          if (count + w > width - edge) break;
          if (w === 0) { if (row.length > edge) row.at(-1).ch += ch; continue; }
          row.push({ch,w,fg,bg});
          count += w;
        }
      }
      while (count++ < width - edge) row.push({ch:" "});
      if (bordered) row.push({ch:"│",fg:"line"});
      rows.push(row);
    }
    function keyValue(label,value) {
      const key = pad + (wide ? small(label,13,true) : label + " ");
      line(word(key,"dim"),word(small(value,width - 2*edge - measure(key))));
    }
    function footer() {
      if (!state.demo || width < 40) line(word(pad + "T 팀 구조   Q 닫기","dim"));
      else if (!wide) line(word(pad + "1–6 단계  T 팀  R 재실측  Q 닫기","dim"));
      else line(word(pad + "1–6 단계  T 팀 구조  W 대기  R 재실측  H 보류  P 통과  Q 닫기","dim"));
    }
    function agentRow(agent, available) {
      if (!agent) return [];
      const color = agent.status === "running" ? "text" : "dim";
      const label = agentLabels[agent.status];
      const nameWidth = Math.max(4,Math.min(20,available - 9));
      return [
        word(agentMarks[agent.status],agent.status === "running" ? dotColor : color),
        word(" " + small(agent.name,nameWidth,true),color),
        word(" " + small(label,6,true),color),
        ...(available > nameWidth + 10 && agent.task
          ? [word(" " + small(agent.task,available - nameWidth - 10),"dim")] : [])
      ];
    }
    if (teamPage >= 0 && teamMode === "diagram" && width >= 68 && height >= 23) {
      const usable = width - 2*edge - pad.length;
      const columnRoom = usable - 11 - pad.length;
      const sizes = [Math.floor(columnRoom*.28),Math.ceil(columnRoom*.19),Math.floor(columnRoom*.23)];
      sizes.push(columnRoom - sizes.reduce((sum,n) => sum + n,0));
      const centers = sizes.map((size,i) => sizes.slice(0,i).reduce((sum,n) => sum+n+3,0) + Math.floor(size/2));
      const parent = Math.floor((centers[0] + centers.at(-1))/2);
      const team = new Map(teamRows.map(agent => [agent.name,agent]));
      const groupActive = groups.map(([,members]) => members.some(([id]) => team.get(id).status === "running"));
      const main = team.get("MAIN");
      const mainBadge = " " + agentMarks[main.status] + " MAIN / 지휘 · " + agentLabels[main.status] + " ";
      const focused = teamRows.find(agent => agent.name !== "MAIN" && agent.status === "running") ||
        teamRows.find(agent => agent.status === "held") || teamRows.find(agent => agent.status === "running");
      bar("╭","─","╮");
      line(word(pad),word(" TEAM MAP ","ink","text"),word("  지휘·인계"),word(state.demo ? "   DEMO" : "   LIVE","dim"));
      line(word(pad + small("현재 단계 · " + phases[state.stage-1] + "   |   " + teamSummary,usable),"dim"));
      bar("├","─","┤");
      line(word(pad + " ".repeat(parent - Math.floor(measure(mainBadge)/2))),
        ...(main.status === "running" ? [
          word(" ","ink","text"),word("●",pulseOn ? "ink" : "line","text"),word(mainBadge.slice(2),"ink","text")
        ] : [word(mainBadge,"dim")]));
      line(word(pad + " ".repeat(parent) + "│",groupActive.some(Boolean) ? "text" : "line"));
      const branch = Array(usable).fill(" ");
      for(let i=centers[0];i<=centers.at(-1);i++)branch[i]="─";
      centers.forEach((i,k) => {branch[i] = k === 0 ? "┌" : k === centers.length-1 ? "┐" : "┬";});
      branch[parent] = branch[parent] === "┬" ? "┼" : "┴";
      line(word(pad),...branch.map((ch,x) => word(ch,
        centers.some((col,i) => groupActive[i] && x >= Math.min(col,parent) && x <= Math.max(col,parent)) ? "text" : "line")));
      function groupRow(values,header = false) {
        const pieces = [word(pad)];
        values.forEach((value,i) => {
          if(i) pieces.push(word(" "));
          const outline = groupActive[i] ? "text" : "line";
          pieces.push(word("│",outline));
          if (value.startsWith("●")) {
            pieces.push(word(" "),word("●",dotColor),word(small(value.slice(1),sizes[i]-2,true)));
          } else {
            pieces.push(word(small(" " + value,sizes[i],true),header && groupActive[i] ? "ink" : "dim",
              header && groupActive[i] ? "text" : "ink"));
          }
          pieces.push(word("│",outline));
        });
        line(...pieces);
      }
      function cardEdge(top) {
        const pieces = [word(pad)];
        sizes.forEach((size,i) => {
          if(i) pieces.push(word(" "));
          const split = Math.floor(size/2) - 1;
          const span = top ? "─".repeat(split) + "┬" + "─".repeat(size-split-1) : "─".repeat(size);
          pieces.push(word((top ? "╭" : "╰") + span + (top ? "╮" : "╯"),groupActive[i] ? "text" : "line"));
        });
        line(...pieces);
      }
      cardEdge(true);
      groupRow(groups.map(([name])=>name),true);
      for (let row = 0; row < 5; row++) groupRow(groups.map(([,members]) => {
        const item = members[row];
        return item ? agentMarks[team.get(item[0]).status] + " " + item[1] : "";
      }));
      cardEdge(false);
      line(word(pad + "● 실행  · 비활성  ○ 대기  ✓ 완료  ! 보류  ? 미확인","dim"));
      bar("├","─","┤");
      keyValue("담당 작업",focused ? focused.name + " · " + (focused.task || "배정 작업 미확인") : "현재 작업이 보고된 역할 없음");
      keyValue("확인 활동",focused?.activity
        ? focused.activity.time + " · " + activitySources[focused.activity.source] + " · " + focused.activity.detail
        : "확인된 활동 없음");
      keyValue("절차상 인계",handoffRoutes[state.stage-1]);
      const last = state.handoffs?.at(-1);
      keyValue(state.demo ? "시연 인계" : "보고 인계",last
        ? last.from + " → " + last.to + (last.at ? " · " + last.at : "") : "보고된 인계 없음");
      if (last && rows.length < height-2) keyValue("인계 내용",last.task);
      while (rows.length < height-2) line(word(""));
      line(word(pad + "T 현황판   L 역할 목록   Q 닫기","dim"));
      bar("╰","─","╯");
      return rows;
    }
    if (teamPage >= 0) {
      const page = Math.min(teamPage,teamPages(state,height) - 1);
      bar("╭","─","╮");
      line(word(pad + (teamMode === "diagram" ? "MAIN → SUB  " : "AGENT TEAM  ") + (page + 1) + "/" + teamPages(state,height)));
      line(word(pad + small(teamSummary,width - 2*edge - pad.length),"dim"));
      bar("├","─","┤");
      for (const agent of teamRows.slice(page*teamPageSize(height),(page+1)*teamPageSize(height))) {
        line(word(pad),...agentRow(agent,width - 2*edge - pad.length));
      }
      while (rows.length < height - (bordered ? 2 : 1)) line(word(""));
      line(word(pad + (width >= 42 ? "T 현황판   L 목록   B 이전 / N 다음   Q 닫기" : "T 복귀 B/N 이동 Q"),"dim"));
      if (rows.length < height) bar("╰","─","╯");
      return rows;
    }
    bar("╭","─","╮");
    if (height < 5 || width < 19) {
      line(word(small("CRAFT · " + status,width)));
      line(word(small("0" + state.stage + " " + phases[state.stage - 1],width)));
      line(word(small(state.task,width)));
      line(word(small("Q 닫기",width)));
      return rows;
    }
    const largeBrand = height >= 23 && width >= 51;
    const heading = width >= 45 ? "  REPLICA MONITOR" : " MONITOR";
    const runLabel = "  " + (state.demo ? "DEMO" : "LIVE") + " / RUN ";
    const targetLabel = wide ? "TARGET   " : "대상 ";
    function target(available) {
      return [word(targetLabel,"dim"),
        word(" " + small(state.target,available - measure(targetLabel) - 2) + " ","ink","text")];
    }
    if (largeBrand) {
      const gutter = "    ";
      const room = width - 2*edge - pad.length - brand[0].length - gutter.length;
      const signature = [
        [word("C R A F T")],
        [word("REPLICA MONITOR","dim")],
        [word("─".repeat(Math.min(25,room)),"line")],
        [word("GITHUB   ","dim"),word("Yfacine/CRAFT")],
        target(room)
      ];
      if (width >= 76) {
        const runId = small(state.runId,7);
        signature[0].push(word(" ".repeat(Math.max(2,room - 9 - measure(runLabel + runId))),"dim"),
          word(runLabel,"dim"),word(runId));
      }
      for (const [i,row] of brand.entries()) {
        line(word(pad),...[...row].map(ch => word(ch,ch === "░" ? "shadow" : "text")),
          word(gutter),...signature[i]);
      }
    } else {
      line(word(pad),word(" CRAFT ","ink","text"),word(heading),
        ...(width >= 47 ? [word("  ·  ","dim"),word("Yfacine/CRAFT")] : []));
      if (width < 47 && height >= 9) keyValue("GITHUB","Yfacine/CRAFT");
      line(word(pad),...target(width - 2*edge - pad.length));
    }
    if (!full) {
      keyValue(viewingAcceptance ? "보기" : "현재",displayStage);
      keyValue(state.notice ? "안내" : state.status === "held" ? "보류" : "작업",displayTask);
      if (height >= 9 && rows.length < height - (bordered ? 2 : 1)) keyValue("팀",teamSummary);
      if (rows.length < height - (bordered ? 2 : 1)) keyValue("다음",state.next);
      while (rows.length < height - (bordered ? 2 : 1)) line(word(""));
      if (rows.length < height - (bordered ? 1 : 0)) footer();
      if (rows.length < height) bar("╰","─","╯");
      return rows;
    }
    bar("├","─","┤","┬");
    const workflowHeading = pad + (wide ? "WORKFLOW" : "전체 단계") + "   ";
    const workflowCount = completed + " / " + applicable + " 완료";
    function sideTeam(left,...right) {
      const used = left.reduce((n,part) => n + measure(part.text),0);
      line(...left,word(" ".repeat(Math.max(0,teamAt - used)) + "│  ","line"),...right);
    }
    if (splitTeam) sideTeam([word(workflowHeading,"dim"),word(workflowCount)],
      word("AGENT TEAM  ","dim"),word(small(teamSummary,width - teamAt - 17)));
    else line(word(workflowHeading,"dim"),word(workflowCount));
    for (const [i,phase] of phases.entries()) {
      const done = isDone(i), skipped = i === 4 && state.rework === "skipped";
      const current = i === state.stage - 1 && !done;
      const icon = skipped ? "–" : done ? "✓" : current ? caution ? "!" : "▶" : "○";
      const detail = skipped ? "해당 없음" : done ? "완료" : current ? status :
        i === 4 && state.stage === 6 && state.status === "held" ? "수정 필요" : "대기";
      const left = [word(pad + icon + " " + "0" + (i + 1) + "  ",current ? "text" : "dim"),
        word(small(phase,splitTeam ? 21 : wide ? 24 : width >= 42 ? 21 : 12,true),current ? "text" : "dim"),word(detail,current ? "text" : "dim")];
      if (!splitTeam) { line(...left); continue; }
      sideTeam(left,...agentRow(teamRows[i],width - teamAt - 5));
    }
    if (splitTeam) {
      const details = [
        "CURRENT  " + displayStage,
        (state.notice ? "안내 " : "작업 ") + displayTask,
        "최근 " + state.result,
        "다음 " + state.next,
        gates.map(gate => gate + " " + state.gates[gate]).join("  ")
      ];
      for (const [i,detail] of details.entries()) {
        sideTeam([word(pad + small(detail,teamAt - pad.length),i === 0 ? "text" : "dim")],
          ...agentRow(teamRows[phases.length + i],width - teamAt - 5));
      }
      bar("├","─","┤","┴");
      if (height - rows.length >= 3) keyValue(state.notice ? "키 입력 안내" : "현재 작업",displayTask);
      if (height - rows.length >= 3) keyValue("다음 단계",state.next);
      if (height - rows.length >= 4 && state.events.length) {
        line(word(pad + "RECENT ACTIVITY","dim"));
        const recent = state.events.slice(-3).reverse().slice(0,height - rows.length - 2);
        for (const [time,event] of recent) keyValue(time,event);
      }
      while (rows.length < height - 2) line(word(""));
      footer();
      bar("╰","─","╯");
      return rows;
    }
    bar("├","─","┤","┴");
    keyValue(viewingAcceptance ? "DETAIL" : wide ? "CURRENT" : "현재",displayStage);
    keyValue(state.notice ? "키 입력 안내" : state.status === "held" ? "보류 사유" : "현재 작업",displayTask);
    if (height >= 17) keyValue("최근 확인",state.result);
    keyValue("다음 단계",state.next);
    if (!splitTeam && height >= 20) keyValue("에이전트",teamSummary);
    if (height >= 19) {
      const compact = { PENDING:"·", PASS:"✓", HOLD:"!" };
      line(word(pad + "GATES  ","dim"),...gates.flatMap(gate => [
        word(gate + " ","dim"),
        word(wide ? state.gates[gate] : compact[state.gates[gate]]),word(wide ? "    " : " ")
      ]));
    }
    const reserve = bordered ? 2 : 1;
    if (height - rows.length - reserve >= 3) {
      bar("├","─","┤");
      line(word(pad + (wide ? "RECENT ACTIVITY" : "최근 이력"),"dim"),
        word(state.connection && wide ? "   " + state.connection : ""));
      const recent = state.events.slice(-3).reverse();
      const visible = Math.min(recent.length,height - rows.length - reserve);
      for (const event of recent.slice(0,visible)) {
        if (wide) keyValue(event[0],event[1]);
        else line(word(pad),word(small(event[1],width - pad.length - 2*edge)));
      }
    } else if (height - rows.length - reserve >= 1 && state.events.length) {
      const [time,event] = state.events.at(-1);
      keyValue("최근 이력",time + " · " + event);
    }
    while (rows.length < height - reserve) line(word(""));
    footer();
    if (rows.length < height) bar("╰","─","╯");
    return rows;
  }
  function ansi(rows, colored) {
    const rgb = color => colors[color].slice(1).match(/../g).map(hex => parseInt(hex,16)).join(";");
    return rows.map(row => {
      if (!colored) return row.map(({ch}) => ch).join("");
      let line = "", previous = "";
      for (const {ch,fg,bg} of row) {
        const current = (fg || "text") + "/" + (bg || "ink");
        if (current !== previous) {
          line += "\x1b[38;2;" + rgb(fg || "text") + ";48;2;" + rgb(bg || "ink") + "m";
          previous = current;
        }
        line += ch;
      }
      return line + "\x1b[0m";
    }).join("\r\n");
  }
  return { WIDTH, HEIGHT, colors, roster, makeDemo, keyName, demoKey, normalize, connecting, screen, ansi, teamPages };
})();

if (typeof module !== "undefined") {
  module.exports = CraftMonitor;
  if (require.main === module) {
    const fs = require("node:fs");
    const args = process.argv.slice(2);
    if (args.includes("--sample-state")) {
      const { demo, ...sample } = CraftMonitor.makeDemo();
      process.stdout.write(JSON.stringify(sample,null,2) + "\n");
      process.exit(0);
    }
    const stateArg = args.indexOf("--state");
    if (stateArg >= 0 && (!args[stateArg + 1] || args[stateArg + 1].startsWith("--"))) {
      console.error("사용법: node craft-progress-monitor.cjs --state <상태 JSON 파일>");
      process.exit(2);
    }
    const statePath = stateArg < 0 ? "" : args[stateArg + 1];
    const interactive = process.stdout.isTTY && process.stdin.isTTY && !args.includes("--snapshot");
    const colored = !args.includes("--plain") && (interactive || args.includes("--color"));
    let state = CraftMonitor.makeDemo();
    let previous;
    function refresh() {
      if (!statePath) return;
      try {
        const info = fs.statSync(statePath);
        if (!info.isFile() || info.size > 256 * 1024) throw Error("상태 파일 형식 또는 용량 오류");
        const data = fs.readFileSync(statePath,"utf8").replace(/^\uFEFF/,"");
        previous = CraftMonitor.normalize(JSON.parse(data));
        state = previous;
      } catch (error) {
        state = CraftMonitor.connecting(error.code === "ENOENT" ? "상태 파일 대기" : "상태 읽기 오류",previous);
      }
    }
    refresh();
    if (!statePath) for (const key of args.find(arg => arg.startsWith("--keys="))?.slice(7) || "") {
      state = CraftMonitor.demoKey(state,key);
    }
    let teamPage = -1;
    let teamMode = "diagram";
    let pulse = true;
    const output = (width,height) => CraftMonitor.ansi(CraftMonitor.screen(state,width,height,teamPage,teamMode,pulse),colored);
    if (!interactive) {
      process.stdout.write(output() + "\n");
    } else {
      let last = "";
      let size = "";
      function draw() {
        const width = process.stdout.columns || CraftMonitor.WIDTH;
        const height = process.stdout.rows || CraftMonitor.HEIGHT;
        const dimensions = width + "x" + height;
        const frame = output(width,height);
        if (dimensions !== size) {
          process.stdout.write("\x1b[2J");
          size = dimensions;
          last = "";
        }
        if (frame === last) return;
        if (last && frame.split("\r\n").length === last.split("\r\n").length) {
          const before = last.split("\r\n");
          const changes = frame.split("\r\n").map((row,i) =>
            row === before[i] ? "" : "\x1b[" + (i+1) + ";1H" + row).join("");
          process.stdout.write(changes);
        } else process.stdout.write("\x1b[H" + frame);
        last = frame;
      }
      process.stdout.write("\x1b[?1049h\x1b[?25l\x1b[?7l\x1b[2J");
      require("node:readline").emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.setEncoding("utf8");
      process.stdin.resume();
      const poll = statePath ? setInterval(() => { refresh(); draw(); },500) : undefined;
      const blink = colored && !args.includes("--no-blink")
        ? setInterval(() => { pulse = !pulse; draw(); },650) : undefined;
      function close() {
        if (poll) clearInterval(poll);
        if (blink) clearInterval(blink);
        process.stdout.off("resize",draw);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\x1b[0m\x1b[?7h\x1b[?25h\x1b[?1049l",() => process.exit(0));
      }
      process.stdin.on("keypress", (input,event = {}) => {
        const key = CraftMonitor.keyName(input || event.name || "");
        if ((event.ctrl && event.name === "c") || key === "q") { close(); return; }
        if (key === "t") { teamPage = teamPage < 0 ? 0 : -1; teamMode = "diagram"; draw(); return; }
        if (key === "l") {
          teamMode = teamPage >= 0 && teamMode === "list" ? "diagram" : "list";
          teamPage = 0; draw(); return;
        }
        if (teamPage >= 0 && ["n","b","right","left"].includes(key)) {
          if (teamMode === "diagram" && process.stdout.columns >= 68 && process.stdout.rows >= 23) return;
          const count = CraftMonitor.teamPages(state,process.stdout.rows || CraftMonitor.HEIGHT);
          const current = Math.min(teamPage,count - 1);
          teamPage = Math.max(0,Math.min(count - 1,current + (["n","right"].includes(key) ? 1 : -1)));
          draw(); return;
        }
        if (!/^[1-6wrhp]$/.test(key) || event.ctrl || event.meta) return;
        if (!statePath) state = CraftMonitor.demoKey(state,key);
        draw();
      });
      process.stdout.on("resize",draw);
      draw();
    }
  }
}

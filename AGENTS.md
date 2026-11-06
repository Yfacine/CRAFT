# CRAFT

이 작업공간은 여러 종류의 상용 프로그램에서 필요한 업무 흐름을 재현하는 대체 프로그램을 개발한다. 대상별 범위와 실측 기준은 `plans/04_target-plan-template.md`에서 시작한다.

- 상대 경로의 기준은 이 AGENTS.md가 있는 CRAFT 프로젝트 루트다. MAIN은 역할을 배정할 때 실제 루트 경로를 함께 넘긴다.
- 복제품 조사·구현·검증 요청에는 `.agents/skills/craft-replica/SKILL.md`를 적용한다. CRAFT 채팅의 주 에이전트가 MAIN으로 계획·배정·인수를 맡는다.
- 분석 SUB 5명은 근거와 명세를 만들고, 제품 코드 작성·수정은 `craft_coder`에 배정한다. 코드 변경에는 `craft_code_review`를 별도로 배정한다. TF 3명은 작업 설계, 구현 정합성, 품질·인수를 검토한다.
- 기존 `craft_replica` 이름으로 요청해도 MAIN이 `$craft-replica`와 같은 절차로 처리한다. 개별 역할 호출명과 작업 순서는 `plans/01_main-plan.md`에 있다.
- 원본 도구 사용법은 `plans/references/README.md`에 있다. 대상 프로젝트와 증거는 `targets/<대상-id>/`로 분리하고 다른 프로젝트는 사용자가 지정한 작업 범위를 따른다.
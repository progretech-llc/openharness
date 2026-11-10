# Worker default profile experiment: NOT RELEASED

This branch proposes an agent-created OpenCode default using local GPT OSS 20B while preserving manual Qwen defaults and explicit model routes. It has not been installed.

All 75 focused cases passed, and type checking passed. The changed controller file did not meet its required coverage gate: statements97.8%, branches98.01%, functions95.83%, lines100%. The uncovered monitor preparation paths are at create.ts405-414. Two grouped checks were run; this candidate is held rather than reported as a pass.

Current factory recovery uses existing project-local Claude settings and supported native model controls. Native OpenClaw selected the already allowed local Gemma4 profile after its automation model policy rejected GPT OSS20B; that policy was preserved. The current Finance Claude worker uses local GPT OSS20B, has made an actual Read call and remains under artifact review. No product output is accepted by this experiment.

Do not merge or install this branch without the repository's controller coverage and isolated end-to-end requirements. Keep the deployed scoped OpenCode2 configuration fix4674e616 intact. The upstream bare-function parser gap is tracked on board315; native worker recovery is on316.

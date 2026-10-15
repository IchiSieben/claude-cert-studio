// CCAR-F practice bank — original questions written from the official task statements (exam guide v1.0, July 2026).
// Reviewed 2026-09-26 against Anthropic docs, the MCP specification and the Anthropic engineering blog; see ../../03-practica/revision-banco-2026-09-26.md.
// Schema: see ../README.md. Every wrong option carries a trap key from TRAPS in blueprints.js.
window.QUESTIONS = window.QUESTIONS || {};
window.QUESTIONS["CCAR-F"] = [
 {
  "id": "CCARF-1.1-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.1",
  "select": 1,
  "stem": "An architect reviews a custom agent loop built on the Messages API. The loop sends a request, then checks whether the returned text contains the word 'DONE'; if it does not, it executes any tool calls and continues. In production the agent sometimes stops after a single turn even though Claude requested a tool, because Claude wrote a short sentence such as 'Done gathering context, now calling the search tool' next to the tool_use block. The team wants the MOST reliable termination logic. What should the architect change?",
  "options": {
   "A": "Tighten the check so the loop only stops when the text matches the exact regular expression ^DONE$ at the end of the response.",
   "B": "Add a system prompt instruction telling Claude never to write any text in the same turn as a tool call.",
   "C": "Branch on stop_reason: when it is tool_use, execute every tool_use block and send the results back; treat end_turn as completion regardless of the text.",
   "D": "Lower the temperature so Claude produces fewer conversational sentences alongside its tool calls."
  },
  "answer": [
   "C"
  ],
  "explanation": "The API already tells the caller what Claude intends via stop_reason. A tool_use stop_reason means Claude is waiting for tool results; end_turn means it considers the turn complete. Text blocks can legitimately appear alongside tool_use blocks, so any decision based on prose is structurally fragile. Driving the loop from stop_reason removes the ambiguity entirely.",
  "distractors": {
   "A": "text-parsing",
   "B": "prompt-not-enforcement",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "A": "A stricter regex is still parsing prose for control flow; it only narrows the failure instead of removing it.",
   "B": "Asking the model to suppress text is a prompt where the protocol already offers a deterministic signal; it can still be ignored.",
   "D": "Temperature changes how often the sentence appears, not the fact that the loop keys on the wrong signal."
  },
  "concept": "stop_reason-driven loop",
  "learn": "Branch on stop_reason whenever you implement an agentic loop: tool_use means execute and continue, end_turn means finish, max_tokens and stop_sequence need their own handling. It is the wrong call only when you are not in a loop at all (single-shot generation). The common mistake is treating the presence or absence of text as the signal of completion.",
  "apply": "If your loop checks for a keyword such as 'done' or 'finished' in the response text, you are parsing text for control flow; switch to response.stop_reason."
 },
 {
  "id": "CCARF-1.1-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.1",
  "select": 1,
  "stem": "A data-extraction agent occasionally returns half-written JSON to the caller. Logs show that on those runs the response carried stop_reason 'max_tokens' while Claude was in the middle of emitting a tool_use block, and the loop simply passed the last message through as the final answer. The team wants the agent to be CORRECT even on very long extractions, without silently returning truncated output. What should the architect do?",
  "options": {
   "A": "Handle max_tokens explicitly as its own branch: never treat it as completion, and either continue with a larger budget or fail the run with a clear error.",
   "B": "Check whether the last text block ends with a closing brace and only accept the output when it does.",
   "C": "Set max_tokens to the largest value the model allows on every request so truncation can no longer occur.",
   "D": "Assume max_tokens cannot occur during a tool call, so the truncation must come from the tool implementation."
  },
  "answer": [
   "A"
  ],
  "explanation": "stop_reason is an enumerated field with several documented values (end_turn, max_tokens, stop_sequence, tool_use, pause_turn, refusal, model_context_window_exceeded), and each demands a different action. max_tokens means the model was cut off, so the content is by definition incomplete; the docs say that when a truncated response contains an incomplete tool_use block you must retry with a higher max_tokens. The loop must never treat max_tokens as end_turn: the fix is a dedicated branch that retries with a higher budget or surfaces a controlled failure.",
  "distractors": {
   "B": "text-parsing",
   "C": "parameter-patch",
   "D": "myth"
  },
  "why_wrong": {
   "B": "Inspecting the shape of the text to detect completeness is parsing prose for control flow when the API already reports truncation.",
   "C": "Raising max_tokens to the ceiling is a parameter patch; the loop still has no logic for the case when the ceiling is reached.",
   "D": "It is a myth that truncation cannot interrupt a tool_use block; the token budget applies to the whole response."
  },
  "concept": "Handling every stop_reason value",
  "learn": "An agentic loop should have an explicit branch for tool_use, end_turn, max_tokens and stop_sequence, plus handling for the other documented values (pause_turn, refusal, model_context_window_exceeded) or a safe non-completion default. This is always the right call in production loops; skipping it is only acceptable in throwaway scripts. The common mistake is an if/else with two branches (tool_use vs 'anything else').",
  "apply": "If your loop has no code path that mentions max_tokens, truncated responses are being returned as if they were complete."
 },
 {
  "id": "CCARF-1.1-03",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.1",
  "select": 2,
  "stem": "A research agent gives Claude three independent lookup tools. When Claude returns several tool_use blocks in one assistant message, the loop executes only the first block, returns a single tool_result, and the API rejects the next request. The architect must fix the loop WITHOUT reducing throughput. Which two changes are required? (Select TWO.)",
  "options": {
   "A": "Iterate over every tool_use block in the assistant content and execute each one.",
   "B": "Send each tool_result as a separate assistant message so the model sees them one at a time.",
   "C": "Return all tool_result blocks together in a single user message, each carrying the tool_use_id it answers.",
   "D": "Configure tool_choice so the model can never request more than one tool per turn."
  },
  "answer": [
   "A",
   "C"
  ],
  "explanation": "When Claude requests several tools at once, the protocol expects every request to be answered: the next user message must contain one tool_result per tool_use, matched by id. Executing all blocks and returning all results in one message keeps the parallelism the model asked for.",
  "distractors": {
   "B": "myth",
   "D": "violates-constraint"
  },
  "why_wrong": {
   "B": "Tool results are content of the user turn, not assistant messages; splitting them per assistant turn is a myth about the message shape.",
   "D": "Forcing one tool per turn would work but serialises lookups, which breaks the throughput constraint."
  },
  "concept": "Parallel tool_use handling",
  "learn": "Always process the full list of tool_use blocks and answer each with a tool_result carrying the matching tool_use_id. Disabling parallel calls is only justified when tools genuinely depend on each other. The common mistake is code written for a single tool call that indexes content[0].",
  "apply": "If your loop reads only the first tool_use block or builds one tool_result per request, it breaks as soon as Claude batches its calls."
 },
 {
  "id": "CCARF-1.2-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.2",
  "select": 1,
  "stem": "A customer-support system has a triage agent plus three specialist subagents (billing, shipping, technical). Specialists currently message each other directly when a case spans topics, and the team cannot reconstruct who decided what. Cases get lost when one specialist fails mid-conversation. The architect wants the SIMPLEST topology that restores observability and error handling. What should the architect do?",
  "options": {
   "A": "Introduce a message bus with topics so any specialist can publish partial results for the others to consume.",
   "B": "Make the triage agent the single coordinator: it routes each case to a specialist, receives the result, decides the next hop and handles failures.",
   "C": "Give every specialist a copy of the routing logic so each can decide independently when to hand off.",
   "D": "Instruct the specialists to be careful to keep each other informed whenever they hand off a case."
  },
  "answer": [
   "B"
  ],
  "explanation": "The hub-and-spoke pattern keeps one coordinator responsible for routing, sequencing and error handling; spokes do their job and report back. Peer-to-peer handoffs spread control across agents, which is exactly why decisions and failures become untraceable. Centralising the flow gives one place to log, retry and recover.",
  "distractors": {
   "A": "over-engineering",
   "C": "wrong-scope",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "A message bus adds infrastructure while leaving control distributed; it is over-engineering for a problem of ownership.",
   "C": "Routing logic belongs to the coordinator; placing it inside every subagent is the right mechanism at the wrong level.",
   "D": "'Be careful to keep each other informed' is advice without a measurable rule and enforces nothing."
  },
  "concept": "Hub-and-spoke coordinator",
  "learn": "Use a coordinator when several specialists must be sequenced, retried or audited; it is the default for multi-agent systems. Direct peer communication is rarely worth it in a foundations-level design. The common mistake is letting subagents call each other, which hides failures from the orchestrator.",
  "apply": "If a subagent's prompt or code can invoke another subagent, control has leaked out of the coordinator."
 },
 {
  "id": "CCARF-1.2-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.2",
  "select": 1,
  "stem": "An internal analytics assistant runs a fixed sequence for every question: schema lookup, SQL generation, chart generation, narrative. Users complain that simple questions ('how many rows are in table X?') take minutes and produce unwanted charts, while unusual requests (compare two data sources) fail because no step covers them. The architect wants the coordinator to ADAPT the work to each request. Which change BEST achieves this?",
  "options": {
   "A": "Raise the coordinator's token budget so it can afford to run every step for every request.",
   "B": "Build a separate hard-coded pipeline for each request type and pick one with a keyword lookup table.",
   "C": "Add a post-processing step that removes charts from the answer when the question looked simple.",
   "D": "Have the coordinator inspect the request, choose which subagents to invoke and in what order, and skip steps that are not needed."
  },
  "answer": [
   "D"
  ],
  "explanation": "The task statement calls for a coordinator that selects subagents dynamically. A fixed chain is fine when every input needs the same steps, but here requests differ in shape, so the coordinator itself must decide the plan per request. That single change removes both the wasted steps and the uncovered cases.",
  "distractors": {
   "A": "parameter-patch",
   "B": "over-engineering",
   "C": "text-parsing"
  },
  "why_wrong": {
   "A": "More tokens do not change which steps run; this is a parameter patch on an architectural problem.",
   "B": "One pipeline per request type multiplies maintenance and still fails on the next unforeseen request.",
   "C": "Filtering output after the fact based on how the question looked is parsing prose for control flow."
  },
  "concept": "Dynamic subagent selection",
  "learn": "Let the coordinator pick subagents when request shapes vary widely; keep a fixed chain when they do not. Dynamic routing is the wrong call for uniform, high-volume transformations where predictability matters more. The common mistake is bolting special cases onto a fixed chain until it becomes unmaintainable.",
  "apply": "If your orchestrator is a list of steps executed top to bottom regardless of input, it cannot adapt; the coordinator needs a decision step first."
 },
 {
  "id": "CCARF-1.2-03",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.2",
  "select": 1,
  "stem": "In a document-processing system the coordinator dispatches a 'legal review' subagent and a 'financial review' subagent, then merges their findings. When the financial subagent hits a transient API error, the coordinator currently returns the legal findings alone as the final report, and nobody notices the missing section until a client complains. The architect must make the system handle subagent failure RELIABLY. What should the architect do?",
  "options": {
   "A": "Make the coordinator detect the failed subagent, retry it with backoff, and if it still fails mark the report incomplete and escalate instead of delivering it.",
   "B": "Rely on the financial subagent to retry itself, since subagents automatically re-run when a request errors.",
   "C": "Instruct the coordinator to use its judgment about whether a partial report is good enough.",
   "D": "Let the financial subagent decide whether the whole document task should be abandoned when it fails."
  },
  "answer": [
   "A"
  ],
  "explanation": "Error handling is a coordinator responsibility in hub-and-spoke designs: it knows which spokes were dispatched and which returned. The fix is explicit detection, bounded retry and a clear incomplete state that triggers escalation, so a missing section can never masquerade as a finished report.",
  "distractors": {
   "B": "myth",
   "C": "vague-guidance",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "B": "Subagents do not retry themselves automatically; assuming so is a myth that leaves the failure unhandled.",
   "C": "'Use your judgment' gives the coordinator no measurable rule for when a partial report is acceptable.",
   "D": "Deciding the fate of the overall task is the coordinator's job; pushing it into one subagent is the right concern at the wrong level."
  },
  "concept": "Coordinator-owned error handling",
  "learn": "The coordinator should track every dispatched subagent and treat a missing or failed result as a first-class state with retry and escalation. Pushing that responsibility to subagents is wrong because they lack the global view. The common mistake is merging whatever results arrived and calling it done.",
  "apply": "If your merge step never checks how many results it expected versus received, partial output can be delivered as complete."
 },
 {
  "id": "CCARF-1.3-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.3",
  "select": 1,
  "stem": "A team builds a code-review agent with the Agent SDK. The system prompt tells Claude to 'delegate security analysis to a dedicated subagent', but in every run Claude performs the security analysis inline and never spawns anything. The coordinator's tool set (the tools list that defines which tools it has, not the auto-approve list) contains only Read, Grep and Glob. Why is the delegation NOT happening, and what is the fix?",
  "options": {
   "A": "The prompt is not forceful enough; rewrite the delegation instruction in capital letters and repeat it at the end of the prompt.",
   "B": "The model's context is too small to hold a subagent; switch to a larger context configuration.",
   "C": "Subagents are spawned through the Agent tool (formerly named Task), which is missing from the coordinator's tool set; add it so the coordinator can delegate.",
   "D": "Subagents are created automatically whenever a prompt mentions delegation, so the run must be using an outdated SDK."
  },
  "answer": [
   "C"
  ],
  "explanation": "In Claude Code and the Agent SDK, spawning a subagent is itself a tool call: the Agent tool (formerly Task; Task still works as an alias). If that tool is not in the agent's tool set, Claude has no mechanism to delegate no matter what the prompt says, so it does the work itself. Note that allowedTools only pre-approves tools without restricting them, and the Agent tool does not prompt for permission; what removes delegation is leaving the tool out of the tools list (or a bare-name deny rule), and what restores it is adding it back.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "bigger-context",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Stronger wording cannot grant a capability the tool configuration withholds.",
   "B": "Context size has nothing to do with whether a tool is available; enlarging the window is the 'just add more context' reflex applied to a configuration problem.",
   "D": "Delegation is never automatic; it always goes through the Agent (Task) tool, so this is a myth."
  },
  "concept": "Task tool enables subagents",
  "learn": "Whenever a design relies on subagents, verify that the Agent tool (formerly Task) is in the parent's tool set. This is the right check for any 'the agent will not delegate' symptom. The common mistake is editing the prompt when the capability is missing from configuration.",
  "apply": "If your agent's tools list has no Agent (Task) entry and your prompt asks for delegation, the delegation instruction is unreachable."
 },
 {
  "id": "CCARF-1.3-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.3",
  "select": 1,
  "stem": "A migration assistant spends twenty turns discovering that a legacy service uses a non-standard date format and an undocumented retry header. It then spawns a subagent with the prompt 'Now write the adapter based on what we found.' The subagent produces an adapter that ignores both findings. The architect wants subagents to build on prior work CONSISTENTLY. What is the root cause and the fix?",
  "options": {
   "A": "The subagent shares the parent's conversation; the findings were simply too far back, so the parent should re-read the findings before spawning.",
   "B": "The subagent starts with a fresh context and sees only its prompt; the parent must pass the complete findings (formats, headers, decisions) inside the subagent prompt.",
   "C": "The parent's context window was nearly full; increase the model's context so the subagent can access the earlier turns.",
   "D": "The findings should be written to the project CLAUDE.md so every future subagent inherits them automatically."
  },
  "answer": [
   "B"
  ],
  "explanation": "A subagent does not inherit the parent's conversation; its entire world is the prompt it receives. 'Based on what we found' points to context that does not exist for it. The parent must serialise the concrete findings into the prompt, which is why the task statement stresses passing complete prior findings.",
  "distractors": {
   "A": "myth",
   "C": "bigger-context",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "A": "The premise is a myth: a subagent spawned with its own prompt starts fresh and never sees the parent's transcript, near or far (only a fork subagent inherits the parent conversation, and this one was not forked).",
   "C": "Enlarging the context does not make a separate context visible to the subagent.",
   "D": "CLAUDE.md is for durable project conventions, not per-task discoveries; using it here is the right mechanism at the wrong scope."
  },
  "concept": "Subagent context isolation",
  "learn": "Treat every subagent prompt as a self-contained brief: goal, constraints, and every fact it needs. This is right whenever the subagent must build on earlier work; it is unnecessary only for genuinely independent tasks. The common mistake is writing the subagent prompt as if it were the next message in the same chat.",
  "apply": "If a subagent prompt contains words like 'as discussed' or 'what we found' without the actual content, the subagent cannot see it."
 },
 {
  "id": "CCARF-1.4-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.4",
  "select": 1,
  "stem": "A deployment agent must run the test suite and get a green result before it is allowed to commit. The system prompt states this rule clearly, yet audit logs show commits made after a skipped or failing test run roughly once a week, sometimes reaching the main branch. The architect must GUARANTEE the prerequisite. What should the architect do?",
  "options": {
   "A": "Rewrite the rule in capital letters and place it both at the start and the end of the system prompt.",
   "B": "Reduce the model's temperature so it follows the instruction more consistently.",
   "C": "Ask the agent to re-read its own transcript before committing and confirm that the tests passed.",
   "D": "Add a PreToolUse hook on the commit command that checks for a fresh passing test report and blocks the tool call when it is missing."
  },
  "answer": [
   "D"
  ],
  "explanation": "A prerequisite with real consequences needs programmatic enforcement, not guidance. A PreToolUse hook runs deterministically before the tool executes and can deny it based on verifiable state (a recent passing test artefact). The model can no longer skip the gate, whatever it reasons.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "parameter-patch",
   "C": "self-review"
  },
  "why_wrong": {
   "A": "Louder prompting is still a prompt; it cannot make a step mandatory.",
   "B": "Temperature affects sampling variance, not whether a gate exists.",
   "C": "Having the same instance check itself keeps its own reasoning context and misses the cases where it decided the tests were unnecessary."
  },
  "concept": "Hooks as prerequisite gates",
  "learn": "Use hooks or permission gates whenever skipping a step has financial, security or data consequences; use prompt guidance for preferences and style. A hook is overkill only for cosmetic conventions. The common mistake is treating 'the prompt says so' as enforcement.",
  "apply": "If a step must never be skipped and you can only point to a sentence in the prompt, you have guidance, not enforcement."
 },
 {
  "id": "CCARF-1.4-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.4",
  "select": 2,
  "stem": "An architect is designing a three-stage data-migration workflow for a Claude Code agent: (1) generate migration scripts following the team's naming style, (2) dry-run them against a staging copy, (3) apply to the production database only after the dry-run report exists. The architect wants enforcement PROPORTIONATE to the risk of each rule. Which two decisions are correct? (Select TWO.)",
  "options": {
   "A": "Write a hook for every rule in the workflow, including the naming style, so nothing depends on the prompt.",
   "B": "Use a PreToolUse hook that blocks any command targeting production unless a dry-run report from the current session exists.",
   "C": "State in the system prompt that production must not be touched without a dry run, and trust the model to comply.",
   "D": "Describe the naming style and stage order in CLAUDE.md or the system prompt as guidance, since a deviation is cheap to correct."
  },
  "answer": [
   "B",
   "D"
  ],
  "explanation": "The task statement contrasts programmatic enforcement with prompt-based guidance. The production gate has irreversible consequences, so it needs a hook; naming style is a preference whose violation costs a quick fix, so guidance is enough. Matching the mechanism to the consequence is the architectural skill being tested.",
  "distractors": {
   "A": "over-engineering",
   "C": "prompt-not-enforcement"
  },
  "why_wrong": {
   "A": "Hooking cosmetic rules adds maintenance for no risk reduction; that is over-engineering.",
   "C": "A production write protected only by a sentence in the prompt is a prompt where enforcement is required."
  },
  "concept": "Enforcement proportional to consequence",
  "learn": "Classify each workflow rule by what happens when it is broken: irreversible or costly means hook or gate, cosmetic means guidance. Both extremes (all hooks, all prompts) are wrong. The common mistake is applying one mechanism uniformly.",
  "apply": "For each rule in your workflow, ask 'what is the blast radius if the model ignores this?'; if the answer scares you, it needs a hook."
 },
 {
  "id": "CCARF-1.5-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.5",
  "select": 1,
  "stem": "An Agent SDK application aggregates inventory from four supplier MCP servers. Each returns quantities in a different shape: one uses 'qty', another 'quantity_on_hand', one nests it under 'stock.available', and one returns strings. Claude frequently miscompares values and the prompt keeps growing with parsing instructions. The architect wants Claude to always see a UNIFORM structure. What should the architect do?",
  "options": {
   "A": "Add a PostToolUse hook that intercepts each supplier tool result and rewrites it into a canonical schema before it reaches Claude.",
   "B": "Extend the system prompt with a table explaining every supplier's field names so Claude can normalise them mentally.",
   "C": "Deploy a separate normalisation microservice in front of each supplier and point the MCP servers at it.",
   "D": "Put the field-mapping rules into the project CLAUDE.md so they are loaded at the start of every session."
  },
  "answer": [
   "A"
  ],
  "explanation": "Hooks exist precisely to intercept tool calls and results deterministically. A PostToolUse hook can transform heterogeneous payloads into one canonical shape in code, so the model reasons over uniform data and the prompt stops accumulating parsing rules. Normalisation done in code is repeatable; normalisation done by the model is not.",
  "distractors": {
   "B": "prompt-not-enforcement",
   "C": "over-engineering",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "B": "Asking the model to normalise data on every call is a prompt substitute for a deterministic transformation.",
   "C": "Four new services for a field-mapping problem is over-engineering when a hook does the same in-process.",
   "D": "CLAUDE.md is a Claude Code memory file, not an interception point; placing runtime data rules there is the wrong scope."
  },
  "concept": "PostToolUse normalisation hook",
  "learn": "Use PostToolUse hooks to normalise, redact or enrich tool output before the model sees it; use PreToolUse hooks to validate or block inputs. It is the wrong call when the transformation itself requires judgment. The common mistake is teaching the model the mapping instead of applying it in code.",
  "apply": "If your system prompt contains field-name mapping tables for tool outputs, that logic belongs in a PostToolUse hook."
 },
 {
  "id": "CCARF-1.5-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.5",
  "select": 1,
  "stem": "A team writes a PreToolUse hook in Claude Code to stop the agent from running 'rm -rf' on any path outside the build directory. During testing the hook prints 'blocked' and exits with code 1, yet the command still runs. The architect must make the block EFFECTIVE. What is the MOST likely cause?",
  "options": {
   "A": "Hooks can only observe tool calls, never prevent them; the team must move the check into the system prompt.",
   "B": "The hook should scan Claude's reasoning text for the phrase 'rm -rf' rather than the tool input.",
   "C": "Exit code 1 is a non-blocking error; the hook must exit with code 2 (or return a JSON decision that denies) for Claude Code to block the call.",
   "D": "The hook timeout is too short; increase it so the check has time to finish."
  },
  "answer": [
   "C"
  ],
  "explanation": "Claude Code interprets hook exit codes: 0 allows, 2 blocks and feeds stderr back to the model, and other non-zero codes are treated as non-blocking errors. A hook can also return structured JSON with an explicit decision. Using the wrong exit code turns a gate into a log line.",
  "distractors": {
   "A": "myth",
   "B": "text-parsing",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "A": "It is a myth that hooks cannot block; PreToolUse hooks are the documented mechanism for denying tool calls.",
   "B": "Inspecting reasoning prose instead of the structured tool input is parsing text for control flow.",
   "D": "The hook already finished and printed; a longer timeout changes nothing about the decision it returns."
  },
  "concept": "Hook exit codes and decisions",
  "learn": "Remember the hook contract: exit 0 allow, exit 2 block with feedback, JSON output for fine-grained decisions. This matters for every safety hook; it does not matter for purely informational hooks. The common mistake is assuming any non-zero exit blocks.",
  "apply": "If your blocking hook uses exit 1, it is only logging; change it to exit 2 or a JSON deny decision and test that the tool call is actually refused."
 },
 {
  "id": "CCARF-1.6-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.6",
  "select": 1,
  "stem": "A localisation pipeline receives product descriptions and must always: extract product attributes, translate the text, then render it into a fixed HTML template. Every input goes through the same three transformations in the same order, and the team values PREDICTABLE, easy-to-debug behaviour. Which decomposition should the architect choose?",
  "options": {
   "A": "A single autonomous agent with all three tools that decides at runtime which steps to apply and in what order.",
   "B": "A fixed sequential chain of three prompts, each consuming the previous output, with validation between steps.",
   "C": "One large prompt that asks for extraction, translation and rendering in a single response.",
   "D": "A coordinator that spawns a planning subagent to design a bespoke workflow for each description."
  },
  "answer": [
   "B"
  ],
  "explanation": "Prompt chaining is the right fit when the steps are known in advance and identical for every input: each stage has a narrow job, its output can be checked, and failures are easy to localise. Dynamic decomposition buys flexibility the problem does not need and costs predictability.",
  "distractors": {
   "A": "over-engineering",
   "C": "myth",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "An autonomous agent for a fixed transformation adds nondeterminism where none is wanted.",
   "C": "It is a myth that one prompt doing everything is simpler; intermediate validation becomes impossible and errors compound.",
   "D": "Planning a bespoke workflow per item is over-engineering for a pipeline whose steps never change."
  },
  "concept": "Fixed pipeline (prompt chaining)",
  "learn": "Choose a fixed chain when the sequence is stable and each step's output can be validated; choose dynamic decomposition when the steps depend on the input. Chains are the wrong call when inputs vary in structure. The common mistake is reaching for an agent because it feels more capable.",
  "apply": "If you can write the step list on a whiteboard before seeing any input, you have a pipeline, not an agent problem."
 },
 {
  "id": "CCARF-1.6-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.6",
  "select": 1,
  "stem": "A due-diligence assistant receives open-ended requests such as 'assess this vendor' or 'compare these two acquisition targets'. The current implementation is a fixed chain (company lookup, news search, financial summary, report), and it either runs irrelevant steps or misses steps the request needed. The architect wants the assistant to HANDLE VARIED requests well. Which change BEST addresses this?",
  "options": {
   "A": "Increase the token budget of every step so each one can cover more ground in case it is needed.",
   "B": "Lower the temperature of the chain so it applies the same steps more consistently.",
   "C": "Instruct each step to skip itself when it seems irrelevant to the request.",
   "D": "Replace the fixed chain with a planning step that decomposes each request into the sub-tasks it actually needs, then executes and adapts as results arrive."
  },
  "answer": [
   "D"
  ],
  "explanation": "When the required steps depend on the input, decomposition must happen at runtime. A planner that reads the request, produces a task list and revises it as results come in is the adaptive pattern the task statement describes. The fixed chain fails structurally because its steps were chosen before the request existed.",
  "distractors": {
   "A": "bigger-context",
   "B": "parameter-patch",
   "C": "vague-guidance"
  },
  "why_wrong": {
   "A": "More tokens per step do not add missing steps or remove irrelevant ones.",
   "B": "Consistency is not the problem; the chain is consistently wrong for varied inputs.",
   "C": "'Skip yourself if irrelevant' is fuzzy guidance inside a structure that still cannot add steps it lacks."
  },
  "concept": "Dynamic adaptive decomposition",
  "learn": "Use runtime planning when inputs are heterogeneous and the set of sub-tasks is not known in advance. It is the wrong call for uniform, high-volume transformations where a chain is cheaper and more predictable. The common mistake is patching a chain with conditionals until it becomes an unreadable pseudo-planner.",
  "apply": "If you keep adding 'if the request looks like X, also run Y' branches to a pipeline, the workload wants dynamic decomposition."
 },
 {
  "id": "CCARF-1.7-01",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.7",
  "select": 1,
  "stem": "A team runs a nightly Claude Code job that reviews the day's pull requests. Each night they start a brand-new session and paste the previous nights' review notes into the prompt so the agent remembers earlier decisions; the prompt is now enormous and the paste step breaks regularly. The architect wants continuity with the LEAST manual work. What should the architect do?",
  "options": {
   "A": "Give the review session a name and resume it each night with --resume <name>, so prior context carries over without pasting.",
   "B": "Keep pasting the notes but raise the context configuration so the prompt stops overflowing.",
   "C": "Move the accumulated review notes into the project CLAUDE.md so every session loads them automatically.",
   "D": "Start a fresh session each night; a new session automatically loads the previous night's full conversation, so nothing needs to be carried over."
  },
  "answer": [
   "A"
  ],
  "explanation": "Named session resumption exists for exactly this: a session can be picked up later with its conversation intact. It removes the manual paste and the growing prompt in one move, and the job can be scripted around a stable session name.",
  "distractors": {
   "B": "bigger-context",
   "C": "wrong-scope",
   "D": "myth"
  },
  "why_wrong": {
   "B": "A larger window keeps the fragile paste step and only delays the overflow.",
   "C": "CLAUDE.md holds durable conventions; dumping nightly transcripts there is the right file at the wrong scope.",
   "D": "Each session begins with a fresh context window; the previous conversation is available only if you resume it. Auto memory carries selective notes across sessions, not the transcript of a nightly review."
  },
  "concept": "Named session resumption",
  "learn": "Resume a named session when a long-running task must continue across invocations. It is the wrong call when each run should be independent (then a fresh session avoids stale context). The common mistake is rebuilding context by hand every run.",
  "apply": "If your automation script concatenates old transcripts into a new prompt, it is reinventing --resume."
 },
 {
  "id": "CCARF-1.7-02",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.7",
  "select": 1,
  "stem": "After an hour of exploring a large codebase with Claude Code, an architect wants to try two competing refactoring strategies starting from the same understanding. Each attempt must NOT see the other's reasoning or conversation, and the exploration should not be repeated. What should the architect do?",
  "options": {
   "A": "Run the first strategy, then resume the same session and ask Claude to forget the previous attempt before trying the second.",
   "B": "Start two fresh sessions and re-run the exploration in each so both begin from identical knowledge.",
   "C": "Fork the session at the end of exploration, producing two independent branches that share the exploration context but diverge from there.",
   "D": "Ask Claude to summarise both strategies in one session; separate sessions are unnecessary because Claude can keep them apart."
  },
  "answer": [
   "C"
  ],
  "explanation": "Forking a session (--fork-session on the CLI, fork_session/forkSession in the SDK) creates a new session that starts with a copy of the history up to the fork point; the original stays unchanged. That is precisely the requirement: shared exploration, isolated reasoning. Resuming sequentially would carry the first attempt into the second. A fork branches the conversation, not the filesystem, so run each branch in its own checkout if file edits must also stay separate.",
  "distractors": {
   "A": "violates-constraint",
   "B": "violates-constraint",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Resuming the same session leaks the first attempt into the second; asking the model to forget does not remove it from context.",
   "B": "Repeating the exploration twice works but wastes the hour of context the constraint says not to repeat.",
   "D": "It is a myth that one context can keep two divergent lines of work cleanly separated."
  },
  "concept": "Session forking",
  "learn": "Fork when you need independent branches from a common starting point; resume when you want to continue one line of work. Forking is the wrong call if the branches must see each other's results. The common mistake is using one session for parallel experiments and getting contaminated results.",
  "apply": "If two experiments share a session and the second one 'knows' about the first, you needed a fork."
 },
 {
  "id": "CCARF-1.6-03",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.6",
  "select": 1,
  "stem": "An operations team built an invoice-processing pipeline that always executes three steps in the same order: extract line items, validate totals against the purchase order, and draft an approval email. Every invoice arrives in the same format from the same three vendors, at a volume of about 2,000 invoices a day. A new engineer proposes having a coordinator inspect each invoice first and decide which of the three steps to run and in what order, arguing this makes the system 'more agentic'. The architect wants to keep the LOWEST possible latency and cost per invoice given how uniform the input is. What should the architect do?",
  "options": {
   "A": "Add a routing subagent that classifies each invoice before deciding which of the three steps to invoke.",
   "B": "Let the coordinator use its judgment, case by case, about whether to run all three steps or skip some.",
   "C": "Keep the fixed sequential pipeline — extract, validate, draft email, always in that order — since the input shape never varies across invoices.",
   "D": "Give the coordinator a larger context window so it can plan the step order without truncating its reasoning."
  },
  "answer": [
   "C"
  ],
  "explanation": "A fixed pipeline (prompt chaining) is the right choice exactly when every input needs the same steps in the same order. Here the three steps and their order never change, so any per-invoice planning step only adds a decision the outcome never varies, which raises latency and cost for no benefit.",
  "distractors": {
   "A": "over-engineering",
   "B": "vague-guidance",
   "D": "bigger-context"
  },
  "why_wrong": {
   "A": "Over-engineering: a classification step adds a decision layer and latency for a decision that is always the same, since every invoice already follows the identical three steps.",
   "B": "Plausible but vague: 'use its judgment' names no criterion for when a step could be skipped, and here no step ever should be.",
   "D": "Just add more context: a bigger window does not remove the unneeded planning step; it only makes the wasted work more expensive."
  },
  "concept": "Fixed pipeline (prompt chaining)",
  "learn": "Use a fixed sequential pipeline when every input requires the same steps in the same order — it is the lowest-latency, lowest-cost, most predictable choice. It is the wrong call when request shapes genuinely vary and a step is sometimes unnecessary or insufficient. The common mistake is adding a dynamic planning layer 'to be more agentic' when the input never actually varies.",
  "apply": "If your pipeline's steps and order never change across inputs, a coordinator that re-decides the plan each time is adding overhead, not flexibility."
 },
 {
  "id": "CCARF-1.6-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.6",
  "select": 1,
  "stem": "A compliance assistant handles filing-review requests that vary widely in scope: 'summarize this filing,' 'compare two filings for material changes,' or 'flag inconsistencies across three filings from the same company.' The system currently always runs the same three steps — extract entities, summarize, then compare — even when only one filing is provided, which makes the comparison step fail or produce nonsense. The architect must handle the FULL range of request shapes correctly without writing a separate hard-coded pipeline for every request type. What should the architect do?",
  "options": {
   "A": "Have the coordinator parse each request, determine which analysis steps actually apply — for example, skipping comparison when only one filing is given — and invoke only those, in the right order.",
   "B": "Build a distinct fixed pipeline for each request pattern the team has seen so far, selected by a keyword lookup.",
   "C": "Keep the fixed three-step pipeline for every request, and add a final step that deletes any section that does not apply, such as an empty comparison.",
   "D": "Trust that Claude will recognize on its own when a step is unnecessary and silently skip it inside the fixed pipeline."
  },
  "answer": [
   "A"
  ],
  "explanation": "The request shapes here vary enough that the steps that apply differ per request, which is exactly the case for dynamic adaptive decomposition: the coordinator inspects the request and decides which steps to run, instead of running a script that assumes every step always applies.",
  "distractors": {
   "B": "over-engineering",
   "C": "violates-constraint",
   "D": "myth"
  },
  "why_wrong": {
   "B": "Over-engineering: a hard-coded pipeline per pattern multiplies maintenance for every new request shape and still fails on the next unforeseen one.",
   "C": "Works but violates the constraint: running comparison on a single filing and then discarding the result still pays the cost and latency of a step that never applied, which the range of requests does not always need.",
   "D": "Myth: a fixed pipeline runs every step it was scripted to run; nothing in the architecture makes Claude silently skip a step just because its output would be meaningless."
  },
  "concept": "Dynamic adaptive decomposition",
  "learn": "Use dynamic decomposition when requests vary enough that some steps are unnecessary or insufficient depending on input; the coordinator decides the plan per request. It is the wrong call for high-volume, uniform inputs where the same steps always apply — there a fixed pipeline is cheaper and more predictable. The common mistake is keeping a fixed pipeline and patching its output afterward instead of deciding up front which steps to run.",
  "apply": "If your fixed pipeline sometimes produces an empty or nonsensical section, the input shape has outgrown the pipeline; move the step selection into the coordinator."
 },
 {
  "id": "CCARF-1.7-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.7",
  "select": 1,
  "stem": "A security engineer runs a multi-day incident investigation in Claude Code, closing the laptop each evening and picking it back up the next morning with the exact same conversation and context — no re-explaining, no branching into a different line of work. The engineer runs several unrelated investigations concurrently for different incidents, so the RIGHT investigation's history must resume reliably regardless of which one was used most recently. What should the engineer do?",
  "options": {
   "A": "Use `fork_session` each morning to branch off yesterday's session into a new one for that day's work.",
   "B": "Resume the specific investigation with `--resume <name>`, using a distinct session name per incident.",
   "C": "Rely on Claude Code to automatically continue the most recently used session when it is launched.",
   "D": "Start a fresh session each morning and paste in yesterday's final summary as the first message."
  },
  "answer": [
   "B"
  ],
  "explanation": "Named session resumption is built for this: giving each incident's session a stable name lets the engineer resume that exact conversation on demand, regardless of how many other sessions exist or which one was touched last.",
  "distractors": {
   "A": "wrong-scope",
   "C": "myth",
   "D": "violates-constraint"
  },
  "why_wrong": {
   "A": "Right primitive, wrong scope: forking is for branching into a new, independent line of work; here the engineer wants to continue the very same conversation, not create a divergent copy of it.",
   "C": "Myth: relying on 'the most recent session' is not a reliable way to pick among several concurrent investigations — nothing guarantees the last-used session is the incident the engineer means to resume.",
   "D": "Works but violates the constraint: pasting a summary loses the exact prior context and requires re-establishing it, which is precisely the re-explaining the engineer wants to avoid."
  },
  "concept": "Named session resumption",
  "learn": "Use named session resumption (--resume <name>) when a single line of work must be picked back up exactly as left, especially with several concurrent sessions in play. It is the wrong call when you need to branch into a new, independent path — that is what fork_session is for. The common mistake is trusting 'the last session used' instead of naming the one you mean.",
  "apply": "If you run more than one long-lived Claude Code conversation at a time, give each a name and resume it explicitly instead of hoping the most recent one is the right one."
 },
 {
  "id": "CCARF-1.1-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.1",
  "select": 1,
  "stem": "An engineer builds an agentic loop for a document-summarization agent. The loop already branches on stop_reason: it executes tools when stop_reason is tool_use and returns the message when stop_reason is end_turn. During testing, a summarization task uses a custom stop_sequence to mark section boundaries, and the loop currently treats any stop_reason other than tool_use as end_turn, so it returns a partial section as if it were the final summary. The team wants the loop to be CORRECT for every stop_reason value the API can return. What should the engineer do?",
  "options": {
   "A": "Add a dedicated branch for stop_sequence and for max_tokens, each handled as its own signal, instead of grouping every non-tool_use value into one 'finished' bucket.",
   "B": "Check whether the returned text contains the configured stop_sequence string, and only accept the response as final when it does.",
   "C": "Remove the custom stop_sequence configuration and raise max_tokens so the model always completes with end_turn.",
   "D": "Assume stop_reason only distinguishes tool_use from everything else, since section markers do not change how the API completes a turn."
  },
  "answer": [
   "A"
  ],
  "explanation": "stop_reason can return several distinct values, each meaning something different: tool_use (continue), end_turn (done), max_tokens (truncated), stop_sequence (a deliberate custom stop). Grouping every non-tool_use value into a single 'finished, return as-is' bucket silently mishandles the ones that are not real completions.",
  "distractors": {
   "B": "text-parsing",
   "C": "parameter-patch",
   "D": "myth"
  },
  "why_wrong": {
   "B": "Parsing text for control flow: the API already reports which stop_sequence matched; re-deriving that from prose is fragile and unnecessary.",
   "C": "Parameter patch: removing the feature and raising a limit avoids the symptom in this test but leaves the loop with no logic for the next stop_reason it meets.",
   "D": "Myth: stop_reason is not binary; it carries several enumerated values, and treating anything other than tool_use as equivalent to end_turn discards information the API is giving you."
  },
  "concept": "Handling every stop_reason value",
  "learn": "Give every stop_reason value your loop can receive its own branch — tool_use, end_turn, max_tokens, stop_sequence, and any others your tools can trigger. It is the wrong call only for a true single-shot generation with no loop at all. The common mistake is collapsing everything except tool_use into one 'finished' bucket.",
  "apply": "If your loop's else-branch fires for max_tokens, stop_sequence and end_turn alike, split it into one branch per value before shipping."
 },
 {
  "id": "CCARF-1.1-05",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.1",
  "select": 1,
  "stem": "A code-generation agent's loop currently has two branches: if stop_reason is tool_use, it executes tools; for every other value, it returns the message as the final answer. In a new environment the agent starts using a server-side tool that can return stop_reason 'pause_turn' mid-task, and the loop now returns those intermediate messages to the user as if the work were done. The team wants the loop to stay CORRECT as new stop_reason values appear in the future. What should the team do?",
  "options": {
   "A": "Add a separate classifier model that reads each message and predicts whether the task is actually complete.",
   "B": "Add an explicit case per known stop_reason value, and treat any unrecognized value as non-completion rather than as done.",
   "C": "Raise max_tokens so that pause_turn can no longer occur.",
   "D": "Ignore pause_turn, since tool_use already covers every case in which the loop must keep going."
  },
  "answer": [
   "B"
  ],
  "explanation": "An agentic loop should enumerate the stop_reason values it knows how to handle and fail safe — not silently complete — on anything unrecognized. That keeps the loop correct as the tool set grows and new stop_reason values start appearing, without guessing from prose.",
  "distractors": {
   "A": "over-engineering",
   "C": "parameter-patch",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Over-engineering: a classifier layer is unnecessary complexity when the API already reports its own state via stop_reason.",
   "C": "Parameter patch: max_tokens governs truncation, not whether a server-side tool pauses the turn; this does not touch the actual cause.",
   "D": "Myth: it is false that tool_use is the only stop_reason requiring the loop to continue; pause_turn is exactly such a case and the myth is precisely why this bug shipped."
  },
  "concept": "Fail-safe on unrecognized stop_reason",
  "learn": "Use an explicit enumeration of stop_reason values with a safe default for anything unrecognized whenever your tool set or the API can grow new stop reasons. It is the wrong call only when the set of possible values is closed and fully tested. The common mistake is assuming 'not tool_use' is a synonym for 'done'.",
  "apply": "If your loop's default branch silently returns the message for any stop_reason it doesn't explicitly name, add a safe-fail path instead of an implicit success."
 },
 {
  "id": "CCARF-1.2-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.2",
  "select": 1,
  "stem": "A travel-planning system has one coordinator and five specialist subagents: flights, hotels, activities, visas, and car rentals. Today the coordinator invokes all five subagents for every request, even simple ones like 'find me a hotel in Lisbon,' which wastes latency and tokens on unrelated specialists. The team wants the coordinator to remain the SINGLE point of routing while only invoking the subagents relevant to each request. What should the coordinator do?",
  "options": {
   "A": "Add a separate intent-classification microservice in front of the coordinator that tags each request before it reaches Claude.",
   "B": "Give each subagent a rule that lets it decline to run when it judges the request irrelevant to its specialty.",
   "C": "Tell the coordinator in its system prompt to 'use judgment and only call the subagents that seem necessary.'",
   "D": "Have the coordinator analyze each request and dynamically decide which subset of subagents to invoke via the Task tool."
  },
  "answer": [
   "D"
  ],
  "explanation": "Hub-and-spoke keeps routing decisions in one place. The coordinator itself can read the request and choose which specialists apply case by case, which cuts unnecessary invocations without spreading routing logic outward or losing the single point of control.",
  "distractors": {
   "A": "over-engineering",
   "B": "wrong-scope",
   "C": "vague-guidance"
  },
  "why_wrong": {
   "A": "Over-engineering: a whole extra service duplicates a decision Claude can already make from the request text via the coordinator.",
   "B": "Right primitive, wrong scope: routing belongs to the coordinator; letting each subagent opt itself in or out moves that decision to the wrong level of the architecture.",
   "C": "Plausible but vague: 'use judgment' gives the coordinator no measurable criterion for which subagents a given request actually needs."
  },
  "concept": "Dynamic subagent selection",
  "learn": "Have the coordinator choose which subagents to invoke per request when the request mix is varied and specialists are costly to run needlessly. It is the wrong call when every request genuinely needs the full set, in which case a fixed pipeline is simpler. The common mistake is fanning out to every subagent regardless of relevance.",
  "apply": "If your coordinator invokes the same fixed set of subagents on every request, move the selection decision into the coordinator's own reasoning step."
 },
 {
  "id": "CCARF-1.2-05",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.2",
  "select": 2,
  "stem": "A network-security incident-response system has a coordinator that dispatches a 'log-analysis' subagent and a 'traffic-analysis' subagent for every incident. One subagent occasionally times out or returns a partial result when upstream data is delayed, and those incidents currently vanish from the queue with no record of what failed. The team wants the coordinator to become resilient to these failures AND keep full visibility into what happened. Which two changes should they make? (Select TWO.)",
  "options": {
   "A": "Have each subagent silently retry its own failures up to three times before ever reporting anything to the coordinator.",
   "B": "Have the coordinator catch and log every subagent failure, including partial results and timeouts, instead of letting them pass through silently.",
   "C": "Have the coordinator decide the next action after a failure — retry the same subagent, route to a fallback, or escalate the incident — rather than leaving the failed subagent to recover on its own.",
   "D": "Increase the timeout value on every subagent call so failures happen less often."
  },
  "answer": [
   "B",
   "C"
  ],
  "explanation": "In a hub-and-spoke system, error handling belongs to the coordinator: it is the only component with visibility across every subagent, so it is the one that should log failures and decide what happens next.",
  "distractors": {
   "A": "wrong-scope",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "A": "Right primitive, wrong scope: self-healing retries inside the subagent hide the failure from the coordinator, which is exactly the component that needs visibility to recover the incident.",
   "D": "Parameter patch: a longer timeout may reduce how often timeouts fire, but it does nothing for the incidents that still fail and still vanish with no record."
  },
  "concept": "Coordinator-owned error handling",
  "learn": "Give the coordinator ownership of logging and next-step decisions for subagent failures whenever a hub-and-spoke topology is in use. It is the wrong call only in a single-agent design with no coordinator to own it. The common mistake is letting each subagent handle and hide its own failures.",
  "apply": "If a subagent failure disappears without the coordinator logging it or choosing a next step, move that handling into the coordinator."
 },
 {
  "id": "CCARF-1.3-03",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.3",
  "select": 1,
  "stem": "A code-review pipeline runs an 'architecture-review' subagent that spends many turns finding three design issues, then the coordinator spawns a 'security-review' subagent to look for related risks. The Task tool call for the security-review subagent only says 'see the architecture review above' and gives it no further detail, but each subagent starts in its own isolated context and never sees the earlier session. The security-review subagent has no idea what was found and repeats the same exploration. The team wants CORRECT context handoff between subagents. What should the coordinator do?",
  "options": {
   "A": "Increase the context window configured for the security-review subagent so it can hold more history if it ever gets access to it.",
   "B": "Have the security-review subagent call the architecture-review subagent directly to ask for its notes.",
   "C": "Have the coordinator remind the security-review subagent in one line to 'check earlier context for relevant findings.'",
   "D": "Include the architecture-review subagent's complete findings in the security-review subagent's prompt when spawning it, instead of referencing prior context."
  },
  "answer": [
   "D"
  ],
  "explanation": "Each subagent invocation starts with an isolated context; it has no implicit access to a previous subagent's conversation. The only reliable handoff is to paste the complete prior findings directly into the new subagent's own prompt.",
  "distractors": {
   "A": "bigger-context",
   "B": "wrong-scope",
   "C": "myth"
  },
  "why_wrong": {
   "A": "Just add more context: a bigger window does not create access to a conversation the subagent was never given in the first place.",
   "B": "Right primitive, wrong scope: subagent-to-subagent calls bypass the coordinator that is supposed to own routing and information flow between them.",
   "C": "Myth: 'check earlier context' assumes a shared history that does not exist; subagent context is isolated by default, so there is nothing there to check."
  },
  "concept": "Subagent context isolation",
  "learn": "Paste a prior subagent's complete findings into the next subagent's prompt whenever work must build on that subagent's results. It is the wrong call only when the two subagents are genuinely independent and need no shared history. The common mistake is writing 'see above' into a prompt for a subagent that has no 'above' to see.",
  "apply": "If a subagent's prompt references earlier findings by pointer instead of by content, replace the pointer with the actual text."
 },
 {
  "id": "CCARF-1.3-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.3",
  "select": 1,
  "stem": "A team configures a coordinator agent in Claude Code with a custom subagent for 'database migration.' The coordinator never spawns the subagent and falls back to doing the migration work inline itself, mixing concerns. Investigation shows the coordinator's tools list (the allowlist that defines which tools it has) omits the Agent tool (formerly Task). The team wants the coordinator to actually be ABLE to spawn subagents going forward. What should the team do?",
  "options": {
   "A": "Add the Agent tool (formerly Task) to the coordinator's tools list so it can spawn subagents.",
   "B": "Increase the coordinator's max_tokens so it has enough budget to complete migrations inline instead of delegating.",
   "C": "Add a system-prompt paragraph asking the coordinator to 'please delegate to subagents whenever possible.'",
   "D": "Build a separate orchestration script outside Claude Code that calls the subagent's prompt directly through the API, bypassing the Task tool."
  },
  "answer": [
   "A"
  ],
  "explanation": "The Agent tool (formerly Task; Task still works as an alias) is the mechanism a coordinator uses to spawn subagents, and it must be present in that agent's tool set before any spawn can happen: if you omit it from the tools list, the agent cannot spawn any subagents. No amount of prompting substitutes for a tool the agent does not have.",
  "distractors": {
   "B": "parameter-patch",
   "C": "myth",
   "D": "over-engineering"
  },
  "why_wrong": {
   "B": "Parameter patch: more token budget lets the coordinator do more work inline, which is the opposite of the delegation the team wants.",
   "C": "Myth: instructing the model to delegate cannot grant it a tool that its configuration does not include; the block is technical, not a matter of willingness.",
   "D": "Over-engineering: a whole external script duplicates what a one-line configuration change already provides inside Claude Code."
  },
  "concept": "Task tool enables subagents",
  "learn": "Confirm the Agent tool (formerly Task) is in a coordinator's tool set whenever it needs to spawn subagents. It is the wrong call to add it when an agent should never delegate at all. The common mistake is diagnosing a missing delegation as a prompting problem instead of a tool-configuration one.",
  "apply": "If a coordinator never delegates and falls back to inline work, check its tools list for the Agent (Task) tool before touching its prompt."
 },
 {
  "id": "CCARF-1.3-05",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.3",
  "select": 1,
  "stem": "A financial-audit coordinator spawns a 'discrepancy-analysis' subagent after a 'data-extraction' subagent already spent many turns discovering that the ledger export uses fiscal-year quarters rather than calendar quarters. The coordinator's Task tool call for the analysis subagent includes only the instruction 'analyze the discrepancies using the extracted data' plus a file path. The discrepancy-analysis subagent starts from a blank context and gets the quarter mapping wrong. The team wants the second subagent to be correct WITHOUT redoing the data-extraction subagent's investigative work. What should the coordinator do?",
  "options": {
   "A": "Have the discrepancy-analysis subagent re-run the same exploration steps the data-extraction subagent performed, to independently confirm the quarter format.",
   "B": "Point the discrepancy-analysis subagent at the entire raw ledger export instead of the extracted summary, so it has more material to work from.",
   "C": "Include the data-extraction subagent's complete findings — including the fiscal-year quarter mapping — directly in the discrepancy-analysis subagent's prompt when spawning it via the Task tool.",
   "D": "Tell the discrepancy-analysis subagent, in a short instruction, to 'double check the quarter definitions before analyzing,' without stating what the data-extraction subagent already found."
  },
  "answer": [
   "C"
  ],
  "explanation": "The fix for isolated subagent context is not more raw material or a reminder — it is passing the complete prior findings into the new subagent's prompt so it starts already knowing what the first subagent worked hard to establish.",
  "distractors": {
   "A": "violates-constraint",
   "B": "bigger-context",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Works but violates the constraint: re-running the exploration would eventually get the right answer, but it repeats work the team explicitly wants to avoid redoing.",
   "B": "Just add more context: handing over the raw export does not supply the specific fact the subagent needs; it just gives it more to re-derive it from.",
   "D": "Plausible but vague: telling the subagent to 'double check' without giving it the actual mapping supplies no usable information."
  },
  "concept": "Complete prior findings in subagent prompt",
  "learn": "Carry a prior subagent's concrete conclusions into the next subagent's prompt whenever the second step depends on what the first one learned. It is the wrong call only when the two steps are truly unrelated. The common mistake is passing the raw material again instead of the extracted answer.",
  "apply": "If a subagent is being asked to redo investigative work another subagent already finished, paste that finding into its prompt instead."
 },
 {
  "id": "CCARF-1.4-03",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.4",
  "select": 1,
  "stem": "A marketing-automation agent drafts email campaigns and sends them to the full subscriber list. The only safeguard against sending non-compliant content is a system-prompt sentence: 'Do not send until the compliance-check subagent has approved the draft.' In a recent incident the agent sent a campaign it never actually submitted for compliance review, because it decided the content was 'obviously fine.' The team wants sending to be BLOCKED whenever compliance approval has not actually happened, with no dependence on the model choosing correctly. What should the team implement?",
  "options": {
   "A": "A PreToolUse hook on the send tool that checks for a recorded compliance-approval record and blocks the call when none exists.",
   "B": "Rewrite the prompt sentence in bold capitals: 'NEVER SEND WITHOUT COMPLIANCE APPROVAL.'",
   "C": "Lower the agent's temperature so it is more consistent about following the compliance instruction.",
   "D": "Add a second, independent agent whose only job is to re-read the campaign and second-guess the first agent's send decision."
  },
  "answer": [
   "A"
  ],
  "explanation": "Sending has real consequences (compliance risk), so it needs a programmatic gate rather than a prompt the model can talk itself out of. A PreToolUse hook that checks an actual approval record can deny the send call outright, independent of what the model decided.",
  "distractors": {
   "B": "prompt-not-enforcement",
   "C": "parameter-patch",
   "D": "over-engineering"
  },
  "why_wrong": {
   "B": "Prompt where enforcement is needed: stronger wording is still a request the model can override, exactly as it already did.",
   "C": "Parameter patch: lower temperature changes how varied the wording is, not whether the model checks for an approval record before sending.",
   "D": "Over-engineering: a whole second reviewing agent adds cost and complexity in place of a direct check the send tool itself can perform."
  },
  "concept": "Hooks as prerequisite gates",
  "learn": "Use a PreToolUse hook to gate a tool call whenever a real prerequisite (a passing test, an approval, a completed prior step) must exist before that call is allowed to run. It is the wrong call for steps with no real consequence, where prompt guidance is enough. The common mistake is 'fixing' a bypassed instruction with a stronger version of the same instruction.",
  "apply": "If a consequential action depends on the model correctly remembering a rule, replace the rule with a hook that checks the actual precondition."
 },
 {
  "id": "CCARF-1.4-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.4",
  "select": 1,
  "stem": "An internal documentation agent runs a two-step process: draft a README section, then optionally choose an emoji header style based on team preference. Nothing in this workflow touches money, security, or production data. The architect is deciding whether to add a hook that blocks the header step until the drafted section passes an external linter, mirroring the gates used on higher-stakes pipelines. The architect wants to add just enough enforcement for this workflow, not more than it warrants. What should the architect do?",
  "options": {
   "A": "Add a PreToolUse hook that requires a passing lint run before the emoji-header step can execute, mirroring the higher-stakes pipeline's gate.",
   "B": "Require the header step to route through a separate human approval before every single README change, including typo fixes.",
   "C": "Do nothing at all, since Claude reliably formats headings correctly.",
   "D": "Rely on ordinary prompt guidance for the header style; a cosmetic choice with no real consequence does not need a hook, which should stay reserved for steps that matter."
  },
  "answer": [
   "D"
  ],
  "explanation": "Enforcement should be proportional to consequence. A cosmetic formatting choice with no financial, security, or data risk does not need a blocking gate; ordinary prompt guidance is the appropriate, lower-cost mechanism, and hooks stay reserved for steps that actually matter.",
  "distractors": {
   "A": "over-engineering",
   "B": "violates-constraint",
   "C": "myth"
  },
  "why_wrong": {
   "A": "Over-engineering: copying a hard gate from a high-stakes pipeline onto a cosmetic step adds machinery this workflow does not need.",
   "B": "Works but violates the constraint: mandatory human approval for every trivial change would work, but it adds cost and friction wildly out of proportion to the risk.",
   "C": "Myth: it is false that a model 'reliably' avoids every formatting mistake; the point is that this particular mistake carries no real consequence, not that it cannot happen."
  },
  "concept": "Enforcement proportional to consequence",
  "learn": "Reserve hooks and hard gates for steps with real financial, security, or data consequences, and use prompt guidance for everything else. It is the wrong call to skip enforcement entirely when a step really does carry consequence. The common mistake is applying the same gating machinery uniformly regardless of what is actually at stake.",
  "apply": "If a low-stakes cosmetic step has the same hook gate as a production-impacting one, scale the enforcement down to match the actual risk."
 },
 {
  "id": "CCARF-1.4-05",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.4",
  "select": 2,
  "stem": "A firmware-update agent runs three fixed stages for every fleet rollout: build the image, verify its checksum against the vendor manifest, then flash it to devices. Flashing must never proceed unless the checksum-verification stage reports a match, but today the agent reads its own verification output and decides for itself whether to proceed — and twice this quarter it flashed devices despite a reported mismatch. The team wants a fix that CANNOT be bypassed by the model's own judgment. Which two changes should they make? (Select TWO.)",
  "options": {
   "A": "Add a bold system-prompt sentence: 'Always double-check the checksum before flashing.'",
   "B": "Add a PreToolUse hook on the flash tool that reads the checksum-verification result directly and blocks the call whenever it reports a mismatch.",
   "C": "Make the hook return a blocking, deny-type decision rather than only logging a warning, so the flash call is actually stopped rather than merely flagged.",
   "D": "Have the verification stage append the phrase 'CHECKSUM OK' to its output only on a match, and have the flash stage look for that phrase before proceeding."
  },
  "answer": [
   "B",
   "C"
  ],
  "explanation": "A prerequisite this consequential needs a hook that both reads the real verification result and actually denies the tool call on failure — a hook that only logs is no stronger than the prompt it replaces.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "D": "text-parsing"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: the model already had this instruction in effect and bypassed it twice; a bolder version of the same sentence fixes nothing structural.",
   "D": "Parsing text for control flow: matching a marker string in prose is exactly the kind of fragile check a direct read of the structured verification result is meant to replace."
  },
  "concept": "Hook exit codes and decisions",
  "learn": "Pair a PreToolUse gate with an actual blocking decision, not just a log line, whenever the tool call it guards has real consequences. It is the wrong call to add a blocking hook where a warning is genuinely all that is needed. The common mistake is writing a hook that observes and logs a problem instead of stopping the call that would cause it.",
  "apply": "If your hook logs a violation but the tool call proceeds anyway, change its return value to an actual deny decision."
 },
 {
  "id": "CCARF-1.5-03",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.5",
  "select": 1,
  "stem": "A logistics-tracking agent calls three different carrier tools to check shipment status. One carrier returns status as 'IN_TRANSIT', another as lowercase 'in-transit', and a third as a numeric code that must be looked up in a table. The agent's prompt currently tries to interpret whichever shape appears, and its summaries are inconsistent because reasoning quality suffers from format guessing. The team wants a fix that normalizes every carrier's response into one consistent status vocabulary before the agent reasons over it, without changing the carrier tools themselves. What should the team do?",
  "options": {
   "A": "Add a PostToolUse hook that intercepts each carrier tool's result and rewrites it into one consistent normalized status before it reaches the model.",
   "B": "Add a paragraph to the system prompt asking the model to 'mentally normalize the different formats before reasoning.'",
   "C": "Concatenate all three raw responses into the context so the model has more examples of each format to learn from.",
   "D": "Write a PreToolUse hook that blocks any carrier tool whose response format has changed recently."
  },
  "answer": [
   "A"
  ],
  "explanation": "A PostToolUse hook runs after a tool call returns, which is exactly where heterogeneous outputs can be rewritten into one consistent shape before the model ever has to reason over the raw, inconsistent formats.",
  "distractors": {
   "B": "vague-guidance",
   "C": "bigger-context",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "B": "Plausible but vague: 'mentally normalize' gives the model no concrete mapping and no guarantee of consistency across formats.",
   "C": "Just add more context: piling in more raw examples does not resolve the inconsistency; it just gives the model more inconsistent material to reconcile itself.",
   "D": "Right primitive, wrong scope: a hook is the right tool, but PreToolUse runs before the call, when there is no result yet to normalize; the fix belongs in PostToolUse."
  },
  "concept": "PostToolUse normalisation hook",
  "learn": "Use a PostToolUse hook to rewrite heterogeneous tool outputs into one consistent shape whenever multiple sources return the same kind of data differently. It is the wrong call when every source already returns identical shapes. The common mistake is asking the model to normalize formats in its head instead of normalizing the data before it gets there.",
  "apply": "If your agent's prompt has to explain several possible response shapes for the same kind of tool, move that translation into a PostToolUse hook instead."
 },
 {
  "id": "CCARF-1.5-04",
  "cert": "CCAR-F",
  "domain": 1,
  "task": "1.5",
  "select": 1,
  "stem": "A cost-control agent can deprovision idle cloud instances. The team implements a check meant to stop it from deprovisioning any instance tagged 'production,' but they wrote it as a PostToolUse hook that logs a violation message after the deprovision tool runs. In a recent incident a production instance was deprovisioned anyway; the violation log appeared only afterward. The team wants deprovisioning of tagged production instances to be PREVENTED outright, not merely logged. What should the team do?",
  "options": {
   "A": "Keep the hook as PostToolUse but make its warning message more urgent so future deprovisioning is less likely.",
   "B": "Assume that because the hook fired, the deprovisioning must already have been prevented.",
   "C": "Add a second PostToolUse hook that attempts to automatically restore the deprovisioned instance after logging the warning.",
   "D": "Rewrite the check as a PreToolUse hook that inspects the target instance's tag before execution and denies the call when it is tagged 'production.'"
  },
  "answer": [
   "D"
  ],
  "explanation": "PreToolUse runs before a tool call executes, so it is where a hook can inspect the input and deny the call outright. A PostToolUse hook fires after the tool has already run; it can only observe, add context or block Claude from seeing the result, never undo the deprovisioning that already happened.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "myth",
   "C": "over-engineering"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: a stronger-worded log message is still just a message; it does not stop the tool call from running.",
   "B": "Myth: PostToolUse hooks run after the tool has already executed, so their firing is never evidence that the action was prevented.",
   "C": "Over-engineering: bolting on an automatic-restore hook papers over a prevention problem with recovery machinery, instead of stopping the call at the source."
  },
  "concept": "PreToolUse blocks before execution",
  "learn": "Use a PreToolUse hook whenever a tool call must be prevented outright based on a condition known before execution, such as a resource tag. It is the wrong call when you only need to observe or transform a result after the fact, which is what PostToolUse is for. The common mistake is writing a PostToolUse check for something that actually needs to be blocked, not logged.",
  "apply": "If a hook is expected to stop a dangerous call but only fires after it already ran, move the check from PostToolUse to PreToolUse."
 },
 {
  "id": "CCARF-2.1-01",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.1",
  "select": 1,
  "stem": "An order-management agent exposes two tools, search_orders and find_orders. The first queries by customer name over the live database; the second queries by order ID over a read-only replica. Both descriptions currently say 'Searches for orders.' Claude picks the wrong one about a third of the time and the team is adding tools weekly. Which change BEST fixes tool selection?",
  "options": {
   "A": "Lower the temperature so the model's tool choice becomes more deterministic.",
   "B": "Rewrite both descriptions to state the distinct purpose, the exact inputs each expects and what each returns, including when not to use it.",
   "C": "Train a small classifier that inspects the user request and injects the correct tool name into the prompt.",
   "D": "Keep the descriptions and rely on the JSON input schema, since the model selects tools from parameter names rather than descriptions."
  },
  "answer": [
   "B"
  ],
  "explanation": "Tool descriptions are the primary signal Claude uses to decide which tool to call. Two tools with identical descriptions are indistinguishable by design, so no amount of sampling control helps. Differentiating purpose, inputs and outputs in the description fixes the root cause and scales as tools are added.",
  "distractors": {
   "A": "parameter-patch",
   "C": "over-engineering",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Temperature cannot separate two tools that carry the same information; it is a parameter patch.",
   "C": "A classifier is over-engineering when a clear description would let the model choose correctly.",
   "D": "It is a myth that schemas replace descriptions; the description is what drives selection."
  },
  "concept": "Descriptions drive tool selection",
  "learn": "Write every tool description as if the model has never seen your codebase: what it does, when to use it, when not to, what it takes and what it returns. This is always the first lever for selection problems. The common mistake is one-line descriptions that only restate the function name.",
  "apply": "If two of your tool descriptions could be swapped without anyone noticing, the model cannot tell them apart either."
 },
 {
  "id": "CCARF-2.1-02",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.1",
  "select": 1,
  "stem": "A finance agent has a tool described as 'Gets data for an account.' The tool actually returns a ledger of transactions in cents with ISO timestamps. Claude repeatedly reports amounts a hundred times too large and treats the timestamps as local time. The architect wants to fix this at the INTERFACE level rather than in prompts. What should the architect do?",
  "options": {
   "A": "Add 'be careful with units' to the system prompt so the model double-checks its arithmetic.",
   "B": "Have the agent review its own answer and correct any suspicious amounts before replying.",
   "C": "Raise the context budget so the model can inspect more of the ledger before answering.",
   "D": "Rewrite the description to state what the tool returns: a list of transactions with amounts in integer cents and UTC ISO-8601 timestamps."
  },
  "answer": [
   "D"
  ],
  "explanation": "A tool description must cover outputs, not only purpose. When the model does not know the unit or time zone of a return value, it guesses. Stating the return shape in the description gives every call the information it needs without any prompt scaffolding.",
  "distractors": {
   "A": "vague-guidance",
   "B": "self-review",
   "C": "bigger-context"
  },
  "why_wrong": {
   "A": "'Be careful with units' is advice without the actual unit; the model still has to guess.",
   "B": "The same instance re-checking its guess keeps the same missing information.",
   "C": "More ledger rows do not reveal the unit or the time zone."
  },
  "concept": "Tool descriptions state outputs",
  "learn": "Document inputs and outputs (units, formats, time zones, pagination) in the description itself. This is right for any tool whose return value has semantics that are not obvious. The common mistake is describing only what the tool 'does'.",
  "apply": "If a developer would need to read your tool's source to know the unit of its return value, the model needs that sentence in the description."
 },
 {
  "id": "CCARF-2.1-03",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.1",
  "select": 2,
  "stem": "An architect audits the tool interface of a travel-booking agent: tools named do_it, helper2 and process, each with a one-line description, plus usage tips scattered in CLAUDE.md. Tool selection is unreliable. The architect wants to improve selection by changing the TOOL INTERFACE ITSELF. Which two changes are appropriate? (Select TWO.)",
  "options": {
   "A": "Rename the tools to say what they do (search_flights, hold_seat, issue_ticket) and align the descriptions with those names.",
   "B": "Shorten every description to a single sentence so the tool list stays compact and is easier for the model to scan.",
   "C": "Add to each description when the tool should be used and when a neighbouring tool is the better choice.",
   "D": "Move all guidance about tool usage into CLAUDE.md so the descriptions can stay short."
  },
  "answer": [
   "A",
   "C"
  ],
  "explanation": "The interface the model sees is the tool name plus its description and schema. Meaningful names and descriptions that explain purpose and boundaries are the direct levers on selection. Guidance stored elsewhere is not part of the tool definition and is easy to drop.",
  "distractors": {
   "B": "myth",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "B": "Detailed descriptions are documented as by far the most important factor in tool performance, with at least three or four sentences recommended per tool; a shorter list helping selection is a myth.",
   "D": "Usage guidance belongs in the tool definition; a memory file is the right content at the wrong scope."
  },
  "concept": "Self-describing tool interfaces",
  "learn": "Tool names and descriptions should stand alone; the model may see them without any other context. This applies to MCP tools and custom tools alike. The common mistake is compensating for weak tool definitions with prompt text elsewhere.",
  "apply": "If you removed CLAUDE.md and your system prompt, would the tool list still explain itself? If not, the descriptions are carrying too little."
 },
 {
  "id": "CCARF-2.2-01",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.2",
  "select": 1,
  "stem": "A custom MCP server wraps an internal CRM. When the CRM rejects a query, the server returns a normal successful result whose text says 'Error: invalid customer id'. Claude then summarises that string to the user as if it were a data field, and the coordinator never retries. The architect wants clients to RECOGNISE failures structurally. What should the architect do?",
  "options": {
   "A": "Instruct Claude in the system prompt to treat any result starting with 'Error:' as a failure and stop.",
   "B": "Make the server raise a protocol-level exception for CRM rejections so the call cannot return normally.",
   "C": "Return the failure as a tool result with isError set to true and a structured message describing the problem.",
   "D": "Ask the model to re-read every tool result and judge whether it looks like an error before continuing."
  },
  "answer": [
   "C"
  ],
  "explanation": "MCP distinguishes tool-execution errors (results flagged isError) from protocol errors. Flagging isError lets the model and the orchestrator handle the failure explicitly, retry or escalate, instead of treating an error string as data. It is the structural signal the task statement calls for.",
  "distractors": {
   "A": "text-parsing",
   "B": "myth",
   "D": "self-review"
  },
  "why_wrong": {
   "A": "Matching an 'Error:' prefix is parsing text for control flow when the protocol already has a flag.",
   "B": "Protocol errors are JSON-RPC errors reserved for problems with the request itself (unknown tool, malformed request, server error); using them for a business rejection the model could act on is a myth about MCP semantics.",
   "D": "Having the model judge each result is self-review and is neither deterministic nor visible to the orchestrator."
  },
  "concept": "MCP isError flag",
  "learn": "Return business and execution failures as tool results with isError true; reserve protocol errors for broken requests. This is always the right call for MCP tools that can fail. The common mistake is encoding errors in prose inside a successful result.",
  "apply": "If your MCP tool ever returns a success result whose content begins with the word 'Error', it should be setting isError instead."
 },
 {
  "id": "CCARF-2.2-02",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.2",
  "select": 1,
  "stem": "A coordinator agent calls MCP tools that can fail for three reasons: rate limits, malformed input it produced, or missing permissions for the account. Today every failure returns isError true with a free-text message, and the coordinator retries all of them three times, wasting calls on permission errors and never fixing its own bad input. Which change BEST lets the coordinator recover appropriately?",
  "options": {
   "A": "Increase the retry count so transient errors eventually succeed even if other kinds are wasted.",
   "B": "Add structured error metadata such as errorCategory (transient, validation, permission) so the coordinator retries, corrects input, or escalates according to the category.",
   "C": "Build a separate error-classification agent that reads each failure message and decides what to do.",
   "D": "Tell the coordinator to use good judgment when deciding whether an error is worth retrying."
  },
  "answer": [
   "B"
  ],
  "explanation": "Different error classes need different recovery: transient errors are retried, validation errors need corrected input, permission errors need escalation. Encoding the category in structured metadata makes that branching deterministic and cheap. The task statement names this pattern explicitly.",
  "distractors": {
   "A": "parameter-patch",
   "C": "over-engineering",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "More retries treat all failures alike; it is a parameter patch that scales the waste.",
   "C": "An agent to classify errors is over-engineering when the tool that raised the error already knows the category.",
   "D": "'Use good judgment' gives no criterion and produces inconsistent recovery."
  },
  "concept": "Structured error categories",
  "learn": "Return errors with a machine-readable category and any details needed for recovery (which field failed, retry-after). This is right for any tool consumed by an automated coordinator. The common mistake is a human-readable message only.",
  "apply": "If your retry logic cannot tell a permission error from a rate limit without reading the message text, add an errorCategory field."
 },
 {
  "id": "CCARF-2.3-01",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.3",
  "select": 1,
  "stem": "An operations agent has accumulated sixty tools covering deployments, incident lookup, billing, HR requests and document search. Tool selection accuracy has dropped as tools were added, and the agent often calls a plausible-sounding but wrong tool. The architect wants to restore ACCURATE selection. What should the architect do?",
  "options": {
   "A": "Split the work across specialised subagents, each with a small tool set relevant to its domain, and have a coordinator route to them.",
   "B": "Raise the context configuration so all sixty tool definitions fit comfortably with room for reasoning.",
   "C": "Lower the temperature so the model picks the highest-probability tool more consistently.",
   "D": "Add a system prompt paragraph asking the model to read all tool descriptions carefully before choosing."
  },
  "answer": [
   "A"
  ],
  "explanation": "Too many tools degrade selection because the model must discriminate among many similar options. Restricting each subagent to the handful of tools its domain needs shrinks the decision space and raises accuracy; the coordinator handles the coarse routing. This is the distribution pattern the task statement describes.",
  "distractors": {
   "B": "bigger-context",
   "C": "parameter-patch",
   "D": "prompt-not-enforcement"
  },
  "why_wrong": {
   "B": "The definitions already fit; the problem is discrimination among them, not space.",
   "C": "Temperature does not make sixty near-neighbours more distinguishable.",
   "D": "Asking the model to read carefully is a prompt where a structural reduction of options is needed."
  },
  "concept": "Tool set restriction per subagent",
  "learn": "Keep each agent's tool set small and coherent; distribute breadth across subagents. This is the right call whenever selection errors rise with tool count. It is unnecessary for agents with a handful of clearly distinct tools. The common mistake is one mega-agent with every tool attached.",
  "apply": "If a single agent's tool list needs scrolling to read, split it by domain before touching prompts."
 },
 {
  "id": "CCARF-2.3-02",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.3",
  "select": 2,
  "stem": "An architect is configuring tool_choice for two different steps of a pipeline that runs on a model supporting forced tool use. Step 1 must ALWAYS produce a call to the single record_finding tool. Step 2 must always call one of several lookup tools but may pick which one. Which two configurations are correct? (Select TWO.)",
  "options": {
   "A": "For step 1, leave tool_choice on auto; the model will always call the only available tool.",
   "B": "For step 1, set tool_choice to type 'tool' with name record_finding so the call is forced.",
   "C": "For step 2, set tool_choice to none and parse the tool name from the model's text reply.",
   "D": "For step 2, set tool_choice to 'any' so the model must call some tool but chooses which."
  },
  "answer": [
   "B",
   "D"
  ],
  "explanation": "tool_choice has three operative modes: auto lets the model decide whether to call a tool, any forces a call to some tool, and tool forces a specific one. Step 1 needs the specific tool; step 2 needs a guaranteed call with free choice. Matching each step to its mode guarantees the behaviour rather than hoping for it.",
  "distractors": {
   "A": "myth",
   "C": "text-parsing"
  },
  "why_wrong": {
   "A": "Under auto the model may answer in text and skip the tool; assuming a single tool is always called is a myth.",
   "C": "Reading the intended tool name out of prose is parsing text for control flow."
  },
  "concept": "tool_choice modes",
  "learn": "Use tool_choice 'tool' when exactly one tool must run, 'any' when some tool must run, 'auto' when the model may answer directly, and 'none' to disable calls. Forcing guarantees the call, not the shape of its arguments; add strict: true to the tool definition when the input must match the schema exactly. Forcing is also not universally available: manual extended thinking rejects 'any' and 'tool', and some newer models reject them with a request error, in which case the documented route is 'auto' with strict tool use for schema-valid inputs, or structured outputs when the response itself must be fixed JSON. Forcing is wrong when a plain-text answer is a legitimate outcome. The common mistake is relying on auto for steps that require a tool call.",
  "apply": "If a step's correctness depends on a tool call happening, set tool_choice to 'any' or 'tool' rather than trusting auto."
 },
 {
  "id": "CCARF-2.4-01",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.4",
  "select": 1,
  "stem": "A developer adds a database MCP server to Claude Code with the default scope and it works on their machine. Teammates cloning the repository do not see the server, and the onboarding doc now tells everyone to run the same add command by hand. The architect wants the server available to EVERYONE who clones the repo, without each teammate adding it by hand. What should the architect do?",
  "options": {
   "A": "Add the server at user scope on each teammate's machine so it applies to all of their projects.",
   "B": "Keep the current setup and put the add command in a shell script that teammates run once.",
   "C": "Add the server at project scope so it is written to .mcp.json in the repository root and committed.",
   "D": "Nothing further is needed; MCP servers added on one machine synchronise to teammates through the repository automatically."
  },
  "answer": [
   "C"
  ],
  "explanation": "Project-scoped MCP configuration lives in .mcp.json at the repository root and travels with the code, so every clone gets the same servers. User and local scopes stay on one machine by design. The scope decision, not the server definition, is what determines who sees it.",
  "distractors": {
   "A": "wrong-scope",
   "B": "violates-constraint",
   "D": "myth"
  },
  "why_wrong": {
   "A": "User scope is per person and spans all projects; it is the right mechanism at the wrong level for a repo-specific server.",
   "B": "A script still requires a manual step per teammate, which the constraint rules out.",
   "D": "Default-scope servers are not committed; automatic synchronisation is a myth."
  },
  "concept": "MCP scope: project .mcp.json",
  "learn": "Use project scope (.mcp.json) for servers the whole team needs on that repo, user scope for personal tools used across repos, local scope for private experiments. Claude Code asks each user once, in interactive sessions, to approve the project-scoped servers found in a repository's .mcp.json (reset with claude mcp reset-project-choices); that is a security confirmation, not a configuration step. Project scope is wrong for servers that carry personal credentials unless the secret is referenced through environment variable expansion. The common mistake is leaving the default scope and documenting manual steps.",
  "apply": "If your onboarding doc contains 'run claude mcp add ...', the server should probably be in a committed .mcp.json."
 },
 {
  "id": "CCARF-2.4-02",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.4",
  "select": 1,
  "stem": "A team commits .mcp.json so everyone gets the same MCP servers. Security review flags that the file contains a plaintext API token for a ticketing server. Each engineer has their own token. The architect must keep the SHARED configuration in the repository while keeping tokens out of it. What should the architect do?",
  "options": {
   "A": "Leave the token in .mcp.json but restrict repository access to engineers who already have tokens.",
   "B": "Move the entire server definition to each engineer's user-scope configuration with their own hard-coded token.",
   "C": "Build an internal proxy MCP server that holds the token and forwards requests, and point .mcp.json at the proxy.",
   "D": "Reference the token in .mcp.json as an environment variable expansion (for example ${TICKET_TOKEN}) and have each engineer set it in their environment."
  },
  "answer": [
   "D"
  ],
  "explanation": ".mcp.json supports environment variable expansion, which is the intended way to share a server definition while keeping secrets per machine. The committed file stays identical for everyone and each engineer supplies their own value at runtime.",
  "distractors": {
   "A": "violates-constraint",
   "B": "wrong-scope",
   "C": "over-engineering"
  },
  "why_wrong": {
   "A": "A committed secret is still a committed secret; this keeps the file shared but breaks the security constraint.",
   "B": "Moving the definition to user scope removes it from the shared configuration the constraint requires.",
   "C": "A proxy service to avoid an environment variable is over-engineering."
  },
  "concept": "Env var expansion in .mcp.json",
  "learn": "Commit server definitions, never credentials; use ${VAR} expansion for anything secret or machine-specific. This applies to tokens, hostnames and paths. The common mistake is choosing between 'commit the secret' and 'do not share the config' when expansion gives both.",
  "apply": "If a committed .mcp.json contains a value you would rotate after a leak, replace it with an environment variable reference."
 },
 {
  "id": "CCARF-2.5-01",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.5",
  "select": 1,
  "stem": "An architect watches a Claude Code session in which the agent, asked where a function named computeRebate is defined in a repository of several thousand files, starts reading files one by one with the Read tool. Twenty minutes later it has consumed most of its context and has not found the definition. Which approach is the MOST efficient use of the built-in tools?",
  "options": {
   "A": "Continue reading files but ask the agent to skip test directories to save context.",
   "B": "Use Grep to search for the definition pattern across the repository and open only the matching file.",
   "C": "Use Glob with the pattern **/*computeRebate* since Glob matches file contents as well as paths.",
   "D": "Write a custom MCP server that builds a symbol index and exposes a lookup tool."
  },
  "answer": [
   "B"
  ],
  "explanation": "Each built-in tool has a job: Grep searches contents, Glob matches paths, Read and Write handle whole files. Locating a definition is a content search, so Grep returns the exact file and line in one call without loading unrelated files into context.",
  "distractors": {
   "A": "violates-constraint",
   "C": "myth",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Reading files serially remains the most context-expensive approach, which violates the efficiency constraint.",
   "C": "Glob matches file names and paths only; searching contents with it is a myth.",
   "D": "A symbol-index server is over-engineering when Grep already answers the question."
  },
  "concept": "Grep for content, Glob for paths",
  "learn": "Reach for Grep when you know what text you are looking for, Glob when you know the file name pattern, Read once you know the file. This is right for any exploration task. The common mistake is reading files speculatively.",
  "apply": "If your agent's transcript shows many Read calls before a single Grep, its exploration strategy is inverted."
 },
 {
  "id": "CCARF-2.5-02",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.5",
  "select": 1,
  "stem": "A Claude Code skill must list every migration file under any migrations directory in a monorepo (files named like 0042_add_index.sql) so it can check numbering gaps. The team wants the LEAST context-hungry, tool-native way to get the file list. Which built-in tool should the skill use?",
  "options": {
   "A": "Glob with a pattern such as **/migrations/*.sql to return the matching paths directly.",
   "B": "Grep for the string 'migrations' across the repository and collect file names from the hits.",
   "C": "Read the top-level directory listing and recursively Read each subdirectory until all migrations are found.",
   "D": "Open each candidate file with Read to confirm it is a migration before adding it to the list."
  },
  "answer": [
   "A"
  ],
  "explanation": "The requirement is a list of paths matching a naming pattern, which is exactly what Glob does, without loading file contents. Grep and Read would either search the wrong dimension (contents) or spend context on data the task does not need. Glob results are capped at a fixed number of files with a truncation flag, so in a large monorepo the skill narrows the pattern (per package or directory) rather than falling back to reading files.",
  "distractors": {
   "B": "myth",
   "C": "myth",
   "D": "violates-constraint"
  },
  "why_wrong": {
   "B": "Grep searches file contents; using it to enumerate paths by name is a misuse based on a myth about what it matches.",
   "C": "Read only reads files, not directories; a directory listing needs a shell command. A recursive Read walk is a myth about the tool, and it would also be the most context-expensive route.",
   "D": "Reading every file to confirm a name pattern spends context on contents the task never uses."
  },
  "concept": "Glob for path enumeration",
  "learn": "Use Glob whenever the question is 'which files exist matching this pattern'. It is the wrong tool when you need to know what is inside the files. Results are capped with a truncation flag, so narrow the pattern when the tree is large. On macOS, Linux and WSL, Claude Code leaves Glob and Grep out of the default tool set and searches with find and grep through Bash instead; they come back when named in --tools or --allowedTools or in a subagent's tools list, and the same path-versus-content split applies either way. The common mistake is combining Grep or Read into a manual directory walk.",
  "apply": "If your skill needs a list of file paths and never their contents, Glob is the whole answer."
 },
 {
  "id": "CCARF-2.1-05",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.1",
  "select": 1,
  "stem": "A weather tool is described as 'Returns weather information for a location.' In practice it returns a JSON object with a single field, feelsLikeCelsius, and nothing else. A downstream report-generation agent chains this tool expecting a full forecast with temperature, humidity and wind, and the chain repeatedly fails or fabricates the missing fields. The architect wants the tool's interface to be CORRECT and self-explanatory. What should the architect do?",
  "options": {
   "A": "Rewrite the tool description to name every field the output actually contains, e.g. 'Returns feelsLikeCelsius (number) only; no humidity or wind data is available.'",
   "B": "Increase the report-generation agent's context window so it can infer the missing fields from earlier conversation turns.",
   "C": "Add a line to the report-generation agent's system prompt telling it to 'assume reasonable values for any missing weather fields.'",
   "D": "Add a second wrapper tool around the same API call under a different name, in case the first one is misread."
  },
  "answer": [
   "A"
  ],
  "explanation": "A tool's description should state exactly what its output contains, not just what it conceptually represents. Once the description names the single real field and says explicitly what is absent, the downstream agent stops expecting data that was never going to arrive.",
  "distractors": {
   "B": "bigger-context",
   "C": "vague-guidance",
   "D": "over-engineering"
  },
  "why_wrong": {
   "B": "Just add more context: a bigger window does not create data the tool never returns.",
   "C": "Plausible but vague: 'assume reasonable values' gives the agent no measurable rule and invites fabrication.",
   "D": "Over-engineering: duplicating the tool under a new name adds a second interface instead of fixing the description of the first."
  },
  "concept": "Tool descriptions state outputs",
  "learn": "Use a tool description that names every field the response actually contains whenever another agent or step consumes that output directly. It is the wrong call to over-specify output shape for a tool whose result a human always reviews before use. The common mistake is describing a tool by what it conceptually represents instead of the literal fields it returns.",
  "apply": "If a downstream step is guessing at fields a tool never returns, rewrite the description to enumerate exactly what comes back."
 },
 {
  "id": "CCARF-2.2-03",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.2",
  "select": 2,
  "stem": "An MCP server exposes a send_invoice tool backed by a billing microservice. Every failure today — a malformed customer ID, a temporary network timeout, or the caller lacking permission to bill that account — comes back as a normal-looking tool result whose text simply says 'something went wrong.' The coordinating agent cannot tell whether to retry, correct its input, or escalate to a human. The architect wants the response shape to let the agent DECIDE the right next action. Which two changes should the architect make? (Select TWO.)",
  "options": {
   "A": "Have the MCP server always return isError: false and put an apologetic message in the content so the caller stays calm.",
   "B": "Set isError: true on the tool result whenever the call fails, so the agent detects failure from the result's flag rather than by reading prose.",
   "C": "Include a structured errorCategory field (transient, validation, permission) in the error payload so the agent can retry, correct input, or escalate accordingly.",
   "D": "Retry every failure automatically inside the MCP server three times before responding, regardless of what caused it."
  },
  "answer": [
   "B",
   "C"
  ],
  "explanation": "isError is the flag the MCP result schema defines for tool execution errors (API failures, input validation errors, business logic errors), as distinct from JSON-RPC protocol errors for malformed requests; a structured errorCategory tells the caller which of the three fundamentally different responses (retry, fix input, escalate) applies. Together they let the agent decide, instead of guessing from human-readable text.",
  "distractors": {
   "A": "violates-constraint",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Works but violates the constraint: the response still returns, but hiding every failure behind isError: false removes the exact signal the agent needs to decide anything.",
   "D": "Over-engineering: building an automatic multi-retry stage into the server is extra machinery where a simpler structured errorCategory already tells the caller what to do."
  },
  "concept": "Structured error categories",
  "learn": "Use isError plus a categorized errorCategory field whenever a tool can fail for reasons that call for different responses. It is the wrong call to build this out for a tool that only ever fails one way, where a plain error message is enough. The common mistake is returning a normal-looking result with the failure hidden in prose, leaving the caller to guess whether anything went wrong.",
  "apply": "If your MCP tool always returns isError: false and buries failures in the text field, add isError: true plus a structured errorCategory so the caller can act on it."
 },
 {
  "id": "CCARF-2.3-03",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.3",
  "select": 1,
  "stem": "A coding-assistant coordinator spawns a documentation subagent whose only job is to summarize existing docs. The subagent currently inherits the full forty-tool set of the main session, including deploy and delete-repository tools it never needs. When the docs are ambiguous it occasionally reaches for one of those unrelated tools, wasting turns and risking a destructive call. The architect wants this to be IMPOSSIBLE, not just unlikely. What should the architect do?",
  "options": {
   "A": "Raise the subagent's max_tokens so it has more room to reason before choosing a tool.",
   "B": "Add a line to the subagent's prompt telling it to 'only use tools relevant to documentation.'",
   "C": "Configure the subagent's allowed tool list to include only the read and search tools its task needs, excluding deploy and delete entirely.",
   "D": "Add a fourth reviewer agent whose only job is to double-check which tool the documentation subagent picked."
  },
  "answer": [
   "C"
  ],
  "explanation": "Restricting the subagent's tool set is the only change that makes the destructive call structurally impossible: a tool that is not in the allowed list cannot be invoked, regardless of how the model reasons or what the prompt says.",
  "distractors": {
   "A": "parameter-patch",
   "B": "vague-guidance",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Parameter patch: more reasoning room does not remove access to tools the subagent should never have in the first place.",
   "B": "Plausible but vague: 'only use relevant tools' is advice the model can still ignore, not a restriction it must obey.",
   "D": "Over-engineering: adding a whole extra reviewer agent works around the excess tool access instead of removing it."
  },
  "concept": "Tool set restriction per subagent",
  "learn": "Restrict a subagent's tool list to only what its task requires whenever it has access to unrelated or destructive tools it does not need. It is the wrong call to prune tools from an agent that genuinely needs broad access across a small, well-understood tool set. The common mistake is giving every subagent the full tool list inherited from the main session instead of scoping it per role.",
  "apply": "If a subagent occasionally invokes a tool unrelated to its job, restrict its allowed tool list instead of adding a prompt reminder."
 },
 {
  "id": "CCARF-2.3-04",
  "cert": "CCAR-F",
  "domain": 2,
  "task": "2.3",
  "select": 1,
  "stem": "A pipeline has two steps and runs on a model that supports forced tool use. Step one asks Claude to extract fields into a fixed JSON schema and must NEVER return plain prose instead. Step two is an open-ended troubleshooting chat where Claude should decide for itself whether a tool is needed at all. The architect wants each step to behave correctly without changing which tools are available. What should the architect configure?",
  "options": {
   "A": "Set tool_choice to 'none' for step one, so Claude cannot call any tool and is forced to write the JSON as free text instead.",
   "B": "Set tool_choice to 'auto' for both steps and rely on the system prompt to insist on JSON in step one.",
   "C": "Set tool_choice to 'any' for step two, so Claude must always call some tool even when troubleshooting needs none.",
   "D": "Set tool_choice to 'tool' naming the extraction tool for step one, and to 'auto' for step two."
  },
  "answer": [
   "D"
  ],
  "explanation": "Forcing tool_choice to the extraction tool in step one guarantees a tool_use block for that tool on every call: the API prefills the assistant turn, so no natural-language answer is emitted before it. Add strict: true to the tool definition if the arguments must match the schema exactly; forcing guarantees the call and strict mode guarantees the shape. Leaving step two on 'auto' lets Claude decide for itself whether a tool is warranted, which is exactly what open-ended troubleshooting needs.",
  "distractors": {
   "A": "myth",
   "B": "prompt-not-enforcement",
   "C": "violates-constraint"
  },
  "why_wrong": {
   "A": "Myth: forbidding tool use does not make Claude produce valid, schema-compliant JSON; it just removes the mechanism that would have guaranteed it.",
   "B": "Prompt where enforcement is needed: 'auto' plus a prompt request for JSON can still be ignored, where forcing the tool cannot.",
   "C": "Works but violates the constraint: forcing a tool call in step two directly breaks the requirement that Claude decide for itself whether one is needed."
  },
  "concept": "tool_choice modes",
  "learn": "Configure tool_choice per step: 'tool' to force a specific call, 'auto' to let Claude decide whether a tool is needed, 'any' to force some tool call, 'none' to forbid tool use. Pair a forced call with strict: true when schema validity matters. Forcing is not universally available: manual extended thinking rejects 'any' and 'tool', and some newer models reject them with a request error; there the documented route is 'auto' with strict tool use, or structured outputs when the response itself must be fixed JSON. It is the wrong call to use the same tool_choice value across steps with different needs. The common mistake is relying on prompt wording to enforce a behaviour that tool_choice already guarantees at the API level.",
  "apply": "If a pipeline step must always return schema-compliant tool output, set tool_choice to name that tool directly instead of asking nicely in the prompt."
 },
 {
  "id": "CCARF-3.1-01",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.1",
  "select": 1,
  "stem": "A senior engineer adds 'always answer in Spanish and use my personal alias script' to the repository's CLAUDE.md so Claude Code behaves the way she likes. Teammates start receiving Spanish responses and errors about a script they do not have. The architect wants her preferences to apply on HER machine only, across every repository she works in. Where should those lines live?",
  "options": {
   "A": "In the repository's CLAUDE.md, wrapped in a note asking other engineers to ignore them.",
   "B": "In her user-level ~/.claude/CLAUDE.md, which is loaded for every project on her machine and is not committed.",
   "C": "In a directory-level CLAUDE.md inside each folder she edits most often.",
   "D": "Nowhere; Claude Code detects the author of each instruction and only applies it to that person."
  },
  "answer": [
   "B"
  ],
  "explanation": "The CLAUDE.md hierarchy separates concerns: user-level memory holds personal preferences for all projects, project-level holds team conventions, directory-level holds local context. Personal settings committed to the project file leak to everyone, which is the symptom described.",
  "distractors": {
   "A": "wrong-scope",
   "C": "wrong-scope",
   "D": "myth"
  },
  "why_wrong": {
   "A": "The project file is shared by definition; a note asking others to ignore lines is the right file at the wrong level.",
   "C": "Directory-level files are also committed and apply to anyone working in that directory.",
   "D": "Claude Code does not attribute instructions to authors; that is a myth."
  },
  "concept": "CLAUDE.md hierarchy levels",
  "learn": "Put personal preferences at user level, team conventions at project level, and subsystem specifics at directory level. Mixing levels is the wrong call every time, because it either leaks or hides instructions. The common mistake is editing the nearest CLAUDE.md regardless of who it affects.",
  "apply": "Before adding a line to a CLAUDE.md, ask who else will read it; if the answer is 'nobody should', it belongs in ~/.claude/CLAUDE.md."
 },
 {
  "id": "CCARF-3.1-02",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.1",
  "select": 1,
  "stem": "A platform team maintains coding standards, security rules and API conventions in three Markdown documents that live in a docs directory. Each service repository has copied the content into its CLAUDE.md, and the copies have drifted; one repo's file is now two thousand lines long. The architect wants ONE source of truth that Claude Code loads in every repo. What should the architect do?",
  "options": {
   "A": "Raise the amount of memory Claude Code loads so the long CLAUDE.md files stop being a problem.",
   "B": "Move the standards into each engineer's user-level CLAUDE.md so they follow the person rather than the repo.",
   "C": "Keep one canonical CLAUDE.md in the platform repo; Claude Code merges CLAUDE.md files across repositories automatically.",
   "D": "Keep the standards in their own files and reference them from each repo's CLAUDE.md with @import lines, so the files load without being duplicated."
  },
  "answer": [
   "D"
  ],
  "explanation": "CLAUDE.md supports @import of other files, which is the mechanism for modular, shared standards. Each repo's CLAUDE.md stays short and points at the canonical documents, so updates happen once and drift disappears.",
  "distractors": {
   "A": "bigger-context",
   "B": "wrong-scope",
   "C": "myth"
  },
  "why_wrong": {
   "A": "More loaded text does not fix drift between copies; it is just a bigger context.",
   "B": "Team standards at user level would vary per engineer and be invisible to new hires; wrong scope.",
   "C": "Claude Code does not merge memory files across unrelated repositories; that is a myth."
  },
  "concept": "@import for modular CLAUDE.md",
  "learn": "Use @import to compose CLAUDE.md from shared standards files and keep each file focused. This is right whenever the same guidance is needed in several places. The common mistake is copy-pasting standards into every repo.",
  "apply": "If the same paragraph appears in more than one CLAUDE.md in your organisation, move it to a file and @import it."
 },
 {
  "id": "CCARF-3.2-01",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.2",
  "select": 1,
  "stem": "A developer writes a /release slash command that assembles a changelog and tags a version. It works for her but teammates get 'unknown command'. She created it under ~/.claude/commands. The architect wants the command SHARED and VERSIONED with the repository. What should the architect do?",
  "options": {
   "A": "Move the command file into the repository's .claude/commands directory and commit it.",
   "B": "Ask each teammate to copy the file into their own ~/.claude/commands directory.",
   "C": "Paste the command's prompt into the project CLAUDE.md so it is always in context.",
   "D": "Nothing; commands in ~/.claude/commands are shared through the repository once the developer pushes."
  },
  "answer": [
   "A"
  ],
  "explanation": "Project-scoped commands live in .claude/commands inside the repository and travel with the code, so every clone gets them and changes are reviewed like any other file. User-scoped commands in ~/.claude/commands are personal and never committed. The docs note that custom commands have been merged into skills: a .claude/skills/release/SKILL.md creates the same /release command, is equally project-scoped and versioned, and is the preferred form for new work.",
  "distractors": {
   "B": "violates-constraint",
   "C": "wrong-scope",
   "D": "myth"
  },
  "why_wrong": {
   "B": "Copying files by hand is neither shared nor versioned; it violates the constraint.",
   "C": "CLAUDE.md is always-on memory, not an on-demand command; putting a workflow there is the wrong scope.",
   "D": "The user-level commands directory is outside the repository; it is a myth that pushing shares it."
  },
  "concept": "Project vs user command scope",
  "learn": "Use .claude/commands (or, preferably for new work, .claude/skills/<name>/SKILL.md) for team workflows that belong to the repo, and ~/.claude/commands or ~/.claude/skills for personal shortcuts. The project scope is the wrong choice for commands that reference personal paths or credentials. The common mistake is authoring team commands in the personal directory because it was convenient.",
  "apply": "If a teammate asks 'how do I get your slash command?', it should have been in .claude/commands."
 },
 {
  "id": "CCARF-3.2-02",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.2",
  "select": 1,
  "stem": "A team has a skill that performs a deep dependency audit: it reads dozens of lock files and produces a short report. After invoking it, the main session becomes sluggish and later answers reference lock-file details the user never asked about. The team wants to keep the skill but stop it POLLUTING the main conversation. What should the architect do?",
  "options": {
   "A": "Raise the context configuration so the lock-file content has less impact on the main session.",
   "B": "Skills cannot affect the main context; the sluggishness must come from the user's own long conversation.",
   "C": "Configure the skill to run with context: fork so it executes in an isolated context and only its report returns to the main session.",
   "D": "Convert the skill into a slash command in ~/.claude/commands, which runs outside the session by default."
  },
  "answer": [
   "C"
  ],
  "explanation": "A skill can be configured to fork its context, running in isolation and returning only its result. That removes the intermediate reads from the main conversation while keeping the skill's behaviour. The task statement names this option explicitly.",
  "distractors": {
   "A": "bigger-context",
   "B": "myth",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "A": "A larger window still fills with lock-file text; it delays the problem rather than isolating it.",
   "B": "It is a myth that skills run outside the session unless configured to fork.",
   "D": "Changing scope to user-level does not change where the command executes; commands are not isolated by directory."
  },
  "concept": "Skill context forking",
  "learn": "Fork a skill's context when it reads a lot of material and the main session only needs its conclusion. Keep it inline when the intermediate steps must be visible to the user. The common mistake is running heavy skills inline and blaming the model for drift.",
  "apply": "If a skill's tool calls fill the transcript and the user only needs its final answer, set context: fork."
 },
 {
  "id": "CCARF-3.3-01",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.3",
  "select": 1,
  "stem": "A monorepo holds a React frontend, a Go backend and Terraform modules. The team's CLAUDE.md contains paragraphs like 'if you are editing frontend files, use hooks not classes; if you are editing Terraform, pin provider versions'. Claude Code often applies the wrong convention, and the file keeps growing. The architect wants conventions applied ONLY when the matching files are touched. What should the architect do?",
  "options": {
   "A": "Keep the conditional paragraphs but add stronger wording such as 'IMPORTANT' before each 'if' clause.",
   "B": "Write a PreToolUse hook that injects the right convention into the prompt whenever a file is opened.",
   "C": "Rely on Claude Code to infer conventions from file extensions; explicit conditions are unnecessary.",
   "D": "Create .claude/rules/frontend.md, backend.md and terraform.md, each with a YAML frontmatter paths glob so the rule loads only for matching files."
  },
  "answer": [
   "D"
  ],
  "explanation": "Path-specific rules exist for this case: a rule file's frontmatter declares which paths it applies to, and Claude Code loads it only when work touches those files. Conditions expressed as prose in one big CLAUDE.md are easy to misapply and grow without bound.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "over-engineering",
   "C": "myth"
  },
  "why_wrong": {
   "A": "Emphasising prose conditionals is still asking the model to apply a rule the tooling could scope for it.",
   "B": "A hook to inject text is over-engineering when the rules mechanism does exactly this declaratively.",
   "C": "Claude Code does not infer team conventions from extensions; that is a myth."
  },
  "concept": ".claude/rules with paths globs",
  "learn": "Use .claude/rules/*.md with paths frontmatter for conventions that apply to a subset of the tree; keep truly global guidance in CLAUDE.md. Rules are the wrong tool for conventions that apply everywhere. The common mistake is writing 'if editing X' conditionals in the global file.",
  "apply": "If a CLAUDE.md paragraph starts with 'when working on <directory>', it should be a rule file with a paths glob."
 },
 {
  "id": "CCARF-3.3-02",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.3",
  "select": 1,
  "stem": "A team adds .claude/rules/api-conventions.md with frontmatter paths: ['services/api/*.py'] to enforce their handler conventions. Claude Code applies the rule when editing services/api/app.py but ignores it for services/api/handlers/orders.py. Which is the MOST likely cause?",
  "options": {
   "A": "The rule file is too long for Claude Code to load in nested directories; shorten it.",
   "B": "The glob services/api/*.py matches only files directly in that directory; a recursive pattern such as services/api/**/*.py is needed.",
   "C": "Rules apply only to files that already existed when the session started; restart the session.",
   "D": "The rule should be moved to the user-level ~/.claude directory so it applies globally."
  },
  "answer": [
   "B"
  ],
  "explanation": "Path-specific rules are matched with glob patterns, and a single asterisk does not descend into subdirectories. The observed behaviour (top-level match, nested miss) is the signature of a non-recursive glob. Fixing the pattern fixes the scoping.",
  "distractors": {
   "A": "parameter-patch",
   "C": "myth",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "A": "Rule length has no relationship with directory depth; trimming it is a parameter patch.",
   "C": "Rules are matched per file path, not per session start; that is a myth.",
   "D": "Making the rule global removes the conditional behaviour the team wants; wrong scope."
  },
  "concept": "Diagnosing rule path globs",
  "learn": "When a rule applies inconsistently, inspect the paths frontmatter first: check recursion (**), extensions and directory spelling. This is the right first step for any 'rule ignored' symptom. The common mistake is rewriting the rule body when the glob is at fault.",
  "apply": "If your rule works in one directory and not its children, your glob is missing the ** segment."
 },
 {
  "id": "CCARF-3.4-01",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.4",
  "select": 1,
  "stem": "An architect asks Claude Code to move authentication out of a monolith into a shared library used by five services. The change touches interfaces, error handling and tests across the codebase. A previous attempt in direct-execution mode produced a half-finished refactor that broke two services. The architect wants to REVIEW THE APPROACH before any file is modified. What should the architect do?",
  "options": {
   "A": "Use plan mode so Claude Code analyses the codebase and proposes a step-by-step plan for approval before editing anything.",
   "B": "Run in direct-execution mode again but ask for the change one file at a time.",
   "C": "Spawn a subagent per service so each performs its part of the refactor in parallel immediately.",
   "D": "Direct execution is always correct for refactors; the earlier failure came from an insufficient prompt."
  },
  "answer": [
   "A"
  ],
  "explanation": "Plan mode separates analysis from execution: Claude explores and produces a plan, and nothing is modified until the plan is approved. Large, cross-cutting changes are the case it is designed for, because the cost of a wrong first step is high and the approach itself needs review.",
  "distractors": {
   "B": "violates-constraint",
   "C": "over-engineering",
   "D": "myth"
  },
  "why_wrong": {
   "B": "Editing one file at a time still modifies code before any approach has been reviewed, breaking the constraint.",
   "C": "Parallel subagents editing before there is an agreed design multiplies the earlier failure.",
   "D": "It is a myth that direct execution suits every change; mode choice depends on scope and risk."
  },
  "concept": "Plan mode for architectural changes",
  "learn": "Use plan mode when a change is large, cross-cutting or architecturally risky; use direct execution for small, well-scoped edits. Plan mode is the wrong call for trivial fixes where it only adds ceremony. The common mistake is choosing the mode by habit rather than by the blast radius of the change.",
  "apply": "If you cannot describe the change in one sentence with a known file list, start in plan mode."
 },
 {
  "id": "CCARF-3.4-02",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.4",
  "select": 1,
  "stem": "A team lead mandates that every Claude Code task, including fixing a typo in a log message or bumping a constant, must start in plan mode and get a written plan approved. Developers report that trivial fixes now take longer with Claude than by hand, and they have begun bypassing the tool. What is WRONG with this policy?",
  "options": {
   "A": "Plan mode cannot produce plans for changes smaller than one file, so it silently falls back to direct execution.",
   "B": "Plan mode should be replaced by a hook that approves every edit automatically.",
   "C": "Plan mode is meant for large or architectural changes; simple, well-scoped edits should run in direct execution, so the policy adds cost without reducing risk.",
   "D": "The policy is fine in principle; the team should be told to be pragmatic about when it applies."
  },
  "answer": [
   "C"
  ],
  "explanation": "The mode decision should follow the scope and risk of the change. Planning a one-line edit costs a round trip and buys nothing, because the risk it mitigates does not exist. A blanket rule ignores that tradeoff, which is why it drives people away from the tool.",
  "distractors": {
   "A": "myth",
   "B": "over-engineering",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Plan mode has no size threshold and never silently falls back; that is a myth.",
   "B": "Auto-approving every edit is over-engineering that also removes the review value plan mode has for big changes.",
   "D": "'Be pragmatic' gives no criterion; the policy needs an explicit scope rule."
  },
  "concept": "Direct execution for well-scoped edits",
  "learn": "Reserve plan mode for changes where the approach itself needs review; let small, clearly scoped edits execute directly. A blanket rule in either direction is wrong. The common mistake is equating more process with more safety.",
  "apply": "If your team policy contains the word 'always' about plan mode, add a scope criterion (files touched, interfaces changed) instead."
 },
 {
  "id": "CCARF-3.5-01",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.5",
  "select": 1,
  "stem": "A team uses Claude Code to convert legacy log lines into structured JSON events. The prompt describes the mapping in three paragraphs of prose ('the second bracketed token becomes the severity unless it is numeric, in which case...'). Output is inconsistent from run to run, and each fix adds another sentence. Which change is MOST likely to make the transformation consistent?",
  "options": {
   "A": "Increase the context budget so the prompt can hold an exhaustive description of every case.",
   "B": "Add 'follow the mapping precisely' at the end of the prompt.",
   "C": "Lower the temperature so the prose is interpreted the same way each time.",
   "D": "Replace most of the prose with two or three concrete input/output pairs that show the exact transformation, including one tricky case."
  },
  "answer": [
   "D"
  ],
  "explanation": "Concrete examples communicate a transformation more precisely than descriptions of it: they fix the format, the edge handling and the tone in one place. Two or three well-chosen pairs typically outperform paragraphs of rules, and they are easier to refine when a new case appears.",
  "distractors": {
   "A": "bigger-context",
   "B": "vague-guidance",
   "C": "parameter-patch"
  },
  "why_wrong": {
   "A": "A longer description is still a description; more room does not make prose less ambiguous.",
   "B": "'Follow precisely' adds no information about what precise means.",
   "C": "Temperature reduces variance around an ambiguous spec, not the ambiguity itself."
  },
  "concept": "Examples over prose for transformations",
  "learn": "When you can show the desired output, show it: 2-3 input/output pairs beat rule lists for format and mapping tasks. Prose is still better for open-ended reasoning where there is no single correct shape. The common mistake is growing the rule list one exception at a time.",
  "apply": "If your prompt for a transformation contains more 'unless' clauses than examples, replace the clauses with examples."
 },
 {
  "id": "CCARF-3.5-02",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.5",
  "select": 1,
  "stem": "After learning that examples help, a developer pastes forty input/output pairs into a Claude Code command that reformats API docs. Runs are slower and costlier, and outputs now copy quirks from specific examples rather than generalising. The team wants examples that GUIDE without dominating. What should the architect recommend?",
  "options": {
   "A": "Keep all forty but raise the context configuration so they fit with room to spare.",
   "B": "Reduce to two or three targeted examples that each demonstrate a distinct case, including the ambiguous one that caused the most errors.",
   "C": "More examples always improve results; the quirks come from the model, so switch to a larger model.",
   "D": "Remove all examples and describe the format in prose instead."
  },
  "answer": [
   "B"
  ],
  "explanation": "Iterative refinement works with a few deliberately chosen examples: each one should teach something the others do not. Dozens of near-duplicates cost tokens and push the model toward mimicking incidental details. Curating down to the informative cases restores generalisation.",
  "distractors": {
   "A": "bigger-context",
   "C": "myth",
   "D": "violates-constraint"
  },
  "why_wrong": {
   "A": "Fitting forty examples does not stop them from dominating the output.",
   "C": "It is a myth that examples scale monotonically; past a few they add cost and overfitting.",
   "D": "Dropping examples entirely gives up the guidance the team wants."
  },
  "concept": "Few, targeted examples",
  "learn": "Choose 2-4 examples that cover the format plus the hardest ambiguous cases, and stop. This holds for commands, skills and API prompts alike. The common mistake is treating examples as training data rather than as a specification.",
  "apply": "If you cannot say what each example teaches that the others do not, delete it."
 },
 {
  "id": "CCARF-3.6-01",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.6",
  "select": 1,
  "stem": "A CI pipeline should ask Claude Code to review each pull request and post a summary with a risk level. The current job runs claude interactively inside the pipeline, times out waiting for input, and when it does finish the script uses grep to find 'Risk:' in the console output. The architect wants the step to be NON-INTERACTIVE and machine-readable. What should the architect do?",
  "options": {
   "A": "Keep the interactive run but pipe 'yes' into it so prompts are answered automatically.",
   "B": "Improve the grep with a regular expression that captures the risk level more robustly.",
   "C": "Run claude -p with the review prompt and --output-format json, then parse the JSON result in the pipeline.",
   "D": "Interactive mode is required for reviews; move the step to a developer's machine instead of CI."
  },
  "answer": [
   "C"
  ],
  "explanation": "Headless mode (claude -p) is designed for scripts and pipelines: no prompts, exit when done. Combined with --output-format json the pipeline receives a structured result rather than console prose to scrape. Both halves of the requirement are solved by the intended CLI features.",
  "distractors": {
   "A": "violates-constraint",
   "B": "text-parsing",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Feeding answers to an interactive session is fragile and still not non-interactive by design.",
   "B": "A better regex is still parsing prose for control flow.",
   "D": "It is a myth that reviews need interactive mode; headless mode runs the same prompt."
  },
  "concept": "claude -p with JSON output",
  "learn": "Use claude -p for any scripted invocation and --output-format json when a program will consume the result. Interactive mode is for humans. The common mistake is scraping stdout from an interactive run.",
  "apply": "If your CI YAML calls claude without -p, or greps its output, switch to -p with --output-format json."
 },
 {
  "id": "CCARF-3.6-02",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.6",
  "select": 3,
  "stem": "A release pipeline runs claude -p to classify each commit as 'feature', 'fix' or 'breaking' and to list affected modules. Downstream jobs sometimes crash because the field names vary or a value is missing. The architect wants the step to be RELIABLE for the downstream consumers. Which three changes should be made? (Select THREE.)",
  "options": {
   "A": "Pass a --json-schema that defines the exact fields and allowed values so the output conforms to the schema.",
   "B": "Fail the pipeline step when the CLI exits non-zero instead of parsing whatever partial output exists.",
   "C": "Add 'please always use the same field names' to the prompt and keep the free-form output.",
   "D": "Validate the parsed result against the same schema in the consuming job before using it."
  },
  "answer": [
   "A",
   "B",
   "D"
  ],
  "explanation": "Reliability in a pipeline comes from contracts: a declared schema for the output, a hard failure on error exit, and validation at the consumer boundary. Together they turn 'usually the right shape' into a guarantee that downstream jobs can rely on.",
  "distractors": {
   "C": "prompt-not-enforcement"
  },
  "why_wrong": {
   "C": "Asking nicely for consistent field names is a prompt where a schema is needed; nothing enforces it."
  },
  "concept": "--json-schema in pipelines",
  "learn": "Combine --json-schema, exit-code checks and consumer-side validation for any headless step whose output feeds another job. Free-form output is fine only when a human is the consumer. The common mistake is relying on the prompt to keep field names stable.",
  "apply": "If a downstream job would crash on a renamed key, the producing step needs --json-schema and the consumer needs validation."
 },
 {
  "id": "CCARF-3.1-03",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.1",
  "select": 1,
  "stem": "Two developers on a four-person team want Claude Code to always run commands with extra verbose logging and refer to files by short nicknames, but the rest of the team must keep seeing the default behavior. The two developers want the change to be PERSISTENT across sessions without altering what their teammates see. What should they do?",
  "options": {
   "A": "Add the verbose-logging and nickname instructions to the project's ./CLAUDE.md file, since that file is loaded for every session in the repository.",
   "B": "Add the instructions to CLAUDE.local.md or to their own ~/.claude/CLAUDE.md, so they load only for each of them without touching the shared project file.",
   "C": "Type the instructions into the chat once; Claude Code reloads earlier session transcripts at the start of every new session, so they carry over automatically.",
   "D": "Tell each of the two developers to remember to restate their preferences out loud at the start of every session."
  },
  "answer": [
   "B"
  ],
  "explanation": "CLAUDE.md has a hierarchy: the shared project file is versioned and loaded for everyone, while CLAUDE.local.md (which you add to .gitignore) and the user-level ~/.claude/CLAUDE.md apply only to one developer's machine. Those are the deterministic places for a persistent, per-developer change that never touches what teammates see.",
  "distractors": {
   "A": "wrong-scope",
   "C": "myth",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Right primitive, wrong scope: CLAUDE.md is the correct mechanism, but the project-level file is shared with the whole repository, so it would change what teammates see too.",
   "C": "Myth: each session starts with a fresh context window and earlier transcripts are not loaded unless you resume that session. Auto memory may save some preferences Claude judges worth keeping, but it is not a deterministic way to set instructions; memory files are.",
   "D": "Plausible but vague: 'remember to restate it' has no measurable guarantee and depends on the developer never forgetting."
  },
  "concept": "CLAUDE.md hierarchy levels",
  "learn": "Use CLAUDE.local.md or the user-level ~/.claude/CLAUDE.md when a change should persist for one person without affecting the shared project file. It is the wrong call when the whole team should see the same convention, which belongs in the project's ./CLAUDE.md instead. The common mistake is putting a personal preference into the shared file, or assuming chat instructions survive into a new session.",
  "apply": "If a personal preference lives in the project's versioned CLAUDE.md, everyone on the team inherits it; move it to CLAUDE.local.md or the user-level file instead."
 },
 {
  "id": "CCARF-3.1-04",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.1",
  "select": 1,
  "stem": "A backend engineer keeps a CLAUDE.md at the repo root with general project conventions and adds a second memory file inside services/api/ that requires spaces for indentation in that service. Edits inside services/api/ ignore the spaces rule entirely, as if the file did not exist. What is the MOST likely explanation, and what should she check FIRST?",
  "options": {
   "A": "Run /context to see whether the file is listed under Memory files, and check that it is named exactly CLAUDE.md directly under services/api/; a different filename or location means Claude never loads it as memory.",
   "B": "Increase the context window so both CLAUDE.md files fit into the same request without any truncation happening.",
   "C": "Lower the temperature so Claude follows whichever instructions loaded most recently in a more literal way.",
   "D": "Write a custom pre-commit hook that rewrites every tab to a space inside services/api/ right after Claude finishes editing."
  },
  "answer": [
   "A"
  ],
  "explanation": "Subdirectory CLAUDE.md files are discovered by name and location and load on demand when Claude reads files in that directory. If the file has a different name or sits somewhere else, it never enters context, and the docs' first troubleshooting step for 'Claude isn't following my CLAUDE.md' is to run /context and check the Memory files list: if the file is missing there, Claude can't see it. Note that nested files are concatenated with the root file rather than overriding it, so a conflicting rule in the root file must be removed or scoped; when two instructions conflict, Claude may follow either one.",
  "distractors": {
   "B": "bigger-context",
   "C": "parameter-patch",
   "D": "over-engineering"
  },
  "why_wrong": {
   "B": "Just add more context: the files are already small; the problem is that one of them isn't being recognized at all, not that they don't fit.",
   "C": "Parameter patch: temperature affects how varied Claude's wording is, not which configuration files it loads.",
   "D": "Over-engineering: a custom rewriting hook papers over the real bug instead of fixing the CLAUDE.md discovery problem it is meant to solve."
  },
  "concept": "Diagnosing CLAUDE.md subdirectory scope",
  "learn": "Use a subdirectory CLAUDE.md for conventions that only one part of the tree needs; it loads when Claude reads files there and is concatenated with, not layered over, the root file. It is the wrong diagnosis to reach for context size or model parameters when a memory file silently fails to load. The common mistake is assuming any Markdown file in the folder counts, or expecting a nested file to override the root file instead of removing the conflict.",
  "apply": "If a subdirectory's rules never seem to apply, run /context and confirm a file literally named CLAUDE.md sits at the top of that directory before touching anything else."
 },
 {
  "id": "CCARF-3.2-03",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.2",
  "select": 1,
  "stem": "A support-automation skill ingests a full day's server log, often tens of thousands of lines, to produce a short incident summary. When a developer invokes it mid-conversation, the raw log lines get quoted back into the main thread and crowd out everything else being discussed. The team wants the skill's own reading and reasoning to stay OUT of the main conversation, leaving only the short summary. What should they configure?",
  "options": {
   "A": "Raise the context window so there is room for both the raw log and the ongoing conversation.",
   "B": "Add an instruction inside the skill telling it to 'only show a brief summary and avoid pasting the log'.",
   "C": "Turn the skill into a subagent with a restricted tool list so it cannot read the entire log at once.",
   "D": "Add context: fork to the skill's frontmatter so it runs in its own isolated context and only its final output returns to the main thread."
  },
  "answer": [
   "D"
  ],
  "explanation": "context: fork is the mechanism designed for exactly this: it runs the skill's reading and reasoning in an isolated context so the main conversation only receives the result, keeping the huge log out of the thread the developer is using.",
  "distractors": {
   "A": "bigger-context",
   "B": "prompt-not-enforcement",
   "C": "over-engineering"
  },
  "why_wrong": {
   "A": "Just add more context: a bigger window still puts the raw log directly into the same conversation; it does not isolate it.",
   "B": "Prompt where enforcement is needed: asking the skill nicely to summarize does not stop it from quoting the log if it decides that's useful; the isolation needs to be structural.",
   "C": "Over-engineering: standing up a whole subagent with its own tool list is more than this needs when the skill's own frontmatter already offers context isolation."
  },
  "concept": "Skill context forking",
  "learn": "Use context: fork when a skill's own reading and reasoning would flood the main conversation and only the final result matters there. It is the wrong call for a skill whose intermediate steps the user actually wants to see. The common mistake is trying to control context bleed with a bigger window or a polite instruction instead of the frontmatter setting built for it.",
  "apply": "If a skill routinely pastes large intermediate content into the main thread, add context: fork instead of asking it to be more concise."
 },
 {
  "id": "CCARF-3.2-04",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.2",
  "select": 2,
  "stem": "A platform team wants a /deploy-checklist command that any engineer can invoke by name before deploying, that lives in version control, and that goes through the same pull-request review as other code changes. Separately, one engineer wants a personal /standup command available in every repository she opens, without adding it to the shared project. Which TWO setups are correct? (Select TWO.)",
  "options": {
   "A": "Save /deploy-checklist as .claude/commands/deploy-checklist.md inside the repository, so it is versioned and shared with every clone.",
   "B": "Save /standup in the same project's .claude/commands/ folder, so it becomes available to her the next time she opens the repo.",
   "C": "Save /standup under ~/.claude/commands/standup.md in her home directory, so it loads in every project she opens without touching the shared repo.",
   "D": "Paste the deploy checklist into the project's CLAUDE.md so it is always in context, and tell engineers to say 'run the deploy checklist' instead of typing a command."
  },
  "answer": [
   "A",
   "C"
  ],
  "explanation": "Project-scoped commands live in .claude/commands/ inside the repository (or, in the current preferred form, .claude/skills/<name>/SKILL.md; the docs say custom commands have been merged into skills and both create /name), are versioned, and are invoked explicitly by name, which is exactly what the deploy checklist needs. User-scoped commands under ~/.claude/commands/ (or personal skills under ~/.claude/skills/) follow the developer across every project without touching the shared repo, which is exactly what the personal standup command needs.",
  "distractors": {
   "B": "wrong-scope",
   "D": "violates-constraint"
  },
  "why_wrong": {
   "B": "Right primitive, wrong scope: a slash command is the correct mechanism, but placing a personal command in the project's folder shares it with the whole team instead of keeping it hers alone.",
   "D": "Works but violates the constraint: the checklist would be versioned, but it becomes always-loaded context instead of a workflow invoked by name, and the docs say to move multi-step procedures out of CLAUDE.md into a skill."
  },
  "concept": "Project vs user command scope",
  "learn": "Use a project-scoped command or skill (.claude/commands/ or .claude/skills/) when the whole team should share and review it in version control; use a user-scoped one (~/.claude/commands/ or ~/.claude/skills/) for a personal habit that should follow one person everywhere. Both forms are invoked with /name, and disable-model-invocation: true keeps a skill manual-only. It is the wrong call to put a personal command in the shared folder, or to turn an on-demand workflow into always-loaded CLAUDE.md text. The common mistake is confusing 'versioned' with 'shared with the team' when it's really about which folder the file sits in.",
  "apply": "If a command should only ever run for one person across many repos, move it to ~/.claude/commands/ instead of the project's .claude/commands/."
 },
 {
  "id": "CCARF-3.3-03",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.3",
  "select": 1,
  "stem": "A repository has a frontend/ app, a db-migrations/ folder of SQL files, and seed and maintenance .sql scripts scattered under tools/ and scripts/. The team's SQL naming and transaction-wrapping conventions must apply whenever Claude Code edits ANY .sql file, wherever it lives, and must not clutter context while working on the frontend. What is the correct way to set this up?",
  "options": {
   "A": "Put the SQL conventions in the root CLAUDE.md and ask Claude to only apply them when the file path contains db-migrations.",
   "B": "Add a sentence to CLAUDE.md telling Claude to watch for SQL keywords like INSERT or UPDATE anywhere in a file's content and apply the conventions whenever it recognizes one, regardless of path.",
   "C": "Create db-migrations/CLAUDE.md with the conventions, so they load whenever Claude works inside that directory.",
   "D": "Create .claude/rules/sql-conventions.md with frontmatter paths: ['**/*.sql'], so it loads whenever any matching file is touched, regardless of location."
  },
  "answer": [
   "D"
  ],
  "explanation": "A rules file with a paths glob is matched against the file Claude reads, wherever it sits in the tree, so **/*.sql fires for a SQL script under tools/ just as it does for a migration under db-migrations/, and the rule stays out of context for everything else. Path-scoped rules trigger when Claude reads matching files, not on every tool use.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "text-parsing",
   "C": "violates-constraint"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: relying on Claude to self-filter by path from a monolithic CLAUDE.md is a request, not a deterministic mechanism; a paths glob already does this reliably.",
   "B": "Parsing text for control flow: scanning file content for keywords to decide when a rule applies replaces the deterministic paths mechanism with ad hoc pattern-matching over prose.",
   "C": "Works but violates the constraint: a db-migrations/CLAUDE.md loads when Claude reads files in that directory, so it covers the migrations but never the .sql scripts under tools/ or scripts/."
  },
  "concept": ".claude/rules with paths globs",
  "learn": "Use a .claude/rules/*.md file with a paths glob when a convention must apply to every matching file regardless of which directory Claude happens to be working in. It is the wrong call when the convention really is tied to one directory tree, where a subdirectory CLAUDE.md is enough. The common mistake is scoping by 'where Claude is working' instead of by the file pattern that actually matters.",
  "apply": "If a convention must follow a file type anywhere in the repo, write a rules file with a paths glob instead of a directory-scoped CLAUDE.md."
 },
 {
  "id": "CCARF-3.3-04",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.3",
  "select": 1,
  "stem": "A team adds .claude/rules/handlers.md to scope error-handling conventions to the API service and writes this frontmatter at the top of the file: path: services/api/**/*.py. The conventions now show up in every session, including when only frontend files are touched, and /context lists the rule as loaded at launch. The team wants the rule to load ONLY when Python files under services/api/ are read. What should they fix?",
  "options": {
   "A": "Move the rule's content into the root CLAUDE.md and add the sentence 'apply this only when editing services/api'.",
   "B": "Add disable-model-invocation: true to the rule's frontmatter so it loads only when someone invokes it.",
   "C": "Rename the frontmatter key to paths (a YAML list or comma-separated string of globs such as services/api/**/*.py); Claude Code reads only the paths field of a rule, ignores any other key without an error, and loads a rule that has no paths unconditionally.",
   "D": "Shorten the rule so it fits under the size limit that conditional rules must meet before Claude Code will scope them."
  },
  "answer": [
   "C"
  ],
  "explanation": "The rule frontmatter reference says paths is the only field Claude Code reads from a rule; any other field is ignored without an error, and a rule without paths is loaded at launch with the same priority as .claude/CLAUDE.md. A misspelled key therefore silently turns a conditional rule into an unconditional one, which is exactly the symptom: loaded at launch, applied everywhere. Fixing the key restores the scoping, and the double-star segment then matches Python files at any depth under services/api/.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "wrong-scope",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: an 'only apply when' sentence in CLAUDE.md is advisory context, while a paths glob is evaluated by the client when a matching file is read.",
   "B": "Wrong scope: disable-model-invocation is skill frontmatter; a rule reads only paths, so the key is ignored and the rule keeps loading everywhere.",
   "D": "Myth: there is no size threshold that decides whether a rule is conditional; scoping is decided solely by the paths field."
  },
  "concept": "Diagnosing rule frontmatter",
  "learn": "When a rule that should be conditional loads everywhere, inspect its frontmatter before its body: the key must be paths, the YAML must parse, and the globs must be right (** for any depth). It is the wrong fix to move the content into CLAUDE.md or to borrow skill fields. The common mistake is assuming a typo in the frontmatter produces an error; Claude Code silently treats the rule as unconditional.",
  "apply": "If /context shows a supposedly path-scoped rule loaded at launch, check that its frontmatter key is literally paths and that the YAML parses (claude --debug shows parse errors)."
 },
 {
  "id": "CCARF-3.4-03",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.4",
  "select": 1,
  "stem": "A developer needs Claude Code to rename a single environment variable, MAX_RETRIES, to RETRY_LIMIT across two files where it is used the same way in both, and to update one corresponding line in the README. No other file references the variable and the change has no architectural implications. What is the MOST efficient way to have Claude Code make this change?",
  "options": {
   "A": "Enter plan mode, have Claude draft a full migration document listing every file it will touch, and require written approval before any edit.",
   "B": "Ask Claude to make the edit directly, since it is a small, well-scoped, low-risk change with no architectural impact.",
   "C": "Have Claude review its own renaming diff in the same conversation right after making it, before considering the task finished.",
   "D": "Tell Claude to 'be careful and make sure not to break anything' before it starts."
  },
  "answer": [
   "B"
  ],
  "explanation": "Plan mode exists for changes with real architectural stakes or broad blast radius. A three-line, single-variable rename with no other references is exactly the kind of well-scoped edit direct execution handles efficiently, without the overhead of drafting and approving a plan first.",
  "distractors": {
   "A": "violates-constraint",
   "C": "self-review",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Works but violates the constraint: a written plan and approval step would eventually produce the same rename, but the ceremony adds latency the MOST efficient requirement rules out for a trivial edit.",
   "C": "Self-review: having the same conversation check its own tiny diff adds a redundant step without a measurable benefit for a change this small.",
   "D": "Plausible but vague: 'be careful' gives Claude no concrete criterion and doesn't change how the rename is actually verified."
  },
  "concept": "Direct execution for well-scoped edits",
  "learn": "Use direct execution when a change is small, well-understood, and touches a known, short list of files with no architectural ripple effects. It is the wrong call for changes with broad blast radius or irreversible consequences, where plan mode earns its overhead. The common mistake is defaulting to heavy process for every change regardless of its actual size.",
  "apply": "If a change is a handful of matching lines with no other callers, ask Claude to make it directly instead of routing it through plan mode."
 },
 {
  "id": "CCARF-3.4-04",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.4",
  "select": 1,
  "stem": "A team wants Claude Code to migrate a monolithic order-processing module into three independent services, changing the database access pattern, introducing a message queue between them, and touching code owned by four different teams. The change is IRREVERSIBLE once merged and affects production data flow. What should the team do before Claude Code writes any code?",
  "options": {
   "A": "Start in plan mode so Claude proposes the approach (service boundaries, migration order, rollback strategy) for the team to review before any file is edited.",
   "B": "Let Claude execute the refactor directly, and rely on the pull-request review to catch any structural problems.",
   "C": "Ask Claude to 'think carefully and be extra cautious given how important this migration is' before it starts.",
   "D": "Have Claude review its own migration plan immediately after writing it, in the same conversation, before implementation begins."
  },
  "answer": [
   "A"
  ],
  "explanation": "A large-scale, irreversible change with cross-team ownership and a production data-flow impact is exactly what plan mode is for: it forces the approach to be written out and reviewed before any code changes are made, catching structural problems while they are still cheap to fix.",
  "distractors": {
   "B": "violates-constraint",
   "C": "vague-guidance",
   "D": "self-review"
  },
  "why_wrong": {
   "B": "Works but violates the constraint: direct execution could eventually produce a working migration, but skipping upfront review for an irreversible, cross-team change breaks the safety this scenario demands.",
   "C": "Plausible but vague: telling Claude to be 'extra cautious' gives it no concrete checkpoint or reviewable artifact before an irreversible change.",
   "D": "Self-review: the same session checking its own plan right after writing it lacks the independent, human review this scale of change needs."
  },
  "concept": "Plan mode for architectural changes",
  "learn": "Use plan mode when a change is large in scope, touches code owned by multiple teams, or is hard or impossible to reverse once merged. It is the wrong call for small, contained edits where the overhead outweighs the risk. The common mistake is trusting after-the-fact review to substitute for reviewing the approach itself before any code is written.",
  "apply": "If a change is irreversible or spans several teams' code, start in plan mode instead of letting Claude execute and reviewing only the resulting diff."
 },
 {
  "id": "CCARF-3.5-03",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.5",
  "select": 1,
  "stem": "A developer asks Claude Code to classify incoming support tickets into one of six categories using only a paragraph describing each category. Results are inconsistent: similar tickets sometimes land in different categories. She wants the MOST reliable fix without building a rigid rules engine. What should she do?",
  "options": {
   "A": "Rewrite the category descriptions in more emphatic language, in capital letters, to make the boundaries clearer.",
   "B": "Increase the context window so Claude can consider more of each ticket's history when classifying it.",
   "C": "Lower the temperature so the classification becomes more deterministic.",
   "D": "Give 2-3 concrete example tickets paired with their correct category for each ambiguous boundary."
  },
  "answer": [
   "D"
  ],
  "explanation": "A handful of concrete input/output examples for the boundaries that actually confuse the model communicate the transformation far more precisely than any amount of prose description, because Claude can pattern-match the mapping directly instead of inferring it from a paragraph.",
  "distractors": {
   "A": "vague-guidance",
   "B": "bigger-context",
   "C": "parameter-patch"
  },
  "why_wrong": {
   "A": "Plausible but vague: capitalizing the wording makes the description feel stronger without giving any new, checkable criterion for the boundary cases that are actually failing.",
   "B": "Just add more context: more ticket history doesn't clarify which category a genuinely ambiguous ticket belongs to; the boundaries themselves are underspecified.",
   "C": "Parameter patch: lowering temperature makes the same underspecified boundary get applied more consistently wrong, not more correctly."
  },
  "concept": "Examples over prose for transformations",
  "learn": "Use a few concrete input/output examples when a transformation's boundaries are ambiguous in prose. It is the wrong call for transformations that are already unambiguous, where examples add nothing. The common mistake is trying to fix ambiguity by adding more or stronger wording instead of a worked example.",
  "apply": "If a classification task keeps landing inconsistently on the same boundary, add 2-3 examples for that boundary instead of rewriting the category description again."
 },
 {
  "id": "CCARF-3.5-04",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.5",
  "select": 2,
  "stem": "A team's command reformats messy vendor invoices into a normalized CSV row. Output is fine for typical invoices but breaks on two edge cases: multi-currency lines and invoices with a discount line. The team wants to fix this the way that best matches how Claude Code learns a transformation, not by writing exhaustive prose rules. Which TWO actions should they take? (Select TWO.)",
  "options": {
   "A": "Paste every invoice format the company has ever received, roughly 300, into the command so nothing is missed.",
   "B": "Add one concrete example of a multi-currency invoice together with its correct normalized output.",
   "C": "Add one concrete example of an invoice with a discount line together with its correct normalized output.",
   "D": "Examples aren't necessary here, since Claude Code automatically remembers every invoice format it has seen in any earlier session."
  },
  "answer": [
   "B",
   "C"
  ],
  "explanation": "One targeted example per failing edge case shows Claude exactly how the multi-currency and discount-line cases should map to the normalized row, which is precisely how the platform is meant to learn a transformation: a few concrete pairs for the cases that are actually failing.",
  "distractors": {
   "A": "bigger-context",
   "D": "myth"
  },
  "why_wrong": {
   "A": "Just add more context: pasting 300 formats 'so nothing is lost' buries the two failing cases in noise instead of giving Claude a clean, targeted example of each one.",
   "D": "Myth: Claude Code does not carry memory of invoice formats across unrelated sessions on its own; nothing persists unless it is written into a file the session actually loads."
  },
  "concept": "Few, targeted examples",
  "learn": "Use one or two targeted examples per failing edge case when a transformation mostly works but breaks on specific patterns. It is the wrong call to dump every historical example in hopes of covering everything, which dilutes the signal. The common mistake is assuming more examples are always better, or that Claude retains anything between sessions without an explicit file.",
  "apply": "If two specific edge cases are failing, add one example per edge case instead of pasting the entire historical dataset into the prompt."
 },
 {
  "id": "CCARF-3.6-03",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.6",
  "select": 1,
  "stem": "A nightly pipeline runs Claude Code to decide, for each failing test, whether it is flaky, a real regression, or an environment issue, and a downstream Python script parses that decision to update a dashboard. The team currently greps the printed reasoning for the words 'flaky', 'regression', or 'environment', which sometimes matches none of them or more than one. What should the pipeline do instead?",
  "options": {
   "A": "Ask Claude, in the prompt, to always start its answer with exactly one of the three words in capital letters and nothing else.",
   "B": "Increase --max-turns so Claude has more turns to think before producing its answer.",
   "C": "Run claude -p with --output-format json and a --json-schema describing a classification enum field, then have the script parse that guaranteed-valid field.",
   "D": "Keep grepping the text output, but expand the keyword list to include synonyms like 'intermittent' and 'infra'."
  },
  "answer": [
   "C"
  ],
  "explanation": "A JSON schema turns the classification into a structured field the script can parse deterministically, with the value already constrained to the allowed set, instead of hoping free text always contains exactly one recognizable keyword.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "parameter-patch",
   "D": "text-parsing"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: asking nicely for a strict format still lets Claude drift, and the downstream script has automation consequences that call for a schema, not a formatting request.",
   "B": "Parameter patch: more turns to think doesn't make the printed text more parseable; the format problem is unrelated to how many turns Claude takes.",
   "D": "Parsing text for control flow: a longer keyword list still fails whenever Claude's wording doesn't match any of them, instead of using the structured output the platform already provides."
  },
  "concept": "claude -p with JSON output",
  "learn": "Use claude -p with --output-format json and a --json-schema whenever a downstream script needs a reliable field to parse. It is the wrong call for output meant purely for a human to read, where free text is fine. The common mistake is trying to make free text more parseable instead of asking for structured output directly.",
  "apply": "If a script greps Claude's text output for keywords, switch the invocation to --output-format json with a schema instead of expanding the keyword list."
 },
 {
  "id": "CCARF-3.6-04",
  "cert": "CCAR-F",
  "domain": 3,
  "task": "3.6",
  "select": 1,
  "stem": "A CI job runs claude -p to automatically fix lint errors on every pull request and push the fix back to the branch. The job currently runs with --dangerously-skip-permissions so it never blocks on a prompt, and last week a run used a shell command to modify an unrelated deployment script that had nothing to do with linting. The team wants the SAME automation to keep fixing lint errors WITHOUT being able to touch files outside the linter's scope. What should they change?",
  "options": {
   "A": "Add a line to the pipeline's CLAUDE.md asking Claude to only touch files related to linting.",
   "B": "Run the job with --allowedTools restricted to the linter and file-editing tools it needs, scoped to the relevant paths, so anything else is denied outright.",
   "C": "Increase --max-turns so Claude has more time to double-check its own changes before finishing.",
   "D": "Have the same claude -p invocation review its own diff at the end of the run and revert anything unrelated before exiting."
  },
  "answer": [
   "B"
  ],
  "explanation": "Replacing blanket bypass with an allow list enforces least privilege at the client: --allowedTools uses permission-rule syntax, so entries such as Bash(npm run lint *) and Edit(src/**) allow exactly those calls, and in a non-interactive run nothing can approve anything else, so every other call is denied. For paths that must never be touched, add --disallowedTools or permissions.deny rules, which block in every mode. Permission rules are enforced by the client regardless of what Claude decides, unlike CLAUDE.md text.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "C": "parameter-patch",
   "D": "self-review"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: a CLAUDE.md request has no teeth against a tool that has already been granted; last week's incident shows a polite instruction is not enough.",
   "C": "Parameter patch: more turns changes how long Claude works, not which files or tools it is permitted to touch.",
   "D": "Self-review: the same run checking its own diff after the fact is exactly the kind of after-the-fact check that let last week's unrelated change slip through in the first place."
  },
  "concept": "Scoped tool permissions in headless CI",
  "learn": "Use --allowedTools scoped to the task's actual needs when a headless job should be unable to touch anything outside its job. It is the wrong call when the job legitimately needs broad access, such as a general-purpose refactor task. The common mistake is trusting a written instruction or a later self-check instead of denying the capability outright.",
  "apply": "If a CI job has full default permissions, replace the blanket access with --allowedTools scoped to exactly what that job needs."
 },
 {
  "id": "CCARF-4.1-01",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.1",
  "select": 1,
  "stem": "A fraud-screening assistant flags transactions for human review. Its system prompt says 'Flag anything that seems suspicious; be conservative.' Reviewers report that most flags are ordinary purchases, and the queue has become unmanageable. The architect wants to REDUCE FALSE POSITIVES without missing real fraud. What should the architect do?",
  "options": {
   "A": "Lower the temperature so the model's notion of suspicious becomes more stable.",
   "B": "Replace the vague instruction with explicit, checkable criteria (for example: amount above the customer's 90-day maximum, new country, or three declines in ten minutes) and state what does NOT qualify.",
   "C": "Add a second model that reviews every flag and removes the ones it disagrees with.",
   "D": "Keep the prompt but add 'do not over-flag' after 'be conservative'."
  },
  "answer": [
   "B"
  ],
  "explanation": "'Suspicious' and 'conservative' are not criteria; the model resolves them by flagging broadly. Explicit conditions and explicit exclusions give the model a decision rule it can apply consistently, which is what cuts false positives while keeping the true positives the criteria describe.",
  "distractors": {
   "A": "parameter-patch",
   "C": "over-engineering",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Temperature stabilises an ambiguous rule; it does not make the rule precise.",
   "C": "A second model reviewing vague flags is over-engineering when the first prompt lacks criteria.",
   "D": "'Do not over-flag' is another vague instruction stacked on the first."
  },
  "concept": "Explicit criteria over vague instructions",
  "learn": "Specify the conditions that trigger an action and the conditions that exclude it, in measurable terms. This is right for any classification with consequences. The common mistake is describing an attitude ('be careful') instead of a rule.",
  "apply": "If your system prompt uses adjectives like 'suspicious', 'relevant' or 'important' without defining them, expect false positives."
 },
 {
  "id": "CCARF-4.1-02",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.1",
  "select": 1,
  "stem": "A support-ticket triage prompt instructs: 'Escalate tickets that are urgent.' Analysis shows 60% of tickets get escalated, including routine password resets, and genuinely urgent outages are sometimes not escalated. A junior engineer proposes fixing it by having the model re-read each decision and confirm it. What is WRONG with the current prompt, and what is the better fix?",
  "options": {
   "A": "'Urgent' is undefined, so the model applies its own threshold; define urgency with specific signals (service down, data loss, payment failure, SLA tier) and list common non-urgent cases.",
   "B": "The model is under-powered for the task; switch to the largest available model.",
   "C": "The prompt lacks the full ticket history; include all prior tickets from the customer so the model can judge urgency.",
   "D": "The proposal is correct; a confirmation pass by the same model will catch the mis-escalations."
  },
  "answer": [
   "A"
  ],
  "explanation": "The failure runs in both directions (over- and under-escalation), which is the signature of an undefined criterion rather than a capability limit. Naming the signals that constitute urgency, and the cases that do not, gives the model a consistent rule.",
  "distractors": {
   "B": "parameter-patch",
   "C": "bigger-context",
   "D": "self-review"
  },
  "why_wrong": {
   "B": "A bigger model still has to guess what 'urgent' means; this is a parameter patch.",
   "C": "More history does not define the threshold; it adds context without adding criteria.",
   "D": "The same instance re-checking against the same vague word keeps the same ambiguity."
  },
  "concept": "Defining the decision criterion",
  "learn": "Whenever a prompt hinges on one evaluative word, define it with observable signals and counter-examples. This applies to triage, moderation and routing prompts. The common mistake is treating the model's inconsistency as a capability problem.",
  "apply": "If your prompt's key instruction fits in five words, it probably needs a definition block underneath it."
 },
 {
  "id": "CCARF-4.2-01",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.2",
  "select": 1,
  "stem": "An invoice-classification prompt handles most invoices well but is inconsistent on two ambiguous categories: 'software subscription' versus 'professional services' when a vendor bills for both. The team wants CONSISTENT decisions on those ambiguous cases at minimal cost. What should the architect do?",
  "options": {
   "A": "Add fifty labelled invoices to the prompt so the model has seen every vendor pattern.",
   "B": "Add 'when unsure, think carefully about the category' to the instructions.",
   "C": "Add two to four examples that specifically show mixed invoices and the correct category with a one-line rationale each.",
   "D": "Fine-tune a dedicated classifier on the company's invoice history."
  },
  "answer": [
   "C"
  ],
  "explanation": "Few-shot examples are most valuable where instructions are ambiguous. A handful of examples targeted at the exact boundary case teaches the decision rule directly, at a fraction of the cost of a large example set or a separate model.",
  "distractors": {
   "A": "bigger-context",
   "B": "vague-guidance",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Fifty examples add cost and noise; the ambiguity lives in one boundary that a few examples can cover.",
   "B": "'Think carefully' offers no rule for the boundary.",
   "D": "A fine-tuned classifier is over-engineering for a prompt-level ambiguity."
  },
  "concept": "Targeted few-shot for ambiguous cases",
  "learn": "Aim examples at the boundary where the instructions run out; 2-4 usually suffice. Examples are wasted on cases the model already handles. The common mistake is choosing typical examples instead of hard ones.",
  "apply": "If your examples all show easy cases, replace them with the cases your error log says are being confused."
 },
 {
  "id": "CCARF-4.2-02",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.2",
  "select": 1,
  "stem": "A meeting-notes summariser must output a fixed layout: a one-line headline, a 'Decisions' list, an 'Action items' list with owner and date, and nothing else. Outputs vary: sometimes headings are missing, sometimes prose paragraphs appear. The team wants the format to be STABLE across runs. Which change is MOST effective?",
  "options": {
   "A": "Lower the temperature so the layout varies less between runs.",
   "B": "Post-process the output with regular expressions to insert the missing headings.",
   "C": "Ask for the summary twice and keep the one whose layout looks closer to the specification.",
   "D": "Include two or three complete example outputs in the prompt that show the exact layout, including an example with an empty 'Decisions' section."
  },
  "answer": [
   "D"
  ],
  "explanation": "For format consistency, showing the target beats describing it: examples fix the headings, ordering and edge handling (an empty section) unambiguously. This is the core use of few-shot prompting in the task statement.",
  "distractors": {
   "A": "parameter-patch",
   "B": "text-parsing",
   "C": "over-engineering"
  },
  "why_wrong": {
   "A": "Temperature narrows variance around whatever the model thinks the format is, which is still underspecified.",
   "B": "Repairing prose after the fact is parsing text for structure the prompt should have fixed.",
   "C": "Over-engineering: generating twice and picking a layout by eye doubles the cost and adds a judgement step without ever fixing the underspecified format."
  },
  "concept": "Examples for format consistency",
  "learn": "Use examples whenever a specific output layout matters; include an edge case such as an empty section. Where the structure is strict enough to be a schema, use tool-based structured output instead. The common mistake is describing the layout in words.",
  "apply": "If you find yourself writing 'the output should look like...' in prose, paste an actual example instead."
 },
 {
  "id": "CCARF-4.3-01",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.3",
  "select": 1,
  "stem": "A pipeline asks Claude for JSON describing extracted contract terms. The prompt says 'Respond with ONLY valid JSON.' Around 5% of responses arrive wrapped in a Markdown code fence or preceded by 'Here is the JSON:', and the parser crashes. The architect wants output that is GUARANTEED to match the schema. What should the architect do?",
  "options": {
   "A": "Define the contract-terms schema as a tool's input_schema with strict: true, force the call with tool_choice, and read the fields from the tool_use block.",
   "B": "Strip code fences and leading text with a regular expression before parsing.",
   "C": "Move the 'ONLY valid JSON' instruction to the end of the prompt and repeat it in capital letters.",
   "D": "Raise max_tokens so the model has room to finish the JSON cleanly."
  },
  "answer": [
   "A"
  ],
  "explanation": "Tool use moves the answer out of prose into a structured tool_use block, and forcing the call removes the text-answer path. The schema guarantee itself comes from strict tool use: with strict: true the API constrains sampling so the input always matches the schema, whereas without it the docs warn the model may still return wrong types or omit required fields. JSON outputs (output_config with a json_schema format) give the same guarantee when no tool call is wanted. On models that reject forced tool_choice, the docs direct you to tool_choice auto with strict tools or to JSON outputs instead.",
  "distractors": {
   "B": "text-parsing",
   "C": "prompt-not-enforcement",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "B": "Cleaning prose before parsing is parsing text for structure and still breaks on the next variant.",
   "C": "Louder prompting cannot guarantee a shape; it only lowers the failure rate.",
   "D": "Truncation is not the problem; extra tokens change nothing about the wrapping."
  },
  "concept": "Structured output via tool_use",
  "learn": "When downstream code needs a schema-compliant object, use structured outputs: a strict tool that you force with tool_choice, or JSON outputs with a schema. Plain-text JSON is acceptable only for human-read output or exploratory scripts. The common mistake is hardening the parser instead of the contract.",
  "apply": "If your code contains json.loads on response text and a try/except around it, switch to a strict tool or JSON outputs so the shape is enforced by the API."
 },
 {
  "id": "CCARF-4.3-02",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.3",
  "select": 1,
  "stem": "A team defines a single tool, emit_classification, with a strict schema, and leaves tool_choice on auto. Most responses arrive as tool calls, but occasionally Claude replies in plain text such as 'This item does not fit any category', and the pipeline fails. The team wants a tool call EVERY time. What is the fix?",
  "options": {
   "A": "Nothing; with only one tool defined, auto already forces the model to use it.",
   "B": "Set tool_choice to force the tool (type 'tool' with the tool's name, or 'any'), and add an 'unknown' value to the schema for items that fit no category.",
   "C": "Detect plain-text responses and retry the request until a tool call is returned.",
   "D": "Add a second 'no_category' tool and let the model choose between the two."
  },
  "answer": [
   "B"
  ],
  "explanation": "Under auto, the model may decide a text answer is more appropriate, even with a single tool. Forcing the tool with tool_choice guarantees the structured path on models that support forced tool use, and extending the schema with an explicit 'unknown' value gives the model a legitimate way to express the case it was previously answering in prose. Add strict: true if the input must also match the schema exactly. Forced tool use is not available with manual extended thinking, and some newer models reject any/tool; there the docs direct you to auto with strict tool use or to JSON outputs, where the same 'unknown' escape hatch applies.",
  "distractors": {
   "A": "myth",
   "C": "text-parsing",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "It is a myth that a single tool is always called under auto; the model can still respond in text.",
   "C": "Retrying on detected prose is control flow driven by text inspection and wastes calls.",
   "D": "A second tool is over-engineering; the schema can carry the 'no category' outcome."
  },
  "concept": "Forcing tool_choice for structured output",
  "learn": "When the output must be structured, force the tool (or use JSON outputs where forcing is unsupported) and make sure the schema can express every legitimate outcome, including 'none'. Forcing is wrong when the model should be free to reply conversationally. The common mistake is a schema that cannot say 'unknown', which pushes the model back to prose.",
  "apply": "If your structured-output step sometimes returns text, check both tool_choice and whether the schema has an escape hatch for edge cases."
 },
 {
  "id": "CCARF-4.4-01",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.4",
  "select": 1,
  "stem": "A pipeline validates Claude's structured output against business rules (dates must be in the future, totals must match line items). When validation fails, it simply re-sends the original request. The retry fails with the same error most of the time. The architect wants retries that ACTUALLY CONVERGE. What should the architect do?",
  "options": {
   "A": "Raise the temperature on retries so the model produces a different answer.",
   "B": "Ask the model, in the same request, to check its own totals before answering.",
   "C": "Include the entire conversation history of previous attempts so the model can see what it tried.",
   "D": "Re-send the original input together with the specific validation errors ('total 480 does not equal sum of line items 520') so the model can correct the exact problem."
  },
  "answer": [
   "D"
  ],
  "explanation": "A retry that carries no new information tends to reproduce the same mistake. Appending the concrete validation errors alongside the original input turns the retry into a feedback loop: the model knows what was wrong and can fix that specific field.",
  "distractors": {
   "A": "parameter-patch",
   "B": "self-review",
   "C": "bigger-context"
  },
  "why_wrong": {
   "A": "Randomness might produce a different wrong answer; it does not point the model at the error.",
   "B": "Self-checking inside the same generation keeps the reasoning that produced the mistake.",
   "C": "Piling on full transcripts adds context without stating what failed."
  },
  "concept": "Retry with validation errors appended",
  "learn": "Every retry should carry the validator's findings and the original input. Blind retries are acceptable only for transient transport errors. The common mistake is a retry loop that resubmits an identical request.",
  "apply": "If your retry function takes no argument describing the failure, it cannot help the model fix anything."
 },
 {
  "id": "CCARF-4.4-02",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.4",
  "select": 2,
  "stem": "An architect designs the validation-and-retry loop for an extraction service that feeds an accounting system. Which two design decisions are correct for a loop that must be both EFFECTIVE and BOUNDED? (Select TWO.)",
  "options": {
   "A": "Cap the number of retries and route the item to human review with the accumulated errors once the cap is reached.",
   "B": "Retry indefinitely until validation passes, since each attempt has some chance of success.",
   "C": "On each retry, pass the exact validator messages and the original input, not just 'try again'.",
   "D": "Instead of a validator, instruct the model to double-check its own output and only respond when confident."
  },
  "answer": [
   "A",
   "C"
  ],
  "explanation": "A feedback loop needs two properties: informative retries (so each attempt can improve) and a termination condition (so a bad input cannot spin forever). Bounded retries with escalation plus specific error feedback deliver both.",
  "distractors": {
   "B": "violates-constraint",
   "D": "self-review"
  },
  "why_wrong": {
   "B": "Unbounded retries break the bounded constraint and can burn budget on an unfixable input.",
   "D": "Replacing an external validator with the model's own confidence is self-review that never catches what it believes."
  },
  "concept": "Bounded feedback loops",
  "learn": "Validate externally, feed errors back, cap attempts, escalate the remainder. This is right for any output with business consequences. The common mistake is an infinite loop or a loop that trusts the model's self-assessment.",
  "apply": "If your retry loop has no maximum and no 'what happens after' branch, it is not bounded."
 },
 {
  "id": "CCARF-4.5-01",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.5",
  "select": 1,
  "stem": "A compliance team must classify two hundred thousand archived documents once a quarter. Results are needed within two days and nobody waits on individual results. The current implementation fires real-time requests in parallel, hits rate limits, and is the largest line in the team's API bill. Which change gives the LOWEST cost for this workload?",
  "options": {
   "A": "Keep real-time requests but add exponential backoff so rate limits cause fewer failures.",
   "B": "Switch to a smaller model for the real-time requests to cut the per-request price.",
   "C": "Submit the documents through the Message Batches API, which processes them asynchronously at a substantial discount within the required window.",
   "D": "Build a queue service that meters the real-time requests to stay under the rate limit."
  },
  "answer": [
   "C"
  ],
  "explanation": "Batch processing is designed for large, latency-tolerant workloads: submit many requests, collect results within a day, and pay significantly less than real-time. The quarterly job has no interactive latency need, so it is the textbook fit and the cheapest option.",
  "distractors": {
   "A": "violates-constraint",
   "B": "parameter-patch",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Backoff reduces failures but keeps paying real-time prices, so it does not meet the lowest-cost constraint.",
   "B": "Swapping the model may hurt quality and still leaves the discount on the table; it is a parameter patch.",
   "D": "A metering service is over-engineering that reimplements what batches provide natively."
  },
  "concept": "Message Batches for latency-tolerant work",
  "learn": "Use the Batches API when results can wait and volume is high; use real-time for anything a user or an agent loop is waiting on. Batches are the wrong call for interactive or dependent multi-step calls. The common mistake is optimising real-time throughput for a job that is not real-time.",
  "apply": "If nobody is waiting for an individual result and you have thousands of them, the workload belongs in a batch."
 },
 {
  "id": "CCARF-4.5-02",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.5",
  "select": 2,
  "stem": "An architect is deciding which of several workloads to move to the Message Batches API to reduce cost. Which two workloads are APPROPRIATE for batch processing? (Select TWO.)",
  "options": {
   "A": "A customer chat widget where each reply must appear within seconds.",
   "B": "Nightly generation of product descriptions for the next day's catalogue update.",
   "C": "An agentic loop where each tool result must be fed back before the next request can be built.",
   "D": "Weekly sentiment scoring of the previous week's support transcripts for a dashboard."
  },
  "answer": [
   "B",
   "D"
  ],
  "explanation": "Batches trade latency for cost: requests are processed asynchronously, potentially over many hours. Any job with a deadline measured in hours and no dependency between requests fits; anything interactive or sequentially dependent does not.",
  "distractors": {
   "A": "violates-constraint",
   "C": "myth"
  },
  "why_wrong": {
   "A": "Seconds-level latency cannot be met by an API mode that may take hours; it violates the workload's constraint.",
   "C": "It is a myth that a dependent loop can be batched; each step needs the previous result before it can be submitted."
  },
  "concept": "Matching API mode to latency needs",
  "learn": "Classify each workload by who waits and whether requests depend on each other; batch the independent, latency-tolerant ones. Real-time remains right for everything else. The common mistake is moving an agent loop to batches because it is expensive.",
  "apply": "If a request can only be constructed after another request's response, it cannot be in the same batch."
 },
 {
  "id": "CCARF-4.6-01",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.6",
  "select": 1,
  "stem": "A legal-summary generator ends each response with a self-check: 'Review the summary above for factual errors and correct them.' Audits still find hallucinated clause numbers, and the self-check almost never changes anything. The architect wants a review step that CATCHES the errors the generator makes. What should the architect do?",
  "options": {
   "A": "Send the summary and the source document to a separate model instance with only reviewing instructions, and act on its findings.",
   "B": "Make the self-check more explicit by listing the kinds of errors the model should look for in its own summary.",
   "C": "Lower the temperature so fewer factual errors are generated in the first place.",
   "D": "Give the generator a larger context so it can re-read the source before self-checking."
  },
  "answer": [
   "A"
  ],
  "explanation": "A model reviewing its own output carries the reasoning that produced the errors, so it tends to confirm them. An independent instance that sees only the output and the source, with no generation context, evaluates it fresh. That independence is what makes the review catch mistakes.",
  "distractors": {
   "B": "self-review",
   "C": "parameter-patch",
   "D": "bigger-context"
  },
  "why_wrong": {
   "B": "A more detailed self-check is still the same instance checking its own work.",
   "C": "Temperature may reduce variance but does not add an independent check.",
   "D": "The generator already had the source; more room does not remove its bias toward its own output."
  },
  "concept": "Independent second-instance review",
  "learn": "Use a separate instance for review whenever the cost of an undetected error is high. Self-review is acceptable for low-stakes polish. The common mistake is appending 'check your work' and believing it is a review step.",
  "apply": "If your review prompt is in the same request as the generation, it is self-review, not review."
 },
 {
  "id": "CCARF-4.6-02",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.6",
  "select": 1,
  "stem": "A team sets up a two-pass workflow: instance A drafts a data-migration plan, instance B reviews it. To 'help' B, they forward A's entire transcript, including A's reasoning and its own confidence statements. B approves nearly everything, even plans with obvious ordering errors. Which change would make the second pass MORE independent?",
  "options": {
   "A": "Ask A to review its own plan again before sending it to B.",
   "B": "Reviewers naturally agree with well-argued plans; add a third instance to break ties.",
   "C": "Give B only the plan and the review criteria, not A's reasoning or confidence, so B must evaluate the plan on its merits.",
   "D": "Run B inside the same session as A so it has full context of what A considered."
  },
  "answer": [
   "C"
  ],
  "explanation": "Independence is about what the reviewer sees, not only which instance runs it. Forwarding the generator's reasoning re-imports its assumptions and anchors the reviewer. Restricting B to the artefact and the criteria forces a fresh evaluation.",
  "distractors": {
   "A": "self-review",
   "B": "myth",
   "D": "wrong-scope"
  },
  "why_wrong": {
   "A": "Another pass by A is self-review with the same bias.",
   "B": "It is a myth that reviewers must agree with persuasive reasoning; the problem is anchoring, and a third anchored reviewer does not fix it.",
   "D": "Sharing the session collapses the two instances into one context, which is the right mechanism at the wrong scope."
  },
  "concept": "Reviewer input isolation",
  "learn": "Give a reviewing instance the output, the source and the criteria, and nothing that reveals how the output was produced. This matters for every multi-pass review. The common mistake is sharing the generator's transcript to be helpful.",
  "apply": "If your reviewer prompt includes the phrase 'the previous model reasoned that', you have leaked generation context into the review."
 },
 {
  "id": "CCARF-4.1-03",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.1",
  "select": 1,
  "stem": "A logistics company's contract-review assistant is instructed: 'Flag clauses that seem risky.' Reviewers find the assistant flags nearly every clause that mentions a penalty, including standard late-delivery fees, while missing a genuinely one-sided indemnification clause in a different contract. The team wants the MOST RELIABLE fix without adding new tooling. What should they do?",
  "options": {
   "A": "Replace the instruction with explicit criteria: flag only uncapped liability, waived standard warranties, or penalties above a stated threshold.",
   "B": "Add a dedicated clause-classification service, trained separately on past contracts, to score each clause's risk before Claude reviews the contract.",
   "C": "Tell the assistant to 'use good judgment and be conservative when flagging clauses.'",
   "D": "Lower the temperature so the assistant is less creative when interpreting 'risky'."
  },
  "answer": [
   "A"
  ],
  "explanation": "Vague criteria like 'risky' let the model apply its own inconsistent notion of risk, which is why boilerplate penalties get flagged while a genuinely one-sided clause slips through. Replacing the instruction with explicit, checkable conditions gives the model a fixed decision rule instead of an open-ended judgment call, which is the most reliable fix and needs no new infrastructure.",
  "distractors": {
   "B": "over-engineering",
   "C": "vague-guidance",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "B": "Over-engineering: a new scoring service adds a component to maintain when the real problem is that the instruction itself has no measurable criteria.",
   "C": "Plausible but vague: 'use good judgment' and 'be conservative' give no checkable rule, so the same inconsistent flagging continues.",
   "D": "Parameter patch: temperature affects wording variety, not whether the instruction defines what counts as risky."
  },
  "concept": "Explicit criteria over vague instructions",
  "learn": "Use explicit, measurable criteria whenever a prompt asks the model to judge something (risk, urgency, quality) that could otherwise be interpreted many ways. It is the wrong call only when the task genuinely has no fixed rule and open judgment is the point. The common mistake is instructing the model to 'be careful' or 'use good judgment' and expecting consistent behavior.",
  "apply": "If your prompt tells the model to flag things that 'seem' risky, urgent or important without stating the rule, list the specific conditions that qualify instead."
 },
 {
  "id": "CCARF-4.1-04",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.1",
  "select": 1,
  "stem": "A support-ticket prioritization prompt tells Claude to 'prioritize tickets that seem important.' Auditors find that both trivial password-reset requests and multi-day service outages sometimes land in the same top-priority bucket, and different shifts disagree with each other. The team wants prioritization to behave the SAME way regardless of who is reviewing the log. Which change should they make?",
  "options": {
   "A": "Increase max_tokens so the model has more room to reason about importance.",
   "B": "Instruct the model to 'weigh urgency carefully and use common sense.'",
   "C": "Define an explicit rule: P1 = multi-customer outage, P2 = single-customer bug, P3 = account request, and require Claude to cite which rule applied.",
   "D": "Deploy a separate machine-learning triage classifier upstream of Claude to pre-score ticket urgency before it responds."
  },
  "answer": [
   "C"
  ],
  "explanation": "'Seems important' has no fixed meaning across shifts or tickets, so the model, and human reviewers, apply it differently each time. A concrete rule set that maps observable ticket properties to priority levels, with a requirement to cite the rule used, produces the same classification regardless of who reads the log.",
  "distractors": {
   "A": "parameter-patch",
   "B": "vague-guidance",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Parameter patch: a larger token budget gives the model more room to write, not a fixed rule for what counts as important.",
   "B": "Plausible but vague: 'use common sense' still leaves the boundary between priority levels undefined.",
   "D": "Over-engineering: adding a separate classifier service duplicates the decision Claude could make correctly once given an explicit rule."
  },
  "concept": "Defining the decision criterion",
  "learn": "Define the decision criterion explicitly whenever a classification depends on a boundary, such as urgent versus routine or high versus low priority. It is the wrong call only when the categories truly are subjective and meant to reflect individual reviewer judgment. The common mistake is trusting words like 'important' or 'urgent' to carry a fixed meaning on their own.",
  "apply": "If two reviewers reading the same ticket log would disagree on priority, write down the rule that decides it and put that rule in the prompt."
 },
 {
  "id": "CCARF-4.2-03",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.2",
  "select": 1,
  "stem": "A resume-screening prompt classifies candidates as 'Strong fit', 'Possible fit', or 'Not a fit' for a data-engineer role. It is consistent for most resumes but wavers specifically on candidates with adjacent experience, such as data analysts with light pipeline exposure — near-identical resumes sometimes get 'Possible fit' and sometimes 'Not a fit'. The team wants CONSISTENT handling of exactly this ambiguous case. What should they add?",
  "options": {
   "A": "Paste the company's entire hiring handbook into the prompt so nothing about role expectations is missed.",
   "B": "Add the instruction 'use your best judgment on borderline candidates.'",
   "C": "Introduce a separate resume-scoring model to pre-rank candidates before Claude classifies them.",
   "D": "Add two or three worked examples of adjacent-experience resumes labeled the way the team wants, with the reasoning for each label shown."
  },
  "answer": [
   "D"
  ],
  "explanation": "The inconsistency is concentrated on one recognizable pattern: adjacent-experience resumes. A small number of targeted examples showing exactly how that pattern should be labeled, with the reasoning made explicit, teaches the model the boundary directly, which is the most effective fix for this kind of ambiguity.",
  "distractors": {
   "A": "bigger-context",
   "B": "vague-guidance",
   "C": "over-engineering"
  },
  "why_wrong": {
   "A": "Just add more context: the handbook adds volume, not a worked example of the specific ambiguous case the model is missing.",
   "B": "Plausible but vague: 'best judgment' gives no concrete boundary between 'Possible fit' and 'Not a fit'.",
   "C": "Over-engineering: a second model adds a component to maintain when a few targeted examples would resolve the same ambiguity inside the existing prompt."
  },
  "concept": "Targeted few-shot for ambiguous cases",
  "learn": "Use a few targeted few-shot examples when a model is inconsistent on a specific, identifiable pattern such as adjacent-field resumes or borderline categories. It is the wrong call when the model is already consistent, or when the ambiguity is so broad that no small example set could cover it. The common mistake is adding general context or vague advice instead of showing the exact boundary case resolved.",
  "apply": "If you can point to the specific pattern that gets classified inconsistently, add two to four examples of exactly that pattern labeled correctly."
 },
 {
  "id": "CCARF-4.2-04",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.2",
  "select": 2,
  "stem": "An incident-report generator must always output four sections in this order — 'Summary', 'Root Cause', 'Impact', 'Remediation' — with nothing else. In practice, some reports add an extra 'Next Steps' section, others merge 'Impact' into 'Summary', and heading capitalization varies. The team wants the output format to be RELIABLY consistent across incidents. Which two changes should they make? (Select TWO.)",
  "options": {
   "A": "Tell the model to 'format the report professionally and consistently.'",
   "B": "Provide two or three example incident reports, already formatted with the exact four headings in order, as few-shot examples.",
   "C": "State explicitly in the prompt that only these four headings may appear, in this exact order and casing, and no others.",
   "D": "Include the full incident-management style guide as extra background text in the prompt."
  },
  "answer": [
   "B",
   "C"
  ],
  "explanation": "Fixed output layout is best achieved by combining an explicit statement of the allowed structure with a small number of examples that show that structure applied. The examples anchor the exact wording and order, while the explicit rule closes off any headings the examples didn't happen to demonstrate.",
  "distractors": {
   "A": "vague-guidance",
   "D": "bigger-context"
  },
  "why_wrong": {
   "A": "Plausible but vague: 'professionally and consistently' does not say which headings are allowed or in what order, so the drift continues.",
   "D": "Just add more context: the style guide adds background text but is not the same as a worked example or an explicit list of the four allowed headings."
  },
  "concept": "Examples for format consistency",
  "learn": "Combine a small set of formatted examples with an explicit statement of the allowed structure whenever an output layout must be fixed. It is the wrong call when the format is meant to vary per case. The common mistake is describing the desired format only in prose and hoping the model infers the exact headings and order.",
  "apply": "If your generated reports drift in section names or order, add worked examples in the exact target format plus an explicit list of the only allowed headings."
 },
 {
  "id": "CCARF-4.3-03",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.3",
  "select": 1,
  "stem": "A feedback-analysis pipeline asks Claude to 'reply only with a JSON object containing sentiment, category and confidence' inside the system prompt. Even so, the downstream parser occasionally fails because Claude wraps the JSON in a markdown code fence or adds a one-line caveat before it. The team wants output that is GUARANTEED to match a schema. What should they do?",
  "options": {
   "A": "Strengthen the instruction to 'ONLY output raw JSON, never add markdown or commentary, this is critical.'",
   "B": "Keep the free-text response and strip markdown fences and leading text with a regex before parsing.",
   "C": "Add several paragraphs to the system prompt describing the exact JSON schema in prose.",
   "D": "Define a tool with a JSON schema for sentiment, category and confidence, mark it strict: true, and require a tool_use response instead of free text."
  },
  "answer": [
   "D"
  ],
  "explanation": "A free-text instruction to output JSON is still just a request; the model can and does deviate under some conditions. Structured outputs make the shape part of the API contract: a strict tool (strict: true) constrains sampling so the tool input always matches the schema, and JSON outputs (output_config with a json_schema format) do the same for a text response. Requiring the tool call removes the free-text path where forced tool use is supported; on models that reject forced tool_choice, use auto with the strict tool or JSON outputs.",
  "distractors": {
   "A": "prompt-not-enforcement",
   "B": "text-parsing",
   "C": "bigger-context"
  },
  "why_wrong": {
   "A": "Prompt where enforcement is needed: a stricter wording of the same instruction is still a request the model can deviate from, not a structural guarantee.",
   "B": "Parsing text for control flow: stripping fences with a regex patches around inconsistent prose instead of removing the source of the inconsistency.",
   "C": "Just add more context: describing the schema in more prose still produces free text, not output constrained by an actual schema."
  },
  "concept": "Structured output via tool_use",
  "learn": "Use a strict tool or JSON outputs whenever downstream code needs guaranteed schema-compliant output. It is the wrong call for short, human-facing responses where free text is expected. The common mistake is asking harder in prose for JSON-only output instead of giving the API a schema to enforce.",
  "apply": "If a downstream parser occasionally chokes on markdown fences or stray prose around JSON, replace the free-text instruction with a tool definition and read the tool_use input."
 },
 {
  "id": "CCARF-4.3-04",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.3",
  "select": 1,
  "stem": "A parts-ordering service extracts orders from free-text requests and calls a place_order tool with a schema for sku, quantity and warehouse; tool_choice is left at its default. Every message the service receives is an order, but for chatty requests such as 'thanks for yesterday, please send 40 units of the usual bracket to the north warehouse', Claude sometimes replies in plain text restating the order instead of calling the tool, so nothing is placed. The team wants EVERY request to result in a tool call. What should they change?",
  "options": {
   "A": "Increase max_tokens so the model has more room to think before deciding whether to call the tool.",
   "B": "Set tool_choice to require the tool (type 'tool' naming place_order, or 'any'), so a plain-text reply is no longer available on that turn.",
   "C": "Add a stronger instruction: 'You must always call place_order, this is mandatory.'",
   "D": "Add a second lightweight model that watches the conversation and calls place_order whenever it detects an order was described in prose."
  },
  "answer": [
   "B"
  ],
  "explanation": "The default tool_choice is auto: Claude decides each turn whether to call a tool or answer directly, which is exactly why a chatty message can produce prose instead of a call. Forcing the tool with tool_choice removes the text-only path at the API level; the docs note that with any or tool the model will not emit natural-language text before the tool_use block. Add strict: true if the input must also match the schema exactly. On models that do not support forced tool use, the docs direct you to auto combined with strict tool use or JSON outputs instead.",
  "distractors": {
   "A": "parameter-patch",
   "C": "prompt-not-enforcement",
   "D": "over-engineering"
  },
  "why_wrong": {
   "A": "Parameter patch: a larger token budget changes how much the model can write, not whether it is allowed to skip the tool entirely.",
   "C": "Prompt where enforcement is needed: repeating the instruction more forcefully is still a request the default tool_choice lets the model ignore.",
   "D": "Over-engineering: a second watcher model duplicates a decision that tool_choice already makes deterministic at the API level."
  },
  "concept": "Forcing tool_choice for structured output",
  "learn": "Force tool_choice whenever a workflow depends on a tool call happening every time, not just when the model decides it should, and pair it with a strict schema when the fields must be exact. It is the wrong call when the model genuinely needs the option to answer in plain text, and it is unavailable with manual extended thinking and on some newer models, where structured outputs take its place. The common mistake is leaving tool_choice at its default and trying to compensate with stronger wording.",
  "apply": "If Claude sometimes answers in text instead of calling the one tool your pipeline expects, set tool_choice to force a tool call rather than rewording the instruction."
 },
 {
  "id": "CCARF-4.4-03",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.4",
  "select": 1,
  "stem": "An expense-report extraction pipeline validates Claude's structured output: expense dates must fall within the reporting period, and line-item amounts must sum to the reported total. When validation fails, the pipeline currently resends the original document unchanged and asks Claude to 'try again.' Results barely improve on retry. The team wants retries to actually fix the specific problem WITHOUT adding manual review. What should the pipeline do differently?",
  "options": {
   "A": "On retry, resend the document with the exact validation errors — which dates are out of range, which totals don't match — so Claude fixes precisely those fields.",
   "B": "Send the original document along with the company's entire expense policy manual so Claude has more context to avoid mistakes.",
   "C": "Retry with a lower temperature so the extraction is more deterministic.",
   "D": "Have a person manually recompute the totals and dates for every failed extraction before it is resubmitted."
  },
  "answer": [
   "A"
  ],
  "explanation": "A bare 'try again' gives Claude no information about what was wrong, so it is likely to repeat the same mistake. Appending the specific validation errors alongside the original input tells the model exactly which fields failed and why, which is what lets the retry actually correct the problem.",
  "distractors": {
   "B": "bigger-context",
   "C": "parameter-patch",
   "D": "violates-constraint"
  },
  "why_wrong": {
   "B": "Just add more context: a policy manual adds general background but still doesn't tell Claude which specific date or total was wrong.",
   "C": "Parameter patch: a lower temperature makes output more repeatable, it does not tell the model what to fix.",
   "D": "Works but violates the constraint: manual recomputation would fix individual cases, but it reintroduces exactly the manual review step the team wants to avoid."
  },
  "concept": "Retry with validation errors appended",
  "learn": "Append the specific validation errors to the original input on every retry when structured output fails a check. It is the wrong call when the failure is a one-off fluke unrelated to the input, where a plain retry might already succeed. The common mistake is resending the same input with a generic 'try again' and expecting a different result.",
  "apply": "If your retry loop resends the original request without the validator's specific error messages, add those errors to the retry prompt."
 },
 {
  "id": "CCARF-4.4-04",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.4",
  "select": 1,
  "stem": "A contract-metadata extraction service retries automatically whenever validation fails, resending the document with the specific errors appended, exactly as designed. For a small number of malformed source PDFs, validation never passes, and the service has looped for hundreds of retries on the same document, consuming quota. The team wants to FIX this without losing the benefit of error-guided retries. What should they add?",
  "options": {
   "A": "Increase the context window so the model can see the entire malformed source PDF at once before extracting.",
   "B": "Raise max_tokens so each retry response has more room to succeed.",
   "C": "Add an instruction telling Claude to give up gracefully and stop retrying after a small number of tries.",
   "D": "Cap the number of retries and route the document to a failure queue for human review once the cap is reached, instead of retrying indefinitely."
  },
  "answer": [
   "D"
  ],
  "explanation": "Error-guided retries help when the input is fixable, but some documents are genuinely malformed and no amount of retrying will pass validation. A fixed retry cap that routes to a failure queue keeps the benefit of guided retries for fixable cases while bounding the cost of the unfixable ones.",
  "distractors": {
   "A": "bigger-context",
   "B": "parameter-patch",
   "C": "prompt-not-enforcement"
  },
  "why_wrong": {
   "A": "Just add more context: a larger window lets the model see more of the document, it does not stop retries from continuing indefinitely on a document that cannot pass validation.",
   "B": "Parameter patch: more output room does not address the fact that nothing currently limits how many times the loop retries.",
   "C": "Prompt where enforcement is needed: the model does not control how many times the pipeline calls it; the cap must live in the pipeline's own code, not in an instruction."
  },
  "concept": "Bounded feedback loops",
  "learn": "Bound a validation-and-retry loop with a fixed retry cap and a failure path whenever the input might be unfixable. It is the wrong call only for one-shot pipelines with no retry logic at all. The common mistake is building error-guided retries without ever limiting how many times they can run.",
  "apply": "If your retry loop has no maximum attempt count, add one and send anything that still fails at the cap to a human queue instead of looping forever."
 },
 {
  "id": "CCARF-4.5-03",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.5",
  "select": 1,
  "stem": "A research team needs to summarize a backlog of eighty thousand archived support tickets as a one-time cleanup project. No user is waiting on any individual result, and the team wants to run the job at the LOWEST cost. Which approach should they use?",
  "options": {
   "A": "Build a custom queue-and-worker system that sends synchronous requests with rate-limit backoff.",
   "B": "Submit the summarization requests through the Message Batches API and collect results once the batch completes.",
   "C": "Have each subagent in a multi-agent system make its own synchronous request for a share of the tickets.",
   "D": "Reduce max_tokens per response so more tickets can be processed within the same time budget."
  },
  "answer": [
   "B"
  ],
  "explanation": "The workload is large, one-off, and latency-tolerant: exactly the profile the Message Batches API is built for, at a substantially lower cost than synchronous requests in exchange for a turnaround window instead of an immediate reply.",
  "distractors": {
   "A": "over-engineering",
   "C": "violates-constraint",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "A": "Over-engineering: building and operating a custom queueing system duplicates functionality the Message Batches API already provides, for more effort and no cost benefit.",
   "C": "Works but violates the constraint: splitting the work across multiple synchronous subagents would get the summaries done, but each call is still billed at the synchronous rate, so it costs more than the batch discount the LOWEST-cost requirement calls for.",
   "D": "Parameter patch: shrinking each response changes summary length, not the per-request cost that batching is meant to reduce."
  },
  "concept": "Message Batches for latency-tolerant work",
  "learn": "Use the Message Batches API for large, latency-tolerant workloads where no one is waiting on an individual response, since it costs substantially less in exchange for turnaround measured in hours. It is the wrong call whenever a user or downstream system needs a same-second answer. The common mistake is building custom batching infrastructure or splitting the work across agents instead of using the API's own batch mode.",
  "apply": "If a workload is a one-time or periodic bulk job with no one waiting on individual results, route it through the Message Batches API instead of synchronous calls."
 },
 {
  "id": "CCARF-4.5-04",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.5",
  "select": 2,
  "stem": "A platform runs two workloads: a live chat assistant that must answer within a couple of seconds, and a nightly job that re-summarizes the last day's closed tickets for an internal wiki, with no one waiting on the result. The team wants to match each workload to the RIGHT API mode. Which two statements are correct? (Select TWO.)",
  "options": {
   "A": "The live chat assistant should keep using standard synchronous requests, since it needs a response within seconds.",
   "B": "The Message Batches API also returns results within a couple of seconds for small batches, so it can serve the live chat assistant too.",
   "C": "The nightly ticket-summarization job is a good candidate for the Message Batches API, since it tolerates a delay of hours and benefits from the lower cost.",
   "D": "Both workloads should be merged into a single request with a much larger context window covering the whole day's tickets and chats."
  },
  "answer": [
   "A",
   "C"
  ],
  "explanation": "Choosing an API mode is about matching latency tolerance to turnaround: an interactive assistant needs an immediate synchronous reply, while a latency-tolerant overnight job is a natural fit for the Message Batches API's lower cost in exchange for a turnaround window of up to a day.",
  "distractors": {
   "B": "myth",
   "D": "bigger-context"
  },
  "why_wrong": {
   "B": "Myth: the Message Batches API is designed for turnaround measured in hours, up to a day, not seconds, so it cannot serve a workload that needs an immediate reply.",
   "D": "Just add more context: merging both workloads into one large-context request does not give the chat assistant an immediate reply, and it throws away the batch job's cost advantage."
  },
  "concept": "Matching API mode to latency needs",
  "learn": "Match API mode to how long the caller can wait: synchronous requests for interactive, second-scale needs, Message Batches for large, latency-tolerant jobs at lower cost. It is the wrong call to pick a mode by workload size alone without asking who is waiting. The common mistake is believing batches return quickly enough for interactive use, or trying to serve both needs with one oversized request.",
  "apply": "If a workload has no one waiting on an individual result, route it to the Message Batches API; if a user is waiting, keep it synchronous."
 },
 {
  "id": "CCARF-4.6-03",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.6",
  "select": 1,
  "stem": "An API-integration code generator writes a client wrapper, then in the same conversation is asked to 'review the code above for bugs.' Post-mortems show this self-check rarely finds anything, even when a teammate immediately spots a missing null check that the generator itself introduced. The team wants a review that actually CATCHES the mistakes the generation step made. What should they change?",
  "options": {
   "A": "Keep the review in the same conversation, but ask more emphatically: 'Really look hard this time for bugs.'",
   "B": "Tell the generator to 'be more careful and write more defensive code.'",
   "C": "Send the generated code to a fresh, independent instance with no memory of how it was produced, and ask it to review the code for bugs.",
   "D": "Raise the generator's max_tokens so it has more room to reason about edge cases before writing the wrapper."
  },
  "answer": [
   "C"
  ],
  "explanation": "A self-check in the same conversation inherits the same assumptions and blind spots that produced the bug in the first place, which is why it so rarely catches its own mistakes. A fresh instance with no memory of the generation approaches the code with no such bias and is far more likely to notice what the first pass missed.",
  "distractors": {
   "A": "self-review",
   "B": "vague-guidance",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "A": "Self-review: asking more forcefully within the same conversation still means the same instance, with the same reasoning context, is checking its own work.",
   "B": "Plausible but vague: 'be more careful' gives no independent perspective and no measurable check, so the same blind spot persists.",
   "D": "Parameter patch: a larger output budget changes how much the generator can write, not whether anyone independent looks at the result; the missing null check was a blind spot, not a truncation."
  },
  "concept": "Independent second-instance review",
  "learn": "Use an independent second instance with no memory of the generation step when a review needs to catch mistakes the first pass is blind to. It is the wrong call for quick, low-stakes output where a same-instance check is cheap and good enough. The common mistake is asking the generating instance to review its own work more emphatically instead of starting a fresh one.",
  "apply": "If a self-check almost never changes the output, replace it with a review by a separate instance that never saw the generation."
 },
 {
  "id": "CCARF-4.6-04",
  "cert": "CCAR-F",
  "domain": 4,
  "task": "4.6",
  "select": 1,
  "stem": "A team already sends draft marketing copy to a second, independent Claude instance for review, which fixed their earlier self-review problem. However, they also paste the full first-pass conversation — including the drafting instance's uncertain reasoning and false starts — into the reviewer's prompt. The reviewer frequently repeats the same reasoning errors as the drafting instance. The team wants the review to be GENUINELY independent without dropping the two-instance setup. What should they change?",
  "options": {
   "A": "Paste even more of the drafting instance's internal notes so the reviewer has full context.",
   "B": "Give the reviewer only the requirements and the final draft, not the drafting instance's reasoning or false starts, so it evaluates the output independently.",
   "C": "Assume a second instance can never be influenced by text pasted into its prompt, so the full transcript is harmless to include.",
   "D": "Increase the reviewer's max_tokens so it has more room to reason independently of the pasted transcript."
  },
  "answer": [
   "B"
  ],
  "explanation": "A separate instance only reviews independently if its input is independent; pasting the drafting instance's own uncertain reasoning lets the reviewer anchor on the same false starts. Limiting the reviewer's input to the requirements and the final draft preserves the independence that a second instance is meant to provide.",
  "distractors": {
   "A": "bigger-context",
   "C": "myth",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "A": "Just add more context: pasting more of the drafting instance's notes increases exposure to its reasoning, which is the opposite of what independence requires.",
   "C": "Myth: a second instance's judgment is shaped by whatever is in its prompt, including a pasted transcript, so the transcript is not harmless.",
   "D": "Parameter patch: a larger token budget changes how much the reviewer can write, not what reasoning it was exposed to before writing it."
  },
  "concept": "Reviewer input isolation",
  "learn": "Isolate a reviewer's input to the requirements and the artifact being reviewed, keeping the generator's own reasoning and false starts out of its prompt. It is the wrong call when the reviewer genuinely needs the generation history, such as auditing a decision trail. The common mistake is treating a second instance as independent by default even after pasting the first instance's reasoning into its prompt.",
  "apply": "If your 'independent' reviewer's prompt includes the drafting instance's own reasoning or drafts, strip that out and give it only the requirements and the final output."
 },
 {
  "id": "CCARF-5.1-01",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.1",
  "select": 1,
  "stem": "An insurance-claims agent handles long conversations. To stay within the context window it progressively summarises older turns. Adjusters notice that after a few summaries the agent misstates the policy number, the incident date and the deductible amount, though the general story stays right. The architect wants those facts PRESERVED EXACTLY no matter how long the case runs. What should the architect do?",
  "options": {
   "A": "Move to the largest available context configuration so summarisation happens less often.",
   "B": "Maintain a persistent 'case facts' block (identifiers, dates, amounts) that is kept verbatim and re-inserted on every turn, and summarise only the narrative.",
   "C": "Lower the temperature of the summarisation step so numbers are copied more faithfully.",
   "D": "Summarisation is lossless for short facts; the errors must come from the adjusters' original inputs."
  },
  "answer": [
   "B"
  ],
  "explanation": "Summaries compress prose and reliably lose precise values: numbers, dates, identifiers. The structural fix is to separate facts that must never change from narrative that can be compressed, and to carry the facts verbatim across turns. That protects exactly the fields that were being corrupted.",
  "distractors": {
   "A": "bigger-context",
   "C": "parameter-patch",
   "D": "myth"
  },
  "why_wrong": {
   "A": "A bigger window postpones summarisation; it still loses the numbers when it happens.",
   "C": "Temperature does not stop compression from dropping details.",
   "D": "It is a myth that summarisation preserves exact values."
  },
  "concept": "Persistent case-facts block",
  "learn": "Keep a verbatim facts block for anything with an exact value and summarise only the story around it. This is right for any long-running task with identifiers or figures. The common mistake is summarising the whole transcript uniformly.",
  "apply": "If your summariser is the only place a policy number or a date lives, it will eventually be wrong; pin those values in a block that never gets summarised."
 },
 {
  "id": "CCARF-5.1-02",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.1",
  "select": 1,
  "stem": "A procurement agent's context strategy is: every ten turns, replace everything older than the last five turns with a one-paragraph summary generated by the model. Near the end of a negotiation the agent quotes a delivery deadline that was agreed twenty turns earlier as 'around the end of the month' instead of the exact date, and the counter-party disputes it. What is WRONG with this approach?",
  "options": {
   "A": "The interval is too long; summarising every three turns would keep the deadline fresh.",
   "B": "The summary should be produced by asking the same model to double-check it for omissions.",
   "C": "The strategy is sound but the paragraph limit is too small; allow a longer summary.",
   "D": "Uniform summarisation treats a hard fact (an agreed date) like narrative and lets it degrade; agreed terms must be recorded in a structured, non-summarised store that persists across turns."
  },
  "answer": [
   "D"
  ],
  "explanation": "The failure is structural: a summariser will paraphrase dates into approximations. Terms that carry commitments need to be captured in a structured record at the moment they are agreed and injected verbatim thereafter. Changing the cadence or size of summaries only delays the drift.",
  "distractors": {
   "A": "parameter-patch",
   "B": "self-review",
   "C": "bigger-context"
  },
  "why_wrong": {
   "A": "More frequent summaries still paraphrase; the interval is not the flaw.",
   "B": "The same model checking its own summary keeps the same tendency to paraphrase.",
   "C": "A longer summary is just more context; nothing guarantees the date survives verbatim."
  },
  "concept": "Separating facts from narrative",
  "learn": "Capture commitments, identifiers and figures as structured facts when they occur; summarise only free text. This is right for negotiations, support cases and any workflow with agreed terms. The common mistake is one summariser for everything.",
  "apply": "If a user could sue over a value in your transcript, that value must not pass through a summariser."
 },
 {
  "id": "CCARF-5.2-01",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.2",
  "select": 1,
  "stem": "A refunds agent is told in its system prompt to 'escalate to a human when appropriate'. It refunds a disputed high-value order on its own and, separately, escalates a routine question about delivery times. The team wants escalation to be PREDICTABLE. What should the architect do?",
  "options": {
   "A": "Write explicit escalation triggers in the system prompt (amount above a threshold, customer disputes a charge, request outside the policy list) plus a few examples of cases that must and must not be escalated.",
   "B": "Add 'use extra caution with refunds' to the system prompt.",
   "C": "Introduce a separate escalation-scoring model that rates each conversation before the agent answers.",
   "D": "Escalation behaviour cannot be controlled through prompting; route all refunds to humans."
  },
  "answer": [
   "A"
  ],
  "explanation": "'When appropriate' leaves the threshold to the model. Concrete triggers plus few-shot examples on both sides of the line give it a rule, which makes escalation consistent and auditable. That is the pattern the task statement describes.",
  "distractors": {
   "B": "vague-guidance",
   "C": "over-engineering",
   "D": "myth"
  },
  "why_wrong": {
   "B": "'Extra caution' is another undefined instruction.",
   "C": "A scoring model is over-engineering when explicit triggers in the prompt define the decision.",
   "D": "It is a myth that escalation cannot be shaped by explicit criteria; the current prompt simply lacks them."
  },
  "concept": "Explicit escalation triggers",
  "learn": "List the conditions that require escalation, with examples of near-misses on both sides. This is right wherever an agent can take a consequential action. The common mistake is delegating the threshold to the model's judgment.",
  "apply": "If your escalation rule uses 'appropriate', 'necessary' or 'significant' without numbers or named conditions, it is not a rule."
 },
 {
  "id": "CCARF-5.2-02",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.2",
  "select": 1,
  "stem": "A scheduling assistant receives requests such as 'move my meeting to next week', where 'my meeting' could refer to several events. Instead of asking, it picks one and moves it, and users are frustrated. The architect wants the assistant to HANDLE AMBIGUITY consistently rather than guess. Which change is BEST?",
  "options": {
   "A": "Lower the temperature so the assistant picks the same meeting each time.",
   "B": "Tell the assistant to be thoughtful when requests are unclear.",
   "C": "Define in the system prompt what counts as ambiguous (more than one matching event, missing date) and show two or three examples where the correct response is a clarifying question rather than an action.",
   "D": "Have the assistant re-read the request after acting and undo the move if it now seems ambiguous."
  },
  "answer": [
   "C"
  ],
  "explanation": "Ambiguity handling needs a definition of ambiguity and examples of the desired behaviour. Naming the conditions and showing the clarifying-question response teaches the model when to stop and ask instead of acting. Consistency follows from the rule, not from sampling settings.",
  "distractors": {
   "A": "parameter-patch",
   "B": "vague-guidance",
   "D": "self-review"
  },
  "why_wrong": {
   "A": "Consistently moving the wrong meeting is still wrong; temperature does not add a clarification step.",
   "B": "'Be thoughtful' gives no condition under which to ask.",
   "D": "Acting first and self-reviewing afterwards still performs the unwanted action and relies on the same judgment."
  },
  "concept": "Ambiguity detection with examples",
  "learn": "Define ambiguity conditions and demonstrate the clarify-before-acting behaviour with examples. This is right for any assistant that performs actions from natural-language requests. The common mistake is assuming the model will ask on its own.",
  "apply": "If your agent can execute an action on an under-specified request without a documented 'ask first' condition, it will guess."
 },
 {
  "id": "CCARF-5.3-01",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.3",
  "select": 2,
  "stem": "A research coordinator dispatches a database subagent. When the subagent's query fails, it returns the string 'Sorry, I could not complete the task.' The coordinator then either retries the identical dispatch or gives up. The architect wants the coordinator to be able to RECOVER intelligently. Which two changes should be made? (Select TWO.)",
  "options": {
   "A": "Have the subagent retry silently up to ten times before returning anything to the coordinator.",
   "B": "Require the subagent to return a structured error with the error type, the exact query it attempted and any partial results it obtained.",
   "C": "Instruct the coordinator to guess what went wrong from the apology and adjust its next dispatch.",
   "D": "Design the coordinator to branch on the error type: rewrite the query on validation errors, retry later on transient errors, and escalate on permission errors, reusing partial results where available."
  },
  "answer": [
   "B",
   "D"
  ],
  "explanation": "Recovery requires information: what failed, what was tried, and what was salvaged. A structured error context gives the coordinator that information, and a coordinator that branches on it can take the right action instead of blind retries. Both halves are needed.",
  "distractors": {
   "A": "myth",
   "C": "text-parsing"
  },
  "why_wrong": {
   "A": "Silent retries hide the failure from the coordinator and assume it is transient; that is a myth about which errors retries fix.",
   "C": "Inferring the cause from an apology is parsing prose for control flow."
  },
  "concept": "Structured error context between agents",
  "learn": "Errors that cross an agent boundary should be structured: type, attempted action, partial results. This is right in every multi-agent system. The common mistake is letting subagents return natural-language failure messages.",
  "apply": "If your coordinator cannot tell from a subagent's response which query failed, the error contract is missing."
 },
 {
  "id": "CCARF-5.4-01",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.4",
  "select": 2,
  "stem": "An architect uses one Claude Code session for a whole afternoon to understand an unfamiliar monolith, asking dozens of unrelated questions. By the end, answers cite files that were discussed hours ago for unrelated reasons, and the agent repeats explorations it already did. The architect wants ACCURATE answers for the rest of the investigation. Which two practices address this? (Select TWO.)",
  "options": {
   "A": "Move to a configuration with a larger context window so the afternoon's history fits more comfortably.",
   "B": "Ask the agent to be more careful about which earlier findings are relevant to each new question.",
   "C": "Spawn a fresh subagent per question, giving it only the question and the relevant known facts, so each answer starts from a clean context.",
   "D": "Record confirmed findings in a scratchpad file that later questions and subagents can read, instead of relying on the conversation history."
  },
  "answer": [
   "C",
   "D"
  ],
  "explanation": "Long exploratory sessions degrade because unrelated context accumulates and competes for attention. Isolating each question in a subagent removes the noise, and a scratchpad file externalises the findings so nothing depends on a bloated transcript. Together they preserve accuracy without repeating work.",
  "distractors": {
   "A": "bigger-context",
   "B": "vague-guidance"
  },
  "why_wrong": {
   "A": "Fitting more stale context does not stop it from contaminating answers.",
   "B": "'Be more careful' gives the model no mechanism to ignore what is already in its window."
  },
  "concept": "Subagents per question and scratchpad files",
  "learn": "For codebase exploration, treat each question as its own task and keep durable findings in files. A single long session is fine for a focused, related sequence of steps. The common mistake is expecting one session to stay sharp across dozens of unrelated topics.",
  "apply": "If answers start referencing files from an unrelated earlier question, the session has degraded; delegate and write findings to a file."
 },
 {
  "id": "CCARF-5.5-01",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.5",
  "select": 1,
  "stem": "A document-classification system reports 96% aggregate accuracy, and human reviewers only sample outputs the model marks as low confidence. A customer then discovers that one rare document type, tax exemption certificates, is misclassified almost every time, always with high confidence. The architect wants review to SURFACE such failures. What should the architect do?",
  "options": {
   "A": "Trust the aggregate figure; a 96% system is performing well and the rare type is within the error budget.",
   "B": "Ask the model to rate its own confidence more honestly so the rare type gets flagged.",
   "C": "Tell reviewers to look more carefully at unusual documents.",
   "D": "Measure accuracy per document type and sample high-confidence outputs with stratification by type, so systematic failures in small categories become visible."
  },
  "answer": [
   "D"
  ],
  "explanation": "An aggregate number hides per-category failures, and confidence-based sampling never looks at outputs the model is wrongly sure about. Stratified sampling across types, including high-confidence outputs, is the only way to see a category that is confidently wrong.",
  "distractors": {
   "A": "myth",
   "B": "self-review",
   "C": "vague-guidance"
  },
  "why_wrong": {
   "A": "It is a myth that aggregate accuracy reflects every category; rare types can be near zero inside a high average.",
   "B": "The model calibrating itself is self-review; it cannot know what it does not know.",
   "C": "'Look more carefully' is not a sampling design."
  },
  "concept": "Stratified sampling of high-confidence outputs",
  "learn": "Report accuracy per type and sample review sets stratified by type and confidence, deliberately including high-confidence items. This is right for any classifier with uneven category sizes. The common mistake is reviewing only what the model already doubts.",
  "apply": "If your human-review queue is filled only by a confidence threshold, confidently wrong outputs never reach a human."
 },
 {
  "id": "CCARF-5.5-02",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.5",
  "select": 2,
  "stem": "An architect designs the human-review process for an automated contract-tagging system used across many contract types. Which two elements should the review process include to CALIBRATE confidence and catch hidden failures? (Select TWO.)",
  "options": {
   "A": "A regular sample of high-confidence outputs, not just low-confidence ones, drawn with stratification across contract types.",
   "B": "Reviewing only outputs below a confidence threshold, since high-confidence outputs are by definition reliable.",
   "C": "Per-type accuracy metrics compared against the model's stated confidence to detect where confidence is miscalibrated.",
   "D": "Raising the confidence threshold for automatic acceptance whenever an error is found, until errors stop appearing."
  },
  "answer": [
   "A",
   "C"
  ],
  "explanation": "Calibration means comparing stated confidence to observed accuracy, and that comparison must be done per type and must include the high-confidence region. Sampling that region with stratification is what exposes types where the model is confidently wrong.",
  "distractors": {
   "B": "myth",
   "D": "parameter-patch"
  },
  "why_wrong": {
   "B": "It is a myth that high confidence implies correctness; miscalibrated categories are exactly the ones you miss.",
   "D": "Moving a threshold is a parameter patch that shrinks automation without revealing which types are failing."
  },
  "concept": "Confidence calibration by stratum",
  "learn": "Calibrate by measuring accuracy against confidence per category and sampling all confidence bands. Threshold-only review is acceptable only as a supplement. The common mistake is treating confidence as a substitute for measurement.",
  "apply": "If you have never seen a high-confidence output reviewed by a human, you do not know your calibration."
 },
 {
  "id": "CCARF-5.6-01",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.6",
  "select": 1,
  "stem": "A market-research coordinator gathers findings from three subagents that each read different sources, then writes a synthesis. Stakeholders ask which source supports a specific claim and nobody can answer; the subagents returned prose summaries and the synthesis blended them. The architect wants every claim in the final report to be TRACEABLE to its source. What should the architect do?",
  "options": {
   "A": "Ask the coordinator to review the synthesis and add citations from memory.",
   "B": "Require each subagent to return its findings as claim-to-source mappings (claim, source identifier, location), and have the coordinator preserve those mappings through synthesis.",
   "C": "Give the coordinator a larger context so it can keep all raw sources alongside the summaries.",
   "D": "Instruct the subagents to be diligent about mentioning where things came from."
  },
  "answer": [
   "B"
  ],
  "explanation": "Attribution is lost the moment a finding becomes a summary without a source attached. Making the subagent contract a structured mapping of claims to sources, and requiring the coordinator to carry that structure forward, keeps provenance intact by construction rather than by recollection.",
  "distractors": {
   "A": "self-review",
   "C": "bigger-context",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Adding citations after the fact from the same context that lost them is self-review and invites fabricated references.",
   "C": "Holding raw sources does not link individual claims to them.",
   "D": "'Be diligent' is not a contract; some claims will still arrive unattributed."
  },
  "concept": "Claim-to-source mappings",
  "learn": "Define provenance as part of the subagent output schema and preserve it through every synthesis step. This is right for any multi-source research or reporting agent. Adding citations afterwards works only when the source documents are still available to the step doing it; the common mistake is asking for citations at the final step from a context that has already compressed the sources away.",
  "apply": "If a subagent's output schema has no field for the source of each claim, provenance is already gone before synthesis begins."
 },
 {
  "id": "CCARF-5.3-03",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.3",
  "select": 1,
  "stem": "A document-processing coordinator dispatches one subagent per document type: invoices, contracts, and receipts. On one run, the receipts subagent is asked to extract 50 receipts and successfully parses 32 of them before a malformed record at position 33 causes it to fail. Today, the subagent's failure response discards the 32 successful extractions and reports only 'processing failed', so the coordinator cannot tell how much of the batch actually succeeded. The team wants to AVOID redoing work that already succeeded. What should change?",
  "options": {
   "A": "Whenever a subagent fails partway through a batch, have the coordinator dispatch a brand-new subagent to reprocess the entire batch from the beginning, since a clean context is simpler than reasoning about partial state.",
   "B": "Have the receipts subagent return the 32 successfully extracted records together with a structured error describing which record failed and why, so the coordinator can accept the partial results and retry only the failed portion.",
   "C": "Raise the receipts subagent's max_tokens so it is less likely to run out of output space partway through the batch.",
   "D": "Add an instruction telling the receipts subagent to 'double-check each receipt carefully before finalizing it' so it avoids encountering malformed records."
  },
  "answer": [
   "B"
  ],
  "explanation": "The failure here is a single bad record, not a systemic problem with the other 32 extractions. Returning the successful records alongside a structured description of exactly which record failed and why lets the coordinator keep the completed work and retry only the small failed slice, which is what avoiding repeated work actually requires.",
  "distractors": {
   "A": "violates-constraint",
   "C": "parameter-patch",
   "D": "vague-guidance"
  },
  "why_wrong": {
   "A": "Works but violates the constraint: a full reprocess will eventually succeed, but it throws away 32 already-correct extractions and reruns work that did not need to be redone, which is exactly the outcome the team wants to avoid.",
   "C": "Parameter patch: the failure described is a malformed record, not an output-length limit, so raising max_tokens does not address why record 33 failed or give the coordinator any information about the 32 that succeeded.",
   "D": "Plausible but vague: 'double-check carefully' gives the subagent no measurable procedure and does not change what the coordinator receives when a record is malformed."
  },
  "concept": "Partial results preserved on subagent failure",
  "learn": "Preserve and return partial results alongside a structured error whenever a subagent processes a batch and can fail partway through. It is the wrong call when a task is atomic and a partial result would be meaningless on its own. The common mistake is treating any mid-batch failure as an all-or-nothing outcome and discarding completed work.",
  "apply": "If a failing subagent's response discards everything it already produced, the coordinator will redo completed work; switch to returning the partial results plus a structured error for the part that failed."
 },
 {
  "id": "CCARF-5.4-03",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.4",
  "select": 1,
  "stem": "An architect is planning how a Claude Code session should explore an unfamiliar 200-file monorepo to answer a long list of independent questions about its architecture, such as how authentication is handled, where the queue consumer lives, and what the billing job does. Reusing one long session for every question previously caused the agent to mix up unrelated modules and contradict itself after about a dozen questions. The architect wants a design that stays reliable through the rest of the list. What should the architect do?",
  "options": {
   "A": "Keep one session, but insert a reminder every five questions telling the model to 'stay focused and not mix up different modules.'",
   "B": "Keep one session, and trust that Claude automatically resets its attention for each new question, treating it independently as long as the questions are clearly separated in the prompt.",
   "C": "Spawn a fresh subagent per question, giving it only that question and the minimal relevant context, such as which directory to look in, and have it write its finding to a scratchpad file the coordinator can read.",
   "D": "Keep one session, and at the end ask the same session to double-check its own final list of answers against the codebase before returning it."
  },
  "answer": [
   "C"
  ],
  "explanation": "Isolating each question in its own subagent keeps unrelated modules from polluting each other's context, which is exactly the failure the architect observed. Writing the finding to a scratchpad file also gives the coordinator a durable, exact record instead of relying on a single growing conversation to hold everything accurately.",
  "distractors": {
   "A": "vague-guidance",
   "B": "myth",
   "D": "self-review"
  },
  "why_wrong": {
   "A": "Plausible but vague: 'stay focused' names no mechanism and does not stop context from earlier unrelated questions from being present and competing with the current one.",
   "B": "Myth: a session does not automatically reset or isolate its attention between questions just because they are asked one after another; everything remains in the same accumulating context.",
   "D": "Self-review: asking the same session to check its own final answers reuses the exact context and reasoning that produced the contradictions in the first place, so it is unlikely to catch them."
  },
  "concept": "Subagents per question and scratchpad files",
  "learn": "Use per-question subagents with scratchpad files when a long exploration session covers many independent questions over an unfamiliar codebase. It is the wrong call when the questions genuinely build on each other and need the full shared context. The common mistake is assuming the model quietly isolates unrelated questions on its own within one session.",
  "apply": "If you are relying on one long session to stay sharp across dozens of unrelated questions, expect drift; switch to a subagent per question with scratchpad files for confirmed findings."
 },
 {
  "id": "CCARF-5.6-03",
  "cert": "CCAR-F",
  "domain": 5,
  "task": "5.6",
  "select": 1,
  "stem": "A brand-monitoring coordinator dispatches three subagents, each scanning a different category of public source (news sites, forums, review sites) for mentions of a product safety concern. Each subagent already returns its findings as a list of claims tagged with the exact source URL. The coordinator then merges all three lists into a single alert for the response team. During a recent incident, the merge step dropped the per-claim source tags and produced one unattributed bullet list, so the response team could not verify which claims came from credible outlets before acting. What should the architect fix?",
  "options": {
   "A": "Have the coordinator merge only the three highest-priority claims from each subagent and drop the rest, to keep the alert short.",
   "B": "Change the merge step so it preserves each claim's source tag when combining the three lists, instead of flattening them into an unattributed bullet list.",
   "C": "Add a rule telling the coordinator to 'try to remember where each claim came from' while merging the lists.",
   "D": "Have the coordinator re-read the alert it just produced and attempt to reconstruct a source for each bullet before sending it."
  },
  "answer": [
   "B"
  ],
  "explanation": "The subagents already did the hard part correctly by tagging every claim with a source URL; the defect is entirely in the merge step, which discards that tag. Fixing the merge to carry the existing source tag through to the combined list restores exactly the verification the response team needs, without asking anyone to reconstruct anything after the fact.",
  "distractors": {
   "A": "violates-constraint",
   "C": "vague-guidance",
   "D": "self-review"
  },
  "why_wrong": {
   "A": "Works but violates the constraint: trimming to the top claims produces a shorter alert, but it discards claims and still does not preserve source attribution for the ones that remain, which is the actual defect being fixed.",
   "C": "Plausible but vague: 'try to remember' is not a mechanism; the source tags already exist on each claim and just need to be carried through, not recalled.",
   "D": "Self-review: reconstructing sources after the unattributed alert has already been produced asks the same instance to guess at information it just discarded, instead of fixing the step that discarded it."
  },
  "concept": "Claim-to-source mappings",
  "learn": "Use explicit claim-to-source tagging, carried through every merge step, whenever a synthesis needs to remain traceable back to its sources. It is the wrong call for a purely internal draft where no one will ever need to verify a specific claim. The common mistake is fixing attribution after the fact instead of preserving the tags that already existed before the merge.",
  "apply": "If your merge step combines already-tagged claims into an untagged list, fix the merge to carry the tags through rather than trying to reconstruct them afterward."
 }
];

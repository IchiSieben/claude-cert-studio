// Official blueprints, transcribed from the Anthropic exam guides v1.0 (July 2026).
// Source: Claude Partner Academy exam guide PDFs (CCDV-F, CCAR-F). Weights are official.
// Task statements are abbreviated to one line; the full text lives in
// ../00-examen/02-blueprint-completo.md (CCDV-F) and 04-blueprint-ccar-f.md (CCAR-F).
window.BLUEPRINTS = {
  "CCAR-F": {
    code: "CCAR-F",
    name: "Claude Certified Architect – Foundations",
    items: 60,
    minutes: 120,
    pass: 720,
    fee: "$125 USD",
    audience: "Solution architects designing Claude-powered agentic systems. 6+ months with Claude APIs, Agent SDK, Claude Code and MCP.",
    domains: [
      { id: 1, name: "Agentic Architecture & Orchestration", weight: 27, tasks: [
        { id: "1.1", name: "Agentic loops", text: "Design and implement agentic loops: inspect stop_reason (tool_use vs end_turn), execute tools, feed results back." },
        { id: "1.2", name: "Multi-agent orchestration", text: "Coordinator–subagent (hub-and-spoke) patterns: the coordinator routes, handles errors and picks subagents dynamically." },
        { id: "1.3", name: "Subagent invocation & context passing", text: "Spawning subagents (Task tool must be allowed) and passing complete prior findings in the subagent prompt." },
        { id: "1.4", name: "Workflow enforcement & handoff", text: "Programmatic enforcement (hooks, prerequisite gates) vs prompt-based guidance for multi-step workflows." },
        { id: "1.5", name: "Agent SDK hooks", text: "Hooks (PreToolUse/PostToolUse) that intercept tool calls and normalise heterogeneous data." },
        { id: "1.6", name: "Task decomposition", text: "Fixed sequential pipelines (prompt chaining) vs dynamic adaptive decomposition." },
        { id: "1.7", name: "Session state & resumption", text: "Named session resumption (--resume <name>), forking (fork_session) for independent branches." }
      ]},
      { id: 2, name: "Tool Design & MCP Integration", weight: 18, tasks: [
        { id: "2.1", name: "Tool interface design", text: "Descriptions are the primary mechanism for tool selection; differentiate purpose, inputs, outputs." },
        { id: "2.2", name: "Structured error responses", text: "MCP isError flag and structured error metadata (errorCategory: transient/validation/permission)." },
        { id: "2.3", name: "Tool distribution & tool_choice", text: "Too many tools degrade selection; restrict each subagent's tool set; configure tool_choice." },
        { id: "2.4", name: "MCP server integration", text: "Scoping: project .mcp.json (shared) vs user-level; environment variable expansion." },
        { id: "2.5", name: "Built-in tools", text: "Grep for content, Glob for paths, Read/Write for whole files — pick the right built-in." }
      ]},
      { id: 3, name: "Claude Code Configuration & Workflows", weight: 20, tasks: [
        { id: "3.1", name: "CLAUDE.md hierarchy & modularity", text: "User / project / directory levels; @import to include standards files; diagnose hierarchy issues." },
        { id: "3.2", name: "Slash commands & skills", text: "Project-scoped .claude/commands (versioned) vs user-scoped; context: fork to isolate a skill." },
        { id: "3.3", name: "Path-specific rules", text: ".claude/rules/ files with YAML frontmatter `paths` globs for conditional conventions." },
        { id: "3.4", name: "Plan mode vs direct execution", text: "Plan mode for large-scale/architectural changes; direct execution for simple, well-scoped edits." },
        { id: "3.5", name: "Iterative refinement", text: "2–3 concrete input/output examples communicate transformations best." },
        { id: "3.6", name: "CI/CD integration", text: "claude -p (non-interactive), --output-format json, --json-schema in pipelines." }
      ]},
      { id: 4, name: "Prompt Engineering & Structured Output", weight: 20, tasks: [
        { id: "4.1", name: "System prompts with explicit criteria", text: "Explicit, specific criteria over vague instructions to cut false positives." },
        { id: "4.2", name: "Few-shot prompting", text: "2–4 targeted examples for consistent format and ambiguous cases." },
        { id: "4.3", name: "Structured output via tool use", text: "tool_use with a JSON schema; tool_choice 'any'/'tool' to guarantee schema-compliant output." },
        { id: "4.4", name: "Validation, retry & feedback loops", text: "Retry with the specific validation errors appended (plus the original input)." },
        { id: "4.5", name: "Batch processing", text: "Message Batches API: 50% cheaper, up to 24 h; match API mode to latency needs." },
        { id: "4.6", name: "Multi-instance / multi-pass review", text: "Self-review keeps generation context; use an independent second instance." }
      ]},
      { id: 5, name: "Context Management & Reliability", weight: 15, tasks: [
        { id: "5.1", name: "Context window management", text: "Progressive summarisation loses numbers/dates; keep a persistent 'case facts' block." },
        { id: "5.2", name: "Escalation & ambiguity", text: "Explicit escalation triggers and few-shot examples in the system prompt." },
        { id: "5.3", name: "Error propagation in multi-agent systems", text: "Structured error context (type, attempted query, partial results) enables coordinator recovery." },
        { id: "5.4", name: "Codebase exploration & degradation", text: "Long sessions degrade; spawn subagents per question; scratchpad files." },
        { id: "5.5", name: "Human review & confidence calibration", text: "Aggregate accuracy hides per-type failures; stratified sampling of high-confidence outputs." },
        { id: "5.6", name: "Provenance & multi-source synthesis", text: "Attribution is lost in summarisation; require claim→source mappings from subagents." }
      ]}
    ]
  },
  "CCDV-F": {
    code: "CCDV-F",
    name: "Claude Certified Developer – Foundations",
    items: 53,
    minutes: 120,
    pass: 720,
    fee: "$125 USD",
    audience: "Engineers who build, integrate and ship Claude applications. 1–5 years of software engineering, 6+ months with Claude or comparable LLM systems.",
    domains: [
      { id: 1, name: "Agents and Workflows", weight: 14.7, tasks: [
        { id: "1.1", name: "Agent architecture", text: "Workflow vs agent decision criteria; manager/supervisor hierarchies; role of subagents. (4.5%)" },
        { id: "1.2", name: "Agent construction with Claude", text: "Agent SDK, custom loops/harnesses, self-hosted vs Anthropic-hosted, hooks for deterministic actions. (5.3%)" },
        { id: "1.3", name: "Agent patterns & frameworks", text: "Tool-use loops, subagents, memory, context management; Strands, LangGraph, PydanticAI. (4.9%)" }
      ]},
      { id: 2, name: "Applications and Integration", weight: 33.1, tasks: [
        { id: "2.1", name: "Understanding requirements", text: "Functional and infrastructure requirements from business needs. (3.4%)" },
        { id: "2.2", name: "Systems life cycle", text: "Develop, implement, operate, maintain LLM systems. (2.8%)" },
        { id: "2.3", name: "Claude API mechanics", text: "Messages, tools, streaming, vision, thinking, caching, third-party vendors, Batch API, realtime vs batch. (6.8%)" },
        { id: "2.4", name: "Software engineering foundations", text: "REST, JSON, async, version control, SDLC, code review, refactoring. (7.4%)" },
        { id: "2.5", name: "Claude application design", text: "Interfaces (Code/Desktop/claude.ai/API/SDK), content boundaries, schema design, session hygiene, plugins. (8.6%)" },
        { id: "2.6", name: "Configuration management", text: "CLAUDE.md, settings.json, model pinning, prompt versioning, plugin dependencies. (4.1%)" }
      ]},
      { id: 3, name: "Claude Code", weight: 3.1, tasks: [
        { id: "3.1", name: "Claude Code operation", text: "Rules, Skills, Commands, Agents, Memory; sessions, slash commands, headless, streaming; CLAUDE.md hierarchy; settings.json. (3.1%)" }
      ]},
      { id: 4, name: "Eval, Testing, and Debugging", weight: 2.6, tasks: [
        { id: "4.1", name: "Debugging & error handling", text: "Error types, recovery strategies, trace analysis, integration layer vs model output. (2.6%)" }
      ]},
      { id: 5, name: "Model Selection and Optimization", weight: 16.8, tasks: [
        { id: "5.1", name: "LLM fundamentals", text: "Tokens, context windows, sampling, non-determinism; fast mode, extended/adaptive thinking, effort; zero/one/few-shot. (5.2%)" },
        { id: "5.2", name: "Technical fundamentals", text: "SDKs wrapping REST, websockets, basic engineering practices. (6.1%)" },
        { id: "5.3", name: "Model selection & tradeoffs", text: "Opus vs Sonnet vs Haiku, quality/latency/cost, breaking changes across releases. (2.7%)" },
        { id: "5.4", name: "Cost & token management", text: "Usage tracking, cost modelling, prompt caching, cache check-pointing. (2.8%)" }
      ]},
      { id: 6, name: "Prompt and Context Engineering", weight: 11.0, tasks: [
        { id: "6.1", name: "Context engineering", text: "Context drift/bloat prevention, tool output pruning, compaction, isolation via subagents. (3.8%)" },
        { id: "6.2", name: "Prompt engineering", text: "Instruction clarity, few-shot, system vs user placement, output constraints, iteration, input sanitisation. (4.6%)" },
        { id: "6.3", name: "Output handling", text: "Structured output, response validation, defensive parsing, scepticism toward confident output. (2.6%)" }
      ]},
      { id: 7, name: "Security and Safety", weight: 8.1, tasks: [
        { id: "7.1", name: "AI application security", text: "Prompt injection, jailbreaks, untrusted input, data leakage, PII, authn/authz. (3.2%)" },
        { id: "7.2", name: "Guardrails & safe deployment", text: "Content policy, guardrail layering, secure-by-design, least privilege. (2.3%)" },
        { id: "7.3", name: "Claude hooks", text: "Hooks as guardrails to prevent destructive actions. (1.0%)" },
        { id: "7.4", name: "Identity, secrets & key management", text: "Secrets and keys across environments; identity validation; access monitoring. (1.6%)" }
      ]},
      { id: 8, name: "Tools and MCPs", weight: 10.6, tasks: [
        { id: "8.1", name: "Tool implementation", text: "Function calling, descriptions, error handling, client- vs server-side tools, approval patterns, tool set construction. (4.4%)" },
        { id: "8.2", name: "MCP server development", text: "Authoring, deployment, resources/tools/prompts, stdio vs HTTP, client vs server. (2.1%)" },
        { id: "8.3", name: "Agentic customisation", text: "Built-in tools vs custom tools vs Skills vs MCP — choosing the right mechanism. (4.1%)" }
      ]}
    ]
  }
};

// Distractor taxonomy shared by both banks. Every wrong option in the bank is tagged with one of these.
window.TRAPS = {
  "parameter-patch":   { name: "Parameter patch",           hint: "Lowering temperature, raising max_tokens or swapping the model when the problem is architectural." },
  "violates-constraint": { name: "Works but violates the constraint", hint: "It would function, but it breaks the capitalised constraint (cost, latency, reuse, security, determinism)." },
  "prompt-not-enforcement": { name: "Prompt where enforcement is needed", hint: "Asking the model nicely for something that has financial, security or data consequences. Use hooks, gates, permissions, schemas." },
  "myth":              { name: "Myth",                      hint: "Sounds right, is false: 'bigger model resists injection', 'bigger context fixes drift', 'built-in tools reach any API'." },
  "wrong-scope":       { name: "Right primitive, wrong scope", hint: "The correct mechanism placed at the wrong level (user vs project config, client vs server, coordinator vs subagent)." },
  "bigger-context":    { name: "Just add more context",     hint: "Raising the window or the token budget instead of fixing what is in the context." },
  "over-engineering":  { name: "Over-engineering",          hint: "A classifier, a new service or a framework where a better description or a schema would do." },
  "vague-guidance":    { name: "Plausible but vague",       hint: "'Be conservative', 'be careful', 'use your judgment' — advice without measurable criteria." },
  "self-review":       { name: "Self-review",               hint: "Asking the same instance that generated the output to check it; it keeps its own reasoning context." },
  "text-parsing":      { name: "Parsing text for control flow", hint: "Detecting completion or extracting structure from prose instead of stop_reason / tool_use / schemas." }
};

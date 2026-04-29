# pi-vent

A tiny [Pi](https://pi.dev) extension that gives the agent a `vent` tool.

When the agent hits a **major** issue, it can leave candid feedback in `VENT.md` in your current workspace. The point is not to spam every little annoyance. The tool is meant for things worth remembering: repeated tool failures, misleading docs, confusing instructions, flaky commands, or friction that materially slowed the task down.

Entries are batched and appended near the end of an agent turn, so you get a useful feedback log without constant tool chatter.

## What it writes

If `VENT.md` does not exist, pi-vent creates it. Each entry is appended with a human-readable local timestamp:

```md
## 26-04-29 10:42 — tool_error

Tried the same command three times because the docs pointed at a stale path. Would be better if the extension docs linked to the installed package location or had a package-search command.
```

## Install

Install globally for all Pi projects:

```bash
pi install npm:@howaboua/pi-vent
```

Install only for the current project:

```bash
pi install -l npm:@howaboua/pi-vent
```

Try it for one run without installing:

```bash
pi -e npm:@howaboua/pi-vent
```

Pi packages run with your full system permissions. Only install extensions from sources you trust.

## Tool

pi-vent registers one tool:

```ts
vent({
  thought: string,
  trigger?: string
})
```

- `thought` — candid feedback, frustration, confusion, or a short postmortem note.
- `trigger` — optional short label, for example `tool_error`, `bad_docs`, or `confusing_task`.

The tool description tells the agent to use it only after major issues and to batch feedback at the end of the turn.

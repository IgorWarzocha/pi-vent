import { appendFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Type } from "typebox";
import { Text } from "@mariozechner/pi-tui";
import { withFileMutationQueue, type ExtensionAPI } from "@mariozechner/pi-coding-agent";

const ventSchema = Type.Object(
  {
    thought: Type.String({
      description:
        "Your candid feedback, frustration, confusion, or postmortem note.",
    }),
    trigger: Type.Optional(
      Type.String({ description: "Short label for what triggered this vent, e.g. tool_error, bad_docs, confusing_task." }),
    ),
  },
  { additionalProperties: false },
);

function clean(input: string): string {
  return input.trim().replace(/\r\n/g, "\n");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf8");
    return true;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export default function ventExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "vent",
    label: "vent",
    description:
      "Append your feedback/vents to VENT.md after major issues; batch at end of turn.",
    promptSnippet: "Append your vents to VENT.md",
    promptGuidelines: [
      "Use vent only for major issues, not minor annoyances: repeated tool failures, seriously confusing instructions, broken docs, flaky commands, or avoidable friction that materially slowed you down.",
      "Use vent near the end of your turn and batch multiple thoughts into one call instead of making constant vent calls.",
      "Keep vent entries specific: what happened, why it sucked, and what would make it better next time. Do not use vent as a substitute for completing the user's task.",
    ],
    parameters: ventSchema,
    executionMode: "sequential",

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const thought = clean(params.thought);
      if (!thought) throw new Error("vent.thought must not be empty");

      const trigger = params.trigger ? clean(params.trigger) : undefined;
      const ventPath = resolve(ctx.cwd, "VENT.md");
      const now = new Date();
      const timestamp = [
        String(now.getFullYear()).slice(-2),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-") + " " + [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
      ].join(":");
      const heading = "# VENT\n\nFeedback log. Candid notes about friction, failures, and things that should be improved.\n\n";
      const entry = [
        `## ${timestamp}${trigger ? ` — ${trigger}` : ""}`,
        "",
        thought,
        "",
      ].join("\n");

      return withFileMutationQueue(ventPath, async () => {
        if (!(await fileExists(ventPath))) {
          await writeFile(ventPath, heading, "utf8");
        }
        await appendFile(ventPath, entry, "utf8");

        return {
          content: [{ type: "text" as const, text: `Appended vent entry to VENT.md (${timestamp}).` }],
          details: { path: "VENT.md", timestamp, trigger, thought },
        };
      });
    },

    renderCall(args, theme, context) {
      const trigger = typeof args?.trigger === "string" && args.trigger.trim() ? ` ${args.trigger.trim()}` : "";
      return new Text(`${theme.fg("toolTitle", theme.bold("vent"))}${theme.fg("muted", trigger)}`, 0, 0);
    },

    renderResult(result, _options, theme) {
      const timestamp = typeof result.details?.timestamp === "string" ? result.details.timestamp : "saved";
      return new Text(`${theme.fg("success", "✓")} wrote ${theme.fg("accent", "VENT.md")} ${theme.fg("dim", timestamp)}`, 0, 0);
    },
  });
}

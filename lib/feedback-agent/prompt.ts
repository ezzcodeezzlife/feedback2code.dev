export function buildOpencodeFeedbackPrompt(input: {
  owner: string;
  repo: string;
  fullName: string;
  feedbackBody: string;
  branchName: string;
  customInstructions?: string | null;
  pagePath?: string | null;
}): string {
  const trimmed = input.customInstructions?.trim() ?? "";
  const customInstructionsBlock =
    trimmed.length > 0
      ? `## Repository-specific instructions (optional, provided by the repo owner)
"""
${trimmed}
"""`
      : "";

  const pagePathLine =
    input.pagePath && input.pagePath.length > 0
      ? `The visitor submitted this feedback from page path: \`${input.pagePath}\`.\n\n`
      : "";

  return `You are an autonomous coding agent running inside a cloud sandbox. The repository ${input.fullName} is already cloned in the current working directory.

${pagePathLine}## User feedback (from an embedded site widget)
"""
${input.feedbackBody}
"""

${customInstructionsBlock}

## Your task
1. Understand the feedback and explore the codebase as needed.
2. Implement changes that address the feedback: code fixes, docs, tests, or configuration as appropriate. Follow existing project conventions.
3. Do not use web search or fetch arbitrary URLs: outbound network from this sandbox is restricted to GitHub, the model API, npm, and package mirrors only. Rely on the repository and your training knowledge.
4. Commit your work with clear messages. You are on branch \`${input.branchName}\` - commit locally; the host will push and open a PR.

## Constraints
- Do not recreate large unrelated refactors unless the feedback requires it.
- Prefer small, reviewable commits.
- If the feedback cannot be addressed in this repo, explain why in a short note and still leave the repo in a clean state.

When you are done, print a one-line summary of what you changed to stdout.`;
}

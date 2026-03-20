export function buildOpencodeFeedbackPrompt(input: {
  owner: string;
  repo: string;
  fullName: string;
  feedbackBody: string;
  branchName: string;
}): string {
  return `You are an autonomous coding agent running inside a cloud sandbox. The repository ${input.fullName} is already cloned in the current working directory.

## User feedback (from an embedded site widget)
"""
${input.feedbackBody}
"""

## Your task
1. Understand the feedback and explore the codebase as needed.
2. Implement changes that address the feedback: code fixes, docs, tests, or configuration as appropriate. Follow existing project conventions.
3. Use web search when you need current facts, API docs, or best practices.
4. Commit your work with clear messages. You are on branch \`${input.branchName}\` - commit locally; the host will push and open a PR.

## Constraints
- Do not recreate large unrelated refactors unless the feedback requires it.
- Prefer small, reviewable commits.
- If the feedback cannot be addressed in this repo, explain why in a short note and still leave the repo in a clean state.

When you are done, print a one-line summary of what you changed to stdout.`;
}

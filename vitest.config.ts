import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .claude/skills/ is a symlink farm Claude Code uses to discover skills.
    // The canonical test files live at skills/<name>/. Excluding the symlinked
    // copies prevents vitest from running the same suite twice.
    exclude: ["**/node_modules/**", "**/dist/**", ".claude/**"],
  },
});

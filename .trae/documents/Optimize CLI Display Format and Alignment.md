I will optimize the CLI display format by modifying the `scripts/core/translator.js` file.

The plan includes:
1.  **Dynamic Width Adaptation**: Modify `generateCoverageSummary` to calculate the maximum line width based on the terminal width (`process.stdout.columns`), ensuring the content utilizes available space effectively on different devices while maintaining readability (setting a reasonable range, e.g., 40-90 characters).
2.  **Fix Text Alignment & Wrapping**: Update `streamAISummaryWrapped` to implement "hanging indent" logic.
    -   Track if the current line is a list item (starts with `▸`).
    -   When a line wraps due to length, apply extra indentation (6 spaces instead of 4) to the next line so that the text aligns vertically with the content of the bullet point, rather than the bullet itself.
    -   This resolves the issue where "不涉及UI文本" is misaligned in the screenshot.

These changes directly address the user's requirements for format optimization, adaptive layout, and clear presentation.
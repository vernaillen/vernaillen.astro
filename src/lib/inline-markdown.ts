// A handful of YAML content fields (index.yml's `about.description`, FAQ
// answers) mix literal `<br>` HTML with the occasional `[label](url)`
// markdown link. These aren't full content-collection bodies, so they don't
// go through the remark/Shiki pipeline — just convert the one construct used.
export function renderInlineMarkdown(text: string): string {
  return text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline underline-offset-4 hover:text-vernaillen-500" target="_blank" rel="noopener noreferrer">$1</a>',
  )
}

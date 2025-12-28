export function parse(src) {
  let h = ""
  src
    .replace(/^\s+|\r|\s+$/g, "")
    .replace(/\t/g, "    ")
    .split(/\n\n+/)
    .forEach(function (b, f, R) {
      f = b[0]
      R = {
        "*": [/\n\* /, "<ul><li>", "</li></ul>"],
        1: [/\n[1-9]\d*\.? /, "<ol><li>", "</li></ol>"],
        " ": [/\n {4}/, "<pre><code>", "</code></pre>", "\n"],
        ">": [/\n> /, "<blockquote>", "</blockquote>", "\n"],
      }[f]
      h += R
        ? R[1] +
          ("\n" + b)
            .split(R[0])
            .slice(1)
            .map(R[3] ? escape : inlineEscape)
            .join(R[3] || "</li>\n<li>") +
          R[2]
        : f === "#"
        ? "<h" + (f = b.indexOf(" ")) + ">" + inlineEscape(b.slice(f + 1)) + "</h" + f + ">"
        : f === "<"
        ? b
        : "<p>" + inlineEscape(b) + "</p>"
    })
  return h
}

function escape(t) {
  return new Option(t).innerHTML
}

function inlineEscape(s) {
  return escape(s)
    .replace(/\\_/g, "⋿")
    .replace(/!\[([^\]]*)]\(([^(]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)]\(([^(]+?)\)/g, "$1".link("$2"))
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g, "<strong>$2</strong>")
    .replace(/(\*| _)(?=\S)([^\r]*?\S)\1/g, "<em>$2</em>")
    .replace(/⋿/g, "_")

}

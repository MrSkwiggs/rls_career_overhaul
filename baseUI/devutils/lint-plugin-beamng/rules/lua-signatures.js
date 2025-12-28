module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce return types for Lua function signatures with arguments.",
      recommended: false,
    },
    fixable: null,
    schema: [],
    messages: {
      missingReturnType: "Arrow function with parameters must return types for each parameter for Lua function signatures.",
    },
  },

  create(context) {
    return {
      Property(node) {
        if (node.value.type !== "ArrowFunctionExpression" || node.value.params.length === 0) {
          return
        }

        const body = node.value.body
        // This checks for an empty function body like `=> {}` which implicitly returns undefined.
        if (body.type === "BlockStatement" && body.body.length === 0) {
          context.report({
            node: node.value,
            messageId: "missingReturnType",
          })
        }
      },
    }
  },
}

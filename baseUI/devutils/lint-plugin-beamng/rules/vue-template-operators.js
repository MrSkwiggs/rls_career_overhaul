module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Allow comparison operators in Vue template expressions",
      category: "Possible Errors",
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create(context) {
    function hasComparisonOperator(expr) {
      if (expr?.type === "BinaryExpression") {
        if (expr.operator === "<" || expr.operator === ">") {
          return true;
        }
      } else if (expr?.type === "LogicalExpression") {
        return hasComparisonOperator(expr.left) || hasComparisonOperator(expr.right);
      }
      return false;
    }

    const templateVisitor = context.parserServices.defineTemplateBodyVisitor(
      {
        "VAttribute"(node) {
          if (node.directive && hasComparisonOperator(node.value?.expression)) {
            return;
          }
        }
      },
      {}
    );

    return templateVisitor;
  }
};

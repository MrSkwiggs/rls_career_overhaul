const plugin = {
  meta: {
    name: "beamng",
  },
  rules: {
    "vue-template-operators": require("./rules/vue-template-operators"),
    "lua-signatures": require("./rules/lua-signatures"),
  },
};

module.exports = plugin;

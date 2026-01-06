module.exports = {
  name: "olang-reference-resolver",

  resolve(input) {
    return {
      ok: true,
      output: input
    };
  }
};

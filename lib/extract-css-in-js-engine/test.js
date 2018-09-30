
module.exports = function(fn, args) {
  return {
    classname: fn`${args}`,
    result: args,
  };
}


module.exports = function(fn, args) {
  return {
    classname: fn`${args}`,
    func: fn,
    args,
    __proto__: {
      toString: function() {
        return this.classname;
      }
    }
  };
}

module.exports = function (api) {
  api.cache(true)

  const presets = [ "es2015-node5" ]
  const plugins = [ 'istanbul' ]

  return {
    presets,
    plugins
  }
}

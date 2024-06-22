const ngx = require("./lib.js")

var app = ngx.angularModule('app', [], ['_', function (_) {
  _.provider('compiler', function () {
    return {
      $get: function () {
        return "hello"
      }
    }
  })

}])
  .value('a', 'b')
  .constant('SOME', 'value')

var injector = ngx.bootstrap(document.getElementById('app'), ['app'])

injector.invoke(['compiler', function (compiler) {
  console.log(compiler)
}])

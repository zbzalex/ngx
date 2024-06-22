/**
 * AngularX
 */

function ensure(obj, name, factory) {
    return obj[name] || (obj[name] = factory())
}

function setupModuleLoader() {
    var modules = {}

    return function (name, requires, configFn) {
        return ensure(modules, name, function () {

            var invokeQueue = []
            var config = invokeLater('$injector', 'invoke')

            var moduleInstance = {
                _invokeQueue: invokeQueue,
                name: name,
                requires: requires || [],
                provider: invokeLater('_', 'provider'),
                value: invokeLater('_', 'value'),
                factory: invokeLater('_', 'factory'),
                constant: invokeLater('_', 'constant'),
                service: invokeLater('_', 'service'),
                config
            }

            if (configFn) {
                config(configFn)
            }

            return moduleInstance

            function invokeLater(provider, method) {
                return function () {
                    invokeQueue.push([provider, method, arguments])

                    return moduleInstance;
                }
            }
        })
    }
}

var angularModule = setupModuleLoader()

angularModule('ngx', [], ['_', function (_) {
    // 
}])

function bootstrap(rootElement, modules) {
    modules = modules || []
    modules.unshift('ngx')

    var injector = createInjector(modules)

    // 

    return injector
}

function createInjector(modulesToLoad) {
    var loadedModules = {}
    var providerPostfix = 'Provider'
    var providerCache = {
        _: {
            provider,
            factory,
            value,
            constant,
            service,
        }
    }
    var instanceCache = {}
    var providerInjector = createInternalInjector(providerCache, function (serviceName) {
        throw new Error("Unknown provider for " + serviceName)
    })

    var instanceInjector = (instanceCache.$injector = createInternalInjector(instanceCache, function (serviceName) {
        var provider = providerInjector.get(serviceName + providerPostfix)

        return instanceInjector.invoke(provider.$get, provider)
    }))

    loadModules(modulesToLoad)

    return instanceInjector

    function provider(name, provider_) {
        if (typeof provider_ === 'function') {
            provider_ = providerInjector.instantiate(provider_)
        }

        if (!provider_.$get) {
            throw new Error('Expected provider factory');
        }

        return providerCache[name + providerPostfix] = provider_;
    }

    function factory(name, factoryFn) {
        return provider(name, {
            $get: factoryFn,
        })
    }

    function value(key, value) {
        return factory(key, function () { return value; })
    }

    function constant(name, value) {
        providerCache[name] = value
        instanceCache[name] = value
    }

    function service(name, constructor) {
        return factory(name, ['$injector', function (injector) {
            return injector.instantiate(constructor)
        }])
    }

    function createInternalInjector(cache, factory) {
        function annotate(fn) {
            return fn instanceof Array
                ? fn.slice(0, fn.length - 1)
                : fn.$inject
                    ? fn.$inject
                    : []
        }

        function getService(serviceName) {
            if (cache.hasOwnProperty(serviceName)) {
                return cache[serviceName]
            } else {
                return cache[serviceName] = factory(serviceName)
            }
        }

        function invoke(fn, self, locals) {
            var args = []
            var $inject = annotate(fn)
            var key
            for (var i = 0; i < $inject.length; i++) {
                key = $inject[i]

                args.push(
                    locals && locals.hasOwnProperty(key)
                        ? locals[key]
                        : getService(key)
                )
            }

            return (fn instanceof Array ? fn[fn.length - 1] : fn).apply(self, args)
        }

        function instantiate(Type, locals) {
            var Constructor = function () { }

            Constructor.prototype = Type.prototype
            var instance = new Constructor()

            return invoke(Type, instance, locals)
        }

        return {
            invoke,
            instantiate,
            get: getService,
            annotate,
        }
    }

    function loadModules(modulesToLoad) {
        var invokeQueue = []
        var module

        for (module of modulesToLoad) {

            if (loadedModules[module]) continue;

            loadedModules[module] = 1

            var moduleInstance = angularModule(module)

            loadModules(moduleInstance.requires)

            var invokeArgs = []
            var provider
            var i
            var ii

            for (
                invokeQueue = moduleInstance._invokeQueue, i = 0, ii = invokeQueue.length;
                i < ii;
                i++
            ) {
                invokeArgs = invokeQueue[i]
                provider = invokeArgs[0] === '$injector' ? providerInjector : providerInjector.get(invokeArgs[0])
                provider[invokeArgs[1]].apply(provider, invokeArgs[2])
            }
        }

    }
}

module.exports = {
    angularModule,
    bootstrap,
}
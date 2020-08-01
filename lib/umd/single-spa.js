(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

  // 描述应用的整个状态

  //  应用的初始状态
  const NOT_LOADED = 'NOT_LOADED';
  // 加载资源
  const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';
  // 还没有调用bootstrap方法
  const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED';
  // 启动中
  const BOOTSTRAPPING = 'BOOTSTRAPPING';
  //没有调用mount方法
  const NOT_MOUNTED = 'NOT_MOUNTED';
  // 正在挂载中
  const MOUNTING = 'MOUNTING';
  // 挂载完毕
  const MOUNTED = 'MOUNTED';
  // 卸载中，解除挂载
  const UNMOUNTING = 'UNMOUNTING';

  // 当前这个应用是否要被激活
  function shouldBeActive (app) {
    return app.activeWhen(window.location) // 如果返回true， 那么应用就需要开始初始化等一系列操作。
  }

  let started = false;

  function start () {
    // 需要挂载应用
    started = true;
    reroute(); // 除了去加载应用 还需要去挂载应用
  }

  async function toLoadPromise (app) {
    if (app.loadPromise) {
      return app.loadPromise // 缓存机制
    }

    return (app.loadPromise = Promise.resolve().then(async () => {
      app.status = LOADING_SOURCE_CODE;

      const { bootstrap, mount, unmount } = await app.loadApp(app.customProps); // 这个方法是用户定义的，返回bootstrap,mount,unmount
      app.status = NOT_BOOTSTRAPPED;
      // 希望将多个promise组合在一起  compose
      app.bootstrap = flattenFnArray(bootstrap);
      app.mount = flattenFnArray(mount);
      app.unmount = flattenFnArray(unmount);
      delete app.loadPromise;
      return app
    }))
  }

  function flattenFnArray (fns) {
    fns = Array.isArray(fns) ? fns : [fns];
    // 通过promise链来链式调用
    return props =>
      fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve())
  }

  async function toUnmountPromise (app) {
    // 当前应用没有被挂载，直接什么都不做了
    if (app.status != MOUNTED) {
      return app
    }

    app.status = UNMOUNTING;
    await app.unmount(app.customProps);
    app.status = NOT_MOUNTED;
    return app
  }

  async function toBootstrapPromise (app) {
    if (app.status !== NOT_BOOTSTRAPPED) {
      return app
    }
    app.status = BOOTSTRAPPING;
    await app.bootstrap(app.customProps);
    app.status = NOT_MOUNTED;
    return app
  }

  async function toMountPromise (app) {
    if (app.status !== NOT_MOUNTED) {
      return app
    }
    app.status = MOUNTING;
    await app.mount(app.customProps);
    app.status = MOUNTED;
    return app
  }

  // hashchange  popstate
  const routingEventsListeningTo = ['hashchange', 'popstate'];

  function urlReroute () {
    reroute();
  }

  const capturedEventListeners = {
    hashchange: [],
    popstate: [] // TODO:在切换完成后，应该执行一下暂存的
  };

  window.addEventListener('hashchange', urlReroute);

  window.addEventListener('popstate', urlReroute);

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = function (eventName, fn) {
    if (
      routingEventsListeningTo.indexOf(eventName) >= 0 &&
      capturedEventListeners[eventName].some(listener => listener == fn)
    ) {
      capturedEventListeners[eventName].push(fn);
      return
    }
    return originalAddEventListener.apply(this, arguments)
  };

  window.removeEventListener = function (eventName, fn) {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
      capturedEventListeners[eventName] = capturedEventListeners[
        eventName
      ].filter(l => l !== fn);
      return
    }
    return originalRemoveEventListener.apply(this, arguments)
  };

  // 用户可能还会绑定自己的路由事件 vue

  // 当我们应用切换后，还需要处理原来的方法，比如vue，需要在应用切换后执行。

  // 如果是hash路由， hash变化的时候可以切换
  // 浏览器路由，浏览器路由是h5 api的， 如果切换时候不会触发popstate

  window.history.pushState = patchedUpdateState(
    window.history.pushState);

  window.history.replaceState = patchedUpdateState(
    window.history.replaceState);

  function patchedUpdateState (updateState, methodName) {
    return function () {
      const urlBefore = window.location.href;
      updateState.apply(this, arguments);
      const urlAfter = window.location.href;

      if(urlAfter !== urlBefore){
        // 重新加载应用
        urlReroute(new PopStateEvent('popstate'));
      }
    }
  }

  function reroute () {
    // 需要获取要被加载的应用
    // 需要获取要被挂载的应用
    // 哪些应用需要被卸载
    const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();
    if (started) {
      // app装载
      return performAppChanges() // 根据路径来装载应用
    } else {
      // 注册应用时候，需要预先加载
      return loadApps() // 预先加载应用
    }

    async function loadApps () {
      // 预加载应用
      let apps = await Promise.all(appsToLoad.map(toLoadPromise)); // 就是获取到bootstrap,mount,unmount方法，预先放到app上
    }
    
    async function performAppChanges () {
      // 先卸载不需要的应用,不用await，可以并发的去卸载应用
      // let unmountApps = await Promise.all(appsToUnmount.map(toUnmountPromise))
      let unmountApps = appsToUnmount.map(toUnmountPromise);
    
      // 再去加载需要的应用
      // TODO: 加载app1的时候，突然切换路径app2，这个时候不应该继续加载app1了。
      appsToLoad.map(async app => {
        // 将需要加载的应用拿到 =》加载=》启动=》 挂载
        app = await toLoadPromise(app);
        app = await toBootstrapPromise(app);
        return toMountPromise(app)
      });
    
      appsToMount.map(async app => {
        app = await toBootstrapPromise(app);
        return toMountPromise(app)
      });
    }
  }

  /**
   *
   * @param {*} appName 应用名字
   * @param {*} loadApp 加载的应用
   * @param {*} activeWhen 当激活时候会调用loadApp
   * @param {*} customProps 自定义属性
   */
  const apps = [];
  // 维护状态
  function registerApplication (
    appName,
    loadApp,
    activeWhen,
    customProps
  ) {
    apps.push({
      name: appName,
      loadApp,
      activeWhen,
      customProps,
      status: NOT_LOADED
    });

    reroute(); // 加载应用
  }

  function getAppChanges () {
    const appsToUnmount = []; // 要卸载的app
    const appsToLoad = []; // 要加载的app
    const appsToMount = []; // 需要挂载的app
    apps.forEach(app => {
      const appShouldBeActive = shouldBeActive(app);
      switch (app.status) {
        case NOT_LOADED:
        case LOADING_SOURCE_CODE:
          if (appShouldBeActive) {
            appsToLoad.push(app);
          }
          break
        case NOT_BOOTSTRAPPED:
        case BOOTSTRAPPING:
        case NOT_MOUNTED:
          if (appShouldBeActive) {
            appsToMount.push(app);
          }
          break
        case MOUNTED:
          if (!appShouldBeActive) {
            appsToUnmount.push(app);
          }
          break
      }
    });
    return {
      appsToLoad,
      appsToMount,
      appsToUnmount
    }
  }

  exports.registerApplication = registerApplication;
  exports.start = start;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=single-spa.js.map

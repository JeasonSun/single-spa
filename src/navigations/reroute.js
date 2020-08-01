import { started } from '../start'
import { getAppChanges } from '../applications/app'
import { toLoadPromise } from '../lifecycles/load'
import { toUnmountPromise } from '../lifecycles/unmount'
import { toBootstrapPromise } from '../lifecycles/bootstrap'
import { toMountPromise } from '../lifecycles/mount'

export function reroute () {
  // 需要获取要被加载的应用
  // 需要获取要被挂载的应用
  // 哪些应用需要被卸载
  const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges()
  if (started) {
    // app装载
    return performAppChanges() // 根据路径来装载应用
  } else {
    // 注册应用时候，需要预先加载
    return loadApps() // 预先加载应用
  }

  async function loadApps () {
    // 预加载应用
    let apps = await Promise.all(appsToLoad.map(toLoadPromise)) // 就是获取到bootstrap,mount,unmount方法，预先放到app上
  }
  
  async function performAppChanges () {
    // 先卸载不需要的应用,不用await，可以并发的去卸载应用
    // let unmountApps = await Promise.all(appsToUnmount.map(toUnmountPromise))
    let unmountApps = appsToUnmount.map(toUnmountPromise)
  
    // 再去加载需要的应用
    // TODO: 加载app1的时候，突然切换路径app2，这个时候不应该继续加载app1了。
    appsToLoad.map(async app => {
      // 将需要加载的应用拿到 =》加载=》启动=》 挂载
      app = await toLoadPromise(app)
      app = await toBootstrapPromise(app)
      return toMountPromise(app)
    })
  
    appsToMount.map(async app => {
      app = await toBootstrapPromise(app)
      return toMountPromise(app)
    })
  }
}

// 这个流程是用于初始化操作的， 我们还需要 ，当路径切换的时候重新加载应用

// 重写路由相关的方法
import './navigator-events'

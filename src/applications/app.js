import {
  NOT_LOADED,
  SKIP_BECAUSE_BROKEN,
  shouldBeActive,
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
  BOOTSTRAPPING,
  NOT_MOUNTED,
  MOUNTED
} from './app.helpers'
import { reroute } from '../navigations/reroute'

/**
 *
 * @param {*} appName 应用名字
 * @param {*} loadApp 加载的应用
 * @param {*} activeWhen 当激活时候会调用loadApp
 * @param {*} customProps 自定义属性
 */
const apps = []
// 维护状态
export function registerApplication (
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
  })

  reroute() // 加载应用
}

export function getAppChanges () {
  const appsToUnmount = [] // 要卸载的app
  const appsToLoad = [] // 要加载的app
  const appsToMount = [] // 需要挂载的app
  apps.forEach(app => {
    const appShouldBeActive = shouldBeActive(app)
    switch (app.status) {
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if (appShouldBeActive) {
          appsToLoad.push(app)
        }
        break
      case NOT_BOOTSTRAPPED:
      case BOOTSTRAPPING:
      case NOT_MOUNTED:
        if (appShouldBeActive) {
          appsToMount.push(app)
        }
        break
      case MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app)
        }
        break
    }
  })
  return {
    appsToLoad,
    appsToMount,
    appsToUnmount
  }
}

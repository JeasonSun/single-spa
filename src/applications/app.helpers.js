// 描述应用的整个状态

//  应用的初始状态
export const NOT_LOADED = 'NOT_LOADED'
// 加载资源
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'
// 还没有调用bootstrap方法
export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'
// 启动中
export const BOOTSTRAPPING = 'BOOTSTRAPPING'
//没有调用mount方法
export const NOT_MOUNTED = 'NOT_MOUNTED'
// 正在挂载中
export const MOUNTING = 'MOUNTING'
// 挂载完毕
export const MOUNTED = 'MOUNTED'
//  更新中
export const UPDATING = 'UPDATING'
// 卸载中，解除挂载
export const UNMOUNTING = 'UNMOUNTING'
// 完全卸载中
export const UNLOADING = 'UNLOADING'
// 资源加载错误状态
export const LOAD_ERR = 'LOAD_ERR'
// 代码运行错误
export const SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN'

// 当前应用是否被激活
export function isActive (app) {
  return app.status === MOUNTED
}

// 当前这个应用是否要被激活
export function shouldBeActive (app) {
  return app.activeWhen(window.location) // 如果返回true， 那么应用就需要开始初始化等一系列操作。
}

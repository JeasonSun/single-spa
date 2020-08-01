import {
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED
} from '../applications/app.helpers'

export async function toLoadPromise (app) {
  if (app.loadPromise) {
    return app.loadPromise // 缓存机制
  }

  return (app.loadPromise = Promise.resolve().then(async () => {
    app.status = LOADING_SOURCE_CODE

    const { bootstrap, mount, unmount } = await app.loadApp(app.customProps) // 这个方法是用户定义的，返回bootstrap,mount,unmount
    app.status = NOT_BOOTSTRAPPED
    // 希望将多个promise组合在一起  compose
    app.bootstrap = flattenFnArray(bootstrap)
    app.mount = flattenFnArray(mount)
    app.unmount = flattenFnArray(unmount)
    delete app.loadPromise
    return app
  }))
}

function flattenFnArray (fns) {
  fns = Array.isArray(fns) ? fns : [fns]
  // 通过promise链来链式调用
  return props =>
    fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve())
}

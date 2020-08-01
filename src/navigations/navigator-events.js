import { reroute } from './reroute'

// hashchange  popstate
export const routingEventsListeningTo = ['hashchange', 'popstate']

function urlReroute () {
  reroute([], arguments)
}

const capturedEventListeners = {
  hashchange: [],
  popstate: [] // TODO:在切换完成后，应该执行一下暂存的
}

window.addEventListener('hashchange', urlReroute)

window.addEventListener('popstate', urlReroute)

const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener

window.addEventListener = function (eventName, fn) {
  if (
    routingEventsListeningTo.indexOf(eventName) >= 0 &&
    capturedEventListeners[eventName].some(listener => listener == fn)
  ) {
    capturedEventListeners[eventName].push(fn)
    return
  }
  return originalAddEventListener.apply(this, arguments)
}

window.removeEventListener = function (eventName, fn) {
  if (routingEventsListeningTo.indexOf(eventName) >= 0) {
    capturedEventListeners[eventName] = capturedEventListeners[
      eventName
    ].filter(l => l !== fn)
    return
  }
  return originalRemoveEventListener.apply(this, arguments)
}

// 用户可能还会绑定自己的路由事件 vue

// 当我们应用切换后，还需要处理原来的方法，比如vue，需要在应用切换后执行。

// 如果是hash路由， hash变化的时候可以切换
// 浏览器路由，浏览器路由是h5 api的， 如果切换时候不会触发popstate

window.history.pushState = patchedUpdateState(
  window.history.pushState,
  'pushState'
)

window.history.replaceState = patchedUpdateState(
  window.history.replaceState,
  'replaceState'
)

function patchedUpdateState (updateState, methodName) {
  return function () {
    const urlBefore = window.location.href
    updateState.apply(this, arguments)
    const urlAfter = window.location.href

    if(urlAfter !== urlBefore){
      // 重新加载应用
      urlReroute(new PopStateEvent('popstate'))
    }
  }
}

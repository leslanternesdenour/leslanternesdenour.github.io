import { onRequest as __api_don_config_js_onRequest } from "/home/user/leslanternesdenour.github.io/functions/api/don/config.js"
import { onRequest as __api_don_session_js_onRequest } from "/home/user/leslanternesdenour.github.io/functions/api/don/session.js"
import { onRequestGet as __api_sante_js_onRequestGet } from "/home/user/leslanternesdenour.github.io/functions/api/sante.js"
import { onRequest as __api___route___js_onRequest } from "/home/user/leslanternesdenour.github.io/functions/api/[[route]].js"
import { onRequest as ___middleware_js_onRequest } from "/home/user/leslanternesdenour.github.io/functions/_middleware.js"

export const routes = [
    {
      routePath: "/api/don/config",
      mountPath: "/api/don",
      method: "",
      middlewares: [],
      modules: [__api_don_config_js_onRequest],
    },
  {
      routePath: "/api/don/session",
      mountPath: "/api/don",
      method: "",
      middlewares: [],
      modules: [__api_don_session_js_onRequest],
    },
  {
      routePath: "/api/sante",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_sante_js_onRequestGet],
    },
  {
      routePath: "/api/:route*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___route___js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]
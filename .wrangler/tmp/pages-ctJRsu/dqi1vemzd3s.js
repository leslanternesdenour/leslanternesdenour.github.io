// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/api/*",
    "/monde",
    "/monde/",
    "/monde/index.html",
    "/voyage",
    "/voyage/",
    "/voyage/index.html",
    "/ablutions",
    "/ablutions/",
    "/ablutions/index.html",
    "/ablutions/jeu3d",
    "/ablutions/jeu3d/",
    "/ablutions/jeu3d/index.html",
    "/priere",
    "/priere/",
    "/priere/index.html",
    "/priere/jeu3d",
    "/priere/jeu3d/",
    "/priere/jeu3d/index.html",
    "/calendrier",
    "/calendrier/",
    "/calendrier/index.html",
    "/aventures",
    "/aventures/",
    "/aventures/index.html",
    "/aventures/chasse-aux-mots",
    "/aventures/chasse-aux-mots/",
    "/aventures/chasse-aux-mots/index.html",
    "/aventures/mysteres-desert",
    "/aventures/mysteres-desert/",
    "/aventures/mysteres-desert/index.html",
    "/aventures/quiz-nour",
    "/aventures/quiz-nour/",
    "/aventures/quiz-nour/index.html",
    "/ecole-arabe",
    "/ecole-arabe/",
    "/ecole-arabe/index.html",
    "/ecole-arabe/lettres",
    "/ecole-arabe/lettres/",
    "/ecole-arabe/lettres/index.html",
    "/ecole-arabe/lecture",
    "/ecole-arabe/lecture/",
    "/ecole-arabe/lecture/index.html",
    "/ecole-arabe/chiffres",
    "/ecole-arabe/chiffres/",
    "/ecole-arabe/chiffres/index.html"
  ],
  exclude: []
};

// ../../../tmp/claude-0/w/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/user/leslanternesdenour.github.io/.wrangler/tmp/pages-ctJRsu/functionsWorker-0.5370486277202324.mjs";
import { isRoutingRuleMatch } from "/tmp/claude-0/w/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/user/leslanternesdenour.github.io/.wrangler/tmp/pages-ctJRsu/functionsWorker-0.5370486277202324.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=dqi1vemzd3s.js.map

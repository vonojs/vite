import worker, * as OTHER_EXPORTS from "/Users/benten/dev/vonojs/core/playground/dist/_worker.js";
import * as __MIDDLEWARE_0__ from "/Users/benten/Library/pnpm/global/5/.pnpm/wrangler@3.53.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts";
import * as __MIDDLEWARE_1__ from "/Users/benten/Library/pnpm/global/5/.pnpm/wrangler@3.53.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts";

worker.middleware = [
	__MIDDLEWARE_0__.default,
	__MIDDLEWARE_1__.default,
	...(worker.middleware ?? []),
].filter(Boolean);

export * from "/Users/benten/dev/vonojs/core/playground/dist/_worker.js";
export default worker;

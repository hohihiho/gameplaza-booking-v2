var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker/utils/cors.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};

// src/worker/index.ts
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
      if (url.pathname === "/api/health") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const result = await db.prepare("SELECT 1 as test").first();
          return Response.json({
            status: "healthy",
            environment: env.ENVIRONMENT || "development",
            database: result ? "connected" : "disconnected",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }, { headers: corsHeaders });
        } catch (error) {
          return Response.json(
            {
              status: "error",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/v2/reservations" && request.method === "GET") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const reservations = await db.prepare(`
              SELECT 
                r.id, r.user_id, r.device_id, r.start_time, r.end_time, 
                r.status, r.created_at, r.updated_at,
                d.name as device_name,
                dt.name as device_type_name
              FROM reservations r 
              LEFT JOIN devices d ON r.device_id = d.id
              LEFT JOIN device_types dt ON d.device_type_id = dt.id
              ORDER BY r.created_at DESC
              LIMIT 10
            `).all();
          return Response.json({
            data: reservations.results,
            success: true,
            total: reservations.results.length
          }, { headers: corsHeaders });
        } catch (error) {
          console.error("Get reservations error:", error);
          return Response.json(
            { error: "Failed to fetch reservations", success: false },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/v2/devices" && request.method === "GET") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const devices = await db.prepare(`
              SELECT 
                d.id, d.name, d.status, d.location,
                dt.name as device_type_name, dt.hourly_rate
              FROM devices d 
              LEFT JOIN device_types dt ON d.device_type_id = dt.id
              ORDER BY d.name
            `).all();
          return Response.json({
            data: devices.results,
            success: true,
            total: devices.results.length
          }, { headers: corsHeaders });
        } catch (error) {
          console.error("Get devices error:", error);
          return Response.json(
            { error: "Failed to fetch devices", success: false },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/public/device-count" && request.method === "GET") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const result = await db.prepare(`
              SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available
              FROM devices
            `).first();
          const total = result?.total || 0;
          const available = result?.available || 0;
          const availablePercentage = total > 0 ? Math.round(available / total * 100) : 0;
          return Response.json({
            total,
            available,
            availablePercentage
          }, { headers: corsHeaders });
        } catch (error) {
          console.error("Device count error:", error);
          return Response.json(
            {
              error: "\uAE30\uAE30 \uC0C1\uD0DC \uC870\uD68C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
              total: 0,
              available: 0,
              availablePercentage: 0
            },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/public/schedule/today" && request.method === "GET") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const kstNow = new Date((/* @__PURE__ */ new Date()).getTime() + 9 * 60 * 60 * 1e3);
          const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          let scheduleEvents = [];
          try {
            const scheduleResult = await db.prepare(`
                SELECT title, start_time, end_time, type
                FROM schedule_events 
                WHERE date = ? AND type IN ('early_open', 'overnight', 'early_close')
              `).bind(dateStr).all();
            scheduleEvents = scheduleResult.results || [];
          } catch (error) {
            console.log("Schedule events table not found or error:", error.message);
          }
          const dayOfWeek = today.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isFriday = dayOfWeek === 5;
          const isSaturday = dayOfWeek === 6;
          const defaultSchedule = {
            floor1Start: isWeekend ? "11:00" : "12:00",
            floor1End: "22:00",
            floor2Start: isWeekend ? "11:00" : "12:00",
            floor2End: isFriday || isSaturday ? "05:00" : "24:00",
            floor1EventType: null,
            floor2EventType: isFriday || isSaturday ? "overnight" : null
          };
          if (scheduleEvents.length > 0) {
            const floor1Events = scheduleEvents.filter((e) => e.title?.includes("1\uCE35"));
            const floor2Events = scheduleEvents.filter((e) => e.title?.includes("2\uCE35") || !e.title?.includes("\uCE35"));
            const floor1Event = floor1Events.find((e) => e.type === "early_open") || floor1Events.find((e) => e.type === "early_close" || e.type === "overnight");
            const floor2EventOpen = floor2Events.find((e) => e.type === "early_open");
            const floor2EventClose = floor2Events.find((e) => e.type === "early_close" || e.type === "overnight");
            const floor1Start = floor1Event?.type === "early_open" ? floor1Event?.start_time?.substring(0, 5) || defaultSchedule.floor1Start : defaultSchedule.floor1Start;
            const floor1End = floor1Event?.type === "early_close" || floor1Event?.type === "overnight" ? floor1Event?.end_time?.substring(0, 5) || defaultSchedule.floor1End : defaultSchedule.floor1End;
            const floor2Start = floor2EventOpen ? floor2EventOpen?.start_time?.substring(0, 5) || defaultSchedule.floor2Start : defaultSchedule.floor2Start;
            const floor2End = floor2EventClose ? floor2EventClose?.end_time?.substring(0, 5) || defaultSchedule.floor2End : defaultSchedule.floor2End;
            const result2 = {
              floor1Start,
              floor1End,
              floor2Start,
              floor2End,
              floor1EventType: floor1Event?.type || null,
              floor2EventType: floor2EventOpen?.type || floor2EventClose?.type || null,
              date: dateStr,
              dayOfWeek: ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"][dayOfWeek],
              isWeekend
            };
            return Response.json(result2, { headers: corsHeaders });
          }
          const result = {
            ...defaultSchedule,
            date: dateStr,
            dayOfWeek: ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"][dayOfWeek],
            isWeekend
          };
          return Response.json(result, { headers: corsHeaders });
        } catch (error) {
          console.error("Schedule API error:", error);
          return Response.json(
            { error: "\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/terms" && request.method === "GET") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const url_obj = new URL(request.url);
          const type = url_obj.searchParams.get("type");
          let data = [];
          try {
            let query = `
              SELECT * FROM content_pages 
              WHERE is_published = 1
              AND slug IN ('terms_of_service', 'privacy_policy')
              ORDER BY updated_at DESC
            `;
            let params = [];
            if (type && ["terms_of_service", "privacy_policy"].includes(type)) {
              query = `
                SELECT * FROM content_pages 
                WHERE is_published = 1 AND slug = ?
                ORDER BY updated_at DESC
                LIMIT 1
              `;
              params = [type];
            }
            const result = await db.prepare(query).bind(...params).all();
            data = result.results || [];
          } catch (dbError) {
            console.log("content_pages table not found, using fallback data");
            const fallbackData = {
              terms_of_service: {
                id: 1,
                slug: "terms_of_service",
                title: "\uC774\uC6A9\uC57D\uAD00",
                content: "\uAC8C\uC784\uD50C\uB77C\uC790 \uC774\uC6A9\uC57D\uAD00 \uB0B4\uC6A9\uC785\uB2C8\uB2E4.\n\n\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC2DC \uC900\uC218\uD574\uC57C \uD560 \uC0AC\uD56D\uB4E4\uC774 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
                is_published: 1,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z"
              },
              privacy_policy: {
                id: 2,
                slug: "privacy_policy",
                title: "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68",
                content: "\uAC8C\uC784\uD50C\uB77C\uC790 \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68\uC785\uB2C8\uB2E4.\n\n\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBC0F \uC774\uC6A9\uC5D0 \uB300\uD55C \uB0B4\uC6A9\uC774 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
                is_published: 1,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z"
              }
            };
            if (type && fallbackData[type]) {
              data = [fallbackData[type]];
            } else {
              data = Object.values(fallbackData);
            }
          }
          if (type) {
            const terms = data[0] || null;
            const formattedTerms = terms ? {
              id: terms.id,
              type: terms.slug,
              title: terms.title,
              content: terms.content,
              is_active: terms.is_published,
              created_at: terms.created_at,
              updated_at: terms.updated_at
            } : null;
            return Response.json({ data: formattedTerms }, {
              headers: {
                ...corsHeaders,
                "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600"
              }
            });
          }
          const termsOfService = data.find((t) => t.slug === "terms_of_service");
          const privacyPolicy = data.find((t) => t.slug === "privacy_policy");
          const termsMap = {
            terms_of_service: termsOfService ? {
              id: termsOfService.id,
              type: termsOfService.slug,
              title: termsOfService.title,
              content: termsOfService.content,
              is_active: termsOfService.is_published,
              created_at: termsOfService.created_at,
              updated_at: termsOfService.updated_at
            } : null,
            privacy_policy: privacyPolicy ? {
              id: privacyPolicy.id,
              type: privacyPolicy.slug,
              title: privacyPolicy.title,
              content: privacyPolicy.content,
              is_active: privacyPolicy.is_published,
              created_at: privacyPolicy.created_at,
              updated_at: privacyPolicy.updated_at
            } : null
          };
          return Response.json({ data: termsMap }, {
            headers: {
              ...corsHeaders,
              "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600"
            }
          });
        } catch (error) {
          console.error("Terms API error:", error);
          return Response.json(
            { error: "\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/db/query" && request.method === "POST") {
        try {
          const body = await request.json();
          const { sql, params } = body;
          if (!sql) {
            return Response.json(
              { error: "SQL query is required" },
              { status: 400, headers: corsHeaders }
            );
          }
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          let result;
          if (params && params.length > 0) {
            result = await db.prepare(sql).bind(...params).all();
          } else {
            result = await db.prepare(sql).all();
          }
          return Response.json({
            success: true,
            results: result.results,
            meta: result.meta
          }, { headers: corsHeaders });
        } catch (error) {
          console.error("Database query error:", error);
          return Response.json(
            { error: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uCFFC\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4", success: false },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/api/auth/user-by-email" && request.method === "GET") {
        try {
          const db = env.ENVIRONMENT === "production" ? env.DB : env.DEV_DB;
          const email = url.searchParams.get("email");
          if (!email) {
            return Response.json(
              { error: "Email parameter is required" },
              { status: 400, headers: corsHeaders }
            );
          }
          const user = await db.prepare("SELECT id, email, name, role FROM users WHERE email = ?").bind(email).first();
          if (!user) {
            return Response.json(
              { error: "User not found" },
              { status: 404, headers: corsHeaders }
            );
          }
          return Response.json({
            data: user
          }, { headers: corsHeaders });
        } catch (error) {
          console.error("User lookup error:", error);
          return Response.json(
            { error: "\uC0AC\uC6A9\uC790 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" },
            { status: 500, headers: corsHeaders }
          );
        }
      }
      if (url.pathname === "/") {
        return Response.json({
          message: "Gameplaza Workers API",
          version: "1.0.0",
          endpoints: ["/api/health"]
        }, { headers: corsHeaders });
      }
      return Response.json(
        { error: "Not Found", path: url.pathname },
        { status: 404, headers: corsHeaders }
      );
    } catch (error) {
      console.error("Worker error:", error);
      return Response.json(
        { error: "Internal Server Error" },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-AHItAm/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-AHItAm/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

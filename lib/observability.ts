type ObservabilityContext = Record<string, string | number | boolean | null | undefined>;

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
const localAnalyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS === "true";

export function captureAppError(error: unknown, context: ObservabilityContext = {}) {
  const event = normalizeError(error, context);
  void sendSentryEvent(event);
  void captureAnalyticsEvent("app_error", {
    message: event.message,
    name: event.name,
    route: context.route ?? context.path ?? "unknown"
  });
}

export async function captureAnalyticsEvent(eventName: string, payload: ObservabilityContext = {}) {
  const event = {
    eventName,
    payload: sanitizeContext(payload),
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    occurredAt: new Date().toISOString()
  };

  if (analyticsEndpoint && isHttpEndpoint(analyticsEndpoint)) {
    try {
      await fetch(analyticsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true
      });
    } catch {
      // Observability must never break the app.
    }
    return;
  }

  if (localAnalyticsEnabled && typeof window !== "undefined") {
    try {
      const key = "uniba-local-analytics-v1";
      const current = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, number>;
      current[eventName] = (current[eventName] ?? 0) + 1;
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch {
      // localStorage can be unavailable in private contexts.
    }
  }
}

function normalizeError(error: unknown, context: ObservabilityContext) {
  if (error instanceof Error) {
    return {
      eventId: createEventId(),
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: error.stack,
      context: sanitizeContext(context),
      occurredAt: new Date().toISOString()
    };
  }
  return {
    eventId: createEventId(),
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error",
    stack: undefined,
    context: sanitizeContext(context),
    occurredAt: new Date().toISOString()
  };
}

async function sendSentryEvent(event: ReturnType<typeof normalizeError>) {
  if (!sentryDsn) return;
  const parsed = parseSentryDsn(sentryDsn);
  if (!parsed) return;

  const sentryEvent = {
    event_id: event.eventId,
    platform: "javascript",
    timestamp: event.occurredAt,
    level: "error",
    message: event.message,
    exception: {
      values: [
        {
          type: event.name,
          value: event.message
        }
      ]
    },
    extra: {
      ...event.context,
      stack: event.stack
    },
    tags: {
      app: "uniba-food-conquest"
    }
  };

  const envelope = [
    JSON.stringify({ sent_at: event.occurredAt, dsn: sentryDsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(sentryEvent)
  ].join("\n");

  try {
    await fetch(parsed.envelopeUrl, {
      method: "POST",
      body: envelope,
      keepalive: true
    });
  } catch {
    // Error monitoring must remain best-effort.
  }
}

function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.split("/").filter(Boolean).at(-1);
    if (!publicKey || !projectId || !url.protocol.startsWith("http")) return null;
    return {
      envelopeUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${encodeURIComponent(publicKey)}&sentry_version=7`
    };
  } catch {
    return null;
  }
}

function sanitizeContext(context: ObservabilityContext) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (typeof value === "string") return [key, value.slice(0, 300)];
      return [key, value ?? null];
    })
  );
}

function createEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`.slice(0, 32);
}

function isHttpEndpoint(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

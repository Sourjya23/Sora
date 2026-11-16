const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { trace } = require("@opentelemetry/api");

/**
 * OpenTelemetry Distributed Tracing & Grafana Cloud Telemetry Gateway
 */
const DEFAULT_GRAFANA_ENDPOINT = "https://otlp-gateway-prod-ap-south-1.grafana.net/otlp";
const DEFAULT_GRAFANA_AUTH =
  "Basic MTkyNTkwODpnbGNfZXlKdklqb2lNVGs1TXpFeU1pSXNJbTRpT2lKemIzSmhMV0poWTJ0bGJtUXRiM1JsYkNJc0ltc2lPaUphVVVWRllUazRNRzV6TmpKNk1qVjJPRkozTWpONWVXMGlMQ0p0SWpwN0luSWlPaUp3Y205a0xXRndMWE52ZFhSb0xURWlmWDA9";

const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  process.env.GRAFANA_OTLP_ENDPOINT ||
  DEFAULT_GRAFANA_ENDPOINT;

const otlpHeaders = {
  Authorization: DEFAULT_GRAFANA_AUTH,
};

if (process.env.GRAFANA_OTLP_TOKEN) {
  otlpHeaders["Authorization"] = `Basic ${process.env.GRAFANA_OTLP_TOKEN}`;
} else if (process.env.OTEL_EXPORTER_OTLP_HEADERS) {
  // Support key=value,key2=value2 or Authorization=Basic ...
  if (process.env.OTEL_EXPORTER_OTLP_HEADERS.startsWith("Authorization=")) {
    otlpHeaders["Authorization"] = process.env.OTEL_EXPORTER_OTLP_HEADERS.replace(/^Authorization=/, "").trim();
  } else {
    process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k && v) otlpHeaders[k.trim()] = v.trim();
    });
  }
}

let sdk = null;

if (otlpEndpoint) {
  try {
    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint.endsWith("/v1/traces") ? otlpEndpoint : `${otlpEndpoint.replace(/\/+$/, "")}/v1/traces`,
      headers: otlpHeaders,
    });

    sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME || "sora-backend",
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false }, // Avoid noisy disk I/O spans
        }),
      ],
    });

    sdk.start();
    console.log(`[OpenTelemetry] Initialized & exporting traces to Grafana Cloud OTLP: ${otlpEndpoint}`);
  } catch (err) {
    console.warn("[OpenTelemetry] Initialization error:", err.message);
  }
} else {
  console.log("[OpenTelemetry] OTLP Endpoint not configured. Running in internal observability mode.");
}

// Graceful shutdown on process exit
process.on("SIGTERM", () => {
  if (sdk) {
    sdk
      .shutdown()
      .then(() => console.log("[OpenTelemetry] Tracing terminated cleanly"))
      .catch((error) => console.error("[OpenTelemetry] Error terminating tracing", error));
  }
});

const tracer = trace.getTracer("sora-agents-tracer", "1.0.0");

/**
 * Helper to wrap any async agent task inside an OpenTelemetry Span
 */
const withTraceSpan = async (spanName, attributes = {}, fn) => {
  return tracer.startActiveSpan(spanName, async (span) => {
    try {
      if (attributes) {
        Object.entries(attributes).forEach(([k, v]) => {
          if (v !== undefined && v !== null) span.setAttribute(k, String(v));
        });
      }
      const result = await fn(span);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message }); // ERROR
      throw err;
    } finally {
      span.end();
    }
  });
};

module.exports = {
  tracer,
  withTraceSpan,
};

const { v4: uuidv4 } = require("uuid");
const OutboxEvent = require("../models/OutboxEvent");
const { outboxQueueGauge } = require("../telemetry/metrics");

class EventBus {
  constructor() {
    this.subscribers = new Map();
    this.isPublishing = false;
  }

  /**
   * Subscribe an agent or service to specific event types or wildcard '*'
   */
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(handler);
  }

  /**
   * Publish an event: Writes to Outbox collection first (Transactional Outbox Pattern)
   * and then dispatches to in-memory listeners.
   */
  async emitEvent(eventType, aggregateType, aggregateId, payload = {}, actor = null, correlationId = null) {
    const eventId = `evt_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const corrId = correlationId || `corr_${uuidv4().replace(/-/g, "").slice(0, 12)}`;

    const eventRecord = {
      eventId,
      eventType,
      eventVersion: 1,
      occurredAt: new Date(),
      aggregateType,
      aggregateId: String(aggregateId),
      actor: actor || { id: "system", role: "SYSTEM", name: "Sora Orchestrator" },
      correlationId: corrId,
      payload,
      published: false,
      attempts: 0,
    };

    try {
      // 1. Persist to MongoDB outbox
      const saved = await OutboxEvent.create(eventRecord);

      // 2. Dispatch to subscribers immediately in process
      this.dispatchToSubscribers(saved).catch((err) => {
        console.error(`[EventBus] Immediate dispatch error for ${eventType}:`, err.message);
      });

      return saved;
    } catch (err) {
      console.error(`[EventBus] Failed to persist outbox event ${eventType}:`, err);
      throw err;
    }
  }

  /**
   * Dispatch event to matching subscribers
   */
  async dispatchToSubscribers(eventDoc) {
    const handlers = [];

    if (this.subscribers.has(eventDoc.eventType)) {
      handlers.push(...this.subscribers.get(eventDoc.eventType));
    }
    if (this.subscribers.has("*")) {
      handlers.push(...this.subscribers.get("*"));
    }

    for (const handler of handlers) {
      try {
        await handler(eventDoc);
      } catch (handlerErr) {
        console.error(`[EventBus] Handler failed for ${eventDoc.eventType}:`, handlerErr);
      }
    }

    // Mark as published in outbox
    await OutboxEvent.updateOne(
      { eventId: eventDoc.eventId },
      { $set: { published: true, publishedAt: new Date() }, $inc: { attempts: 1 } }
    );
  }

  /**
   * Worker to poll and drain any unpublished events (reconciliation)
   */
  async drainOutbox() {
    if (this.isPublishing) return;
    this.isPublishing = true;

    try {
      const unpublished = await OutboxEvent.find({ published: false })
        .sort({ createdAt: 1 })
        .limit(50);

      outboxQueueGauge.set(unpublished.length);

      for (const event of unpublished) {
        await this.dispatchToSubscribers(event);
      }
    } catch (err) {
      console.error("[EventBus] Drain outbox error:", err.message);
    } finally {
      this.isPublishing = false;
    }
  }

  /**
   * Start or restart periodic outbox reconciliation worker
   */
  startOutboxWorker(intervalMs = 10000) {
    if (this._workerInterval) clearInterval(this._workerInterval);
    this._workerInterval = setInterval(() => {
      this.drainOutbox().catch((e) => console.error("[EventBus Worker] Error:", e));
    }, intervalMs);
    console.log(`[EventBus] Outbox worker started with interval ${intervalMs}ms`);
  }
}

const eventBus = new EventBus();

// Start periodic outbox reconciliation every 10 seconds
eventBus.startOutboxWorker(10000);

module.exports = eventBus;

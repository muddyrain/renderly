# Task module
Owns durable generation task state and transitions.
Target states: queued, running, succeeded, failed, cancelled.
Production requirements: idempotency, leases, bounded retry, cancellation, provider request ID, timestamps, structured failure codes.

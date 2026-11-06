# Frontend Integration Plan

The current UI uses local sample data. Connect it to the Go backend one vertical slice at a time.

1. Projects: replace sample project rows with `GET /api/v1/projects`; create projects with `POST /api/v1/projects`.
2. Conversations: persist messages and load history by project.
3. Agent runs: send user messages to Go, render the structured plan, and subscribe to run events using SSE.
4. Generation tasks: require user approval, submit the approved plan, and display queued/running/succeeded/failed/cancelled states.
5. Assets: render stored asset URLs and metadata from the backend; never overwrite an original when creating a revision.

Keep HTTP calls in a typed API client module. Never expose provider API keys to browser code. Components must not construct endpoint URLs throughout the UI.

Acceptance:
- Demo content is clearly identified and removed from live-data views once APIs are connected.
- Every asynchronous operation has loading, success and error states.
- Agent run state and generation task state are separate concepts.
- A task is complete only after the backend confirms the asset has been stored.

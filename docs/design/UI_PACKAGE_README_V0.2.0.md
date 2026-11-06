# Renderly UI Package

PC-first frontend implementation for Renderly's agent-led image creation workspace.

## Included
- Studio-first Next.js interface.
- Agent conversation, creative plan, visible run states.
- Large image canvas, variants, image actions, metadata and version controls.
- Gallery, Projects, Characters, Models and Settings views.
- Framer Motion transitions and CSS motion effects.
- Desktop-first layout. Mobile design is intentionally out of scope.

> This is a frontend prototype. Agent responses, image generation, progress, model status and sample assets are demo data. No live image provider or Go backend is connected.

## Apply to the existing repository
1. Back up your current `apps/web`.
2. Replace your repository's `apps/web` with the `apps/web` directory in this package.
3. Run:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`.

This package does not overwrite your Go backend, Docker Compose, migrations or root project documentation.

## Main interactions
- Send a prompt in Studio to simulate an Agent run.
- Select plan steps and result thumbnails.
- Try Edit, Expand, Upscale and Variations controls.
- Navigate Gallery, Projects, Characters, Models and Settings.

## Next integration milestone
1. Replace demo projects with Go Project API responses.
2. Persist conversations and messages.
3. Replace demo plan with Agent Run events.
4. Replace simulated generation with durable task APIs and SSE.
5. Replace sample artwork with Asset URLs.

# Renderly Motion Design Specification

## Product motion direction
Renderly is an AI image creation workspace. Motion must make the Agent's work legible and make the artwork feel responsive. It must not resemble a marketing site with decorative motion.

## Interaction states
- Idle: calm canvas, no animated progress.
- Planning: active plan step receives a restrained violet pulse.
- Waiting for approval: clear action state; never auto-run a billable generation.
- Generating: animated waveform in Agent panel and generation overlay on canvas.
- Completed: result crossfades into the canvas and a completion state appears.
- Failed/cancelled: distinct error/cancel state with retry or recovery actions.

## Motion specification
| Element | Behavior | Timing |
|---|---|---|
| Ambient background | Very slow blurred gradient drift | 20–24 s |
| Screen navigation | Fade + small vertical offset | 220–260 ms |
| Agent message | Fade + 8–12 px upward | 200–260 ms |
| Active plan step | Soft glow pulse | 1.4–1.6 s |
| Thinking indicator | Staggered waveform | 0.9–1.1 s |
| Composer focus | Border/glow transition | 180–220 ms |
| Main image change | Crossfade + subtle scale | 300–360 ms |
| Gallery card hover | 1.04x image scale + toolbar reveal | 220–500 ms |
| Gallery filter | Layout transition | 220–300 ms |
| Toast | Fade + short upward movement | 180–240 ms |

## Implementation rules
- Use Framer Motion for page and layout transitions.
- Use CSS for small status animations, waveform, ambient drift, and focus states.
- Respect `prefers-reduced-motion`.
- Do not animate everything simultaneously.
- Real task progress must be driven by Go API/SSE events after integration.
- Do not show fake percentages or imply a real image was generated when using demo data.

## Current prototype
The current frontend includes demo-only agent responses and a simulated completion timer. All such behaviors must be replaced by API-backed state before public beta.

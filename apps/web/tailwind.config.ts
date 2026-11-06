import type { Config } from "tailwindcss";

const color = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: color("background"),
        navigation: color("navigation"),
        surface: color("surface"),
        canvas: color("canvas"),
        foreground: color("foreground"),
        "muted-foreground": color("muted-foreground"),
        border: color("border"),
        primary: {
          DEFAULT: color("primary"),
          foreground: color("primary-foreground"),
        },
        selection: color("selection"),
        ring: color("focus-ring"),
        success: color("success-foreground"),
        warning: color("warning-foreground"),
        destructive: color("destructive-foreground"),
        overlay: color("overlay"),
      },
      borderRadius: {
        control: "var(--radius-control)",
        dialog: "var(--radius-dialog)",
      },
      transitionDuration: {
        ui: "var(--duration-ui)",
      },
    },
  },
  plugins: [],
};

export default config;

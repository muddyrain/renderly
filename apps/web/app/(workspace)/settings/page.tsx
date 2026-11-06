import { SettingsWorkbench } from "@/components/workspace/settings-workbench";
import { workspaceMetadata } from "@/lib/workspace-pages";
export const metadata = workspaceMetadata("settings");
export default function Page() { return <SettingsWorkbench />; }

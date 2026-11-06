import { CharactersWorkbench } from "@/components/workspace/characters-workbench";
import { workspaceMetadata } from "@/lib/workspace-pages";
export const metadata = workspaceMetadata("characters");
export default function Page() { return <CharactersWorkbench />; }

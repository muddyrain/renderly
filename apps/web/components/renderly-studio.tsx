'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import { SampleImage } from "./sample-image";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Aperture, ArrowDownToLine, Bell, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Expand, FolderKanban, Grid2X2, Heart, Image as ImageIcon, Layers3, LayoutGrid, LoaderCircle, MoreHorizontal, Pencil, Plus, Search, Send, Settings2, SlidersHorizontal, Sparkles, X, Zap } from "lucide-react";

type View = "Studio" | "Gallery" | "Projects" | "Characters" | "Models" | "Settings";
type Art = { id:number; title:string; category:string; src:string; prompt:string; model:string; ratio:string; time:string };
const artworks: Art[] = [
 {id:1,title:"Moonlit Elven Sentinel",category:"Character",src:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1800&q=90",prompt:"An ethereal fantasy heroine, silver hair, midnight-blue armor, cinematic moonlight, detailed concept art",model:"Flux.1 Dev",ratio:"16:9",time:"12.4s"},
 {id:2,title:"The Floating Kingdom",category:"Environment",src:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=85",prompt:"A floating ancient kingdom above a misty mountain range",model:"Flux.1 Dev",ratio:"16:9",time:"10.8s"},
 {id:3,title:"The Last Dawn",category:"Poster",src:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1400&q=85",prompt:"Epic fantasy adventurers before a luminous horizon",model:"SDXL",ratio:"16:9",time:"9.6s"}
];
const galleryItems: Art[] = [...artworks,
 {id:4,title:"Quiet Bloom",category:"Product",src:"https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1000&q=85",prompt:"Soft botanical still life",model:"SDXL",ratio:"4:5",time:"8.2s"},
 {id:5,title:"Glass Architecture",category:"Architecture",src:"https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1000&q=85",prompt:"Minimal architectural photography",model:"Flux.1 Dev",ratio:"3:2",time:"11.1s"},
 {id:6,title:"Into the Wild",category:"Environment",src:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&q=85",prompt:"Cinematic forest environment",model:"SDXL",ratio:"16:9",time:"7.9s"}
];
const navItems = [
 {name:"Studio" as View,icon:Sparkles},{name:"Gallery" as View,icon:LayoutGrid},
 {name:"Projects" as View,icon:FolderKanban},{name:"Characters" as View,icon:Aperture},
 {name:"Models" as View,icon:Layers3},{name:"Settings" as View,icon:Settings2}
];
const initialPlan = [
 {label:"Understand your creative brief",status:"done"},{label:"Define visual direction",status:"done"},
 {label:"Generate character concept",status:"done"},{label:"Create environment concept",status:"done"},
 {label:"Compose final campaign poster",status:"done"}
];

export default function RenderlyStudio() {
 const [view,setView]=useState<View>("Studio");
 const [selectedArt,setSelectedArt]=useState<Art>(artworks[0]);
 const [prompt,setPrompt]=useState("");
 const [messages,setMessages]=useState([
  {role:"user",text:"Create a complete fantasy game visual set: a protagonist, an environment concept, and a cinematic key art poster. Keep the visual direction cohesive."},
  {role:"assistant",text:"Absolutely. I’ve mapped this into a coordinated visual set. We’ll establish the protagonist first, then carry the same palette and atmosphere into the environment and final key art."}
 ]);
 const [plan,setPlan]=useState(initialPlan);
 const [activeTab,setActiveTab]=useState<"results"|"process">("results");
 const [generating,setGenerating]=useState(false);
 const [toast,setToast]=useState("");
 const [filter,setFilter]=useState("All");
 const [liked,setLiked]=useState(false);
 const [showDetails,setShowDetails]=useState(true);
 const generationTimer=useRef<number | undefined>(undefined);
 const toastTimer=useRef<number | undefined>(undefined);
 useEffect(()=>()=>{window.clearTimeout(generationTimer.current);window.clearTimeout(toastTimer.current);},[]);
 const showToast=(message:string)=>{window.clearTimeout(toastTimer.current);setToast(message);toastTimer.current=window.setTimeout(()=>setToast(""),2600);};
 const cancelDemo=()=>{window.clearTimeout(generationTimer.current);generationTimer.current=undefined;setGenerating(false);setPlan((steps)=>steps.map((step)=>step.status==="done"?step:{...step,status:"cancelled"}));showToast("Demo cancelled — no provider was called.");};
 const newSession=()=>{window.clearTimeout(generationTimer.current);generationTimer.current=undefined;setGenerating(false);setPrompt("");setPlan([{label:"Describe your idea",status:"pending"}]);setActiveTab("results");setView("Studio");setMessages([{role:"assistant",text:"This is a demo session. Describe an idea to preview the creative workflow."}]);showToast("New demo session started.");};
 const doAction=(action:string)=>showToast(`${action} is a UI demo. Provider integration comes next.`);
 const sendPrompt=()=>{
  const value=prompt.trim(); if(!value||generating)return;
  setMessages((v)=>[...v,{role:"user",text:value}]);setPrompt("");setGenerating(true);setActiveTab("process");
  setPlan([{label:"Understand your request",status:"done"},{label:"Update the creative brief",status:"done"},{label:"Prepare image generation",status:"active"},{label:"Generate and review results",status:"pending"}]);
  generationTimer.current=window.setTimeout(()=>{
   generationTimer.current=undefined;
   setMessages((v)=>[...v,{role:"assistant",text:"I’ve prepared the next creative pass. This prototype uses sample artwork; live generation will be connected through the Go Agent API."}]);
   setPlan([{label:"Understand your request",status:"done"},{label:"Update the creative brief",status:"done"},{label:"Prepare image generation",status:"done"},{label:"Generate and review results",status:"done"}]);
   setGenerating(false);setActiveTab("results");showToast("Demo run completed — connect a provider for real generation.");
  },2300);
 };
 const filteredGallery=useMemo(()=>filter==="All"?galleryItems:galleryItems.filter((a)=>a.category===filter),[filter]);
 const variants=artworks.some((a)=>a.id===selectedArt.id)?artworks:[selectedArt];
 const selectedIndex=variants.findIndex((a)=>a.id===selectedArt.id);

 return <MotionConfig reducedMotion="user"><main className="app-shell">
  <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
  <header className="topbar">
   <button className="brand" onClick={()=>setView("Studio")}><span className="brand-mark">R</span><span>Renderly</span></button>
   <div className="topbar-right">
    <button className="search-trigger" onClick={()=>showToast("Search will connect to project and asset search.")}><Search size={15}/><span>Search creations</span><kbd>⌘ K</kbd></button>
    <div className="credits"><span className="credit-gem">✦</span> 420 <button onClick={()=>showToast("Usage and billing are not connected yet.")}><Plus size={14}/></button></div>
    <button className="icon-button" onClick={()=>showToast("You’re all caught up.")}><Bell size={17}/><i className="notification-dot"/></button>
    <button className="user-avatar" onClick={()=>setView("Settings")}>R</button>
   </div>
  </header>
  <div className="demo-banner"><b>DEMO WORKSPACE</b><span>Agent replies, plans, progress, artwork and usage are samples. No provider or Go API is connected.</span></div>
  <div className="workspace">
   <aside className="sidebar">
    <button className="new-project" onClick={newSession}><Plus size={16}/> New project</button>
    <div className="nav-group"><span className="nav-caption">WORKSPACE</span>
     {navItems.map(({name,icon:Icon})=><button key={name} className={`nav-link ${view===name?"active":""}`} aria-current={view===name?"page":undefined} onClick={()=>setView(name)}><Icon size={17}/><span>{name}</span>{name==="Studio"&&<span className="nav-spark">✦</span>}</button>)}
    </div>
    <div className="sidebar-projects"><div className="sidebar-section-title"><span>RECENT PROJECTS</span><button onClick={()=>setView("Projects")}><Plus size={13}/></button></div>
     <button className="recent-project" onClick={()=>setView("Studio")}><i className="project-dot violet"/> Fantasy game visuals</button>
     <button className="recent-project" onClick={()=>setView("Studio")}><i className="project-dot blue"/> Product launch campaign</button>
    </div>
    <div className="sidebar-bottom"><div className="plan-card"><div className="plan-card-top"><span>Free workspace</span><span>120 / 500</span></div><div className="usage-track"><i/></div><small>Sample generation usage</small></div>
     <button className="profile-row" onClick={()=>setView("Settings")}><span className="profile-avatar">R</span><span><b>Renderly User</b><small>Personal workspace</small></span><ChevronDown size={14}/></button>
    </div>
   </aside>
   <AnimatePresence mode="wait">
    <motion.section key={view} className="main-panel" initial={{opacity:0,y:9}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-7}} transition={{duration:.22}}>
     <div className="panel-topline"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{view}</strong></div><div className="panel-tools"><button className="icon-button" onClick={()=>showToast("Help center coming soon.")}><CircleHelp size={16}/></button><button className="icon-button" onClick={()=>showToast("More workspace actions coming soon.")}><MoreHorizontal size={17}/></button></div></div>

     {view==="Studio"&&<div className="studio-layout">
      <section className="agent-panel">
       <div className="agent-heading"><div className="agent-title"><span className="agent-orb"><Sparkles size={15}/></span><div><b>Creative Agent</b><small>Visual creation assistant</small></div></div><button className="icon-button" onClick={()=>showToast("Agent run history coming soon.")}><MoreHorizontal size={17}/></button></div>
       <div className="conversation">
        <AnimatePresence initial={false}>{messages.map((m,i)=><motion.div key={`${i}-${m.role}`} className={`message ${m.role}`} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.23}}>
         {m.role==="assistant"&&<span className="message-avatar"><Sparkles size={13}/></span>}<div className="message-bubble">{m.text}</div>
        </motion.div>)}</AnimatePresence>
        <div className="plan-box">
         <div className="plan-heading"><span><Sparkles size={14}/> Creative plan</span><span className="plan-count">{plan.filter((s)=>s.status==="done").length}/{plan.length}</span></div>
         <div className="plan-list">{plan.map((step)=><button key={step.label} className={`plan-step ${step.status}`} onClick={()=>showToast(step.label)}>
          <span className="step-icon">{step.status==="done"?<Check size={11}/>:step.status==="active"?<LoaderCircle size={12}/>:<i/>}</span><span>{step.label}</span>{step.status==="active"&&<small>Working</small>}
         </button>)}</div>
         <div className="plan-progress"><motion.i animate={{width:`${plan.filter((s)=>s.status==="done").length/plan.length*100}%`}} transition={{duration:.55}}/></div>
        </div>
        {generating&&<div className="agent-thinking"><span className="thinking-wave"><i/><i/><i/><i/><i/></span><span>Agent is preparing your next variation…</span></div>}
       </div>
       <div className="composer-wrap"><div className="composer">
        <textarea aria-label="Creative prompt" value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();sendPrompt();}}} placeholder="Tell your agent what to create or change…"/>
        <div className="composer-bottom"><div className="composer-actions"><button onClick={()=>doAction("Reference upload")}><ImageIcon size={16}/> Reference</button><button onClick={()=>doAction("Generation settings")}><SlidersHorizontal size={16}/> Settings</button></div><button className="send-button" aria-label="Run demo" disabled={!prompt.trim()||generating} onClick={sendPrompt}>{generating?<LoaderCircle size={17} className="spin"/>:<Send size={17}/>}</button></div>
       </div><div className="composer-hint"><span>↵ Send</span><span>⇧ ↵ New line</span><span>Local demo only</span>{generating&&<button className="cancel-demo" onClick={cancelDemo}>Cancel demo</button>}</div></div>
      </section>

      <section className="canvas-panel">
       <div className="canvas-toolbar"><div className="canvas-tabs"><button className={activeTab==="results"?"selected":""} onClick={()=>setActiveTab("results")}>Results <span className="tab-count">{variants.length}</span></button><button className={activeTab==="process"?"selected":""} onClick={()=>setActiveTab("process")}>Creation process</button></div>
        <div className="canvas-actions"><button className="icon-button" onClick={()=>setShowDetails(!showDetails)} title="Toggle details"><Grid2X2 size={16}/></button><button className="soft-button" onClick={()=>doAction("Download all")}><ArrowDownToLine size={15}/> Download all</button></div>
       </div>
       {activeTab==="results"?<motion.div className="results-view" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.25}}>
        <div className="hero-art-wrap"><AnimatePresence mode="wait"><motion.div key={selectedArt.id} className="hero-art" initial={{opacity:0,scale:1.02}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.32}}><SampleImage src={selectedArt.src} alt={selectedArt.title} priority/></motion.div></AnimatePresence>
         <div className="art-vignette"/><button className="art-arrow left" aria-label="Previous sample" disabled={variants.length===1} onClick={()=>setSelectedArt(variants[(selectedIndex+variants.length-1)%variants.length])}><ChevronLeft size={20}/></button>
         <button className="art-arrow right" aria-label="Next sample" disabled={variants.length===1} onClick={()=>setSelectedArt(variants[(selectedIndex+1)%variants.length])}><ChevronRight size={20}/></button>
         <div className="art-index">{selectedIndex+1} / {variants.length}</div>
         <div className="art-action-bar"><button onClick={()=>doAction("Edit image")}><Pencil size={13}/> Edit</button><button onClick={()=>doAction("Expand image")}><Expand size={13}/> Expand</button><button onClick={()=>doAction("Upscale image")}><Zap size={13}/> Upscale</button><button onClick={()=>doAction("More image actions")}><MoreHorizontal size={15}/></button></div>
         {generating&&<div className="generation-shimmer"><span/><span>Demo variation preview</span></div>}
        </div>
        <div className="thumbnail-row">{variants.map((art,index)=><button key={art.id} className={`thumbnail ${selectedArt.id===art.id?"chosen":""}`} onClick={()=>setSelectedArt(art)}><SampleImage src={art.src} alt={art.title} priority={selectedArt.id===art.id}/>{selectedArt.id===art.id&&<span className="thumb-check"><Check size={11}/></span>}<small>0{index+1}</small></button>)}</div>
        {showDetails&&<div className="asset-details"><div className="details-heading"><div><b>{selectedArt.title}</b><small>Sample artwork · {selectedArt.category}</small></div><button className={`icon-button ${liked?"liked":""}`} onClick={()=>setLiked(!liked)}><Heart size={16} fill={liked?"currentColor":"none"}/></button></div>
         <div className="metadata-grid"><div><small>PROMPT</small><p>{selectedArt.prompt}</p></div><div><small>MODEL</small><p><span className="model-chip"><Sparkles size={11}/> {selectedArt.model}</span></p></div><div><small>RATIO</small><p>{selectedArt.ratio}</p></div><div><small>TIME</small><p>{selectedArt.time}</p></div></div>
        </div>}
       </motion.div>:<div className="process-view"><div className="process-title"><span className="agent-orb"><Sparkles size={15}/></span><div><h2>Creation timeline</h2><p>Inspect what your agent planned and executed.</p></div><span className="status-pill"><i/> {generating?"Demo running":plan.some((step)=>step.status==="cancelled")?"Demo cancelled":plan.every((step)=>step.status==="done")?"Demo completed":"Demo idle"}</span></div>
        {plan.map((step,i)=><div className={`timeline-row ${step.status}`} key={step.label}><span className="timeline-node">{step.status==="done"?<Check size={12}/>:step.status==="active"?<LoaderCircle size={13}/>:i+1}</span><div><b>{step.label}</b><small>{step.status==="done"?"Completed successfully":step.status==="active"?"Agent is working on this step":step.status==="cancelled"?"Demo cancelled":"Waiting for previous step"}</small></div><span className="timeline-state">{step.status}</span></div>)}
        <div className="process-note"><Sparkles size={16}/> Agent execution is bounded and user-directed. Real events will be streamed from the Go API.</div>
       </div>}
      </section>
     </div>}

     {view==="Gallery"&&<section className="secondary-view">
      <div className="view-heading"><div><span className="eyebrow">YOUR VISUAL LIBRARY</span><h1>Gallery</h1><p>Explore, organize and reuse your generated visuals.</p></div><button className="primary-button" onClick={()=>setView("Studio")}><Plus size={15}/> Create visual</button></div>
      <div className="filter-row">{["All","Character","Environment","Poster","Product","Architecture"].map((v)=><button key={v} className={filter===v?"active":""} onClick={()=>setFilter(v)}>{v}</button>)}</div>
      <motion.div layout className="gallery-grid">{filteredGallery.map((art)=><motion.button layout key={art.id} className="gallery-card" onClick={()=>{setSelectedArt(art);setView("Studio");setActiveTab("results");}}><div className="gallery-image"><SampleImage src={art.src} alt={art.title}/><span className="gallery-hover"><ZoomIcon/></span></div><div className="gallery-caption"><span><b>{art.title}</b><small>{art.category} · {art.model}</small></span><MoreHorizontal size={16}/></div></motion.button>)}</motion.div>
     </section>}
     {view==="Projects"&&<section className="secondary-view">
      <div className="view-heading"><div><span className="eyebrow">YOUR CREATIVE WORK</span><h1>Projects</h1><p>Keep every idea, reference and generation in one place.</p></div><button className="primary-button" onClick={()=>setView("Studio")}><Plus size={15}/> New project</button></div>
      <div className="project-list">{[{name:"Fantasy game visuals",desc:"A cohesive visual set for an imagined fantasy adventure.",img:artworks[0].src,count:"12 assets",updated:"Updated 2 hours ago"},{name:"Product launch campaign",desc:"Premium product imagery and campaign directions.",img:galleryItems[4].src,count:"8 assets",updated:"Updated yesterday"},{name:"Forest architecture study",desc:"Atmospheric architectural concepts and references.",img:galleryItems[5].src,count:"6 assets",updated:"Updated 3 days ago"}].map((item)=><button className="project-row" key={item.name} onClick={()=>setView("Studio")}><SampleImage src={item.img} alt=""/><span className="project-row-copy"><b>{item.name}</b><small>{item.desc}</small><em>{item.count} · {item.updated}</em></span><span className="project-open">Open project →</span></button>)}</div>
     </section>}
     {view==="Characters"&&<section className="secondary-view"><div className="view-heading"><div><span className="eyebrow">REUSABLE VISUAL REFERENCES</span><h1>Characters</h1><p>Keep character references close to every creative session.</p></div><button className="primary-button" onClick={()=>doAction("Create character profile")}><Plus size={15}/> New character</button></div><div className="gallery-grid">{artworks.slice(0,2).map((art)=><button className="gallery-card" key={art.id} onClick={()=>{setSelectedArt(art);setView("Studio");}}><div className="gallery-image"><SampleImage src={art.src} alt={art.title}/></div><div className="gallery-caption"><span><b>{art.title}</b><small>Reference profile · 3 images</small></span><MoreHorizontal size={16}/></div></button>)}</div></section>}
     {view==="Models"&&<section className="secondary-view"><div className="view-heading"><div><span className="eyebrow">GENERATION ENGINE</span><h1>Models</h1><p>Choose and configure the image models available to your workspace.</p></div><button className="primary-button" onClick={()=>doAction("Add model provider")}><Plus size={15}/> Add provider</button></div><div className="model-grid">{[{name:"Flux.1 Dev",vendor:"Black Forest Labs",desc:"High-quality image generation",color:"purple",state:"Demo only"},{name:"Stable Diffusion XL",vendor:"Stability AI",desc:"Flexible open image generation",color:"blue",state:"Not connected"},{name:"DALL·E",vendor:"OpenAI",desc:"Prompt-driven image creation",color:"orange",state:"Not connected"}].map((m)=><div className="model-card" key={m.name}><div className={`model-wave ${m.color}`}><span/><span/><span/><span/><span/></div><div className="model-card-copy"><b>{m.name}</b><small>{m.vendor}</small><p>{m.desc}</p><div><span className={`model-status ${m.state==="Demo only"?"online":""}`}><i/>{m.state}</span><button onClick={()=>doAction(`Configure ${m.name}`)}>Configure</button></div></div></div>)}</div><div className="provider-note"><Sparkles size={17}/> Provider credentials are stored server-side. This screen is a visual prototype and does not save API keys yet.</div></section>}
     {view==="Settings"&&<section className="secondary-view"><div className="view-heading"><div><span className="eyebrow">WORKSPACE PREFERENCES</span><h1>Settings</h1><p>Manage your profile, model providers and workspace preferences.</p></div></div><div className="settings-layout"><nav className="settings-nav"><button className="active">Profile</button><button onClick={()=>doAction("Provider settings")}>Model providers</button><button onClick={()=>doAction("API key settings")}>API keys</button><button onClick={()=>doAction("Storage settings")}>Storage</button><button onClick={()=>doAction("Preferences")}>Preferences</button></nav><div className="settings-card"><div className="profile-large">R</div><h3>Renderly User</h3><p>user@renderly.ai</p><div className="settings-divider"/><div className="usage-summary"><div><b>Free workspace</b><small>Sample usage: 120 of 500 generations</small></div><span>24%</span></div><div className="usage-track"><i/></div><button className="soft-button" onClick={()=>doAction("Workspace profile editing")}>Edit profile</button></div></div></section>}
    </motion.section>
   </AnimatePresence>
  </div>
  <AnimatePresence>{toast&&<motion.div className="toast" role="status" aria-live="polite" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}><Sparkles size={15}/>{toast}<button aria-label="Dismiss notification" onClick={()=>setToast("")}><X size={13}/></button></motion.div>}</AnimatePresence>
 </main></MotionConfig>;
}

function ZoomIcon(){return <span className="zoom-icon">↗</span>}

/*
====================================================
LifeOS Growth Engine v1
====================================================
Tracks transformation evidence over time without
pretending a conversation is a clinical measurement.
*/

const STORAGE_KEY = "lifeos-growth-v1";
const DIMENSIONS = [
  "hope","recovery","identity","purpose","leadership",
  "business","relationships","emotionalRegulation","consistency","confidence"
];

const LABELS = {
  hope:"Hope", recovery:"Recovery", identity:"Identity", purpose:"Purpose",
  leadership:"Leadership", business:"Business", relationships:"Relationships",
  emotionalRegulation:"Emotional Regulation", consistency:"Consistency", confidence:"Confidence"
};

const positive = {
  hope:/\b(hope|want to live|future|believe i can|keep going|not giving up)\b/i,
  recovery:/\b(sober|sobriety|recovery|sponsor|meeting|treatment|program|clean)\b/i,
  identity:/\b(i am|becoming|who i am|my identity|i know myself)\b/i,
  purpose:/\b(purpose|calling|mission|meaning|make something of my life)\b/i,
  leadership:/\b(lead|leader|team|responsibility|influence|serve others)\b/i,
  business:/\b(business|customer|client|offer|sales|revenue|launch|project)\b/i,
  relationships:/\b(trust|relationship|family|friend|partner|support|boundary)\b/i,
  emotionalRegulation:/\b(calm|pause|slow down|breathe|manage my anger|walk away)\b/i,
  consistency:/\b(daily|consistent|routine|discipline|showing up|finished|completed)\b/i,
  confidence:/\b(confident|believe in myself|i can|capable|proud of myself)\b/i
};

const negative = {
  hope:/\b(hopeless|give up|no purpose|nothing matters|cannot go on)\b/i,
  recovery:/\b(use|using|relapse|craving|addiction|withdrawal)\b/i,
  emotionalRegulation:/\b(angry|rage|overwhelmed|panic|out of control)\b/i,
  consistency:/\b(procrastinat|stuck|avoid|keep falling|same pattern)\b/i,
  confidence:/\b(i can't|not good enough|failure|doubt myself)\b/i,
  relationships:/\b(don't trust|alone|no one|argument|conflict)\b/i
};

function storage(){
  try { if (typeof localStorage !== "undefined") return localStorage; } catch {}
  const m=new Map(); return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,n)); }
function blank(){
  return {version:1,createdAt:new Date().toISOString(),updatedAt:null,scores:Object.fromEntries(DIMENSIONS.map(k=>[k,50])),evidence:[],snapshots:[]};
}

export class GrowthEngine {
  constructor(key=STORAGE_KEY, store=storage()){ this.key=key; this.store=store; this.state=this.load(); }
  load(){ try { const x=JSON.parse(this.store.getItem(this.key)); return x&&x.scores?{...blank(),...x}:blank(); } catch { return blank(); } }
  save(){ this.state.updatedAt=new Date().toISOString(); this.store.setItem(this.key,JSON.stringify(this.state)); return this.snapshot(); }

  observe({message="",decision={},brain={},mission={}}={}){
    const text=String(message).trim(); if(!text) return this.snapshot();
    const changes={};
    for(const key of DIMENSIONS){
      let delta=0;
      if(positive[key]?.test(text)) delta+=3;
      if(negative[key]?.test(text)) delta-=3;
      if(decision.route===key) delta+=2;
      if(key==="emotionalRegulation" && ["safety","stabilization"].includes(decision.route)) delta-=1;
      if(key==="recovery" && decision.route==="recovery") delta+=2;
      if(key==="consistency" && mission?.progress?.percent>=50) delta+=2;
      if(delta){ this.state.scores[key]=clamp((this.state.scores[key]??50)+delta); changes[key]=delta; }
    }
    this.state.evidence.push({id:crypto?.randomUUID?.()||`growth-${Date.now()}`,createdAt:new Date().toISOString(),message:text.slice(0,240),route:decision.route||"general",changes});
    this.state.evidence=this.state.evidence.slice(-200);
    if(this.state.evidence.length===1 || this.state.evidence.length%5===0) this.captureSnapshot();
    return this.save();
  }

  captureSnapshot(){
    this.state.snapshots.push({createdAt:new Date().toISOString(),scores:{...this.state.scores}});
    this.state.snapshots=this.state.snapshots.slice(-60);
  }

  trend(key){
    const first=this.state.snapshots[0]?.scores?.[key]??50;
    const current=this.state.scores[key]??50;
    return current-first;
  }

  narrative(){
    const ranked=DIMENSIONS.map(key=>({key,label:LABELS[key],score:this.state.scores[key],trend:this.trend(key)})).sort((a,b)=>b.trend-a.trend);
    const strongest=ranked[0]; const attention=[...ranked].sort((a,b)=>a.score-b.score)[0];
    if(this.state.evidence.length<3) return "Your growth record is beginning to form. LifeOS needs more lived evidence before naming a long-term pattern.";
    return `${strongest.label} is showing the clearest upward movement. ${attention.label} currently deserves the most patient attention. This is a reflection of conversation and action evidence, not a diagnosis or clinical score.`;
  }

  snapshot(){
    return {version:this.state.version,updatedAt:this.state.updatedAt,evidenceCount:this.state.evidence.length,dimensions:DIMENSIONS.map(key=>({key,label:LABELS[key],score:this.state.scores[key],trend:this.trend(key)})),snapshots:[...this.state.snapshots],recentEvidence:[...this.state.evidence].slice(-10).reverse(),narrative:this.narrative()};
  }
  clear(){ this.state=blank(); this.store.removeItem(this.key); return this.snapshot(); }
}

export const Growth = new GrowthEngine();

import { useState, useEffect, useRef, useMemo, Component } from "react";

// ---- Default categories ----
const DEFAULT_CATS = [
  { id:'sleep',    label:'Sleep',    icon:'🌙', col:'#818cf8', fill:'rgba(129,140,248,0.15)', border:'rgba(129,140,248,0.5)' },
  { id:'meal',     label:'Meal',     icon:'🍽️', col:'#fb923c', fill:'rgba(251,146,60,0.15)',  border:'rgba(251,146,60,0.5)'  },
  { id:'workout',  label:'Workout',  icon:'💪', col:'#34d399', fill:'rgba(52,211,153,0.15)',  border:'rgba(52,211,153,0.5)'  },
  { id:'work',     label:'Work',     icon:'💼', col:'#60a5fa', fill:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.5)'  },
  { id:'personal', label:'Personal', icon:'🌿', col:'#f472b6', fill:'rgba(244,114,182,0.15)', border:'rgba(244,114,182,0.5)' },
  { id:'free',     label:'Free',     icon:'☀️', col:'#a3e635', fill:'rgba(163,230,53,0.15)',  border:'rgba(163,230,53,0.5)'  },
];

// ---- Category detail schemas ----
const CAT_DETAILS = {
  meal:{
    fields:[
      {key:'mealName',label:'Meal name',type:'text',placeholder:'e.g. Grilled chicken salad'},
      {key:'calories',label:'Calories (kcal)',type:'number',placeholder:'e.g. 450'},
      {key:'foods',label:'Foods / ingredients',type:'textarea',placeholder:'chicken, lettuce, tomato...'},
    ],
    ratings:[{key:'hunger',label:'Hunger before',max:5},{key:'satisfaction',label:'Satisfaction',max:5}],
    moods:{key:'moodAfter',label:'Feeling after',opts:['😊 Good','😐 Okay','😴 Heavy','⚡ Energised','🤢 Unwell']},
  },
  workout:{
    fields:[],exercises:true,
    ratings:[{key:'intensity',label:'Intensity',max:5}],
    moods:{key:'feeling',label:'How did it feel?',opts:['🔥 Great','👍 Good','😤 Tough','💀 Exhausted']},
  },
  sleep:{
    fields:[
      {key:'hours',label:'Hours slept',type:'number',placeholder:'e.g. 7.5'},
      {key:'bedTime',label:'Bed time',type:'time'},
      {key:'wakeTime',label:'Wake time',type:'time'},
    ],
    ratings:[{key:'quality',label:'Sleep quality',max:5}],
    moods:{key:'wakeMood',label:'Wake mood',opts:['✨ Refreshed','😐 Okay','😴 Groggy','😩 Tired']},
  },
  work:{
    fields:[
      {key:'tasks',label:'Tasks completed',type:'textarea',placeholder:'List what you got done...'},
      {key:'blockers',label:'Blockers / issues',type:'text',placeholder:'Any blockers today?'},
    ],
    ratings:[{key:'focus',label:'Focus level',max:5},{key:'productivity',label:'Productivity',max:5}],
    moods:null,
  },
  personal:{
    fields:[{key:'activity',label:'Activity',type:'text',placeholder:'What did you do?'}],
    ratings:[{key:'energy',label:'Energy level',max:5}],
    moods:{key:'mood',label:'Mood',opts:['😊 Happy','😌 Calm','😐 Neutral','😔 Low','😤 Frustrated']},
  },
  free:{
    fields:[{key:'activity',label:'Activity',type:'text',placeholder:'What did you enjoy?'}],
    ratings:[{key:'enjoyment',label:'Enjoyment',max:5}],
    moods:null,
  },
};
const DEFAULT_SCHEMA = {
  fields:[
    {key:'activity',label:'What did you do?',type:'text',placeholder:'Describe the activity...'},
    {key:'details',label:'Details / notes',type:'textarea',placeholder:'Any specifics worth logging...'},
  ],
  ratings:[{key:'energy',label:'Energy level',max:5},{key:'enjoyment',label:'Enjoyment',max:5}],
  moods:{key:'mood',label:'How did it feel?',opts:['😊 Great','👍 Good','😐 Okay','😔 Low','😤 Tough']},
};
const getSchema = id => CAT_DETAILS[id] || DEFAULT_SCHEMA;

// ---- Wheel of Life areas ----
const WHEEL_AREAS = [
  {key:'health',       label:'Health',    icon:'🏃'},
  {key:'work',         label:'Work',      icon:'💼'},
  {key:'social',       label:'Social',    icon:'❤️'},
  {key:'finance',      label:'Finance',   icon:'💰'},
  {key:'growth',       label:'Growth',    icon:'📚'},
  {key:'rest',         label:'Rest',      icon:'😴'},
  {key:'fun',          label:'Fun',       icon:'🎉'},
  {key:'mindfulness',  label:'Mind',      icon:'🧘'},
];

// ---- Mood options ----
const MOODS = [
  {value:'great',   label:'Great',   icon:'😊', score:5, col:'#34d399'},
  {value:'good',    label:'Good',    icon:'😌', score:4, col:'#a3e635'},
  {value:'okay',    label:'Okay',    icon:'😐', score:3, col:'#fbbf24'},
  {value:'low',     label:'Low',     icon:'😔', score:2, col:'#f87171'},
  {value:'stressed',label:'Stressed',icon:'😤', score:1, col:'#c084fc'},
];

// ---- Themes ----
const THEMES = {
  dark:{
    BG:'#0a0a12',PANEL:'#111120',CARD:'#181828',
    B1:'rgba(255,255,255,0.06)',B2:'rgba(255,255,255,0.11)',
    TEXT:'#e2e2f0',MUTED:'#52527a',ACCENT:'#8b7cf8',
    SUCCESS:'#34d399',DANGER:'#f87171',WARN:'#fbbf24',
  },
  light:{
    BG:'#f3f3fc',PANEL:'#ffffff',CARD:'#eaeaf6',
    B1:'rgba(0,0,0,0.06)',B2:'rgba(0,0,0,0.12)',
    TEXT:'#1a1a2e',MUTED:'#8080aa',ACCENT:'#6c5ce7',
    SUCCESS:'#059669',DANGER:'#dc2626',WARN:'#d97706',
  },
};

// ---- Helpers ----
const hexToRgb = h => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `${r},${g},${b}`; };
const makeCat  = (id,label,icon,col) => ({id,label,icon,col,fill:`rgba(${hexToRgb(col)},0.15)`,border:`rgba(${hexToRgb(col)},0.5)`});
const pad      = n => String(n).padStart(2,'0');
const m2s      = m => `${pad(Math.floor(m/60)%24)}:${pad(m%60)}`;
const s2m      = s => { const [h,mn]=s.split(':').map(Number); return h*60+mn; };
const hLbl     = h => h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
const localStr = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today    = () => localStr();
const addDays  = (ds,n) => { const d=new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n); return localStr(d); };
const weekOf   = ds => { const d=new Date(ds+'T00:00:00'),day=d.getDay(); return Array.from({length:7},(_,i)=>{ const n=new Date(d); n.setDate(d.getDate()-day+i); return localStr(n); }); };
const monthOf  = ds => { const d=new Date(ds+'T00:00:00'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; };
const fmtD     = s => new Date(s+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const fmtMonth = s => { const [y,m]=s.split('-'); return new Date(y,m-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}); };
const catOf    = (cats,id) => cats.find(c=>c.id===id)||cats[0];
const mLbl     = m => { const h=Math.floor(m/60),mn=m%60; return h>0?(mn>0?`${h}h ${mn}m`:`${h}h`):`${mn}m`; };
const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HH=52, LW=46;
const lsGet    = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const lsSet    = (k,v)  => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };

const RECUR_OPTIONS = [
  {id:'none',label:'No repeat',short:'Once'},{id:'daily',label:'Every day',short:'Daily'},
  {id:'weekdays',label:'Weekdays',short:'Weekdays'},{id:'3x',label:'3x weekly',short:'3x/wk'},
  {id:'weekly',label:'Weekly',short:'Weekly'},{id:'custom',label:'Custom days',short:'Custom'},
];
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const EMOJI_PALETTE = ['🏋️','🧘','🎨','📚','🎵','🚗','🏠','💊','🛒','🧹','🐾','🌍','🎯','💡','🧪','📞','🎮','🍕','🧃','🌸','🏄','🎤','🖊️','📷','🎬','🧠','⚡','🔧'];
const COLOR_PALETTE = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#818cf8','#a78bfa','#f472b6','#e879f9','#94a3b8'];

const doesRecurOn = (block,ds) => {
  if (!block.recur||block.recur.type==='none') return block.date===ds;
  const origin=new Date(block.date+'T00:00:00'),target=new Date(ds+'T00:00:00');
  if (target<origin) return false;
  const dow=target.getDay();
  switch(block.recur.type){
    case 'daily':    return true;
    case 'weekdays': return dow>=1&&dow<=5;
    case '3x':       return [1,3,5].includes(dow);
    case 'weekly':   return dow===origin.getDay();
    case 'custom':   return (block.recur.days||[]).includes(dow);
    default:         return block.date===ds;
  }
};

// ---- Rules-based insights engine ----
const computeInsights = (blocks,goals,moods,reviews,cats) => {
  const td=today();
  const insights=[];

  // Sleep analysis
  const sleepDets = blocks.filter(b=>b.cat==='sleep')
    .flatMap(b=>Object.entries(b.detailsByDate||{})
      .filter(([d])=>d>=addDays(td,-14)&&d<=td)
      .map(([d,det])=>({date:d,quality:Number(det.quality||0),hours:parseFloat(det.hours)||0})));
  if (sleepDets.length>=3) {
    const avgQ=sleepDets.reduce((s,d)=>s+d.quality,0)/sleepDets.length;
    const hoursArr=sleepDets.filter(d=>d.hours>0);
    const avgH=hoursArr.length?hoursArr.reduce((s,d)=>s+d.hours,0)/hoursArr.length:0;
    if (avgQ>=4) insights.push({type:'positive',icon:'✨',title:'Excellent sleep quality',body:`Your sleep quality averages ${avgQ.toFixed(1)}/5 over 2 weeks. Quality sleep is the foundation of everything else.`});
    else if (avgQ<3&&avgQ>0) insights.push({type:'warning',icon:'😴',title:'Sleep quality needs attention',body:`Your average sleep quality is ${avgQ.toFixed(1)}/5. Poor sleep affects mood, focus, and metabolism — it's worth prioritising.`});
    if (avgH>0&&avgH<6.5) insights.push({type:'warning',icon:'⏰',title:'You may be under-sleeping',body:`Average ${avgH.toFixed(1)}h logged. Most adults need 7–9h for peak performance. Even one extra hour could meaningfully improve your energy.`});
    if (avgH>=7.5) insights.push({type:'positive',icon:'🌙',title:'Great sleep duration',body:`Averaging ${avgH.toFixed(1)} hours — you're in the optimal range. Keep protecting this time.`});
  }

  // Workout consistency
  blocks.filter(b=>b.cat==='workout'&&b.recur&&b.recur.type!=='none').forEach(b=>{
    let scheduled=0,done=0;
    for(let i=0;i<14;i++){
      const d=addDays(td,-i); if(d<b.date) break;
      if(!doesRecurOn(b,d)) continue;
      scheduled++;
      if(b.overrides?.[d]?.status==='done') done++;
    }
    if(scheduled>=2){
      const pct=Math.round((done/scheduled)*100);
      if(pct>=80) insights.push({type:'positive',icon:'💪',title:`${b.label} habit is strong`,body:`${done}/${scheduled} sessions done (${pct}%) in 2 weeks. You're building genuine consistency.`});
      else if(pct<50) insights.push({type:'warning',icon:'📉',title:`${b.label} consistency is slipping`,body:`Only ${done}/${scheduled} sessions (${pct}%). Consider reducing the frequency temporarily — consistency matters more than volume.`});
    }
  });

  // Mood trend
  const recentMoods=moods.filter(m=>m.date>=addDays(td,-7));
  if(recentMoods.length>=3){
    const avgScore=recentMoods.reduce((s,m)=>{const mo=MOODS.find(x=>x.value===m.value);return s+(mo?.score||3);},0)/recentMoods.length;
    if(avgScore>=4.2) insights.push({type:'positive',icon:'😊',title:'Strong mood this week',body:`Your average mood score is ${avgScore.toFixed(1)}/5. Notice what conditions are creating this — replicate them intentionally.`});
    else if(avgScore<2.5) insights.push({type:'alert',icon:'❤️',title:'Your mood has been low',body:'Several low or stressed moods logged this week. This is worth paying attention to. What\'s one thing you could change or remove to lighten the load?'});
    // Mood + workout correlation
    const workoutDays=new Set(blocks.filter(b=>b.cat==='workout').flatMap(b=>Object.keys(b.overrides||{}).filter(d=>b.overrides[d]?.status==='done')));
    const moodsAfterWorkout=recentMoods.filter(m=>workoutDays.has(m.date));
    const moodsNoWorkout=recentMoods.filter(m=>!workoutDays.has(m.date));
    if(moodsAfterWorkout.length>=2&&moodsNoWorkout.length>=2){
      const avgW=moodsAfterWorkout.reduce((s,m)=>{const mo=MOODS.find(x=>x.value===m.value);return s+(mo?.score||3);},0)/moodsAfterWorkout.length;
      const avgNW=moodsNoWorkout.reduce((s,m)=>{const mo=MOODS.find(x=>x.value===m.value);return s+(mo?.score||3);},0)/moodsNoWorkout.length;
      if(avgW-avgNW>=0.8) insights.push({type:'tip',icon:'🔗',title:'Workout days = better mood',body:`Your mood scores ${(avgW-avgNW).toFixed(1)} points higher on workout days. This is your data telling you something important.`});
    }
  }

  // Calorie pattern
  const calorieDays=blocks.filter(b=>b.cat==='meal').flatMap(b=>
    Object.entries(b.detailsByDate||{}).filter(([d])=>d>=addDays(td,-7)&&d<=td)
      .map(([d,det])=>({date:d,kcal:Number(det.calories||0)}))
  ).reduce((acc,{date,kcal})=>{acc[date]=(acc[date]||0)+kcal;return acc;},{});
  const kcalArr=Object.values(calorieDays).filter(v=>v>0);
  if(kcalArr.length>=3){
    const avg=Math.round(kcalArr.reduce((s,v)=>s+v,0)/kcalArr.length);
    if(avg>0) insights.push({type:'tip',icon:'🍽️',title:`Avg ${avg} kcal/day this week`,body:avg<1400?'Your calorie intake looks low — make sure you\'re fuelling properly for your activity level.':avg>2800?'Higher calorie days this week. Worth checking if this aligns with your energy output.':'Calorie intake looks balanced. Keep logging meals to track trends over time.'});
  }

  // Work focus/productivity
  const workDets=blocks.filter(b=>b.cat==='work')
    .flatMap(b=>Object.entries(b.detailsByDate||{}).filter(([d])=>d>=addDays(td,-7)).map(([,det])=>det));
  if(workDets.length>=2){
    const avgFocus=workDets.filter(d=>d.focus).reduce((s,d)=>s+Number(d.focus),0)/Math.max(workDets.filter(d=>d.focus).length,1);
    const avgProd=workDets.filter(d=>d.productivity).reduce((s,d)=>s+Number(d.productivity),0)/Math.max(workDets.filter(d=>d.productivity).length,1);
    if(avgFocus>=4&&avgProd>=4) insights.push({type:'positive',icon:'🎯',title:'High-focus work week',body:`Focus ${avgFocus.toFixed(1)}/5, productivity ${avgProd.toFixed(1)}/5. You're in a productive rhythm — protect your schedule.`});
    else if(avgFocus<3&&avgFocus>0) insights.push({type:'tip',icon:'💡',title:'Focus has been fragmented',body:`Average focus of ${avgFocus.toFixed(1)}/5 this week. Consider time-blocking deep work first thing in the morning before distractions build up.`});
  }

  // Goals without milestones
  const unplanned=goals.filter(g=>!g.done&&(!g.milestones||g.milestones.length===0)&&g.month===monthOf(td));
  if(unplanned.length>0) insights.push({type:'tip',icon:'🎯',title:`${unplanned.length} goal${unplanned.length>1?'s':''}  without milestones`,body:'Goals with weekly milestones are significantly more likely to be achieved. Tap "Week" on any goal to break it down.'});

  // No reviews lately
  const recentReviews=reviews.filter(r=>r.date>=addDays(td,-5)&&r.saved);
  if(recentReviews.length===0) insights.push({type:'tip',icon:'📝',title:'No recent daily reviews',body:'You haven\'t done a daily review in 5+ days. Even 2 minutes of end-of-day reflection measurably improves next-day output.'});

  // Positive catch-all if nothing bad
  if(insights.filter(i=>i.type==='warning'||i.type==='alert').length===0&&insights.length>=2){
    insights.push({type:'positive',icon:'🌟',title:'Things are looking good',body:'No major concerns in your data this week. Keep logging consistently — the more data, the better your insights become.'});
  }

  return insights.slice(0,8);
};

// ---- Radar chart component ----
const RadarChart = ({ratings={},prevRatings=null,areas,size=220,C}) => {
  const cx=size/2,cy=size/2,r=size*0.33,n=areas.length;
  const pt=(i,val)=>{
    const angle=(i*2*Math.PI/n)-Math.PI/2;
    const ratio=Math.max(0,Math.min(val,10))/10;
    return {x:cx+r*ratio*Math.cos(angle),y:cy+r*ratio*Math.sin(angle)};
  };
  const axEnd=i=>{
    const angle=(i*2*Math.PI/n)-Math.PI/2;
    return {x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle)};
  };
  const poly=pts=>pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+'Z';
  const curPts=areas.map((a,i)=>pt(i,ratings[a.key]||0));
  const prevPts=prevRatings?areas.map((a,i)=>pt(i,prevRatings[a.key]||0)):null;
  return (
    <svg width={size} height={size} style={{overflow:'visible',display:'block',margin:'0 auto'}}>
      {[2,4,6,8,10].map(lvl=>(
        <path key={lvl} d={poly(areas.map((_,i)=>pt(i,lvl)))} fill="none" stroke={C.B1} strokeWidth={1}/>
      ))}
      {areas.map((_,i)=>{const e=axEnd(i);return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke={C.B2} strokeWidth={1}/>;} )}
      {prevPts&&<path d={poly(prevPts)} fill="none" stroke="rgba(139,124,248,0.3)" strokeWidth={1.5} strokeDasharray="4,3"/>}
      <path d={poly(curPts)} fill="rgba(139,124,248,0.18)" stroke={C.ACCENT} strokeWidth={2.5}/>
      {curPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={3.5} fill={C.ACCENT}/>)}
      {areas.map((a,i)=>{
        const angle=(i*2*Math.PI/n)-Math.PI/2;
        const lr=r*1.32;
        const x=cx+lr*Math.cos(angle),y=cy+lr*Math.sin(angle);
        const val=ratings[a.key]||0;
        const col=val>=7?C.SUCCESS:val>=4?C.WARN:val>0?C.DANGER:C.MUTED;
        return (
          <g key={i}>
            <text x={x} y={y-7} textAnchor="middle" fontSize={9} fill={C.MUTED}>{a.icon} {a.label}</text>
            <text x={x} y={y+8} textAnchor="middle" fontSize={11} fill={col} fontWeight="700">{val||'--'}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ---- Stars component ----
const Stars = ({value=0,max=5,onChange,color='#8b7cf8'}) => (
  <div style={{display:'flex',gap:4}}>
    {Array.from({length:max},(_,i)=>(
      <button key={i} onClick={()=>onChange(i+1===value?0:i+1)}
        style={{background:'none',border:'none',cursor:'pointer',fontSize:22,padding:0,lineHeight:1,
          color:i<value?color:'rgba(128,128,160,0.3)'}}>
        {i<value?'★':'☆'}
      </button>
    ))}
  </div>
);

// ---- Onboarding slides ----
const ONBOARD_SLIDES = [
  {icon:'🌅',title:'Your Life Companion',body:'More than a planner — this app tracks every dimension of your life and learns from your patterns to help you thrive.'},
  {icon:'📅',title:'Plan & track your day',body:'Tap the timeline to add blocks. Use the drag handle to reschedule. Tap the log icon on any block to record details.'},
  {icon:'🔥',title:'Build real habits',body:'Any recurring block becomes a tracked habit with streaks, a weekly grid, and 30-day consistency. Your data builds over time.'},
  {icon:'🌍',title:'Wheel of Life + AI insights',body:'Rate 8 life dimensions weekly and get AI-powered analysis of your patterns — what\'s working, what\'s not, and what to do next.'},
];

// ---- Error Boundary ----

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return{hasError:true,error}; }
  componentDidCatch(error,info){ console.error('[LifeOS] Crash:',error,info); }
  render(){
    if(!this.state.hasError) return this.props.children;
    return(
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#0a0a12',color:'#e2e2f0',padding:32,textAlign:'center',fontFamily:'system-ui,sans-serif'}}>
        <div style={{fontSize:52,marginBottom:16}}>😔</div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Something went wrong</div>
        <div style={{fontSize:14,color:'#52527a',marginBottom:24,lineHeight:1.7}}>Don't worry — your data is safe in your browser.<br/>Reload the page to continue.</div>
        <div style={{fontSize:11,color:'#52527a',background:'#181828',padding:'8px 14px',borderRadius:8,marginBottom:24,maxWidth:360,wordBreak:'break-all'}}>
          {this.state.error?.message||'Unknown error'}
        </div>
        <button onClick={()=>window.location.reload()} style={{padding:'12px 28px',background:'#8b7cf8',border:'none',borderRadius:12,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>Reload app</button>
        <button onClick={()=>this.setState({hasError:false,error:null})} style={{marginTop:12,padding:'8px 20px',background:'transparent',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,color:'#52527a',fontSize:13,cursor:'pointer'}}>Try to recover</button>
      </div>
    );
  }
}

// ====================================================================
export default function App() {
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}

function AppInner() {
  const td=today();
  const nowH=new Date().getHours();

  // ---- Persisted state ----
  const [theme,      setTheme]      = useState(()=>lsGet('ph_theme','dark'));
  const [cats,       setCats]       = useState(()=>lsGet('ph_cats',DEFAULT_CATS));
  const [blocks,     setBlocks]     = useState(()=>lsGet('ph_blocks',[]));
  const [goals,      setGoals]      = useState(()=>lsGet('ph_goals',[]));
  const [entries,    setEntries]    = useState(()=>lsGet('ph_entries',[]));
  const [reviews,    setReviews]    = useState(()=>lsGet('ph_reviews',[]));
  const [templates,  setTemplates]  = useState(()=>lsGet('ph_templates',[]));
  const [moodLog,    setMoodLog]    = useState(()=>lsGet('ph_moods',[]));
  const [wheelData,  setWheelData]  = useState(()=>lsGet('ph_wheel',[]));
  const [aiInsight,  setAiInsight]  = useState(()=>lsGet('ph_ai_insight',null));
  const [onboarded,  setOnboarded]  = useState(()=>lsGet('ph_onboarded',false));
  const [userName,   setUserName]   = useState(()=>lsGet('ph_username',''));
  const [wardrobe,      setWardrobe]      = useState(()=>lsGet('ph_wardrobe',[]));
  const [hydration,     setHydration]     = useState(()=>lsGet('ph_hydration',{}));
  const [hydrationGoal, setHydrationGoal] = useState(()=>lsGet('ph_hydration_goal',8));
  const [outfits,       setOutfits]       = useState(()=>lsGet('ph_outfits',[]));
  const [outfitPlan,    setOutfitPlan]    = useState(()=>lsGet('ph_outfit_plan',{}));
  const [expenses,      setExpenses]      = useState(()=>lsGet('ph_expenses',[]));
  const [budgets,       setBudgets]       = useState(()=>lsGet('ph_budgets',{}));
  const [expenseCats,   setExpenseCats]   = useState(()=>lsGet('ph_expense_cats',[
    {id:'food',        label:'Food',          icon:'🍕', col:'#fb923c'},
    {id:'transport',   label:'Transport',     icon:'🚗', col:'#60a5fa'},
    {id:'shopping',    label:'Shopping',      icon:'🛍️', col:'#f472b6'},
    {id:'health',      label:'Health',        icon:'💊', col:'#34d399'},
    {id:'entertainment',label:'Entertainment',icon:'🎬', col:'#a78bfa'},
    {id:'bills',       label:'Bills',         icon:'📄', col:'#fbbf24'},
    {id:'other',       label:'Other',         icon:'📦', col:'#94a3b8'},
  ]));

  // ---- UI state ----
  const [tab,          setTab]          = useState('home');
  const [planSubTab,   setPlanSubTab]   = useState('schedule');
  const [lifeSubTab,   setLifeSubTab]   = useState('mood');
  const [showMore,     setShowMore]     = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [thought,      setThought]      = useState('');
  const [pom,          setPom]          = useState({mode:'work',t:40*60,run:false,sess:0});
  const [curDay,       setCurDay]       = useState(td);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState({label:'',cat:'sleep',start:'08:00',end:'09:00',recur:{type:'none',days:[]}});
  const [showSum,      setShowSum]      = useState(false);
  const [curMonth,     setCurMonth]     = useState(()=>monthOf(td));
  const [goalForm,     setGoalForm]     = useState({text:'',month:monthOf(td)});
  const [catForm,      setCatForm]      = useState({label:'',icon:'🎯',col:'#8b7cf8'});
  const [showPicker,   setShowPicker]   = useState('');
  const [wgForm,       setWgForm]       = useState({goalId:'',week:'',text:''});
  const [detailCtx,    setDetailCtx]    = useState(null);
  const [detailData,   setDetailData]   = useState({});
  const [showSearch,   setShowSearch]   = useState(false);
  const [searchQ,      setSearchQ]      = useState('');
  const [showReview,   setShowReview]   = useState(false);
  const [reviewForm,   setReviewForm]   = useState({good:'',improve:'',tomorrow:'',mood:''});
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates,setShowTemplates]= useState(false);
  const [tplName,      setTplName]      = useState('');
  const [notifPerm,    setNotifPerm]    = useState(()=>'Notification' in window?Notification.permission:'denied');
  const [showOb,       setShowOb]       = useState(false);
  const [obStep,       setObStep]       = useState(0);
  const [obNameInput,  setObNameInput]  = useState('');
  const [pwaPrompt,    setPwaPrompt]    = useState(null);
  const [showPwaBanner,setShowPwaBanner]= useState(false);
  const [dragging,     setDragging]     = useState(null);
  const [dragDelta,    setDragDelta]    = useState(0);
  // Morning card
  const [morningOpen,  setMorningOpen]  = useState(()=>lsGet('ph_morning_date','')<td);
  // Mood modal
  const [showMoodLog,  setShowMoodLog]  = useState(false);
  const [moodForm,     setMoodForm]     = useState({value:'okay',note:'',time:''});
  // Wheel of life
  const [showWheel,    setShowWheel]    = useState(false);
  const [wheelForm,    setWheelForm]    = useState({});
  // AI insight
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiError,      setAiError]      = useState('');
  // Wardrobe
  const [wardrobeView, setWardrobeView] = useState('wardrobe'); // 'wardrobe' | 'calendar' | 'outfits'
  const [showAddItem,  setShowAddItem]  = useState(false);
  const [showAddOutfit,setShowAddOutfit]= useState(false);
  const [showAssign,   setShowAssign]   = useState(null); // dateStr
  const [itemForm,     setItemForm]     = useState({name:'',category:'tops',photo:''});
  const [outfitForm,   setOutfitForm]   = useState({name:'',itemIds:[]});
  const [wardrobeCurDay, setWardrobeCurDay] = useState(td);
  const [expandedCat,  setExpandedCat]  = useState(null);
  // Expenses
  const [expenseView,    setExpenseView]    = useState('log');   // 'log' | 'budget' | 'analytics'
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddExpCat,  setShowAddExpCat]  = useState(false);
  const [showSetBudget,  setShowSetBudget]  = useState(false);
  const [expCurMonth,    setExpCurMonth]    = useState(()=>monthOf(today()));
  const [expForm,        setExpForm]        = useState({amount:'',catId:'food',note:'',date:today()});
  const [expCatForm,     setExpCatForm]     = useState({label:'',icon:'💳',col:'#8b7cf8'});
  const [budgetForm,     setBudgetForm]     = useState({});

  const C        = THEMES[theme];
  const pomRef   = useRef(null);
  const scrollRef= useRef(null);
  const dragRef  = useRef(null);

  const inp  = {background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:14,padding:'9px 11px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit'};
  const btn  = (x={}) => ({background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.MUTED,padding:'8px 14px',cursor:'pointer',fontSize:13,fontFamily:'inherit',...x});
  const lbl  = {fontSize:10,color:C.MUTED,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:0.8};
  const lbl2 = {fontSize:11,color:C.MUTED,marginBottom:5,display:'block'};

  // ---- Persist ----
  useEffect(()=>lsSet('ph_theme',theme),[theme]);
  useEffect(()=>lsSet('ph_cats',cats),[cats]);
  useEffect(()=>lsSet('ph_blocks',blocks),[blocks]);
  useEffect(()=>lsSet('ph_goals',goals),[goals]);
  useEffect(()=>lsSet('ph_entries',entries),[entries]);
  useEffect(()=>lsSet('ph_reviews',reviews),[reviews]);
  useEffect(()=>lsSet('ph_templates',templates),[templates]);
  useEffect(()=>lsSet('ph_moods',moodLog),[moodLog]);
  useEffect(()=>lsSet('ph_wheel',wheelData),[wheelData]);
  useEffect(()=>lsSet('ph_ai_insight',aiInsight),[aiInsight]);
  useEffect(()=>lsSet('ph_onboarded',onboarded),[onboarded]);
  useEffect(()=>lsSet('ph_username',userName),[userName]);
  useEffect(()=>lsSet('ph_wardrobe',wardrobe),[wardrobe]);
  useEffect(()=>lsSet('ph_hydration',hydration),[hydration]);
  useEffect(()=>lsSet('ph_hydration_goal',hydrationGoal),[hydrationGoal]);
  useEffect(()=>lsSet('ph_outfits',outfits),[outfits]);
  useEffect(()=>lsSet('ph_outfit_plan',outfitPlan),[outfitPlan]);
  useEffect(()=>lsSet('ph_expenses',expenses),[expenses]);
  useEffect(()=>lsSet('ph_budgets',budgets),[budgets]);
  useEffect(()=>lsSet('ph_expense_cats',expenseCats),[expenseCats]);

  // Capture PWA install prompt
  useEffect(()=>{
    const handler=e=>{e.preventDefault();setPwaPrompt(e);setShowPwaBanner(true);};
    window.addEventListener('beforeinstallprompt',handler);
    return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);

  // ---- Init ----
  useEffect(()=>{
    if(!onboarded) setTimeout(()=>setShowOb(true),500);
    const f=entries.find(e=>e.date===td);
    setThought(f?f.draft||'':'');
    if('Notification' in window) setNotifPerm(Notification.permission);
  },[]);

  useEffect(()=>{if(notifPerm==='granted') scheduleNotifs();},[blocks,notifPerm]);

  // ---- Pomodoro ----
  useEffect(()=>{
    if(pom.run){
      pomRef.current=setInterval(()=>setPom(p=>{
        if(p.t<=1){clearInterval(pomRef.current);return p.mode==='work'?{...p,t:15*60,mode:'break',run:false,sess:p.sess+1}:{...p,t:40*60,mode:'work',run:false};}
        return{...p,t:p.t-1};
      }),1000);
    }else clearInterval(pomRef.current);
    return()=>clearInterval(pomRef.current);
  },[pom.run]);

  const navDay = dir => setCurDay(p=>addDays(p,dir));

  // ---- Block helpers ----
  const getDayBlocks = ds => {
    const res=[];
    for(const b of blocks){
      if(doesRecurOn(b,ds)){
        const ov=b.overrides?.[ds];
        const dispS=dragging===b.id?Math.max(0,Math.min((dragRef.current?.origS||b.s)+dragDelta,23*60)):b.s;
        const dur=b.e-b.s;
        const dispE=dragging===b.id?Math.min(dispS+dur,24*60):b.e;
        res.push({...b,status:ov?.status??'pending',_origS:b.s,_origE:b.e,s:dispS,e:dispE});
      }
    }
    return res.sort((a,b)=>a.s-b.s);
  };

  const setRecurStatus=(block,ds,status)=>setBlocks(p=>p.map(b=>b.id!==block.id?b:{...b,overrides:{...(b.overrides||{}),[ds]:{...(b.overrides?.[ds]||{}),status}}}));

  const openAdd=y=>{
    const s=Math.min(Math.max(Math.round(y/HH*60/15)*15,0),23*60);
    setForm({label:'',cat:cats[0]?.id||'sleep',start:m2s(s),end:m2s(Math.min(s+60,23*60+45)),recur:{type:'none',days:[]}});
    setModal({mode:'add'});
  };
  const openEdit=(e,b)=>{e.stopPropagation();setForm({label:b.label,cat:b.cat,start:m2s(b._origS||b.s),end:m2s(b._origE||b.e),recur:b.recur||{type:'none',days:[]}});setModal({mode:'edit',id:b.id});};
  const saveBlock=()=>{
    const s=s2m(form.start),e_raw=s2m(form.end),e=e_raw===0?24*60:e_raw;if(e<=s)return;
    const label=form.label||catOf(cats,form.cat).label;
    setBlocks(p=>modal.mode==='add'?[...p,{id:Date.now()+'',date:curDay,label,cat:form.cat,s,e,recur:form.recur}]:p.map(b=>b.id===modal.id?{...b,label,cat:form.cat,s,e,recur:form.recur}:b));
    setModal(null);
  };
  const delBlock=()=>{setBlocks(p=>p.filter(b=>b.id!==modal.id));setModal(null);};

  // ---- Drag to reschedule ----
  const onDragStart=(e,block)=>{
    e.stopPropagation();e.preventDefault();
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    dragRef.current={blockId:block.id,startY:clientY,origS:block._origS||block.s,origE:block._origE||block.e};
    setDragging(block.id);setDragDelta(0);
  };
  const onDragMove=e=>{
    if(!dragRef.current)return;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    const deltaY=clientY-dragRef.current.startY;
    setDragDelta(Math.round(deltaY/HH*60/15)*15);
  };
  const onDragEnd=()=>{
    if(!dragRef.current)return;
    const{blockId,origS,origE}=dragRef.current;
    if(dragDelta!==0){
      const dur=origE-origS;
      const newS=Math.max(0,Math.min(origS+dragDelta,23*60));
      setBlocks(p=>p.map(b=>b.id===blockId?{...b,s:newS,e:Math.min(newS+dur,24*60)}:b));
    }
    setDragging(null);setDragDelta(0);dragRef.current=null;
  };

  // ---- Block details ----
  const getDetails  =(block,ds)=>block.detailsByDate?.[ds]||{};
  const hasDetails  =(block,ds)=>{const d=getDetails(block,ds);return Object.keys(d).some(k=>{const v=d[k];return v&&(Array.isArray(v)?v.length>0:String(v).trim()!=='');});};
  const openDetails =(e,block,ds)=>{e.stopPropagation();setDetailData({exercises:[],notes:'',...getDetails(block,ds)});setDetailCtx({block,dateStr:ds});};
  const saveDetails =()=>{if(!detailCtx)return;const{block,dateStr}=detailCtx;setBlocks(p=>p.map(b=>b.id!==block.id?b:{...b,detailsByDate:{...(b.detailsByDate||{}),[dateStr]:detailData}}));setDetailCtx(null);};
  const setDet=(k,v)=>setDetailData(d=>({...d,[k]:v}));

  const getLastSession=block=>{
    const dates=Object.keys(block.detailsByDate||{}).filter(d=>d<td&&Object.keys(block.detailsByDate[d]).length>1).sort().reverse();
    return dates.length?{date:dates[0],data:block.detailsByDate[dates[0]]}:null;
  };

  // ---- Habits / streaks ----
  const habitBlocks=useMemo(()=>blocks.filter(b=>b.recur&&b.recur.type!=='none'),[blocks]);

  const calcStreak=block=>{
    let streak=0;
    for(let i=0;i<90;i++){
      const d=addDays(td,-i);if(d<block.date)break;
      if(!doesRecurOn(block,d))continue;
      const s=block.overrides?.[d]?.status??'pending';
      if(s==='done')streak++;
      else if(d===td)continue;
      else break;
    }
    return streak;
  };

  const calcConsistency=(block,days=30)=>{
    let scheduled=0,done=0;
    for(let i=0;i<days;i++){
      const d=addDays(td,-i);if(d<block.date)break;
      if(!doesRecurOn(block,d))continue;
      scheduled++;
      if(block.overrides?.[d]?.status==='done')done++;
    }
    return scheduled>0?Math.round((done/scheduled)*100):0;
  };

  const getWeekGrid=block=>weekOf(td).map(d=>{
    if(d>td)return'future';
    if(!doesRecurOn(block,d))return'off';
    return block.overrides?.[d]?.status??'pending';
  });

  // ---- Categories ----
  const saveNewCat=()=>{if(!catForm.label.trim())return;setCats(p=>[...p,makeCat('cat_'+Date.now(),catForm.label.trim(),catForm.icon,catForm.col)]);setModal(null);setCatForm({label:'',icon:'🎯',col:'#8b7cf8'});};
  const deleteCat=id=>{if(DEFAULT_CATS.find(c=>c.id===id))return;setCats(p=>p.filter(c=>c.id!==id));setBlocks(p=>p.filter(b=>b.cat!==id));};

  // ---- Goals ----
  const saveGoal    =()=>{if(!goalForm.text.trim())return;setGoals(p=>[...p,{id:Date.now()+'',text:goalForm.text.trim(),month:goalForm.month,milestones:[],done:false}]);setGoalForm({text:'',month:monthOf(td)});setModal(null);};
  const toggleGoal  =id=>setGoals(p=>p.map(g=>g.id===id?{...g,done:!g.done}:g));
  const removeGoal  =id=>setGoals(p=>p.filter(g=>g.id!==id));
  const addMstone   =()=>{if(!wgForm.text.trim()||!wgForm.week.trim())return;setGoals(p=>p.map(g=>g.id===wgForm.goalId?{...g,milestones:[...(g.milestones||[]),{id:Date.now()+'',week:wgForm.week,text:wgForm.text.trim(),done:false}]}:g));setModal(null);};
  const toggleMstone=(gid,mid)=>setGoals(p=>p.map(g=>g.id===gid?{...g,milestones:(g.milestones||[]).map(m=>m.id===mid?{...m,done:!m.done}:m)}:g));
  const removeMstone=(gid,mid)=>setGoals(p=>p.map(g=>g.id===gid?{...g,milestones:(g.milestones||[]).filter(m=>m.id!==mid)}:g));
  const goalProg    =g=>{const ms=g.milestones||[];if(!ms.length)return null;return{done:ms.filter(m=>m.done).length,total:ms.length};};

  // ---- Notes ----
  const saveDailyEntry=()=>{
    if(!thought.trim())return;
    setEntries(p=>{const i=p.findIndex(e=>e.date===td);const en={date:td,draft:thought,saved:new Date().toISOString()};if(i>=0){const n=[...p];n[i]=en;return n;}return[...p,en];});
    alert('Entry saved');
  };
  const updateDraft=val=>{
    setThought(val);
    setEntries(p=>{const i=p.findIndex(e=>e.date===td);if(i>=0){const n=[...p];n[i]={...n[i],draft:val};return n;}return[...p,{date:td,draft:val,saved:null}];});
  };

  // ---- Daily review ----
  const todayReview=reviews.find(r=>r.date===td);
  const saveReview=()=>{
    if(!reviewForm.good.trim()&&!reviewForm.improve.trim()&&!reviewForm.tomorrow.trim())return;
    setReviews(p=>{const i=p.findIndex(r=>r.date===td);const en={...reviewForm,date:td,saved:new Date().toISOString()};if(i>=0){const n=[...p];n[i]=en;return n;}return[...p,en];});
    setShowReview(false);
  };

  // ---- Templates ----
  const saveTemplate=()=>{
    if(!tplName.trim())return;
    const bks=getDayBlocks(curDay).map(b=>({label:b.label,cat:b.cat,s:b._origS||b.s,e:b._origE||b.e,recur:{type:'none',days:[]}}));
    if(!bks.length){alert('No blocks on this day');return;}
    setTemplates(p=>[...p,{id:Date.now()+'',name:tplName.trim(),blocks:bks}]);
    setTplName('');setShowTemplates(false);
  };
  const applyTemplate=tpl=>{
    setBlocks(p=>[...p,...tpl.blocks.map(b=>({...b,id:Date.now()+Math.random()+'',date:curDay}))]);
    setShowTemplates(false);
  };

  // ---- Search ----
  const searchResults=useMemo(()=>{
    if(!searchQ.trim())return[];
    const q=searchQ.toLowerCase();
    return blocks.filter(b=>b.label.toLowerCase().includes(q)||catOf(cats,b.cat).label.toLowerCase().includes(q))
      .map(b=>({...b,_cat:catOf(cats,b.cat)}))
      .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  },[searchQ,blocks,cats]);

  // ---- Notifications ----
  const requestNotif=async()=>{
    if(!('Notification' in window))return;
    const p=await Notification.requestPermission();
    setNotifPerm(p);if(p==='granted')scheduleNotifs();
  };
  const scheduleNotifs=()=>{
    const now=new Date(),nowM=now.getHours()*60+now.getMinutes();
    getDayBlocks(td).forEach(b=>{
      const mins=b.s-nowM-5;
      if(mins>0&&mins<720) setTimeout(()=>{if(Notification.permission==='granted') new Notification(`Starting in 5 min: ${b.label}`,{body:`At ${m2s(b.s)}`});},mins*60*1000);
    });
  };

  // ---- Data export / import / clear ----
  const exportData=()=>{
    const payload={
      version:1,
      exportedAt:new Date().toISOString(),
      userName,
      theme,
      cats:cats.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id)), // only custom cats
      blocks,
      goals,
      entries,
      reviews,
      templates,
      moodLog,
      wheelData,
      aiInsight,
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`lifeos-backup-${td}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData=()=>{
    const input=document.createElement('input');
    input.type='file';
    input.accept='.json';
    input.onchange=e=>{
      const file=e.target.files?.[0];
      if(!file)return;
      const reader=new FileReader();
      reader.onload=ev=>{
        try{
          const data=JSON.parse(ev.target.result);
          if(!data.version||!data.blocks) throw new Error('Invalid backup file format');
          // Merge strategy: imported data is added if id doesn't already exist
          setBlocks(p=>{const ids=new Set(p.map(b=>b.id));return[...p,...(data.blocks||[]).filter(b=>!ids.has(b.id))];});
          setGoals(p=>{const ids=new Set(p.map(g=>g.id));return[...p,...(data.goals||[]).filter(g=>!ids.has(g.id))];});
          setEntries(p=>{const dates=new Set(p.map(e=>e.date));return[...p,...(data.entries||[]).filter(e=>!dates.has(e.date))];});
          setReviews(p=>{const dates=new Set(p.map(r=>r.date));return[...p,...(data.reviews||[]).filter(r=>!dates.has(r.date))];});
          setMoodLog(p=>{const ids=new Set(p.map(m=>m.id));return[...p,...(data.moodLog||[]).filter(m=>!ids.has(m.id))];});
          setWheelData(p=>{const wks=new Set(p.map(w=>w.week));return[...p,...(data.wheelData||[]).filter(w=>!wks.has(w.week))];});
          if(data.cats?.length) setCats(p=>{const ids=new Set(p.map(c=>c.id));return[...p,...data.cats.filter(c=>!ids.has(c.id))];});
          if(data.templates?.length) setTemplates(p=>{const ids=new Set(p.map(t=>t.id));return[...p,...data.templates.filter(t=>!ids.has(t.id))];});
          if(data.userName&&!userName) setUserName(data.userName);
          alert('Backup restored successfully!');
        }catch(err){
          alert('Failed to import: '+err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAllData=()=>{
    const allKeys=[
      'ph_cats','ph_blocks','ph_goals','ph_entries','ph_reviews',
      'ph_templates','ph_moods','ph_wheel','ph_ai_insight',
      'ph_onboarded','ph_username','ph_morning_date','ph_theme',
      'ph_expenses','ph_budgets','ph_expense_cats',
      'ph_wardrobe','ph_outfits','ph_outfit_plan',
      'ph_hydration','ph_hydration_goal',
    ];
    allKeys.forEach(k=>localStorage.removeItem(k));
    setCats(DEFAULT_CATS);setBlocks([]);setGoals([]);setEntries([]);
    setReviews([]);setTemplates([]);setMoodLog([]);setWheelData([]);
    setAiInsight(null);setExpenses([]);setBudgets({});
    setExpenseCats([
      {id:'food',label:'Food',icon:'🍕',col:'#fb923c'},
      {id:'transport',label:'Transport',icon:'🚗',col:'#60a5fa'},
      {id:'shopping',label:'Shopping',icon:'🛍️',col:'#f472b6'},
      {id:'health',label:'Health',icon:'💊',col:'#34d399'},
      {id:'entertainment',label:'Entertainment',icon:'🎬',col:'#a78bfa'},
      {id:'bills',label:'Bills',icon:'📄',col:'#fbbf24'},
      {id:'other',label:'Other',icon:'📦',col:'#94a3b8'},
    ]);
    setWardrobe([]);setOutfits([]);setOutfitPlan({});
    setHydration({});setHydrationGoal(8);setUserName('');
    setTheme('dark');setThought('');setTab('home');
    setOnboarded(false);setShowClearConfirm(false);
    setTimeout(()=>setShowOb(true),300);
  };

  // ---- Seed data for new users ----
  const seedDemoData=()=>{
    const seeds=[
      {id:'seed1',date:td,label:'Morning routine',cat:'personal',s:7*60,e:7*60+30,recur:{type:'daily',days:[]}},
      {id:'seed2',date:td,label:'Workout',cat:'workout',s:8*60,e:9*60,recur:{type:'3x',days:[]}},
      {id:'seed3',date:td,label:'Deep work',cat:'work',s:9*60,e:11*60,recur:{type:'weekdays',days:[]}},
      {id:'seed4',date:td,label:'Lunch',cat:'meal',s:13*60,e:13*60+30,recur:{type:'daily',days:[]}},
      {id:'seed5',date:td,label:'Evening wind-down',cat:'free',s:21*60,e:22*60,recur:{type:'daily',days:[]}},
      {id:'seed6',date:td,label:'Sleep',cat:'sleep',s:22*60+30,e:(24+7)*60,recur:{type:'daily',days:[]}},
    ];
    setBlocks(seeds);
  };

  // ---- Hydration helpers ----
  const todayGlasses = hydration[td] || 0;
  const addGlass     = (n=1) => setHydration(p=>({...p,[td]:Math.max(0,(p[td]||0)+n)}));
  const setGlasses   = (n)   => setHydration(p=>({...p,[td]:Math.max(0,n)}));
  const hydPct       = Math.min(todayGlasses/hydrationGoal,1);
  const hydColor     = hydPct>=1?C.SUCCESS:hydPct>=0.5?C.ACCENT:hydPct>=0.25?C.WARN:C.DANGER;

  // ---- Expense helpers ----
  const expCatOf = id => expenseCats.find(c=>c.id===id) || expenseCats[expenseCats.length-1] || {id:'other',label:'Other',icon:'📦',col:'#94a3b8'};

  const addExpense = () => {
    const amount = parseFloat(expForm.amount);
    if (!amount || amount <= 0 || !expForm.catId) return;
    setExpenses(p=>[...p,{
      id: Date.now()+'',
      amount,
      catId: expForm.catId,
      note: expForm.note.trim(),
      date: expForm.date || today(),
      createdAt: new Date().toISOString(),
    }]);
    setExpForm(f=>({...f, amount:'', note:''}));
    setShowAddExpense(false);
  };

  const deleteExpense = id => setExpenses(p=>p.filter(e=>e.id!==id));

  const saveNewExpCat = () => {
    if (!expCatForm.label.trim()) return;
    setExpenseCats(p=>[...p,{id:'ec_'+Date.now(),label:expCatForm.label.trim(),icon:expCatForm.icon,col:expCatForm.col}]);
    setExpCatForm({label:'',icon:'💳',col:'#8b7cf8'});
    setShowAddExpCat(false);
  };

  const deleteExpCat = id => {
    const defaults = ['food','transport','shopping','health','entertainment','bills','other'];
    if (defaults.includes(id)) return;
    setExpenseCats(p=>p.filter(c=>c.id!==id));
    setExpenses(p=>p.map(e=>e.catId===id?{...e,catId:'other'}:e));
  };

  const saveBudgets = () => {
    setBudgets(p=>({...p,[expCurMonth]:budgetForm}));
    setShowSetBudget(false);
  };

  // Expense computed values
  const monthExpenses     = expenses.filter(e=>monthOf(e.date)===expCurMonth);
  const monthBudget       = budgets[expCurMonth] || {};
  const monthTotal        = monthExpenses.reduce((s,e)=>s+e.amount, 0);
  const monthBudgetTotal  = Object.values(monthBudget).reduce((s,v)=>s+(Number(v)||0), 0);

  const spendByCat = expenseCats.map(cat=>({
    ...cat,
    spent:   monthExpenses.filter(e=>e.catId===cat.id).reduce((s,e)=>s+e.amount,0),
    budget:  Number(monthBudget[cat.id]||0),
  })).filter(c=>c.spent>0||c.budget>0);

  const maxSpend = Math.max(...spendByCat.map(c=>c.spent), 1);

  // Weekly spend for chart (last 7 days)
  const last7 = Array.from({length:7},(_,i)=>addDays(today(),-6+i));
  const weeklySpend = last7.map(d=>({
    date: d,
    day:  DAYS[new Date(d+'T00:00:00').getDay()].slice(0,2),
    total: expenses.filter(e=>e.date===d).reduce((s,e)=>s+e.amount,0),
  }));
  const maxDaily = Math.max(...weeklySpend.map(d=>d.total), 1);

  // Daily breakdown for selected month
  const dailyExpenses = monthExpenses.reduce((acc,e)=>{
    acc[e.date] = (acc[e.date]||[]);
    acc[e.date].push(e);
    return acc;
  },{});

  // ---- Wardrobe helpers ----
  const WARDROBE_CATS = [
    {id:'tops',      label:'Tops',       icon:'👕'},
    {id:'bottoms',   label:'Bottoms',    icon:'👖'},
    {id:'shoes',     label:'Shoes',      icon:'👟'},
    {id:'outerwear', label:'Outerwear',  icon:'🧥'},
    {id:'accessories',label:'Accessories',icon:'💍'},
    {id:'bags',      label:'Bags',       icon:'👜'},
    {id:'full',      label:'Full Outfits',icon:'✨'},
    {id:'other',     label:'Other',      icon:'🎽'},
  ];

  const readPhoto = file => new Promise((resolve,reject)=>{
    if(!file) return resolve('');
    // Resize to max 400px wide before storing to keep localStorage light
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const MAX=400;
      const ratio=Math.min(1,MAX/img.width,MAX/img.height);
      const w=Math.round(img.width*ratio);
      const h=Math.round(img.height*ratio);
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg',0.7));
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src=url;
  });

  const saveItem=()=>{
    if(!itemForm.name.trim()) return;
    setWardrobe(p=>[...p,{id:Date.now()+'',name:itemForm.name.trim(),category:itemForm.category,photo:itemForm.photo}]);
    setItemForm({name:'',category:'tops',photo:''});
    setShowAddItem(false);
  };
  const deleteItem=id=>{
    setWardrobe(p=>p.filter(i=>i.id!==id));
    // Remove from any outfits
    setOutfits(p=>p.map(o=>({...o,itemIds:o.itemIds.filter(iid=>iid!==id)})));
  };

  const saveOutfit=()=>{
    if(!outfitForm.name.trim()) return;
    setOutfits(p=>[...p,{id:Date.now()+'',name:outfitForm.name.trim(),itemIds:outfitForm.itemIds}]);
    setOutfitForm({name:'',itemIds:[]});
    setShowAddOutfit(false);
  };
  const deleteOutfit=id=>{
    setOutfits(p=>p.filter(o=>o.id!==id));
    // Remove from plan
    setOutfitPlan(p=>{const n={...p};Object.keys(n).forEach(d=>{if(n[d]===id)delete n[d];});return n;});
  };

  const assignOutfit=(dateStr,outfitId)=>{
    setOutfitPlan(p=>({...p,[dateStr]:outfitId}));
    setShowAssign(null);
  };
  const unassignOutfit=dateStr=>setOutfitPlan(p=>{const n={...p};delete n[dateStr];return n;});

  const wkWardrobeDates=weekOf(wardrobeCurDay);

  // ---- iCal ----
  const exportICal=()=>{
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN'];
    weekOf(curDay).forEach(ds=>{
      getDayBlocks(ds).forEach(b=>{
        const d=new Date(ds+'T00:00:00');
        const ds2=`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
        lines.push('BEGIN:VEVENT',`UID:${b.id}-${ds}@planner`,
          `DTSTART:${ds2}T${pad(Math.floor(b.s/60))}${pad(b.s%60)}00`,
          `DTEND:${ds2}T${pad(Math.floor(b.e/60))}${pad(b.e%60)}00`,
          `SUMMARY:${b.label}`,'END:VEVENT');
      });
    });
    lines.push('END:VCALENDAR');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'}));
    a.download='planner-week.ics';a.click();
    setShowSettings(false);
  };

  // ---- Mood log ----
  const logMood=()=>{
    const now=new Date();
    const entry={id:Date.now()+'',date:td,time:`${pad(now.getHours())}:${pad(now.getMinutes())}`,value:moodForm.value,note:moodForm.note};
    setMoodLog(p=>[...p,entry]);
    setShowMoodLog(false);
    setMoodForm({value:'okay',note:'',time:''});
  };
  const todayMoods=moodLog.filter(m=>m.date===td);
  const weekMoods=moodLog.filter(m=>weekOf(curDay).includes(m.date));

  // ---- Wheel of Life ----
  const thisWeekStart=weekOf(td)[0];
  const currentWheel=wheelData.find(w=>w.week===thisWeekStart);
  const prevWheel=wheelData.find(w=>w.week===weekOf(addDays(thisWeekStart,-7))[0]);
  const saveWheel=()=>{
    setWheelData(p=>{const i=p.findIndex(w=>w.week===thisWeekStart);const en={week:thisWeekStart,ratings:wheelForm,date:new Date().toISOString()};if(i>=0){const n=[...p];n[i]=en;return n;}return[...p,en];});
    setShowWheel(false);
  };
  const wheelRated=!!currentWheel;

  // ---- AI Insight (Claude API) ----
  const buildAISummary=()=>{
    const wk=weekOf(curDay);
    const wkBks=wk.flatMap(d=>getDayBlocks(d).map(b=>({...b,_date:d})));
    const done=wkBks.filter(b=>b.status==='done').length;
    const total=wkBks.length;
    const totalMin=wkBks.filter(b=>b.status!=='skipped').reduce((s,b)=>s+(b.e-b.s),0);

    const sleepDets=blocks.filter(b=>b.cat==='sleep').flatMap(b=>wk.map(d=>({d,det:b.detailsByDate?.[d]})).filter(x=>x.det).map(x=>x.det));
    const avgSleepH=sleepDets.filter(d=>d.hours).length?sleepDets.filter(d=>d.hours).reduce((s,d)=>s+Number(d.hours),0)/sleepDets.filter(d=>d.hours).length:null;
    const avgSleepQ=sleepDets.filter(d=>d.quality).length?sleepDets.filter(d=>d.quality).reduce((s,d)=>s+Number(d.quality),0)/sleepDets.filter(d=>d.quality).length:null;

    const calByDay=wk.map(d=>({d,kcal:blocks.filter(b=>b.cat==='meal').reduce((s,b)=>s+Number(b.detailsByDate?.[d]?.calories||0),0)})).filter(x=>x.kcal>0);
    const avgKcal=calByDay.length?Math.round(calByDay.reduce((s,x)=>s+x.kcal,0)/calByDay.length):null;

    const wkMoods=moodLog.filter(m=>wk.includes(m.date));
    const moodDist=MOODS.map(mo=>({label:mo.label,count:wkMoods.filter(m=>m.value===mo.value).length})).filter(m=>m.count>0);

    const wkReviews=reviews.filter(r=>wk.includes(r.date)&&r.saved);
    const goalsList=goals.filter(g=>g.month===monthOf(curDay));
    const msDone=goalsList.flatMap(g=>g.milestones||[]).filter(m=>m.done).length;
    const msTotal=goalsList.flatMap(g=>g.milestones||[]).length;

    const wheel=currentWheel?.ratings;

    return `WEEK: ${fmtD(wk[0])} to ${fmtD(wk[6])}

SCHEDULE: ${totalMin?mLbl(totalMin):0} logged | ${done}/${total} blocks completed
Daily done rates: ${wk.map(d=>{const db=getDayBlocks(d);const dn=db.filter(b=>b.status==='done').length;return DAYS[new Date(d+'T00:00:00').getDay()]+': '+dn+'/'+db.length;}).join(', ')}

${avgSleepH||avgSleepQ?`SLEEP: ${avgSleepH?avgSleepH.toFixed(1)+'h avg':'no hours logged'} | ${avgSleepQ?avgSleepQ.toFixed(1)+'/5 quality':'no quality logged'}
Wake moods: ${sleepDets.filter(d=>d.wakeMood).map(d=>d.wakeMood).join(', ')||'not logged'}`:'SLEEP: not logged'}

${avgKcal?`NUTRITION: ${avgKcal} kcal/day average (${calByDay.length} days logged)`:'NUTRITION: not logged'}

${wkMoods.length?`MOOD LOG (${wkMoods.length} entries): ${moodDist.map(m=>m.label+' x'+m.count).join(', ')}`:'MOOD: not logged this week'}

GOALS (${monthOf(curDay)}): ${goalsList.length} active | ${msDone}/${msTotal} milestones done
${goalsList.slice(0,3).map(g=>g.text+(g.done?' [DONE]':'')).join('; ')||'none'}

REVIEWS: ${wkReviews.length}/7 days reviewed
${wkReviews.length?wkReviews[0].tomorrow?'Latest priority: '+wkReviews[0].tomorrow:'':''}

${wheel?`WHEEL OF LIFE: Health:${wheel.health||'?'} Work:${wheel.work||'?'} Social:${wheel.social||'?'} Finance:${wheel.finance||'?'} Growth:${wheel.growth||'?'} Rest:${wheel.rest||'?'} Fun:${wheel.fun||'?'} Mind:${wheel.mindfulness||'?'}`:'WHEEL OF LIFE: not rated this week'}

HABITS: ${habitBlocks.map(b=>'\''+b.label+'\'  '+calcStreak(b)+'-day streak, '+calcConsistency(b)+'% 30-day').join('; ')||'no recurring habits'}`;
  };

  const generateAIInsight=async()=>{
    setAiLoading(true);setAiError('');
    try{
      const summary=buildAISummary();
      const res=await fetch('/api/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({summary,userName:userName||'there'})
      });
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        throw new Error(err.error||`Server error ${res.status}`);
      }
      const data=await res.json();
      if(data.error) throw new Error(data.error);
      setAiInsight({text:data.text,date:td,week:weekOf(curDay)[0]});
    }catch(err){
      setAiError('Could not generate analysis: '+err.message);
    }finally{
      setAiLoading(false);
    }
  };

  // ---- Computed insights ----
  const ruleInsights=useMemo(()=>computeInsights(blocks,goals,moodLog,reviews,cats),[blocks,goals,moodLog,reviews]);

  // ---- Week data ----
  const wkDates    =weekOf(curDay);
  const wkHydAvg   =(() => { const vals=wkDates.map(d=>hydration[d]||0).filter(v=>v>0); return vals.length?(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(1):null; })();
  const wkBlocks   =wkDates.flatMap(d=>getDayBlocks(d).map(b=>({...b,_date:d})));
  const wkStats    =cats.map(c=>({...c,ttl:wkBlocks.filter(b=>b.cat===c.id&&b.status!=='skipped').reduce((s,b)=>s+(b.e-b.s),0)})).filter(c=>c.ttl>0).sort((a,b)=>b.ttl-a.ttl);
  const maxStat    =wkStats.length?wkStats[0].ttl:1;
  const totalLogged=wkStats.reduce((s,c)=>s+c.ttl,0);
  const wLabel     =`${new Date(wkDates[0]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} - ${new Date(wkDates[6]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  const wkEntries  =entries.filter(e=>wkDates.includes(e.date)&&e.saved);
  const monthGoals =goals.filter(g=>g.month===curMonth);
  const dayBlocks  =getDayBlocks(curDay);
  const weekCals   =wkDates.map(d=>({date:d,kcal:blocks.filter(b=>b.cat==='meal').reduce((s,b)=>s+Number(b.detailsByDate?.[d]?.calories||0),0)}));
  const maxKcal    =Math.max(...weekCals.map(d=>d.kcal),1);
  const totalKcal  =weekCals.reduce((s,d)=>s+d.kcal,0);

  // Pomodoro ring
  const R=52,circ=2*Math.PI*R,full=pom.mode==='work'?40*60:15*60,pct=(full-pom.t)/full,isW=pom.mode==='work';

  // Greetings
  const greeting=nowH<12?'Good morning':'Good afternoon';
  const greetingName=userName?`, ${userName}`:'';
  const greetingEmoji=nowH<5?'🌙':nowH<12?'🌅':nowH<17?'☀️':nowH<21?'🌆':'🌙';

  // Yesterday stats
  const yday=addDays(td,-1);
  const ydayBlocks=getDayBlocks(yday);
  const ydayDone=ydayBlocks.filter(b=>b.status==='done').length;
  const ydayTotal=ydayBlocks.length;
  const bestStreak=habitBlocks.length?Math.max(...habitBlocks.map(calcStreak)):0;
  const bestStreakBlock=habitBlocks.find(b=>calcStreak(b)===bestStreak);
  const todayPriority=reviews.filter(r=>r.date===yday&&r.tomorrow).sort((a,b)=>b.date.localeCompare(a.date))[0]?.tomorrow||goals.filter(g=>!g.done&&g.month===monthOf(td))[0]?.text||null;

  const getWeekOpts=()=>Array.from({length:4},(_,w)=>{const d=addDays(`${curMonth}-01`,w*7),wk=weekOf(d);return{value:wk[0],label:`Week ${w+1}: ${new Date(wk[0]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} - ${new Date(wk[6]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}`};});

  // ---- PDF ----
  const exportPDF=()=>{
    const mGoals=goals.filter(g=>g.month===monthOf(wkDates[0]));
    const sec=t=>`<h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:22px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:6px">${t}</h2>`;
    const catRows=wkStats.map(c=>`<tr><td style="padding:6px 8px">${c.icon} <b>${c.label}</b></td><td style="padding:6px 8px;text-align:right;font-weight:600;color:${c.col}">${mLbl(c.ttl)}</td><td style="padding:6px 8px;width:160px"><div style="height:7px;background:#f3f4f6;border-radius:4px"><div style="height:100%;background:${c.col};width:${Math.round((c.ttl/maxStat)*100)}%;border-radius:4px"></div></div></td></tr>`).join('');
    const dayRows=wkDates.map(d=>{const db=getDayBlocks(d),done=db.filter(b=>b.status==='done').length,total=db.length,ttl=db.filter(b=>b.status!=='skipped').reduce((s,b)=>s+(b.e-b.s),0);const wd=new Date(d+'T00:00:00');return`<tr style="background:${d===td?'#f5f3ff':''}"><td style="padding:6px 8px;font-weight:600">${DAYS[wd.getDay()]} ${wd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td><td style="padding:6px 8px;text-align:center">${ttl?mLbl(ttl):'--'}</td><td style="padding:6px 8px;text-align:center;color:${done===total&&total>0?'#059669':'#9ca3af'}">${total?done+'/'+total+' done':'--'}</td></tr>`;}).join('');
    const blockDet=wkDates.map(d=>{const db=getDayBlocks(d);if(!db.length)return'';return`<div style="margin-bottom:16px"><div style="font-weight:700;font-size:13px;margin-bottom:8px;padding:4px 0;border-bottom:1px solid #e5e7eb">${fmtD(d)}</div>${db.map(b=>{const c=catOf(cats,b.cat),det=getDetails(b,d),schema=getSchema(b.cat);let di='';schema.fields.forEach(f=>{if(det[f.key])di+=`<div><span style="color:#6b7280;font-size:11px">${f.label}:</span> <b>${det[f.key]}</b></div>`;});schema.ratings?.forEach(r=>{if(det[r.key])di+=`<div><span style="color:#6b7280;font-size:11px">${r.label}:</span> ${'*'.repeat(det[r.key])}</div>`;});if(schema.moods&&det[schema.moods.key])di+=`<div><span style="color:#6b7280;font-size:11px">${schema.moods.label}:</span> <b>${det[schema.moods.key]}</b></div>`;if((det.exercises||[]).filter(x=>x.name).length)di+=`<div><b>Exercises:</b> ${det.exercises.filter(x=>x.name).map(x=>x.name+(x.sets?` ${x.sets}x${x.reps||'?'}${x.weight?` @${x.weight}`:''}`:'')).join(', ')}</div>`;if(det.notes)di+=`<div style="font-style:italic;color:#555">${det.notes}</div>`;return`<div style="margin-bottom:8px;padding:9px 12px;border-left:4px solid ${c.col};background:#fafafa;border-radius:0 6px 6px 0"><div style="font-weight:700;color:${c.col}">${c.icon} ${b.label} <span style="font-weight:400;color:#9ca3af;font-size:11px">${m2s(b.s)}-${m2s(b.e)} ${b.status==='done'?'[Done]':b.status==='skipped'?'[Skipped]':'[Pending]'}</span></div>${di||'<span style="font-size:11px;color:#d1d5db">No details logged</span>'}</div>`;}).join('')}</div>`;}).join('');
    const goalsHTML=mGoals.length?mGoals.map(g=>{const prog=goalProg(g);return`<div style="margin-bottom:12px;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb"><div style="font-weight:700">${g.done?'[Done] ':''} ${g.text}</div>${prog?`<div style="font-size:12px;color:#6b7280;margin-top:4px">${prog.done}/${prog.total} milestones</div>`:''}<div style="margin-left:12px">${(g.milestones||[]).map(m=>`<div style="color:${m.done?'#9ca3af':'#374151'};text-decoration:${m.done?'line-through':'none'};font-size:13px;padding:2px 0">${m.done?'[x]':'[ ]'} ${m.text}</div>`).join('')}</div></div>`;}).join(''):'<p style="color:#9ca3af">No goals this period.</p>';
    const moodHTML=weekMoods.length?`<div>${MOODS.map(mo=>{const c=weekMoods.filter(m=>m.value===mo.value).length;return c?`<span style="margin-right:12px">${mo.icon} ${mo.label}: ${c}x</span>`:''}).join('')}</div>`:'<p style="color:#9ca3af">No mood entries this week.</p>';
    const wheelHTML=currentWheel?WHEEL_AREAS.map(a=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="width:80px;font-size:12px;color:#6b7280">${a.icon} ${a.label}</span><div style="flex:1;height:7px;background:#f3f4f6;border-radius:4px"><div style="height:100%;background:#8b7cf8;width:${(currentWheel.ratings[a.key]||0)*10}%;border-radius:4px"></div></div><span style="font-size:12px;font-weight:700;width:20px">${currentWheel.ratings[a.key]||0}</span></div>`).join(''):'<p style="color:#9ca3af">Wheel of Life not rated this week.</p>';
    const aiHTML=aiInsight&&aiInsight.week===wkDates[0]?`<div style="padding:14px;background:#f5f3ff;border-radius:8px;border:1px solid #e0d9ff;font-size:13px;line-height:1.7;white-space:pre-wrap">${aiInsight.text}</div>`:'<p style="color:#9ca3af">No AI analysis generated this week.</p>';
    const notesHTML=wkEntries.length?wkEntries.map(e=>`<div style="margin-bottom:10px;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb"><div style="font-size:12px;font-weight:700;color:#8b5cf6;margin-bottom:4px">${fmtD(e.date)}</div><div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${e.draft}</div></div>`).join(''):'<p style="color:#9ca3af">No saved notes.</p>';
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Weekly Summary</title><style>*{box-sizing:border-box}body{font-family:-apple-system,sans-serif;color:#111;max-width:800px;margin:0 auto;padding:32px 36px;line-height:1.5}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #f3f4f6;font-size:13px}@media print{body{padding:20px}}</style></head><body>
    <div style="display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #111"><div><h1 style="margin:0;font-size:24px">Weekly Summary</h1><div style="color:#6b7280;margin-top:4px">${wLabel}</div></div><div style="font-size:11px;color:#9ca3af">${new Date().toLocaleDateString()}</div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px">${[['Time',totalLogged?mLbl(totalLogged):'--'],['Blocks',wkBlocks.length],['Done',wkBlocks.filter(b=>b.status==='done').length],['Moods',weekMoods.length]].map(([l,v])=>`<div style="padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;text-align:center"><div style="font-size:18px;font-weight:800">${v}</div><div style="font-size:11px;color:#6b7280">${l}</div></div>`).join('')}</div>
    ${sec('Time by category')}<table><tbody>${catRows||'<tr><td colspan="3">No data</td></tr>'}</tbody></table>
    ${sec('Mood this week')}${moodHTML}
    ${sec('Wheel of Life')}${wheelHTML}
    ${sec('AI Weekly Analysis')}${aiHTML}
    ${sec('Daily breakdown')}<table><thead><tr><th style="padding:6px 8px;text-align:left;background:#f9fafb;font-size:11px">Day</th><th style="padding:6px 8px;text-align:center;background:#f9fafb;font-size:11px">Time</th><th style="padding:6px 8px;text-align:center;background:#f9fafb;font-size:11px">Done</th></tr></thead><tbody>${dayRows}</tbody></table>
    ${sec('Block details')}${blockDet}
    ${sec('Goals')}${goalsHTML}
    ${sec('Daily notes')}${notesHTML}
    <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">Life Companion - ${wLabel}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`;
    const win=window.open('','_blank');if(!win){alert('Allow popups');return;}win.document.write(html);win.document.close();
  };

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',background:C.BG,color:C.TEXT,fontFamily:'system-ui,sans-serif',overflow:'hidden',position:'relative'}}>

      {/* ===== BOTTOM NAV BAR ===== */}
      <div style={{display:'flex',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
        {[['home','🏠','Home'],['plan','📅','Plan'],['life','🌍','Life'],['money','💰','Money'],['more','☰','More']].map(([id,ic,lb])=>(
          <button key={id} onClick={()=>{setTab(id);setShowMore(false);}}
            style={{flex:1,padding:'10px 2px 8px',background:'none',border:'none',
              borderBottom:tab===id?`2px solid ${C.ACCENT}`:'2px solid transparent',
              color:tab===id?C.ACCENT:C.MUTED,cursor:'pointer',fontSize:10,
              fontWeight:tab===id?700:400,display:'flex',flexDirection:'column',
              alignItems:'center',gap:2,fontFamily:'inherit'}}>
            <span style={{fontSize:17}}>{ic}</span>{lb}
          </button>
        ))}
      </div>

      {/* ===== HOME TAB ===== */}
      {tab==='home'&&(
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>

          {/* Hero greeting */}
          <div style={{padding:'20px 16px 16px',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <div style={{fontSize:36}}>{greetingEmoji}</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:C.TEXT}}>{greeting}{greetingName}!</div>
                <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{fmtD(td)}</div>
              </div>
            </div>

            {/* Quick stats row */}
            <div style={{display:'flex',gap:8}}>
              {[
                ['🔥', bestStreak>0?`${bestStreak} day streak`:'No streak yet', bestStreak>0?C.WARN:C.MUTED],
                ['✅', ydayTotal>0?`${ydayDone}/${ydayTotal} yesterday`:'First day!', ydayDone===ydayTotal&&ydayTotal>0?C.SUCCESS:C.MUTED],
                ['💰', monthTotal>0?monthTotal.toLocaleString(undefined,{maximumFractionDigits:0})+' spent':'No spend yet', C.MUTED],
              ].map(([ic,txt,col])=>(
                <div key={txt} style={{flex:1,background:C.CARD,borderRadius:10,padding:'8px 6px',border:`1px solid ${C.B1}`,textAlign:'center'}}>
                  <div style={{fontSize:16}}>{ic}</div>
                  <div style={{fontSize:10,color:col,marginTop:3,fontWeight:600,lineHeight:1.3}}>{txt}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{padding:16,display:'flex',flexDirection:'column',gap:14}}>

            {/* Today's focus */}
            {todayPriority&&(
              <div style={{padding:'12px 14px',background:'rgba(139,124,248,0.1)',borderRadius:12,border:`1px solid rgba(139,124,248,0.3)`}}>
                <div style={{fontSize:10,color:C.ACCENT,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,marginBottom:5}}>Today's focus</div>
                <div style={{fontSize:14,color:C.TEXT,fontWeight:600}}>{todayPriority}</div>
              </div>
            )}

            {/* Quick mood */}
            <div style={{background:C.PANEL,borderRadius:14,padding:'14px',border:`1px solid ${C.B1}`}}>
              <div style={{fontSize:12,fontWeight:700,color:C.TEXT,marginBottom:10}}>How are you feeling?</div>
              <div style={{display:'flex',gap:6}}>
                {MOODS.map(m=>{
                  const logged=todayMoods.slice(-1)[0]?.value===m.value;
                  return(
                    <button key={m.value} onClick={()=>{
                      const now=new Date();
                      setMoodLog(p=>[...p,{id:Date.now()+'',date:td,time:`${pad(now.getHours())}:${pad(now.getMinutes())}`,value:m.value,note:''}]);
                    }}
                      style={{flex:1,padding:'8px 4px',borderRadius:10,
                        background:logged?`rgba(${hexToRgb(m.col)},0.2)`:C.CARD,
                        border:`2px solid ${logged?m.col:C.B2}`,
                        cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <span style={{fontSize:18}}>{m.icon}</span>
                      <span style={{fontSize:9,color:logged?m.col:C.MUTED}}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hydration tracker */}
            <div style={{background:C.PANEL,borderRadius:14,padding:'14px',border:`1px solid ${C.B1}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>💧 Hydration</div>
                <div style={{fontSize:12,color:hydColor,fontWeight:700}}>{todayGlasses}/{hydrationGoal} glasses</div>
              </div>
              {/* Progress bar */}
              <div style={{height:8,background:C.CARD,borderRadius:4,marginBottom:12}}>
                <div style={{height:'100%',borderRadius:4,background:hydColor,width:`${hydPct*100}%`,transition:'width 0.4s ease'}}/>
              </div>
              {/* Glass buttons */}
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button onClick={()=>addGlass(-1)} style={{...btn({padding:'7px 12px',fontSize:16}),flexShrink:0}}>－</button>
                <div style={{flex:1,display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center'}}>
                  {Array.from({length:hydrationGoal},(_,i)=>(
                    <button key={i} onClick={()=>setGlasses(i+1)}
                      style={{fontSize:18,background:'none',border:'none',cursor:'pointer',padding:'2px',
                        opacity:i<todayGlasses?1:0.25,
                        filter:i<todayGlasses?'none':'grayscale(1)',
                        transform:i<todayGlasses?'scale(1.1)':'scale(1)',
                        transition:'all 0.15s'}}>
                      💧
                    </button>
                  ))}
                </div>
                <button onClick={()=>addGlass(1)} style={{...btn({padding:'7px 12px',fontSize:16,color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',fontWeight:700}),flexShrink:0}}>＋</button>
              </div>
              {hydPct>=1&&<div style={{textAlign:'center',fontSize:12,color:C.SUCCESS,marginTop:8,fontWeight:700}}>🎉 Daily goal reached!</div>}
            </div>
            <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
              <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>Today's schedule</div>
                <button onClick={()=>{setTab('plan');setPlanSubTab('schedule');}} style={btn({fontSize:11,padding:'4px 10px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.08)'})}>See all</button>
              </div>
              {dayBlocks.length>0?(
                <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:6}}>
                  {dayBlocks.slice(0,4).map(b=>{
                    const c=catOf(cats,b.cat);
                    const isDone=b.status==='done';
                    return(
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:C.CARD,borderRadius:10,border:`1px solid ${isDone?C.SUCCESS+'33':C.B1}`,opacity:isDone?0.7:1}}>
                        <span style={{fontSize:16}}>{c.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:isDone?C.MUTED:C.TEXT,textDecoration:isDone?'line-through':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.label}</div>
                          <div style={{fontSize:10,color:C.MUTED}}>{m2s(b.s)} – {m2s(b.e)}</div>
                        </div>
                        <span style={{fontSize:14}}>{isDone?'✅':b.status==='skipped'?'⚡':'○'}</span>
                      </div>
                    );
                  })}
                  {dayBlocks.length>4&&<div style={{fontSize:11,color:C.MUTED,textAlign:'center',paddingTop:4}}>+{dayBlocks.length-4} more</div>}
                </div>
              ):(
                <div style={{padding:'12px 14px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,color:C.MUTED}}>Nothing planned yet</span>
                  <button onClick={()=>{setTab('plan');setPlanSubTab('schedule');const s=nowH*60;setForm({label:'',cat:cats[0]?.id||'sleep',start:m2s(s),end:m2s(Math.min(s+60,23*60+45)),recur:{type:'none',days:[]}});setModal({mode:'add'});}}
                    style={btn({fontSize:11,padding:'5px 12px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)'})}>+ Add block</button>
                </div>
              )}
            </div>

            {/* Wheel of life snapshot */}
            {wheelRated?(
              <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>Wheel of Life</div>
                  <button onClick={()=>{setTab('life');setLifeSubTab('wheel');}} style={btn({fontSize:11,padding:'4px 10px',color:C.WARN,borderColor:'rgba(251,191,36,0.4)',background:'rgba(251,191,36,0.08)'})}>Details</button>
                </div>
                <div style={{padding:'0 14px 14px',display:'flex',flexWrap:'wrap',gap:6}}>
                  {WHEEL_AREAS.map(a=>{
                    const val=currentWheel?.ratings[a.key]||0;
                    const col=val>=7?C.SUCCESS:val>=4?C.WARN:val>0?C.DANGER:C.MUTED;
                    return(
                      <div key={a.key} style={{flex:'1 1 calc(25% - 6px)',padding:'7px 6px',background:C.CARD,borderRadius:8,textAlign:'center',border:`1px solid ${C.B1}`}}>
                        <div style={{fontSize:13}}>{a.icon}</div>
                        <div style={{fontSize:16,fontWeight:800,color:col,marginTop:2}}>{val||'--'}</div>
                        <div style={{fontSize:9,color:C.MUTED,marginTop:1}}>{a.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ):(
              <button onClick={()=>{setTab('life');setLifeSubTab('wheel');setWheelForm({});setShowWheel(true);}}
                style={{padding:'14px',background:`rgba(251,191,36,0.07)`,border:`1px solid rgba(251,191,36,0.3)`,borderRadius:14,cursor:'pointer',display:'flex',alignItems:'center',gap:12,fontFamily:'inherit'}}>
                <span style={{fontSize:28}}>🌍</span>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.WARN}}>Rate your Wheel of Life</div>
                  <div style={{fontSize:11,color:C.MUTED,marginTop:2}}>30 seconds — rate 8 life dimensions</div>
                </div>
                <span style={{color:C.MUTED,marginLeft:'auto'}}>›</span>
              </button>
            )}

            {/* Top insight teaser */}
            {ruleInsights.length>0&&(
              <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>Top insight</div>
                  <button onClick={()=>{setTab('life');setLifeSubTab('insights');}} style={btn({fontSize:11,padding:'4px 10px'})}>All {ruleInsights.length}</button>
                </div>
                <div style={{padding:'0 14px 14px'}}>
                  {(()=>{
                    const ins=ruleInsights[0];
                    const col=ins.type==='positive'?C.SUCCESS:ins.type==='warning'?C.WARN:ins.type==='alert'?C.DANGER:C.ACCENT;
                    const bg=ins.type==='positive'?'rgba(52,211,153,0.08)':ins.type==='warning'?'rgba(251,191,36,0.08)':ins.type==='alert'?'rgba(248,113,113,0.08)':'rgba(139,124,248,0.08)';
                    return(
                      <div style={{padding:'10px 12px',background:bg,borderRadius:10,border:`1px solid ${col}30`}}>
                        <div style={{fontSize:13,fontWeight:700,color:col,marginBottom:4}}>{ins.icon} {ins.title}</div>
                        <div style={{fontSize:12,color:C.TEXT,lineHeight:1.6}}>{ins.body}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Habits summary */}
            {habitBlocks.length>0&&(
              <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>Habits today</div>
                  <button onClick={()=>{setTab('plan');setPlanSubTab('habits');}} style={btn({fontSize:11,padding:'4px 10px'})}>All</button>
                </div>
                <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:6}}>
                  {habitBlocks.slice(0,4).map(b=>{
                    const c=catOf(cats,b.cat);
                    const streak=calcStreak(b);
                    const todayStatus=b.overrides?.[td]?.status??'pending';
                    const isDone=todayStatus==='done';
                    return(
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:C.CARD,borderRadius:10,border:`1px solid ${C.B1}`}}>
                        <span style={{fontSize:16}}>{c.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.label}</div>
                          {streak>0&&<div style={{fontSize:10,color:C.WARN}}>🔥 {streak} day streak</div>}
                        </div>
                        <button onClick={()=>setRecurStatus(b,td,isDone?'pending':'done')}
                          style={{background:'none',border:`1.5px solid ${isDone?C.SUCCESS:C.B2}`,borderRadius:'50%',width:28,height:28,cursor:'pointer',color:isDone?C.SUCCESS:C.MUTED,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {isDone?'✓':''}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PLAN TAB (Schedule + Habits) ===== */}

      {/* Plan sub-nav — shown for both sub-tabs */}
      {tab==='plan'&&(
        <div style={{display:'flex',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
          {[['schedule','📅','Schedule'],['habits','🔥','Habits']].map(([id,ic,lb])=>(
            <button key={id} onClick={()=>setPlanSubTab(id)}
              style={{flex:1,padding:'10px 4px 8px',background:'none',border:'none',
                borderBottom:planSubTab===id?`2px solid ${C.ACCENT}`:'2px solid transparent',
                color:planSubTab===id?C.ACCENT:C.MUTED,cursor:'pointer',fontSize:11,
                fontWeight:planSubTab===id?700:400,display:'flex',flexDirection:'column',
                alignItems:'center',gap:2,fontFamily:'inherit'}}>
              <span style={{fontSize:16}}>{ic}</span>{lb}
            </button>
          ))}
        </div>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {tab==='plan'&&planSubTab==='schedule'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* MORNING CARD */}
          <div style={{background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
            <div
              onClick={()=>{setMorningOpen(o=>!o);lsSet('ph_morning_date',td);}}
              style={{padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:22}}>{greetingEmoji}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>{greeting}{greetingName}!</div>
                  <div style={{fontSize:11,color:C.MUTED,marginTop:1,display:'flex',gap:10}}>
                    <span>{fmtD(td)}</span>
                    {bestStreak>0&&<span style={{color:C.WARN}}>🔥 {bestStreak} day streak</span>}
                    {ydayTotal>0&&<span style={{color:ydayDone===ydayTotal?C.SUCCESS:C.MUTED}}>Yesterday: {ydayDone}/{ydayTotal}</span>}
                  </div>
                </div>
              </div>
              <span style={{color:C.MUTED,fontSize:14,transition:'transform 0.2s',transform:morningOpen?'rotate(180deg)':'rotate(0deg)'}}>▾</span>
            </div>

            {morningOpen&&(
              <div style={{padding:'0 14px 14px',borderTop:`1px solid ${C.B1}`}}>
                {/* Today's schedule preview */}
                {dayBlocks.length>0?(
                  <div style={{marginTop:12,marginBottom:12}}>
                    <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:8}}>Today's schedule ({dayBlocks.length} blocks)</div>
                    {dayBlocks.slice(0,3).map(b=>{
                      const c=catOf(cats,b.cat);
                      return(
                        <div key={b.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${C.B1}`}}>
                          <span style={{fontSize:14}}>{c.icon}</span>
                          <span style={{flex:1,fontSize:13,color:C.TEXT}}>{b.label}</span>
                          <span style={{fontSize:11,color:C.MUTED}}>{m2s(b.s)}</span>
                        </div>
                      );
                    })}
                    {dayBlocks.length>3&&<div style={{fontSize:11,color:C.MUTED,marginTop:6}}>+{dayBlocks.length-3} more blocks</div>}
                  </div>
                ):(
                  <div style={{marginTop:12,marginBottom:12,padding:'10px',background:C.CARD,borderRadius:10,fontSize:13,color:C.MUTED,textAlign:'center'}}>
                    No blocks yet today.{' '}
                    <span onClick={()=>{const s=nowH*60;setForm({label:'',cat:cats[0]?.id||'sleep',start:m2s(s),end:m2s(Math.min(s+60,23*60+45)),recur:{type:'none',days:[]}});setModal({mode:'add'});}} style={{color:C.ACCENT,cursor:'pointer',fontWeight:700}}>Add one</span>
                  </div>
                )}

                {/* Today's priority */}
                {todayPriority&&(
                  <div style={{marginBottom:12,padding:'10px 12px',background:'rgba(139,124,248,0.1)',borderRadius:10,border:`1px solid rgba(139,124,248,0.3)`}}>
                    <div style={{fontSize:10,color:C.ACCENT,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,marginBottom:4}}>Today's focus</div>
                    <div style={{fontSize:13,color:C.TEXT}}>{todayPriority}</div>
                  </div>
                )}

                {/* Wheel prompt */}
                {!wheelRated&&(
                  <div onClick={()=>{setWheelForm(currentWheel?.ratings||{});setShowWheel(true);}}
                    style={{marginBottom:12,padding:'9px 12px',background:`rgba(251,191,36,0.08)`,borderRadius:10,border:`1px solid rgba(251,191,36,0.3)`,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:16}}>🌍</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.WARN}}>Wheel of Life not rated this week</div>
                      <div style={{fontSize:11,color:C.MUTED}}>Takes 30 seconds — tap to rate 8 life areas</div>
                    </div>
                    <span style={{color:C.MUTED}}>›</span>
                  </div>
                )}

                {/* Quick mood log */}
                <div>
                  <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:8}}>How are you feeling right now?</div>
                  <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
                    {MOODS.map(m=>(
                      <button key={m.value} onClick={()=>{setMoodLog(p=>[...p,{id:Date.now()+'',date:td,time:`${pad(nowH)}:${pad(new Date().getMinutes())}`,value:m.value,note:''}]);}}
                        style={{flex:1,padding:'8px 4px',borderRadius:10,background:C.CARD,border:`1px solid ${todayMoods.slice(-1)[0]?.value===m.value?m.col:C.B2}`,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,transition:'all 0.15s'}}>
                        <span style={{fontSize:18}}>{m.icon}</span>
                        <span style={{fontSize:9,color:C.MUTED}}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Day nav */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
            <button onClick={()=>navDay(-1)} style={btn({padding:'6px 14px',fontSize:16})}>&#8249;</button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:13,fontWeight:700,color:curDay===td?C.ACCENT:C.TEXT}}>{fmtD(curDay)}</div>
              {curDay===td&&<div style={{fontSize:10,color:C.ACCENT,marginTop:1}}>Today</div>}
            </div>
            <div style={{display:'flex',gap:6}}>
              {curDay!==td&&<button onClick={()=>setCurDay(td)} style={btn({fontSize:11,padding:'6px 10px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)'})}>Today</button>}
              <button onClick={()=>navDay(1)} style={btn({padding:'6px 14px',fontSize:16})}>&#8250;</button>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{padding:'5px 10px',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,display:'flex',gap:6,flexShrink:0,flexWrap:'wrap'}}>
            <button onClick={()=>setModal({mode:'cat'})} style={btn({fontSize:11,padding:'4px 9px',color:'#a3e635',borderColor:'rgba(163,230,53,0.35)',background:'rgba(163,230,53,0.08)'})}>+ Cat</button>
            <button onClick={()=>setShowTemplates(true)} style={btn({fontSize:11,padding:'4px 9px'})}>📋</button>
            <button onClick={()=>setShowSearch(true)} style={btn({fontSize:11,padding:'4px 9px'})}>🔍</button>
            {nowH>=18&&!todayReview&&<button onClick={()=>{setTab('life');setLifeSubTab('review');}} style={btn({fontSize:11,padding:'4px 9px',color:C.WARN,borderColor:'rgba(251,191,36,0.4)',background:'rgba(251,191,36,0.08)'})}>📝 Review</button>}
            <button onClick={()=>setShowSum(true)} style={btn({fontSize:11,padding:'4px 9px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',marginLeft:'auto'})}>📊 Summary</button>
          </div>

          {/* Timeline */}
          <div ref={scrollRef} style={{flex:1,overflowY:'auto',display:'flex',userSelect:'none'}}
            onMouseMove={onDragMove} onTouchMove={onDragMove}
            onMouseUp={onDragEnd} onTouchEnd={onDragEnd} onMouseLeave={onDragEnd}>
            <div style={{width:LW,flexShrink:0}}>
              {Array.from({length:24},(_,h)=>(
                <div key={h} style={{height:HH,borderBottom:`1px solid ${C.B1}`,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:6,paddingTop:3}}>
                  <span style={{fontSize:9,color:C.MUTED}}>{hLbl(h)}</span>
                </div>
              ))}
            </div>
            <div style={{flex:1,position:'relative',borderLeft:`1px solid ${C.B1}`,cursor:'crosshair'}}
              onClick={e=>{if(dragging)return;const r=e.currentTarget.getBoundingClientRect();openAdd(e.clientY-r.top+(scrollRef.current?.scrollTop||0));}}>
              {Array.from({length:24},(_,h)=><div key={h} style={{height:HH,borderBottom:`1px solid ${h%6===5?C.B2:C.B1}`}}/>)}
              {dayBlocks.map(b=>{
                const c=catOf(cats,b.cat);
                const top=b.s/60*HH,ht=Math.max((b.e-b.s)/60*HH,22);
                const isDone=b.status==='done',isSkip=b.status==='skipped',isDrag=dragging===b.id;
                const logged=hasDetails(b,curDay);
                return(
                  <div key={b.id+'_'+curDay}
                    style={{position:'absolute',left:3,right:3,top,height:ht,
                      background:isSkip?'rgba(80,80,100,0.1)':c.fill,
                      border:`1px solid ${isDrag?c.col:isSkip?'rgba(120,120,160,0.2)':c.border}`,
                      borderRadius:6,padding:'3px 5px',overflow:'hidden',zIndex:isDrag?10:2,
                      boxSizing:'border-box',opacity:isSkip?0.5:1,
                      boxShadow:isDrag?'0 8px 24px rgba(0,0,0,0.4)':undefined,
                      transition:isDrag?'none':'box-shadow 0.2s'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:3,height:'100%'}} onClick={e=>e.stopPropagation()}>
                      {ht>36&&<div onMouseDown={e=>onDragStart(e,b)} onTouchStart={e=>onDragStart(e,b)}
                        style={{cursor:'grab',color:C.MUTED,fontSize:12,paddingTop:1,flexShrink:0,lineHeight:1,userSelect:'none'}}>&#8801;</div>}
                      <div style={{display:'flex',flexDirection:'column',gap:1,flexShrink:0,paddingTop:1}}>
                        <button onClick={()=>setRecurStatus(b,curDay,isDone?'pending':'done')} style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0,lineHeight:1,color:isDone?C.SUCCESS:C.MUTED}}>{isDone?'✅':'○'}</button>
                        {ht>36&&<button onClick={()=>setRecurStatus(b,curDay,isSkip?'pending':'skipped')} style={{background:'none',border:'none',cursor:'pointer',fontSize:10,padding:0,lineHeight:1,color:isSkip?C.DANGER:C.MUTED}}>{isSkip?'!':'-'}</button>}
                      </div>
                      <div style={{flex:1,cursor:'pointer',minWidth:0}} onClick={e=>openEdit(e,b)}>
                        <div style={{fontSize:12,fontWeight:700,color:isSkip?C.MUTED:c.col,textDecoration:isSkip?'line-through':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {c.icon} {b.label}
                          {b.recur?.type&&b.recur.type!=='none'&&<span style={{fontSize:9,color:C.MUTED,marginLeft:3}}>({RECUR_OPTIONS.find(r=>r.id===b.recur.type)?.short})</span>}
                        </div>
                        {ht>30&&<div style={{fontSize:10,color:C.MUTED,textDecoration:isSkip?'line-through':'none'}}>{m2s(b.s)}-{m2s(b.e)}</div>}
                      </div>
                      {ht>24&&<button onClick={e=>openDetails(e,b,curDay)} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,padding:0,lineHeight:1,flexShrink:0,color:logged?c.col:C.MUTED,paddingTop:1}}>{logged?'📋':'📝'}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{padding:'5px 14px',background:C.PANEL,borderTop:`1px solid ${C.B1}`,fontSize:10,color:C.MUTED,flexShrink:0,textAlign:'center'}}>
            Tap to add  |  ≡ drag to move  |  📝 log details
          </div>
          {/* FAB */}
          <button onClick={()=>{const s=nowH*60;setForm({label:'',cat:cats[0]?.id||'sleep',start:m2s(s),end:m2s(Math.min(s+60,23*60+45)),recur:{type:'none',days:[]}});setModal({mode:'add'});}}
            style={{position:'fixed',bottom:22,right:18,width:50,height:50,borderRadius:'50%',background:C.ACCENT,color:'#fff',border:'none',fontSize:24,cursor:'pointer',boxShadow:'0 4px 20px rgba(139,124,248,0.5)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
            +
          </button>
        </div>
      )}

      {/* ===== HABITS TAB ===== */}
      {tab==='plan'&&planSubTab==='habits'&&(
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
          {habitBlocks.length===0?(
            <div style={{textAlign:'center',color:C.MUTED,marginTop:48,lineHeight:2}}>
              <div style={{fontSize:40}}>🔥</div>
              <div style={{fontSize:15,marginTop:12,color:C.TEXT}}>No habits yet</div>
              <div style={{fontSize:13,marginTop:6}}>Add a recurring block on the Schedule tab</div>
            </div>
          ):(
            <>
              <div style={{display:'flex',gap:10}}>
                {[['🔥',habitBlocks.length,'Habits'],['🏆',bestStreak,'Best streak'],['📈',habitBlocks.length?Math.round(habitBlocks.reduce((s,b)=>s+calcConsistency(b),0)/habitBlocks.length)+'%':'0%','Avg 30d']].map(([ic,v,lb])=>(
                  <div key={lb} style={{flex:1,background:C.PANEL,borderRadius:12,padding:'12px 8px',border:`1px solid ${C.B1}`,textAlign:'center'}}>
                    <div style={{fontSize:18}}>{ic}</div>
                    <div style={{fontSize:18,fontWeight:700,marginTop:2,color:C.TEXT}}>{v}</div>
                    <div style={{fontSize:10,color:C.MUTED,marginTop:2}}>{lb}</div>
                  </div>
                ))}
              </div>
              {habitBlocks.map(b=>{
                const c=catOf(cats,b.cat);
                const streak=calcStreak(b);
                const cons=calcConsistency(b);
                const grid=getWeekGrid(b);
                return(
                  <div key={b.id} style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                    <div style={{padding:'14px 14px 10px',display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:44,height:44,borderRadius:12,background:c.fill,border:`1px solid ${c.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{c.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.label}</div>
                        <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{RECUR_OPTIONS.find(r=>r.id===b.recur?.type)?.label||'Recurring'}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:22,fontWeight:800,color:streak>0?c.col:C.MUTED}}>{streak>0?'🔥 '+streak:'--'}</div>
                        <div style={{fontSize:10,color:C.MUTED}}>day streak</div>
                      </div>
                    </div>
                    <div style={{padding:'0 14px 12px'}}>
                      <div style={{display:'flex',gap:5,marginBottom:8}}>
                        {grid.map((status,i)=>{
                          const dotCol=status==='done'?c.col:status==='skipped'?C.DANGER:status==='off'||status==='future'?C.B1:C.B2;
                          const dotBg=status==='done'?c.fill:status==='skipped'?'rgba(248,113,113,0.12)':'transparent';
                          return(
                            <div key={i} style={{flex:1,textAlign:'center'}}>
                              <div style={{width:'100%',aspectRatio:'1',borderRadius:'50%',background:dotBg,border:`2px solid ${dotCol}`,margin:'0 auto 3px',maxWidth:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:dotCol}}>
                                {status==='done'?'✓':status==='skipped'?'x':''}
                              </div>
                              <div style={{fontSize:9,color:C.MUTED}}>{DAY_ABBR[i]}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.MUTED,marginBottom:4}}>
                        <span>30-day consistency</span>
                        <span style={{color:cons>=70?C.SUCCESS:cons>=40?C.WARN:C.DANGER,fontWeight:700}}>{cons}%</span>
                      </div>
                      <div style={{height:6,background:C.CARD,borderRadius:3}}>
                        <div style={{height:'100%',borderRadius:3,background:cons>=70?C.SUCCESS:cons>=40?C.WARN:C.DANGER,width:cons+'%',transition:'width 0.5s'}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ===== LIFE TAB ===== */}
      {tab==='life'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* Life sub-nav */}
          <div style={{display:'flex',overflowX:'auto',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0,scrollbarWidth:'none'}}>
            {[['mood','😊','Mood'],['wheel','🌍','Wheel'],['insights','✨','Insights'],['goals','✅','Goals'],['notes','✏️','Notes'],['review','📝','Review']].map(([id,ic,lb])=>(
              <button key={id} onClick={()=>setLifeSubTab(id)}
                style={{flexShrink:0,padding:'10px 14px 8px',background:'none',border:'none',
                  borderBottom:lifeSubTab===id?`2px solid ${C.ACCENT}`:'2px solid transparent',
                  color:lifeSubTab===id?C.ACCENT:C.MUTED,cursor:'pointer',fontSize:10,
                  fontWeight:lifeSubTab===id?700:400,display:'flex',flexDirection:'column',
                  alignItems:'center',gap:2,fontFamily:'inherit',minWidth:52}}>
                <span style={{fontSize:16}}>{ic}</span>{lb}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>

            {/* MOOD */}
            {lifeSubTab==='mood'&&(
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Mood today</div>
                    <button onClick={()=>setShowMoodLog(true)} style={btn({fontSize:11,padding:'4px 10px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.08)'})}>+ Log</button>
                  </div>
                  {todayMoods.length>0?(
                    <div style={{padding:'0 14px 14px'}}>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {todayMoods.map((m,i)=>{
                          const mo=MOODS.find(x=>x.value===m.value)||MOODS[2];
                          return(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:C.CARD,borderRadius:20,border:`1px solid ${C.B1}`}}>
                              <span style={{fontSize:16}}>{mo.icon}</span>
                              <div>
                                <div style={{fontSize:12,fontWeight:700,color:mo.col}}>{mo.label}</div>
                                <div style={{fontSize:10,color:C.MUTED}}>{m.time}</div>
                              </div>
                              {m.note&&<div style={{fontSize:11,color:C.MUTED,marginLeft:4}}>"{m.note}"</div>}
                            </div>
                          );
                        })}
                      </div>
                      {weekMoods.length>2&&(
                        <div style={{marginTop:12}}>
                          <div style={{fontSize:10,color:C.MUTED,marginBottom:6}}>This week</div>
                          <div style={{display:'flex',gap:4,height:28}}>
                            {wkDates.map(d=>{
                              const dm=moodLog.filter(m=>m.date===d);
                              if(!dm.length) return <div key={d} style={{flex:1,background:C.CARD,borderRadius:4}}/>;
                              const last=dm[dm.length-1];
                              const mo=MOODS.find(x=>x.value===last.value)||MOODS[2];
                              return <div key={d} style={{flex:1,background:mo.col,borderRadius:4,opacity:0.8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>{mo.icon}</div>;
                            })}
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                            {wkDates.map(d=><div key={d} style={{flex:1,textAlign:'center',fontSize:8,color:C.MUTED}}>{DAYS[new Date(d+'T00:00:00').getDay()].slice(0,1)}</div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ):(
                    <div style={{padding:'12px 14px 14px',fontSize:13,color:C.MUTED,textAlign:'center'}}>
                      No mood logged today. <span onClick={()=>setShowMoodLog(true)} style={{color:C.ACCENT,cursor:'pointer',fontWeight:700}}>Log now</span>
                    </div>
                  )}
                </div>
                {/* Quick mood tap */}
                <div style={{background:C.PANEL,borderRadius:14,padding:'14px',border:`1px solid ${C.B1}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.TEXT,marginBottom:10}}>Quick log</div>
                  <div style={{display:'flex',gap:6}}>
                    {MOODS.map(m=>{
                      const logged=todayMoods.slice(-1)[0]?.value===m.value;
                      return(
                        <button key={m.value} onClick={()=>{const now=new Date();setMoodLog(p=>[...p,{id:Date.now()+'',date:td,time:`${pad(now.getHours())}:${pad(now.getMinutes())}`,value:m.value,note:''}]);}}
                          style={{flex:1,padding:'8px 4px',borderRadius:10,background:logged?`rgba(${hexToRgb(m.col)},0.2)`:C.CARD,border:`2px solid ${logged?m.col:C.B2}`,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:18}}>{m.icon}</span>
                          <span style={{fontSize:9,color:logged?m.col:C.MUTED}}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Hydration */}
                <div style={{background:C.PANEL,borderRadius:14,padding:'14px',border:`1px solid ${C.B1}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>💧 Hydration today</div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{fontSize:12,color:hydColor,fontWeight:700}}>{todayGlasses}/{hydrationGoal}</div>
                      <button onClick={()=>setHydrationGoal(g=>Math.max(4,g-1))} style={{background:'none',border:`1px solid ${C.B2}`,borderRadius:6,color:C.MUTED,fontSize:11,padding:'2px 7px',cursor:'pointer'}}>−</button>
                      <button onClick={()=>setHydrationGoal(g=>Math.min(16,g+1))} style={{background:'none',border:`1px solid ${C.B2}`,borderRadius:6,color:C.MUTED,fontSize:11,padding:'2px 7px',cursor:'pointer'}}>+</button>
                    </div>
                  </div>
                  <div style={{height:8,background:C.CARD,borderRadius:4,marginBottom:12}}>
                    <div style={{height:'100%',borderRadius:4,background:hydColor,width:`${hydPct*100}%`,transition:'width 0.4s'}}/>
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <button onClick={()=>addGlass(-1)} style={{...btn({padding:'8px 14px',fontSize:16}),flexShrink:0}}>－</button>
                    <div style={{flex:1,display:'flex',gap:3,flexWrap:'wrap',justifyContent:'center'}}>
                      {Array.from({length:hydrationGoal},(_,i)=>(
                        <button key={i} onClick={()=>setGlasses(i+1)}
                          style={{fontSize:20,background:'none',border:'none',cursor:'pointer',padding:'2px',
                            opacity:i<todayGlasses?1:0.2,
                            transform:i<todayGlasses?'scale(1.1)':'scale(1)',
                            transition:'all 0.15s'}}>
                          💧
                        </button>
                      ))}
                    </div>
                    <button onClick={()=>addGlass(1)} style={{...btn({padding:'8px 14px',fontSize:16,color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',fontWeight:700}),flexShrink:0}}>＋</button>
                  </div>
                  {/* Weekly history */}
                  {wkHydAvg&&(
                    <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.B1}`}}>
                      <div style={{fontSize:10,color:C.MUTED,marginBottom:8}}>This week (avg {wkHydAvg} glasses/day)</div>
                      <div style={{display:'flex',gap:4,alignItems:'flex-end',height:36}}>
                        {wkDates.map(d=>{
                          const glasses=hydration[d]||0;
                          const h=glasses>0?Math.max((glasses/hydrationGoal)*32,3):2;
                          const col=glasses>=hydrationGoal?C.SUCCESS:glasses>=hydrationGoal*0.5?C.ACCENT:glasses>0?C.WARN:C.B2;
                          const isT=d===td;
                          return(
                            <div key={d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                              <div style={{width:'100%',height:h,background:col,borderRadius:'3px 3px 0 0',opacity:isT?1:0.7}}/>
                              <div style={{fontSize:8,color:isT?C.ACCENT:C.MUTED}}>{DAYS[new Date(d+'T00:00:00').getDay()].slice(0,1)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {hydPct>=1&&<div style={{textAlign:'center',fontSize:12,color:C.SUCCESS,marginTop:8,fontWeight:700}}>🎉 Daily goal reached!</div>}
                </div>
              </div>
            )}

            {/* WHEEL */}
            {lifeSubTab==='wheel'&&(
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Wheel of Life</div>
                      <div style={{fontSize:11,color:C.MUTED,marginTop:2}}>{wheelRated?'Rated this week':'Not rated yet'}</div>
                    </div>
                    <button onClick={()=>{setWheelForm(currentWheel?.ratings||{});setShowWheel(true);}} style={btn({fontSize:11,padding:'4px 10px',color:C.WARN,borderColor:'rgba(251,191,36,0.4)',background:'rgba(251,191,36,0.08)'})}>{wheelRated?'Edit':'Rate now'}</button>
                  </div>
                  {wheelRated?(
                    <div style={{padding:'4px 14px 16px'}}>
                      <RadarChart ratings={currentWheel.ratings} prevRatings={prevWheel?.ratings} areas={WHEEL_AREAS} size={220} C={C}/>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:12}}>
                        {WHEEL_AREAS.map(a=>{
                          const val=currentWheel.ratings[a.key]||0;
                          const col=val>=7?C.SUCCESS:val>=4?C.WARN:val>0?C.DANGER:C.MUTED;
                          return <div key={a.key} style={{flex:'1 1 calc(25% - 6px)',minWidth:70,padding:'7px 8px',background:C.CARD,borderRadius:8,border:`1px solid ${C.B1}`,textAlign:'center'}}><div style={{fontSize:14}}>{a.icon}</div><div style={{fontSize:10,color:C.MUTED,margin:'2px 0'}}>{a.label}</div><div style={{fontSize:16,fontWeight:800,color:col}}>{val||'--'}</div></div>;
                        })}
                      </div>
                    </div>
                  ):(
                    <div style={{padding:'0 14px 16px',textAlign:'center'}}>
                      <div style={{fontSize:13,color:C.MUTED,marginBottom:12}}>Rate 8 key life areas to see your balance</div>
                      <button onClick={()=>{setWheelForm({});setShowWheel(true);}} style={btn({color:C.WARN,borderColor:'rgba(251,191,36,0.4)',background:'rgba(251,191,36,0.08)',padding:'9px 20px',fontWeight:700})}>Rate this week</button>
                    </div>
                  )}
                </div>
                {/* Focus timer */}
                <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,padding:'14px'}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.TEXT,marginBottom:12}}>Focus Timer</div>
                  <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width={80} height={80}>
                        <circle cx={40} cy={40} r={32} fill="none" stroke={C.CARD} strokeWidth={6}/>
                        <circle cx={40} cy={40} r={32} fill="none" stroke={isW?C.ACCENT:C.SUCCESS} strokeWidth={6} strokeDasharray={2*Math.PI*32} strokeDashoffset={2*Math.PI*32*(1-pct)} strokeLinecap="round" transform="rotate(-90 40 40)" style={{transition:'stroke-dashoffset 1s linear'}}/>
                      </svg>
                      <div style={{position:'absolute',fontSize:15,fontWeight:700,color:C.TEXT,fontVariantNumeric:'tabular-nums'}}>{pad(Math.floor(pom.t/60))}:{pad(pom.t%60)}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:isW?C.ACCENT:C.SUCCESS,marginBottom:8}}>{isW?'Focus Session':'Break Time'}</div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>setPom(p=>({...p,run:!p.run}))} style={btn({background:isW?'rgba(139,124,248,0.15)':'rgba(52,211,153,0.15)',color:isW?C.ACCENT:C.SUCCESS,borderColor:isW?'rgba(139,124,248,0.4)':'rgba(52,211,153,0.4)',padding:'7px 16px',fontWeight:700})}>{pom.run?'Pause':'Start'}</button>
                        <button onClick={()=>setPom(p=>({...p,t:40*60,mode:'work',run:false}))} style={btn({padding:'7px 12px'})}>&#8635;</button>
                      </div>
                      <div style={{fontSize:11,color:C.MUTED,marginTop:6}}>{pom.sess} sessions today</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INSIGHTS */}
            {lifeSubTab==='insights'&&(
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Instant Insights</div>
                    <div style={{fontSize:11,color:C.MUTED}}>{ruleInsights.length} observations</div>
                  </div>
                  <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
                    {ruleInsights.length===0&&<div style={{fontSize:13,color:C.MUTED,textAlign:'center',padding:'16px 0'}}>Keep logging — insights appear after a few days.</div>}
                    {ruleInsights.map((ins,i)=>{
                      const col=ins.type==='positive'?C.SUCCESS:ins.type==='warning'?C.WARN:ins.type==='alert'?C.DANGER:C.ACCENT;
                      const bg=ins.type==='positive'?'rgba(52,211,153,0.08)':ins.type==='warning'?'rgba(251,191,36,0.08)':ins.type==='alert'?'rgba(248,113,113,0.08)':'rgba(139,124,248,0.08)';
                      return <div key={i} style={{padding:'10px 12px',background:bg,borderRadius:10,border:`1px solid ${col}30`}}><div style={{fontSize:13,fontWeight:700,color:col,marginBottom:4}}>{ins.icon} {ins.title}</div><div style={{fontSize:12,color:C.TEXT,lineHeight:1.6}}>{ins.body}</div></div>;
                    })}
                  </div>
                </div>
                <div style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>AI Weekly Analysis</div><div style={{fontSize:11,color:C.MUTED,marginTop:2}}>Powered by Claude</div></div>
                    <button onClick={generateAIInsight} disabled={aiLoading} style={btn({fontSize:11,padding:'6px 12px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',fontWeight:700,opacity:aiLoading?0.6:1})}>{aiLoading?'Analysing...':'Generate'}</button>
                  </div>
                  <div style={{padding:'0 14px 14px'}}>
                    {aiError&&<div style={{fontSize:12,color:C.DANGER,padding:'8px 10px',background:'rgba(248,113,113,0.08)',borderRadius:8,marginBottom:8}}>{aiError}</div>}
                    {aiLoading&&<div style={{textAlign:'center',padding:'20px 0',fontSize:13,color:C.ACCENT}}>Analysing your week...</div>}
                    {!aiLoading&&aiInsight?<div><div style={{fontSize:11,color:C.MUTED,marginBottom:8}}>{aiInsight.week===wkDates[0]?'This week':'Generated '+fmtD(aiInsight.date)}</div><div style={{fontSize:13,color:C.TEXT,lineHeight:1.8,whiteSpace:'pre-wrap',padding:'12px',background:C.CARD,borderRadius:10,border:`1px solid ${C.B1}`}}>{aiInsight.text}</div></div>
                    :!aiLoading&&<div style={{fontSize:13,color:C.MUTED,textAlign:'center',padding:'16px 0',lineHeight:1.8}}>Tap Generate for a personalised analysis.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* GOALS */}
            {lifeSubTab==='goals'&&(
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:C.PANEL,borderRadius:12,padding:'10px 14px',border:`1px solid ${C.B1}`}}>
                  <button onClick={()=>{const[y,m]=curMonth.split('-').map(Number),d=new Date(y,m-2,1);setCurMonth(`${d.getFullYear()}-${pad(d.getMonth()+1)}`);}} style={btn({padding:'4px 12px',fontSize:16})}>&#8249;</button>
                  <span style={{fontSize:14,fontWeight:700,color:C.TEXT}}>{fmtMonth(curMonth)}</span>
                  <button onClick={()=>{const[y,m]=curMonth.split('-').map(Number),d=new Date(y,m,1);setCurMonth(`${d.getFullYear()}-${pad(d.getMonth()+1)}`);}} style={btn({padding:'4px 12px',fontSize:16})}>&#8250;</button>
                </div>
                <button onClick={()=>{setGoalForm({text:'',month:curMonth});setModal({mode:'goal'});}} style={btn({color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',fontSize:13,padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:6})}>+ Add Monthly Goal</button>
                {monthGoals.length===0&&<div style={{textAlign:'center',color:C.MUTED,marginTop:36,fontSize:15}}>&#127919;<br/><br/>No goals for this month</div>}
                {monthGoals.map(g=>{
                  const prog=goalProg(g);
                  return(
                    <div key={g.id} style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                      <div style={{padding:'13px 14px 10px',display:'flex',alignItems:'flex-start',gap:10}}>
                        <input type="checkbox" checked={g.done} onChange={()=>toggleGoal(g.id)} style={{accentColor:C.ACCENT,width:17,height:17,cursor:'pointer',flexShrink:0,marginTop:2}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:700,textDecoration:g.done?'line-through':'none',color:g.done?C.MUTED:C.TEXT}}>{g.text}</div>
                          {prog&&<div style={{marginTop:6}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.MUTED,marginBottom:4}}><span>Milestones</span><span style={{color:prog.done===prog.total?C.SUCCESS:C.MUTED}}>{prog.done}/{prog.total}</span></div><div style={{height:5,background:C.CARD,borderRadius:3}}><div style={{height:'100%',borderRadius:3,background:C.ACCENT,width:`${prog.total?(prog.done/prog.total)*100:0}%`,transition:'width 0.4s'}}/></div></div>}
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button onClick={()=>{setWgForm({goalId:g.id,week:'',text:''});setModal({mode:'weekgoal'});}} style={btn({fontSize:11,padding:'4px 8px',color:'#a3e635',borderColor:'rgba(163,230,53,0.3)',background:'rgba(163,230,53,0.08)'})}>+ Week</button>
                          <button onClick={()=>removeGoal(g.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.MUTED,fontSize:18,lineHeight:1,padding:2}}>&#215;</button>
                        </div>
                      </div>
                      {(g.milestones||[]).length>0&&<div style={{borderTop:`1px solid ${C.B1}`,padding:'8px 14px 12px'}}>
                        {(g.milestones||[]).map(m=>(
                          <div key={m.id} style={{display:'flex',alignItems:'center',gap:9,padding:'6px 0',borderBottom:`1px solid ${C.B1}`}}>
                            <input type="checkbox" checked={m.done} onChange={()=>toggleMstone(g.id,m.id)} style={{accentColor:C.SUCCESS,width:15,height:15,cursor:'pointer',flexShrink:0}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,textDecoration:m.done?'line-through':'none',color:m.done?C.MUTED:C.TEXT}}>{m.text}</div>
                              <div style={{fontSize:10,color:C.MUTED,marginTop:1}}>{(()=>{try{return new Date(m.week+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});}catch{return m.week;}})()}</div>
                            </div>
                            <button onClick={()=>removeMstone(g.id,m.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.MUTED,fontSize:16,lineHeight:1,padding:2}}>&#215;</button>
                          </div>
                        ))}
                      </div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* NOTES */}
            {lifeSubTab==='notes'&&(
              <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'10px 16px 8px',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>{fmtD(td)}</div><div style={{fontSize:11,color:C.MUTED,marginTop:1}}>Daily entry</div></div>
                    <button onClick={saveDailyEntry} style={btn({fontSize:12,padding:'6px 12px',color:C.SUCCESS,borderColor:'rgba(52,211,153,0.4)',background:'rgba(52,211,153,0.1)',fontWeight:700})}>&#128190; Save</button>
                  </div>
                </div>
                <div style={{flex:1,overflow:'hidden',padding:16,display:'flex',flexDirection:'column',gap:8}}>
                  <p style={{margin:0,fontSize:13,color:C.MUTED}}>Brain dump freely.</p>
                  <textarea value={thought} onChange={e=>updateDraft(e.target.value)} placeholder="What's on your mind today..." style={{...inp,flex:1,resize:'none',lineHeight:1.8,padding:'12px',fontSize:14}}/>
                </div>
                {entries.filter(e=>e.saved).length>0&&(
                  <div style={{borderTop:`1px solid ${C.B1}`,padding:'10px 16px',background:C.PANEL,flexShrink:0,maxHeight:'38%',overflowY:'auto'}}>
                    <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,fontWeight:700}}>Saved Entries</div>
                    {entries.filter(e=>e.saved).sort((a,b)=>b.date.localeCompare(a.date)).map(e=>(
                      <div key={e.date} style={{marginBottom:10,padding:'10px 12px',background:C.CARD,borderRadius:10,border:`1px solid ${C.B1}`}}>
                        <div style={{fontSize:11,color:C.ACCENT,marginBottom:5,fontWeight:700}}>{fmtD(e.date)}</div>
                        <div style={{fontSize:13,color:C.TEXT,lineHeight:1.6,whiteSpace:'pre-wrap',maxHeight:80,overflow:'hidden'}}>{e.draft}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEW */}
            {lifeSubTab==='review'&&(
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
                <div style={{background:C.PANEL,borderRadius:14,padding:'16px',border:`1px solid ${C.B1}`}}>
                  <div style={{fontSize:16,fontWeight:800,color:C.TEXT,marginBottom:4}}>Daily Review</div>
                  <div style={{fontSize:12,color:C.MUTED,marginBottom:18}}>{fmtD(td)}{todayReview&&<span style={{color:C.SUCCESS,marginLeft:8}}>&#10003; Saved today</span>}</div>
                  <label style={{fontSize:10,color:C.MUTED,marginBottom:8,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Overall mood</label>
                  <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
                    {MOODS.map(m=>(
                      <button key={m.value} onClick={()=>setReviewForm(f=>({...f,mood:f.mood===m.value?'':m.value}))}
                        style={{padding:'6px 12px',borderRadius:20,fontSize:13,cursor:'pointer',fontFamily:'inherit',border:`1px solid ${reviewForm.mood===m.value?m.col:C.B2}`,background:reviewForm.mood===m.value?`rgba(${hexToRgb(m.col)},0.15)`:'transparent',color:reviewForm.mood===m.value?m.col:C.MUTED,fontWeight:reviewForm.mood===m.value?700:400}}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                  {[['What went well today?','good','Something worth celebrating...'],['What could be improved?','improve','Be honest...'],["Tomorrow's #1 priority",'tomorrow','The one thing that matters most...']].map(([ql,key,ph])=>(
                    <div key={key} style={{marginBottom:16}}>
                      <label style={{fontSize:11,color:C.MUTED,marginBottom:5,display:'block'}}>{ql}</label>
                      <textarea value={reviewForm[key]||''} onChange={e=>setReviewForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} rows={2} style={{...inp,resize:'none',lineHeight:1.7}}/>
                    </div>
                  ))}
                  <button onClick={saveReview} style={{width:'100%',padding:'12px',background:'rgba(251,191,36,0.12)',border:`1px solid rgba(251,191,36,0.4)`,borderRadius:12,color:C.WARN,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>&#128190; Save Review</button>
                </div>
                {reviews.filter(r=>r.saved).length>0&&(
                  <div>
                    <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,fontWeight:700}}>Past reviews</div>
                    {reviews.filter(r=>r.saved).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(r=>(
                      <div key={r.date} style={{background:C.PANEL,borderRadius:12,padding:'12px 14px',border:`1px solid ${C.B1}`,marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                          <div style={{fontSize:12,fontWeight:700,color:C.ACCENT}}>{fmtD(r.date)}</div>
                          {r.mood&&<span style={{fontSize:14}}>{MOODS.find(m=>m.value===r.mood)?.icon||''}</span>}
                        </div>
                        {[['&#9989; Went well',r.good],['&#128295; Improve',r.improve],['&#127919; Tomorrow',r.tomorrow]].filter(([,v])=>v).map(([lbl,val])=>(
                          <div key={lbl} style={{marginBottom:6}}>
                            <div style={{fontSize:10,color:C.MUTED,fontWeight:700}} dangerouslySetInnerHTML={{__html:lbl}}/>
                            <div style={{fontSize:12,color:C.TEXT,marginTop:2}}>{val}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ===== MONEY TAB ===== */}
      {tab==='money'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* Sub-nav */}
          <div style={{display:'flex',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
            {[['log','📝','Log'],['budget','🎯','Budget'],['analytics','📊','Analytics']].map(([id,ic,lb])=>(
              <button key={id} onClick={()=>setExpenseView(id)}
                style={{flex:1,padding:'10px 4px 8px',background:'none',border:'none',
                  borderBottom:expenseView===id?`2px solid ${C.ACCENT}`:'2px solid transparent',
                  color:expenseView===id?C.ACCENT:C.MUTED,cursor:'pointer',fontSize:11,
                  fontWeight:expenseView===id?700:400,display:'flex',flexDirection:'column',
                  alignItems:'center',gap:2,fontFamily:'inherit'}}>
                <span style={{fontSize:16}}>{ic}</span>{lb}
              </button>
            ))}
          </div>

          {/* Month nav — shared across views */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
            <button onClick={()=>{const[y,m]=expCurMonth.split('-').map(Number),d=new Date(y,m-2,1);setExpCurMonth(`${d.getFullYear()}-${pad(d.getMonth()+1)}`);}} style={btn({padding:'4px 12px',fontSize:16})}>&#8249;</button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>{fmtMonth(expCurMonth)}</div>
              {monthTotal>0&&<div style={{fontSize:11,color:C.MUTED,marginTop:1}}>Total: <strong style={{color:C.TEXT}}>{monthTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>}
            </div>
            <button onClick={()=>{const[y,m]=expCurMonth.split('-').map(Number),d=new Date(y,m,1);setExpCurMonth(`${d.getFullYear()}-${pad(d.getMonth()+1)}`);}} style={btn({padding:'4px 12px',fontSize:16})}>&#8250;</button>
          </div>

          {/* ---- LOG VIEW ---- */}
          {expenseView==='log'&&(
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>

              {/* Add button row */}
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setExpForm({amount:'',catId:expenseCats[0]?.id||'food',note:'',date:today()});setShowAddExpense(true);}}
                  style={btn({flex:1,color:C.SUCCESS,borderColor:'rgba(52,211,153,0.4)',background:'rgba(52,211,153,0.08)',fontSize:13,padding:'10px',fontWeight:700})}>
                  + Add Expense
                </button>
                <button onClick={()=>setShowAddExpCat(true)}
                  style={btn({fontSize:11,padding:'10px 12px',color:C.MUTED})}>
                  ⚙️ Cats
                </button>
              </div>

              {/* Empty state */}
              {monthExpenses.length===0&&(
                <div style={{textAlign:'center',color:C.MUTED,marginTop:40,lineHeight:2}}>
                  <div style={{fontSize:44}}>💰</div>
                  <div style={{fontSize:15,color:C.TEXT,marginTop:10}}>No expenses this month</div>
                  <div style={{fontSize:13}}>Tap + Add to start tracking</div>
                </div>
              )}

              {/* Daily groups */}
              {Object.keys(dailyExpenses).sort((a,b)=>b.localeCompare(a)).map(date=>{
                const dayTotal = dailyExpenses[date].reduce((s,e)=>s+e.amount,0);
                const wd = new Date(date+'T00:00:00');
                const isToday = date===today();
                return(
                  <div key={date}>
                    {/* Day header */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 2px',marginBottom:4}}>
                      <div style={{fontSize:12,fontWeight:700,color:isToday?C.ACCENT:C.MUTED}}>
                        {isToday?'Today':fmtD(date)}
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:C.TEXT}}>
                        {dayTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </div>
                    </div>
                    {/* Expense rows */}
                    {dailyExpenses[date].map(exp=>{
                      const cat=expCatOf(exp.catId);
                      return(
                        <div key={exp.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 12px',background:C.PANEL,borderRadius:12,border:`1px solid ${C.B1}`,marginBottom:6}}>
                          {/* Cat icon */}
                          <div style={{width:38,height:38,borderRadius:10,background:`rgba(${hexToRgb(cat.col)},0.15)`,border:`1px solid rgba(${hexToRgb(cat.col)},0.4)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                            {cat.icon}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>{cat.label}</div>
                            {exp.note&&<div style={{fontSize:11,color:C.MUTED,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{exp.note}</div>}
                          </div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontSize:15,fontWeight:800,color:cat.col}}>
                              {exp.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                            </div>
                          </div>
                          <button onClick={()=>deleteExpense(exp.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.MUTED,fontSize:18,lineHeight:1,padding:'0 2px',flexShrink:0}}>×</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- BUDGET VIEW ---- */}
          {expenseView==='budget'&&(
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>

              {/* Month summary cards */}
              <div style={{display:'flex',gap:8}}>
                {[
                  ['💸','Spent',monthTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})],
                  ['🎯','Budget',monthBudgetTotal>0?monthBudgetTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'--'],
                  ['💚','Left',monthBudgetTotal>0?(monthBudgetTotal-monthTotal).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'--'],
                ].map(([ic,lb,val])=>{
                  const isNeg = lb==='Left' && monthBudgetTotal>0 && (monthBudgetTotal-monthTotal)<0;
                  return(
                    <div key={lb} style={{flex:1,background:C.PANEL,borderRadius:12,padding:'12px 6px',border:`1px solid ${C.B1}`,textAlign:'center'}}>
                      <div style={{fontSize:18}}>{ic}</div>
                      <div style={{fontSize:15,fontWeight:700,marginTop:2,color:isNeg?C.DANGER:C.TEXT}}>{val}</div>
                      <div style={{fontSize:10,color:C.MUTED,marginTop:2}}>{lb}</div>
                    </div>
                  );
                })}
              </div>

              {/* Overall progress */}
              {monthBudgetTotal>0&&(
                <div style={{background:C.PANEL,borderRadius:12,padding:'14px',border:`1px solid ${C.B1}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.MUTED,marginBottom:8}}>
                    <span>Overall budget used</span>
                    <span style={{fontWeight:700,color:monthTotal/monthBudgetTotal>1?C.DANGER:monthTotal/monthBudgetTotal>0.8?C.WARN:C.SUCCESS}}>
                      {Math.round((monthTotal/monthBudgetTotal)*100)}%
                    </span>
                  </div>
                  <div style={{height:10,background:C.CARD,borderRadius:5}}>
                    <div style={{height:'100%',borderRadius:5,
                      background:monthTotal/monthBudgetTotal>1?C.DANGER:monthTotal/monthBudgetTotal>0.8?C.WARN:C.SUCCESS,
                      width:`${Math.min((monthTotal/monthBudgetTotal)*100,100)}%`,transition:'width 0.5s'}}/>
                  </div>
                </div>
              )}

              <button onClick={()=>{setBudgetForm(monthBudget);setShowSetBudget(true);}}
                style={btn({color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',fontSize:13,padding:'10px',fontWeight:700})}>
                {monthBudgetTotal>0?'Edit budgets':'Set monthly budgets'}
              </button>

              {/* Per-category budget bars */}
              {spendByCat.length===0&&(
                <div style={{textAlign:'center',color:C.MUTED,marginTop:28,fontSize:13,lineHeight:1.8}}>
                  No spend or budgets set yet.<br/>Add expenses or set budgets above.
                </div>
              )}
              {spendByCat.map(cat=>{
                const pct = cat.budget>0 ? Math.min((cat.spent/cat.budget)*100,100) : 0;
                const over = cat.budget>0 && cat.spent>cat.budget;
                const barCol = over ? C.DANGER : pct>80 ? C.WARN : C.SUCCESS;
                const left = cat.budget>0 ? cat.budget-cat.spent : null;
                return(
                  <div key={cat.id} style={{background:C.PANEL,borderRadius:12,padding:'14px',border:`1px solid ${over?'rgba(248,113,113,0.4)':C.B1}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                      <div style={{width:36,height:36,borderRadius:9,background:`rgba(${hexToRgb(cat.col)},0.15)`,border:`1px solid rgba(${hexToRgb(cat.col)},0.4)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{cat.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>{cat.label}</div>
                        <div style={{fontSize:11,color:C.MUTED,marginTop:1}}>
                          <span style={{color:cat.col,fontWeight:700}}>{cat.spent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                          {cat.budget>0&&<> / {cat.budget.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</>}
                        </div>
                      </div>
                      {cat.budget>0&&(
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:over?C.DANGER:C.SUCCESS}}>
                            {over?'Over by ':'Left: '}{Math.abs(left).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                          </div>
                          <div style={{fontSize:10,color:C.MUTED}}>{Math.round((cat.spent/cat.budget)*100)}%</div>
                        </div>
                      )}
                    </div>
                    {cat.budget>0&&(
                      <div style={{height:8,background:C.CARD,borderRadius:4}}>
                        <div style={{height:'100%',borderRadius:4,background:barCol,width:`${pct}%`,transition:'width 0.5s'}}/>
                      </div>
                    )}
                    {!cat.budget&&<div style={{fontSize:11,color:C.MUTED,fontStyle:'italic'}}>No budget set for this category</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- ANALYTICS VIEW ---- */}
          {expenseView==='analytics'&&(
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>

              {/* 7-day bar chart */}
              <div style={{background:C.PANEL,borderRadius:14,padding:'16px',border:`1px solid ${C.B1}`}}>
                <div style={{fontSize:13,fontWeight:700,color:C.TEXT,marginBottom:14}}>Last 7 days</div>
                <div style={{display:'flex',gap:6,alignItems:'flex-end',height:90}}>
                  {weeklySpend.map(({date:d,day,total})=>{
                    const h = total>0 ? Math.max((total/maxDaily)*80,6) : 3;
                    const isToday = d===today();
                    return(
                      <div key={d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                        {total>0&&<div style={{fontSize:9,color:C.MUTED,textAlign:'center',lineHeight:1.2}}>
                          {total>=1000?(total/1000).toFixed(1)+'k':Math.round(total)}
                        </div>}
                        <div style={{width:'100%',height:h,background:isToday?C.ACCENT:'rgba(139,124,248,0.5)',borderRadius:'4px 4px 0 0',minHeight:3,transition:'height 0.4s'}}/>
                        <div style={{fontSize:9,color:isToday?C.ACCENT:C.MUTED,fontWeight:isToday?700:400}}>{day}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.MUTED,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.B1}`}}>
                  <span>7-day total: <strong style={{color:C.TEXT}}>{weeklySpend.reduce((s,d)=>s+d.total,0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></span>
                  <span>Daily avg: <strong style={{color:C.TEXT}}>{(weeklySpend.reduce((s,d)=>s+d.total,0)/7).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></span>
                </div>
              </div>

              {/* Category breakdown pie-style list */}
              <div style={{background:C.PANEL,borderRadius:14,padding:'16px',border:`1px solid ${C.B1}`}}>
                <div style={{fontSize:13,fontWeight:700,color:C.TEXT,marginBottom:14}}>{fmtMonth(expCurMonth)} by category</div>
                {spendByCat.filter(c=>c.spent>0).length===0&&(
                  <div style={{fontSize:13,color:C.MUTED,textAlign:'center',padding:'16px 0'}}>No expenses this month.</div>
                )}
                {spendByCat.filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent).map(cat=>{
                  const pct = monthTotal>0 ? (cat.spent/monthTotal)*100 : 0;
                  return(
                    <div key={cat.id} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                        <span style={{fontSize:13,color:cat.col,fontWeight:600}}>{cat.icon} {cat.label}</span>
                        <div style={{textAlign:'right'}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.TEXT}}>{cat.spent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                          <span style={{fontSize:10,color:C.MUTED,marginLeft:6}}>{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <div style={{height:7,background:C.CARD,borderRadius:4}}>
                        <div style={{height:'100%',borderRadius:4,background:cat.col,width:`${pct}%`,transition:'width 0.5s ease',opacity:0.85}}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly comparison — last 4 months */}
              {(()=>{
                const months = Array.from({length:4},(_,i)=>{
                  const [y,m] = expCurMonth.split('-').map(Number);
                  const d = new Date(y,m-1-i,1);
                  const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
                  const total = expenses.filter(e=>monthOf(e.date)===key).reduce((s,e)=>s+e.amount,0);
                  return {key, label:d.toLocaleDateString('en-US',{month:'short'}), total};
                }).reverse();
                const maxM = Math.max(...months.map(m=>m.total),1);
                return(
                  <div style={{background:C.PANEL,borderRadius:14,padding:'16px',border:`1px solid ${C.B1}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.TEXT,marginBottom:14}}>4-month trend</div>
                    <div style={{display:'flex',gap:10,alignItems:'flex-end',height:80}}>
                      {months.map(m=>{
                        const h = m.total>0 ? Math.max((m.total/maxM)*70,6) : 3;
                        const isCur = m.key===expCurMonth;
                        return(
                          <div key={m.key} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                            {m.total>0&&<div style={{fontSize:9,color:C.MUTED}}>{m.total>=1000?(m.total/1000).toFixed(1)+'k':Math.round(m.total)}</div>}
                            <div style={{width:'100%',height:h,background:isCur?C.ACCENT:'rgba(139,124,248,0.35)',borderRadius:'4px 4px 0 0',minHeight:3}}/>
                            <div style={{fontSize:10,color:isCur?C.ACCENT:C.MUTED,fontWeight:isCur?700:400}}>{m.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Top expenses this month */}
              {monthExpenses.length>0&&(
                <div style={{background:C.PANEL,borderRadius:14,padding:'16px',border:`1px solid ${C.B1}`}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.TEXT,marginBottom:12}}>Top expenses this month</div>
                  {[...monthExpenses].sort((a,b)=>b.amount-a.amount).slice(0,5).map(exp=>{
                    const cat=expCatOf(exp.catId);
                    return(
                      <div key={exp.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.B1}`}}>
                        <span style={{fontSize:18,flexShrink:0}}>{cat.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,color:C.TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{exp.note||cat.label}</div>
                          <div style={{fontSize:10,color:C.MUTED,marginTop:1}}>{fmtD(exp.date)}</div>
                        </div>
                        <div style={{fontSize:14,fontWeight:700,color:cat.col,flexShrink:0}}>
                          {exp.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== WARDROBE / STYLE TAB (opened from More drawer) ===== */}
      {tab==='wardrobe'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* Sub-nav */}
          <div style={{display:'flex',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,flexShrink:0}}>
            {[['wardrobe','👗','Wardrobe'],['outfits','✨','Outfits'],['calendar','📅','Calendar']].map(([id,ic,lb])=>(
              <button key={id} onClick={()=>setWardrobeView(id)}
                style={{flex:1,padding:'10px 4px 8px',background:'none',border:'none',
                  borderBottom:wardrobeView===id?`2px solid ${C.ACCENT}`:'2px solid transparent',
                  color:wardrobeView===id?C.ACCENT:C.MUTED,cursor:'pointer',fontSize:11,
                  fontWeight:wardrobeView===id?700:400,display:'flex',flexDirection:'column',
                  alignItems:'center',gap:2,fontFamily:'inherit'}}>
                <span style={{fontSize:16}}>{ic}</span>{lb}
              </button>
            ))}
          </div>

          {/* ---- WARDROBE VIEW ---- */}
          {wardrobeView==='wardrobe'&&(
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
              <button onClick={()=>{setItemForm({name:'',category:'tops',photo:''});setShowAddItem(true);}}
                style={btn({color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',fontSize:13,padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontWeight:700})}>
                + Add clothing item
              </button>

              {wardrobe.length===0&&(
                <div style={{textAlign:'center',color:C.MUTED,marginTop:36,lineHeight:2}}>
                  <div style={{fontSize:44}}>👗</div>
                  <div style={{fontSize:15,marginTop:10,color:C.TEXT}}>Your wardrobe is empty</div>
                  <div style={{fontSize:13}}>Tap + Add to start cataloguing your clothes</div>
                </div>
              )}

              {/* Group by category */}
              {WARDROBE_CATS.filter(cat=>wardrobe.some(i=>i.category===cat.id)).map(cat=>{
                const items=wardrobe.filter(i=>i.category===cat.id);
                const isOpen=expandedCat===cat.id||expandedCat===null;
                return(
                  <div key={cat.id}>
                    <button onClick={()=>setExpandedCat(expandedCat===cat.id?null:cat.id)}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 0',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',borderBottom:`1px solid ${C.B1}`}}>
                      <span style={{fontSize:18}}>{cat.icon}</span>
                      <span style={{flex:1,fontSize:13,fontWeight:700,color:C.TEXT,textAlign:'left'}}>{cat.label}</span>
                      <span style={{fontSize:12,color:C.MUTED}}>{items.length} items</span>
                      <span style={{fontSize:12,color:C.MUTED,marginLeft:4,transition:'transform 0.2s',display:'inline-block',transform:isOpen?'rotate(180deg)':'rotate(0deg)'}}>▾</span>
                    </button>
                    {isOpen&&(
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,paddingTop:10}}>
                        {items.map(item=>(
                          <div key={item.id} style={{background:C.PANEL,borderRadius:12,border:`1px solid ${C.B1}`,overflow:'hidden',position:'relative'}}>
                            {/* Photo or placeholder */}
                            <div style={{width:'100%',aspectRatio:'3/4',background:C.CARD,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                              {item.photo
                                ?<img src={item.photo} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                :<span style={{fontSize:32}}>{cat.icon}</span>
                              }
                            </div>
                            <div style={{padding:'7px 8px'}}>
                              <div style={{fontSize:12,fontWeight:700,color:C.TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</div>
                            </div>
                            <button onClick={()=>deleteItem(item.id)}
                              style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'50%',width:22,height:22,cursor:'pointer',color:'#fff',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- OUTFITS VIEW ---- */}
          {wardrobeView==='outfits'&&(
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
              <button onClick={()=>{setOutfitForm({name:'',itemIds:[]});setShowAddOutfit(true);}}
                style={btn({color:'#a3e635',borderColor:'rgba(163,230,53,0.4)',background:'rgba(163,230,53,0.08)',fontSize:13,padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontWeight:700})}>
                + Create outfit
              </button>

              {outfits.length===0&&(
                <div style={{textAlign:'center',color:C.MUTED,marginTop:36,lineHeight:2}}>
                  <div style={{fontSize:44}}>✨</div>
                  <div style={{fontSize:15,marginTop:10,color:C.TEXT}}>No outfits yet</div>
                  <div style={{fontSize:13}}>Combine wardrobe items into saved outfits</div>
                </div>
              )}

              {outfits.map(outfit=>{
                const items=outfit.itemIds.map(id=>wardrobe.find(i=>i.id===id)).filter(Boolean);
                // Count how many days this outfit is planned
                const plannedDays=Object.values(outfitPlan).filter(id=>id===outfit.id).length;
                return(
                  <div key={outfit.id} style={{background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>{outfit.name}</div>
                        <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{items.length} items{plannedDays>0?` · planned ${plannedDays}×`:''}</div>
                      </div>
                      <button onClick={()=>deleteOutfit(outfit.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.MUTED,fontSize:18,lineHeight:1,padding:4}}>×</button>
                    </div>
                    {/* Item preview strip */}
                    {items.length>0&&(
                      <div style={{padding:'0 14px 14px',display:'flex',gap:8,overflowX:'auto'}}>
                        {items.map(item=>{
                          const cat=WARDROBE_CATS.find(c=>c.id===item.category);
                          return(
                            <div key={item.id} style={{flexShrink:0,width:64}}>
                              <div style={{width:64,height:80,background:C.CARD,borderRadius:8,border:`1px solid ${C.B1}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                                {item.photo
                                  ?<img src={item.photo} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                  :<span style={{fontSize:22}}>{cat?.icon||'👕'}</span>
                                }
                              </div>
                              <div style={{fontSize:9,color:C.MUTED,textAlign:'center',marginTop:3,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- CALENDAR VIEW ---- */}
          {wardrobeView==='calendar'&&(
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
              {/* Week nav */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:C.PANEL,borderRadius:12,padding:'8px 12px',border:`1px solid ${C.B1}`,flexShrink:0}}>
                <button onClick={()=>setWardrobeCurDay(addDays(wardrobeCurDay,-7))} style={btn({padding:'4px 12px',fontSize:16})}>&#8249;</button>
                <span style={{fontSize:13,fontWeight:700,color:C.TEXT}}>
                  {new Date(wkWardrobeDates[0]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {new Date(wkWardrobeDates[6]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </span>
                <button onClick={()=>setWardrobeCurDay(addDays(wardrobeCurDay,7))} style={btn({padding:'4px 12px',fontSize:16})}>&#8250;</button>
              </div>

              {/* 7-day outfit grid */}
              {wkWardrobeDates.map(d=>{
                const outfitId=outfitPlan[d];
                const outfit=outfits.find(o=>o.id===outfitId);
                const items=(outfit?.itemIds||[]).map(id=>wardrobe.find(i=>i.id===id)).filter(Boolean);
                const wd=new Date(d+'T00:00:00');
                const isToday=d===td;
                const isPast=d<td;
                return(
                  <div key={d} style={{background:C.PANEL,borderRadius:14,border:`1px solid ${isToday?C.ACCENT:C.B1}`,overflow:'hidden',opacity:isPast?0.7:1}}>
                    <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                      <div style={{minWidth:40}}>
                        <div style={{fontSize:12,fontWeight:700,color:isToday?C.ACCENT:C.TEXT}}>{DAYS[wd.getDay()]}</div>
                        <div style={{fontSize:10,color:C.MUTED}}>{wd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                      </div>

                      {outfit?(
                        <div style={{flex:1,display:'flex',alignItems:'center',gap:8}}>
                          {/* Item thumbnails */}
                          <div style={{display:'flex',gap:4}}>
                            {items.slice(0,4).map(item=>{
                              const cat=WARDROBE_CATS.find(c=>c.id===item.category);
                              return(
                                <div key={item.id} style={{width:36,height:44,background:C.CARD,borderRadius:6,border:`1px solid ${C.B1}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                                  {item.photo
                                    ?<img src={item.photo} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                    :<span style={{fontSize:14}}>{cat?.icon||'👕'}</span>
                                  }
                                </div>
                              );
                            })}
                            {items.length>4&&<div style={{width:36,height:44,background:C.CARD,borderRadius:6,border:`1px solid ${C.B1}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:C.MUTED}}>+{items.length-4}</div>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:C.TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{outfit.name}</div>
                            <div style={{fontSize:10,color:C.MUTED,marginTop:1}}>{items.length} items</div>
                          </div>
                          <div style={{display:'flex',gap:4,flexShrink:0}}>
                            <button onClick={()=>setShowAssign(d)} style={btn({fontSize:10,padding:'4px 8px'})}>Change</button>
                            <button onClick={()=>unassignOutfit(d)} style={{background:'none',border:'none',cursor:'pointer',color:C.MUTED,fontSize:16,lineHeight:1,padding:'4px'}}>×</button>
                          </div>
                        </div>
                      ):(
                        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <span style={{fontSize:12,color:C.MUTED}}>No outfit planned</span>
                          {outfits.length>0?(
                            <button onClick={()=>setShowAssign(d)} style={btn({fontSize:11,padding:'5px 12px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.08)'})}>Plan outfit</button>
                          ):(
                            <span style={{fontSize:11,color:C.MUTED}}>Create outfits first</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {outfits.length===0&&(
                <div style={{textAlign:'center',color:C.MUTED,padding:'24px 0',fontSize:13}}>
                  Create some outfits in the Outfits tab first, then plan them here.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== MORE TAB ===== */}
      {tab==='more'&&(
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:12,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,fontWeight:700,marginBottom:4}}>Features</div>

          {[
            {icon:'👗',label:'Style & Wardrobe',desc:'Catalogue clothes and plan outfits',action:()=>setTab('wardrobe')},
            {icon:'📊',label:'Week Summary',desc:'Stats, charts, and PDF export',action:()=>setShowSum(true)},
            {icon:'🔍',label:'Search',desc:'Find any block across all dates',action:()=>setShowSearch(true)},
            {icon:'📋',label:'Templates',desc:'Save and reuse daily schedules',action:()=>setShowTemplates(true)},
          ].map(item=>(
            <button key={item.label} onClick={item.action}
              style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,cursor:'pointer',textAlign:'left',fontFamily:'inherit',width:'100%'}}>
              <span style={{fontSize:26,flexShrink:0}}>{item.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>{item.label}</div>
                <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{item.desc}</div>
              </div>
              <span style={{color:C.MUTED,fontSize:16,flexShrink:0}}>›</span>
            </button>
          ))}

          <div style={{fontSize:12,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,fontWeight:700,marginTop:8,marginBottom:4}}>Settings & Data</div>

          {/* Theme toggle */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:26}}>{theme==='dark'?'🌙':'☀️'}</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>{theme==='dark'?'Dark mode':'Light mode'}</div>
                <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>Toggle app theme</div>
              </div>
            </div>
            <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
              style={{width:48,height:26,borderRadius:13,background:theme==='dark'?C.ACCENT:'rgba(0,0,0,0.15)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
              <div style={{position:'absolute',top:3,left:theme==='dark'?24:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
            </button>
          </div>

          {/* Notifications */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:26}}>🔔</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Notifications</div>
                <div style={{fontSize:12,color:notifPerm==='granted'?C.SUCCESS:C.MUTED,marginTop:2}}>{notifPerm==='granted'?'Enabled':'Disabled'}</div>
              </div>
            </div>
            {notifPerm!=='granted'
              ?<button onClick={requestNotif} style={btn({fontSize:12,padding:'7px 14px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)'})}>Enable</button>
              :<span style={{fontSize:18}}>✅</span>}
          </div>

          {/* Your name */}
          <div style={{padding:'14px 16px',background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
              <span style={{fontSize:26}}>👤</span>
              <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Your name</div>
            </div>
            <input value={userName} onChange={e=>setUserName(e.target.value)} placeholder="First name for personalisation"
              style={{...inp,fontSize:13}}/>
          </div>

          {/* Data management */}
          <div style={{padding:'14px 16px',background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
              <span style={{fontSize:26}}>💾</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Your data</div>
                <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>Backup, restore, or export</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[
                {label:'Export JSON',col:C.SUCCESS,action:exportData},
                {label:'Import JSON',col:C.ACCENT,action:importData},
                {label:'Export iCal',col:'#34d399',action:exportICal},
                {label:'Export PDF',col:C.DANGER,action:()=>{exportPDF();}},
              ].map(b=>(
                <button key={b.label} onClick={b.action}
                  style={{flex:'1 1 calc(50% - 4px)',padding:'8px',background:C.CARD,border:`1px solid ${C.B1}`,borderRadius:10,color:b.col,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intro tour */}
          <button onClick={()=>{setObStep(0);setShowOb(true);}}
            style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:C.PANEL,borderRadius:14,border:`1px solid ${C.B1}`,cursor:'pointer',textAlign:'left',fontFamily:'inherit',width:'100%'}}>
            <span style={{fontSize:26}}>📖</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>Intro tour</div>
              <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>Replay onboarding slides</div>
            </div>
            <span style={{color:C.MUTED,fontSize:16}}>›</span>
          </button>

          {/* Danger zone */}
          <div style={{padding:'14px 16px',background:'rgba(248,113,113,0.05)',borderRadius:14,border:`1px solid rgba(248,113,113,0.2)`}}>
            <div style={{fontSize:12,color:C.DANGER,fontWeight:700,marginBottom:8}}>Danger zone</div>
            <button onClick={()=>setShowClearConfirm(true)}
              style={{width:'100%',padding:'9px',background:'rgba(248,113,113,0.1)',border:`1px solid rgba(248,113,113,0.35)`,borderRadius:10,color:C.DANGER,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Clear all data permanently
            </button>
          </div>

          {/* App version / about */}
          <div style={{textAlign:'center',padding:'16px 0',fontSize:11,color:C.MUTED,lineHeight:1.8}}>
            LifeOS — Life Companion<br/>
            Your data is stored locally on this device.
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Clear data confirmation */}
      {showClearConfirm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:24}}>
          <div style={{background:C.PANEL,borderRadius:20,padding:28,width:'100%',maxWidth:400,border:`1px solid rgba(248,113,113,0.4)`,boxSizing:'border-box'}}>
            <div style={{fontSize:36,textAlign:'center',marginBottom:12}}>⚠️</div>
            <div style={{fontSize:17,fontWeight:800,color:C.TEXT,textAlign:'center',marginBottom:8}}>Clear all data?</div>
            <div style={{fontSize:13,color:C.MUTED,textAlign:'center',lineHeight:1.7,marginBottom:24}}>
              This will permanently delete all your blocks, goals, notes, expenses, habits, mood logs, wardrobe, and settings.<br/><br/>
              <strong style={{color:C.DANGER}}>This cannot be undone.</strong>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowClearConfirm(false)}
                style={{flex:1,padding:'12px',background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:12,color:C.TEXT,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                Cancel
              </button>
              <button onClick={clearAllData}
                style={{flex:1,padding:'12px',background:'rgba(248,113,113,0.15)',border:`1px solid rgba(248,113,113,0.5)`,borderRadius:12,color:C.DANGER,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Yes, delete everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add expense */}
      {showAddExpense&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setShowAddExpense(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Add Expense</h3>

            {/* Amount — big input */}
            <div style={{marginBottom:18,textAlign:'center'}}>
              <div style={{fontSize:11,color:C.MUTED,marginBottom:8,textTransform:'uppercase',letterSpacing:0.8}}>Amount</div>
              <input
                autoFocus
                type="number" inputMode="decimal"
                value={expForm.amount}
                onChange={e=>setExpForm(f=>({...f,amount:e.target.value}))}
                placeholder="0.00"
                style={{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:12,color:C.SUCCESS,fontSize:32,fontWeight:800,padding:'14px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit',textAlign:'center'}}
              />
            </div>

            {/* Category pills */}
            <div style={{fontSize:11,color:C.MUTED,marginBottom:8,textTransform:'uppercase',letterSpacing:0.8}}>Category</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:16}}>
              {expenseCats.map(cat=>(
                <button key={cat.id} onClick={()=>setExpForm(f=>({...f,catId:cat.id}))}
                  style={{padding:'7px 13px',borderRadius:20,fontSize:13,cursor:'pointer',fontFamily:'inherit',
                    border:`1px solid ${expForm.catId===cat.id?cat.col:'rgba(255,255,255,0.1)'}`,
                    background:expForm.catId===cat.id?`rgba(${hexToRgb(cat.col)},0.15)`:'transparent',
                    color:expForm.catId===cat.id?cat.col:C.MUTED,
                    fontWeight:expForm.catId===cat.id?700:400}}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Note */}
            <div style={{fontSize:11,color:C.MUTED,marginBottom:6,textTransform:'uppercase',letterSpacing:0.8}}>Note (optional)</div>
            <input value={expForm.note} onChange={e=>setExpForm(f=>({...f,note:e.target.value}))}
              placeholder="What was this for?" onKeyDown={e=>e.key==='Enter'&&addExpense()}
              style={{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:14,padding:'9px 11px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit',marginBottom:16}}/>

            {/* Date */}
            <div style={{fontSize:11,color:C.MUTED,marginBottom:6,textTransform:'uppercase',letterSpacing:0.8}}>Date</div>
            <input type="date" value={expForm.date} onChange={e=>setExpForm(f=>({...f,date:e.target.value}))}
              style={{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:14,padding:'9px 11px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit',marginBottom:22}}/>

            <div style={{display:'flex',gap:10}}>
              <button onClick={addExpense}
                style={{flex:1,padding:'13px',background:C.SUCCESS,border:'none',borderRadius:12,color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Add Expense
              </button>
              <button onClick={()=>setShowAddExpense(false)}
                style={{padding:'13px 18px',background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:12,color:C.MUTED,fontSize:16,cursor:'pointer',fontFamily:'inherit'}}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage expense categories */}
      {showAddExpCat&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setShowAddExpCat(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Expense Categories</h3>

            {/* Add new */}
            <div style={{background:C.CARD,borderRadius:12,padding:'14px',border:`1px solid ${C.B1}`,marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.TEXT,marginBottom:12}}>Add custom category</div>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <input value={expCatForm.label} onChange={e=>setExpCatForm(f=>({...f,label:e.target.value}))}
                  placeholder="Category name" style={{background:C.PANEL,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:13,padding:'8px 10px',outline:'none',flex:1,fontFamily:'inherit'}}/>
                <input value={expCatForm.icon} onChange={e=>setExpCatForm(f=>({...f,icon:e.target.value}))}
                  placeholder="💳" style={{background:C.PANEL,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:20,padding:'8px',outline:'none',width:52,textAlign:'center',fontFamily:'inherit'}}/>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
                {COLOR_PALETTE.map(c=><button key={c} onClick={()=>setExpCatForm(f=>({...f,col:c}))} style={{width:26,height:26,borderRadius:'50%',background:c,border:`2px solid ${expCatForm.col===c?'#fff':'transparent'}`,cursor:'pointer',transition:'transform 0.1s',transform:expCatForm.col===c?'scale(1.2)':'scale(1)'}}/>)}
              </div>
              <button onClick={saveNewExpCat} style={{width:'100%',padding:'9px',background:'rgba(139,124,248,0.15)',border:`1px solid rgba(139,124,248,0.4)`,borderRadius:10,color:C.ACCENT,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Add Category</button>
            </div>

            {/* Existing categories */}
            <div style={{fontSize:11,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10}}>All categories</div>
            {expenseCats.map(cat=>{
              const isDefault=['food','transport','shopping','health','entertainment','bills','other'].includes(cat.id);
              return(
                <div key={cat.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:C.CARD,borderRadius:10,marginBottom:6,border:`1px solid ${C.B1}`}}>
                  <div style={{width:34,height:34,borderRadius:8,background:`rgba(${hexToRgb(cat.col)},0.15)`,border:`1px solid rgba(${hexToRgb(cat.col)},0.4)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{cat.icon}</div>
                  <span style={{flex:1,fontSize:13,fontWeight:600,color:C.TEXT}}>{cat.label}</span>
                  {isDefault
                    ?<span style={{fontSize:10,color:C.MUTED,padding:'2px 8px',background:C.B1,borderRadius:10}}>default</span>
                    :<button onClick={()=>deleteExpCat(cat.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.DANGER,fontSize:18,lineHeight:1,padding:4}}>🗑</button>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Set budgets */}
      {showSetBudget&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setShowSetBudget(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 4px',fontSize:17,fontWeight:700,color:C.TEXT}}>Monthly Budgets</h3>
            <div style={{fontSize:12,color:C.MUTED,marginBottom:20}}>{fmtMonth(expCurMonth)} — set 0 to skip a category</div>

            {expenseCats.map(cat=>(
              <div key={cat.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${C.B1}`}}>
                <div style={{width:34,height:34,borderRadius:8,background:`rgba(${hexToRgb(cat.col)},0.15)`,border:`1px solid rgba(${hexToRgb(cat.col)},0.4)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{cat.icon}</div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:C.TEXT}}>{cat.label}</div>
                <input
                  type="number" inputMode="decimal"
                  value={budgetForm[cat.id]||''}
                  onChange={e=>setBudgetForm(f=>({...f,[cat.id]:e.target.value}))}
                  placeholder="0.00"
                  style={{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:cat.col,fontSize:14,fontWeight:700,padding:'7px 10px',outline:'none',width:100,textAlign:'right',fontFamily:'inherit'}}
                />
              </div>
            ))}

            <div style={{display:'flex',gap:10,marginTop:22}}>
              <button onClick={saveBudgets} style={{flex:1,padding:'13px',background:'rgba(139,124,248,0.15)',border:`1px solid rgba(139,124,248,0.4)`,borderRadius:12,color:C.ACCENT,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Save Budgets</button>
              <button onClick={()=>setShowSetBudget(false)} style={{padding:'13px 18px',background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:12,color:C.MUTED,fontSize:16,cursor:'pointer',fontFamily:'inherit'}}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Add clothing item */}
      {showAddItem&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setShowAddItem(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Add clothing item</h3>

            {/* Photo upload */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,color:C.MUTED,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Photo (optional)</label>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{width:80,height:100,background:C.CARD,borderRadius:10,border:`1px solid ${C.B2}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                  {itemForm.photo
                    ?<img src={itemForm.photo} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :<span style={{fontSize:28,color:C.MUTED}}>📷</span>
                  }
                </div>
                <div style={{flex:1}}>
                  <input type="file" accept="image/*" id="item-photo-input" style={{display:'none'}}
                    onChange={async e=>{
                      const f=e.target.files?.[0];
                      if(!f) return;
                      try{ const b64=await readPhoto(f); setItemForm(p=>({...p,photo:b64})); }
                      catch(err){ alert('Could not load photo: '+err.message); }
                    }}/>
                  <button onClick={()=>document.getElementById('item-photo-input').click()}
                    style={btn({fontSize:12,padding:'8px 14px',width:'100%',marginBottom:8})}>
                    {itemForm.photo?'Change photo':'Choose photo'}
                  </button>
                  {itemForm.photo&&<button onClick={()=>setItemForm(p=>({...p,photo:''}))}
                    style={btn({fontSize:11,padding:'6px 14px',width:'100%',color:C.DANGER,borderColor:'rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.06)'})}>
                    Remove photo
                  </button>}
                  <div style={{fontSize:10,color:C.MUTED,marginTop:6}}>Photos are stored on your device only.</div>
                </div>
              </div>
            </div>

            {/* Name */}
            <label style={{fontSize:10,color:C.MUTED,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Name</label>
            <input value={itemForm.name} onChange={e=>setItemForm(p=>({...p,name:e.target.value}))}
              placeholder="e.g. White linen shirt" style={{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:14,padding:'9px 11px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit',marginBottom:16}}/>

            {/* Category */}
            <label style={{fontSize:10,color:C.MUTED,marginBottom:8,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Category</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:22}}>
              {WARDROBE_CATS.map(cat=>(
                <button key={cat.id} onClick={()=>setItemForm(p=>({...p,category:cat.id}))}
                  style={{padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'inherit',
                    border:`1px solid ${itemForm.category===cat.id?C.ACCENT:C.B2}`,
                    background:itemForm.category===cat.id?'rgba(139,124,248,0.15)':'transparent',
                    color:itemForm.category===cat.id?C.ACCENT:C.MUTED,
                    fontWeight:itemForm.category===cat.id?700:400}}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={saveItem} style={btn({flex:1,background:'rgba(139,124,248,0.15)',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Add to wardrobe</button>
              <button onClick={()=>setShowAddItem(false)} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Build outfit */}
      {showAddOutfit&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setShowAddOutfit(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Create outfit</h3>

            {/* Outfit name */}
            <label style={{fontSize:10,color:C.MUTED,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Outfit name</label>
            <input value={outfitForm.name} onChange={e=>setOutfitForm(p=>({...p,name:e.target.value}))}
              placeholder="e.g. Monday office look" style={{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:14,padding:'9px 11px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit',marginBottom:18}}/>

            {/* Selected items preview */}
            {outfitForm.itemIds.length>0&&(
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:C.MUTED,marginBottom:8,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Selected ({outfitForm.itemIds.length})</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {outfitForm.itemIds.map(id=>{
                    const item=wardrobe.find(i=>i.id===id);
                    if(!item) return null;
                    const cat=WARDROBE_CATS.find(c=>c.id===item.category);
                    return(
                      <div key={id} style={{position:'relative'}}>
                        <div style={{width:56,height:70,background:C.CARD,borderRadius:8,border:`2px solid ${C.ACCENT}`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {item.photo?<img src={item.photo} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:20}}>{cat?.icon||'👕'}</span>}
                        </div>
                        <button onClick={()=>setOutfitForm(p=>({...p,itemIds:p.itemIds.filter(x=>x!==id)}))}
                          style={{position:'absolute',top:-4,right:-4,background:C.DANGER,border:'none',borderRadius:'50%',width:18,height:18,cursor:'pointer',color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pick from wardrobe */}
            <label style={{fontSize:10,color:C.MUTED,marginBottom:10,display:'block',textTransform:'uppercase',letterSpacing:0.8}}>Pick items from wardrobe</label>
            {wardrobe.length===0&&<div style={{fontSize:13,color:C.MUTED,textAlign:'center',padding:'16px 0'}}>Add items to your wardrobe first.</div>}
            {WARDROBE_CATS.filter(cat=>wardrobe.some(i=>i.category===cat.id)).map(cat=>(
              <div key={cat.id} style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:C.TEXT,marginBottom:8}}>{cat.icon} {cat.label}</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {wardrobe.filter(i=>i.category===cat.id).map(item=>{
                    const sel=outfitForm.itemIds.includes(item.id);
                    return(
                      <button key={item.id} onClick={()=>setOutfitForm(p=>({...p,itemIds:sel?p.itemIds.filter(x=>x!==item.id):[...p.itemIds,item.id]}))}
                        style={{background:'none',border:`2px solid ${sel?C.ACCENT:C.B2}`,borderRadius:10,padding:0,cursor:'pointer',position:'relative',flexShrink:0}}>
                        <div style={{width:56,height:70,background:C.CARD,borderRadius:8,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {item.photo?<img src={item.photo} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:20}}>{cat.icon}</span>}
                        </div>
                        {sel&&<div style={{position:'absolute',top:0,right:0,bottom:0,left:0,background:'rgba(139,124,248,0.2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:18}}>✓</span>
                        </div>}
                        <div style={{fontSize:9,color:C.MUTED,textAlign:'center',marginTop:3,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',maxWidth:56}}>{item.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={saveOutfit} style={btn({flex:1,background:'rgba(163,230,53,0.1)',color:'#a3e635',borderColor:'rgba(163,230,53,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Save outfit</button>
              <button onClick={()=>setShowAddOutfit(false)} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign outfit to day */}
      {showAssign&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setShowAssign(null)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 4px',fontSize:17,fontWeight:700,color:C.TEXT}}>Plan outfit</h3>
            <div style={{fontSize:12,color:C.MUTED,marginBottom:18}}>{fmtD(showAssign)}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {outfits.map(outfit=>{
                const items=outfit.itemIds.map(id=>wardrobe.find(i=>i.id===id)).filter(Boolean);
                const isCurrent=outfitPlan[showAssign]===outfit.id;
                return(
                  <button key={outfit.id} onClick={()=>assignOutfit(showAssign,outfit.id)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:isCurrent?'rgba(139,124,248,0.1)':C.CARD,
                      borderRadius:12,border:`1px solid ${isCurrent?C.ACCENT:C.B1}`,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                    {/* Item strip */}
                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                      {items.slice(0,3).map(item=>{
                        const cat=WARDROBE_CATS.find(c=>c.id===item.category);
                        return(
                          <div key={item.id} style={{width:36,height:44,background:C.PANEL,borderRadius:6,border:`1px solid ${C.B1}`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {item.photo?<img src={item.photo} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:14}}>{cat?.icon||'👕'}</span>}
                          </div>
                        );
                      })}
                      {items.length===0&&<div style={{width:36,height:44,background:C.PANEL,borderRadius:6,border:`1px solid ${C.B1}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>✨</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:isCurrent?C.ACCENT:C.TEXT}}>{outfit.name}</div>
                      <div style={{fontSize:11,color:C.MUTED,marginTop:2}}>{items.length} items</div>
                    </div>
                    {isCurrent&&<span style={{fontSize:18,flexShrink:0}}>✓</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>setShowAssign(null)} style={{...btn({fontSize:13,padding:'11px',marginTop:14,width:'100%'})}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add/Edit Block */}
      {modal?.mode&&['add','edit'].includes(modal.mode)&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>{modal.mode==='add'?'Add Block':'Edit Block'}</h3>
            <label style={lbl}>Label</label>
            <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder={catOf(cats,form.cat).label} style={{...inp,marginBottom:16}}/>
            <label style={lbl}>Category</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:18}}>
              {cats.map(c=><button key={c.id} onClick={()=>setForm(f=>({...f,cat:c.id}))} style={{padding:'6px 13px',borderRadius:20,border:`1px solid ${form.cat===c.id?c.col:C.B2}`,background:form.cat===c.id?c.fill:'transparent',color:form.cat===c.id?c.col:C.MUTED,fontSize:13,cursor:'pointer',fontWeight:form.cat===c.id?700:400,fontFamily:'inherit'}}>{c.icon} {c.label}</button>)}
            </div>
            <label style={lbl}>Repeat</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:14}}>
              {RECUR_OPTIONS.map(r=><button key={r.id} onClick={()=>setForm(f=>({...f,recur:{...f.recur,type:r.id}}))} style={{padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'inherit',border:`1px solid ${form.recur.type===r.id?C.ACCENT:C.B2}`,background:form.recur.type===r.id?'rgba(139,124,248,0.15)':'transparent',color:form.recur.type===r.id?C.ACCENT:C.MUTED,fontWeight:form.recur.type===r.id?700:400}}>{r.label}</button>)}
            </div>
            {form.recur.type==='custom'&&<div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
              {DAY_ABBR.map((d,i)=>{const sel=(form.recur.days||[]).includes(i);return<button key={i} onClick={()=>setForm(f=>{const days=f.recur.days||[];return{...f,recur:{...f.recur,days:sel?days.filter(x=>x!==i):[...days,i]}};})} style={{width:36,height:36,borderRadius:'50%',border:`1px solid ${sel?C.ACCENT:C.B2}`,background:sel?'rgba(139,124,248,0.2)':'transparent',color:sel?C.ACCENT:C.MUTED,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>{d}</button>;})}
            </div>}
            <div style={{display:'flex',gap:12,marginBottom:20}}>
              {[['Start',form.start,'start'],['End',form.end,'end']].map(([lk,val,key])=>(
                <div key={key} style={{flex:1}}><label style={lbl}>{lk}</label><input type="time" value={val} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={inp}/></div>
              ))}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={saveBlock} style={btn({flex:1,background:'rgba(139,124,248,0.15)',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Save</button>
              {modal.mode==='edit'&&<button onClick={delBlock} style={btn({background:'rgba(248,113,113,0.12)',color:C.DANGER,borderColor:'rgba(248,113,113,0.35)',padding:'11px 16px',fontSize:16})}>🗑</button>}
              <button onClick={()=>setModal(null)} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Detail */}
      {detailCtx&&(()=>{
        const{block,dateStr}=detailCtx,c=catOf(cats,block.cat),schema=getSchema(block.cat);
        const lastSess=getLastSession(block);
        return(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}} onClick={()=>setDetailCtx(null)}>
            <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
              <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 18px'}}/>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,padding:'12px 14px',background:c.fill,borderRadius:14,border:`1px solid ${c.border}`}}>
                <div style={{fontSize:28}}>{c.icon}</div>
                <div><div style={{fontSize:16,fontWeight:800,color:c.col}}>{block.label}</div><div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{fmtD(dateStr)} · {m2s(block._origS||block.s)}-{m2s(block._origE||block.e)}</div></div>
              </div>
              {lastSess&&schema.exercises&&(
                <div style={{marginBottom:16,padding:'10px 12px',background:C.CARD,borderRadius:10,border:`1px solid ${C.B1}`}}>
                  <div style={{fontSize:10,color:C.MUTED,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,marginBottom:8}}>Last session — {fmtD(lastSess.date)}</div>
                  {(lastSess.data.exercises||[]).filter(x=>x.name).map((ex,i)=>(
                    <div key={i} style={{fontSize:13,color:C.TEXT,padding:'3px 0',borderBottom:`1px solid ${C.B1}`}}>
                      <b style={{color:c.col}}>{ex.name}</b>
                      {ex.sets&&<span style={{color:C.MUTED}}> · {ex.sets}x{ex.reps||'?'}{ex.weight?` @ ${ex.weight}`:''}</span>}
                    </div>
                  ))}
                </div>
              )}
              {schema.fields.map(f=>(
                <div key={f.key} style={{marginBottom:14}}>
                  <label style={lbl2}>{f.label}</label>
                  {f.type==='textarea'?<textarea value={detailData[f.key]||''} onChange={e=>setDet(f.key,e.target.value)} placeholder={f.placeholder||''} rows={3} style={{...inp,resize:'none',lineHeight:1.7}}/>:<input type={f.type||'text'} value={detailData[f.key]||''} onChange={e=>setDet(f.key,e.target.value)} placeholder={f.placeholder||''} style={inp}/>}
                </div>
              ))}
              {schema.exercises&&(
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <label style={lbl2}>Exercises</label>
                    <button onClick={()=>setDet('exercises',[...(detailData.exercises||[]),{name:'',sets:'',reps:'',weight:''}])} style={btn({fontSize:12,padding:'4px 10px',color:C.SUCCESS,borderColor:'rgba(52,211,153,0.3)',background:'rgba(52,211,153,0.08)'})}>+ Add</button>
                  </div>
                  {!(detailData.exercises||[]).length&&<div style={{fontSize:13,color:C.MUTED,textAlign:'center',padding:'14px 0',border:`1px dashed ${C.B2}`,borderRadius:10}}>Tap + Add to log your exercises</div>}
                  {(detailData.exercises||[]).map((ex,i)=>(
                    <div key={i} style={{background:C.CARD,borderRadius:12,padding:'12px',marginBottom:10,border:`1px solid ${C.B1}`}}>
                      <div style={{display:'flex',gap:8,marginBottom:8}}>
                        <input value={ex.name} onChange={e=>{const a=[...(detailData.exercises||[])];a[i]={...a[i],name:e.target.value};setDet('exercises',a);}} placeholder="Exercise name" style={{...inp,flex:1}}/>
                        <button onClick={()=>setDet('exercises',(detailData.exercises||[]).filter((_,j)=>j!==i))} style={{background:'none',border:'none',cursor:'pointer',color:C.DANGER,fontSize:20,padding:'0 4px'}}>×</button>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        {[['sets','Sets','3'],['reps','Reps','12'],['weight','Weight','60 kg']].map(([k,pl,ph])=>(
                          <div key={k} style={{flex:1}}>
                            <div style={{fontSize:9,color:C.MUTED,marginBottom:3,textTransform:'uppercase',letterSpacing:0.6}}>{pl}</div>
                            <input value={ex[k]||''} onChange={e=>{const a=[...(detailData.exercises||[])];a[i]={...a[i],[k]:e.target.value};setDet('exercises',a);}} placeholder={ph} style={{...inp,padding:'7px 8px',fontSize:13}}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {schema.ratings?.map(r=>(
                <div key={r.key} style={{marginBottom:16}}>
                  <label style={lbl2}>{r.label}</label>
                  <Stars value={detailData[r.key]||0} max={r.max} onChange={v=>setDet(r.key,v)} color={c.col}/>
                </div>
              ))}
              {schema.moods&&(
                <div style={{marginBottom:16}}>
                  <label style={lbl2}>{schema.moods.label}</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                    {schema.moods.opts.map(o=><button key={o} onClick={()=>setDet(schema.moods.key,detailData[schema.moods.key]===o?'':o)} style={{padding:'6px 12px',borderRadius:20,fontSize:13,cursor:'pointer',fontFamily:'inherit',border:`1px solid ${detailData[schema.moods.key]===o?c.col:C.B2}`,background:detailData[schema.moods.key]===o?c.fill:'transparent',color:detailData[schema.moods.key]===o?c.col:C.MUTED,fontWeight:detailData[schema.moods.key]===o?700:400}}>{o}</button>)}
                  </div>
                </div>
              )}
              <div style={{marginBottom:22}}>
                <label style={lbl2}>Notes</label>
                <textarea value={detailData.notes||''} onChange={e=>setDet('notes',e.target.value)} placeholder="Any extra notes..." rows={3} style={{...inp,resize:'none',lineHeight:1.7}}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={saveDetails} style={btn({flex:1,background:c.fill,color:c.col,borderColor:c.border,fontWeight:700,fontSize:15,padding:'12px'})}>Save Details</button>
                <button onClick={()=>setDetailCtx(null)} style={btn({padding:'12px 16px',fontSize:16})}>×</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Category */}
      {modal?.mode==='cat'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={()=>{setModal(null);setShowPicker('');}}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>New Category</h3>
            <label style={lbl}>Name</label>
            <input value={catForm.label} onChange={e=>setCatForm(f=>({...f,label:e.target.value}))} placeholder="e.g. Reading" style={{...inp,marginBottom:16}}/>
            <label style={lbl}>Icon</label>
            <button onClick={()=>setShowPicker(p=>p==='icon'?'':'icon')} style={{...inp,marginBottom:8,cursor:'pointer',display:'flex',alignItems:'center',gap:8,width:'auto'}}><span style={{fontSize:20}}>{catForm.icon}</span><span style={{color:C.MUTED,fontSize:13}}>Tap to choose</span></button>
            {showPicker==='icon'&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16,padding:12,background:C.CARD,borderRadius:10,border:`1px solid ${C.B2}`}}>{EMOJI_PALETTE.map(e=><button key={e} onClick={()=>{setCatForm(f=>({...f,icon:e}));setShowPicker('');}} style={{fontSize:22,background:catForm.icon===e?'rgba(139,124,248,0.2)':'transparent',border:`1px solid ${catForm.icon===e?C.ACCENT:'transparent'}`,borderRadius:8,padding:'4px 6px',cursor:'pointer'}}>{e}</button>)}</div>}
            <label style={lbl}>Color</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>{COLOR_PALETTE.map(c=><button key={c} onClick={()=>setCatForm(f=>({...f,col:c}))} style={{width:30,height:30,borderRadius:'50%',background:c,border:`2px solid ${catForm.col===c?'#fff':'transparent'}`,cursor:'pointer',transition:'transform 0.15s',transform:catForm.col===c?'scale(1.2)':'scale(1)'}}/>)}</div>
            <div style={{marginBottom:20,padding:'8px 14px',borderRadius:20,display:'inline-flex',alignItems:'center',gap:6,background:`rgba(${hexToRgb(catForm.col)},0.15)`,border:`1px solid rgba(${hexToRgb(catForm.col)},0.5)`,color:catForm.col,fontSize:14,fontWeight:700}}>{catForm.icon} {catForm.label||'Preview'}</div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={saveNewCat} style={btn({flex:1,background:'rgba(139,124,248,0.15)',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Create</button>
              <button onClick={()=>{setModal(null);setShowPicker('');}} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
            {cats.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id)).length>0&&<div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.B1}`}}>
              <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,fontWeight:700}}>Custom</div>
              {cats.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id)).map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:C.CARD,borderRadius:10,marginBottom:6,border:`1px solid ${C.B1}`}}>
                  <span style={{fontSize:16}}>{c.icon}</span><span style={{flex:1,fontSize:13,color:c.col,fontWeight:700}}>{c.label}</span>
                  <button onClick={()=>deleteCat(c.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.DANGER,fontSize:16}}>🗑</button>
                </div>
              ))}
            </div>}
          </div>
        </div>
      )}

      {/* Goal modal */}
      {modal?.mode==='goal'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Monthly Goal</h3>
            <label style={lbl}>Goal</label>
            <input value={goalForm.text} onChange={e=>setGoalForm(f=>({...f,text:e.target.value}))} placeholder="What do you want to achieve this month?" style={{...inp,marginBottom:16}}/>
            <label style={lbl}>Month</label>
            <input type="month" value={goalForm.month} onChange={e=>setGoalForm(f=>({...f,month:e.target.value}))} style={{...inp,marginBottom:20}}/>
            <div style={{display:'flex',gap:10}}>
              <button onClick={saveGoal} style={btn({flex:1,background:'rgba(139,124,248,0.15)',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Save</button>
              <button onClick={()=>setModal(null)} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone modal */}
      {modal?.mode==='weekgoal'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 6px',fontSize:17,fontWeight:700,color:C.TEXT}}>Weekly Milestone</h3>
            <p style={{margin:'0 0 18px',fontSize:13,color:C.MUTED}}>Break this goal into a specific win for the week.</p>
            <label style={lbl}>Milestone</label>
            <input value={wgForm.text} onChange={e=>setWgForm(f=>({...f,text:e.target.value}))} placeholder="What will you complete this week?" style={{...inp,marginBottom:16}}/>
            <label style={lbl}>Which week?</label>
            <select value={wgForm.week} onChange={e=>setWgForm(f=>({...f,week:e.target.value}))} style={{...inp,marginBottom:20,cursor:'pointer'}}>
              <option value="">Select week...</option>
              {getWeekOpts().map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{display:'flex',gap:10}}>
              <button onClick={addMstone} style={btn({flex:1,background:'rgba(163,230,53,0.1)',color:'#a3e635',borderColor:'rgba(163,230,53,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Add Milestone</button>
              <button onClick={()=>setModal(null)} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Log Modal */}
      {showMoodLog&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:150}} onClick={()=>setShowMoodLog(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Log your mood</h3>
            <div style={{display:'flex',gap:10,marginBottom:20,justifyContent:'center'}}>
              {MOODS.map(m=>(
                <button key={m.value} onClick={()=>setMoodForm(f=>({...f,value:m.value}))}
                  style={{flex:1,padding:'12px 6px',borderRadius:12,background:moodForm.value===m.value?`rgba(${hexToRgb(m.col)},0.2)`:C.CARD,border:`2px solid ${moodForm.value===m.value?m.col:C.B2}`,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all 0.15s'}}>
                  <span style={{fontSize:24}}>{m.icon}</span>
                  <span style={{fontSize:10,color:moodForm.value===m.value?m.col:C.MUTED,fontWeight:moodForm.value===m.value?700:400}}>{m.label}</span>
                </button>
              ))}
            </div>
            <label style={lbl}>Note (optional)</label>
            <input value={moodForm.note} onChange={e=>setMoodForm(f=>({...f,note:e.target.value}))} placeholder="What's going on?" style={{...inp,marginBottom:20}}/>
            <div style={{display:'flex',gap:10}}>
              <button onClick={logMood} style={btn({flex:1,background:'rgba(139,124,248,0.15)',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>Log Mood</button>
              <button onClick={()=>setShowMoodLog(false)} style={btn({padding:'11px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Wheel of Life Rating Modal */}
      {showWheel&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:150}} onClick={()=>setShowWheel(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 4px',fontSize:17,fontWeight:700,color:C.TEXT}}>Wheel of Life</h3>
            <p style={{margin:'0 0 20px',fontSize:13,color:C.MUTED}}>Rate each area honestly out of 10. Where are you right now?</p>
            {WHEEL_AREAS.map(a=>{
              const val=wheelForm[a.key]||0;
              const col=val>=7?C.SUCCESS:val>=4?C.WARN:val>0?C.DANGER:C.MUTED;
              return(
                <div key={a.key} style={{marginBottom:18}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.TEXT}}>{a.icon} {a.label}</div>
                    <div style={{fontSize:20,fontWeight:800,color:col,minWidth:28,textAlign:'right'}}>{val||'--'}</div>
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    {Array.from({length:10},(_,i)=>(
                      <button key={i} onClick={()=>setWheelForm(f=>({...f,[a.key]:i+1===f[a.key]?0:i+1}))}
                        style={{flex:1,height:28,borderRadius:4,border:'none',cursor:'pointer',
                          background:i<val?(val>=7?C.SUCCESS:val>=4?C.WARN:C.DANGER):C.CARD,
                          opacity:i<val?0.8+i*0.02:0.4,transition:'all 0.1s'}}>
                        <span style={{fontSize:9,color:i<val?'#fff':C.MUTED}}>{i+1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={saveWheel} style={btn({flex:1,background:'rgba(251,191,36,0.12)',color:C.WARN,borderColor:'rgba(251,191,36,0.4)',fontWeight:700,fontSize:15,padding:'12px'})}>Save Ratings</button>
              <button onClick={()=>setShowWheel(false)} style={btn({padding:'12px 16px',fontSize:16})}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Review */}

      {/* Search */}
      {showSearch&&(
        <div style={{position:'fixed',inset:0,background:C.BG,zIndex:200,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'14px 16px',background:C.PANEL,borderBottom:`1px solid ${C.B1}`,display:'flex',gap:10,alignItems:'center'}}>
            <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search blocks..." style={{...inp,flex:1}}/>
            <button onClick={()=>{setShowSearch(false);setSearchQ('');}} style={btn({padding:'9px 14px'})}>×</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:16}}>
            {!searchQ.trim()&&<div style={{textAlign:'center',color:C.MUTED,marginTop:48,fontSize:14}}>Type to search all blocks</div>}
            {searchResults.map(b=>{
              const c=catOf(cats,b.cat);
              return(
                <div key={b.id} onClick={()=>{setCurDay(b.date);setTab('schedule');setShowSearch(false);setSearchQ('');}}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:C.PANEL,borderRadius:12,marginBottom:8,border:`1px solid ${C.B1}`,cursor:'pointer'}}>
                  <div style={{width:38,height:38,borderRadius:10,background:c.fill,border:`1px solid ${c.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{c.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.label}</div>
                    <div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{fmtD(b.date)} · {m2s(b.s)}-{m2s(b.e)}</div>
                  </div>
                  <div style={{fontSize:11,color:b.status==='done'?C.SUCCESS:b.status==='skipped'?C.DANGER:C.MUTED,flexShrink:0}}>{b.status==='done'?'Done':b.status==='skipped'?'Skip':'--'}</div>
                </div>
              );
            })}
            {searchQ.trim()&&!searchResults.length&&<div style={{textAlign:'center',color:C.MUTED,marginTop:48,fontSize:14}}>No results for "{searchQ}"</div>}
          </div>
        </div>
      )}

      {/* Templates */}
      {showTemplates&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={()=>setShowTemplates(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:32,maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700,color:C.TEXT}}>Templates</h3>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder={`Name for ${fmtD(curDay)}...`} style={{...inp,flex:1}}/>
              <button onClick={saveTemplate} style={btn({padding:'9px 14px',color:'#a3e635',borderColor:'rgba(163,230,53,0.35)',background:'rgba(163,230,53,0.08)',fontWeight:700,whiteSpace:'nowrap'})}>Save day</button>
            </div>
            {templates.length===0?<div style={{textAlign:'center',color:C.MUTED,padding:'24px 0',fontSize:13}}>No templates saved yet.</div>:templates.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:C.CARD,borderRadius:12,marginBottom:8,border:`1px solid ${C.B1}`}}>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.TEXT}}>{t.name}</div><div style={{fontSize:12,color:C.MUTED,marginTop:2}}>{t.blocks.length} blocks</div></div>
                <button onClick={()=>applyTemplate(t)} style={btn({fontSize:12,padding:'6px 12px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)'})}>Apply</button>
                <button onClick={()=>setTemplates(p=>p.filter(x=>x.id!==t.id))} style={{background:'none',border:'none',cursor:'pointer',color:C.DANGER,fontSize:18,lineHeight:1,padding:4}}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}

      {/* PWA install banner */}
      {showPwaBanner&&pwaPrompt&&(
        <div style={{position:'fixed',bottom:80,left:12,right:12,background:C.PANEL,border:`1px solid ${C.ACCENT}`,borderRadius:16,padding:'14px 16px',zIndex:400,display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
          <span style={{fontSize:28}}>📱</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.TEXT}}>Install LifeOS</div>
            <div style={{fontSize:11,color:C.MUTED,marginTop:2}}>Add to your home screen for the best experience</div>
          </div>
          <button onClick={async()=>{pwaPrompt.prompt();const{outcome}=await pwaPrompt.userChoice;if(outcome==='accepted'){setShowPwaBanner(false);setPwaPrompt(null);}}} style={btn({fontSize:12,padding:'7px 12px',color:C.ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.15)',fontWeight:700})}>Install</button>
          <button onClick={()=>setShowPwaBanner(false)} style={{background:'none',border:'none',cursor:'pointer',color:C.MUTED,fontSize:18,padding:'0 4px'}}>×</button>
        </div>
      )}

      {/* Week Summary */}
      {showSum&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={()=>setShowSum(false)}>
          <div style={{background:C.PANEL,borderRadius:'18px 18px 0 0',padding:22,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',border:`1px solid ${C.B2}`,boxSizing:'border-box',paddingBottom:36}} onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:C.B2,borderRadius:2,margin:'0 auto 18px'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div><div style={{fontSize:18,fontWeight:700,color:C.TEXT}}>Week Summary</div><div style={{fontSize:12,color:C.MUTED,marginTop:3}}>{wLabel}</div></div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={exportPDF} style={btn({fontSize:12,padding:'6px 12px',color:C.DANGER,borderColor:'rgba(248,113,113,0.4)',background:'rgba(248,113,113,0.1)',fontWeight:700})}>PDF</button>
                <button onClick={()=>setShowSum(false)} style={{background:'none',border:'none',color:C.MUTED,fontSize:24,cursor:'pointer',lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:22}}>
              {[['⏱',totalLogged?mLbl(totalLogged):'--','Logged'],['📦',wkBlocks.length,'Blocks'],['✅',wkBlocks.filter(b=>b.status==='done').length,'Done'],['😊',weekMoods.length,'Moods']].map(([ic,val,lb])=>(
                <div key={lb} style={{flex:1,background:C.CARD,borderRadius:12,padding:'12px 6px',border:`1px solid ${C.B1}`,textAlign:'center'}}>
                  <div style={{fontSize:18}}>{ic}</div><div style={{fontSize:18,fontWeight:700,marginTop:2,color:C.TEXT}}>{val}</div><div style={{fontSize:10,color:C.MUTED,marginTop:2}}>{lb}</div>
                </div>
              ))}
            </div>
            {wkStats.length>0&&<>
              <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:12,fontWeight:700}}>Time by category</div>
              {wkStats.map(c=>(
                <div key={c.id} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:14,color:c.col}}>{c.icon} {c.label}</span><span style={{fontSize:13,color:C.MUTED}}>{mLbl(c.ttl)}</span></div>
                  <div style={{height:7,background:C.CARD,borderRadius:4}}><div style={{height:'100%',borderRadius:4,background:c.col,width:`${(c.ttl/maxStat)*100}%`,transition:'width 0.5s ease'}}/></div>
                </div>
              ))}
            </>}
            {totalKcal>0&&<div style={{marginTop:18,paddingTop:16,borderTop:`1px solid ${C.B1}`}}>
              <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,fontWeight:700}}>Nutrition — {totalKcal} kcal total</div>
              {weekCals.map(({date:d,kcal})=>{const wd=new Date(d+'T00:00:00'),isT=d===td;return(
                <div key={d} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                  <div style={{width:28,fontSize:12,color:isT?C.ACCENT:C.MUTED,fontWeight:isT?700:400,flexShrink:0}}>{DAYS[wd.getDay()]}</div>
                  <div style={{flex:1,height:7,background:C.CARD,borderRadius:4}}>{kcal>0&&<div style={{height:'100%',borderRadius:4,background:'#fb923c',opacity:0.8,width:`${Math.min((kcal/maxKcal)*100,100)}%`,transition:'width 0.5s'}}/>}</div>
                  <div style={{fontSize:11,color:C.MUTED,textAlign:'right',flexShrink:0,minWidth:60}}>{kcal?kcal+' kcal':'--'}</div>
                </div>
              );})}
            </div>}
            {weekMoods.length>0&&<div style={{marginTop:18,paddingTop:16,borderTop:`1px solid ${C.B1}`}}>
              <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,fontWeight:700}}>Mood this week</div>
              <div style={{display:'flex',gap:8}}>
                {MOODS.map(m=>{const count=weekMoods.filter(x=>x.value===m.value).length;if(!count)return null;return(
                  <div key={m.value} style={{flex:1,padding:'8px 4px',background:C.CARD,borderRadius:10,border:`1px solid ${C.B1}`,textAlign:'center'}}>
                    <div style={{fontSize:20}}>{m.icon}</div>
                    <div style={{fontSize:16,fontWeight:700,color:m.col,marginTop:2}}>{count}</div>
                    <div style={{fontSize:9,color:C.MUTED,marginTop:1}}>{m.label}</div>
                  </div>
                );})}
              </div>
            </div>}
            <div style={{marginTop:18,paddingTop:16,borderTop:`1px solid ${C.B1}`}}>
              <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:12,fontWeight:700}}>Daily breakdown</div>
              {wkDates.map(d=>{const db=getDayBlocks(d),ttl=db.filter(b=>b.status!=='skipped').reduce((s,b)=>s+(b.e-b.s),0),done=db.filter(b=>b.status==='done').length,total=db.length;const wd=new Date(d+'T00:00:00'),isT=d===td;return(
                <div key={d} style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
                  <div style={{width:34,fontSize:12,color:isT?C.ACCENT:C.MUTED,fontWeight:isT?700:400,flexShrink:0}}>{DAYS[wd.getDay()]}</div>
                  <div style={{flex:1,height:7,background:C.CARD,borderRadius:4}}>{ttl>0&&<div style={{height:'100%',borderRadius:4,background:C.ACCENT,opacity:0.7,width:`${Math.min(ttl/960*100,100)}%`,transition:'width 0.5s'}}/>}</div>
                  <div style={{fontSize:11,color:done===total&&total>0?C.SUCCESS:C.MUTED,textAlign:'right',flexShrink:0,minWidth:70}}>{total?done+'/'+total+' done':'--'}</div>
                </div>
              );})}
            </div>
            {wkEntries.length>0&&<div style={{marginTop:18,paddingTop:16,borderTop:`1px solid ${C.B1}`}}>
              <div style={{fontSize:10,color:C.MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:12,fontWeight:700}}>Notes</div>
              {wkEntries.map(e=>(
                <div key={e.date} style={{marginBottom:10,padding:'10px 12px',background:C.CARD,borderRadius:10,border:`1px solid ${C.B1}`}}>
                  <div style={{fontSize:11,color:C.ACCENT,marginBottom:4,fontWeight:700}}>{fmtD(e.date)}</div>
                  <div style={{fontSize:13,color:C.TEXT,lineHeight:1.6,whiteSpace:'pre-wrap',maxHeight:70,overflow:'hidden'}}>{e.draft}</div>
                </div>
              ))}
            </div>}
          </div>
        </div>
      )}

      {showOb&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.94)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:300}}>
          <div style={{background:C.PANEL,borderRadius:'24px 24px 0 0',padding:'32px 28px 40px',width:'100%',maxWidth:520,border:`1px solid ${C.B2}`,boxSizing:'border-box'}}>
            <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:28}}>
              {ONBOARD_SLIDES.map((_,i)=><div key={i} style={{height:4,borderRadius:2,background:i===obStep?C.ACCENT:C.B2,width:i===obStep?24:16,transition:'all 0.3s'}}/>)}
            </div>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:52,marginBottom:16}}>{ONBOARD_SLIDES[obStep].icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:C.TEXT,marginBottom:12}}>{ONBOARD_SLIDES[obStep].title}</div>
              <div style={{fontSize:14,color:C.MUTED,lineHeight:1.7}}>{ONBOARD_SLIDES[obStep].body}</div>
            </div>

            {/* Last slide: name input + seed data option */}
            {obStep===ONBOARD_SLIDES.length-1&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,color:C.MUTED,marginBottom:10,textAlign:'center'}}>What should we call you?</div>
                <input
                  value={obNameInput}
                  onChange={e=>setObNameInput(e.target.value)}
                  placeholder="Your first name"
                  style={{...{background:C.CARD,border:`1px solid ${C.B2}`,borderRadius:8,color:C.TEXT,fontSize:14,padding:'9px 11px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit'},marginBottom:12,textAlign:'center'}}
                />
                <div
                  onClick={()=>seedDemoData()}
                  style={{fontSize:12,color:C.ACCENT,textAlign:'center',cursor:'pointer',padding:'6px',borderRadius:8,border:`1px solid rgba(139,124,248,0.3)`,background:'rgba(139,124,248,0.06)'}}>
                  + Add sample schedule to explore the app
                </div>
              </div>
            )}

            <button onClick={()=>{
              if(obStep<ONBOARD_SLIDES.length-1){setObStep(s=>s+1);}
              else{
                if(obNameInput.trim()) setUserName(obNameInput.trim());
                setOnboarded(true);setShowOb(false);
              }
            }}
              style={{width:'100%',padding:'14px',background:C.ACCENT,border:'none',borderRadius:14,color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              {obStep<ONBOARD_SLIDES.length-1?'Next':'Get started'}
            </button>
            {obStep<ONBOARD_SLIDES.length-1&&<button onClick={()=>{setOnboarded(true);setShowOb(false);}} style={{width:'100%',padding:'10px',background:'none',border:'none',color:C.MUTED,fontSize:13,cursor:'pointer',marginTop:8,fontFamily:'inherit'}}>Skip</button>}
          </div>
        </div>
      )}
    </div>
  );
}

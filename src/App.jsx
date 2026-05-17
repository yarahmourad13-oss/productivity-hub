import { useState, useEffect, useRef } from "react";

const CATS = [
  { id:'sleep',    label:'Sleep',    icon:'🌙', col:'#818cf8', fill:'rgba(129,140,248,0.15)', border:'rgba(129,140,248,0.5)' },
  { id:'meal',     label:'Meal',     icon:'🍽️', col:'#fb923c', fill:'rgba(251,146,60,0.15)',  border:'rgba(251,146,60,0.5)'  },
  { id:'workout',  label:'Workout',  icon:'💪', col:'#34d399', fill:'rgba(52,211,153,0.15)',  border:'rgba(52,211,153,0.5)'  },
  { id:'work',     label:'Work',     icon:'💼', col:'#60a5fa', fill:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.5)'  },
  { id:'personal', label:'Personal', icon:'🌿', col:'#f472b6', fill:'rgba(244,114,182,0.15)', border:'rgba(244,114,182,0.5)' },
  { id:'free',     label:'Free',     icon:'☀️', col:'#a3e635', fill:'rgba(163,230,53,0.15)',  border:'rgba(163,230,53,0.5)'  },
];

const BG='#0b0b14', PANEL='#13131f', CARD='#1c1c2e';
const B1='rgba(255,255,255,0.07)', B2='rgba(255,255,255,0.13)';
const TEXT='#e4e4f0', MUTED='#5a5a7a', ACCENT='#8b7cf8';
const SUCCESS='#34d399';

const pad  = n => String(n).padStart(2,'0');
const m2s  = m => `${pad(Math.floor(m/60)%24)}:${pad(m%60)}`;
const s2m  = s => { const [h,mn]=s.split(':').map(Number); return h*60+mn; };
const hLbl = h => h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
const today= () => new Date().toISOString().split('T')[0];
const weekOf=d => { const dt=new Date(d+'T00:00:00'),day=dt.getDay(); return Array.from({length:7},(_,i)=>{ const n=new Date(dt); n.setDate(dt.getDate()-day+i); return n.toISOString().split('T')[0]; }); };
const fmtD = s => new Date(s+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const catOf= id=> CATS.find(c=>c.id===id)||CATS[0];
const mLbl = m => { const h=Math.floor(m/60),mn=m%60; return h>0?(mn>0?`${h}h ${mn}m`:`${h}h`):`${mn}m`; };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HH=52, LW=46;

// ── localStorage helpers ──────────────────────────────────────────
const lsGet = (key, fallback) => {
  try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

export default function App() {
  const td = today();

  const [tab,      setTab]      = useState('schedule');
  const [blocks,   setBlocks]   = useState(() => lsGet('ph_blocks', []));
  const [goals,    setGoals]    = useState(() => lsGet('ph_goals',  []));
  const [thought,  setThought]  = useState(() => lsGet('ph_thought',''));
  const [pom,      setPom]      = useState({ mode:'work', t:40*60, run:false, sess:0 });
  const [curDay,   setCurDay]   = useState(td);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({ label:'', cat:'sleep', start:'08:00', end:'09:00' });
  const [showSum,  setShowSum]  = useState(false);
  const [gIn,      setGIn]      = useState('');

  const pomRef   = useRef(null);
  const scrollRef= useRef(null);

  // Persist on change
  useEffect(() => lsSet('ph_blocks',  blocks),  [blocks]);
  useEffect(() => lsSet('ph_goals',   goals),   [goals]);
  useEffect(() => lsSet('ph_thought', thought), [thought]);

  // Pomodoro tick
  useEffect(() => {
    if (pom.run) {
      pomRef.current = setInterval(() => {
        setPom(p => {
          if (p.t <= 1) {
            clearInterval(pomRef.current);
            return p.mode==='work'
              ? { ...p, t:5*60,    mode:'break', run:false, sess:p.sess+1 }
              : { ...p, t:40*60,   mode:'work',  run:false };
          }
          return { ...p, t: p.t-1 };
        });
      }, 1000);
    } else {
      clearInterval(pomRef.current);
    }
    return () => clearInterval(pomRef.current);
  }, [pom.run]);

  const navDay = d => {
    const dt = new Date(curDay+'T00:00:00');
    dt.setDate(dt.getDate()+d);
    setCurDay(dt.toISOString().split('T')[0]);
  };

  // Week summary data
  const wkDates     = weekOf(curDay);
  const wkBlocks    = blocks.filter(b => wkDates.includes(b.date));
  const wkStats     = CATS
    .map(c => ({ ...c, ttl: wkBlocks.filter(b=>b.cat===c.id).reduce((s,b)=>s+(b.e-b.s),0) }))
    .filter(c => c.ttl > 0)
    .sort((a,b) => b.ttl-a.ttl);
  const maxStat     = wkStats.length ? wkStats[0].ttl : 1;
  const totalLogged = wkStats.reduce((s,c)=>s+c.ttl, 0);
  const wLabel      = `${new Date(wkDates[0]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(wkDates[6]+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;

  // Block actions
  const openAdd = y => {
    const s = Math.min(Math.max(Math.round(y/HH*60/15)*15, 0), 23*60);
    setForm({ label:'', cat:'sleep', start:m2s(s), end:m2s(Math.min(s+60,24*60)) });
    setModal({ mode:'add' });
  };
  const openEdit = (e, b) => {
    e.stopPropagation();
    setForm({ label:b.label, cat:b.cat, start:m2s(b.s), end:m2s(b.e) });
    setModal({ mode:'edit', id:b.id });
  };
  const saveBlock = () => {
    const s=s2m(form.start), e=s2m(form.end);
    if (e <= s) return;
    const label = form.label || catOf(form.cat).label;
    setBlocks(prev =>
      modal.mode==='add'
        ? [...prev, { id:Date.now()+'', date:curDay, label, cat:form.cat, s, e }]
        : prev.map(b => b.id===modal.id ? { ...b, label, cat:form.cat, s, e } : b)
    );
    setModal(null);
  };
  const delBlock = () => { setBlocks(p => p.filter(b=>b.id!==modal.id)); setModal(null); };

  // Goal actions
  const addGoal    = () => { if (!gIn.trim()) return; setGoals(p=>[...p,{id:Date.now()+'',text:gIn.trim(),done:false}]); setGIn(''); };
  const toggleGoal = id  => setGoals(p => p.map(g=>g.id===id ? {...g,done:!g.done} : g));
  const removeGoal = id  => setGoals(p => p.filter(g=>g.id!==id));
  const clearDone  = ()  => setGoals(p => p.filter(g=>!g.done));

  // Pomodoro ring
  const R    = 52, circ = 2*Math.PI*R;
  const full = pom.mode==='work' ? 40*60 : 5*60;
  const pct  = (full-pom.t)/full;
  const isW  = pom.mode==='work';

  // Shared styles
  const inp = { background:CARD, border:`1px solid ${B2}`, borderRadius:8, color:TEXT, fontSize:14, padding:'9px 11px', outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };
  const btn = (x={}) => ({ background:CARD, border:`1px solid ${B2}`, borderRadius:8, color:MUTED, padding:'8px 14px', cursor:'pointer', fontSize:13, ...x });
  const lbl = { fontSize:10, color:MUTED, marginBottom:5, display:'block', textTransform:'uppercase', letterSpacing:0.8 };

  const dayBlocks = blocks.filter(b=>b.date===curDay);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:BG, color:TEXT, fontFamily:'system-ui,sans-serif', overflow:'hidden' }}>

      {/* ── TOP TAB BAR ── */}
      <div style={{ display:'flex', background:PANEL, borderBottom:`1px solid ${B1}`, flexShrink:0 }}>
        {[['schedule','📅','Schedule'],['focus','⏱','Focus'],['goals','✅','Goals'],['thoughts','✏️','Notes']].map(([id,ic,lb])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ flex:1, padding:'11px 2px', background:'none', border:'none',
              borderBottom: tab===id ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: tab===id ? ACCENT : MUTED, cursor:'pointer', fontSize:11,
              fontWeight: tab===id ? 700 : 400,
              display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{fontSize:18}}>{ic}</span>{lb}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          SCHEDULE TAB
      ══════════════════════════════════════ */}
      {tab==='schedule' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Day nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:PANEL, borderBottom:`1px solid ${B1}`, flexShrink:0 }}>
            <button onClick={()=>navDay(-1)} style={btn({padding:'6px 14px',fontSize:16})}>‹</button>
            <div style={{textAlign:'center'}}>
              <div style={{ fontSize:13, fontWeight:700, color:curDay===td?ACCENT:TEXT }}>{fmtD(curDay)}</div>
              {curDay===td && <div style={{fontSize:10,color:ACCENT,marginTop:1}}>Today</div>}
            </div>
            <div style={{display:'flex',gap:6}}>
              {curDay!==td && (
                <button onClick={()=>setCurDay(td)}
                  style={btn({fontSize:11,padding:'6px 10px',color:ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)'})}>
                  Today
                </button>
              )}
              <button onClick={()=>navDay(1)} style={btn({padding:'6px 14px',fontSize:16})}>›</button>
            </div>
          </div>

          {/* Week summary button */}
          <div style={{ padding:'6px 14px', background:PANEL, borderBottom:`1px solid ${B1}`, display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
            <button onClick={()=>setShowSum(true)}
              style={btn({fontSize:12,color:ACCENT,borderColor:'rgba(139,124,248,0.4)',background:'rgba(139,124,248,0.1)',padding:'5px 12px'})}>
              📊 Week Summary
            </button>
          </div>

          {/* Timeline */}
          <div ref={scrollRef} style={{ flex:1, overflowY:'auto', display:'flex' }}>
            {/* Hour labels */}
            <div style={{ width:LW, flexShrink:0 }}>
              {Array.from({length:24},(_,h) => (
                <div key={h} style={{ height:HH, borderBottom:`1px solid ${B1}`, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:6, paddingTop:3 }}>
                  <span style={{fontSize:9,color:MUTED}}>{hLbl(h)}</span>
                </div>
              ))}
            </div>

            {/* Day column */}
            <div style={{ flex:1, position:'relative', borderLeft:`1px solid ${B1}`, cursor:'crosshair' }}
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect();
                openAdd(e.clientY - r.top + (scrollRef.current?.scrollTop||0));
              }}>
              {Array.from({length:24},(_,h) => (
                <div key={h} style={{ height:HH, borderBottom:`1px solid ${h%6===5?B2:B1}` }}/>
              ))}
              {dayBlocks.map(b => {
                const c=catOf(b.cat), top=b.s/60*HH, ht=Math.max((b.e-b.s)/60*HH,22);
                return (
                  <div key={b.id} onClick={e=>openEdit(e,b)}
                    style={{ position:'absolute', left:3, right:3, top, height:ht,
                      background:c.fill, border:`1px solid ${c.border}`, borderRadius:6,
                      padding:'3px 7px', cursor:'pointer', overflow:'hidden', zIndex:2, boxSizing:'border-box' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:c.col, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.icon} {b.label}
                    </div>
                    {ht > 30 && <div style={{fontSize:10,color:MUTED}}>{m2s(b.s)} – {m2s(b.e)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding:'7px 14px', background:PANEL, borderTop:`1px solid ${B1}`, fontSize:11, color:MUTED, flexShrink:0, textAlign:'center' }}>
            Tap the timeline to add a block
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          FOCUS TAB
      ══════════════════════════════════════ */}
      {tab==='focus' && (
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px', gap:18 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:isW?ACCENT:SUCCESS }}>
            {isW ? '🔥 Focus Session' : '☕ Break Time'}
          </div>

          {/* Ring */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width={140} height={140}>
              <circle cx={70} cy={70} r={R} fill="none" stroke={CARD}  strokeWidth={9}/>
              <circle cx={70} cy={70} r={R} fill="none"
                stroke={isW ? ACCENT : SUCCESS} strokeWidth={9}
                strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
                strokeLinecap="round" transform="rotate(-90 70 70)"
                style={{transition:'stroke-dashoffset 1s linear'}}/>
            </svg>
            <div style={{ position:'absolute', fontSize:34, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
              {pad(Math.floor(pom.t/60))}:{pad(pom.t%60)}
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setPom(p=>({...p,run:!p.run}))}
              style={btn({ background:isW?'rgba(139,124,248,0.15)':'rgba(52,211,153,0.15)', color:isW?ACCENT:SUCCESS,
                borderColor:isW?'rgba(139,124,248,0.4)':'rgba(52,211,153,0.4)', padding:'11px 28px', fontSize:15, fontWeight:700 })}>
              {pom.run ? '⏸ Pause' : '▶ Start'}
            </button>
            <button onClick={()=>setPom(p=>({...p,t:40*60,mode:'work',run:false}))} style={btn({padding:'11px 18px',fontSize:18})}>↺</button>
          </div>

          <div style={{fontSize:13,color:MUTED}}>Sessions completed: <strong style={{color:TEXT}}>{pom.sess}</strong></div>

          <div style={{ background:PANEL, borderRadius:14, padding:'16px 22px', border:`1px solid ${B1}`, width:'100%', maxWidth:300, boxSizing:'border-box' }}>
            {[['🔥 Focus','40 min'],['☕ Break','5 min']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:MUTED, padding:'5px 0' }}>
                <span>{k}</span><strong style={{color:TEXT}}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          GOALS TAB
      ══════════════════════════════════════ */}
      {tab==='goals' && (
        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{display:'flex',gap:8}}>
            <input value={gIn} onChange={e=>setGIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addGoal()}
              placeholder="Add a goal or task..." style={inp}/>
            <button onClick={addGoal} style={btn({padding:'9px 16px',fontSize:22,flexShrink:0})}>+</button>
          </div>

          {goals.length===0 && (
            <div style={{textAlign:'center',color:MUTED,marginTop:48,fontSize:15}}>✅<br/><br/>No goals yet</div>
          )}

          {goals.map(g=>(
            <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px', background:PANEL, borderRadius:12, border:`1px solid ${B1}` }}>
              <input type="checkbox" checked={g.done} onChange={()=>toggleGoal(g.id)}
                style={{accentColor:ACCENT,width:17,height:17,cursor:'pointer',flexShrink:0}}/>
              <span style={{ flex:1, fontSize:14, textDecoration:g.done?'line-through':'none', color:g.done?MUTED:TEXT }}>{g.text}</span>
              <button onClick={()=>removeGoal(g.id)} style={{background:'none',border:'none',cursor:'pointer',color:MUTED,fontSize:20,lineHeight:1,padding:2}}>×</button>
            </div>
          ))}

          {goals.some(g=>g.done) && (
            <button onClick={clearDone}
              style={btn({color:'#f87171',borderColor:'rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.1)',alignSelf:'flex-start',fontSize:13})}>
              🗑 Clear completed
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          THOUGHTS TAB
      ══════════════════════════════════════ */}
      {tab==='thoughts' && (
        <div style={{ flex:1, overflow:'hidden', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
          <p style={{margin:0,fontSize:13,color:MUTED}}>Brain dump freely — no judgment.</p>
          <textarea value={thought} onChange={e=>setThought(e.target.value)}
            placeholder="What's on your mind..."
            style={{ ...inp, flex:1, resize:'none', lineHeight:1.8, padding:'12px', fontSize:14 }}/>
        </div>
      )}

      {/* ══════════════════════════════════════
          ADD / EDIT BLOCK MODAL (slides up)
      ══════════════════════════════════════ */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}
          onClick={()=>setModal(null)}>
          <div style={{ background:PANEL, borderRadius:'18px 18px 0 0', padding:22, width:'100%', maxWidth:520, border:`1px solid ${B2}`, boxSizing:'border-box', paddingBottom:32 }}
            onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:B2,borderRadius:2,margin:'0 auto 20px'}}/>
            <h3 style={{margin:'0 0 18px',fontSize:17,fontWeight:700}}>{modal.mode==='add'?'➕ Add Block':'✏️ Edit Block'}</h3>

            <label style={lbl}>Label</label>
            <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}
              placeholder={catOf(form.cat).label} style={{...inp,marginBottom:16}}/>

            <label style={lbl}>Category</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:18}}>
              {CATS.map(c=>(
                <button key={c.id} onClick={()=>setForm(f=>({...f,cat:c.id}))}
                  style={{ padding:'6px 13px', borderRadius:20,
                    border:`1px solid ${form.cat===c.id?c.col:'rgba(255,255,255,0.1)'}`,
                    background:form.cat===c.id?c.fill:'transparent',
                    color:form.cat===c.id?c.col:MUTED, fontSize:13, cursor:'pointer',
                    fontWeight:form.cat===c.id?700:400 }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <div style={{display:'flex',gap:12,marginBottom:20}}>
              {[['Start',form.start,'start'],['End',form.end,'end']].map(([lk,val,key])=>(
                <div key={key} style={{flex:1}}>
                  <label style={lbl}>{lk}</label>
                  <input type="time" value={val} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={inp}/>
                </div>
              ))}
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={saveBlock}
                style={btn({flex:1,background:'rgba(139,124,248,0.15)',color:ACCENT,borderColor:'rgba(139,124,248,0.4)',fontWeight:700,fontSize:15,padding:'11px'})}>
                Save
              </button>
              {modal.mode==='edit' && (
                <button onClick={delBlock}
                  style={btn({background:'rgba(248,113,113,0.12)',color:'#f87171',borderColor:'rgba(248,113,113,0.35)',padding:'11px 16px',fontSize:16})}>
                  🗑
                </button>
              )}
              <button onClick={()=>setModal(null)} style={btn({padding:'11px 16px',fontSize:16})}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          WEEK SUMMARY MODAL
      ══════════════════════════════════════ */}
      {showSum && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}
          onClick={()=>setShowSum(false)}>
          <div style={{ background:PANEL, borderRadius:'18px 18px 0 0', padding:22, width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto', border:`1px solid ${B2}`, boxSizing:'border-box', paddingBottom:36 }}
            onClick={e=>e.stopPropagation()}>
            <div style={{width:38,height:4,background:B2,borderRadius:2,margin:'0 auto 18px'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div>
                <div style={{fontSize:18,fontWeight:700}}>📊 Week Summary</div>
                <div style={{fontSize:12,color:MUTED,marginTop:3}}>{wLabel}</div>
              </div>
              <button onClick={()=>setShowSum(false)} style={{background:'none',border:'none',color:MUTED,fontSize:24,cursor:'pointer',lineHeight:1}}>×</button>
            </div>

            {/* Stats row */}
            <div style={{display:'flex',gap:10,marginBottom:22}}>
              {[['⏱', totalLogged?mLbl(totalLogged):'—', 'Logged'],
                ['📦', wkBlocks.length,                  'Blocks'],
                ['📅', new Set(wkBlocks.map(b=>b.date)).size, 'Days']].map(([ic,val,lb])=>(
                <div key={lb} style={{ flex:1, background:CARD, borderRadius:12, padding:'14px 8px', border:`1px solid ${B1}`, textAlign:'center' }}>
                  <div style={{fontSize:22}}>{ic}</div>
                  <div style={{fontSize:22,fontWeight:700,marginTop:3}}>{val}</div>
                  <div style={{fontSize:11,color:MUTED,marginTop:3}}>{lb}</div>
                </div>
              ))}
            </div>

            {wkStats.length===0
              ? <div style={{textAlign:'center',color:MUTED,padding:'24px 0',fontSize:14}}>No blocks logged this week yet.</div>
              : <>
                  <div style={{fontSize:10,color:MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:12,fontWeight:700}}>Time by Category</div>
                  {wkStats.map(c=>(
                    <div key={c.id} style={{marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                        <span style={{fontSize:14,color:c.col}}>{c.icon} {c.label}</span>
                        <span style={{fontSize:13,color:MUTED}}>{mLbl(c.ttl)}</span>
                      </div>
                      <div style={{height:7,background:CARD,borderRadius:4}}>
                        <div style={{height:'100%',borderRadius:4,background:c.col,width:`${(c.ttl/maxStat)*100}%`,transition:'width 0.5s ease'}}/>
                      </div>
                    </div>
                  ))}

                  <div style={{marginTop:22,paddingTop:18,borderTop:`1px solid ${B1}`}}>
                    <div style={{fontSize:10,color:MUTED,textTransform:'uppercase',letterSpacing:0.8,marginBottom:12,fontWeight:700}}>Daily Breakdown</div>
                    {wkDates.map(d=>{
                      const ttl=blocks.filter(b=>b.date===d).reduce((s,b)=>s+(b.e-b.s),0);
                      const wd=new Date(d+'T00:00:00'), isT=d===td;
                      return (
                        <div key={d} style={{display:'flex',alignItems:'center',gap:12,marginBottom:9}}>
                          <div style={{width:34,fontSize:12,color:isT?ACCENT:MUTED,fontWeight:isT?700:400,flexShrink:0}}>{DAYS[wd.getDay()]}</div>
                          <div style={{flex:1,height:7,background:CARD,borderRadius:4}}>
                            {ttl>0&&<div style={{height:'100%',borderRadius:4,background:ACCENT,opacity:0.7,width:`${Math.min(ttl/960*100,100)}%`,transition:'width 0.5s'}}/>}
                          </div>
                          <div style={{width:40,fontSize:12,color:MUTED,textAlign:'right',flexShrink:0}}>{ttl>0?mLbl(ttl):'—'}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
            }
          </div>
        </div>
      )}
    </div>
  );
}
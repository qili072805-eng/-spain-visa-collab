"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, FileText, Route, WalletCards, LayoutDashboard, LogOut, Plus, Pencil, Trash2 } from "lucide-react";

type Tab = "总览"|"任务"|"材料"|"行程"|"费用";
type Row = Record<string, any>;

const supabase = createClient();

const statusClass=(s:string)=>s==="已完成"?"done":s==="进行中"?"doing":s==="阻塞"?"blocked":"todo";

export default function Home(){
  const [session,setSession]=useState<any>(null);
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [tab,setTab]=useState<Tab>("总览");
  const [data,setData]=useState<Record<string,Row[]>>({tasks:[],documents:[],itinerary:[],expenses:[]});
  const [modal,setModal]=useState<{table:string,row?:Row}|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{ if(session) loadAll(); },[session]);

  async function loadAll(){
    const tables=["tasks","documents","itinerary","expenses"];
    const out:Record<string,Row[]>={};
    for(const t of tables){
      const {data,error}=await supabase.from(t).select("*").order("sort_order",{ascending:true});
      if(error) console.error(error);
      out[t]=data||[];
    }
    setData(out);
  }

  async function magicLink(e:React.FormEvent){
    e.preventDefault();
    const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
    if(error) alert(error.message); else setSent(true);
  }

  async function save(table:string,row:Row){
    const payload={...row};
    delete payload.id;
    if(row.id){
      const {error}=await supabase.from(table).update(payload).eq("id",row.id);
      if(error) return alert(error.message);
    }else{
      payload.sort_order=(data[table]?.length||0)+1;
      const {error}=await supabase.from(table).insert(payload);
      if(error) return alert(error.message);
    }
    setModal(null); loadAll();
  }

  async function remove(table:string,id:string){
    if(!confirm("确认删除？")) return;
    const {error}=await supabase.from(table).delete().eq("id",id);
    if(error) alert(error.message); else loadAll();
  }

  const stats=useMemo(()=>{
    const total=data.tasks.length;
    const done=data.tasks.filter(x=>x.status==="已完成").length;
    const doing=data.tasks.filter(x=>x.status==="进行中").length;
    const todo=data.tasks.filter(x=>x.status==="未开始").length;
    const pct=total?Math.round(done/total*100):0;
    return {total,done,doing,todo,pct};
  },[data]);

  if(loading) return <div className="login"><div className="login-card">正在加载…</div></div>;

  if(!session) return <div className="login">
    <div className="login-card">
      <h1>西班牙签证协作台</h1>
      <p className="muted">两个人用各自邮箱登录，共同维护任务、材料、行程和费用。</p>
      <div className="notice">首次部署后，请先在 Supabase 中邀请两位邮箱，或直接输入邮箱接收登录链接。</div>
      <form onSubmit={magicLink}>
        <label>邮箱</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com"/>
        <button className="btn" style={{width:"100%",marginTop:14}}>发送登录链接</button>
      </form>
      {sent&&<p className="muted">登录链接已发送，请检查邮箱。</p>}
    </div>
  </div>;

  const nav=[["总览",LayoutDashboard],["任务",CheckSquare],["材料",FileText],["行程",Route],["费用",WalletCards]] as const;
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">西班牙签证<br/>× 欧洲行程</div>
      <div className="nav">
        {nav.map(([n,I])=><button key={n} className={tab===n?"active":""} onClick={()=>setTab(n as Tab)}><I size={17} style={{verticalAlign:"middle",marginRight:8}}/>{n}</button>)}
      </div>
      <button className="btn secondary" style={{marginTop:28,width:"100%"}} onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> 退出</button>
    </aside>
    <main className="main">
      <div className="topbar"><div><div className="title">{tab}</div><div className="subtitle">杭州递签：2026-08-21 10:10｜欧洲出发：2026-10-02</div></div></div>

      {tab==="总览"&&<Dashboard stats={stats} data={data}/>}
      {tab==="任务"&&<DataTable table="tasks" rows={data.tasks} onAdd={()=>setModal({table:"tasks"})} onEdit={r=>setModal({table:"tasks",row:r})} onDelete={remove}/>}
      {tab==="材料"&&<DataTable table="documents" rows={data.documents} onAdd={()=>setModal({table:"documents"})} onEdit={r=>setModal({table:"documents",row:r})} onDelete={remove}/>}
      {tab==="行程"&&<DataTable table="itinerary" rows={data.itinerary} onAdd={()=>setModal({table:"itinerary"})} onEdit={r=>setModal({table:"itinerary",row:r})} onDelete={remove}/>}
      {tab==="费用"&&<DataTable table="expenses" rows={data.expenses} onAdd={()=>setModal({table:"expenses"})} onEdit={r=>setModal({table:"expenses",row:r})} onDelete={remove}/>}
    </main>
    {modal&&<Editor table={modal.table} initial={modal.row} onClose={()=>setModal(null)} onSave={save}/>}
  </div>
}

function Dashboard({stats,data}:{stats:any,data:Record<string,Row[]>}){
  const deadline=Math.max(0,Math.ceil((new Date("2026-08-21").getTime()-Date.now())/86400000));
  const depart=Math.max(0,Math.ceil((new Date("2026-10-02").getTime()-Date.now())/86400000));
  return <>
    <div className="grid cards">
      <Metric label="全部任务" value={stats.total}/>
      <Metric label="已完成" value={stats.done}/>
      <Metric label="整体完成率" value={`${stats.pct}%`} progress={stats.pct}/>
      <Metric label="距递签" value={`${deadline}天`} sub={`距出发 ${depart} 天`}/>
    </div>
    <div className="grid" style={{gridTemplateColumns:"1.2fr .8fr",marginTop:16}}>
      <div className="card"><h3>近期高优先级</h3>
        {data.tasks.filter(x=>x.priority==="高"&&x.status!=="已完成").slice(0,8).map(x=>
          <div key={x.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #eee"}}>
            <div><b>{x.title}</b><div className="muted">{x.owner} · {x.due_date||"未设截止日期"}</div></div>
            <span className={`badge ${statusClass(x.status)}`}>{x.status}</span>
          </div>)}
      </div>
      <div className="card"><h3>材料进度</h3>
        {["已完成","进行中","未开始","按需","不适用"].map(s=>{
          const n=data.documents.filter(x=>x.status===s).length;
          return <div key={s} style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span>{s}</span><b>{n}</b></div>
        })}
        <div className="notice" style={{marginTop:14}}>官方清单来源已写入每条材料记录；补充材料会明确标注“实操补充”。</div>
      </div>
    </div>
  </>
}

function Metric({label,value,sub,progress}:{label:string,value:any,sub?:string,progress?:number}){
  return <div className="card"><div className="muted">{label}</div><div className="metric">{value}</div>{sub&&<div className="muted">{sub}</div>}{progress!==undefined&&<div className="progress"><div style={{width:`${progress}%`}}/></div>}</div>
}

const configs:Record<string,{title:string;cols:[string,string][]}>={
  tasks:{title:"任务",cols:[["title","任务"],["module","模块"],["owner","负责人"],["priority","优先级"],["due_date","截止日期"],["status","状态"],["notes","备注/链接"]]},
  documents:{title:"材料",cols:[["category","类别"],["requirement","材料要求"],["person_a_status","你"],["person_b_status","同行人"],["shared","是否共用"],["due_date","截止日期"],["status","状态"],["notes","备注"],["source_url","官方来源"]]},
  itinerary:{title:"行程",cols:[["date","日期"],["route","城市/路线"],["transport","交通"],["activities","主要安排"],["accommodation","住宿"],["visa_note","签证口径"],["status","状态"]]},
  expenses:{title:"费用",cols:[["date","日期"],["category","类别"],["item","项目"],["payer","付款人"],["amount","金额"],["currency","币种"],["payment_status","支付状态"],["notes","备注"]]}
};

function DataTable({table,rows,onAdd,onEdit,onDelete}:{table:string;rows:Row[];onAdd:()=>void;onEdit:(r:Row)=>void;onDelete:(t:string,id:string)=>void}){
  const c=configs[table];
  return <>
    <div className="toolbar"><button className="btn" onClick={onAdd}><Plus size={16}/> 新增{c.title}</button><button className="btn secondary" onClick={()=>location.reload()}>刷新</button></div>
    <div className="table-wrap"><table><thead><tr>{c.cols.map(([k,l])=><th key={k}>{l}</th>)}<th>操作</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.id}>{c.cols.map(([k])=><td key={k}>{k==="status"||k==="payment_status"?<span className={`badge ${statusClass(r[k])}`}>{r[k]}</span>:k==="source_url"&&r[k]?<a href={r[k]} target="_blank">查看来源</a>:String(r[k]??"")}</td>)}<td><div className="row-actions"><button className="icon-btn" onClick={()=>onEdit(r)}><Pencil size={15}/></button><button className="icon-btn" onClick={()=>onDelete(table,r.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody>
    </table></div>
  </>
}

function Editor({table,initial,onClose,onSave}:{table:string;initial?:Row;onClose:()=>void;onSave:(t:string,r:Row)=>void}){
  const c=configs[table]; const [row,setRow]=useState<Row>(initial||{});
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
    <h2>{initial?"编辑":"新增"}{c.title}</h2>
    <div className="form-grid">{c.cols.map(([k,l])=><label key={k} className={k==="notes"||k==="requirement"||k==="activities"?"full":""}>{l}
      {["status","payment_status"].includes(k)?<select value={row[k]||"未开始"} onChange={e=>setRow({...row,[k]:e.target.value})}><option>未开始</option><option>进行中</option><option>已完成</option><option>阻塞</option><option>按需</option><option>不适用</option><option>未付</option><option>部分支付</option><option>已付</option></select>
      :["notes","requirement","activities"].includes(k)?<textarea rows={3} value={row[k]||""} onChange={e=>setRow({...row,[k]:e.target.value})}/>
      :<input type={k.includes("date")?"date":k==="amount"?"number":"text"} value={row[k]||""} onChange={e=>setRow({...row,[k]:e.target.value})}/>}
    </label>)}</div>
    <div className="toolbar" style={{justifyContent:"flex-end"}}><button className="btn secondary" onClick={onClose}>取消</button><button className="btn" onClick={()=>onSave(table,row)}>保存</button></div>
  </div></div>
}

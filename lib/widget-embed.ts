import { randomBytes } from "node:crypto";

/** Validates widget tokens (10-char hex for new configs; longer legacy ids still allowed). */
export const WIDGET_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;

export function createWidgetId(): string {
  return randomBytes(5).toString("hex");
}

export function buildEmbedScript(apiOrigin: string, widgetId: string): string {
  const safeOrigin = JSON.stringify(apiOrigin);
  const safeWidgetId = JSON.stringify(widgetId);

  return `/*f2c*/(function(){
var cur=document.currentScript;
if(!cur)return;
var apiOrigin=${safeOrigin};
var widgetId=${safeWidgetId};
var root=document.createElement("div");
root.setAttribute("data-f2c-widget",widgetId);
root.style.cssText="position:fixed;bottom:16px;right:16px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;font-size:13px;text-align:left;opacity:0;transition:opacity .2s ease;";
function esc(s){
var d=document.createElement("div");
d.textContent=s;
return d.innerHTML;
}
function fmt(ts){
try{return new Date(ts).toLocaleString();}catch(e){return ts;}
}
function statusLabel(s){
switch(s){
  case "CODING": return "Coding";
  case "WAITING_FOR_REVIEW": return "Waiting for review";
  case "MERGED": return "Merged";
  case "FAILED": return "Failed";
  default: return s ? String(s) : "";
}
}
function appendRoot(){(document.body||document.documentElement).appendChild(root);}
fetch(apiOrigin+"/f?w="+encodeURIComponent(widgetId),{method:"GET",credentials:"omit"})
.then(function(r){return r.json();})
.then(function(data){
if(!data||!data.ok){
mountErr(data&&data.message?String(data.message):"Could not load feedback");
return;
}
mount(data.items||[]);
})
.catch(function(e){mountErr(e.message||"Network error");});
function mountErr(msg){
var e=document.createElement("div");
e.style.cssText="padding:10px 14px;border-radius:10px;background:#fee;color:#911;font-size:12px;max-width:240px;box-shadow:0 4px 20px rgba(0,0,0,.15);";
e.textContent=msg;
root.appendChild(e);
root.style.opacity="1";
appendRoot();
}
function mount(items){
var shell=document.createElement("div");
shell.style.cssText="display:none;flex-direction:column;background:#fff;color:#111;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.08);overflow:hidden;width:min(320px,calc(100vw - 32px));max-height:min(440px,72vh);";
var fab=document.createElement("button");
fab.type="button";
fab.style.cssText="padding:10px 16px;border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#111827;color:#fff;cursor:pointer;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);";
function fabLabel(){fab.textContent="Feedback"+(items.length?" ("+items.length+")":"");}
fabLabel();
var head=document.createElement("div");
head.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(0,0,0,.08);font-weight:600;font-size:14px;flex-shrink:0;";
var ht=document.createElement("span");
ht.textContent="Feedback";
var close=document.createElement("button");
close.type="button";
close.setAttribute("aria-label","Close");
close.textContent="×";
close.style.cssText="border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;padding:4px;color:#666;";
head.appendChild(ht);
head.appendChild(close);
var listEl=document.createElement("div");
listEl.style.cssText="flex:1;overflow-y:auto;min-height:72px;max-height:220px;padding:8px 12px;border-bottom:1px solid rgba(0,0,0,.06);";
function renderList(){
listEl.innerHTML="";
if(items.length===0){
var empty=document.createElement("div");
empty.style.cssText="color:#888;font-size:12px;padding:12px 4px;";
empty.textContent="No feedback yet. Be the first!";
listEl.appendChild(empty);
return;
}
for(var i=0;i<items.length;i++){
var it=items[i];
var row=document.createElement("div");
row.style.cssText="padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);";
row.innerHTML='<div style="font-size:11px;color:#888;margin-bottom:4px;">'+esc(fmt(it.createdAt))+'</div><div style="font-size:10px;color:#666;margin-bottom:6px;">Status: '+esc(statusLabel(it.status))+'</div><div style="white-space:pre-wrap;word-break:break-word;">'+esc(it.body)+'</div>';
listEl.appendChild(row);
}
}
renderList();
var ta=document.createElement("textarea");
ta.rows=3;
ta.placeholder="Write feedback about this page…";
ta.style.cssText="width:100%;box-sizing:border-box;margin:0;border:none;padding:10px 12px;resize:vertical;font:inherit;min-height:72px;";
var foot=document.createElement("div");
foot.style.cssText="padding:8px 12px 12px;display:flex;flex-direction:column;gap:8px;flex-shrink:0;";
var sub=document.createElement("button");
sub.type="button";
sub.textContent="Submit";
sub.style.cssText="padding:8px 12px;border-radius:8px;border:none;background:#111827;color:#fff;cursor:pointer;font-weight:500;";
var status=document.createElement("div");
status.style.cssText="font-size:11px;min-height:14px;color:#666;";
foot.appendChild(ta);
foot.appendChild(sub);
foot.appendChild(status);
shell.appendChild(head);
shell.appendChild(listEl);
shell.appendChild(foot);
function toggle(v){
if(v){
shell.style.display="flex";
fab.style.display="none";
ta.focus();
}else{
shell.style.display="none";
fab.style.display="inline-block";
fabLabel();
}
}
close.onclick=function(){toggle(false);};
fab.onclick=function(){toggle(true);};
sub.onclick=function(){
var t=ta.value.trim();
if(!t){status.textContent="Please enter feedback.";return;}
status.textContent="Sending…";
sub.disabled=true;
fetch(apiOrigin+"/f",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({w:widgetId,text:t,pageUrl:typeof location!=="undefined"?location.href:""})
})
.then(function(r){return r.json();})
.then(function(res){
sub.disabled=false;
if(!res||!res.ok){status.textContent=res&&res.message?String(res.message):"Could not send";return;}
if(res.item){items.unshift(res.item);}
fabLabel();
renderList();
ta.value="";
status.textContent="Thanks!";
setTimeout(function(){status.textContent="";},2500);
})
.catch(function(e){
sub.disabled=false;
status.textContent=e.message||"Network error";
});
};
var wrap=document.createElement("div");
wrap.style.cssText="display:flex;flex-direction:column;align-items:flex-end;gap:10px;";
wrap.appendChild(shell);
wrap.appendChild(fab);
root.appendChild(wrap);
root.style.opacity="1";
appendRoot();
}
})();`;
}

export function parseWidgetIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const o = body as Record<string, unknown>;
  if (typeof o.w === "string") return o.w;
  if (typeof o.widgetId === "string") return o.widgetId;
  return "";
}

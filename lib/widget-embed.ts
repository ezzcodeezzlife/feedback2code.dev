import { randomBytes } from "node:crypto";

/** Validates widget tokens (10-char hex for new configs; longer legacy ids still allowed). */
export const WIDGET_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;

export function createWidgetId(): string {
  return randomBytes(5).toString("hex");
}

function buildFrameWidgetInlineScript(
  apiOrigin: string,
  widgetId: string,
  turnstileSiteKey: string | null,
): string {
  const safeOrigin = JSON.stringify(apiOrigin);
  const safeWidgetId = JSON.stringify(widgetId);
  const safeTurnstileKey = JSON.stringify(turnstileSiteKey ?? "");

  return `!(function(){
var apiOrigin=${safeOrigin};
var widgetId=${safeWidgetId};
var turnstileSiteKey=${safeTurnstileKey};
var started=false;
function boot(parentOrigin,parentHref,parentPath){
if(started)return;started=true;
var isDark=typeof window!=="undefined"&&!!window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches;
var C=isDark
?{bg:"#0a0a0a",fg:"#ededed",muted:"#888888",mutedFg:"#a0a0a0",border:"#222222",borderBright:"#333333",accent:"#ff6b00",accentHover:"#ff8533",accentMuted:"rgba(255,107,0,.12)",errBg:"rgba(127,29,29,.3)",errFg:"#fca5a5",btnBg:"#ff6b00",btnFg:"#000000",shadow:"rgba(0,0,0,.8)"}
:{bg:"#ffffff",fg:"#111111",muted:"#6b7280",mutedFg:"#374151",border:"rgba(0,0,0,.1)",borderBright:"rgba(0,0,0,.2)",accent:"#ff6b00",accentHover:"#ff8533",accentMuted:"rgba(255,107,0,.08)",errBg:"#fee2e2",errFg:"#991b1b",btnBg:"#ff6b00",btnFg:"#ffffff",shadow:"rgba(0,0,0,.18)"};
var FONT="'Fira Code','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
var raf=(typeof window!=="undefined"&&window.requestAnimationFrame)||function(fn){setTimeout(fn,16);};
function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function fmtRel(ts){try{var s=Math.floor((Date.now()-new Date(ts).getTime())/1000);if(s<60)return"just now";var m=Math.floor(s/60);if(m<60)return m+"m ago";var h=Math.floor(m/60);if(h<24)return h+"h ago";var d=Math.floor(h/24);if(d<30)return d+"d ago";return Math.floor(d/30)+"mo ago";}catch(e){return ts;}}
function sLabel(s){switch(s){case"CODING":return"coding";case"WAITING_FOR_REVIEW":return"awaiting review";case"MERGED":return"merged";case"FAILED":return"failed";default:return s?String(s).toLowerCase():"";}}
function sColor(s){switch(s){case"MERGED":return{bg:C.accentMuted,fg:C.accent,bd:"rgba(255,107,0,.4)"};case"FAILED":return{bg:"rgba(127,29,29,.3)",fg:"#fca5a5",bd:"rgba(127,29,29,.5)"};case"WAITING_FOR_REVIEW":return{bg:"transparent",fg:C.fg,bd:C.borderBright};default:return{bg:"transparent",fg:C.muted,bd:C.border};}}
var root=document.createElement("div");
root.setAttribute("data-f2c-widget",widgetId);
root.style.cssText="position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:"+FONT+";font-size:16px;text-align:left;opacity:0;transition:opacity .2s ease;";
function appendRoot(){(document.body||document.documentElement).appendChild(root);}
// Local-only submission history (per-widget, per-parent origin) stored in the iframe's localStorage.
function historyStorageKey(){return"f2c_local_history:"+widgetId+"|"+String(parentOrigin||"");}
function safeLocalGet(key){try{if(typeof window==="undefined"||!window.localStorage)return null;return window.localStorage.getItem(key);}catch(e){return null;}}
function safeLocalSet(key,value){try{if(typeof window==="undefined"||!window.localStorage)return;window.localStorage.setItem(key,value);}catch(e){}}
function loadLocalHistory(){
var raw=safeLocalGet(historyStorageKey());
if(!raw)return[];
var arr=null;
try{arr=JSON.parse(raw);}catch(e){return[];}
if(!Array.isArray(arr))return[];
var out=[];
for(var i=0;i<arr.length;i++){
var it=arr[i];
if(!it||typeof it!=="object")continue;
var status=it.status;
if(!status)continue;
var body=typeof it.body==="string"?it.body:String(it.body||"");
var createdAt=it.createdAt;
if(!createdAt)continue;
out.push({id:typeof it.id==="string"?it.id:String(it.id||""),body:body,createdAt:createdAt,status:status});
if(out.length>=200)break;
}
return out;
}
function saveLocalHistory(list){
if(!Array.isArray(list))return;
var next=list.slice(0,200).map(function(it){
return{id:it&&typeof it.id==="string"?it.id:String(it.id||""),body:it&&typeof it.body==="string"?it.body:String(it.body||""),createdAt:it&&it.createdAt?it.createdAt:"",status:it&&it.status?it.status:""};
}).filter(function(it){return it.body&&it.createdAt&&it.status;});
safeLocalSet(historyStorageKey(),JSON.stringify(next));
}
mount(loadLocalHistory());
function mountErr(msg){
var e=document.createElement("div");
e.style.cssText="padding:20px 24px;background:"+C.errBg+";color:"+C.errFg+";font-size:15px;max-width:340px;border:1px solid rgba(127,29,29,.5);font-family:"+FONT+";letter-spacing:.03em;";
e.textContent=msg;
root.appendChild(e);root.style.opacity="1";appendRoot();
}
function mount(items){
var activeTab="submit";
var closeTimer=null;
var fabShowTimer=null;
/* ── FAB ─────────────────────────────────────────────────── */
var fab=document.createElement("button");
fab.type="button";
fab.style.cssText="display:inline-flex;align-items:center;gap:12px;padding:14px 28px;border:1px solid "+C.accent+";background:"+C.btnBg+";color:"+C.btnFg+";cursor:pointer;font-size:16px;font-weight:700;font-family:"+FONT+";letter-spacing:.06em;text-transform:uppercase;box-shadow:0 4px 28px rgba(255,107,0,.3);transition:background .15s,transform .12s;white-space:nowrap;outline:none;";
fab.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>[ feedback ]</span>';
fab.onmouseenter=function(){fab.style.background=C.accentHover;fab.style.transform="translateY(-2px)";};
fab.onmouseleave=function(){fab.style.background=C.btnBg;fab.style.transform="";};
/* ── Panel ───────────────────────────────────────────────── */
var panel=document.createElement("div");
panel.style.cssText="display:none;flex-direction:column;background:"+C.bg+";color:"+C.fg+";border:1px solid "+C.borderBright+";box-shadow:0 16px 64px "+C.shadow+";overflow:hidden;width:min(640px,calc(100vw - 48px));max-height:min(780px,88vh);font-family:"+FONT+";position:relative;";
var lbar=document.createElement("div");
lbar.style.cssText="position:absolute;left:0;top:0;bottom:0;width:4px;background:"+C.accent+";z-index:1;pointer-events:none;";
panel.appendChild(lbar);
/* ── Header ──────────────────────────────────────────────── */
var hdr=document.createElement("div");
hdr.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:20px 22px 20px 28px;border-bottom:1px solid "+C.border+";flex-shrink:0;";
var hLeft=document.createElement("div");
hLeft.style.cssText="display:flex;flex-direction:column;gap:3px;";
var hLabel=document.createElement("span");
hLabel.style.cssText="font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:"+C.accent+";";
hLabel.textContent="[ feedback ]";
hLeft.appendChild(hLabel);
var closeBtn=document.createElement("button");
closeBtn.type="button";
closeBtn.setAttribute("aria-label","Close");
closeBtn.style.cssText="border:none;background:transparent;color:"+C.muted+";cursor:pointer;padding:4px 8px;line-height:1;font-size:28px;font-family:"+FONT+";transition:color .15s;outline:none;";
closeBtn.textContent="\xd7";
closeBtn.onmouseenter=function(){closeBtn.style.color=C.fg;};
closeBtn.onmouseleave=function(){closeBtn.style.color=C.muted;};
hdr.appendChild(hLeft);hdr.appendChild(closeBtn);
panel.appendChild(hdr);
/* ── Tabs ────────────────────────────────────────────────── */
var tabBar=document.createElement("div");
tabBar.style.cssText="display:flex;border-bottom:1px solid "+C.border+";flex-shrink:0;";
function makeTab(id,label){
var btn=document.createElement("button");
btn.type="button";
btn.setAttribute("data-ftab",id);
btn.style.cssText="flex:1;padding:14px 16px;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;background:transparent;cursor:pointer;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:"+FONT+";transition:color .15s,border-color .15s;outline:none;color:"+C.muted+";";
btn.textContent=label;
btn.onclick=function(){switchTab(id);};
return btn;
}
var tSubmit=makeTab("submit","Submit");
var tHistory=makeTab("history","Local History ("+items.length+")");
tabBar.appendChild(tSubmit);tabBar.appendChild(tHistory);
panel.appendChild(tabBar);
function setTabStyles(){
[tSubmit,tHistory].forEach(function(t){
var a=t.getAttribute("data-ftab")===activeTab;
t.style.color=a?C.accent:C.muted;
t.style.borderBottomColor=a?C.accent:"transparent";
});
}
/* ── Submit view ─────────────────────────────────────────── */
var submitView=document.createElement("div");
submitView.style.cssText="display:flex;flex-direction:column;";
var ta=document.createElement("textarea");
ta.rows=5;
ta.placeholder="What\u2019s broken, confusing, or could be improved?";
ta.style.cssText="width:100%;box-sizing:border-box;margin:0;border:none;border-bottom:1px solid "+C.border+";background:"+C.bg+";color:"+C.fg+";padding:22px 22px 22px 28px;resize:none;font:16px/1.6 "+FONT+";outline:none;min-height:180px;transition:border-color .15s;";
ta.addEventListener("focus",function(){ta.style.borderBottomColor=C.accent;});
ta.addEventListener("blur",function(){ta.style.borderBottomColor=C.border;});
var sfBar=document.createElement("div");
sfBar.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 22px 14px 28px;flex-shrink:0;";
var statusMsg=document.createElement("span");
statusMsg.style.cssText="font-size:14px;color:"+C.muted+";flex:1;min-height:20px;";
var charCount=document.createElement("span");
charCount.style.cssText="font-size:14px;color:"+C.muted+";letter-spacing:.03em;white-space:nowrap;";
charCount.textContent="0 / 2000";
ta.addEventListener("input",function(){var l=ta.value.length;charCount.textContent=l+" / 2000";charCount.style.color=l>1800?"#fca5a5":C.muted;if(l>0&&statusMsg.style.color==="#fca5a5"){statusMsg.textContent="";statusMsg.style.color=C.muted;}updateSubBtn();});
var subBtn=document.createElement("button");
subBtn.type="button";
subBtn.style.cssText="padding:12px 28px;border:1px solid "+C.accent+";background:"+C.btnBg+";color:"+C.btnFg+";cursor:pointer;font-size:15px;font-weight:700;font-family:"+FONT+";text-transform:uppercase;letter-spacing:.06em;transition:background .15s;outline:none;white-space:nowrap;flex-shrink:0;";
subBtn.textContent="Send \u2192";
subBtn.onmouseenter=function(){if(!subBtn.disabled)subBtn.style.background=C.accentHover;};
subBtn.onmouseleave=function(){if(!subBtn.disabled)subBtn.style.background=C.btnBg;};
sfBar.appendChild(statusMsg);sfBar.appendChild(charCount);sfBar.appendChild(subBtn);
submitView.appendChild(ta);submitView.appendChild(sfBar);
/* ── Success view ────────────────────────────────────────── */
var successView=document.createElement("div");
successView.style.cssText="display:none;flex-direction:column;align-items:center;justify-content:center;padding:56px 40px 48px;gap:18px;";
var sIcon=document.createElement("div");
sIcon.style.cssText="width:64px;height:64px;border:1px solid "+C.accent+";display:flex;align-items:center;justify-content:center;flex-shrink:0;";
sIcon.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="'+C.accent+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
var sTitle=document.createElement("p");
sTitle.style.cssText="margin:4px 0 0;font-size:22px;font-weight:700;color:"+C.fg+";text-align:center;letter-spacing:.03em;";
sTitle.textContent="Feedback received";
var sSub=document.createElement("p");
sSub.style.cssText="margin:0;font-size:16px;color:"+C.muted+";text-align:center;line-height:1.6;max-width:320px;";
sSub.textContent="Thanks! This has been submitted for review.";
var backBtn=document.createElement("button");
backBtn.type="button";
backBtn.style.cssText="margin-top:6px;border:1px solid "+C.border+";background:transparent;color:"+C.muted+";cursor:pointer;padding:12px 28px;font-size:14px;font-family:"+FONT+";text-transform:uppercase;letter-spacing:.06em;transition:color .15s,border-color .15s;outline:none;";
backBtn.textContent="\u2190 send more";
backBtn.onmouseenter=function(){backBtn.style.color=C.fg;backBtn.style.borderColor=C.borderBright;};
backBtn.onmouseleave=function(){backBtn.style.color=C.muted;backBtn.style.borderColor=C.border;};
backBtn.onclick=function(){successView.style.display="none";submitView.style.display="flex";activeTab="submit";setTabStyles();ta.focus();updateSubBtn();};
successView.appendChild(sIcon);successView.appendChild(sTitle);successView.appendChild(sSub);successView.appendChild(backBtn);
/* ── History view ────────────────────────────────────────── */
var histView=document.createElement("div");
histView.style.cssText="display:none;overflow-y:auto;max-height:480px;";
function renderHistory(){
histView.innerHTML="";
if(items.length===0){
var emp=document.createElement("div");
emp.style.cssText="padding:48px 28px 40px;text-align:center;";
emp.innerHTML='<div style="color:'+C.muted+';font-size:16px;letter-spacing:.04em;">[ no local submissions yet ]</div><div style="color:'+C.muted+';font-size:15px;margin-top:10px;line-height:1.5;">Be the first to leave feedback.</div>';
histView.appendChild(emp);return;
}
for(var i=0;i<items.length;i++){
var it=items[i];var sc=sColor(it.status);
var row=document.createElement("div");
row.style.cssText="padding:16px 22px 16px 28px;border-bottom:1px solid "+C.border+";position:relative;";
if(it.status==="MERGED"){var lb=document.createElement("div");lb.style.cssText="position:absolute;left:0;top:0;bottom:0;width:3px;background:"+C.accent+";";row.appendChild(lb);}
var meta=document.createElement("div");
meta.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;";
var badge=document.createElement("span");
badge.style.cssText="font-size:12px;text-transform:uppercase;letter-spacing:.08em;padding:4px 9px;border:1px solid "+sc.bd+";background:"+sc.bg+";color:"+sc.fg+";white-space:nowrap;";
badge.textContent=sLabel(it.status);
var tSpan=document.createElement("span");
tSpan.style.cssText="font-size:14px;color:"+C.muted+";";
tSpan.textContent=fmtRel(it.createdAt);
meta.appendChild(badge);meta.appendChild(tSpan);
var bodyEl=document.createElement("p");
bodyEl.style.cssText="margin:0;font-size:15px;line-height:1.55;color:"+C.mutedFg+";overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;word-break:break-word;";
bodyEl.textContent=it.body;
row.appendChild(meta);row.appendChild(bodyEl);
histView.appendChild(row);
}
}
renderHistory();
panel.appendChild(submitView);panel.appendChild(successView);panel.appendChild(histView);
var turnstileHolder=null;
var turnstileWidgetId=null;
var cachedTurnstileToken=null;
var submitVerifyTimer=null;
var pendingAutoSend=false;
function clearSubmitVerifyTimer(){if(submitVerifyTimer){clearTimeout(submitVerifyTimer);submitVerifyTimer=null;}}
function cleanupTurnstilePanel(){
clearSubmitVerifyTimer();
cachedTurnstileToken=null;
pendingAutoSend=false;
var ts0=window.turnstile;
if(turnstileWidgetId!==null&&ts0&&typeof ts0.remove==="function"){
try{ts0.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
}
function updateSubBtn(){
var hasText=ta.value.trim().length>0;
if(!turnstileSiteKey){
subBtn.disabled=false;
subBtn.style.opacity="";
subBtn.style.cursor="";
return;
}
subBtn.disabled=!hasText;
subBtn.style.opacity=subBtn.disabled?".5":"";
subBtn.style.cursor=subBtn.disabled?"not-allowed":"";
}
/* ── Tab switching ───────────────────────────────────────── */
function switchTab(id){
activeTab=id;setTabStyles();
submitView.style.display=id==="submit"?"flex":"none";
successView.style.display="none";
histView.style.display=id==="history"?"block":"none";
if(id==="submit"){ta.focus();updateSubBtn();}
}
setTabStyles();switchTab("submit");
/* ── Open / close ────────────────────────────────────────── */
function toggle(open){
if(open){
if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
if(fabShowTimer){clearTimeout(fabShowTimer);fabShowTimer=null;}
panel.style.display="flex";
panel.style.opacity="0";panel.style.transform="translateY(12px)";panel.style.transition="none";
raf(function(){raf(function(){panel.style.transition="opacity .2s ease,transform .2s ease";panel.style.opacity="1";panel.style.transform="translateY(0)";});});
fab.style.display="none";
if(activeTab==="submit")ta.focus();
if(turnstileSiteKey){beginBackgroundTurnstile();}
updateSubBtn();
}else{
panel.style.transition="opacity .15s ease,transform .15s ease";
panel.style.opacity="0";panel.style.transform="translateY(10px)";
fab.style.display="none";
closeTimer=setTimeout(function(){
cleanupTurnstilePanel();
panel.style.display="none";
panel.style.transition="none";
panel.style.transform="";
closeTimer=null;
fabShowTimer=setTimeout(function(){fab.style.display="inline-flex";fabShowTimer=null;},40);
updateSubBtn();
},170);
}
}
closeBtn.onclick=function(){toggle(false);};
fab.onclick=function(){toggle(true);};
/* ── Submit handler ──────────────────────────────────────── */
function loadTurnstileScript(cb){
if(typeof window==="undefined"){cb();return;}
function hasTurnstileApi(){return typeof window!=="undefined"&&window.turnstile&&typeof window.turnstile.render==="function";}
if(hasTurnstileApi()){cb();return;}
var g=window;
var q=g.__f2cTurnstileQ;
if(Array.isArray(q)){q.push(cb);return;}
g.__f2cTurnstileQ=[cb];
function flush(err){
var wait=g.__f2cTurnstileQ;
g.__f2cTurnstileQ=null;
if(!Array.isArray(wait))return;
for(var i=0;i<wait.length;i++){if(err)wait[i]("load");else wait[i]();}
}
var scr=document.createElement("script");
scr.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
scr.async=false;
scr.onload=function(){
var attempts=0;
(function poll(){
if(hasTurnstileApi()){flush(null);return;}
if(++attempts>200){flush("load");return;}
setTimeout(poll,25);
})();
};
scr.onerror=function(){flush("load");};
(document.head||document.documentElement).appendChild(scr);
}
function removeTurnstileHolder(h){
try{if(h&&h.parentNode)h.parentNode.removeChild(h);}catch(e){}
}
function resetSubAfterSend(){updateSubBtn();}
function sendFeedback(tsToken){
pendingAutoSend=false;
var t=ta.value.trim();
if(!t){resetSubAfterSend();return;}
subBtn.disabled=true;
subBtn.style.opacity=".5";
subBtn.style.cursor="not-allowed";
statusMsg.textContent="Sending\u2026";statusMsg.style.color=C.muted;
var payload={w:widgetId,text:t,pageUrl:parentHref||"",pagePath:parentPath||"",parentOrigin:parentOrigin};
if(tsToken)payload.turnstileToken=tsToken;
fetch(apiOrigin+"/f",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
.then(function(r){return r.json();})
.then(function(res){
resetSubAfterSend();
if(!res||!res.ok){
statusMsg.textContent=res&&res.message?String(res.message):"Could not send.";
statusMsg.style.color="#fca5a5";
if(turnstileSiteKey){
cachedTurnstileToken=null;
beginBackgroundTurnstile();
}
return;
}
if(res.item){items.unshift(res.item);saveLocalHistory(items);}
tHistory.textContent="Local History ("+items.length+")";
renderHistory();ta.value="";charCount.textContent="0 / 2000";statusMsg.textContent="";
submitView.style.display="none";successView.style.display="flex";activeTab="success";setTabStyles();
if(turnstileSiteKey){
cachedTurnstileToken=null;
var tsR=window.turnstile;
if(turnstileWidgetId!==null&&tsR&&typeof tsR.remove==="function"){
try{tsR.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
clearSubmitVerifyTimer();
beginBackgroundTurnstile();
}
})
.catch(function(e){
resetSubAfterSend();
statusMsg.textContent=e.message||"Network error.";
statusMsg.style.color="#fca5a5";
if(turnstileSiteKey){
cachedTurnstileToken=null;
beginBackgroundTurnstile();
}
});
}
function beginBackgroundTurnstile(){
if(!turnstileSiteKey)return;
clearSubmitVerifyTimer();
cachedTurnstileToken=null;
updateSubBtn();
var tsPre=window.turnstile;
if(turnstileWidgetId!==null&&tsPre&&typeof tsPre.remove==="function"){
try{tsPre.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
statusMsg.textContent="";
statusMsg.style.color=C.muted;
loadTurnstileScript(function(err){
if(err){
pendingAutoSend=false;
statusMsg.textContent="Could not load verification. Disable blockers and try again.";
statusMsg.style.color="#fca5a5";
updateSubBtn();
return;
}
var ts=window.turnstile;
if(!ts||typeof ts.render!=="function"){
pendingAutoSend=false;
statusMsg.textContent="Could not load verification. Disable blockers and try again.";
statusMsg.style.color="#fca5a5";
updateSubBtn();
return;
}
turnstileHolder=document.createElement("div");
turnstileHolder.setAttribute("data-f2c-turnstile","1");
turnstileHolder.style.cssText="position:fixed;left:-9999px;top:0;width:300px;height:70px;overflow:hidden;margin:0;padding:0;border:0;opacity:0.02;";
submitView.appendChild(turnstileHolder);
submitVerifyTimer=setTimeout(function(){
submitVerifyTimer=null;
var tsT=window.turnstile;
if(turnstileWidgetId!==null&&tsT&&typeof tsT.remove==="function"){
try{tsT.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
cachedTurnstileToken=null;
pendingAutoSend=false;
statusMsg.textContent="Verification timed out. Check your network, VPN, or ad blocker, then try again.";
statusMsg.style.color="#fca5a5";
updateSubBtn();
},45000);
var doRender=function(){
try{
var newId=ts.render(turnstileHolder,{
sitekey:turnstileSiteKey,
size:"invisible",
callback:function(token){
clearSubmitVerifyTimer();
cachedTurnstileToken=token;
statusMsg.textContent="";
statusMsg.style.color=C.muted;
if(pendingAutoSend){
pendingAutoSend=false;
if(ta.value.trim().length>0){sendFeedback(token);}
else{updateSubBtn();}
}else{updateSubBtn();}
},
"error-callback":function(){
clearSubmitVerifyTimer();
cachedTurnstileToken=null;
pendingAutoSend=false;
var tsE=window.turnstile;
if(turnstileWidgetId!==null&&tsE&&typeof tsE.remove==="function"){
try{tsE.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
statusMsg.textContent="Verification failed. Close and reopen the widget to try again.";
statusMsg.style.color="#fca5a5";
updateSubBtn();
},
"expired-callback":function(){
clearSubmitVerifyTimer();
cachedTurnstileToken=null;
statusMsg.textContent="Refreshing verification\u2026";
statusMsg.style.color=C.muted;
var tsX=window.turnstile;
if(turnstileWidgetId!==null&&tsX&&typeof tsX.remove==="function"){
try{tsX.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
updateSubBtn();
beginBackgroundTurnstile();
},
"unsupported-callback":function(){
clearSubmitVerifyTimer();
cachedTurnstileToken=null;
pendingAutoSend=false;
var tsU=window.turnstile;
if(turnstileWidgetId!==null&&tsU&&typeof tsU.remove==="function"){
try{tsU.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=null;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
statusMsg.textContent="Verification is not available here (browser or privacy settings). Try another browser or relax blocking for this site.";
statusMsg.style.color="#fca5a5";
updateSubBtn();
}
});
if(newId!=null&&newId!=="")turnstileWidgetId=newId;
}catch(e){
clearSubmitVerifyTimer();
cachedTurnstileToken=null;
pendingAutoSend=false;
if(turnstileHolder){removeTurnstileHolder(turnstileHolder);turnstileHolder=null;}
turnstileWidgetId=null;
statusMsg.textContent="Verification error. Try again.";
statusMsg.style.color="#fca5a5";
updateSubBtn();
}
};
if(typeof queueMicrotask==="function"){queueMicrotask(doRender);}
else{setTimeout(doRender,0);}
});
}
subBtn.onclick=function(){
var t=ta.value.trim();
if(!t){statusMsg.textContent="Please write something first.";statusMsg.style.color="#fca5a5";ta.focus();return;}
if(!turnstileSiteKey){
sendFeedback(null);
return;
}
if(!cachedTurnstileToken){
pendingAutoSend=true;
subBtn.disabled=true;
subBtn.style.opacity=".5";
subBtn.style.cursor="not-allowed";
statusMsg.textContent="";
statusMsg.style.color=C.muted;
return;
}
sendFeedback(cachedTurnstileToken);
};
/* ── Mount ───────────────────────────────────────────────── */
var wrap=document.createElement("div");
wrap.style.cssText="display:flex;flex-direction:column;align-items:flex-end;gap:16px;";
wrap.appendChild(panel);wrap.appendChild(fab);
root.appendChild(wrap);root.style.opacity="1";appendRoot();
updateSubBtn();
}
}
function onParentMessage(ev){
if(!ev.data||ev.data.f2c!=="parent")return;
if(typeof ev.data.href!=="string")return;
window.removeEventListener("message",onParentMessage);
boot(ev.origin,ev.data.href,typeof ev.data.pathname==="string"?ev.data.pathname:"/");
}
window.addEventListener("message",onParentMessage);
if(window.parent!==window){window.parent.postMessage({f2c:"f2c-frame-ready"},"*");}
else{boot(location.origin,location.href,location.pathname||"/");}
})();`;
}

export function buildFrameInnerHtml(
  apiOrigin: string,
  widgetId: string,
  turnstileSiteKey: string | null,
): string {
  const inline = buildFrameWidgetInlineScript(apiOrigin, widgetId, turnstileSiteKey);
  const escaped = inline.replace(/<\/script>/gi, "<\\/script>");
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Feedback</title></head><body><script>` +
    escaped +
    "</scr" +
    "ipt></body></html>"
  );
}

export function buildParentEmbedScript(apiOrigin: string, widgetId: string): string {
  const safeOrigin = JSON.stringify(apiOrigin);
  const safeWidgetId = JSON.stringify(widgetId);
  return `/*f2c*/(function(){
var cur=document.currentScript;if(!cur)return;
var apiOrigin=${safeOrigin};
var widgetId=${safeWidgetId};
var iframe=document.createElement("iframe");
iframe.title="Feedback";
iframe.setAttribute("data-f2c-frame","1");
iframe.src=apiOrigin+"/embed/frame?w="+encodeURIComponent(widgetId);
iframe.style.cssText="position:fixed;bottom:0;right:0;width:min(720px,100vw);height:min(900px,100vh);max-width:100%;max-height:100%;border:0;background:transparent;z-index:2147483647;pointer-events:auto;";
function sameOrigin(a,b){try{return new URL(a).origin===new URL(b).origin;}catch(e){return false;}}
function mountIframe(){var p=document.body||document.documentElement;if(iframe.parentNode!==p)p.appendChild(iframe);}
mountIframe();
window.addEventListener("message",function(ev){
if(!ev.data||ev.data.f2c!=="f2c-frame-ready")return;
if(ev.source!==iframe.contentWindow)return;
if(!sameOrigin(ev.origin,apiOrigin))return;
mountIframe();
iframe.contentWindow.postMessage({f2c:"parent",href:location.href,pathname:location.pathname||"/"},apiOrigin);
});
})();`;
}

export function buildEmbedScript(apiOrigin: string, widgetId: string): string {
  return buildParentEmbedScript(apiOrigin, widgetId);
}

export function parseWidgetIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const o = body as Record<string, unknown>;
  if (typeof o.w === "string") return o.w;
  if (typeof o.widgetId === "string") return o.widgetId;
  return "";
}

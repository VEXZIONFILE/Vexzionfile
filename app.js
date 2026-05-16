
const $=(id)=>document.getElementById(id);let selectedFiles=[],activeTool=null;
function slugify(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function param(n){return new URLSearchParams(location.search).get(n)}
function tools(){return Array.isArray(window.VEXZION_TOOLS)?window.VEXZION_TOOLS:[]}
function categories(){const order=["PDF Tools","Image Tools","Document Tools","Spreadsheet Tools","Compression Tools","Developer Tools","Utility Tools"],out=[];tools().forEach(t=>{if(t.category&&!out.includes(t.category))out.push(t.category)});return out.sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)))}
function toolUrl(id){return `/tool/${encodeURIComponent(id)}`}function categoryUrl(cat){return `/category/${slugify(cat)}`}
function formatBytes(bytes){const u=["B","KB","MB","GB"];let n=bytes,i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return `${n.toFixed(n<10&&i>0?1:0)} ${u[i]}`}
function initBase(){const menu=$("mobileMenuBtn"),nav=$("navLinks"),wrap=document.querySelector(".drop-wrap"),drop=$("categoryDropdownBtn");if(menu&&nav)menu.onclick=e=>{e.preventDefault();e.stopPropagation();nav.classList.toggle("open")};if(wrap&&drop)drop.onclick=e=>{e.preventDefault();e.stopPropagation();wrap.classList.toggle("open")};document.addEventListener("click",e=>{if(wrap&&!wrap.contains(e.target))wrap.classList.remove("open");if(menu&&nav&&!menu.contains(e.target)&&!nav.contains(e.target))nav.classList.remove("open")});refreshAuthUI()}
async function refreshAuthUI(){try{const res=await fetch("/api/auth/me",{credentials:"include"}),data=await res.json();window.VEXZION_AUTH=data.user?data:{user:null,isPro:false};document.querySelectorAll(".signed-in-only").forEach(el=>el.style.display=data.user?"":"none");document.querySelectorAll(".signed-out-only").forEach(el=>el.style.display=data.user?"none":"");document.querySelectorAll(".nav-cta").forEach(el=>{el.textContent=data.isPro?"Pro Active":"Pro";el.href=data.isPro?"/account":"/pricing"})}catch{window.VEXZION_AUTH={user:null,isPro:false}}}
function toolCard(t){const a=document.createElement("a");a.className="tool"+(t.plan==="pro"?" locked":"");a.href=toolUrl(t.id);const plan=t.plan==="free"?'<span class="pill ok">Free</span>':((window.VEXZION_AUTH&&window.VEXZION_AUTH.isPro)?'<span class="pill ok">Pro Unlocked</span>':'<span class="pill pro">Pro</span>'),run=t.runtime==="server"?'<span class="pill api">Light backend</span>':'<span class="pill ok">Browser</span>';a.innerHTML=`<div><h3>${t.name}</h3><p>${t.description}</p></div><div class="pills">${plan}${run}<span class="pill">${t.category}</span></div>`;return a}
function renderCards(list){const grid=$("toolsGrid");if(!grid)return;grid.innerHTML="";list.forEach(t=>grid.appendChild(toolCard(t)));if(!list.length)grid.innerHTML='<div class="panel"><h2>No tools found</h2><p class="message">Try changing your filters.</p></div>'}
function initToolsPage(){
const search=$("search"),cat=$("categoryFilter"),plan=$("planFilter"),runtime=$("runtimeFilter"),sort=$("sortFilter"),reset=$("resetFilters"),sub=$("subtitle");
if(cat&&cat.children.length<=1)categories().forEach(c=>cat.insertAdjacentHTML("beforeend",`<option value="${c}">${c}</option>`));

function setActiveQuickFilter(kind,value){
  document.querySelectorAll(".quick-filter-btn").forEach(btn=>btn.classList.remove("active"));
  const selector = kind==="runtime" ? `[data-runtime-shortcut="${value}"]` : `[data-plan-shortcut="${value}"]`;
  const btn = document.querySelector(selector);
  if(btn) btn.classList.add("active");
}

function update(){
  const q=(search?.value||"").toLowerCase().trim();
  let list=tools().filter(t=>{
    const hay=[t.name,t.id,t.category,t.description,t.plan,t.runtime].join(" ").toLowerCase();
    return(!q||hay.includes(q))
      &&(!cat||cat.value==="all"||t.category===cat.value)
      &&(!plan||plan.value==="all"||t.plan===plan.value)
      &&(!runtime||runtime.value==="all"||t.runtime===runtime.value);
  });

  const s=sort?.value||"recommended";
  if(s==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
  if(s==="category")list.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  if(s==="free")list.sort((a,b)=>(a.plan==="free"?0:1)-(b.plan==="free"?0:1)||a.name.localeCompare(b.name));
  if(s==="pro")list.sort((a,b)=>(a.plan==="pro"?0:1)-(b.plan==="pro"?0:1)||a.name.localeCompare(b.name));

  const shownPro=list.filter(t=>t.plan==="pro").length;
  const shownFree=list.filter(t=>t.plan==="free").length;
  const shownBackend=list.filter(t=>t.runtime==="server").length;
  if(sub)sub.textContent=`${list.length} tools shown — ${shownFree} free, ${shownPro} pro, ${shownBackend} backend`;
  renderCards(list);
}

document.querySelectorAll("[data-plan-shortcut]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(plan) plan.value=btn.dataset.planShortcut;
    if(runtime) runtime.value="all";
    setActiveQuickFilter("plan",btn.dataset.planShortcut);
    update();
  });
});
document.querySelectorAll("[data-runtime-shortcut]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(plan) plan.value="pro";
    if(runtime) runtime.value=btn.dataset.runtimeShortcut;
    setActiveQuickFilter("runtime",btn.dataset.runtimeShortcut);
    update();
  });
});

[search,cat,plan,runtime,sort].forEach(el=>el&&el.addEventListener("input",()=>{
  if(plan?.value==="all"&&runtime?.value==="all")setActiveQuickFilter("plan","all");
  else if(plan?.value==="free")setActiveQuickFilter("plan","free");
  else if(plan?.value==="pro"&&runtime?.value==="all")setActiveQuickFilter("plan","pro");
  else if(plan?.value==="pro"&&runtime?.value==="server")setActiveQuickFilter("runtime","server");
  update();
}));

if(reset)reset.onclick=()=>{
  if(search)search.value="";
  if(cat)cat.value="all";
  if(plan)plan.value="all";
  if(runtime)runtime.value="all";
  if(sort)sort.value="recommended";
  setActiveQuickFilter("plan","all");
  update();
};
update();
}
function initCategoriesPage(){const grid=$("categoriesGrid");if(!grid)return;grid.innerHTML="";categories().forEach(c=>{const count=tools().filter(t=>t.category===c).length,a=document.createElement("a");a.className="category-card";a.href=categoryUrl(c);a.innerHTML=`<div><h3>${c}</h3><p>${count} tools available in this category.</p></div><div class="pills"><span class="pill ok">Open category</span></div>`;grid.appendChild(a)})}
function currentCategorySlug(){const parts=location.pathname.split("/").filter(Boolean);if(parts[0]==="category"&&parts[1])return parts[1];return param("cat")}
function currentToolId(){const parts=location.pathname.split("/").filter(Boolean);if(parts[0]==="tool"&&parts[1])return decodeURIComponent(parts[1]);return param("id")}
function initCategoryPage(){const c=categories().find(x=>slugify(x)===currentCategorySlug())||categories()[0],list=tools().filter(t=>t.category===c);if($("categoryTitle"))$("categoryTitle").textContent=c;if($("categoryDesc"))$("categoryDesc").textContent=`${list.length} tools in ${c}.`;renderCards(list)}
function initToolPage(){activeTool=tools().find(t=>t.id===currentToolId())||tools()[0];if(!activeTool)return;if($("toolTitle"))$("toolTitle").textContent=activeTool.name;if($("toolDesc"))$("toolDesc").textContent=activeTool.description;if($("toolCategory"))$("toolCategory").textContent=activeTool.category;const box=$("toolWorkspace");if(!box)return;const locked=activeTool.plan==="pro"&&!(window.VEXZION_AUTH&&window.VEXZION_AUTH.isPro);if(locked){box.innerHTML=`<section class="panel"><h2>${activeTool.name} is a Pro tool</h2><p class="message">${activeTool.description}</p><div class="notice-box"><h2>Unlock with Lifetime Pro</h2><p>This tool opens correctly, but it requires Pro access.</p><div class="price">$19.99 <span>once</span></div><a class="btn primary" href="/pricing">View Pro</a></div></section>`;return}box.innerHTML=`<section class="panel"><div class="filter-title"><div><h2>Use ${activeTool.name}</h2><p>${activeTool.description}</p></div><div class="pills"><span class="pill ok">${activeTool.plan==="free"?"Free":"Pro Unlocked"}</span><span class="pill ${activeTool.runtime==="server"?"api":"ok"}">${activeTool.runtime==="server"?"Light backend":"Browser"}</span></div></div>${needsFile(activeTool)?'<div class="drop" id="drop"><b>Drop files here</b><br><span class="message">or click to upload</span><input id="fileInput" type="file" multiple></div>':''}<div class="safety-box"><b>File safety</b><br>Your files are used only for the selected tool action.</div>${activeTool.runtime==="server"||needsText(activeTool)?'<textarea id="textInput" class="input" placeholder="Paste text here..."></textarea><br><br>':options(activeTool)}<div class="row"><button class="btn primary" onclick="runTool()">Run Tool</button><button class="btn" onclick="clearResult()">Clear</button><a class="btn" href="/tools">All tools</a></div><div id="result" class="output" style="margin-top:12px">Result will appear here.</div></section>`;setupDrop()}
function needsFile(t){return ["pdf-merge","images-to-pdf","image-convert-png","image-convert-jpg","image-compress","image-resize","file-info","rename","file-base64","data-url","zip-files"].includes(t.type)}
function needsText(t){return !needsFile(t)||["text-message"].includes(t.type)}
function options(t){if(t.type==="image-resize")return'<div class="grid2"><input id="width" class="input" type="number" placeholder="Width"><input id="height" class="input" type="number" placeholder="Height"></div><br>';if(t.type==="image-compress")return'<label>Quality</label><input id="quality" class="input" type="number" min="1" max="100" value="75"><br><br>';return""}
function setupDrop(){const drop=$("drop"),input=$("fileInput");if(!drop||!input)return;drop.onclick=()=>input.click();input.onchange=e=>setFiles(e.target.files);["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag")}));["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag")}));drop.addEventListener("drop",e=>{e.preventDefault();setFiles(e.dataTransfer.files)})}
function setFiles(files){selectedFiles=Array.from(files||[]);if($("result"))$("result").textContent=selectedFiles.map(f=>`${f.name} (${formatBytes(f.size)})`).join("\n")||"No files selected."}
function clearResult(){if($("result"))$("result").textContent="Cleared."}
async function runTool(){if(!activeTool)return;const r=$("result");if(r)r.textContent="Processing...";if(activeTool.runtime==="server")return serverTool();if(needsFile(activeTool)&&!selectedFiles.length){r.textContent="Choose at least one file.";return}if(activeTool.type==="zip-files")return zipFiles();if(activeTool.type==="pdf-merge")return mergePdf();if(activeTool.type==="images-to-pdf")return imagesToPdf();if(activeTool.type&&activeTool.type.startsWith("image-"))return imageTool();if(["file-info","rename","file-base64","data-url"].includes(activeTool.type))return fileUtilityTool();return textTool()}
async function serverTool(){const body=new FormData();body.append("text",$("textInput")?.value||"");selectedFiles.forEach(f=>body.append("files",f));const res=await fetch(`/api/convert/${activeTool.id}`,{method:"POST",body,credentials:"include"});const data=await res.json();$("result").textContent=data.result?.output||JSON.stringify(data,null,2)}
async function imageTool(){const r=$("result");r.innerHTML="";try{for(const file of selectedFiles){const img=await loadImage(file),canvas=document.createElement("canvas");let w=img.width,h=img.height;if(activeTool.type==="image-resize"){w=Number($("width")?.value)||img.width;h=Number($("height")?.value)||Math.round(img.height*(w/img.width))}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);let type="image/png",ext="png",quality=.92;if(activeTool.type==="image-convert-jpg"){type="image/jpeg";ext="jpg"}if(activeTool.type==="image-compress"){type=file.type.includes("png")?"image/png":"image/jpeg";ext=type.includes("png")?"png":"jpg";quality=(Number($("quality")?.value||75)/100)}const blob=await new Promise(res=>canvas.toBlob(res,type,quality));addDownload(r,blob,file.name.replace(/\.[^.]+$/,"")+"."+ext,"Image ready")}}catch(e){r.textContent="Upload a supported image file for this action."}}
async function mergePdf(){const r=$("result");r.innerHTML="";if(!window.PDFLib){r.textContent="PDF library did not load.";return}const merged=await PDFLib.PDFDocument.create();for(const file of selectedFiles){const pdf=await PDFLib.PDFDocument.load(await file.arrayBuffer());const pages=await merged.copyPages(pdf,pdf.getPageIndices());pages.forEach(p=>merged.addPage(p))}const bytes=await merged.save();addDownload(r,new Blob([bytes],{type:"application/pdf"}),"vexzion-merged.pdf","Merged PDF ready")}
async function imagesToPdf(){const r=$("result");r.innerHTML="";if(!window.PDFLib){r.textContent="PDF library did not load.";return}const pdf=await PDFLib.PDFDocument.create();for(const file of selectedFiles){const bytes=await file.arrayBuffer();const image=file.type.includes("png")?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const page=pdf.addPage([image.width,image.height]);page.drawImage(image,{x:0,y:0,width:image.width,height:image.height})}const out=await pdf.save();addDownload(r,new Blob([out],{type:"application/pdf"}),"vexzion-images.pdf","PDF ready")}
async function zipFiles(){const r=$("result");r.innerHTML="";if(!window.JSZip){r.textContent="ZIP library did not load.";return}const zip=new JSZip();for(const f of selectedFiles)zip.file(f.name,await f.arrayBuffer());const blob=await zip.generateAsync({type:"blob"});addDownload(r,blob,"vexzion-files.zip","ZIP ready")}
async function fileUtilityTool(){const r=$("result");if(activeTool.type==="file-base64"||activeTool.type==="data-url"){r.textContent=await readAsDataURL(selectedFiles[0]);return}r.textContent=selectedFiles.map((f,i)=>`${i+1}. ${f.name}\nType: ${f.type||"unknown"}\nSize: ${formatBytes(f.size)}`).join("\n\n")}
async function textTool(){const r=$("result"),input=$("textInput")?.value||"";let out="";try{switch(activeTool.type){case"text-clean":out=input.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();break;case"word-count":out=`Characters: ${input.length}\nWords: ${(input.trim().match(/\S+/g)||[]).length}\nLines: ${input?input.split(/\n/).length:0}`;break;case"case-convert":out=`UPPERCASE:\n${input.toUpperCase()}\n\nlowercase:\n${input.toLowerCase()}`;break;case"dedupe-lines":out=[...new Set(input.split(/\n/))].join("\n");break;case"sort-lines":out=input.split(/\n/).sort((a,b)=>a.localeCompare(b)).join("\n");break;case"slugify":out=slugify(input);break;case"json-format":out=JSON.stringify(JSON.parse(input),null,2);break;case"json-minify":out=JSON.stringify(JSON.parse(input));break;case"json-validate":JSON.parse(input);out="Valid JSON.";break;case"csv-to-json":out=JSON.stringify(csvToJson(input),null,2);break;case"json-to-csv":out=jsonToCsv(JSON.parse(input));break;case"base64-encode":out=btoa(unescape(encodeURIComponent(input)));break;case"base64-decode":out=decodeURIComponent(escape(atob(input)));break;case"url-encode":out=encodeURIComponent(input);break;case"url-decode":out=decodeURIComponent(input);break;case"uuid":out=crypto.randomUUID();break;case"hash":const data=new TextEncoder().encode(input);const hash=await crypto.subtle.digest("SHA-256",data);out=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");break;case"password":out=generatePassword();break;case"random-number":out=String(Math.floor(Math.random()*1000000));break;case"timestamp":out=`Unix seconds: ${Math.floor(Date.now()/1000)}\nISO: ${new Date().toISOString()}`;break;case"shuffle-lines":out=input.split(/\n/).sort(()=>Math.random()-.5).join("\n");break;case"number-lines":out=input.split(/\n/).map((line,i)=>`${i+1}. ${line}`).join("\n");break;default:out=activeTool.description+"\n\nThis workspace is ready for this tool."}}catch(e){out="Could not process input. Check the format and try again."}r.textContent=out}
function csvToJson(input){const rows=input.trim().split(/\n/).map(r=>r.split(","));const headers=rows.shift()||[];return rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h.trim(),(row[i]||"").trim()])))}
function jsonToCsv(arr){if(!Array.isArray(arr))arr=[arr];const keys=[...new Set(arr.flatMap(o=>Object.keys(o)))];return [keys.join(","),...arr.map(o=>keys.map(k=>JSON.stringify(o[k]??"")).join(","))].join("\n")}
function generatePassword(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";return Array.from({length:18},()=>chars[Math.floor(Math.random()*chars.length)]).join("")}
function loadImage(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=URL.createObjectURL(file)})}
function readAsDataURL(file){return new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=rej;reader.readAsDataURL(file)})}
function addDownload(parent,blob,name,label){const url=URL.createObjectURL(blob);parent.innerHTML+=`<div style="margin:10px 0"><b>${label}</b><br><span class="message">${formatBytes(blob.size)}</span><br><a class="btn primary" download="${name}" href="${url}">Download ${name}</a></div>`}
async function vexzionSignup(email,password){return(await fetch("/api/auth/signup",{method:"POST",credentials:"include",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})})).json()}
async function vexzionSignin(email,password){return(await fetch("/api/auth/signin",{method:"POST",credentials:"include",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})})).json()}
async function vexzionSignout(){await fetch("/api/auth/signout",{method:"POST",credentials:"include"});location.href="/signin"}
async function startProCheckout(){const consent=$("proAgeConsent"),msg=$("checkoutMsg");if(consent&&!consent.checked){if(msg)msg.textContent="Please confirm the Pro purchase age/parent permission requirement before checkout.";return}const data=await(await fetch("/api/checkout",{method:"POST",credentials:"include"})).json();if(data.url)location.href=data.url;else if(msg)msg.textContent=data.message||"Checkout is not configured yet."}
async function loadAccountPage(){const data=await(await fetch("/api/auth/me",{credentials:"include"})).json(),title=$("accountTitle"),text=$("accountText"),actions=$("accountActions");if(!data.user){title.textContent="You are not logged in";text.textContent="Create an account or login to save Pro access.";actions.innerHTML='<a class="btn primary" href="/signup">Sign up</a><a class="btn" href="/signin">Login</a>';return}title.textContent=data.isPro?"Pro is active":"Free account";text.textContent=data.isPro?`Logged in as ${data.user.email}. Your Pro access is saved.`:`Logged in as ${data.user.email}. You can use Free tools now or unlock Pro later.`;actions.innerHTML='<a class="btn primary" href="/tools">Use tools</a><button class="btn" onclick="vexzionSignout()">Logout</button>'}
document.addEventListener("DOMContentLoaded",initBase);

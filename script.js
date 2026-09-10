const STORE_KEY = "uhuruInvoiceSystem_v1";
const DEFAULT_LOGO = "";

const defaultData = {
  password: "admin123",
  company: {
    name: "UHURU DIGITAL CONSULTATIONS",
    reg: "",
    vat: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    payment: "Banking details: ______________________________\nAccount holder: ______________________________\nAccount number: ______________________________\nBank: ______________________________"
  },
  appearance: {
    accent: "#86cf4d",
    title: "INVOICE",
    footer: "Thank you for your business.",
    preparedBy: ""
  },
  logo: DEFAULT_LOGO,
  nextNumber: 1,
  current: null,
  invoices: []
};

let data = loadData();
let items = [];

const $ = id => document.getElementById(id);

function loadData(){
  try { return {...defaultData, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}")}; }
  catch(e){ return structuredClone(defaultData); }
}
function saveData(){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function money(n){ return `${$('currency')?.value || "ZAR"} ${Number(n||0).toFixed(2)}`; }
function escapeHtml(v=""){ return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

function setup(){
  const logo = data.logo || "";
  if(logo){ $("brandLogo").src=logo; $("loginLogo").src=logo; }
  else {
    $("brandLogo").style.display="none";
    $("loginLogo").style.display="none";
  }
  $("accentColor").value=data.appearance.accent;
  document.documentElement.style.setProperty("--accent",data.appearance.accent);
  fillCompany();
  fillAppearance();
  newInvoice();
  renderHistory();
}
function fillCompany(){
  const c=data.company;
  [["companyName",c.name],["companyReg",c.reg],["companyVat",c.vat],["companyAddress",c.address],["companyPhone",c.phone],["companyWhatsApp",c.whatsapp],["companyEmail",c.email],["companyWebsite",c.website],["defaultPayment",c.payment]].forEach(([id,v])=>$(id).value=v||"");
}
function fillAppearance(){
  const a=data.appearance;
  $("accentColor").value=a.accent; $("invoiceTitle").value=a.title; $("footerText").value=a.footer; $("preparedBy").value=a.preparedBy||"";
  document.documentElement.style.setProperty("--accent",a.accent);
}
function saveCompany(){
  data.company={name:$("companyName").value,reg:$("companyReg").value,vat:$("companyVat").value,address:$("companyAddress").value,phone:$("companyPhone").value,whatsapp:$("companyWhatsApp").value,email:$("companyEmail").value,website:$("companyWebsite").value,payment:$("defaultPayment").value};
  saveData(); renderPreview(); alert("Company details saved.");
}
function saveAppearance(){
  data.appearance={accent:$("accentColor").value,title:$("invoiceTitle").value||"INVOICE",footer:$("footerText").value,preparedBy:$("preparedBy").value};
  document.documentElement.style.setProperty("--accent",data.appearance.accent);
  saveData(); renderPreview(); alert("Appearance saved.");
}
function newInvoice(){
  const n=String(data.nextNumber).padStart(4,"0");
  $("invoiceNumber").value=`UH-${new Date().getFullYear()}-${n}`;
  const today=new Date(), due=new Date(today); due.setDate(due.getDate()+7);
  $("invoiceDate").value=today.toISOString().slice(0,10);
  $("dueDate").value=due.toISOString().slice(0,10);
  $("currency").value="ZAR"; $("taxRate").value=15;
  ["clientName","clientContact","clientAddress","clientPhone","clientEmail","notes"].forEach(id=>$(id).value="");
  $("paymentDetails").value=data.company.payment||"";
  items=[{description:"Website design and development",qty:1,rate:0}];
  renderItems(); renderPreview();
}
function renderItems(){
  $("itemsEditor").innerHTML=items.map((it,i)=>`
    <div class="item-row">
      <input data-i="${i}" data-k="description" value="${escapeHtml(it.description)}" placeholder="Description">
      <input data-i="${i}" data-k="qty" type="number" min="0" step="1" value="${it.qty}">
      <input data-i="${i}" data-k="rate" type="number" min="0" step="0.01" value="${it.rate}">
      <div class="item-amount">${money((Number(it.qty)||0)*(Number(it.rate)||0))}</div>
      <button class="remove-item" data-remove="${i}">×</button>
    </div>`).join("");
  document.querySelectorAll("#itemsEditor input").forEach(inp=>inp.addEventListener("input",()=>{
    const i=Number(inp.dataset.i), k=inp.dataset.k;
    items[i][k]=k==="description"?inp.value:Number(inp.value);
    renderItems(); renderPreview();
  }));
  document.querySelectorAll(".remove-item").forEach(b=>b.addEventListener("click",()=>{items.splice(Number(b.dataset.remove),1);renderItems();renderPreview();}));
}
function totals(){
  const subtotal=items.reduce((s,it)=>s+(Number(it.qty)||0)*(Number(it.rate)||0),0);
  const tax=subtotal*(Number($("taxRate").value)||0)/100;
  return {subtotal,tax,total:subtotal+tax};
}
function renderPreview(){
  const c=data.company,a=data.appearance,t=totals(),cur=$("currency").value||"ZAR";
  const logo=data.logo?`<img class="inv-logo" src="${data.logo}" alt="">`:"";
  const itemRows=items.map(it=>`<tr><td>${escapeHtml(it.description)}</td><td>${Number(it.qty||0)}</td><td>${cur} ${Number(it.rate||0).toFixed(2)}</td><td>${cur} ${(Number(it.qty||0)*Number(it.rate||0)).toFixed(2)}</td></tr>`).join("");
  $("invoicePreview").innerHTML=`
    <div class="inv-top"><div>${logo}</div><div class="inv-company">
      <h1>${escapeHtml(c.name)}</h1><p>${escapeHtml(c.address)}</p><p>${escapeHtml(c.phone)}${c.whatsapp?` • WhatsApp ${escapeHtml(c.whatsapp)}`:""}</p><p>${escapeHtml(c.email)}${c.website?` • ${escapeHtml(c.website)}`:""}</p>
      ${c.reg?`<p>Reg: ${escapeHtml(c.reg)}</p>`:""}${c.vat?`<p>VAT: ${escapeHtml(c.vat)}</p>`:""}
    </div></div>
    <div class="inv-title"><h2>${escapeHtml(a.title)}</h2><div class="inv-meta"><div><b>Invoice:</b> ${escapeHtml($("invoiceNumber").value)}</div><div><b>Date:</b> ${escapeHtml($("invoiceDate").value)}</div><div><b>Due:</b> ${escapeHtml($("dueDate").value)}</div></div></div>
    <div class="bill-box"><strong>BILL TO</strong><p>${escapeHtml($("clientName").value||"Customer name")}</p><p>${escapeHtml($("clientContact").value)}${$("clientPhone").value?` • ${escapeHtml($("clientPhone").value)}`:""}</p><p>${escapeHtml($("clientAddress").value)}</p><p>${escapeHtml($("clientEmail").value)}</p></div>
    <table class="inv-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${itemRows||"<tr><td colspan='4'>No items added</td></tr>"}</tbody></table>
    <div class="inv-summary"><div class="sum-row"><span>Subtotal</span><b>${cur} ${t.subtotal.toFixed(2)}</b></div><div class="sum-row"><span>VAT / Tax (${Number($("taxRate").value||0)}%)</span><b>${cur} ${t.tax.toFixed(2)}</b></div><div class="sum-row sum-total"><span>TOTAL</span><b>${cur} ${t.total.toFixed(2)}</b></div></div>
    <div class="inv-footer"><b>Payment Details</b>\n${escapeHtml($("paymentDetails").value)}\n\n<b>Notes / Terms</b>\n${escapeHtml($("notes").value)}${a.preparedBy?`\n\nPrepared by: ${escapeHtml(a.preparedBy)}`:""}\n\n${escapeHtml(a.footer)}</div>
    <div class="inv-thanks">Thank you for choosing UHURU DIGITAL CONSULTATIONS</div>`;
}
function collectInvoice(){
  const t=totals();
  return {number:$("invoiceNumber").value,date:$("invoiceDate").value,due:$("dueDate").value,currency:$("currency").value,taxRate:Number($("taxRate").value)||0,
    client:{name:$("clientName").value,contact:$("clientContact").value,address:$("clientAddress").value,phone:$("clientPhone").value,email:$("clientEmail").value},
    items:structuredClone(items),notes:$("notes").value,paymentDetails:$("paymentDetails").value,totals:t};
}
function saveInvoice(){
  const inv=collectInvoice();
  const idx=data.invoices.findIndex(x=>x.number===inv.number);
  if(idx>=0)data.invoices[idx]=inv; else {data.invoices.unshift(inv);data.nextNumber++;saveData();}
  saveData(); renderHistory(); alert(`Invoice ${inv.number} saved locally.`);
}
function loadInvoice(inv){
  $("invoiceNumber").value=inv.number;$("invoiceDate").value=inv.date;$("dueDate").value=inv.due;$("currency").value=inv.currency||"ZAR";$("taxRate").value=inv.taxRate||0;
  $("clientName").value=inv.client.name||"";$("clientContact").value=inv.client.contact||"";$("clientAddress").value=inv.client.address||"";$("clientPhone").value=inv.client.phone||"";$("clientEmail").value=inv.client.email||"";
  $("notes").value=inv.notes||"";$("paymentDetails").value=inv.paymentDetails||"";items=structuredClone(inv.items||[]);renderItems();renderPreview();showSection("invoiceSection");
}
function renderHistory(){
  const body=$("historyBody");
  if(!data.invoices.length){body.innerHTML="<tr><td colspan='5'>No saved invoices yet.</td></tr>";return;}
  body.innerHTML=data.invoices.map((x,i)=>`<tr><td><b>${escapeHtml(x.number)}</b></td><td>${escapeHtml(x.client?.name||"")}</td><td>${escapeHtml(x.date||"")}</td><td>${escapeHtml(x.currency||"ZAR")} ${Number(x.totals?.total||0).toFixed(2)}</td><td class="row-actions"><button class="btn small secondary" data-load="${i}">Open</button><button class="btn small danger" data-delete="${i}">Delete</button></td></tr>`).join("");
  body.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>loadInvoice(data.invoices[Number(b.dataset.load)]));
  body.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(confirm("Delete this saved invoice?")){data.invoices.splice(Number(b.dataset.delete),1);saveData();renderHistory();}});
}
function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active-section"));
  $(id).classList.add("active-section");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.section===id));
}
function exportBackup(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="uhuru-invoice-backup.json";a.click();URL.revokeObjectURL(a.href);
}
function resetAll(){
  if(confirm("Reset all local UHURU invoice data? This cannot be undone unless you have a backup.")){localStorage.removeItem(STORE_KEY);data=structuredClone(defaultData);location.reload();}
}

$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  if($("loginPassword").value===data.password){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");setup();}
  else $("loginError").textContent="Incorrect password.";
});
$("logoutBtn").onclick=()=>{ $("app").classList.add("hidden");$("loginScreen").classList.remove("hidden");$("loginPassword").value=""; };
$("newInvoiceBtn").onclick=newInvoice;
$("printBtn").onclick=()=>{renderPreview();window.print();};
$("addItemBtn").onclick=()=>{items.push({description:"",qty:1,rate:0});renderItems();renderPreview();};
$("saveInvoiceBtn").onclick=saveInvoice;
$("clearInvoiceBtn").onclick=newInvoice;
$("saveCompanyBtn").onclick=saveCompany;
$("saveAppearanceBtn").onclick=saveAppearance;
$("accentColor").addEventListener("input",e=>{document.documentElement.style.setProperty("--accent",e.target.value);renderPreview();});
["invoiceNumber","invoiceDate","dueDate","currency","taxRate","clientName","clientContact","clientAddress","clientPhone","clientEmail","notes","paymentDetails"].forEach(id=>$(id).addEventListener("input",renderPreview));
$("logoUpload").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{data.logo=r.result;saveData();$("brandLogo").src=r.result;$("brandLogo").style.display="block";$("loginLogo").src=r.result;$("loginLogo").style.display="block";renderPreview();};r.readAsDataURL(f);
});
$("removeLogoBtn").onclick=()=>{data.logo="";saveData();$("brandLogo").style.display="none";$("loginLogo").style.display="none";renderPreview();};
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>showSection(n.dataset.section));
$("exportBtn").onclick=exportBackup;
$("importFile").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const imported=JSON.parse(r.result);if(!imported.company||!imported.appearance)throw Error();data={...defaultData,...imported};saveData();alert("Backup imported. Reloading.");location.reload();}catch(err){alert("Invalid UHURU backup file.");}};r.readAsText(f);
};
$("resetBtn").onclick=resetAll;
$("changePasswordBtn").onclick=()=>{const p=$("newPassword").value.trim();if(p.length<4){alert("Use at least 4 characters.");return;}data.password=p;saveData();$("newPassword").value="";alert("Admin password changed.");};

document.documentElement.style.setProperty("--accent",data.appearance.accent);

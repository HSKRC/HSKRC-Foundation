(()=>{"use strict";
const header=document.querySelector(".pnav-header");if(!header)return;
const menu=header.querySelector(".pnav-menu");
const groups=[...header.querySelectorAll(".pnav-group")];
if(menu){menu.addEventListener("click",()=>{const open=header.classList.toggle("is-open");menu.setAttribute("aria-expanded",String(open));menu.textContent=open?"×":"☰"})}
groups.forEach(g=>g.addEventListener("toggle",()=>{if(g.open){groups.forEach(o=>{if(o!==g)o.open=false})}}));
document.addEventListener("click",e=>{if(!header.contains(e.target)){groups.forEach(g=>g.open=false);header.classList.remove("is-open");if(menu){menu.setAttribute("aria-expanded","false");menu.textContent="☰"}}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){groups.forEach(g=>g.open=false);header.classList.remove("is-open");if(menu){menu.setAttribute("aria-expanded","false");menu.textContent="☰"}}});
const file=(location.pathname.split("/").pop()||"index.html").toLowerCase();
const current=(a)=>{const href=(a.getAttribute("href")||"").split("#")[0].toLowerCase();return href===file||(file===""&&href==="index.html")};
header.querySelectorAll("a").forEach(a=>{if(current(a))a.setAttribute("aria-current","page")});
groups.forEach(g=>{if([...g.querySelectorAll("a")].some(a=>a.hasAttribute("aria-current")))g.classList.add("open-parent")});
})();
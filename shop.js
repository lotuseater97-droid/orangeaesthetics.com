"use strict";
// Non-transactional planning list. No persistence, accounts, payment, or patient information.
(()=>{
const bag=[];const cards=[...document.querySelectorAll("#products .card")];
const items=document.getElementById("bag-items"),total=document.getElementById("bag-total"),copy=document.getElementById("bag-copy"),clear=document.getElementById("bag-clear");
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
function render(){items.replaceChildren();if(!bag.length){const p=document.createElement("p");p.textContent="Choose products above to create a list.";items.append(p);}else{const ul=document.createElement("ul");for(const product of bag){const li=document.createElement("li");li.textContent=product.name+" ("+product.size+") — "+money(product.price);ul.append(li);}items.append(ul);}total.textContent=bag.length?"Estimated reference subtotal: "+money(bag.reduce((sum,p)=>sum+p.price,0))+" (excludes tax)":" ";copy.disabled=clear.disabled=!bag.length;}
for(const card of cards){const button=card.querySelector(".catalog-add");if(!button)continue;button.addEventListener("click",()=>{const priceText=card.querySelector("strong").textContent;const price=Number(priceText.replace(/[^0-9.]/g,""));const name=card.querySelector("h3").textContent;const size=card.querySelector(".eyebrow").textContent.replace(/^NEOCUTIS\\s*·\\s*/,"");if(!Number.isFinite(price))return;bag.push({name,size,price});render();document.querySelector(".planning-bag").scrollIntoView({behavior:"smooth",block:"nearest"});});}
copy.addEventListener("click",async()=>{const lines=["Orange Aesthetics — skincare inquiry (not an order)",...bag.map(p=>p.name+" ("+p.size+") — "+money(p.price)),"Reference subtotal (before tax): "+money(bag.reduce((sum,p)=>sum+p.price,0)),"Please confirm availability and current pricing: (714) 921-3870"];try{await navigator.clipboard.writeText(lines.join("\\n"));copy.textContent="Copied product list";}catch{copy.textContent="Copy unavailable — please call";}});
clear.addEventListener("click",()=>{bag.length=0;copy.textContent="Copy product list";render();});render();
})();

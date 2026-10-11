const products = [
  {id:"real-madrid-home",name:"Madrid White Home",team:"Real Madrid",category:"club",categoryLabel:"Club Jersey",price:850,oldPrice:1000,badge:"BEST SELLER",sizes:["S","M","L","XL","XXL"],image:"https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=85",description:"সাদা ক্লাসিক ফ্যান জার্সি"},
  {id:"barcelona-home",name:"Barcelona Blue & Red",team:"FC Barcelona",category:"club",categoryLabel:"Club Jersey",price:850,oldPrice:1000,badge:"FAN FAVOURITE",sizes:["S","M","L","XL","XXL"],image:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=85",description:"বার্সেলোনার রঙে ফ্যান জার্সি"},
  {id:"argentina-home",name:"Argentina Sky Blue",team:"Argentina",category:"national",categoryLabel:"National Team",price:850,oldPrice:950,badge:"POPULAR",sizes:["S","M","L","XL","XXL"],image:"https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=85",description:"আর্জেন্টিনা অনুপ্রাণিত ফ্যান জার্সি"},
  {id:"custom-jersey",name:"Custom Name Jersey",team:"Custom",category:"custom",categoryLabel:"Custom Jersey",price:950,oldPrice:null,badge:"MAKE IT YOURS",sizes:["S","M","L","XL","XXL"],image:"https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=85",description:"নিজের নাম ও নম্বর যোগ করুন"}
];

const config = window.SHOP_CONFIG || {currency:"৳",ORDER_ENDPOINT:"",FACEBOOK_PAGE_URL:"https://www.facebook.com/"};
const grid = document.getElementById("productGrid");
const modal = document.getElementById("orderModal");
const form = document.getElementById("orderForm");
const statusEl = document.getElementById("formStatus");
const quantityInput = document.getElementById("quantityInput");
const sizeSelect = document.getElementById("sizeSelect");
let selectedProduct = null;

const money = n => `${config.currency || "৳"}${Number(n).toLocaleString("en-BD")}`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

function renderProducts(){
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const filtered = products.filter(p => (category === "all" || p.category === category) &&
    [p.name,p.team,p.categoryLabel,p.description].some(v => v.toLowerCase().includes(query)));
  if(!filtered.length){grid.innerHTML='<div class="empty-state">কোনো জার্সি পাওয়া যায়নি। অন্য নামে খুঁজুন।</div>';return;}
  grid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.opacity='.12';this.style.background='#e8eef8'">
        <span class="product-badge">${escapeHtml(p.badge)}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHtml(p.categoryLabel)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="product-meta"><span class="product-price">${money(p.price)}${p.oldPrice?` <del>${money(p.oldPrice)}</del>`:""}</span><span class="product-sizes">S · M · L · XL · XXL</span></div>
        <button class="product-order" type="button" data-order="${escapeHtml(p.id)}">অর্ডার করুন <span>→</span></button>
      </div>
    </article>`).join("");
}

function openOrder(productId){
  selectedProduct = products.find(p => p.id === productId);
  if(!selectedProduct)return;
  document.getElementById("productId").value = selectedProduct.id;
  document.getElementById("selectedName").textContent = selectedProduct.name;
  document.getElementById("selectedPrice").textContent = `${money(selectedProduct.price)} / পিস`;
  document.getElementById("selectedCategory").textContent = selectedProduct.description;
  document.getElementById("selectedImage").src = selectedProduct.image;
  document.getElementById("selectedImage").alt = selectedProduct.name;
  sizeSelect.innerHTML = '<option value="">সাইজ বেছে নিন</option>' + selectedProduct.sizes.map(s=>`<option value="${s}">${s}</option>`).join("");
  quantityInput.value = "1";
  updateTotal();
  statusEl.textContent = "";
  statusEl.className = "form-status";
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(()=>sizeSelect.focus(),80);
}
function closeOrder(){modal.hidden=true;document.body.style.overflow="";}
function updateTotal(){
  const qty = Math.max(1,Math.min(10,Number(quantityInput.value)||1));
  if(quantityInput.value !== String(qty)) quantityInput.value = String(qty);
  document.getElementById("orderTotal").textContent = selectedProduct ? money(selectedProduct.price*qty) : money(0);
}
grid.addEventListener("click",e=>{const btn=e.target.closest("[data-order]");if(btn)openOrder(btn.dataset.order);});
document.getElementById("searchInput").addEventListener("input",renderProducts);
document.getElementById("categoryFilter").addEventListener("change",renderProducts);
document.getElementById("closeModal").addEventListener("click",closeOrder);
modal.addEventListener("click",e=>{if(e.target===modal)closeOrder();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeOrder();});
quantityInput.addEventListener("input",updateTotal);
document.getElementById("year").textContent = new Date().getFullYear();
const contactButton = document.getElementById("contactButton");
if(config.FACEBOOK_PAGE_URL) contactButton.href = config.FACEBOOK_PAGE_URL;

function setStatus(message,type=""){
  statusEl.textContent=message;
  statusEl.className=`form-status ${type}`.trim();
}
function makeOrder(formData){
  const product = products.find(p=>p.id===formData.get("productId"));
  if(!product) throw new Error("পণ্যটি পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
  const quantity = Number(formData.get("quantity"));
  if(!Number.isInteger(quantity)||quantity<1||quantity>10) throw new Error("পরিমাণ ১ থেকে ১০-এর মধ্যে দিন।");
  return {
    orderId:"CB-"+Date.now().toString(36).toUpperCase(),
    createdAt:new Date().toISOString(),
    productId:product.id,
    productName:product.name,
    unitPrice:product.price,
    quantity,
    subtotal:product.price*quantity,
    size:formData.get("size"),
    customerName:String(formData.get("customerName")||"").trim(),
    phone:String(formData.get("phone")||"").trim(),
    address:String(formData.get("address")||"").trim(),
    note:String(formData.get("note")||"").trim(),
    paymentMethod:"Cash on Delivery",
    status:"Pending"
  };
}
form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  if(!selectedProduct)return;
  const submit=document.getElementById("submitOrder");
  submit.disabled=true;submit.textContent="অর্ডার পাঠানো হচ্ছে…";
  setStatus("");
  try{
    const order=makeOrder(new FormData(form));
    if(!config.ORDER_ENDPOINT){
      setStatus("ডেমো মোড: অর্ডার তৈরি হয়েছে, কিন্তু অনলাইনে সংরক্ষিত হয়নি। প্রকৃত অর্ডারের জন্য README অনুযায়ী ORDER_ENDPOINT সেট করুন।","error");
      return;
    }
    const response=await fetch(config.ORDER_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(order),
      redirect:"follow"
    });
    if(!response.ok)throw new Error("অর্ডার পাঠানো যায়নি। পরে আবার চেষ্টা করুন বা Facebook-এ যোগাযোগ করুন।");
    let result={};
    try{result=await response.json();}catch(_){}
    if(result.ok===false)throw new Error(result.message||"অর্ডার গ্রহণ করা যায়নি।");
    setStatus(`ধন্যবাদ! আপনার অর্ডার রেফারেন্স ${order.orderId}। আমরা ফোনে অর্ডার নিশ্চিত করব।`,"success");
    form.reset();quantityInput.value="1";updateTotal();
  }catch(err){
    setStatus(err.message||"সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।","error");
  }finally{
    submit.disabled=false;submit.innerHTML='অর্ডার কনফার্ম করুন <span>→</span>';
  }
});

renderProducts();

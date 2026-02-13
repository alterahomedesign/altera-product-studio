const express = require('express');
const multer = require('multer');
const JSZip = require('jszip');
const path = require('path');
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50*1024*1024 } });
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
const CLAUDE_KEY = process.env.CLAUDE_API_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const CATS = {"sofa":{col:"Sofas",sCat:"Furniture > Sofas > Sectional Sofas",type:"sofa",gsc:"460",w:{b:45,p:.35}},"bed":{col:"Beds",sCat:"Furniture > Beds & Accessories > Beds & Bed Frames > Platform Beds & Bed Frames",type:"bed",gsc:"505",w:{b:55,p:.3}},"mattress":{col:"Mattresses",sCat:"Furniture > Beds & Accessories > Mattresses > Innerspring Mattresses",type:"mattress",gsc:"2621",w:{b:30,p:.2}},"dining-table":{col:"Dining Tables",sCat:"Furniture > Tables > Kitchen & Dining Room Tables",type:"dining table",gsc:"6362",w:{b:40,p:.25}},"dining-set":{col:"Dining Table Sets",sCat:"Furniture > Furniture Sets > Kitchen & Dining Furniture Sets",type:"dining set",gsc:"6362",w:{b:60,p:.3}},"dining-chair":{col:"Dining Chairs",sCat:"Furniture > Chairs > Kitchen & Dining Room Chairs",type:"dining chair",gsc:"443",w:{b:8,p:.04}},"coffee-table":{col:"Coffee Tables & Side Tables",sCat:"Furniture > Tables > Accent Tables > Coffee Tables",type:"Coffee Table",gsc:"6362",w:{b:25,p:.18}},"side-table":{col:"Coffee Tables & Side Tables",sCat:"Furniture > Tables > Accent Tables > End Tables",type:"side table",gsc:"6362",w:{b:12,p:.1}},"nightstand":{col:"Nightstands",sCat:"Furniture > Tables > Nightstands",type:"nightstand",gsc:"6362",w:{b:10,p:.05}},"tv-cabinet":{col:"TV Cabinets",sCat:"Furniture > Entertainment Centers & TV Stands",type:"tv cabinet",gsc:"6356",w:{b:30,p:.2}},"sideboard":{col:"Sideboards",sCat:"Furniture > Cabinets & Storage > Sideboards",type:"sideboard",gsc:"6343",w:{b:35,p:.22}},"wardrobe":{col:"Wardrobes",sCat:"Furniture > Cabinets & Storage > Armoires & Wardrobes > Hinged Door Wardrobes",type:"wardrobe",gsc:"6343",w:{b:50,p:.35}},"office-desk":{col:"Office Desks",sCat:"Furniture > Office Furniture > Desks",type:"office desk",gsc:"6362",w:{b:30,p:.2}},"living-room-chair":{col:"Living Room Chairs",sCat:"Furniture > Chairs > Armchairs, Recliners & Sleeper Chairs > Armchairs",type:"living room chair",gsc:"443",w:{b:18,p:.08}},"bar-stool":{col:"Dining Chairs",sCat:"Furniture > Chairs > Table & Bar Stools > Bar Stools",type:"bar stool",gsc:"443",w:{b:10,p:.04}},"bedroom-bench":{col:"Bedroom Benches",sCat:"Furniture > Benches > Kitchen & Dining Benches > Dining Benches",type:"bedroom bench",gsc:"443",w:{b:15,p:.1}},"bedroom-set":{col:"Bedroom Sets",sCat:"Furniture > Furniture Sets > Bedroom Furniture Sets",type:"bedroom sets",gsc:"505",w:{b:80,p:.4}},"shoe-cabinet":{col:"Shoe Cabinets",sCat:"Home & Garden > Household Supplies > Storage & Organization > Clothing & Closet Storage > Shoe Racks & Organizers > Shoe Organizers",type:"shoe cabinet",gsc:"6343",w:{b:20,p:.15}},"rug":{col:"Rugs",sCat:"Home & Garden > Decor > Rugs",type:"rug",gsc:"4227",w:{b:8,p:.05}},"floor-lamp":{col:"Lighting",sCat:"Home & Garden > Lighting > Lamps > Floor Lamps",type:"lighting",gsc:"594",w:{b:8,p:.02}},"table-lamp":{col:"Lighting",sCat:"Home & Garden > Lighting > Lamps > Table Lamps",type:"lighting",gsc:"594",w:{b:4,p:.01}},"ceiling-light":{col:"Lighting",sCat:"Home & Garden > Lighting > Lighting Fixtures > Ceiling Light Fixtures",type:"lighting",gsc:"594",w:{b:5,p:.02}},"pendant-light":{col:"Lighting",sCat:"Home & Garden > Lighting > Lighting Fixtures > Chandeliers",type:"lighting",gsc:"594",w:{b:6,p:.02}},"wall-light":{col:"Lighting",sCat:"Home & Garden > Lighting > Lighting Fixtures > Wall Light Fixtures",type:"lighting",gsc:"594",w:{b:3,p:.01}},"buffet":{col:"Sideboards",sCat:"Furniture > Cabinets & Storage > Buffets",type:"sideboard",gsc:"6343",w:{b:40,p:.25}}};

const CSV_H = ['Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published','Option1 Name','Option1 Value','Option1 Linked To','Option2 Name','Option2 Value','Option2 Linked To','Option3 Name','Option3 Value','Option3 Linked To','Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Policy','Variant Fulfillment Service','Variant Price','Variant Compare At Price','Variant Requires Shipping','Variant Taxable','Unit Price Total Measure','Unit Price Total Measure Unit','Unit Price Base Measure','Unit Price Base Measure Unit','Variant Barcode','Image Src','Image Position','Image Alt Text','Gift Card','SEO Title','SEO Description','Google Shopping / Google Product Category','Google Shopping / Gender','Google Shopping / Age Group','Google Shopping / MPN','Google Shopping / Condition','Google Shopping / Custom Product','Google Shopping / Custom Label 0','Google Shopping / Custom Label 1','Google Shopping / Custom Label 2','Google Shopping / Custom Label 3','Google Shopping / Custom Label 4','Rubik Configuration (product.metafields.craftshift.rubik_configuration)','Brand (product.metafields.custom.brand)','Care Instructions (product.metafields.custom.care_instructions)','Contact (product.metafields.custom.contact)','Cost CAD (product.metafields.custom.cost_cad)','Cost USD (product.metafields.custom.cost_usd)','Materials (product.metafields.custom.materials)','Shipping (product.metafields.custom.shipping)','Shipping cost USD (product.metafields.custom.shipping_cost_usd)','Google: Custom Product (product.metafields.mm-google-shopping.custom_product)','Allergy-friendly features (product.metafields.shopify.allergy-friendly-features)','Back type (product.metafields.shopify.back-type)','Backrest type (product.metafields.shopify.backrest-type)','Bed/Frame features (product.metafields.shopify.bed-frame-features)','Bedding size (product.metafields.shopify.bedding-size)','Bulb cap type (product.metafields.shopify.bulb-cap-type)','Bulb size (product.metafields.shopify.bulb-size)','Care instructions (product.metafields.shopify.care-instructions)','Chair features (product.metafields.shopify.chair-features)','Color (product.metafields.shopify.color-pattern)','Compatible mattress size (product.metafields.shopify.compatible-mattress-size)','Door material (product.metafields.shopify.door-material)','Door type (product.metafields.shopify.door-type)','Firmness (product.metafields.shopify.firmness)','Furniture/Fixture features (product.metafields.shopify.furniture-fixture-features)','Furniture/Fixture material (product.metafields.shopify.furniture-fixture-material)','Kitchen/Dining furniture items included (product.metafields.shopify.kitchen-dining-furniture-items-included)','Light temperature (product.metafields.shopify.light-temperature)','Material (product.metafields.shopify.material)','Mattress features (product.metafields.shopify.mattress-features)','Mounting type (product.metafields.shopify.mounting-type)','Pile type (product.metafields.shopify.pile-type)','Seat type (product.metafields.shopify.seat-type)','Style (product.metafields.shopify.style)','Suitable space (product.metafields.shopify.suitable-space)','Upholstery material (product.metafields.shopify.upholstery-material)','Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)','Related products (product.metafields.shopify--discovery--product_recommendation.related_products)','Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)','Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)','Lenght (cm) (variant.metafields.custom.lenght_cm)','Lenght (in) (variant.metafields.custom.lenght_in)','Width (cm) (variant.metafields.custom.width_cm)','Width (in) (variant.metafields.custom.width_in)','Height (cm) (variant.metafields.custom.height_cm)','Height (in) (variant.metafields.custom.height_in)','Weight (kg) (variant.metafields.custom.weight_kg)','Weight (lbs) (variant.metafields.custom.weight_lbs)','Variant Image','Variant Weight Unit','Variant Tax Code','Cost per item','Status'];

const cmToIn=cm=>{const t=cm*.393701,w=Math.floor(t),r=t-w,e=Math.round(r*8);if(!e)return w+'"';if(e===8)return(w+1)+'"';let n=e,d=8;if(n%4===0){n/=4;d=2}else if(n%2===0){n/=2;d=4}return w+' '+n+'/'+d+'"'};
const cmToInNum=cm=>+(cm*.393701).toFixed(1);
const kgToLbs=kg=>+(kg*2.20462).toFixed(1);
const parseDims=s=>{if(!s)return{l:0,w:0,h:0};const parts=s.replace(/cm/gi,'').split(/[x*×]/i).map(p=>parseFloat(p.trim())||0);return{l:parts[0]||0,w:parts[1]||0,h:parts[2]||0}};
const fmtDims=s=>{if(!s)return'';const l=['length','width','height'];return s.replace(/cm/gi,'').split(/[x*×]/i).map((p,i)=>{const v=parseFloat(p.trim());if(isNaN(v))return'';return Math.round(v)+'cm ('+cmToIn(v)+') '+(l[i]||'')}).filter(Boolean).join(' x ').trim()};
const estWeight=(k,cm)=>{const w=CATS[k]?.w||{b:25,p:.15};return w.b+(cm||0)*w.p};
const genSKU=(m,s)=>{const x=v=>(v||'').replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,5);return x(m||'PROD')+'-'+x(String(s||'OS'))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>{const s=String(v??'');return/[,"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const emptyRow=()=>Object.fromEntries(CSV_H.map(h=>[h,'']));
const aj=v=>Array.isArray(v)?v.join('; '):(v||'');

async function callClaude(system,userContent){
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:4000,system,messages:[{role:'user',content:userContent}]})});
  if(!r.ok)throw new Error('Claude API '+r.status+': '+(await r.text()).substring(0,300));
  const d=await r.json();return d.content?.map(b=>b.text||'').join('')||'';
}
function parseJSON(raw){const c=raw.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();const m=c.match(/\{[\s\S]*\}/);return JSON.parse(m?m[0]:c)}

// ═══ PARSE CATALOG ═══
app.post('/api/parse-catalog', upload.single('file'), async(req,res)=>{
  try{
    if(!req.file)return res.status(400).json({error:'No file'});
    if(!CLAUDE_KEY)return res.status(500).json({error:'CLAUDE_API_KEY not configured'});
    const fileB64=req.file.buffer.toString('base64');
    const mt=req.file.mimetype||'application/octet-stream';
    const cKeys=Object.keys(CATS);
    const parseR=await callClaude('You parse supplier furniture catalogs. Return ONLY a valid JSON array.',
      [{type:'document',source:{type:'base64',media_type:mt,data:fileB64}},{type:'text',text:'Parse this supplier catalog. Extract EVERY product.\nFor each:\n{"supplierName":"...","modelNumber":"...","material":"...","dimensions":"LxWxH cm like 200x40x45","costUSD":205,"weightKg":32,"categoryKey":"one of: '+cKeys.join(', ')+'","colors":["walnut"],"style":["modern"],"furnitureMaterial":["wood"]}\nRules: categoryKey MUST match list. costUSD=number. Each line item = separate product. Return JSON array [{},{},...]. No markdown.'}]
    );
    let products;
    const cleaned=parseR.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    const arrM=cleaned.match(/\[[\s\S]*\]/);
    products=JSON.parse(arrM?arrM[0]:cleaned);
    res.json({products,fileName:req.file.originalname});
  }catch(e){console.error('Parse:',e);res.status(500).json({error:e.message})}
});

// ═══ GENERATE COPY (single product) ═══
app.post('/api/generate-copy', async(req,res)=>{
  try{
    const{product,images,brand,fxRate,markup}=req.body;
    if(!CLAUDE_KEY)return res.status(500).json({error:'CLAUDE_API_KEY not configured'});
    const fx=fxRate||1.44,mk=markup||3,p=product;
    const ck=Object.keys(CATS).includes(p.categoryKey)?p.categoryKey:'tv-cabinet';
    const ci=CATS[ck];const dimsF=fmtDims(p.dimensions);
    const content=[];
    if(images?.length)images.forEach(img=>content.push({type:'image',source:{type:'base64',media_type:'image/png',data:img}}));
    content.push({type:'text',text:'Create marketing copy for Altera Home Design.\nProduct: '+(p.supplierName||'Furniture')+'\nMaterial: '+(p.material||'Premium')+'\nModel: '+(p.modelNumber||'N/A')+'\nCategory: '+ci.col+'\nDimensions: '+(dimsF||p.dimensions||'N/A')+'\n\nReturn JSON:\n{"creativeNames":["obscure city NOT Paris/London/NYC/Milan/Tokyo","feminine name","abstract concept"],"htmlDescription":"SEO HTML (see rules)","seoTitle":"THE_PRODUCT_NAME | Altera Home Design (under 60 chars)","seoDescription":"under 155 chars with THE_PRODUCT_NAME","tags":["5 lowercase seo tags"]}\n\nHTML RULES: Write 2-3 marketing sentences in <p> with THE_PRODUCT_NAME. Then <ul><li> for specs: Material, Dimensions cm(inches), Model, Features. NO <table> tags. Only <p><ul><li><strong>.\nONLY JSON.'});
    const cpR=await callClaude('Luxury furniture copywriter. Return ONLY valid JSON.',content);
    const cp=parseJSON(cpR);
    const typeCap=ci.type.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    const title='The '+cp.creativeNames[0]+' '+typeCap;
    const rep=s=>(s||'').replace(/THE_PRODUCT_NAME/g,title);
    const cU=p.costUSD||300,wK=p.weightKg||estWeight(ck,parseInt(p.dimensions)||100);
    const sU=Math.round(wK*2.5),tL=cU+sU;
    res.json({title,catKey:ck,collection:ci.col,type:ci.type,shopifyCategory:ci.sCat,googleShoppingCat:ci.gsc,creativeNames:cp.creativeNames,htmlDescription:rep(cp.htmlDescription),seoTitle:rep(cp.seoTitle),seoDescription:rep(cp.seoDescription),tags:cp.tags,hasVariants:false,variant:{sizeName:'',dimensions:p.dimensions||'',dimsF,costUSD:cU,shipUSD:sU,landedUSD:tL,costCAD:Math.round(cU*fx),weightKg:Math.round(wK),sellCAD:Math.round((tL*fx*mk)/5)*5,sku:genSKU(p.modelNumber,p.supplierName||'OS')},brand:brand||'Altera Home Design',metafields:{colors:p.colors||[],style:p.style||[],material:p.material||'',furnitureMaterial:p.furnitureMaterial||[]}});
  }catch(e){console.error('Copy:',e);res.status(500).json({error:e.message})}
});

// ═══ EXTRACT (from images) ═══
app.post('/api/extract', async(req,res)=>{
  try{
    const{images,creative,fxRate,markup,brand}=req.body;
    if(!images?.length)return res.status(400).json({error:'No images'});
    if(!CLAUDE_KEY)return res.status(500).json({error:'CLAUDE_API_KEY not configured'});
    const fx=fxRate||1.44,mk=markup||3;
    const ic=images.map(i=>({type:'image',source:{type:'base64',media_type:'image/png',data:i}}));
    const cKeys=Object.keys(CATS);
    const exR=await callClaude('Extract product data. Return ONLY valid JSON.',[...ic,{type:'text',text:'Extract for Altera Home Design.\nDetect category from: '+cKeys.join(', ')+'\nReturn: {"name":"...","modelNumber":"...","material":"...","categoryKey":"...","dimensions":"LxWxH cm","colors":[],"style":[],"furnitureMaterial":[],"costUSD":0,"weightKg":0}\nONLY JSON.'}]);
    const ex=parseJSON(exR);
    const ck=cKeys.includes(ex.categoryKey)?ex.categoryKey:'sofa';
    const ci=CATS[ck];const dimsF=fmtDims(ex.dimensions);
    const cpR=await callClaude('Luxury furniture copywriter. Return ONLY valid JSON.','Create copy for: '+(ex.name||'Furniture')+', Material: '+(ex.material||'Premium')+', Category: '+ci.col+', Dims: '+(dimsF||ex.dimensions||'N/A')+'\nReturn JSON: {"creativeNames":["city","name","concept"],"htmlDescription":"<p> + <ul><li> specs, NO tables, use THE_PRODUCT_NAME","seoTitle":"THE_PRODUCT_NAME | Altera Home Design","seoDescription":"under 155 chars","tags":["5 tags"]}\nONLY JSON.');
    const cp=parseJSON(cpR);
    const typeCap=ci.type.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    const title='The '+cp.creativeNames[0]+' '+typeCap;
    const rep=s=>(s||'').replace(/THE_PRODUCT_NAME/g,title);
    const cU=ex.costUSD||300,wK=ex.weightKg||estWeight(ck,parseInt(ex.dimensions)||100);
    const sU=Math.round(wK*2.5),tL=cU+sU;
    res.json({title,catKey:ck,collection:ci.col,type:ci.type,shopifyCategory:ci.sCat,googleShoppingCat:ci.gsc,creativeNames:cp.creativeNames,htmlDescription:rep(cp.htmlDescription),seoTitle:rep(cp.seoTitle),seoDescription:rep(cp.seoDescription),tags:cp.tags,hasVariants:false,variant:{sizeName:'',dimensions:ex.dimensions||'',dimsF,costUSD:cU,shipUSD:sU,landedUSD:tL,costCAD:Math.round(cU*fx),weightKg:Math.round(wK),sellCAD:Math.round((tL*fx*mk)/5)*5,sku:genSKU(ex.modelNumber,ex.name||'OS')},brand:brand||'Altera Home Design',metafields:{colors:ex.colors||[],style:ex.style||[],material:ex.material||'',furnitureMaterial:ex.furnitureMaterial||[]}});
  }catch(e){console.error('Extract:',e);res.status(500).json({error:e.message})}
});

// ═══ PHOTOSHOOT ═══
app.post('/api/photoshoot-scene', async(req,res)=>{
  try{
    const{images,title,scene,isStudio,dimensions,creative}=req.body;
    if(!GEMINI_KEY)return res.status(500).json({error:'GEMINI_API_KEY not configured'});
    const iParts=images.map(im=>({inlineData:{data:im,mimeType:'image/png'}}));
    const dims=dimensions||'standard';
    const rules=isStudio?'Pure white #FFFFFF bg. No props. High-key lighting. Dims: '+dims:'High-fidelity '+scene+' interior. Morning light. Dims: '+dims+'. Accurate scale.';
    for(let a=0;a<3;a++){
      try{
        const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key='+GEMINI_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[...iParts,{text:'Render '+title+'. SCENE: '+scene+'. '+rules+' PRESERVE geometry. '+(creative||'')}]}],generationConfig:{responseModalities:['IMAGE','TEXT'],aspectRatio:'1:1'}})});
        if(!r.ok){console.error('Gemini '+r.status);if(r.status===403||r.status===401)return res.status(r.status).json({error:'Gemini unauthorized'});if(a<2){await sleep(3000*(a+1));continue}return res.status(502).json({error:'Gemini error'})}
        const d=await r.json();const ip=d.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);
        if(ip?.inlineData)return res.json({image:ip.inlineData.data,mimeType:ip.inlineData.mimeType||'image/png'});
        if(a<2)await sleep(2000);
      }catch(e){if(a<2)await sleep(3000*(a+1))}
    }
    res.status(502).json({error:'Failed after 3 attempts'});
  }catch(e){res.status(500).json({error:e.message})}
});

// ═══ CSV builder ═══
function fillProductRow(r,prod,v,isFirst){
  const mf=prod.metafields||{};
  if(isFirst){
    r['Title']=prod.title;r['Body (HTML)']=prod.htmlDescription;r['Vendor']=prod.brand||'';
    r['Product Category']=prod.shopifyCategory||'';r['Type']=prod.type||'';r['Tags']=(prod.tags||[]).join(', ');
    r['Gift Card']='false';r['SEO Title']=prod.seoTitle||'';r['SEO Description']=prod.seoDescription||'';
    r['Google Shopping / Google Product Category']=prod.googleShoppingCat||'';r['Google Shopping / Condition']='new';
    r['Brand (product.metafields.custom.brand)']=prod.brand||'';
    r['Cost CAD (product.metafields.custom.cost_cad)']="'"+String(v.costCAD||'');
    r['Cost USD (product.metafields.custom.cost_usd)']="'"+String(v.costUSD||'');
    r['Materials (product.metafields.custom.materials)']=mf.material||'';
    r['Shipping (product.metafields.custom.shipping)']='1-2 weeks';
    r['Shipping cost USD (product.metafields.custom.shipping_cost_usd)']="'"+String(v.shipUSD||'');
    r['Color (product.metafields.shopify.color-pattern)']=aj(mf.colors);
    r['Style (product.metafields.shopify.style)']=aj(mf.style);
    r['Material (product.metafields.shopify.material)']=aj(mf.furnitureMaterial);
    r['Furniture/Fixture material (product.metafields.shopify.furniture-fixture-material)']=aj(mf.furnitureMaterial);
    r['Suitable space (product.metafields.shopify.suitable-space)']='indoors';
  }
  r['Published']='false';r['Variant SKU']=v.sku||'';r['Variant Grams']=String((v.weightKg||0)*1000);
  r['Variant Inventory Tracker']='shopify';r['Variant Inventory Policy']='continue';
  r['Variant Fulfillment Service']='manual';r['Variant Price']=(v.sellCAD||0).toFixed(2);
  r['Variant Requires Shipping']='true';r['Variant Taxable']='true';
  r['Variant Weight Unit']='kg';r['Cost per item']=(v.costCAD||0).toFixed(2);r['Status']='draft';
  // Variant dimension metafields
  const dims=parseDims(v.dimensions||prod.dimensions||'');
  if(dims.l){r['Lenght (cm) (variant.metafields.custom.lenght_cm)']=String(Math.round(dims.l));r['Lenght (in) (variant.metafields.custom.lenght_in)']=cmToIn(dims.l)}
  if(dims.w){r['Width (cm) (variant.metafields.custom.width_cm)']=String(Math.round(dims.w));r['Width (in) (variant.metafields.custom.width_in)']=cmToIn(dims.w)}
  if(dims.h){r['Height (cm) (variant.metafields.custom.height_cm)']=String(Math.round(dims.h));r['Height (in) (variant.metafields.custom.height_in)']=cmToIn(dims.h)}
  const wKg=v.weightKg||0;
  if(wKg){r['Weight (kg) (variant.metafields.custom.weight_kg)']=String(Math.round(wKg));r['Weight (lbs) (variant.metafields.custom.weight_lbs)']=String(kgToLbs(wKg))}
}

// ═══ BULK CSV ═══
app.post('/api/export-bulk-csv', async(req,res)=>{
  try{
    const{products}=req.body;const rows=[];
    products.forEach(prod=>{
      const handle=prod.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'');
      const variants=prod.hasVariants&&prod.variants?.length>1?prod.variants:[prod.variant||{}];
      variants.forEach((v,i)=>{const r=emptyRow();r['Handle']=handle;fillProductRow(r,prod,v,i===0);if(prod.hasVariants&&variants.length>1){r['Option1 Name']='Size';r['Option1 Value']=v.sizeName}rows.push(r)});
    });
    const csv=CSV_H.map(esc).join(',')+'\n'+rows.map(r=>CSV_H.map(h=>esc(r[h])).join(',')).join('\n');
    res.set({'Content-Type':'text/csv','Content-Disposition':'attachment; filename="altera_bulk_import.csv"'});
    res.send(csv);
  }catch(e){res.status(500).json({error:e.message})}
});

// ═══ BULK ZIP ═══
app.post('/api/export-bulk-zip', async(req,res)=>{
  try{
    const{products}=req.body;const zip=new JSZip();const rows=[];
    products.forEach(prod=>{
      const handle=prod.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'');
      const variants=prod.hasVariants&&prod.variants?.length>1?prod.variants:[prod.variant||{}];
      const imgs=[];
      (prod.aiImages||[]).forEach(img=>{const fn=handle+'_'+img.scene.replace(/[^a-z0-9]/gi,'_').toLowerCase()+'.png';imgs.push({fn,alt:prod.title+' - '+img.scene});zip.file('images/'+fn,img.b64,{base64:true})});
      (prod.originalImages||[]).forEach((b64,i)=>{const fn=handle+'_original_'+(i+1)+'.png';imgs.push({fn,alt:prod.title});zip.file('images/'+fn,b64,{base64:true})});
      variants.forEach((v,i)=>{const r=emptyRow();r['Handle']=handle;fillProductRow(r,prod,v,i===0);if(prod.hasVariants&&variants.length>1){r['Option1 Name']='Size';r['Option1 Value']=v.sizeName}rows.push(r)});
      imgs.forEach((f,i)=>{const r=emptyRow();r['Handle']=handle;r['Image Src']='images/'+f.fn;r['Image Position']=String(i+1);r['Image Alt Text']=f.alt;rows.push(r)});
    });
    zip.file('shopify_import.csv',CSV_H.map(esc).join(',')+'\n'+rows.map(r=>CSV_H.map(h=>esc(r[h])).join(',')).join('\n'));
    zip.file('README.txt','Import: Products > Import > Upload CSV. Do NOT check overwrite.');
    const buf=await zip.generateAsync({type:'nodebuffer'});
    res.set({'Content-Type':'application/zip','Content-Disposition':'attachment; filename="altera_bulk_package.zip"'});
    res.send(buf);
  }catch(e){res.status(500).json({error:e.message})}
});

app.get('/api/health',(req,res)=>res.json({ok:true,claude:!!CLAUDE_KEY,gemini:!!GEMINI_KEY}));
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('Altera Product Studio on port '+PORT));

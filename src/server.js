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

// Track used product names to avoid repeats
const usedNames = new Set();
const NAME_POOL = 'Thessaloniki,Ravenna,Lucerne,Ghent,Tallinn,Dubrovnik,Córdoba,Salzburg,Bruges,Stavanger,Maribor,Trieste,Lecce,Otranto,Cadiz,Sintra,Coimbra,Rovinj,Split,Kotor,Plovdiv,Tbilisi,Yerevan,Tartu,Visby,Bergen,Tromsø,Aarhus,Malmö,Turku,Gdańsk,Wrocław,Kraków,Cesky Krumlov,Olomouc,Bratislava,Ljubljana,Piran,Colmar,Annecy,Dijon,Nantes,Bordeaux,Biarritz,Avignon,Arles,Montpellier,Girona,Ronda,Granada,Seville,Bilbao,Porto,Braga,Funchal,Valletta,Catania,Palermo,Siracusa,Matera,Perugia,Siena,Lucca,Verona,Padova,Bolzano,Trento,Como,Bergamo,Parma,Modena,Ferrara,Mantova,Cremona,Vicenza,Treviso,Udine,Baku,Batumi,Samarkand,Isfahan,Fez,Marrakech,Chefchaouen,Essaouira,Zanzibar,Lamu,Stellenbosch,Swakopmund,Luang Prabang,Hội An,Kandy,Galle,Jaipur,Udaipur,Pondicherry,Mysore,Kyoto,Kanazawa,Takayama,Kamakura,Naoshima,Otaru,Queenstown,Wanaka,Hobart,Byron,Cartagena,Oaxaca,Mérida,Valparaíso,Antigua,Bariloche,Cusco,Medellín,Charleston,Savannah,Asheville,Sedona,Taos,Carmel,Mendocino,Traverse';
function getAvoidList(){ return Array.from(usedNames).slice(-20).join(', '); }

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
    const cKeys=Object.keys(CATS);
    const fname=req.file.originalname||'catalog';
    const isExcel=/\.(xlsx?|csv)$/i.test(fname);

    if(isExcel){
      const XLSX=require('xlsx');
      const wb=XLSX.read(req.file.buffer,{type:'buffer'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});

      // Extract images and map to rows using drawing XML
      const rowImages = {}; // row number -> [{b64, mime}]
      try {
        const xlsxZip = await JSZip.loadAsync(req.file.buffer);

        // 1. Load all media files into a map: filename -> b64
        const mediaMap = {};
        const mediaFiles = [];
        xlsxZip.forEach((path, entry) => {
          if (path.startsWith('xl/media/') && !entry.dir) mediaFiles.push({path, entry});
        });
        for (const {path, entry} of mediaFiles) {
          const b64 = await entry.async('base64');
          const fn = path.split('/').pop(); // e.g. "image1.png"
          const ext = fn.split('.').pop().toLowerCase();
          const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
          mediaMap[fn] = {b64, mime};
        }
        console.log('Media files loaded:', Object.keys(mediaMap));

        // 2. Parse relationships: rId -> image filename
        const rIdMap = {}; // rId1 -> "image4.png"
        const relsFiles = xlsxZip.file(/xl\/drawings\/_rels\/.*\.rels$/);
        if (relsFiles.length > 0) {
          const relsXml = await relsFiles[0].async('string');
          const relMatches = relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="[^"]*\/([^"\/]+)"/g);
          for (const m of relMatches) {
            rIdMap[m[1]] = m[2]; // rId1 -> image4.png
          }
        }
        console.log('Relationship map:', rIdMap);

        // 3. Parse drawing XML: extract row + rId for each anchor
        const drawingFiles = xlsxZip.file(/xl\/drawings\/drawing\d+\.xml$/);
        if (drawingFiles.length > 0) {
          const xml = await drawingFiles[0].async('string');
          // Split by anchor elements
          const anchors = xml.split(/<xdr:(?:oneCellAnchor|twoCellAnchor)[>\s]/);
          for (const anchor of anchors) {
            // Extract row number
            const rowMatch = anchor.match(/<xdr:row>(\d+)<\/xdr:row>/);
            // Extract rId (r:embed="rId1")
            const rIdMatch = anchor.match(/r:embed="(rId\d+)"/);
            if (rowMatch && rIdMatch) {
              const row = parseInt(rowMatch[1]);
              const rId = rIdMatch[1];
              const imgFilename = rIdMap[rId];
              if (imgFilename && mediaMap[imgFilename]) {
                if (!rowImages[row]) rowImages[row] = [];
                rowImages[row].push(mediaMap[imgFilename]);
                console.log('Mapped row', row, '->', imgFilename, 'via', rId);
              }
            }
          }
        }
      } catch(e) { console.log('Image extraction error:', e.message); }

      console.log('Row-image mapping:', Object.keys(rowImages).map(r => 'row '+r+': '+rowImages[r].length+' imgs'));

      // Also collect all images in order for Claude to see
      const allImages = [];
      Object.entries(rowImages).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).forEach(([row, imgs]) => {
        imgs.forEach(img => allImages.push({...img, row: parseInt(row)}));
      });

      // Build Claude request with images so it can match them to products
      const textLines = rows.slice(0, 50).map((r,i) => 'Row'+i+': '+r.join(' | ')).join('\n');
      const content = [];
      
      // Add images for Claude to see
      if(allImages.length > 0){
        allImages.forEach((img, i) => {
          content.push({type:'image',source:{type:'base64',media_type:img.mime,data:img.b64}});
        });
        content.push({type:'text',text:'Above are '+allImages.length+' product images extracted from a supplier Excel. They are in spreadsheet order.\n\nSpreadsheet data:\n'+textLines+'\n\nExtract EVERY product. IMPORTANT RULES:\n- If two rows are clearly the SAME product in different sizes (e.g. "Four-drawer chest" and "Five-drawer chest"), they should be ONE product with hasVariants:true and a variants array.\n- Match each image to the correct product by looking at what the image shows vs the product name.\n- imageIndices = array of 0-based indices into the images above that belong to this product.\n\nFor each product:\n{"supplierName":"...","modelNumber":"...","material":"...","dimensions":"LxWxH cm like 200x40x45","costUSD":205,"weightKg":32,"categoryKey":"one of: '+cKeys.join(', ')+'","colors":["walnut"],"style":["modern"],"furnitureMaterial":["wood"],"imageIndices":[0],"hasVariants":false,"variants":[]}\n\nIf hasVariants:true, set dimensions/costUSD/weightKg from the first variant and include:\n"variants":[{"sizeName":"Four-drawer","dimensions":"750x420x900","costUSD":205,"weightKg":30},{"sizeName":"Five-drawer","dimensions":"750x420x1090","costUSD":224,"weightKg":35}]\n\ncategoryKey MUST match list. costUSD=number. Return ONLY JSON array.'});
      } else {
        content.push({type:'text',text:'Parse this spreadsheet:\n'+textLines+'\n\nExtract EVERY product. If two rows are the SAME product in different sizes, combine as ONE product with hasVariants:true.\nFor each:\n{"supplierName":"...","modelNumber":"...","material":"...","dimensions":"LxWxH cm","costUSD":0,"weightKg":0,"categoryKey":"one of: '+cKeys.join(', ')+'","colors":[],"style":[],"furnitureMaterial":[],"hasVariants":false,"variants":[]}\ncategoryKey MUST match list. Return ONLY JSON array.'});
      }

      const parseR = await callClaude('You parse supplier furniture catalogs. You can see images and match them to products. Return ONLY a valid JSON array.', content);
      let products;
      const cleaned = parseR.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
      const arrM = cleaned.match(/\[[\s\S]*\]/);
      products = JSON.parse(arrM ? arrM[0] : cleaned);

      // Attach images based on Claude's imageIndices
      products.forEach(p => {
        const indices = p.imageIndices || [];
        if(indices.length > 0 && allImages[indices[0]]){
          p.imageB64 = allImages[indices[0]].b64;
          p.imageMime = allImages[indices[0]].mime;
          if(indices.length > 1){
            p.extraImages = indices.slice(1).filter(i=>allImages[i]).map(i=>({b64:allImages[i].b64, mime:allImages[i].mime}));
          }
        }
        delete p.imageIndices;
      });

      const mapped = products.filter(p => p.imageB64).length;
      console.log('Products:', products.length, 'with images:', mapped);
      return res.json({products, fileName: fname, imageCount: Object.values(rowImages).flat().length, mappedCount: mapped});
    } else {
      // PDF
      const fileB64 = req.file.buffer.toString('base64');
      const parseR = await callClaude('You parse supplier furniture catalogs. Return ONLY a valid JSON array.',
        [{type:'document',source:{type:'base64',media_type:'application/pdf',data:fileB64}},{type:'text',text:'Parse this catalog. Extract EVERY product.\nFor each:\n{"supplierName":"...","modelNumber":"...","material":"...","dimensions":"LxWxH cm","costUSD":0,"weightKg":0,"categoryKey":"one of: '+cKeys.join(', ')+'","colors":[],"style":[],"furnitureMaterial":[]}\ncategoryKey MUST match list. costUSD=number. Return JSON array. No markdown.'}]
      );
      let products;
      const cleaned = parseR.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
      const arrM = cleaned.match(/\[[\s\S]*\]/);
      products = JSON.parse(arrM ? arrM[0] : cleaned);
      return res.json({products, fileName: fname, imageCount: 0});
    }
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
    content.push({type:'text',text:'Create marketing copy for Altera Home Design.\nProduct: '+(p.supplierName||'Furniture')+'\nMaterial: '+(p.material||'Premium')+'\nModel: '+(p.modelNumber||'N/A')+'\nCategory: '+ci.col+'\nDimensions: '+(dimsF||p.dimensions||'N/A')+'\n\nReturn JSON:\n{"creativeNames":["CITY_NAME","FEMININE_NAME","ABSTRACT_CONCEPT"],"htmlDescription":"SEO HTML (see rules)","seoTitle":"THE_PRODUCT_NAME | Altera Home Design (under 60 chars)","seoDescription":"under 155 chars with THE_PRODUCT_NAME","tags":["5 lowercase seo tags"]}\n\nNAMING RULES:\n- CITY_NAME: Pick ONE from this pool that has NOT been used: '+NAME_POOL+'\n- NEVER use: '+getAvoidList()+'\n- FEMININE_NAME: elegant name like Cressida, Ondine, Seraphina, Isolde, Elowen, Calista, Thessaly, Aurelia\n- ABSTRACT_CONCEPT: evocative word like Solace, Meridian, Cadence, Reverie, Provenance\n\nHTML RULES: Write 2-3 marketing sentences in <p> with THE_PRODUCT_NAME. Then <ul><li> for specs: Material, Dimensions cm(inches), Model, Features. NO <table> tags. Only <p><ul><li><strong>.\nONLY JSON.'});
    const cpR=await callClaude('Luxury furniture copywriter. Return ONLY valid JSON.',content);
    const cp=parseJSON(cpR);
    const typeCap=ci.type.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    const title='The '+cp.creativeNames[0]+' '+typeCap;
    usedNames.add(cp.creativeNames[0]);
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
    const cpR=await callClaude('Luxury furniture copywriter. Return ONLY valid JSON.','Create copy for: '+(ex.name||'Furniture')+', Material: '+(ex.material||'Premium')+', Category: '+ci.col+', Dims: '+(dimsF||ex.dimensions||'N/A')+'\nReturn JSON: {"creativeNames":["CITY from: '+NAME_POOL.split(',').slice(0,40).join(',')+' — NEVER use: '+getAvoidList()+'","feminine name","concept"],"htmlDescription":"<p> + <ul><li> specs, NO tables, use THE_PRODUCT_NAME","seoTitle":"THE_PRODUCT_NAME | Altera Home Design","seoDescription":"under 155 chars","tags":["5 tags"]}\nONLY JSON.');
    const cp=parseJSON(cpR);
    const typeCap=ci.type.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    const title='The '+cp.creativeNames[0]+' '+typeCap;
    usedNames.add(cp.creativeNames[0]);
    const rep=s=>(s||'').replace(/THE_PRODUCT_NAME/g,title);
    const cU=ex.costUSD||300,wK=ex.weightKg||estWeight(ck,parseInt(ex.dimensions)||100);
    const sU=Math.round(wK*2.5),tL=cU+sU;
    res.json({title,catKey:ck,collection:ci.col,type:ci.type,shopifyCategory:ci.sCat,googleShoppingCat:ci.gsc,creativeNames:cp.creativeNames,htmlDescription:rep(cp.htmlDescription),seoTitle:rep(cp.seoTitle),seoDescription:rep(cp.seoDescription),tags:cp.tags,hasVariants:false,variant:{sizeName:'',dimensions:ex.dimensions||'',dimsF,costUSD:cU,shipUSD:sU,landedUSD:tL,costCAD:Math.round(cU*fx),weightKg:Math.round(wK),sellCAD:Math.round((tL*fx*mk)/5)*5,sku:genSKU(ex.modelNumber,ex.name||'OS')},brand:brand||'Altera Home Design',metafields:{colors:ex.colors||[],style:ex.style||[],material:ex.material||'',furnitureMaterial:ex.furnitureMaterial||[]}});
  }catch(e){console.error('Extract:',e);res.status(500).json({error:e.message})}
});

// ═══ CATEGORY-AWARE SCENES ═══
const CAT_SCENES = {
  'sofa': [
    {t:'Studio Front',s:1,p:'Front view on pure white background, centered, no props'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background, showing depth and cushion detail'},
    {t:'Modern Living Room',p:'In a spacious modern living room with a coffee table in front, area rug beneath, natural light from large windows, indoor plants'},
    {t:'Scandinavian Living Room',p:'In a bright Scandinavian living room with light oak floors, white walls, wool throw draped on arm, minimalist side table'},
    {t:'Japandi Living Room',p:'In a serene Japandi interior with natural wood accents, paper lanterns, low coffee table, neutral tones'},
    {t:'Coastal Living Room',p:'In an airy coastal living room with ocean view through windows, light linen curtains, driftwood accents, seagrass rug'},
    {t:'Luxury Living Room',p:'In a high-end living room with marble floor, gold accents, oversized abstract art on wall, designer lighting'},
    {t:'Loft Living Space',p:'In an industrial loft with exposed brick walls, concrete floor, large windows, vintage rug, statement lighting'},
    {t:'Close-up Detail',p:'Close-up macro shot of stitching, cushion texture, and armrest detail'},
    {t:'Close-up Fabric',p:'Extreme close-up of upholstery material texture and color'}
  ],
  'bed': [
    {t:'Studio Front',s:1,p:'Front view on pure white background, showing headboard and frame'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background'},
    {t:'Master Bedroom',p:'In a spacious master bedroom with nightstands on each side, table lamps, neutral bedding, soft morning light through curtains'},
    {t:'Scandinavian Bedroom',p:'In a bright Scandinavian bedroom with light wood floors, white bedding, pendant lights on each side, indoor plant on nightstand'},
    {t:'Japandi Bedroom',p:'In a serene Japandi bedroom with tatami elements, shoji screens, low nightstands, warm ambient lighting'},
    {t:'Luxury Bedroom',p:'In an upscale bedroom suite with velvet throw, designer nightstands, chandelier, floor-to-ceiling curtains'},
    {t:'Cozy Bedroom',p:'In a cozy bedroom with textured throw blankets, reading lamps, stacked books on nightstand, warm evening light'},
    {t:'Minimalist Bedroom',p:'In a minimalist bedroom with clean lines, single pendant light, white walls, one art piece above headboard'},
    {t:'Close-up Headboard',p:'Close-up detail of headboard upholstery, texture and craftsmanship'},
    {t:'Close-up Frame',p:'Close-up of bed frame joint, wood grain or metal finish detail'}
  ],
  'tv-cabinet': [
    {t:'Studio Front',s:1,p:'Front view on pure white background, doors closed'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background showing depth'},
    {t:'Modern Living Room',p:'Against the main wall of a modern living room with a large TV mounted above, sofa facing it, ambient LED backlighting'},
    {t:'Scandinavian Living Room',p:'Against a white wall in a Scandinavian living room with a flat screen TV, minimalist decor, light wood floors, cozy sofa visible'},
    {t:'Japandi Living Room',p:'In a Japandi living room against textured wall, TV above, low sofa, warm wood tones throughout'},
    {t:'Entertainment Room',p:'In a dedicated entertainment room with large screen above, sound bar on top, ambient lighting, comfortable seating'},
    {t:'Contemporary Apartment',p:'In a contemporary apartment living area with city view, modern art, designer lighting, sofa and coffee table visible'},
    {t:'Industrial Loft',p:'Against an exposed brick wall in a loft, TV mounted above, leather sofa opposite, vintage industrial lighting'},
    {t:'Close-up Detail',p:'Close-up of door handle, wood grain, and surface finish detail'},
    {t:'Close-up Storage',p:'Doors open showing interior storage compartments and shelf detail'}
  ],
  'nightstand': [
    {t:'Studio Front',s:1,p:'Front view on pure white background'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background'},
    {t:'Next to Bed',p:'Positioned next to a bed in a bedroom, with a table lamp on top, a book, and small plant, warm bedside lighting'},
    {t:'Master Bedroom Pair',p:'One of a matching pair flanking a king bed, with matching lamps, alarm clock, morning light through curtains'},
    {t:'Scandinavian Bedroom',p:'Next to a bed in a Scandinavian bedroom, single pendant light above, white bedding, minimalist styling'},
    {t:'Cozy Bedroom',p:'Next to a bed with reading lamp on top, stack of books, glasses, warm evening ambiance'},
    {t:'Luxury Bedroom',p:'Next to a luxury upholstered bed, designer lamp, fresh flowers in vase, velvet throw visible'},
    {t:'Guest Bedroom',p:'In a welcoming guest bedroom next to a neatly made bed, with a small lamp and water carafe on top'},
    {t:'Close-up Detail',p:'Close-up of drawer pull, wood grain, and surface finish'},
    {t:'Close-up Open',p:'Drawer partially open showing interior and smooth drawer mechanism'}
  ],
  'dining-table': [
    {t:'Studio Front',s:1,p:'Front view on pure white background'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background showing surface'},
    {t:'Dining Room Set',p:'In a dining room with matching chairs around it, table set with plates and glasses, pendant light above, natural light'},
    {t:'Scandinavian Dining',p:'In a bright Scandinavian dining area with pendant lamp, simple place settings, light wood floors, window light'},
    {t:'Japandi Dining',p:'In a Japandi dining space with ceramic tableware, wooden chairs, paper pendant lights, serene atmosphere'},
    {t:'Open Kitchen Dining',p:'In an open-plan kitchen-dining area, kitchen island visible behind, table set for dinner, warm lighting'},
    {t:'Luxury Dining Room',p:'In an elegant dining room with upholstered chairs, chandelier above, fine china place settings, fresh flowers centerpiece'},
    {t:'Dinner Party',p:'Set for a dinner party with candles, wine glasses, linen napkins, warm ambient evening lighting'},
    {t:'Close-up Surface',p:'Close-up macro of table surface showing wood grain, finish quality'},
    {t:'Close-up Edge',p:'Close-up of table edge profile, leg joint, and craftsmanship detail'}
  ],
  'sideboard': [
    {t:'Studio Front',s:1,p:'Front view on pure white background'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background'},
    {t:'Dining Room',p:'Against the wall of a dining room, with dining table visible, decorative objects and a vase with flowers on top, framed art above'},
    {t:'Living Room',p:'In a living room against a feature wall, with curated decor on top — books, ceramic vase, small sculpture, mirror above'},
    {t:'Hallway Entry',p:'In an elegant hallway or entryway, with a mirror above, key tray and decorative bowl on top, warm welcoming light'},
    {t:'Scandinavian Interior',p:'Against a white wall in a Scandinavian interior, minimal styling on top, light wood floors, natural light'},
    {t:'Luxury Interior',p:'In an upscale interior with marble floors, designer objects displayed on top, statement artwork above'},
    {t:'Contemporary Home',p:'In a contemporary home with open floor plan, styled with modern decor, plants, and design books on top'},
    {t:'Close-up Detail',p:'Close-up of handle hardware, door mechanism, and surface finish'},
    {t:'Close-up Open',p:'Doors open showing interior shelving and storage organization'}
  ],
  'wardrobe': [
    {t:'Studio Front',s:1,p:'Front view on pure white background, doors closed'},
    {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background'},
    {t:'Master Bedroom',p:'In a spacious master bedroom against the main wall, bed visible, coordinated with room decor, morning light'},
    {t:'Dressing Room',p:'In a walk-in dressing area with full-length mirror nearby, organized accessories visible'},
    {t:'Scandinavian Bedroom',p:'In a Scandinavian bedroom with light tones, minimal furniture, natural light'},
    {t:'Modern Bedroom',p:'In a modern bedroom with clean lines, matching furniture set, designer lighting'},
    {t:'Doors Open',p:'In a bedroom with doors open showing organized interior — shelves, hanging rail, drawers'},
    {t:'Luxury Bedroom',p:'In a luxury bedroom suite with coordinating furniture, plush carpet, soft ambient lighting'},
    {t:'Close-up Detail',p:'Close-up of door handle, hinge, and surface finish quality'},
    {t:'Close-up Interior',p:'Close-up of interior organization — shelf edge, drawer detail, rail'}
  ]
};
// Default scenes for categories not explicitly defined
const DEFAULT_SCENES = [
  {t:'Studio Front',s:1,p:'Front view on pure white background, centered, no props'},
  {t:'Studio Angle',s:1,p:'Three-quarter angle on pure white background showing depth'},
  {t:'Modern Interior',p:'In a tastefully decorated modern interior appropriate for this type of furniture, natural light'},
  {t:'Scandinavian Interior',p:'In a bright Scandinavian interior with light wood floors, white walls, minimalist decor'},
  {t:'Japandi Interior',p:'In a serene Japandi interior with natural wood accents, neutral tones, paper lanterns'},
  {t:'Coastal Interior',p:'In an airy coastal interior with light colors, natural textures, ocean-inspired palette'},
  {t:'Luxury Interior',p:'In an upscale luxury interior with premium finishes, designer accents, soft lighting'},
  {t:'Contemporary Space',p:'In a contemporary open-plan space with modern art, designer furniture, city views'},
  {t:'Close-up Detail',p:'Close-up macro shot of material texture, joints, and craftsmanship'},
  {t:'Close-up Texture',p:'Extreme close-up of primary material surface texture and color'}
];
// Map category aliases
const sceneFor = ck => {
  if(CAT_SCENES[ck]) return CAT_SCENES[ck];
  if(ck.includes('chair')||ck==='bar-stool') return CAT_SCENES['dining-table']; // chairs go in dining rooms
  if(ck.includes('lamp')||ck.includes('light')) return DEFAULT_SCENES;
  if(ck==='coffee-table'||ck==='side-table') return CAT_SCENES['sofa']; // coffee tables go with sofas
  if(ck==='shoe-cabinet') return CAT_SCENES['sideboard'];
  if(ck==='office-desk') return DEFAULT_SCENES;
  if(ck==='mattress') return CAT_SCENES['bed'];
  if(ck==='buffet') return CAT_SCENES['sideboard'];
  if(ck.includes('set')) return CAT_SCENES['dining-table'];
  if(ck==='rug') return CAT_SCENES['sofa'];
  return DEFAULT_SCENES;
};

app.get('/api/scenes/:catKey', (req,res) => {
  res.json({scenes: sceneFor(req.params.catKey)});
});

// ═══ PHOTOSHOOT ═══
app.post('/api/photoshoot-scene', async(req,res)=>{
  try{
    const{images,title,scene,scenePrompt,isStudio,dimensions,creative,catKey}=req.body;
    if(!GEMINI_KEY)return res.status(500).json({error:'GEMINI_API_KEY not configured'});
    const iParts=images.map(im=>{
      // Detect MIME from base64 header
      let mime='image/png';
      if(im.startsWith('/9j/')||im.startsWith('/9j'))mime='image/jpeg';
      else if(im.startsWith('R0lGOD'))mime='image/gif';
      else if(im.startsWith('iVBOR'))mime='image/png';
      return {inlineData:{data:im,mimeType:mime}};
    });
    const dims=dimensions||'standard';
    const catLabel = CATS[catKey]?.type || 'furniture piece';

    let prompt;
    const designerThinking = 'STYLING AND COMPOSITION INTELLIGENCE: Act as a world class interior stylist. SCALE AND PROPORTION: You MUST use the provided dimensions to render the product at an accurate scale. Compare it to standard environmental objects like coffee tables, rugs, or ceiling heights to ensure it looks realistic. EXCLUSIVE LIGHTING PROFILE: Use only bright, high-key, vibrant, and airy lighting. Focus on soft morning sun, ethereal daylight, and fresh atmospheres. AVOID DARKNESS: Strictly zero moody, dark, or low-key lighting. No heavy shadows or dimly lit environments. VISUAL FOCUS: The product must be the hero. Use architectural contrast to define its silhouette against a bright, professional background.';
    const noText = 'CRITICAL: Do NOT add any text, labels, watermarks, dimensions, product names, or overlays to the image. The image must contain ZERO text of any kind.';

    if(isStudio){
      prompt = 'High fidelity 1:1 render of '+title+'. SCENE: '+scene+'. BACKGROUND: PERFECT PURE WHITE #FFFFFF. Strictly zero environmental props. Pure isolated product on 100 percent white background. High-key lighting. SLIGHT GROUNDING SHADING: Include subtle, realistic shadows where the product touches the floor for a high-end catalog look. SCALE: Product dimensions are '+dims+'. STRICT PRESERVATION: 100 percent identical furniture geometry and materials. '+designerThinking+' '+noText;
    } else {
      prompt = 'High fidelity 1:1 render of '+title+'. SCENE: '+scene+'. '+scenePrompt+' ENVIRONMENT: High-fidelity interior for this aesthetic. VIBE: Always vibrant and airy. Use bright morning light. SCALE: Product dimensions are '+dims+'. Ensure it is sized correctly relative to the room and props. STRICT PRESERVATION: 100 percent identical furniture geometry and materials. Ensure a bright, professional look with perfectly accurate scale. '+designerThinking+' '+noText;
    }

    for(let a=0;a<3;a++){
      try{
        const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key='+GEMINI_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[...iParts,{text:prompt+' '+(creative||'')}]}],generationConfig:{responseModalities:['IMAGE','TEXT']}})});
        if(!r.ok){console.error('Gemini '+r.status);if(r.status===403||r.status===401)return res.status(r.status).json({error:'Gemini unauthorized'});if(a<2){await sleep(3000*(a+1));continue}return res.status(502).json({error:'Gemini error'})}
        const d=await r.json();
        console.log('Gemini response parts:', d.candidates?.[0]?.content?.parts?.map(p=>({type:p.text?'text':'image',hasData:!!p.inlineData})));
        const ip=d.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);
        if(ip?.inlineData){
          console.log('Gemini image OK, size:', ip.inlineData.data?.length);
          return res.json({image:ip.inlineData.data,mimeType:ip.inlineData.mimeType||'image/png'});
        }
        // Check if there's a text-only response (Gemini refused to generate image)
        const textPart=d.candidates?.[0]?.content?.parts?.find(p=>p.text);
        if(textPart)console.log('Gemini text only:',textPart.text?.substring(0,200));
        if(!d.candidates?.length)console.log('Gemini no candidates:', JSON.stringify(d).substring(0,300));
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
      // Save images organized by product folder
      const folder=handle;
      (prod.aiImages||[]).forEach((img,i)=>{const fn=img.scene.replace(/[^a-z0-9]/gi,'_').toLowerCase()+'.png';zip.file(folder+'/'+fn,img.b64,{base64:true})});
      (prod.originalImages||[]).forEach((b64,i)=>{zip.file(folder+'/original_'+(i+1)+'.png',b64,{base64:true})});
      // CSV rows - no image references
      variants.forEach((v,i)=>{const r=emptyRow();r['Handle']=handle;fillProductRow(r,prod,v,i===0);if(prod.hasVariants&&variants.length>1){r['Option1 Name']='Size';r['Option1 Value']=v.sizeName}rows.push(r)});
    });
    zip.file('shopify_import.csv',CSV_H.map(esc).join(',')+'\n'+rows.map(r=>CSV_H.map(h=>esc(r[h])).join(',')).join('\n'));
    zip.file('README.txt','HOW TO IMPORT:\n1. Go to Shopify Admin > Products > Import\n2. Upload shopify_import.csv\n3. Do NOT check "Overwrite existing products"\n4. After import, open each product and upload its images from the matching folder\n\nImage folders are named by product handle (URL slug).');
    const buf=await zip.generateAsync({type:'nodebuffer'});
    res.set({'Content-Type':'application/zip','Content-Disposition':'attachment; filename="altera_bulk_package.zip"'});
    res.send(buf);
  }catch(e){res.status(500).json({error:e.message})}
});

app.get('/api/health',(req,res)=>res.json({ok:true,claude:!!CLAUDE_KEY,gemini:!!GEMINI_KEY}));

// Debug: test Gemini with a simple prompt
app.get('/api/debug-gemini', async(req,res)=>{
  try{
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key='+GEMINI_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Generate a simple photo of a brown wooden chair on a white background. Square 1:1 image.'}]}],generationConfig:{responseModalities:['IMAGE','TEXT']}})});
    const d=await r.json();
    const parts=(d.candidates?.[0]?.content?.parts||[]).map(p=>({type:p.text?'text':'image',textPreview:p.text?.substring(0,100),hasImage:!!p.inlineData,imageSize:p.inlineData?.data?.length}));
    res.json({status:r.status,parts,raw:!d.candidates?JSON.stringify(d).substring(0,500):undefined});
  }catch(e){res.json({error:e.message})}
});
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('Altera Product Studio on port '+PORT));

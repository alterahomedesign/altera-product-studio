const express = require('express');
const multer = require('multer');
const JSZip = require('jszip');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const CLAUDE_KEY = process.env.CLAUDE_API_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// ─── Categories ──────────────────────────────────────────────────────────────
const CATS = {
  "sofa":{col:"Sofas",sCat:"Furniture > Sofas > Sectional Sofas",type:"sofa",w:{b:45,p:.35}},
  "bed":{col:"Beds",sCat:"Furniture > Beds & Accessories > Beds & Bed Frames > Platform Beds & Bed Frames",type:"bed",w:{b:55,p:.3}},
  "mattress":{col:"Mattresses",sCat:"Furniture > Beds & Accessories > Mattresses > Innerspring Mattresses",type:"mattress",w:{b:30,p:.2}},
  "dining-table":{col:"Dining Tables",sCat:"Furniture > Tables > Kitchen & Dining Room Tables",type:"dining table",w:{b:40,p:.25}},
  "dining-set":{col:"Dining Table Sets",sCat:"Furniture > Furniture Sets > Kitchen & Dining Furniture Sets",type:"dining set",w:{b:60,p:.3}},
  "dining-chair":{col:"Dining Chairs",sCat:"Furniture > Chairs > Kitchen & Dining Room Chairs",type:"dining chair",w:{b:8,p:.04}},
  "coffee-table":{col:"Coffee Tables & Side Tables",sCat:"Furniture > Tables > Accent Tables > Coffee Tables",type:"Coffee Table",w:{b:25,p:.18}},
  "side-table":{col:"Coffee Tables & Side Tables",sCat:"Furniture > Tables > Accent Tables > End Tables",type:"side table",w:{b:12,p:.1}},
  "nightstand":{col:"Nightstands",sCat:"Furniture > Tables > Nightstands",type:"nightstand",w:{b:10,p:.05}},
  "tv-cabinet":{col:"TV Cabinets",sCat:"Furniture > Entertainment Centers & TV Stands",type:"tv cabinet",w:{b:30,p:.2}},
  "sideboard":{col:"Sideboards",sCat:"Furniture > Cabinets & Storage > Sideboards",type:"sideboard",w:{b:35,p:.22}},
  "wardrobe":{col:"Wardrobes",sCat:"Furniture > Cabinets & Storage > Armoires & Wardrobes > Hinged Door Wardrobes",type:"wardrobe",w:{b:50,p:.35}},
  "office-desk":{col:"Office Desks",sCat:"Furniture > Office Furniture > Desks",type:"office desk",w:{b:30,p:.2}},
  "living-room-chair":{col:"Living Room Chairs",sCat:"Furniture > Chairs > Armchairs, Recliners & Sleeper Chairs > Armchairs",type:"living room chair",w:{b:18,p:.08}},
  "bar-stool":{col:"Dining Chairs",sCat:"Furniture > Chairs > Table & Bar Stools > Bar Stools",type:"bar stool",w:{b:10,p:.04}},
  "bedroom-bench":{col:"Bedroom Benches",sCat:"Furniture > Benches > Kitchen & Dining Benches > Dining Benches",type:"bedroom bench",w:{b:15,p:.1}},
  "bedroom-set":{col:"Bedroom Sets",sCat:"Furniture > Furniture Sets > Bedroom Furniture Sets",type:"bedroom sets",w:{b:80,p:.4}},
  "shoe-cabinet":{col:"Shoe Cabinets",sCat:"Home & Garden > Household Supplies > Storage & Organization > Clothing & Closet Storage > Shoe Racks & Organizers > Shoe Organizers",type:"shoe cabinet",w:{b:20,p:.15}},
  "rug":{col:"Rugs",sCat:"Home & Garden > Decor > Rugs",type:"rug",w:{b:8,p:.05}},
  "floor-lamp":{col:"Lighting",sCat:"Home & Garden > Lighting > Lamps > Floor Lamps",type:"lighting",w:{b:8,p:.02}},
  "table-lamp":{col:"Lighting",sCat:"Home & Garden > Lighting > Lamps > Table Lamps",type:"lighting",w:{b:4,p:.01}},
  "ceiling-light":{col:"Lighting",sCat:"Home & Garden > Lighting > Lighting Fixtures > Ceiling Light Fixtures",type:"lighting",w:{b:5,p:.02}},
  "pendant-light":{col:"Lighting",sCat:"Home & Garden > Lighting > Lighting Fixtures > Chandeliers",type:"lighting",w:{b:6,p:.02}},
  "wall-light":{col:"Lighting",sCat:"Home & Garden > Lighting > Lighting Fixtures > Wall Light Fixtures",type:"lighting",w:{b:3,p:.01}},
  "buffet":{col:"Sideboards",sCat:"Furniture > Cabinets & Storage > Buffets",type:"sideboard",w:{b:40,p:.25}}
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const cmToIn = cm => {
  const t = cm * 0.393701, w = Math.floor(t), r = t - w, e = Math.round(r * 8);
  if (!e) return w + '"'; if (e === 8) return (w + 1) + '"';
  let n = e, d = 8; if (n % 4 === 0) { n /= 4; d = 2 } else if (n % 2 === 0) { n /= 2; d = 4 }
  return w + ' ' + n + '/' + d + '"';
};

const fmtDims = s => {
  if (!s) return '';
  const lbl = ['length', 'width', 'height'];
  return s.replace(/cm/gi, '').split(/[x*×]/i).map((p, i) => {
    const v = parseFloat(p.trim()); if (isNaN(v)) return '';
    return Math.round(v) + 'cm (' + cmToIn(v) + ') ' + (lbl[i] || '');
  }).filter(Boolean).join(' x ').trim();
};

const estWeight = (k, cm) => { const w = CATS[k]?.w || { b: 25, p: .15 }; return w.b + (cm || 0) * w.p };
const genSKU = (m, s) => { const x = v => (v || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5); return x(m || 'PROD') + '-' + x(String(s || 'OS')) };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callClaude(system, userContent) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system, messages: [{ role: 'user', content: userContent }] })
  });
  if (!r.ok) throw new Error('Claude API ' + r.status + ': ' + (await r.text()).substring(0, 300));
  const d = await r.json();
  return d.content?.map(b => b.text || '').join('') || '';
}

function parseJSON(raw) {
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : cleaned);
}

// ═══ API: Extract product data + generate copy ═════════════════════════════
app.post('/api/extract', async (req, res) => {
  try {
    const { images, creative, fxRate, markup, brand } = req.body;
    if (!images?.length) return res.status(400).json({ error: 'No images' });
    if (!CLAUDE_KEY) return res.status(500).json({ error: 'CLAUDE_API_KEY not configured on server' });

    const fx = fxRate || 1.44;
    const mk = markup || 3;
    const ic = images.map(i => ({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: i } }));
    const cKeys = Object.keys(CATS);

    // 1. Extract product data
    const exR = await callClaude(
      'You extract product data from furniture images. Return ONLY valid JSON, no markdown fences.',
      [...ic, { type: 'text', text: 'Examine these images for Altera Home Design.\n\nDETECT category from: ' + cKeys.map(k => '"' + k + '" (' + CATS[k].col + ')').join(', ') + '\n\nReturn JSON:\n{"name":"...","modelNumber":"...","material":"...","categoryKey":"' + cKeys.join('|') + '","dimensions":"LxWxH cm","variants":[{"sizeName":"130cm","dimensions":"130x85x80","costUSD":150,"estimatedWeightKg":35}]}\n\ncategoryKey MUST match list exactly. Extract ALL variants with USD costs. If none visible, estimate 4-6.' }]
    );
    const ex = parseJSON(exR);
    const ck = cKeys.includes(ex.categoryKey) ? ex.categoryKey : 'sofa';
    const ci = CATS[ck];

    // 2. Generate copy
    const dimsF = fmtDims(ex.dimensions);
    const cpPrompt = [
      'Create marketing copy for this furniture product.',
      'Product: ' + ex.name + ', Material: ' + (ex.material || 'Premium'),
      'Model: ' + (ex.modelNumber || 'N/A') + ', Category: ' + ci.col,
      'Dimensions: ' + (dimsF || ex.dimensions || 'N/A'),
      '', 'Return JSON with keys:',
      '- "creativeNames": [obscure city NOT Paris/London/NYC, feminine name, abstract concept]',
      '- "htmlDescription": HTML with marketing paragraph + specs table. Use THE_PRODUCT_NAME as placeholder. Dimensions in cm (inches) format.',
      '- "seoTitle": under 60 chars with THE_PRODUCT_NAME | Altera Home Design',
      '- "seoDescription": under 155 chars with THE_PRODUCT_NAME',
      '- "tags": 5 SEO tags', '', 'ONLY valid JSON. No markdown.'
    ].join('\n');
    const cpR = await callClaude('Luxury furniture copywriter. Return ONLY valid JSON.', cpPrompt);
    const cp = parseJSON(cpR);
    if (!cp.creativeNames) throw new Error('Missing creativeNames');

    // 3. Build title & replace placeholder
    const typeCap = ci.type.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const chosenTitle = 'The ' + cp.creativeNames[0] + ' ' + typeCap;
    const rep = s => (s || '').replace(/THE_PRODUCT_NAME/g, chosenTitle);

    // 4. Calculate variants
    const variants = (ex.variants || []).map((v, i) => {
      const sz = parseInt(v.sizeName) || parseInt(v.dimensions) || 200;
      const cU = v.costUSD || 300, wK = v.estimatedWeightKg || estWeight(ck, sz);
      const sU = Math.round(wK * 2.5), tL = cU + sU, dims = v.dimensions || sz + 'x85x80';
      return {
        id: 'v' + i, sizeName: v.sizeName || sz + 'cm', dimensions: dims,
        dimsF: fmtDims(dims), costUSD: cU, shipUSD: sU, landedUSD: tL,
        costCAD: Math.round(cU * fx), weightKg: Math.round(wK),
        sellCAD: Math.round((tL * fx * mk) / 5) * 5,
        sku: genSKU(ex.modelNumber, v.sizeName || sz)
      };
    });

    res.json({
      title: chosenTitle, catKey: ck, collection: ci.col, type: ci.type,
      shopifyCategory: ci.sCat, creativeNames: cp.creativeNames,
      htmlDescription: rep(cp.htmlDescription), seoTitle: rep(cp.seoTitle),
      seoDescription: rep(cp.seoDescription), tags: cp.tags,
      variants, extracted: ex, brand: brand || 'Altera Home Design'
    });
  } catch (e) {
    console.error('Extract error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══ API: Generate single photoshoot scene ═════════════════════════════════
app.post('/api/photoshoot-scene', async (req, res) => {
  try {
    const { images, title, scene, isStudio, dimensions, creative } = req.body;
    if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    const iParts = images.map(im => ({ inlineData: { data: im, mimeType: 'image/png' } }));
    const dims = dimensions || 'standard';
    const rules = isStudio
      ? 'Pure white #FFFFFF background. No props. High-key lighting. Subtle shadows. Dims: ' + dims
      : 'High-fidelity ' + scene + ' interior. Vibrant morning light. Dims: ' + dims + '. Accurate scale.';

    for (let att = 0; att < 3; att++) {
      try {
        const r = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_KEY,
          {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [...iParts, { text: 'High fidelity render of ' + title + '. SCENE: ' + scene + '. ' + rules + ' PRESERVE: identical geometry. ' + (creative || '') }] }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
            })
          }
        );
        if (!r.ok) {
          const errText = await r.text();
          console.error('Gemini ' + r.status + ':', errText.substring(0, 200));
          if (r.status === 403 || r.status === 401) return res.status(r.status).json({ error: 'Gemini API key unauthorized' });
          if (att < 2) { await sleep(3000 * (att + 1)); continue; }
          return res.status(502).json({ error: 'Gemini API error after retries' });
        }
        const d = await r.json();
        const ip = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (ip?.inlineData) {
          return res.json({ image: ip.inlineData.data, mimeType: ip.inlineData.mimeType || 'image/png' });
        }
        if (att < 2) await sleep(2000);
      } catch (e) {
        console.error('Gemini fetch:', e.message);
        if (att < 2) await sleep(3000 * (att + 1));
      }
    }
    res.status(502).json({ error: 'Failed to generate image after 3 attempts' });
  } catch (e) {
    console.error('Photoshoot error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══ API: Export ZIP ═══════════════════════════════════════════════════════
app.post('/api/export-zip', async (req, res) => {
  try {
    const { title, variants, formData, aiImages, originalImages } = req.body;
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const zip = new JSZip();
    const fnames = [];

    // AI images
    (aiImages || []).forEach((img, i) => {
      const fn = handle + '_' + img.scene.replace(/[^a-z0-9]/gi, '_') + '.png';
      fnames.push({ fn, alt: title + ' - ' + img.scene });
      zip.file('images/' + fn, img.b64, { base64: true });
    });

    // Originals
    (originalImages || []).forEach((b64, i) => {
      const fn = handle + '_original_' + (i + 1) + '.png';
      fnames.push({ fn, alt: title + ' - Original ' + (i + 1) });
      zip.file('images/' + fn, b64, { base64: true });
    });

    // CSV
    const H = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable', 'Image Src', 'Image Position', 'Image Alt Text', 'SEO Title', 'SEO Description', 'Cost CAD (product.metafields.custom.cost_cad)', 'Cost USD (product.metafields.custom.cost_usd)', 'Brand (product.metafields.custom.brand)', 'Dimensions (product.metafields.custom.dimensions)', 'Status'];
    const esc = v => { const s = String(v ?? ''); return /[,"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s };

    const csvRows = [];
    variants.forEach((v, i) => {
      const r = new Array(H.length).fill('');
      r[0] = handle;
      if (!i) { r[1] = title; r[2] = formData.desc; r[3] = formData.brand; r[4] = formData.shopCat; r[5] = formData.type; r[6] = formData.tags; r[20] = formData.seoT; r[21] = formData.seoD; r[24] = formData.brand; }
      r[7] = 'false'; r[8] = 'Size'; r[9] = v.sizeName; r[10] = v.sku; r[11] = String((v.weightKg || 0) * 1000);
      r[12] = 'continue'; r[13] = 'manual'; r[14] = (v.sellCAD || 0).toFixed(2); r[15] = 'true'; r[16] = 'true';
      r[22] = String(v.costCAD || ''); r[23] = String(v.costUSD || ''); r[25] = v.dimsF || ''; r[26] = 'draft';
      csvRows.push(r.map(esc).join(','));
    });

    fnames.forEach((f, i) => {
      const r = new Array(H.length).fill('');
      r[0] = handle; r[17] = 'images/' + f.fn; r[18] = String(i + 1); r[19] = f.alt;
      csvRows.push(r.map(esc).join(','));
    });

    zip.file('shopify_import.csv', H.join(',') + '\n' + csvRows.join('\n'));
    zip.file('README.txt', 'ALTERA PRODUCT STUDIO EXPORT\nProduct: ' + title + '\nVariants: ' + variants.length + '\nImages: ' + fnames.length + '\n\n1. Upload images/ to Shopify Admin > Content > Files\n2. Replace image paths in CSV with Shopify CDN URLs\n3. Import CSV via Products > Import\n4. Product created as DRAFT');

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="' + handle + '_package.zip"' });
    res.send(buf);
  } catch (e) {
    console.error('ZIP error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══ Health check ══════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ ok: true, claude: !!CLAUDE_KEY, gemini: !!GEMINI_KEY });
});

// ═══ Start ═════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Altera Product Studio running on port ' + PORT));

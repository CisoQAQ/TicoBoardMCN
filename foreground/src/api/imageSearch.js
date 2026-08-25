const _charStr = '0123456789abcdefghijklmnopqrstuvwxyz';
const _charMap = {};
for (let i = 0; i < _charStr.length; i++) _charMap[_charStr[i]] = i;

function decode64(str) {
  if (!str) return '';
  const len = str.length;
  let out = '';
  let i = 0;
  while (i < len) {
    const c1 = _charMap[str.charAt(i++)];
    if (c1 === undefined) continue;
    if (i >= len) {
      out += String.fromCharCode((c1 & 63) << 2);
      break;
    }
    const c2 = _charMap[str.charAt(i++)];
    if (c2 === undefined) {
      out += String.fromCharCode((c1 & 63) << 2);
      i--;
      continue;
    }
    out += String.fromCharCode(((c1 & 63) << 2) | ((c2 & 48) >> 4));
    if (i >= len) break;
    const c3 = _charMap[str.charAt(i++)];
    if (c3 === undefined) {
      i--;
      continue;
    }
    out += String.fromCharCode(((c2 & 15) << 4) | ((c3 & 60) >> 2));
    if (i >= len) break;
    const c4 = _charMap[str.charAt(i++)];
    if (c4 === undefined) {
      i--;
      continue;
    }
    out += String.fromCharCode(((c3 & 3) << 6) | (c4 & 63));
  }
  return out;
}

function unescapeHex(str) {
  return str.replace(/\\x(\w{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

const NEW_CODE_TABLE = {
  w: 'a',
  k: 'b',
  v: 'c',
  1: 'd',
  j: 'e',
  u: 'f',
  2: 'g',
  i: 'h',
  t: 'i',
  3: 'j',
  h: 'k',
  s: 'l',
  4: 'm',
  g: 'n',
  5: 'o',
  r: 'p',
  q: 'q',
  6: 'r',
  f: 's',
  p: 't',
  7: 'u',
  e: 'v',
  o: 'w',
  8: 'x',
  d: 'y',
  n: 'z',
  9: '0',
  c: '1',
  m: '2',
  0: '3',
  b: '4',
  l: '5',
  a: '6',
  z: '7',
};

function decodeNewFormat(objUrl) {
  try {
    if (!objUrl) return '';
    let url = String(objUrl);
    const idx = url.indexOf('src=');
    if (idx > -1) url = url.substring(idx + 4);
    url = url.replace(/^ippr[a-z]?_z2C\$/i, '');
    url = url.replace(/_z&e3B/gi, '.').replace(/AzdH3F/gi, '/');
    const chars = url.split('');
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (NEW_CODE_TABLE[c] !== undefined) {
        chars[i] = NEW_CODE_TABLE[c];
      }
    }
    url = chars.join('');
    const m = url.match(/([\w\-]+\.)+(bdstatic\.com|bdimg\.com|baidu\.com|baijiahao\.baidu\.com)[^\s'"<>]*/i);
    if (m) return 'https://' + m[0];
    const m2 = url.match(/\/\/([\w\-\.\/\?=&%_~:#@+]+)/);
    if (m2) return 'https://' + m2[1];
    const m3 = url.match(/https?:\/\//i);
    if (m3) return url.replace(/^[^\w]*https?:\/\//i, 'https://');
    return url;
  } catch (e) {
    return '';
  }
}

function decodeBaiduObjUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return 'https:' + url;
  const res = decodeNewFormat(url);
  if (res && /^https?:\/\//i.test(res)) return res;
  if (res && res.startsWith('//')) return 'https:' + res;
  const encrypted = url.match(/^ippr[a-z]?_z2C/i);
  if (!encrypted) return url;
  try {
    const m = url.match(/^ippr[a-z]?_z2C\$(\d+)\$([a-zA-Z0-9_\-]+?)(?:\?|$)/i);
    if (m) {
      const [, flag, enc] = m;
      let dec = decode64(enc);
      if (dec) {
        if (flag === '1') {
          dec = dec.replace(/[_-]/g, s => (s === '_' ? '/' : '-'));
          return 'http://' + dec;
        } else if (flag === '2') {
          const tmp = dec.replace(/[_-]/g, s => (s === '_' ? '&' : '='));
          let u = '';
          for (let i = 0; i < tmp.length; i++) {
            u += String.fromCharCode(tmp.charCodeAt(i) ^ 5);
          }
          u = unescapeHex(u);
          return 'https://' + u;
        } else {
          return 'http://' + dec.replace(/[_-]/g, s => (s === '_' ? '/' : '-'));
        }
      }
    }
    const res2 = decodeNewFormat(url);
    if (res2) return res2;
  } catch (e) {}
  return url;
}

function normalizeUrl(u) {
  if (!u || typeof u !== 'string') return '';
  let str = u.trim().replace(/^`|`$/g, '');
  if (str.startsWith('//')) return 'https:' + str;
  return str;
}

function proxyBaiduImageUrl(u) {
  if (!u) return '';
  const raw = String(u);
  const clean = raw.startsWith('//') ? 'https:' + raw : raw;
  if (!/^https?:\/\//i.test(clean)) return clean;
  return clean;
}

function pickBestUrl(item) {
  const replaceUrls = Array.isArray(item.replaceUrl) ? item.replaceUrl : [];
  const replaceUrlStrs = replaceUrls.map(r => r.ObjURL || r.objURL || r.FromURL || '').filter(Boolean);
  const candidates = [
    item.bigPicUrl,
    item.middleURL,
    item.hoverURL,
    ...replaceUrlStrs,
    item.thumbURL,
    item.smallPicUrl,
    item.bdImgNewsUrl,
    item.shareUrl,
  ]
    .map(x => normalizeUrl(x))
    .filter(Boolean);
  const direct = candidates.find(u => /^https?:\/\//i.test(u) && !/ippr[a-z]?_z2C/i.test(u));
  if (direct) return direct;
  for (const c of candidates) {
    const d = normalizeUrl(decodeBaiduObjUrl(c));
    if (/^https?:\/\//i.test(d) && !/ippr[a-z]?_z2C/i.test(d)) return d;
  }
  const obj = normalizeUrl(decodeBaiduObjUrl(item.objURL || item.di));
  if (/^https?:\/\//i.test(obj) && !/ippr[a-z]?_z2C/i.test(obj)) return obj;
  return direct || candidates[0] || obj || '';
}

let jsonpCounter = 0;
const JSONP_TIMEOUT = 15000;

function jsonpRequest(baseUrl, paramsObj) {
  return new Promise((resolve, reject) => {
    jsonpCounter++;
    const cbName = '__baidu_img_cb_' + Date.now().toString(36) + '_' + jsonpCounter;
    const params = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    params.append('callback', cbName);
    params.append('_', Date.now());
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + params.toString();
    let timer = null;
    const cleanup = () => {
      try {
        delete window[cbName];
      } catch (e) {
        try {
          window[cbName] = undefined;
        } catch (_) {}
      }
      if (script && script.parentNode) script.parentNode.removeChild(script);
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    window[cbName] = function (data) {
      cleanup();
      resolve(data);
    };
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.charset = 'utf-8';
    script.onerror = function (e) {
      cleanup();
      reject(new Error('JSONP加载失败: ' + (e?.message || 'network error')));
    };
    script.src = url;
    timer = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP请求超时(' + JSONP_TIMEOUT + 'ms)'));
    }, JSONP_TIMEOUT);
    (document.head || document.getElementsByTagName('head')[0] || document.documentElement).appendChild(script);
  });
}

export { decodeBaiduObjUrl, normalizeUrl };

function safeExtractField(chunk, fieldName) {
  const pattern = new RegExp(`"${fieldName}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*?"|[0-9]+|null)`, 'i');
  const m = chunk.match(pattern);
  if (!m) return '';
  const raw = m[1];
  if (raw === 'null') return '';
  if (/^-?[0-9]+$/.test(raw)) return raw;
  let s = raw.slice(1, -1);
  s = s.replace(/^`|`$/g, '');
  return s;
}

function extractItemsByRegex(text) {
  const items = [];
  const anchorPattern = /"thumbURL"/g;
  let match;
  while ((match = anchorPattern.exec(text)) !== null) {
    const start = Math.max(0, match.index - 500);
    const end = Math.min(text.length, match.index + 5000);
    const chunk = text.substring(start, end);

    const thumbURL = safeExtractField(chunk, 'thumbURL');
    const middleURL = safeExtractField(chunk, 'middleURL');
    const hoverURL = safeExtractField(chunk, 'hoverURL');
    const smallPicUrl = safeExtractField(chunk, 'smallPicUrl');
    const bigPicUrl = safeExtractField(chunk, 'bigPicUrl');
    const objURL = safeExtractField(chunk, 'objURL');
    const di = safeExtractField(chunk, 'di');
    const fromPageTitleEnc = safeExtractField(chunk, 'fromPageTitleEnc');
    const fromPageTitle = safeExtractField(chunk, 'fromPageTitle');
    const title = safeExtractField(chunk, 'title');

    const w = Number(safeExtractField(chunk, 'width')) || Number(safeExtractField(chunk, 'curWidth')) || 0;
    const h = Number(safeExtractField(chunk, 'height')) || Number(safeExtractField(chunk, 'curHeight')) || 0;

    const replaceArr = [];
    const ruPattern = /ObjURL["\s:]+(`[^`]*`|"[^"]*")/gi;
    let ru;
    while ((ru = ruPattern.exec(chunk)) !== null) {
      const u = (ru[1] || '').replace(/^"|"$/g, '').replace(/^`|`$/g, '');
      if (u) replaceArr.push(u);
    }
    const fuPattern = /FromURL["\s:]+(`[^`]*`|"[^"]*")/gi;
    while ((ru = fuPattern.exec(chunk)) !== null) {
      const u = (ru[1] || '').replace(/^"|"$/g, '').replace(/^`|`$/g, '');
      if (u) replaceArr.push(u);
    }

    const thumbCandidates = [middleURL, thumbURL, hoverURL, ...replaceArr, smallPicUrl].map(x => normalizeUrl(x)).filter(Boolean);
    let thumbUrl = thumbCandidates.find(u => /^https?:\/\//i.test(u) && !/ippr[a-z]?_z2C/i.test(u));
    if (!thumbUrl) {
      for (const c of thumbCandidates) {
        const d = normalizeUrl(decodeBaiduObjUrl(c));
        if (/^https?:\/\//i.test(d) && !/ippr[a-z]?_z2C/i.test(d)) {
          thumbUrl = d;
          break;
        }
      }
    }
    if (!thumbUrl) thumbUrl = thumbCandidates[0] || '';
    thumbUrl = normalizeUrl(thumbUrl);

    const fullCandidates = [bigPicUrl, middleURL, hoverURL, ...replaceArr, thumbURL, smallPicUrl].map(x => normalizeUrl(x)).filter(Boolean);
    let fullUrl = fullCandidates.find(u => /^https?:\/\//i.test(u) && !/ippr[a-z]?_z2C/i.test(u));
    if (!fullUrl) {
      for (const c of [...fullCandidates, objURL, di]) {
        const d = normalizeUrl(decodeBaiduObjUrl(c));
        if (/^https?:\/\//i.test(d) && !/ippr[a-z]?_z2C/i.test(d)) {
          fullUrl = d;
          break;
        }
      }
    }
    if (!fullUrl) fullUrl = fullCandidates[0] || thumbUrl || '';
    fullUrl = normalizeUrl(fullUrl);
    if (!fullUrl) fullUrl = thumbUrl;

    if (!thumbUrl) continue;

    items.push({
      thumbUrl,
      fullUrl,
      width: w || 400,
      height: h || 500,
      title: fromPageTitleEnc || fromPageTitle || title || '',
      _fromRegex: true,
    });
  }
  return items;
}

function processItems(rawItems, pn) {
  const results = [];
  rawItems.forEach((item, idx) => {
    if (!item) return;

    let thumbUrl = '';
    let fullUrl = '';
    let w = 400;
    let h = 500;
    let title = '';

    if (item._fromRegex) {
      thumbUrl = item.thumbUrl;
      fullUrl = item.fullUrl || item.thumbUrl;
      w = item.width || 400;
      h = item.height || Math.round(Number(w) * (0.75 + ((idx * 37) % 75) / 100));
      title = item.title || '';
    } else {
      const replaceUrls = Array.isArray(item.replaceUrl) ? item.replaceUrl : [];
      const replaceUrlStrs = replaceUrls.map(r => r.ObjURL || r.objURL || r.FromURL || '').filter(Boolean);
      const thumbCandidates = [item.middleURL, item.thumbURL, item.hoverURL, ...replaceUrlStrs, item.smallPicUrl]
        .map(x => normalizeUrl(x))
        .filter(Boolean);
      thumbUrl = thumbCandidates.find(u => /^https?:\/\//i.test(u) && !/ippr[a-z]?_z2C/i.test(u));
      if (!thumbUrl) {
        for (const c of thumbCandidates) {
          const d = normalizeUrl(decodeBaiduObjUrl(c));
          if (/^https?:\/\//i.test(d) && !/ippr[a-z]?_z2C/i.test(d)) {
            thumbUrl = d;
            break;
          }
        }
      }
      if (!thumbUrl) thumbUrl = thumbCandidates[0] || '';
      thumbUrl = normalizeUrl(thumbUrl);
      fullUrl = pickBestUrl(item);
      if (!thumbUrl) return;
      if (!fullUrl) fullUrl = thumbUrl;
      w = item.width || item.curWidth || 400;
      h = item.height || item.curHeight || Math.round(Number(w) * (0.75 + ((idx * 37) % 75) / 100));
      title = item.fromPageTitleEnc || item.fromPageTitle || item.title || '';
    }

    results.push({
      id: `baidu-${pn}-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      seed: pn + idx,
      width: Number(w) || 400,
      height: Number(h) || 500,
      displayHeight: 0,
      thumbUrl: proxyBaiduImageUrl(thumbUrl),
      fullUrl: proxyBaiduImageUrl(fullUrl),
      loaded: false,
      title: title || '',
    });
  });
  return results.filter(i => i.thumbUrl);
}

export const searchBaiduImages = async ({ word, pn = 0, rn = 18 }) => {
  try {
    const baseUrl = '/baidu-img/search/acjson';
    const params = new URLSearchParams();
    const rawParams = {
      tn: 'resultjson_com',
      word,
      pn,
      rn,
      ipn: 'rj',
      ct: 201326592,
      ic: 0,
      lm: -1,
      ie: 'utf-8',
      oe: 'utf-8',
      st: -1,
      fm: 'detail',
      hd: 1,
      latest: 0,
      copyright: 0,
      fr: 'ala',
      width: 0,
      height: 0,
      filterType: '',
      imageType: '',
      is: '',
      lpn: 0,
      catename: '',
      v: '',
      face: 0,
      color: '',
      z: '',
      zhi: '',
      zhuanjititle: '',
      titlepic: '',
      q: '',
      tab: 0,
      sel: 0,
      sortType: 0,
      sign: 0,
      need: 0,
      pcs: 1,
      from: '',
      c: 0,
      tbWidth: '',
      tbHeight: '',
      se: 0,
      small: 0,
      sm: 0,
      x: 0,
      y: 0,
      step_word: '',
      pageVersion: '',
      srcType: '',
      srcPage: '',
    };
    Object.entries(rawParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    params.append('_', Date.now());

    const resp = await fetch(baseUrl + '?' + params.toString(), {
      method: 'GET',
      credentials: 'omit',
    });
    if (!resp.ok) throw new Error('baidu http ' + resp.status);
    const text = await resp.text();

    let rawItems = [];

    try {
      const data = JSON.parse(text);
      if (data && Array.isArray(data.data)) {
        rawItems = data.data.filter(Boolean);
      } else if (data && data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0) {
        if (data.data.thumbURL || data.data.middleURL || data.data.hoverURL) {
          rawItems = [data.data];
        }
      }
    } catch (_) {}

    if (rawItems.length === 0) {
      rawItems = extractItemsByRegex(text);
    }

    if (rawItems.length === 0 && pn === 0) {
      const hasDataMarker = /"displayNum"\s*:\s*[1-9]|"listNum"\s*:\s*[1-9]|"queryEnc"\s*:\s*"/.test(text);
      if (hasDataMarker) {
        return searchBaiduImages({ word, pn: rn, rn });
      }
    }

    return processItems(rawItems, pn);
  } catch (error) {
    console.warn('百度图片搜索失败:', error?.message || error);
    if (pn === 0) {
      throw error;
    }
    return [];
  }
};

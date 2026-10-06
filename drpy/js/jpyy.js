// ============================================================
// JPYY TVBox 爬虫规则
// 适配站点：https://0996zp.com
// 基于 jpyy 信息汇总整理
// ============================================================

var rule = {
    title: 'JPYY',
    host: 'https://0996zp.com',
    homeUrl: '/',
    searchable: 2,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },

    // 分类
    class_parse: function () {
        return [
            { type_id: '1', type_name: '电影' },
            { type_id: '2', type_name: '电视剧' },
            { type_id: '3', type_name: '综艺' },
            { type_id: '4', type_name: '动漫' },
            { type_id: '88', type_name: '短剧' }
        ];
    },

    // 一级：分类列表
    一级: function (tid, pg, filter, ext) {
        var url = rule.host + '/vod/show/id/' + tid + '/page/' + pg;
        var res = request(url, {
            headers: Object.assign({}, rule.headers, { 'RSC': '1' })
        });
        var arr = parseRSC(res.content);
        var out = {
            list: [],
            page: parseInt(pg) || 1,
            pagecount: 1,
            limit: 48,
            total: 0
        };

        if (arr && arr[3] && arr[3].videoList && arr[3].videoList.data) {
            var d = arr[3].videoList.data;
            (d.list || []).forEach(function (it) {
                out.list.push(formatVideo(it));
            });
            out.page = d.pageNum || out.page;
            out.pagecount = d.totalPage || 1;
            out.limit = d.pageSize || 48;
            out.total = d.totalCount || 0;
        }
        return out;
    },

    // 搜索
    搜索: function (wd, quick, pg) {
        var url = rule.host + '/vod/search/' + encodeURIComponent(wd);
        var res = request(url, {
            headers: Object.assign({}, rule.headers, { 'RSC': '1' })
        });
        var arr = parseRSC(res.content);
        var out = {
            list: [],
            page: 1,
            pagecount: 1,
            limit: 48,
            total: 0
        };

        if (arr && arr[0] && arr[0].data && arr[0].data.result) {
            var d = arr[0].data.result;
            (d.list || []).forEach(function (it) {
                out.list.push(formatVideo(it));
            });
            out.page = d.pageNum || 1;
            out.pagecount = d.totalPage || 1;
            out.limit = d.pageSize || 48;
            out.total = d.totalCount || 0;
        }
        return out;
    },

    // 二级：详情
    二级: function (ids) {
        var vodId = String(ids).split('|')[0].split('$')[0];
        var url = rule.host + '/detail/' + vodId;
        var res = request(url, {
            headers: Object.assign({}, rule.headers, { 'RSC': '1' })
        });
        var arr = parseRSC(res.content);
        var d = (arr && arr[3] && arr[3].data && arr[3].data.data) || null;

        var vod = {
            vod_id: vodId,
            vod_name: '',
            vod_pic: '',
            vod_year: '',
            vod_area: '',
            vod_remarks: '',
            vod_actor: '',
            vod_director: '',
            vod_content: '',
            vod_play_from: 'JPYY',
            vod_play_url: ''
        };
        if (!d) return vod;

        vod.vod_name = d.vodName || '';
        vod.vod_pic = d.vodPic || '';
        vod.vod_year = d.vodYear || '';
        vod.vod_area = d.vodArea || '';
        vod.vod_remarks = d.vodRemarks || '';
        vod.vod_actor = d.vodActor || '';
        vod.vod_director = d.vodDirector || '';
        vod.vod_content = String(d.vodContent || '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        var eps = d.episodeList || [];
        var playList = [];
        eps.forEach(function (ep) {
            playList.push((ep.name || '播放') + '$' + vodId + '|' + ep.nid);
        });
        vod.vod_play_url = playList.join('#');

        return vod;
    },

    // 播放
    播放: function (flag, id, flags) {
        var parts = String(id).split('|');
        var vodId = parts[0];
        var nid = parts[1];
        if (!vodId || !nid) {
            return { parse: 0, url: '', jx: 0 };
        }

        var t = Date.now();
        var params = { clientType: 1, id: vodId, nid: nid };
        var sign = genSign('GET', params, t);

        var url = rule.host + '/api/mw-movie/anonymous/v2/video/episode/url'
            + '?clientType=1&id=' + vodId + '&nid=' + nid;

        var res = request(url, {
            headers: Object.assign({}, rule.headers, {
                'sign': sign,
                't': String(t),
                'deviceId': DEVICE_ID,
                'client-type': '1'
            })
        });

        var playUrl = '';
        try {
            var data = JSON.parse(res.content);
            var list = (data && data.data && data.data.list) || [];
            var best = null;
            list.forEach(function (item) {
                if (!best || (item.resolution || 0) > (best.resolution || 0)) {
                    best = item;
                }
            });
            if (best) playUrl = best.url || '';
        } catch (e) {
            // 忽略解析错误
        }

        return {
            parse: 0,
            jx: 0,
            url: playUrl,
            header: JSON.stringify({ 'User-Agent': rule.headers['User-Agent'] })
        };
    }
};

// ============================================================
// 常量
// ============================================================
var SIGN_KEY = 'cb808529bae6b6be45ecfab29a4889bc';
var DEVICE_ID = '02aed2eb-cf20-4227-8431-e94910809e64';

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成签名
 */
function genSign(method, params, t) {
    var g = '';
    method = (method || 'GET').toUpperCase();
    if (method === 'GET') {
        var keys = Object.keys(params).sort();
        g = keys.length ? keys.map(function (k) {
            return k + '=' + params[k];
        }).join('&') : '';
    } else {
        g = Object.keys(params).length ? JSON.stringify(params) : '';
    }
    var h = g ? (g + '&key=' + SIGN_KEY + '&t=' + t) : ('key=' + SIGN_KEY + '&t=' + t);
    return sha1(md5(h));
}

/**
 * 格式化视频卡片
 */
function formatVideo(item) {
    var remarks = item.vodRemarks || '';
    if (!remarks && item.vodSerial) {
        remarks = '更新至' + item.vodSerial + '集';
    }
    if (!remarks && item.vodIsend === 1) {
        remarks = '已完结';
    }
    return {
        vod_id: String(item.vodId),
        vod_name: item.vodName || '',
        vod_pic: item.vodPic || '',
        vod_remarks: remarks,
        vod_year: item.vodYear || '',
        vod_area: item.vodArea || '',
        vod_actor: item.vodActor || '',
        vod_director: item.vodDirector || '',
        vod_content: item.vodBlurb || '',
        type_name: item.vodClass || ''
    };
}

/**
 * 解析 Next.js RSC 流式响应
 */
function parseRSC(text) {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    text = String(text).trim();
    if (text.charAt(0) === '[' || text.charAt(0) === '{') {
        try { return JSON.parse(text); } catch (e) {}
    }

    var re = /(^|[\r\n])([0-9a-f]+):/g;
    var m, last = null;
    while ((m = re.exec(text)) !== null) { last = m; }

    if (last) {
        var start = last.index + last[0].length;
        var r = extractBalanced(text, start);
        if (r) return r;
    }

    for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (c === '[' || c === '{') {
            var r2 = extractBalanced(text, i);
            if (r2) return r2;
        }
    }
    return null;
}

/**
 * 从 start 开始提取平衡的 JSON
 */
function extractBalanced(text, start) {
    while (start < text.length && /\s/.test(text.charAt(start))) start++;
    var open = text.charAt(start);
    if (open !== '[' && open !== '{') return null;
    var close = open === '[' ? ']' : '}';
    var depth = 0, inStr = false, esc = false;
    for (var i = start; i < text.length; i++) {
        var c = text.charAt(i);
        if (inStr) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inStr = false;
        } else {
            if (c === '"') inStr = true;
            else if (c === open) depth++;
            else if (c === close) {
                depth--;
                if (depth === 0) {
                    try {
                        return JSON.parse(text.substring(start, i + 1));
                    } catch (e) {
                        return null;
                    }
                }
            }
        }
    }
    return null;
}

// ============================================================
// MD5 / SHA1 纯 JS 实现
// ============================================================

function utf8Encode(str) {
    var out = '', i, c;
    for (i = 0; i < str.length; i++) {
        c = str.charCodeAt(i);
        if (c < 0x80) out += String.fromCharCode(c);
        else if (c < 0x800) {
            out += String.fromCharCode(0xC0 | (c >> 6));
            out += String.fromCharCode(0x80 | (c & 0x3F));
        } else if (c < 0xD800 || c >= 0xE000) {
            out += String.fromCharCode(0xE0 | (c >> 12));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | (c & 0x3F));
        } else {
            i++;
            c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
            out += String.fromCharCode(0xF0 | (c >> 18));
            out += String.fromCharCode(0x80 | ((c >> 12) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | (c & 0x3F));
        }
    }
    return out;
}

function md5(input) {
    var str = utf8Encode(input);

    function safeAdd(x, y) {
        var lsw = (x & 0xffff) + (y & 0xffff);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
    }
    function rol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
    function cmn(q, a, b, x, s, t) { return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }

    function binlMD5(x, len) {
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;
        var i, olda, oldb, oldc, oldd,
            a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (i = 0; i < x.length; i += 16) {
            olda = a; oldb = b; oldc = c; oldd = d;
            a = ff(a, b, c, d, x[i], 7, -680876936);
            d = ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = ff(c, d, a, b, x[i + 10], 17, -42063);
            b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = gg(b, c, d, a, x[i], 20, -373897302);
            a = gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = hh(a, b, c, d, x[i + 5], 4, -378558);
            d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = hh(d, a, b, c, x[i], 11, -358537222);
            c = hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i], 6, -198630844);
            d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = safeAdd(a, olda);
            b = safeAdd(b, oldb);
            c = safeAdd(c, oldc);
            d = safeAdd(d, oldd);
        }
        return [a, b, c, d];
    }

    function rstr2binl(input) {
        var i, output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) output[i] = 0;
        var length8 = input.length * 8;
        for (i = 0; i < length8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
        }
        return output;
    }
    function binl2rstr(input) {
        var i, output = '';
        var length32 = input.length * 32;
        for (i = 0; i < length32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
        }
        return output;
    }
    function rstr2hex(input) {
        var hexTab = '0123456789abcdef', output = '', x, i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
        }
        return output;
    }

    return rstr2hex(binl2rstr(binlMD5(rstr2binl(str), str.length * 8)));
}

function sha1(msg) {
    function rol(n, s) { return (n << s) | (n >>> (32 - s)); }
    function cvt_hex(val) {
        var str = '', i, v;
        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    }

    msg = utf8Encode(msg);

    var blockstart, i, j;
    var W = new Array(80);
    var H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE,
        H3 = 0x10325476, H4 = 0xC3D2E1F0;
    var A, B, C, D, E, temp;

    var msg_len = msg.length;
    var word_array = [];
    for (i = 0; i < msg_len - 3; i += 4) {
        j = (msg.charCodeAt(i) << 24) | (msg.charCodeAt(i + 1) << 16)
            | (msg.charCodeAt(i + 2) << 8) | msg.charCodeAt(i + 3);
        word_array.push(j);
    }
    switch (msg_len % 4) {
        case 0: i = 0x080000000; break;
        case 1: i = (msg.charCodeAt(msg_len - 1) << 24) | 0x0800000; break;
        case 2: i = (msg.charCodeAt(msg_len - 2) << 24) | (msg.charCodeAt(msg_len - 1) << 16) | 0x08000; break;
        case 3: i = (msg.charCodeAt(msg_len - 3) << 24) | (msg.charCodeAt(msg_len - 2) << 16)
            | (msg.charCodeAt(msg_len - 1) << 8) | 0x80; break;
    }
    word_array.push(i);
    while ((word_array.length % 16) !== 14) word_array.push(0);
    word_array.push(msg_len >>> 29);
    word_array.push((msg_len << 3) & 0x0ffffffff);

    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
        for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
        for (i = 16; i <= 79; i++) W[i] = rol(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        A = H0; B = H1; C = H2; D = H3; E = H4;

        for (i = 0; i <= 19; i++) {
            temp = (rol(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D; D = C; C = rol(B, 30); B = A; A = temp;
        }
        for (i = 20; i <= 39; i++) {
            temp = (rol(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D; D = C; C = rol(B, 30); B = A; A = temp;
        }
        for (i = 40; i <= 59; i++) {
            temp = (rol(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D; D = C; C = rol(B, 30); B = A; A = temp;
        }
        for (i = 60; i <= 79; i++) {
            temp = (rol(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D; D = C; C = rol(B, 30); B = A; A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }

    return (cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4)).toLowerCase();
}

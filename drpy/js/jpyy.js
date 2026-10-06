var rule = {
    title: '金牌影视',
    host: 'https://m.ghw9zwp5.com',
    homeUrl: '/',
    url: '/api/mw-movie/anonymous/video/list?pageNum=fypage&pageSize=30&sort=1&sortBy=1&type1=fyclass',
	searchUrl:'/api/mw-movie/anonymous/video/searchByWordPageable?keyword=**&pageNum=fypage&pageSize=24&type=false',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    },
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    class_name: '电影&电视剧&综艺&动漫',
    class_url: '1&2&3&4',
    limit: 6,
    double: false,
    play_parse: true,

    lazy: `js:
        let host = 'https://m.ghw9zwp5.com';
        let apiKey = 'cb808529bae6b6be45ecfab29a4889bc';
        let deviceId = '63ffad23-a598-4f96-85d7-7bf5f3e4a0a2';

        let pid = '';
        let nid = '';

        if (input.indexOf(':') > -1) {
            let p = input.split(':');
            pid = p[0];
            nid = p[1];
        } else {
			let arr=input.split('/').filter(Boolean);
			pid=arr[arr.length-3];
			nid=arr[arr.length-1];
        }

        let t = new Date().getTime();
        eval(getCryptoJS);

        let signkey = 'clientType=1&id=' + pid + '&nid=' + nid + '&key=' + apiKey + '&t=' + t;
        let sign = CryptoJS.SHA1(CryptoJS.MD5(signkey).toString()).toString();

        let api = host + '/api/mw-movie/anonymous/v2/video/episode/url?clientType=1&id=' + pid + '&nid=' + nid;

        let json = JSON.parse(request(api, {
			timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'deviceid': deviceId,
                'sign': sign,
                't': t.toString()
            }
        }));

        let list = (json.data && json.data.list) || [];
        let link = '';

        if (list.length > 0) {
            let item = list.find(function(x) {
                return /\.(m3u8|mp4)/i.test(x.url);
            }) || list[0];
            link = item.url;
        }

		if(link && /\.(m3u8|mp4)/i.test(link)){
			input={
				jx:0,
				parse:0,
				url:link
			};
		}else{
			input={
				jx:0,
				parse:1,
				url:link||''
			};
		}
    `,

    '一级': `js:
        let host = 'https://m.ghw9zwp5.com';
        let apiKey = 'cb808529bae6b6be45ecfab29a4889bc';
        let deviceId = '63ffad23-a598-4f96-85d7-7bf5f3e4a0a2';

        let pg = MY_PAGE || 1;
        let cate = MY_CATE || 1;
        let pageSize = 30;

        let t = new Date().getTime();
        eval(getCryptoJS);

        let signkey = 'pageNum=' + pg + '&pageSize=' + pageSize + '&sort=1&sortBy=1&type1=' + cate + '&key=' + apiKey + '&t=' + t;
        let sign = CryptoJS.SHA1(CryptoJS.MD5(signkey).toString()).toString();

        let api = host + '/api/mw-movie/anonymous/video/list?pageNum=' + pg + '&pageSize=' + pageSize + '&sort=1&sortBy=1&type1=' + cate;

        let json = JSON.parse(request(api, {
			timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'deviceid': deviceId,
                'sign': sign,
                't': t.toString()
            }
        }));

        let list = (json.data && json.data.list) || [];
        let d = [];

        list.forEach(function(it) {
            d.push({
                title: it.vodName,
                desc: it.vodRemarks || '',
                img: it.vodPic,
                url: host + '/detail/' + it.vodId
            });
        });

        setResult(d);
    `,

    '二级': `js:
        let host = 'https://m.ghw9zwp5.com';
        let apiKey = 'cb808529bae6b6be45ecfab29a4889bc';
        let deviceId = '63ffad23-a598-4f96-85d7-7bf5f3e4a0a2';

        let kid = input.split('/').pop().split('?')[0].replace(/[^0-9]/g, '');

        let t = new Date().getTime();
        eval(getCryptoJS);

        let signkey = 'id=' + kid + '&key=' + apiKey + '&t=' + t;
        let sign = CryptoJS.SHA1(CryptoJS.MD5(signkey).toString()).toString();

        let api = host + '/api/mw-movie/anonymous/video/detail?id=' + kid;

        let json = JSON.parse(request(api, {
			timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'deviceid': deviceId,
                'sign': sign,
                't': t.toString()
            }
        }));

        let kjson = json.data || {};
        let eps = Array.isArray(kjson.episodeList) ? kjson.episodeList : [];

        let kurls = eps.map(function(it) {
            let name = it.name || it.nid;
            return name + '$' + host + '/vod/play/' + kid + '/sid/' + it.nid;
        }).join('#');

        VOD = {
            vod_id: kid,
            vod_name: kjson.vodName || '',
            vod_pic: kjson.vodPic || '',
            type_name: kjson.vodClass || '',
            vod_remarks: kjson.vodRemarks || '',
            vod_year: kjson.vodYear || '',
            vod_area: kjson.vodArea || '',
            vod_lang: kjson.vodLang || '',
            vod_director: kjson.vodDirector || '',
            vod_actor: kjson.vodActor || '',
            vod_content: kjson.vodContent || '',
            vod_play_from: '金牌线路',
            vod_play_url: kurls
        };
    `,

    '搜索': `js:
        let host = 'https://m.ghw9zwp5.com';
        let apiKey = 'cb808529bae6b6be45ecfab29a4889bc';
        let deviceId = '63ffad23-a598-4f96-85d7-7bf5f3e4a0a2';

        let keyword = KEY || '';
        let pg = MY_PAGE || 1;
        let pageSize = 24;

        let t = new Date().getTime();
        eval(getCryptoJS);

        let signkey = 'keyword=' + keyword + '&pageNum=' + pg + '&pageSize=' + pageSize + '&type=false&key=' + apiKey + '&t=' + t;
        let sign = CryptoJS.SHA1(CryptoJS.MD5(signkey).toString()).toString();

        let api = host + '/api/mw-movie/anonymous/video/searchByWordPageable?keyword=' + encodeURIComponent(keyword) + '&pageNum=' + pg + '&pageSize=' + pageSize + '&type=false';

        let json = JSON.parse(request(api, {
			timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': host + '/',
                'deviceid': deviceId,
                'sign': sign,
                't': t.toString()
            }
        }));

        let list = (json.data && json.data.list) || (json.data && json.data.result && json.data.result.list) || [];
        let d = [];

        list.forEach(function(it) {
            d.push({
                title: it.vodName,
                desc: it.vodRemarks || it.vodVersion || '',
                img: it.vodPic,
                url: host + '/detail/' + it.vodId
            });
        });

        setResult(d);
    `
};

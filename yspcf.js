// ==========================================
// 重新解碼與重構後的 IPTV 代理 Cloudflare Worker
// ==========================================

export default {
  async fetch(request, env, ctx) {
    const urlObj = new URL(request.url);
    const origin = urlObj.origin;
    const pathname = urlObj.pathname;

    // 處理跨域 (CORS) 請求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // ===== 頻道列表配置區 =====
    // 您可以在這裡隨意新增、刪除或修改頻道。
    // 格式為: ['前端顯示的名稱', '上游節點ID']
    const channelList = [
      // --- 央視頻道 ---
      ['CCTV-1 綜合', 'cctv1'],
      ['CCTV-2 財經', 'cctv2'],
      ['CCTV-3 綜藝', 'cctv3'],
      ['CCTV-4 中文国际', 'cctv4'],
      ['CCTV-5 体育', 'cctv5'],
      ['CCTV-5+ 体育赛事', 'cctv5p'],
      ['CCTV-6 电影', 'cctv6'],
      ['CCTV-7 国防军事', 'cctv7'],
      ['CCTV-8 电视剧', 'cctv8'],
      ['CCTV-9 纪录', 'cctv9'],
      ['CCTV-10 科教', 'cctv10'],
      ['CCTV-11 戏曲', 'cctv11'],
      ['CCTV-12 社会与法', 'cctv12'],
      ['CCTV-13 新闻', 'cctv13'],
      ['CCTV-14 少儿', 'cctv14'],
      ['CCTV-15 音乐', 'cctv15'],
      ['CCTV-16 奥林匹克', 'cctv16'],
      ['CCTV-17 农业农村', 'cctv17'],

      // --- 江蘇台系列 ---
      ['江苏卫视', 'js_jsws'],
      ['江苏卫视(4K)', 'js_jsws4k'],
      ['江苏新闻', 'js_jsxw'],
      ['江苏综艺', 'js_jszy'],
      ['江苏影视', 'js_jsys'],
      ['江苏体育休闲', 'js_jsxx'],
      ['江苏教育', 'js_jsjy'],
      ['动漫卡通', 'js_ymkt'],
      ['优漫卡通', 'js_ymkt'],
      ['江苏国际', 'js_guoji'],

      // --- 上海台系列 ---
      ['东方卫视', 'sh_dongfang'],
      ['新闻综合', 'sh_xinwen'],
      ['第一财经', 'sh_diyicaijing'],
      ['五星体育', 'sh_wuxingtiyu'],
      ['新纪实', 'sh_xinjishi'],
      ['哈哈炫动', 'sh_hahaxuandong'],

      // --- 浙江台系列 ---
      ['浙江卫视', 'zj_zhejiangweishi'],
      ['教科影视', 'zj_jiaokeyingshi'],
      ['民生休闲', 'zj_minshengxiuxian'],
      ['新闻', 'zj_xinwen'],
      ['少儿频道', 'zj_shaoerpindao'],
      ['浙江国际', 'zj_guoji'],
      ['之江纪录', 'zj_zhijiangjilu'],
      ['钱江都市', 'zj_qianjiangdushi'],

      // --- 山東台系列 ---
      ['山东卫视', 'sd_sdtv'],
      ['齐鲁频道', 'sd_qlpd'],
      ['体育频道', 'sd_typd'],
      ['生活频道', 'sd_shpd'],
      ['综艺频道', 'sd_zypd'],
      ['农科频道', 'sd_nkpd'],
      ['影视频道', 'sd_yspd'],
      ['少儿频道', 'sd_sepd'],

      // --- 河北台系列 ---
      ['河北卫视', 'hb_hebeiweishi'],
      ['经济生活', 'hb_jingjishenghuo'],
      ['三农频道', 'hb_sannongpindao'],
      ['文旅体育', 'hb_wenlvtiyu'],
      ['少儿科教', 'hb_shaoerkejiao'],
      ['河北都市', 'hb_hebeidushi'],

      // --- 廣東台系列 ---
      ['广东卫视', 'gd_guangdongweishi'],
      ['广东珠江', 'gd_guangdongzhujiang'],
      ['广东新闻', 'gd_guangdongxinwen'],
      ['广东民生', 'gd_guangdongminsheng'],
      ['广东体育', 'gd_guangdongtiyu'],
      ['广东影视', 'gd_guangdongyingshi'],
      ['广东台经典剧', 'gd_jingdianju'],
      ['大湾区卫视', 'gd_dawanquweishi'],
      ['4K超高清', 'gd_4kchaogaoqing'],
      ['广东少儿', 'gd_guangdongshaoer'],
      ['嘉佳卡通', 'gd_jiajiakatong'],
      ['大湾区卫视（海外版）', 'gd_dawanquweishi_haiwai'],
      ['嶺南戲曲', 'gd_lingnanxiqu'],
      ['GRTN生活频道', 'gd_grtnshenghuo'],
      ['广东移动', 'gd_guangdongyidong'],
      ['纪录片', 'gd_jilupian'],
      ['健康', 'gd_jiankang'],

      // --- 湖南台系列 ---
      ['湖南卫视', 'mg_hnws'],
      ['金鹰卡通', 'mg_jykt'],
      ['金鹰纪实', 'mg_jyjs'],
      ['湖南电影', 'mg_hndy'],
      ['湖南电视剧', 'mg_hndsj'],
      ['湖南都市', 'mg_hnds'],
      ['湖南娱乐', 'mg_hnyl'],
      ['湖南爱晚', 'mg_hnaw'],
      ['湖南经视', 'mg_hnjs']
    ];

    // 上游的實際直播源基礎網址
    const upstreamBase = "https://cc.cd";

    // 輔助函式：產生最終的播放 M3U8 網址
    function getChannelUrl(id) {
      return `${origin}/${id}/playlist.m3u8`;
    }

    // 產生 TXT 格式列表 (適用於 DIYP 等電視盒子軟體)
    function generateTxtList() {
      let output = ['央视频道,#genre#'];
      
      // 先加入所有央視頻道 (ID 包含 cctv 的)
      for (const [name, id] of channelList) {
        if (id.startsWith('cctv')) {
          output.push(`${name},${getChannelUrl(id)}`);
        }
      }
      
      output.push('', '地方频道,#genre#');
      
      // 再加入其餘地方衛視
      for (const [name, id] of channelList) {
        if (!id.startsWith('cctv')) {
          output.push(`${name},${getChannelUrl(id)}`);
        }
      }
      
      return output.join('\n') + '\n';
    }

    // 產生 M3U 格式播放列表 (適用於 VLC, TiviMate 等播放器)
    function generateM3uList() {
      let output = ['#EXTM3U'];
      for (const [name, id] of channelList) {
        output.push(`#EXTINF:-1,${name}`);
        output.push(getChannelUrl(id));
      }
      return output.join('\n') + '\n';
    }

    try {
      // 1. 訪問首頁 '/'：直接向遠端伺服器抓取
      if (pathname === '/' && request.method === 'GET') {
        const response = await fetch(upstreamBase, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          cf: { cacheTtl: 300, cacheEverything: true }
        });
        
        if (!response.ok) {
          return new Response(`首頁內容獲取失敗\nHTTP狀態碼：${response.status}`, { status: 500 });
        }
        
        const htmlText = await response.text();
        return new Response(htmlText, {
          status: 200,
          headers: { 
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'public, max-age=300'
          }
        });
      }

      // 2. 訪問 '/m3u' 或 '/txt' 或 '/txt/'：輸出 TXT 格式
      if ((pathname === '/m3u' || pathname === '/txt' || pathname === '/txt/') && request.method === 'GET') {
        return new Response(generateTxtList(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Content-Disposition': 'inline; filename="ysp.txt"',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 3. 訪問 '/playlist.m3u8' 或 '/m3u/'：輸出 M3U 格式
      if ((pathname === '/playlist.m3u8' || pathname === '/m3u/') && request.method === 'GET') {
        return new Response(generateM3uList(), {
          status: 200,
          headers: {
            'Content-Type': 'audio/x-mpegurl; charset=UTF-8',
            'Content-Disposition': 'inline; filename="ysp.m3u"',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 如果需要轉發實際的直播流分片（如果播放器直接請求 Worker）
      // 這裡原本程式碼只寫到 header 裁切，若有需要轉發串流可以再補上 proxy 邏輯。
      return new Response("當前沒有可用節點或不支援的路由\n", { status: 404 });

    } catch (err) {
      return new Response(`Worker執行失敗\n\n${err.message}`, { status: 500 });
    }
  }
};

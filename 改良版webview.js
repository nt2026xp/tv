function main(item) {
    let url = item.url;
    let id = ku9.getQuery(url, "id");
    let domain = id.split('/');
    let headers;

    if (domain[2] === 'www.cditv.cn' || domain[2] === 'www.cbg.cn') { 
        headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; HMA-AL00 Build/HUAWEIHMA-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36'
        };
    } else {
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
        };
    }

    // 改良後的自動全螢幕與影片置頂 JS 邏輯
    const jscode = `(function(){
        const startTime = Date.now();
        // 初始隱藏網頁，防止原生網頁內容閃爍
        document.documentElement.style.backgroundColor = 'black';
        document.body.style.visibility = 'hidden';
        
        function getVideoParentShadowRoots() {
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                const shadowRoot = element.shadowRoot;
                if (shadowRoot) {
                    const video = shadowRoot.querySelector('video');
                    if (video) return video;
                }
            }
            return null;
        }

        function removeControls() {
            ['#control_bar', '.controls', '.vjs-control-bar', 'xg-controls', '.xgplayer-controls'].forEach(selector => {
                document.querySelectorAll(selector).forEach(e => e.remove());
            });
        }

        function setupVideo(video) {
            // 建立強制全螢幕置頂的容器
            const container = document.createElement('div');
            container.id = 'custom-fullscreen-container';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;background-color:black;display:flex;align-items:center;justify-content:center;';
            
            // 修正：行動端網頁要能全螢幕，通常必須開啟 playsInline，否則會被 X5 或特定核心鎖定內聯
            video.playsInline = true;
            video.webkitPlaysInline = true;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.style.cssText = 'width:100%;height:100%;object-fit:contain;transform:translateZ(0);';
            
            // 移轉視訊節點
            if (video.parentNode) {
                video.parentNode.insertBefore(container, video);
            } else {
                document.body.appendChild(container);
            }
            container.appendChild(video);
            
            // 鎖定網頁捲軸
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            // 執行系統全螢幕請求
            const triggerFullscreen = () => {
                const req = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen;
                if (req) {
                    req.call(container).catch(err => console.log('全螢幕請求被瀏覽器拦截，等待用戶互動', err));
                }
            };

            // 嘗試自動全螢幕
            setTimeout(triggerFullscreen, 200);

            // 改良：防禦機制。如果自動全螢幕被瀏覽器攔截，用戶點擊螢幕任意地方立即觸發全螢幕
            container.addEventListener('click', () => {
                triggerFullscreen();
            }, { once: true });

            // 處理播放狀態
            video.muted = false;
            video.volume = 1;
            
            const startPlay = () => {
                video.play().catch(() => {
                    video.muted = true; // 失敗則靜音意圖播放
                    video.play();
                });
            };
            
            if (video.readyState >= 2) {
                startPlay();
            } else {
                video.addEventListener('canplay', startPlay, { once: true });
            }
        }

        function checkVideo() {
            // 超時處理（15秒）
            if (Date.now() - startTime > 15000) {
                clearInterval(interval);
                document.body.style.visibility = 'visible';
                return;
            }
            
            let video = document.querySelector('video') || getVideoParentShadowRoots();
            // 修改：只要找到 video 元素即可進行移轉，不需要完全等待 readyState > 0，避免加載慢的流媒體卡住
            if (video) {
                clearInterval(interval);
                removeControls();
                setupVideo(video);
                
                // 顯示畫面
                document.body.style.visibility = 'visible';
            }
        }

        const interval = setInterval(checkVideo, 100);
    })();`;

    return {
        webview: id,
        headers: headers,
        jscode: jscode
    };
}

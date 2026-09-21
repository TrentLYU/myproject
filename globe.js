/* ============================================================
   3D 可拖动旅行地球（Canvas 正交投影，无外部依赖）
   数据：globe-data.js（陆地点阵）+ travel-places.js（地点照片）
   ============================================================ */
(function () {
    'use strict';
    const canvas = document.getElementById('globeCanvas');
    const stage = document.getElementById('travelStage');
    const markersEl = document.getElementById('globeMarkers');
    if (!canvas || !stage || !markersEl) return;
    const ctx = canvas.getContext('2d');
    const DOTS = window.GLOBE_LAND_DOTS || [];
    const PLACES = window.TRAVEL_PLACES || [];

    // ---------- 三语支持（i18n.js 提供语言与字典；缺失时退回简中） ----------
    function lang() { return window.I18n ? window.I18n.getLang() : 'zh'; }
    function tt(key, fallback) { return window.I18n ? window.I18n.t(key) : (fallback != null ? fallback : key); }
    // name/sub/desc 支持字符串（视为三语通用）或 { zh, en, tw } 对象
    function loc(v) {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        return v[lang()] || v.zh || v.en || v.tw || '';
    }

    // ---------- 状态 ----------
    const DEG = Math.PI / 180;
    const INIT = { lon: 105, lat: 22 };          // 初始视角：中国南方
    let rotLon = INIT.lon, rotLat = INIT.lat;    // 球心对向的经纬度（度）
    let zoom = 1;
    const ZOOM_MIN = 1, ZOOM_MAX = 6;
    let w = 0, h = 0, dpr = 1, R = 0;            // 画布尺寸与基础半径
    let dragging = false, lastX = 0, lastY = 0;
    let velLon = 0, velLat = 0;                  // 拖拽惯性
    let lastInteract = 0;                        // 最近交互时间（自动自转用）
    const pointers = new Map();                  // 多点触控（捏合缩放）
    let pinchDist = 0;

    // ---------- 预计算：每个陆地点的三角函数 ----------
    const N = DOTS.length;
    const cosPhi = new Float32Array(N), sinPhi = new Float32Array(N);
    const cosLam = new Float32Array(N), sinLam = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        const lam = DOTS[i][0] * DEG, phi = DOTS[i][1] * DEG;
        cosPhi[i] = Math.cos(phi); sinPhi[i] = Math.sin(phi);
        cosLam[i] = Math.cos(lam); sinLam[i] = Math.sin(lam);
    }

    // ---------- 正交投影 ----------
    function project(lngDeg, latDeg, pose) {
        const { cl, sl, cf, sf, cx, cy, rk } = pose;
        const lam = lngDeg * DEG, phi = latDeg * DEG;
        const cp = Math.cos(phi), sp = Math.sin(phi);
        // sin/cos(lam - lon0) 展开，避免每点两次三角调用
        const sinD = Math.sin(lam) * cl - Math.cos(lam) * sl;
        const cosD = Math.cos(lam) * cl + Math.sin(lam) * sl;
        const x = cp * sinD;
        const y = cf * sp - sf * cp * cosD;
        const z = sf * sp + cf * cp * cosD;      // z>0 朝观察者
        return { x: cx + x * rk, y: cy - y * rk, z };
    }
    function pose() {
        const lon0 = rotLon * DEG, lat0 = rotLat * DEG;
        return {
            cl: Math.cos(lon0), sl: Math.sin(lon0),
            cf: Math.cos(lat0), sf: Math.sin(lat0),
            cx: w / 2, cy: h / 2, rk: R * zoom
        };
    }

    // ---------- 画布尺寸 ----------
    function resize() {
        const rect = stage.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = Math.max(rect.width, 100); h = Math.max(rect.height, 100);
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        R = Math.min(w, h) / 2 * 0.86;
    }

    // ---------- 绘制 ----------
    function drawGraticule(P) {
        // 经纬网格，只画朝向观察者的片段
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 90, 190, 0.10)';
        const STEP = 3 * DEG;
        // 纬线
        for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
            ctx.beginPath();
            let moved = false;
            for (let lngDeg = -180; lngDeg <= 180; lngDeg += 3) {
                const p = project(lngDeg, latDeg, P);
                if (p.z > 0.02) {
                    if (!moved) { ctx.moveTo(p.x, p.y); moved = true; }
                    else ctx.lineTo(p.x, p.y);
                } else moved = false;
            }
            ctx.stroke();
        }
        // 经线
        for (let lngDeg = -180; lngDeg < 180; lngDeg += 30) {
            ctx.beginPath();
            let moved = false;
            for (let latDeg = -85; latDeg <= 85; latDeg += 3) {
                const p = project(lngDeg, latDeg, P);
                if (p.z > 0.02) {
                    if (!moved) { ctx.moveTo(p.x, p.y); moved = true; }
                    else ctx.lineTo(p.x, p.y);
                } else moved = false;
            }
            ctx.stroke();
        }
    }

    function draw() {
        const P = pose();
        const rk = P.rk;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const cx = P.cx, cy = P.cy;

        // 大气光晕
        const glow = ctx.createRadialGradient(cx, cy, rk * 0.9, cx, cy, rk * 1.14);
        glow.addColorStop(0, 'rgba(80, 160, 255, 0.20)');
        glow.addColorStop(0.6, 'rgba(80, 160, 255, 0.07)');
        glow.addColorStop(1, 'rgba(80, 160, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, rk * 1.14, 0, Math.PI * 2); ctx.fill();

        // 海洋球体（左上高光）
        const ocean = ctx.createRadialGradient(cx - rk * 0.35, cy - rk * 0.4, rk * 0.1, cx, cy, rk);
        ocean.addColorStop(0, '#F0F7FF');
        ocean.addColorStop(0.45, '#C9E2FB');
        ocean.addColorStop(0.85, '#A3CBF3');
        ocean.addColorStop(1, '#8FBDEA');
        ctx.fillStyle = ocean;
        ctx.beginPath(); ctx.arc(cx, cy, rk, 0, Math.PI * 2); ctx.fill();

        // 经纬网
        drawGraticule(P);

        // 陆地：点阵（一次性 batch fill，性能好）
        const dotR = Math.min(0.9 + zoom * 0.28, 2.6);
        ctx.fillStyle = 'rgba(52, 140, 90, 0.78)';
        ctx.beginPath();
        const { cl, sl, cf, sf } = P;
        for (let i = 0; i < N; i++) {
            const sinD = sinLam[i] * cl - cosLam[i] * sl;
            const cosD = cosLam[i] * cl + sinLam[i] * sl;
            const x = cosPhi[i] * sinD;
            const z = sf * sinPhi[i] + cf * cosPhi[i] * cosD;
            if (z <= 0) continue;
            const y = cf * sinPhi[i] - sf * cosPhi[i] * cosD;
            const sx = cx + x * rk, sy = cy - y * rk;
            const r = dotR * (0.6 + 0.4 * z);      // 边缘略微收小，模拟球面
            ctx.rect(sx - r, sy - r, r * 2, r * 2);
        }
        ctx.fill();

        // 边缘暗部，增强立体感
        const rim = ctx.createRadialGradient(cx - rk * 0.3, cy - rk * 0.35, rk * 0.65, cx, cy, rk);
        rim.addColorStop(0, 'rgba(20, 60, 120, 0)');
        rim.addColorStop(0.82, 'rgba(20, 60, 120, 0.02)');
        rim.addColorStop(1, 'rgba(20, 60, 120, 0.22)');
        ctx.fillStyle = rim;
        ctx.beginPath(); ctx.arc(cx, cy, rk, 0, Math.PI * 2); ctx.fill();

        updateMarkers(P);
    }

    // ---------- 地点照片标记（DOM 小圆，贴球面） ----------
    const pins = [];
    function buildPins() {
        PLACES.forEach(function (place) {
            if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return;
            const pin = document.createElement('div');
            pin.className = 'travel-pin';
            pin.setAttribute('role', 'button');
            pin.setAttribute('aria-label', loc(place.name));
            const photo = place.photos && place.photos.length ? place.photos[0] : null;
            if (photo) {
                const img = document.createElement('img');
                img.src = photo;
                img.alt = loc(place.name);
                img.onerror = function () {
                    img.remove();
                    const empty = document.createElement('div');
                    empty.className = 'travel-pin__empty';
                    empty.textContent = '📍';
                    pin.insertBefore(empty, pin.firstChild);
                };
                pin.appendChild(img);
            } else {
                const empty = document.createElement('div');
                empty.className = 'travel-pin__empty';
                empty.textContent = '📍';
                pin.appendChild(empty);
            }
            const label = document.createElement('span');
            label.className = 'travel-pin__label';
            label.textContent = loc(place.name);
            pin.appendChild(label);
            pin.addEventListener('click', function () { openPlace(place); });
            markersEl.appendChild(pin);
            pins.push({ place, el: pin });
        });
    }
    function updateMarkers(P) {
        const pinScale = 0.75 + 0.25 * Math.min(zoom, 3) + (zoom - 1) * 0.12;
        pins.forEach(function (it) {
            const p = project(it.place.lng, it.place.lat, P);
            if (p.z <= 0.04) {
                it.el.style.opacity = '0';
                it.el.style.pointerEvents = 'none';
                return;
            }
            const s = Math.min(pinScale * (0.7 + 0.3 * p.z), 2.4);
            it.el.style.opacity = String(Math.min(0.25 + p.z, 1));
            it.el.style.pointerEvents = 'auto';
            it.el.style.zIndex = String(50 + Math.round(p.z * 50));
            it.el.style.transform =
                'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + s.toFixed(2) + ')';
        });
    }

    // ---------- 地点弹窗 + 大图灯箱 ----------
    const overlay = document.getElementById('placeOverlay');
    const lightbox = document.getElementById('placeLightbox');
    let currentPlace = null;
    function renderPlaceContent(place) {
        document.getElementById('placeName').textContent = loc(place.name);
        document.getElementById('placeSub').textContent = loc(place.sub);
        document.getElementById('placeDesc').textContent = loc(place.desc);
        const box = document.getElementById('placePhotos');
        box.innerHTML = '';
        const photos = (place.photos || []).filter(Boolean);
        const videos = (place.videos || []).filter(Boolean);
        if (!photos.length && !videos.length) {
            const empty = document.createElement('div');
            empty.className = 'place-photos__empty';
            empty.textContent = tt('travel.photosEmpty', '📷 照片在路上——把这里的照片发给 Trent 就能点亮啦');
            box.appendChild(empty);
        } else {
            photos.forEach(function (src) {
                const img = document.createElement('img');
                img.src = src;
                img.alt = loc(place.name);
                img.loading = 'lazy';
                img.addEventListener('click', function () { showLightboxImage(src); });
                box.appendChild(img);
            });
            videos.forEach(function (v) {
                const src = typeof v === 'string' ? v : (v && v.src);
                const poster = (typeof v === 'object' && v && v.poster) || '';
                if (!src) return;
                const tile = document.createElement('div');
                tile.className = 'place-video-tile';
                tile.setAttribute('role', 'button');
                tile.setAttribute('aria-label', loc(place.name) + ' · ' + tt('travel.video', '视频'));
                if (poster) tile.style.backgroundImage = 'url("' + poster + '")';
                const badge = document.createElement('div');
                badge.className = 'place-video-tile__badge';
                badge.textContent = '▶ ' + tt('travel.video', '视频');
                tile.appendChild(badge);
                tile.addEventListener('click', function () { openLightboxVideo(src); });
                box.appendChild(tile);
            });
        }
    }
    function showLightboxImage(src) {
        const lbVideo = document.getElementById('placeLightboxVideo');
        const lbImg = document.getElementById('placeLightboxImg');
        if (lbVideo) { lbVideo.pause(); lbVideo.classList.remove('is-show'); }
        if (lbImg) { lbImg.src = src; lbImg.classList.add('is-show'); }
        if (lightbox) lightbox.classList.add('open');
    }
    function getLightboxVideo() {
        let lbVideo = document.getElementById('placeLightboxVideo');
        if (!lbVideo && lightbox) {
            // 旧版页面（2.1.6–2.1.8）灯箱里没有 video 元素，动态补一个，保证老页面也能播
            lbVideo = document.createElement('video');
            lbVideo.id = 'placeLightboxVideo';
            lbVideo.controls = true;
            lbVideo.setAttribute('playsinline', '');
            lbVideo.preload = 'metadata';
            lbVideo.style.cssText = 'max-width:92vw;max-height:88vh;border-radius:12px;outline:none;background:#000;';
            lightbox.appendChild(lbVideo);
        }
        return lbVideo;
    }
    function openLightboxVideo(src) {
        const lbVideo = getLightboxVideo();
        if (!lbVideo) return;
        const lbImg = document.getElementById('placeLightboxImg');
        if (lbImg) lbImg.classList.remove('is-show');
        lbVideo.src = src;
        lbVideo.classList.add('is-show');
        if (lightbox) lightbox.classList.add('open');
        if (lbVideo.play) lbVideo.play().catch(function () {});
    }
    function openPlace(place) {
        currentPlace = place;
        renderPlaceContent(place);
        overlay.classList.add('open');
    }
    function closePlace() { overlay.classList.remove('open'); }
    function closeLightbox() {
        const lbVideo = document.getElementById('placeLightboxVideo');
        if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); lbVideo.classList.remove('is-show'); }
        if (lightbox) lightbox.classList.remove('open');
    }
    var btnClose = document.getElementById('placeClose');
    if (btnClose) btnClose.addEventListener('click', closePlace);
    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closePlace(); });
    if (lightbox) lightbox.addEventListener('click', function (e) {
        // 点视频/控件不关闭灯箱，只有点遮罩或大图才关闭
        const lbImg = document.getElementById('placeLightboxImg');
        if (e.target === lightbox || (lbImg && e.target === lbImg)) closeLightbox();
    });

    // ---------- 交互：拖拽旋转 ----------
    function normLon(deg) { return ((deg + 180) % 360 + 360) % 360 - 180; }
    function clampLat(deg) { return Math.max(-78, Math.min(78, deg)); }
    function interact() { lastInteract = performance.now(); }

    canvas.addEventListener('pointerdown', function (e) {
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 1) {
            dragging = true; velLon = 0; velLat = 0;
            lastX = e.clientX; lastY = e.clientY;
            canvas.classList.add('dragging');
        } else if (pointers.size === 2) {
            dragging = false;
            const pts = Array.from(pointers.values());
            pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        }
        interact();
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {                       // 双指捏合缩放
            const pts = Array.from(pointers.values());
            const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pinchDist > 0) setZoom(zoom * d / pinchDist);
            pinchDist = d;
            interact();
            return;
        }
        if (!dragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        const radPerPx = 1 / (R * zoom) / DEG;           // 像素 → 度
        rotLon = normLon(rotLon - dx * radPerPx);
        rotLat = clampLat(rotLat + dy * radPerPx);
        velLon = -dx * radPerPx * 0.55;                  // 记录惯性速度
        velLat = dy * radPerPx * 0.55;
        interact();
    });
    function endPointer(e) {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchDist = 0;
        if (pointers.size === 0) {
            dragging = false;
            canvas.classList.remove('dragging');
        }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);

    // ---------- 交互：滚轮缩放 / 按钮 / 复位 ----------
    function setZoom(z) { zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)); }
    canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        setZoom(zoom * Math.exp(-e.deltaY * 0.0013));
        interact();
    }, { passive: false });
    var zi = document.getElementById('globeZoomIn');
    var zo = document.getElementById('globeZoomOut');
    var zr = document.getElementById('globeReset');
    if (zi) zi.addEventListener('click', function () { setZoom(zoom * 1.35); interact(); });
    if (zo) zo.addEventListener('click', function () { setZoom(zoom / 1.35); interact(); });
    if (zr) zr.addEventListener('click', function () {
        rotLon = INIT.lon; rotLat = INIT.lat; zoom = 1; velLon = 0; velLat = 0; interact();
    });

    // ---------- 主循环：惯性 + 闲置自转 ----------
    let lastT = 0;
    function loop(t) {
        const dt = Math.min((t - lastT) / 1000, 0.05) || 0.016;
        lastT = t;
        if (!dragging) {
            if (Math.abs(velLon) > 0.01 || Math.abs(velLat) > 0.01) {
                rotLon = normLon(rotLon + velLon);
                rotLat = clampLat(rotLat + velLat);
                velLon *= 0.93; velLat *= 0.93;
            } else if (t - lastInteract > 2600) {
                rotLon = normLon(rotLon + 2.4 * dt);     // 闲置 2.6s 后缓慢自转
            }
        }
        draw();
        requestAnimationFrame(loop);
    }

    // ---------- Esc 关闭弹窗 ----------
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (lightbox && lightbox.classList.contains('open')) closeLightbox();
        else if (overlay && overlay.classList.contains('open')) closePlace();
    });

    // ---------- 语言切换：实时刷新 pin 标签与已打开的地点卡片 ----------
    window.addEventListener('trent-langchange', function () {
        pins.forEach(function (it) {
            const name = loc(it.place.name);
            it.el.setAttribute('aria-label', name);
            const img = it.el.querySelector('img');
            if (img) img.alt = name;
            const label = it.el.querySelector('.travel-pin__label');
            if (label) label.textContent = name;
        });
        if (currentPlace && overlay.classList.contains('open')) renderPlaceContent(currentPlace);
    });

    // ---------- 初始化 ----------
    resize();
    buildPins();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    requestAnimationFrame(loop);

    // 测试钩子（仿真用）
    window.__GLOBE_TEST__ = {
        project, pose,
        setView: function (lon, lat, z) { rotLon = lon; rotLat = lat; if (z) zoom = z; },
        setZoom, getPose: function () { return { rotLon, rotLat, zoom }; },
        pins, resize
    };
})();

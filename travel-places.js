/* ============================================================
   Trent 的旅行地点配置 —— 用户可直接编辑这个文件
   ------------------------------------------------------------
   每个地点一条记录，格式：
   {
     id:     'taiyuan',                          // 唯一标识，随意取
     name:   { zh: '太原', en: 'Taiyuan', tw: '太原' },  // 三语地点名
     sub:    { zh: '山西 · 家乡', ... },          // 三语副标题，可省略
     lat:    37.87,                              // 纬度（北纬为正）
     lng:    112.55,                             // 经度（东经为正）
     desc:   { zh: '…', en: '…', tw: '…' },      // 一句话描述（三语）
     photos: ['travel/2018/xx.jpg'],             // 照片路径，放 travel/ 文件夹
     videos: [{ src: 'travel/20xx/x.mp4', poster: 'travel/20xx/x-poster.jpg' }]  // 可选：视频（2.1.9+）
   }

   说明：
   · name/sub/desc 也可以直接写字符串，会被当作三语通用
     （新增地点时只写简中，英/繁会先用简中文案，之后可补 en/tw 字段）。
   · tw 字段由简中自动转换生成，如需地道写法可手动覆盖。
   · 添加新地点：把照片和地点发给 Trent 由他帮你标注；或自己加一条记录。
   · photos 为空时，地球上显示占位图标。
   ============================================================ */
window.TRAVEL_PLACES = [
    // ---------- 家乡与求学 ----------
    {
        id: 'taiyuan',
        name: { zh: "太原", en: "Taiyuan", tw: "太原" },
        sub: { zh: "山西 · 家乡", en: "Shanxi · Hometown", tw: "山西 · 家鄉" },
        lat: 37.87, lng: 112.55,
        desc: { zh: "根在这里——太原是心底的牵挂，汾河岸边、龙城公园、古城里，都是熟悉的日子。", en: "Roots lie here — Taiyuan is where my heart keeps returning to: the Fen River, Longcheng Park and the old city — all familiar days.", tw: "根在這裡——太原是心底的牽掛，汾河岸邊、龍城公園、古城裡，都是熟悉的日子。" },
        photos: ['travel/2020/taiyuan-longcheng-park.jpg', 'travel/2022/taiyuan-fenhe-park.jpg', 'travel/2024/taiyuan-home-1.jpg', 'travel/2024/taiyuan-home-2.jpg', 'travel/2024/taiyuan-home-3.jpg', 'travel/2025/taiyuan-gucheng-1.jpg']
    },
    {
        id: 'shenzhen',
        name: { zh: "深圳", en: "Shenzhen", tw: "深圳" },
        sub: { zh: "广东 · 求学的城市", en: "Guangdong · Where I study", tw: "廣東 · 求學的城市" },
        lat: 22.54, lng: 114.06,
        desc: { zh: "正在奔赴的未来，湾区的日与夜。", en: "The future I am running toward — day and night in the Bay Area.", tw: "正在奔赴的未來，灣區的日與夜。" },
        photos: ['travel/muxiao/tju-shenzhen-1.jpg', 'travel/muxiao/tju-shenzhen-2.jpg', 'travel/muxiao/tju-shenzhen-3.jpg', 'travel/muxiao/tju-shenzhen-4.jpg']
    },
    // ---------- 2018 年旅行 ----------
    {
        id: 'zuoquan-2018',
        name: { zh: "晋中左权", en: "Zuoquan, Jinzhong", tw: "晉中左權" },
        sub: { zh: "山西 · 2018", en: "Shanxi · 2018", tw: "山西 · 2018" },
        lat: 37.08, lng: 113.38,
        desc: { zh: "太行山深处的记忆，离家乡最近的一站。", en: "Memories deep in the Taihang Mountains — the stop closest to home.", tw: "太行山深處的記憶，離家鄉最近的一站。" },
        photos: ['travel/2018/zuoquan-1.jpg', 'travel/2018/zuoquan-2.jpg', 'travel/2018/zuoquan-3.jpg']
    },
    {
        id: 'xian-2018',
        name: { zh: "西安", en: "Xi'an", tw: "西安" },
        sub: { zh: "陕西 · 2018 / 2024", en: "Shaanxi · 2018 / 2024", tw: "陝西 · 2018 / 2024" },
        lat: 34.26, lng: 108.94,
        desc: { zh: "十三朝古都，在兵马俑一号坑与千年军阵面对面；大唐不夜城的灯火，把长安再次点亮。", en: "Ancient capital of thirteen dynasties — face to face with a millennium-old terracotta army, and the lanterns of the Great Tang All Day Mall light up Chang'an once again.", tw: "十三朝古都，在兵馬俑一號坑與千年軍陣面對面；大唐不夜城的燈火，把長安再次點亮。" },
        photos: ['travel/2018/xian-1.jpg', 'travel/2018/xian-2.jpg', 'travel/2018/xian-3.jpg', 'travel/2024/xian-datang-1.jpg', 'travel/2024/xian-datang-2.jpg', 'travel/2024/xian-datang-3.jpg', 'travel/2024/xian-datang-4.jpg']
    },
    {
        id: 'longmen-2018',
        name: { zh: "龙门石窟", en: "Longmen Grottoes", tw: "龍門石窟" },
        sub: { zh: "河南洛阳 · 2018", en: "Luoyang, Henan · 2018", tw: "河南洛陽 · 2018" },
        lat: 34.53, lng: 112.47,
        desc: { zh: "伊河两岸的千年佛光，卢舍那的微笑看了一千多年。", en: "A millennium of Buddhist light on both banks of the Yi River — Vairocana's smile has watched for over a thousand years.", tw: "伊河兩岸的千年佛光，盧舍那的微笑看了一千多年。" },
        photos: ['travel/2018/longmen-1.jpg', 'travel/2018/longmen-2.jpg']
    },
    {
        id: 'huangshan-2018',
        name: { zh: "黄山", en: "Mount Huang", tw: "黃山" },
        sub: { zh: "安徽 · 2018", en: "Anhui · 2018", tw: "安徽 · 2018" },
        lat: 30.13, lng: 118.16,
        desc: { zh: "五岳归来不看山，黄山归来不看岳。", en: "Having returned from the Five Great Mountains, one looks at no other mountains; having returned from Mount Huang, one looks at none of the Five.", tw: "五嶽歸來不看山，黃山歸來不看嶽。" },
        photos: ['travel/2018/huangshan-1.jpg', 'travel/2018/huangshan-2.jpg', 'travel/2018/huangshan-3.jpg', 'travel/2018/huangshan-4.jpg']
    },
    {
        id: 'wuzhen-2018',
        name: { zh: "乌镇", en: "Wuzhen", tw: "烏鎮" },
        sub: { zh: "浙江桐乡 · 2018", en: "Tongxiang, Zhejiang · 2018", tw: "浙江桐鄉 · 2018" },
        lat: 30.75, lng: 120.49,
        desc: { zh: "桨声灯影的江南水乡，枕水人家的旧时光。", en: "A Jiangnan water town of paddle sounds and lantern shadows — the old days of houses resting on the water.", tw: "槳聲燈影的江南水鄉，枕水人家的舊時光。" },
        photos: ['travel/2018/wuzhen-1.jpg', 'travel/2018/wuzhen-2.jpg', 'travel/2018/wuzhen-3.jpg']
    },
    {
        id: 'qionghai-2018',
        name: { zh: "琼海", en: "Qionghai", tw: "瓊海" },
        sub: { zh: "海南 · 2018", en: "Hainan · 2018", tw: "海南 · 2018" },
        lat: 19.26, lng: 110.47,
        desc: { zh: "椰风海韵，万泉河水暖，最南端的一抹蓝。", en: "Coconut breeze and sea waves, the warm waters of the Wanquan River — the southernmost shade of blue.", tw: "椰風海韻，萬泉河水暖，最南端的一抹藍。" },
        photos: ['travel/2018/qionghai-1.jpg']
    },
    // ---------- 2019–2022 年旅行 ----------
    {
        id: 'xinzhou',
        name: { zh: "忻州", en: "Xinzhou", tw: "忻州" },
        sub: { zh: "山西 · 2019 / 2022", en: "Shanxi · 2019 / 2022", tw: "山西 · 2019 / 2022" },
        lat: 38.40, lng: 112.73,
        desc: { zh: "定襄的湖畔田园与忻州古城的灯火，家乡向北一步的慢时光。", en: "The lakeside fields of Dingxiang and the lanterns of Xinzhou Old Town — slow time one step north of home.", tw: "定襄的湖畔田園與忻州古城的燈火，家鄉向北一步的慢時光。" },
        photos: ['travel/2019/dingxiang-1.jpg', 'travel/2019/dingxiang-2.jpg', 'travel/2022/xinzhou-gucheng-1.jpg', 'travel/2022/xinzhou-gucheng-2.jpg', 'travel/2022/xinzhou-gucheng-3.jpg']
    },
    {
        id: 'shanghai-pudong-2019',
        name: { zh: "上海浦东", en: "Pudong, Shanghai", tw: "上海浦東" },
        sub: { zh: "上海 · 2019", en: "Shanghai · 2019", tw: "上海 · 2019" },
        lat: 31.23, lng: 121.54,
        desc: { zh: "黄浦江上的夜色，游船与白玉兰广场的灯火一一亮起。", en: "A night on the Huangpu River — cruise lights and the skyline glowing one by one.", tw: "黃浦江上的夜色，遊船與白玉蘭廣場的燈火一一亮起。" },
        photos: ['travel/2019/shanghai-pudong-1.jpg', 'travel/2019/shanghai-pudong-2.jpg']
    },
    {
        id: 'nanjing-2019',
        name: { zh: "南京", en: "Nanjing", tw: "南京" },
        sub: { zh: "江苏 · 2019", en: "Jiangsu · 2019", tw: "江蘇 · 2019" },
        lat: 32.06, lng: 118.78,
        desc: { zh: "金陵夜色与园林水光，古城楼影与摩天楼同框。", en: "Nanjing nights by the water — old pavilions sharing the frame with skyscrapers.", tw: "金陵夜色與園林水光，古城樓影與摩天樓同框。" },
        photos: ['travel/2019/nanjing-1.jpg', 'travel/2019/nanjing-2.jpg']
    },
    {
        id: 'yongji-2021',
        name: { zh: "山西永济", en: "Yongji, Shanxi", tw: "山西永濟" },
        sub: { zh: "山西运城 · 2021", en: "Yuncheng, Shanxi · 2021", tw: "山西運城 · 2021" },
        lat: 34.86, lng: 110.44,
        desc: { zh: "鹳雀楼上望黄河——白日依山尽，诗里的小城走到了眼前。", en: "On the Stork Tower overlooking the Yellow River — the little town from Tang poems, now in front of me.", tw: "鸛雀樓上望黃河——白日依山盡，詩裡的小城走到了眼前。" },
        photos: ['travel/2021/yongji-1.jpg', 'travel/2021/yongji-2.jpg', 'travel/2021/yongji-3.jpg']
    },
    {
        id: 'tianjin-binhai-2021',
        name: { zh: "天津滨海", en: "Binhai, Tianjin", tw: "天津濱海" },
        sub: { zh: "天津 · 2021", en: "Tianjin · 2021", tw: "天津 · 2021" },
        lat: 39.03, lng: 117.69,
        desc: { zh: "渤海湾畔的新城，塔尖入云，花开满城。", en: "A new city by Bohai Bay — towers into the clouds, flowers across the streets.", tw: "渤海灣畔的新城，塔尖入雲，花開滿城。" },
        photos: ['travel/2021/tianjin-binhai-1.jpg', 'travel/2021/tianjin-binhai-2.jpg']
    },
    {
        id: 'shenyang-2021',
        name: { zh: "沈阳", en: "Shenyang", tw: "瀋陽" },
        sub: { zh: "辽宁 · 2021", en: "Liaoning · 2021", tw: "遼寧 · 2021" },
        lat: 41.80, lng: 123.43,
        desc: { zh: "昭陵的红墙金瓦、中街的市井烟火，盛京古韵藏在日常里。", en: "Red walls and golden tiles of Zhaoling Tomb, street life on Zhongjie — old Shengjing charm tucked into everyday days.", tw: "昭陵的紅牆金瓦、中街的市井煙火，盛京古韻藏在日常裡。" },
        photos: ['travel/2021/shenyang-1.jpg', 'travel/2021/shenyang-2.jpg', 'travel/2021/shenyang-3.jpg', 'travel/2021/shenyang-4.jpg']
    },
    // ---------- 2023 年旅行（甘青环线 · 川西） ----------
    {
        id: 'lanzhou-2023',
        name: { zh: "兰州", en: "Lanzhou", tw: "蘭州" },
        sub: { zh: "甘肃 · 2023", en: "Gansu · 2023", tw: "甘肅 · 2023" },
        lat: 36.06, lng: 103.83,
        desc: { zh: "一碗牛肉面的城市，黄河穿城而过。", en: "The city of a bowl of beef noodles, with the Yellow River running straight through.", tw: "一碗牛肉麵的城市，黃河穿城而過。" },
        photos: ['travel/2023/lanzhou-1.jpg', 'travel/2023/lanzhou-2.jpg']
    },
    {
        id: 'linxia-2023',
        name: { zh: "临夏", en: "Linxia", tw: "臨夏" },
        sub: { zh: "甘肃临夏 · 2023", en: "Linxia, Gansu · 2023", tw: "甘肅臨夏 · 2023" },
        lat: 35.60, lng: 103.21,
        desc: { zh: "八坊十三巷里的烟火临夏，青砖老院子一步一景。", en: "Linxia of Bafang Thirteen Alleys — a scene at every step among the old brick courtyards.", tw: "八坊十三巷裡的煙火臨夏，青磚老院子一步一景。" },
        photos: ['travel/2023/linxia-bafang-1.jpg', 'travel/2023/linxia-bafang-2.jpg', 'travel/2023/linxia-1.jpg', 'travel/2023/linxia-2.jpg', 'travel/2023/linxia-3.jpg']
    },
    {
        id: 'gannan-2023',
        name: { zh: "甘南", en: "Gannan", tw: "甘南" },
        sub: { zh: "甘肃甘南 · 2023", en: "Gannan, Gansu · 2023", tw: "甘肅甘南 · 2023" },
        lat: 35.00, lng: 102.91,
        desc: { zh: "甘南与248国道——草原、经幡垭口和云端公路。", en: "Gannan along G248 — grasslands, prayer-flag passes and a road into the clouds.", tw: "甘南與248國道——草原、經幡埡口和雲端公路。" },
        photos: ['travel/2023/gannan-1.jpg', 'travel/2023/gannan-2.jpg', 'travel/2023/gannan-3.jpg', 'travel/2023/gannan-4.jpg', 'travel/2023/gannan-5.jpg', 'travel/2023/gannan-6.jpg', 'travel/2023/gannan-g248-1.jpg', 'travel/2023/gannan-g248-2.jpg', 'travel/2023/gannan-g248-3.jpg']
    },
    {
        id: 'ruoergai-2023',
        name: { zh: "四川若尔盖", en: "Ruoergai, Sichuan", tw: "四川若爾蓋" },
        sub: { zh: "四川阿坝 · 2023", en: "Aba, Sichuan · 2023", tw: "四川阿壩 · 2023" },
        lat: 33.58, lng: 102.97,
        desc: { zh: "若尔盖的花湖与草原，唐克的黄河第一湾——云很低，路很长，还有一段在路上的视频。", en: "Ruoergai's lakes and grasslands, and the First Bend of the Yellow River at Tangke — clouds hang low, the road goes on, plus a clip from the journey.", tw: "若爾蓋的花湖與草原、唐克的黃河第一灣——雲很低，路很長，還有一段在路上的影片。" },
        photos: ['travel/2023/ruoergai-1.jpg', 'travel/2023/ruoergai-2.jpg', 'travel/2023/ruoergai-3.jpg', 'travel/2023/ruoergai-4.jpg', 'travel/2023/ruoergai-5.jpg', 'travel/2023/ruoergai-tangke-1.jpg', 'travel/2023/ruoergai-tangke-2.jpg', 'travel/2023/ruoergai-tangke-3.jpg', 'travel/2023/ruoergai-tangke-4.jpg', 'travel/2023/ruoergai-tangke-5.jpg', 'travel/2023/ruoergai-tangke-6.jpg'],
        videos: [{ src: 'travel/2023/ruoergai-video.mp4', poster: 'travel/2023/ruoergai-video-poster.jpg' }]
    },
    {
        id: 'baoji-2023',
        name: { zh: "宝鸡", en: "Baoji", tw: "寶雞" },
        sub: { zh: "陕西 · 2023", en: "Shaanxi · 2023", tw: "陝西 · 2023" },
        lat: 34.36, lng: 107.24,
        desc: { zh: "宝鸡，秦岭脚下的青铜器之乡。", en: "Baoji — the hometown of bronzes at the foot of the Qinling Mountains.", tw: "寶雞，秦嶺腳下的青銅器之鄉。" },
        photos: ['travel/2023/baoji-1.jpg']
    },
    // ---------- 2016–2017 ----------
    {
        id: 'niagara-2016',
        name: { zh: "尼亚加拉瀑布", en: "Niagara Falls", tw: "尼加拉瀑布" },
        sub: { zh: "加拿大 · 2016", en: "Canada · 2016", tw: "加拿大 · 2016" },
        lat: 43.09, lng: -79.08,
        desc: { zh: "马蹄瀑布的水雾腾起如云烟，站在加拿大这一侧，听得见雷声。", en: "The mist of Horseshoe Falls rising like clouds — on the Canadian side, you can hear it thunder.", tw: "馬蹄瀑布的水霧騰起如雲煙，站在加拿大這一側，聽得見雷聲。" },
        photos: ['travel/2016/niagara-1.jpg', 'travel/2016/niagara-2.jpg']
    },
    {
        id: 'toronto-2016',
        name: { zh: "多伦多大学", en: "University of Toronto", tw: "多倫多大學" },
        sub: { zh: "加拿大 · 2016 / 2024", en: "Canada · 2016 / 2024", tw: "加拿大 · 2016 / 2024" },
        lat: 43.66, lng: -79.40,
        desc: { zh: "哥特式塔楼与大草坪，多伦多大学的午后阳光。", en: "Gothic towers and wide lawns — an afternoon at the University of Toronto.", tw: "哥特式塔樓與大草坪，多倫多大學的午後陽光。" },
        photos: ['travel/2016/toronto-u.jpg', 'travel/2024/toronto-u-2.jpg']
    },
    {
        id: 'xiangbishan-2017',
        name: { zh: "象鼻山", en: "Elephant Trunk Hill", tw: "象鼻山" },
        sub: { zh: "广西桂林 · 2017", en: "Guilin, Guangxi · 2017", tw: "廣西桂林 · 2017" },
        lat: 25.27, lng: 110.30,
        desc: { zh: "桂林象鼻山，大象饮水，山水甲天下的第一站。", en: "The Elephant Trunk Hill of Guilin — an elephant drinking from the river, the first sight of the finest landscape under heaven.", tw: "桂林象鼻山，大象飲水，山水甲天下的第一站。" },
        photos: ['travel/2017/xiangbishan-1.jpg']
    },
    // ---------- 2024 年旅行 ----------
    {
        id: 'tianjin-2024',
        name: { zh: "天津", en: "Tianjin", tw: "天津" },
        sub: { zh: "天津 · 2024", en: "Tianjin · 2024", tw: "天津 · 2024" },
        lat: 39.11, lng: 117.20,
        desc: { zh: "五大道的小洋楼与瓷房子的千年瓷片，天津特有的浪漫。", en: "The little western houses of the Five Great Avenues and the porcelain shards of the China House — Tianjin's own romance.", tw: "五大道的小洋樓與瓷房子的千年瓷片，天津特有的浪漫。" },
        photos: ['travel/2024/tianjin-wudadao-1.jpg', 'travel/2024/tianjin-wudadao-2.jpg', 'travel/2024/tianjin-wudadao-3.jpg', 'travel/2024/tianjin-wudadao-4.jpg', 'travel/2024/tianjin-wudadao-5.jpg', 'travel/2024/tianjin-cifangzi-1.jpg', 'travel/2024/tianjin-cifangzi-2.jpg', 'travel/2024/tianjin-cifangzi-3.jpg']
    },
    {
        id: 'paris-2024',
        name: { zh: "巴黎", en: "Paris", tw: "巴黎" },
        sub: { zh: "法国 · 2024", en: "France · 2024", tw: "法國 · 2024" },
        lat: 48.86, lng: 2.35,
        desc: { zh: "与巴黎的一面之缘，浪漫收进一张照片里。", en: "A glimpse of Paris — romance caught in a single shot.", tw: "與巴黎的一面之緣，浪漫收進一張照片裡。" },
        photos: ['travel/2024/paris-1.jpg']
    },
    {
        id: 'hangzhou-2024',
        name: { zh: "杭州", en: "Hangzhou", tw: "杭州" },
        sub: { zh: "浙江 · 2024", en: "Zhejiang · 2024", tw: "浙江 · 2024" },
        lat: 30.27, lng: 120.16,
        desc: { zh: "江南忆，最忆是杭州。", en: "Of all my Jiangnan memories, Hangzhou lingers the most.", tw: "江南憶，最憶是杭州。" },
        photos: ['travel/2024/hangzhou-1.jpg', 'travel/2024/hangzhou-2.jpg', 'travel/2024/hangzhou-3.jpg', 'travel/2024/hangzhou-4.jpg', 'travel/2024/hangzhou-5.jpg', 'travel/2024/hangzhou-6.jpg', 'travel/2024/hangzhou-7.jpg']
    },
    {
        id: 'fenyang-2024',
        name: { zh: "汾阳杏花村", en: "Xinghuacun, Fenyang", tw: "汾陽杏花村" },
        sub: { zh: "山西吕梁 · 2024", en: "Lüliang, Shanxi · 2024", tw: "山西呂梁 · 2024" },
        lat: 37.23, lng: 111.72,
        desc: { zh: "吕梁汾阳杏花村，汾酒的故乡——借问酒家何处有，牧童遥指杏花村。", en: "Xinghua Village in Lüliang, home of Fen liquor — 'Where can I find a wineshop?' A cowherd points to the apricot-blossom village afar.", tw: "呂梁汾陽杏花村，汾酒的故鄉——借問酒家何處有，牧童遙指杏花村。" },
        photos: ['travel/2024/fenyang-xinghuacun-1.jpg', 'travel/2024/fenyang-xinghuacun-2.jpg', 'travel/2024/fenyang-xinghuacun-3.jpg']
    },
    // ---------- 2025 年旅行 ----------
    {
        id: 'datong-2025',
        name: { zh: "大同云冈石窟", en: "Yungang Grottoes, Datong", tw: "大同雲岡石窟" },
        sub: { zh: "山西大同 · 2025", en: "Datong, Shanxi · 2025", tw: "山西大同 · 2025" },
        lat: 40.11, lng: 113.14,
        desc: { zh: "云冈石窟，千年佛笑在崖壁上。", en: "Yungang Grottoes — a millennium of smiling Buddhas carved into the cliff.", tw: "雲岡石窟，千年佛笑在崖壁上。" },
        photos: ['travel/2025/datong-yungang-1.jpg', 'travel/2025/datong-yungang-2.jpg', 'travel/2025/datong-yungang-3.jpg']
    },
    {
        id: 'yingxian-2025',
        name: { zh: "应县木塔", en: "Wooden Pagoda of Yingxian", tw: "應縣木塔" },
        sub: { zh: "山西朔州 · 2025", en: "Shuozhou, Shanxi · 2025", tw: "山西朔州 · 2025" },
        lat: 39.56, lng: 113.18,
        desc: { zh: "应县木塔，世界上最高的木塔，千年风霜依然挺立。", en: "The Wooden Pagoda of Ying County — the world's tallest wooden pagoda, standing for a thousand years.", tw: "應縣木塔，世界上最高的木塔，千年風霜依然挺立。" },
        photos: ['travel/2025/yingxian-muta-1.jpg', 'travel/2025/yingxian-muta-2.jpg']
    },
    // ---------- 2026 年旅行 ----------
    {
        id: 'guangzhou-2026',
        name: { zh: "广州", en: "Guangzhou", tw: "廣州" },
        sub: { zh: "广东 · 2026", en: "Guangdong · 2026", tw: "廣東 · 2026" },
        lat: 23.13, lng: 113.26,
        desc: { zh: "花城广州——西关的陶陶居与镬耳屋脊，老城的烟火气。", en: "Guangzhou, the City of Flowers — Tao Tao Ju in Xiguan and the wok-ear gables of Lingnan.", tw: "花城廣州——西關的陶陶居與鑊耳屋脊，老城的煙火氣。" },
        photos: ['travel/2026/guangzhou-1.jpg', 'travel/2026/guangzhou-2.jpg']
    },
    // ---------- 我的母校 ----------
    {
        id: 'muxiao-changqingteng',
        name: { zh: "常青藤中学", en: "Changqingteng Middle School", tw: "常青藤中學" },
        sub: { zh: "太原 · 初中母校", en: "Taiyuan · Junior school alma mater", tw: "太原 · 初中母校" },
        lat: 37.79, lng: 112.56,
        desc: { zh: "常青藤中学——中考的状元门，还有那段在路上的时光。", en: "Changqingteng Middle School — the 'Top Scholar Gate' from exam days and the years on the way.", tw: "常青藤中學——會考的狀元門，還有那段在路上的時光。" },
        photos: ['travel/muxiao/changqingteng-2023-zhongkao.jpg', 'travel/muxiao/changqingteng-2023-zhuangyuanmen.jpg', 'travel/muxiao/changqingteng-1.jpg', 'travel/muxiao/changqingteng-2.jpg']
    },
    {
        id: 'muxiao-shandafuzhong',
        name: { zh: "山大附中", en: "Affiliated High School of Shanxi University", tw: "山大附中" },
        sub: { zh: "太原 · 高中母校", en: "Taiyuan · High school alma mater", tw: "太原 · 高中母校" },
        lat: 37.81, lng: 112.58,
        desc: { zh: "山大附中，高中时代——从教室到操场，从高考到运动会。", en: "The Affiliated High School of Shanxi University — the high school years, from classrooms to the sports field, from exams to sports meets.", tw: "山大附中，高中時代——從教室到操場，從會考到運動會。" },
        photos: ['travel/muxiao/shandafuzhong-1.jpg', 'travel/muxiao/shandafuzhong-2.jpg', 'travel/muxiao/shandafuzhong-3.jpg', 'travel/muxiao/shandafuzhong-gaokao-1.jpg', 'travel/muxiao/shandafuzhong-gaokao-2.jpg', 'travel/muxiao/shandafuzhong-gaokao-3.jpg', 'travel/muxiao/shandafuzhong-gaokao-4.jpg', 'travel/muxiao/shandafuzhong-2025-sports.jpg']
    },
    {
        id: 'tju-weijinlu',
        name: { zh: "天津大学卫津路校区", en: "TJU Weijin Road Campus", tw: "天津大學衛津路校區" },
        sub: { zh: "天津 · 母校校园", en: "Tianjin · Alma mater campus", tw: "天津 · 母校校園" },
        lat: 39.11, lng: 117.16,
        desc: { zh: "天津大学卫津路校区——老主楼、青年湖，和 1895 年的北洋大学堂。", en: "TJU's Weijin Road campus — the old main building, Youth Lake, and Peiyang University founded in 1895.", tw: "天津大學衛津路校區——老主樓、青年湖，和 1895 年的北洋大學堂。" },
        photos: ['travel/muxiao/tju-weijinlu-1.jpg', 'travel/muxiao/tju-weijinlu-2.jpg', 'travel/muxiao/tju-weijinlu-3.jpg', 'travel/muxiao/tju-weijinlu-4.jpg', 'travel/muxiao/tju-weijinlu-5.jpg', 'travel/muxiao/tju-weijinlu-6.jpg', 'travel/muxiao/tju-weijinlu-7.jpg', 'travel/muxiao/tju-weijinlu-8.jpg', 'travel/muxiao/tju-weijinlu-9.jpg', 'travel/muxiao/tju-weijinlu-10.jpg']
    },
    {
        id: 'polyu',
        name: { zh: "香港理工大学", en: "The Hong Kong Polytechnic University", tw: "香港理工大學" },
        sub: { zh: "香港 · 母校", en: "Hong Kong · Alma mater", tw: "香港 · 母校" },
        lat: 22.30, lng: 114.18,
        desc: { zh: "香港理工大学，红砖校园与维多利亚港的风。", en: "The Hong Kong Polytechnic University — the red-brick campus and the breeze of Victoria Harbour.", tw: "香港理工大學，紅磚校園與維多利亞港的風。" },
        photos: ['travel/muxiao/polyu-1.jpg', 'travel/muxiao/polyu-2.jpg', 'travel/muxiao/polyu-3.jpg', 'travel/muxiao/polyu-4.jpg', 'travel/muxiao/polyu-5.jpg', 'travel/muxiao/polyu-6.jpg', 'travel/muxiao/polyu-7.jpg', 'travel/muxiao/polyu-8.jpg']
    }

];

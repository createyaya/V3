// ===== 全局映射：定表节点显示 与 分台"执行关键词"共用同一套逻辑 =====
const MINDMAP_MAKEUP_FACE_MAP = {
    '圆形脸': '圆形脸 | 加高眉毛、拉长嘴角',
    '长圆脸': '长圆脸 | 降眉、长眼、横向面中腮红',
    '短方脸': '短方脸 | 加高眉毛、收紧上唇、下唇角、降低下唇下缘',
    '长方脸': '长方脸 | 降眉、长眼、横向面中腮红',
    '三角脸': '三角脸 | 长眉、长眼、长唇',
    '倒三角脸': '倒三角脸 | 短眉、短眼、长唇',
    '菱形脸': '菱形脸 | 短眉、圆眼、长唇'
};
const MINDMAP_HAIR_FACE_MAP = {
    '圆形脸': '圆形脸 | 活泼年轻→椭圆',
    '长圆脸': '长圆脸 | 朴实→优雅迷人',
    '短方脸': '短方脸 | 刚毅→圆润',
    '长方脸': '长方脸 | 朴实→优雅迷人',
    '三角脸': '三角脸 | 稳健→柔和',
    '倒三角脸': '倒三角脸 | 瘦小灵敏→和谐舒展',
    '菱形脸': '菱形脸 | 灵巧→凌乱浪漫'
};
const MINDMAP_MAKEUP_PRODUCT_MAP = { '柔': '柔 | 腮红', '亮': '亮 | 高饱和唇釉', '浅': '浅 | 浅色唇釉', '深': '深 | 眼线' };
const MINDMAP_SILHOUETTE_MAP = {
    '小A活泼可爱': '小A | 活泼可爱', '大A隆重端庄': '大A | 隆重端庄',
    '小X性感魅力': '小X | 性感魅力', '大X气场强劲': '大X | 气场强劲',
    '小H含蓄温柔': '小H | 含蓄温柔', '大H庄严肃穆': '大H | 庄严肃穆',
    '小T稳重可靠': '小T | 稳重可靠', '大T力量夸张': '大T | 力量夸张'
};
const MINDMAP_BODY_MAP = {
    'O型': 'O型宽松露四肢', 'A型': 'A型上紧下宽', 'H型': 'H型外轮廓夸张',
    'T型': 'T型大宽肩廓形', 'S型': 'S型紧身收腰'
};
const MINDMAP_SEASON_PRODUCT = { '春': '丸子头', '夏': '半扎发', '秋': '熟女卷发', '冬': '律师发' };
const MINDMAP_MAKEUP_TRAITS = {
    '圆形脸': '加高眉毛、拉长嘴角',
    '长圆脸': '降眉、长眼、横向面中腮红',
    '短方脸': '加高眉毛、收紧上唇、下唇角、降低下唇下缘',
    '长方脸': '降眉、长眼、横向面中腮红',
    '三角脸': '长眉、长眼、长唇',
    '倒三角脸': '短眉、短眼、长唇',
    '菱形脸': '短眉、圆眼、长唇'
};

// 读取一个绑定项的定表显示文字（key为localStorage键，bindMap/bindSeason为可选显示规则）
window.mindmapBoundDisplay = function(key, bindMap, bindSeason) {
    try {
        const d = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(d) && d[0] && d[0].src) {
            let sel = decodeURIComponent(d[0].src).split('/').pop().replace(/.[^.]+$/, '').replace(/^[0-9]+[.s]*/, '');
            if (bindMap && bindMap[sel]) sel = bindMap[sel];
            if (bindSeason) {
                let season = null;
                try {
                    const sd = JSON.parse(localStorage.getItem('selectedSeasonalColorImage'));
                    if (sd && sd[0] && sd[0].src) season = decodeURIComponent(sd[0].src).split('/').pop().replace(/.[^.]+$/, '').replace(/^[0-9]+[.s]*/, '');
                } catch (e) {}
                if (season && MINDMAP_SEASON_PRODUCT[season]) sel = season + ' | ' + MINDMAP_SEASON_PRODUCT[season];
            }
            return sel;
        }
        if (d && d.data) {
            const t = d.data;
            return `${t.inner}${t.outer}${t.bottom}${t.shoes}`;
        }
    } catch (e) { /* 未选择或数据异常 */ }
    // 待办选项类数据（JSON字符串数组，如发型进阶清单的所选选项）
    try {
        const arr = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(arr) && arr.length && arr.every(x => typeof x === 'string')) {
            // 二级选项「卷·自然卷」自带父级语境，去掉重复的父级（卷）
            const labels = arr.filter(o => !arr.some(x => x !== o && String(x).startsWith(String(o) + '·')));
            return labels.join('、');
        }
    } catch (e2) { /* 无选项数据 */ }
    return null;
};

class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mode = 'group'; // 'group'（分组） 或 'tree'（树状） 或 'outline'（大纲）
        this.data = this.loadInitialData();
        this.selectedNode = null;
        this.init();
    }

    loadInitialData() {
        // 默认数据结构 - 固定节点 + 各级默认子节点
        const defaultData = {
            name: '个人定表',
            children: [
                {
                    name: '妆发',
                    children: [
                        {
                            name: '妆容',
                            children: [
                                { name: '脸型', children: [] },
                                { name: '化妆品', children: [] },
                                {
                                    name: '妆容进阶',
                                    children: [
                                        { name: '中轴提亮', children: [] },
                                        { name: '内轮廓平整', children: [] },
                                        { name: '合理眉形', children: [] },
                                        { name: '三庭五眼对齐', children: [] }
                                    ]
                                }
                            ]
                        },
                        {
                            name: '发型',
                            children: [
                                { name: '脸型', children: [] },
                                { name: '发型', children: [] },
                                {
                                    name: '发型进阶',
                                    children: [
                                        { name: '分线', children: [] },
                                        { name: '层次', children: [] },
                                        { name: '卷度', children: [] },
                                        { name: '颜色', children: [] },
                                        { name: '长度', children: [] },
                                        { name: '正面发流', children: [] },
                                        { name: '侧面发流', children: [] },
                                        { name: '背面发流', children: [] }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: '色',
                    children: [
                        { name: '四季颜色', children: [] },
                        { name: '配色', children: [] }
                    ]
                },
                {
                    name: '料',
                    children: [
                        { name: '软硬贵素', children: [] },
                        { name: '具体面料', children: [] },
                        { name: '排列组合', children: [] }
                    ]
                },
                {
                    name: '型',
                    children: [
                        { name: '服装廓形', children: [] },
                        { name: '自身体型', children: [] },
                        { name: '排列组合', children: [] }
                    ]
                },
                { name: '鞋饰', children: [] },
                { name: '造型刚需', children: [] }
            ]
        };

        // 第二级起的默认节点标记为"待填写"占位卡位
        // 例外：妆发子树（妆容/发型及其所有分级）为常亮固定项，不做灰态
        const markPlaceholders = (nodes, level, skip) => {
            nodes.forEach(n => {
                if (level >= 2 && !skip) n.placeholder = true;
                markPlaceholders(n.children || [], level + 1, skip || n.fixed === true);
            });
        };
        const markFixed = (nodes) => {
            nodes.forEach(n => {
                n.fixed = true;
                if (n.children) markFixed(n.children);
            });
        };
        defaultData.children.forEach(top => {
            if (top.name === '妆发' && top.children) top.children.forEach(branch => markFixed([branch]));
        });
        markPlaceholders(defaultData.children, 1);

        // 分台选择绑定：这些节点的显示文字跟随分台选择（无选择时显示原类别名）
        const findNode = (name, parent) => (parent.children || []).find(c => c.name === name);
        // 挂绑定的节点同时转常亮（不显示灰态）
        const setBind = (parent, name, key, displayMap) => {
            const n = findNode(name, parent);
            if (n) { n.bind = key; n.fixed = true; delete n.placeholder; if (displayMap) n.bindMap = displayMap; }
        };

        const zhuofa = findNode('妆发', defaultData);
        const rongzhuang = findNode('妆容', zhuofa);
        const faxing = findNode('发型', zhuofa);
        const makeupFaceMap = MINDMAP_MAKEUP_FACE_MAP;
        const hairFaceMap = MINDMAP_HAIR_FACE_MAP;
        const makeupProductMap = MINDMAP_MAKEUP_PRODUCT_MAP;
        if (rongzhuang) {
            setBind(rongzhuang, '脸型', 'selectedMakeupImages', makeupFaceMap);
            setBind(rongzhuang, '化妆品', 'selectedMakeupProductImages', makeupProductMap);
        }
        if (faxing) {
            // 发型·脸型与妆容·脸型显示同一选择（妆容结构卡确认的脸型），但描述按发型语境
            setBind(faxing, '脸型', 'selectedMakeupImages', hairFaceMap);
            const hn = findNode('发型', faxing);
            if (hn) {
                hn.bind = 'selectedHairstyleProductImages';
                hn.fixed = true; delete hn.placeholder;
                hn.bindSeason = true; // 显示为「季节 + 对应发型」，季节跟随四季颜色选择
            }
        }
        // 三级节点：妆容、发型 → 有框 + 浅灰底
        if (rongzhuang) rongzhuang.frame = true;
        if (faxing) faxing.frame = true;
        // 发型进阶子节点：绑定进阶清单所选选项（选项文字追加在节点名后）
        const faxingAdvanced = faxing ? findNode('发型进阶', faxing) : null;
        if (faxingAdvanced && faxingAdvanced.children) {
            faxingAdvanced.children.forEach((c, i) => {
                if (i < 8) {
                    c.bind = 'hairstyle-opt-hairstyle-advanced-' + (i + 1);
                    c.bindAppend = true;
                    c.fixed = true;
                    delete c.placeholder;
                }
            });
        }
        const se = findNode('色', defaultData);
        const liao = findNode('料', defaultData);
        const xing = findNode('型', defaultData);
        const markPlain = (parent) => {
            (parent.children || []).forEach(n => { n.plain = true; });
        };
        if (se) {
            markPlain(se);
            setBind(se, '四季颜色', 'selectedSeasonalColorImage');
            setBind(se, '配色', 'selectedColorAdvancedImage');
        }
        if (liao) {
            markPlain(liao);
            setBind(liao, '软硬贵素', 'selectedFabricSoftnessImage');
            setBind(liao, '具体面料', 'selectedFabricSelectionImage');
            setBind(liao, '排列组合', 'selectedFabricAdvanced');
        }
        if (xing) {
            setBind(xing, '服装廓形', 'selectedSilhouetteImages', MINDMAP_SILHOUETTE_MAP);
            setBind(xing, '自身体型', 'selectedSilhouetteBodyImages', MINDMAP_BODY_MAP);
            setBind(xing, '排列组合', 'selectedSilhouetteAdvanced');
        }
        // 鞋饰/造型刚需：当前无下属，未来新增的子级也走plain样式（手动在此补标记即可）

        // 从 localStorage 加载数据
        const saved = localStorage.getItem('mindMapData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // 旧数据根节点名迁移
                if (data.name === '思维导图') data.name = '个人定表';
                // 递归合并默认节点：已保存数据里缺的补上（按名字去重，已有的不覆盖）
                const mergeChildren = (savedChildren, defChildren) => {
                    defChildren.forEach(defChild => {
                        const savedChild = savedChildren.find(c => c.name === defChild.name);
                        if (savedChild) {
                            // 同步常亮/绑定属性：旧数据里的灰态要升级为常亮
                            if (defChild.fixed) { savedChild.fixed = true; delete savedChild.placeholder; }
                            if (defChild.bind) savedChild.bind = defChild.bind;
                            if (defChild.bindMap) savedChild.bindMap = defChild.bindMap;
                            if (defChild.bindSeason) savedChild.bindSeason = true;
                            if (defChild.bindAppend) savedChild.bindAppend = true;
                            if (defChild.frame) savedChild.frame = true;
                            if (defChild.bindSeason) delete savedChild.frame;
                            if (!savedChild.children) savedChild.children = [];
                            mergeChildren(savedChild.children, defChild.children || []);
                        } else {
                            savedChildren.push(JSON.parse(JSON.stringify(defChild)));
                        }
                    });
                };
                mergeChildren(data.children, defaultData.children);
                // 清理已拆分的旧节点（正侧背面发流 → 正面/侧面/背面发流）
                const pruneStale = (children) => {
                    for (let i = children.length - 1; i >= 0; i--) {
                        if (children[i].name === '正侧背面发流') children.splice(i, 1);
                        else if (children[i].children) pruneStale(children[i].children);
                    }
                };
                pruneStale(data.children);
                // 妆容进阶子目迁移：旧的中轴/面中/外轮廓/局部 替换为十分台检查清单四项
                // （仅当旧子目仍存在时替换，避免覆盖用户自定义内容；新四项缺失时已由mergeChildren补上）
                const migrateMakeupAdvanced = (children) => {
                    children.forEach(n => {
                        if (n.name === '妆容进阶') {
                            if ((n.children || []).some(c => ['中轴', '面中', '外轮廓', '局部'].includes(c.name))) {
                                n.children = [
                                    { name: '中轴提亮', children: [] },
                                    { name: '内轮廓平整', children: [] },
                                    { name: '合理眉形', children: [] },
                                    { name: '三庭五眼对齐', children: [] }
                                ];
                            }
                        } else if (n.children) {
                            migrateMakeupAdvanced(n.children);
                        }
                    });
                };
                migrateMakeupAdvanced(data.children);
                // 发型进阶子目更名：「发长」→「长度」（若两者并存则删除旧项），
                // 并按默认顺序重排，确保「长度」位于第五项（颜色之后）
                const HAIR_ADV_ORDER = ['分线', '层次', '卷度', '颜色', '长度', '正面发流', '侧面发流', '背面发流'];
                const migrateHairLength = (children) => {
                    children.forEach(n => {
                        if (n.name === '发型进阶') {
                            (n.children || []).forEach(c => {
                                if (c.name === '发长') {
                                    if ((n.children || []).some(s => s.name === '长度')) {
                                        n.children = n.children.filter(s => s !== c);
                                    } else {
                                        c.name = '长度';
                                    }
                                }
                            });
                            n.children = (n.children || []).slice().sort((a, b) => {
                                const ia = HAIR_ADV_ORDER.indexOf(a.name);
                                const ib = HAIR_ADV_ORDER.indexOf(b.name);
                                // 未知名称（用户自定义）排在已知项之后，保持相对顺序
                                if (ia === -1 && ib === -1) return 0;
                                if (ia === -1) return 1;
                                if (ib === -1) return -1;
                                return ia - ib;
                            });
                        } else if (n.children) {
                            migrateHairLength(n.children);
                        }
                    });
                };
                migrateHairLength(data.children);
                // 兜底：按路径强制同步常亮/绑定标记，确保脸型等绑定节点一定生效
                const syncFlags = (saved, def) => {
                    if (def.fixed) { saved.fixed = true; delete saved.placeholder; }
                    if (def.bind) saved.bind = def.bind;
                    if (def.bindMap) saved.bindMap = def.bindMap;
                    if (def.bindSeason) saved.bindSeason = true;
                    if (def.bindAppend) saved.bindAppend = true;
                    if (def.frame) saved.frame = true;
                    if (def.bindSeason) delete saved.frame;
                    (def.children || []).forEach(dc => {
                        const sc = (saved.children || []).find(c => c.name === dc.name);
                        if (sc) syncFlags(sc, dc);
                    });
                };
                syncFlags(data, defaultData);
                return data;
            } catch (e) {
                console.error('解析已保存的思维导图数据失败，使用默认数据', e);
            }
        }

        return defaultData;
    }

    init() {
        // 取消内框滚动限制，让导图完整展示
        this.container.style.height = 'auto';
        this.container.style.overflow = 'visible';
        this.container.style.border = 'none';

        this.render();
        this.bindEvents();
        // 分组模式：窗口尺寸变化时重算连接线（无分组容器时自动跳过）
        window.addEventListener('resize', () => this.alignGroupConnectors());
    }

    render() {
        this.container.innerHTML = '';

        // 手机端适配：加宽左右留白由外层content-area负责；导图限宽不再撑破页面
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
            @media (max-width: 768px) {
                .tree-container,
                .outline-container {
                    max-width: 100%;
                    width: auto;
                    margin: 0;
                    padding-left: 0;
                    padding-right: 14px; /* 手机端右侧留白，避免最右内容顶到屏幕边 */
                }
                /* 树状模式：默认整棵缩放适配屏幕，手势交给浏览器正常处理（页面缩放/滚动与其他内容一致） */
                .tree-container {
                    overflow: visible;
                    transform-origin: 0 0;
                }
                /* 手机端整体缩小，让导图尽量塞进屏幕 */
                .tree-container .mind-node-row {
                    padding: 4px 10px;
                    font-size: 13px;
                    border-radius: 5px;
                }
                .tree-container .mind-node[data-level="0"] > .mind-node-row {
                    font-size: 15px;
                    padding: 6px 14px;
                }
                .tree-container .children-container {
                    margin-left: 14px;
                }
                .tree-container .node-toolbar button {
                    width: 20px;
                    height: 20px;
                    font-size: 11px;
                    flex: none;
                }
                .outline-container .mind-node {
                    padding: 3px 5px;
                }
                .outline-container .node-content {
                    font-size: 13px;
                }
                .outline-container .mind-node[data-level="0"] > .mind-node-row .node-content {
                    font-size: 16px;
                }
                .outline-container .children-container {
                    margin-left: 8px;
                    padding-left: 10px;
                }
                .outline-container .node-toolbar button {
                    width: 20px;
                    height: 20px;
                    font-size: 11px;
                    flex: none;
                }
                .group-container {
                    padding-right: 14px;
                }
                .group-container .node-toolbar button {
                    flex: none;
                }
            }
        `;
        this.container.appendChild(mobileStyle);

        // 模式切换已取消（2026-11-24 重要转变★）：定表只保留分组模式，直接渲染正文
        this.renderGroup();
        // 渲染后按实际位置对齐分组模式的连接线
        this.alignGroupConnectors();

        // 手机端：整体缩放适配屏幕（树状/大纲通用）
        this.setupMobileFitZoom();

        // 导出图片按钮：固定显示在导图最下方居中
        const exportBtn = document.createElement('button');
        exportBtn.textContent = '导出图片';
        exportBtn.style.display = 'block';
        exportBtn.style.margin = '20px auto 0';
        exportBtn.style.padding = '8px 22px';
        exportBtn.style.fontSize = '14px';
        exportBtn.style.letterSpacing = '2px';
        exportBtn.style.border = '1px solid #000';
        exportBtn.style.background = '#fff';
        exportBtn.style.cursor = 'pointer';
        exportBtn.onclick = () => this.exportToImage();
        this.container.appendChild(exportBtn);
    }

    // 用SVG整层绘制树状模式连接线：每条「父框→拐点→子框」是一个连续path，无元素接缝
    adjustTreeConnectors() {
        const root = this.container.querySelector('.tree-container');
        if (!root) return;

        // 移除旧SVG
        const oldSvg = root.querySelector(':scope > .tree-lines-svg');
        if (oldSvg) oldSvg.remove();

        // 手机端缩放状态下，先还原到未缩放坐标测量，画完再恢复
        const savedTransform = root.style.transform;
        const savedHeight = root.style.height;
        root.style.transform = 'none';
        root.style.height = '';

        const W = Math.max(root.scrollWidth, root.offsetWidth);
        const H = Math.max(root.scrollHeight, root.offsetHeight);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tree-lines-svg');
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);
        root.appendChild(svg);

        const rootRect = root.getBoundingClientRect();

        this.container.querySelectorAll('.tree-container .children-container').forEach(cc => {
            const parentRow = cc.parentElement.querySelector(':scope > .mind-node-row');
            const rows = Array.from(cc.children)
                .map(n => n.querySelector(':scope > .mind-node-row'))
                .filter(Boolean);
            if (!parentRow || rows.length === 0) return;

            // 父框引出点：右边缘中点
            const pr = parentRow.getBoundingClientRect();
            const px = Math.round(pr.right - rootRect.left) - 1;
            const py = Math.round(pr.top - rootRect.top + pr.height / 2);

            // 竖脊x：子级容器左缘再往左15px
            const ccRect = cc.getBoundingClientRect();
            const spineX = Math.round(ccRect.left - rootRect.left) - 15;

            // 每个子框一条连续折线：父框 → 竖脊 → 子框左缘中点
            rows.forEach(row => {
                const rr = row.getBoundingClientRect();
                const cy = Math.round(rr.top - rootRect.top + rr.height / 2);
                const cx = Math.round(rr.left - rootRect.left) + 1;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${px} ${py} L ${spineX} ${py} L ${spineX} ${cy} L ${cx} ${cy}`);
                path.setAttribute('stroke', '#bbb');
                path.setAttribute('stroke-width', '1');
                path.setAttribute('fill', 'none');
                path.setAttribute('shape-rendering', 'crispEdges');
                svg.appendChild(path);
            });
        });

        // 恢复手机端缩放状态
        root.style.transform = savedTransform;
        root.style.height = savedHeight;
        if (this._treeZoom) {
            this.applyTreeZoom();
        }
    }

    // 手机端树状/大纲模式：默认整棵缩放适配屏幕宽度；手势不做接管，页面缩放/滚动交给浏览器正常处理
    setupMobileFitZoom() {
        const t = this.container.querySelector('.tree-container, .outline-container, .group-container');
        if (!t || !window.matchMedia('(max-width: 768px)').matches) return;

        const vw = this.container.clientWidth;
        const cw = Math.max(t.scrollWidth, t.offsetWidth);
        const ch = Math.max(t.scrollHeight, t.offsetHeight);
        const fit = Math.min(1, vw / cw);
        this._treeZoom = { scale: fit, tx: 0, fit, cw, ch, vw };
        this.applyTreeZoom();
    }

    // 应用当前缩放与平移（并同步占位高度，避免下方内容重叠）
    applyTreeZoom() {
        const t = this.container.querySelector('.tree-container, .outline-container, .group-container');
        const z = this._treeZoom;
        if (!t || !z) return;

        // 平移范围：放大后左右不露白
        const minTx = Math.min(0, z.vw - z.cw * z.scale);
        z.tx = Math.max(minTx, Math.min(0, z.tx));

        t.style.transformOrigin = '0 0';
        t.style.transform = `translateX(${z.tx}px) scale(${z.scale})`;
        t.style.height = (z.ch * z.scale) + 'px';
    }

    // 模式切换（分组/树状/大纲三选一）
    switchMode(m) {
        if (this.mode !== m) {
            this.mode = m;
            this.render();
        }
    }

    // ===== 分组模式：整棵树按顶层板块拆成分区卡（定表分组版式样本定稿版式） =====
    renderGroup() {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'group-container';

        const style = document.createElement('style');
        style.textContent = `
            /* ===== 分组模式：分区卡版式（灰白体系） ===== */
            .group-container {
                max-width: 640px;
                margin: 0 auto;
                padding: 16px 8px;
            }
            .group-container .root-banner {
                text-align: center;
                font-size: 22px;
                font-weight: bold;
                letter-spacing: 4px;
                padding: 10px 0 24px;
                color: #2f2a26;
            }
            .group-container .root-banner::after {
                content: '';
                display: block;
                width: 36px;
                height: 3px;
                background: #000;
                margin: 12px auto 0;
            }
            .group-container .block {
                border: 1px solid #e7e7e7;
                border-radius: 12px;
                margin-bottom: 22px;
                overflow: hidden;
                background: #fff;
                box-shadow: 0 1px 4px rgba(0,0,0,0.04);
            }
            .group-container .block-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #fafafa;
                border-bottom: 1px solid #efefef;
                color: #222;
                padding: 10px 16px;
            }
            .group-container .block-header .name {
                font-size: 16px;
                font-weight: bold;
                letter-spacing: 2px;
            }
            .group-container .block-header .tag {
                font-size: 11px;
                border: 1px solid #d5d5d5;
                border-radius: 999px;
                padding: 2px 10px;
                color: #999;
                background: #fff;
            }
            .group-container .block-body { padding: 14px 14px 16px; }
            .group-container .node-row {
                display: flex;
                align-items: stretch;
                margin-bottom: 10px;
            }
            .group-container .node-row:last-child { margin-bottom: 0; }
            .group-container .branch {
                flex: none;
                width: 108px;
                display: flex;
                align-items: flex-start;
                position: relative;
            }
            .group-container .branch .pill {
                display: block;
                width: 100%;
                text-align: center;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                background: #f7f7f7;
                color: #333;
                padding: 9px 6px;
                font-size: 14px;
                font-weight: bold;
                position: relative;
                z-index: 1;
                word-break: break-all;
            }
            .group-container .branch .pill::after {
                content: '';
                position: absolute;
                right: -14px;
                top: 50%;
                width: 14px;
                height: 1px;
                background: #cfcfcf;
            }
            .group-container .leaves {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                gap: 8px;
                padding-left: 10px;
                position: relative;
                min-width: 0;
            }
            /* 方案D：叶子行自带底线，竖脊与短横线全部去掉，避免杂线 */
            .group-container .leaves.single::before { display: none; }
            /* 空板块：居中的大号＋按钮，与其他情况的工具栏处理不同 */
            .group-container .leaves.placeholder-row { padding-left: 0; }
            .group-container .empty-add {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 12px 0;
            }
            .group-container .empty-add-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 1.5px dashed #b5b5b5;
                background: #fff;
                color: #888;
                font-size: 22px;
                line-height: 1;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            .group-container .empty-add-btn:hover {
                border-color: #000;
                color: #000;
                background: #f7f7f7;
            }
            .group-container .leaf {
                position: relative;
                font-size: 13px;
                line-height: 1.5;
                padding: 5px 6px;
            }
            .group-container .leaf::before { display: none; }
            /* 已选叶子：整行一条实线底线；键/结论左、选项值贴右缘 */
            .group-container .leaf.chosen { border-bottom: 1px solid #999; }
            .group-container .leaf .g-k { font-weight: bold; }
            .group-container .leaf .g-r { font-weight: bold; text-align: right; margin-left: auto; }
            /* 待填写叶子：无线灰字 */
            .group-container .leaf.pending { color: #aaa; }
            .group-container .leaf.pending .g-k { color: #aaa; }
            .group-container .leaf.pending .g-r { color: #aaa; }
            /* 叶子文字行：左右两栏 + 工具栏锚点 */
            .group-container .leaf-line {
                position: relative;
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
            }
            .group-container .leaf-line > .leaf-children { flex-basis: 100%; margin-top: 6px; }
            .group-container .leaf-line {
                position: relative;
                display: flex;
                align-items: center;
            }
            /* 叶子的下一级：缩进 + 垂线（保留层级归属感） */
            .group-container .leaf-children {
                position: relative;
                margin: 6px 0 0 12px;
                padding-left: 18px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .group-container .leaf-children::before {
                content: '';
                position: absolute;
                left: 0;
                top: -8px;
                bottom: 12px;
                width: 1px;
                background: #cfcfcf;
            }
            /* 工具栏：贴节点右缘、垂直居中（锚在叶子文字行/枝干胶囊上） */
            .group-container .node-toolbar {
                display: none;
                align-items: center;
                gap: 5px;
                flex: none;
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 5;
                background: #fff;
                border: 1px solid #e3e3e3;
                border-radius: 999px;
                padding: 3px 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .group-container .node-toolbar.show { display: flex; }
            .group-container .node-toolbar button {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 1px solid #c9c9c9;
                background: #fff;
                color: #333;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                line-height: 1;
                padding: 0;
                cursor: pointer;
                transition: all 0.2s ease;
                flex: none;
            }
            .group-container .node-toolbar button:hover { background: #000; border-color: #000; color: #fff; }
            /* 编辑态：底部一条直线（开放），无外框无底色 */
            .group-container .editing {
                background: none !important;
                outline: none !important;
                box-shadow: none !important;
                border-radius: 0;
                border-bottom: 2px solid #000;
                caret-color: #000;
            }
        `;
        groupContainer.appendChild(style);

        // 根标题
        const banner = document.createElement('div');
        banner.className = 'root-banner';
        banner.textContent = this.data.name || '个人定表';
        groupContainer.appendChild(banner);

        // 顶层板块 → 分区卡（「妆发」总板块拆开：妆容、发型各一张卡，与色/料/型同构）
        const groupCards = [];
        (this.data.children || []).forEach(block => {
            if (block.name === '妆发' && block.children && block.children.length) {
                block.children.forEach(child => groupCards.push({ node: child, tag: '妆发' }));
            } else {
                groupCards.push({ node: block, tag: null });
            }
        });
        groupCards.forEach(({ node: block, tag }) => {
            const blockEl = document.createElement('div');
            blockEl.className = 'block';
            const header = document.createElement('div');
            header.className = 'block-header';
            const nameEl = document.createElement('span');
            nameEl.className = 'name';
            nameEl.textContent = block.name;
            nameEl.ondblclick = () => this.startGroupEdit(nameEl, block);
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            const branchCount = (block.children || []).length;
            tagEl.textContent = tag || (branchCount ? branchCount + ' 项' : '待补充');
            header.appendChild(nameEl);
            header.appendChild(tagEl);
            blockEl.appendChild(header);

            const body = document.createElement('div');
            body.className = 'block-body';
            // 鞋饰/造型刚需：扁平板块——枝干不胶囊分级，直接一条条直线行
            const flatBlock = block.name === '鞋饰' || block.name === '造型刚需';
            if (branchCount === 0) {
                body.appendChild(this.buildGroupBranchPlaceholder(block));
            } else {
                block.children.forEach(branch => {
                    body.appendChild(this.buildGroupBranch(branch, flatBlock));
                });
            }
            blockEl.appendChild(body);
            groupContainer.appendChild(blockEl);
        });

        this.container.appendChild(groupContainer);
        // 点击空白处收起工具栏
        groupContainer.addEventListener('click', () => this.hideGroupToolbars());
    }

    // 分组模式枝干行：左枝干胶囊，右叶子列；flat 为真时枝干不再胶囊分级，直接一条直线行
    buildGroupBranch(branch, flat) {
        const rowEl = document.createElement('div');
        rowEl.className = 'node-row';

        if (flat) {
            // 扁平板块：枝干 = 一条直线行（键/名左，底线，工具栏挂行上）
            const leavesEl = document.createElement('div');
            leavesEl.className = 'leaves single';
            const leafEl = document.createElement('div');
            leafEl.className = 'leaf chosen';
            const lineEl = document.createElement('div');
            lineEl.className = 'leaf-line';
            const kSpan = document.createElement('span');
            kSpan.className = 'g-k';
            kSpan.textContent = branch.name;
            kSpan.ondblclick = () => this.startGroupEdit(kSpan, branch);
            lineEl.appendChild(kSpan);
            const tb = this.makeGroupToolbar([
                { label: '＋', title: '添加条目', fn: () => this.addChild(null, branch) },
                { label: '✕', title: '删除该条目（含其下条目）', fn: () => this.deleteNode(null, branch) }
            ]);
            lineEl.appendChild(tb);
            leafEl.appendChild(lineEl);
            // 叶子（若有）作为直线行排在下方
            if (branch.children && branch.children.length) {
                const childrenEl = document.createElement('div');
                childrenEl.className = 'leaf-children';
                branch.children.forEach(child => {
                    childrenEl.appendChild(this.buildGroupLeaf(child, flat));
                });
                lineEl.appendChild(childrenEl);
            }
            leafEl.addEventListener('click', (e) => { e.stopPropagation(); this.toggleGroupToolbar(tb); });
            leavesEl.appendChild(leafEl);
            rowEl.appendChild(leavesEl);
            return rowEl;
        }

        const branchEl = document.createElement('div');
        branchEl.className = 'branch';
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = branch.name;
        pill.ondblclick = () => this.startGroupEdit(pill, branch);
        const tb = this.makeGroupToolbar([
            { label: '＋', title: '添加叶子', fn: () => this.addChild(null, branch) },
            { label: '✕', title: '删除该枝干', fn: () => this.deleteNode(null, branch) }
        ]);
        branchEl.appendChild(pill);
        branchEl.appendChild(tb);
        pill.addEventListener('click', (e) => { e.stopPropagation(); this.toggleGroupToolbar(tb); });
        rowEl.appendChild(branchEl);

        const leavesEl = document.createElement('div');
        const kidsArr = branch.children || [];
        // 绑定分台选择的枝干：无子级时把选中项显示为一张已选叶子（与树状模式的绑定显示同源）
        let boundSel = null;
        if (branch.bind) {
            const s = window.mindmapBoundDisplay(branch.bind, branch.bindMap, branch.bindSeason);
            if (s) boundSel = s;
        }
        if (kidsArr.length) {
            leavesEl.className = 'leaves' + (kidsArr.length === 1 ? ' single' : '');
            kidsArr.forEach(child => {
                leavesEl.appendChild(this.buildGroupLeaf(child, flat));
            });
        } else {
            leavesEl.className = 'leaves single';
            const leafEl = document.createElement('div');
            if (boundSel) {
                leafEl.className = 'leaf chosen';
                const lineEl = document.createElement('div');
                lineEl.className = 'leaf-line';
                const kSpan = document.createElement('span');
                kSpan.className = 'g-k';
                const rSpan = document.createElement('span');
                if (branch.bindAppend) {
                    kSpan.textContent = branch.name;
                    rSpan.className = 'g-r';
                    rSpan.textContent = boundSel;
                    lineEl.appendChild(rSpan);
                } else {
                    kSpan.textContent = boundSel;
                }
                lineEl.insertBefore(kSpan, lineEl.firstChild);
                leafEl.appendChild(lineEl);
            } else {
                leafEl.className = 'leaf pending';
                // 非扁平板块：等分台带入，文案用“待选择”；待填写只保留在鞋饰/造型刚需
                leafEl.textContent = flat ? '待填写' : '待选择';
            }
            leavesEl.appendChild(leafEl);
        }
        rowEl.appendChild(leavesEl);
        return rowEl;
    }

    // 空板块：居中的一个大号＋按钮（与其他情况的工具栏处理不同：不浮现、无长条）
    buildGroupBranchPlaceholder(block) {
        const rowEl = document.createElement('div');
        rowEl.className = 'node-row';
        const leavesEl = document.createElement('div');
        leavesEl.className = 'leaves single placeholder-row';
        const addWrap = document.createElement('div');
        addWrap.className = 'empty-add';
        const addBtn = document.createElement('button');
        addBtn.className = 'empty-add-btn';
        addBtn.textContent = '＋';
        addBtn.title = '添加条目';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addChild(null, block);
        });
        addWrap.appendChild(addBtn);
        leavesEl.appendChild(addWrap);
        rowEl.appendChild(leavesEl);
        return rowEl;
    }

    // 分组模式叶子（递归：含下一级）——方案D右对齐：键/结论左、选项值贴右缘；flat 时占位文案用“待填写”
    buildGroupLeaf(nodeData, flat) {
        const leafEl = document.createElement('div');
        leafEl.className = 'leaf' + (nodeData.placeholder ? ' pending' : ' chosen');

        const lineEl = document.createElement('div');
        lineEl.className = 'leaf-line';

        // 拆左右两栏：绑定优先，其次「｜」分隔，否则整段居左
        let kText = nodeData.name, rText = '';
        if (nodeData.bind) {
            const sel = window.mindmapBoundDisplay(nodeData.bind, nodeData.bindMap, nodeData.bindSeason);
            if (sel) {
                if (nodeData.bindAppend) { kText = nodeData.name; rText = sel; }
                else { kText = sel; }
            }
        } else {
            const sepIdx = nodeData.name.indexOf('｜');
            if (sepIdx > -1) {
                kText = nodeData.name.slice(0, sepIdx).trim();
                rText = nodeData.name.slice(sepIdx + 1).trim();
            }
        }
        if (nodeData.placeholder) kText = `${flat ? '待填写' : '待选择'} · ${kText}`;

        const kSpan = document.createElement('span');
        kSpan.className = 'g-k';
        kSpan.textContent = kText;
        lineEl.appendChild(kSpan);
        if (rText) {
            const rSpan = document.createElement('span');
            rSpan.className = 'g-r';
            rSpan.textContent = rText;
            lineEl.appendChild(rSpan);
        }
        kSpan.ondblclick = () => this.startGroupEdit(kSpan, nodeData);

        const tb = this.makeGroupToolbar([
            { label: '⇊', title: '添加下一级', fn: () => this.addChild(null, nodeData) },
            { label: '＋', title: '添加同级叶子', fn: () => this.addGroupSibling(nodeData) },
            { label: '✕', title: '删除', fn: () => this.deleteNode(null, nodeData) }
        ]);
        lineEl.appendChild(tb);
        leafEl.appendChild(lineEl);
        leafEl.addEventListener('click', (e) => { e.stopPropagation(); this.toggleGroupToolbar(tb); });

        if (nodeData.children && nodeData.children.length) {
            const childrenEl = document.createElement('div');
            childrenEl.className = 'leaf-children';
            nodeData.children.forEach(child => {
                childrenEl.appendChild(this.buildGroupLeaf(child));
            });
            lineEl.appendChild(childrenEl);
        }
        return leafEl;
    }

    makeGroupToolbar(buttons) {
        const tb = document.createElement('div');
        tb.className = 'node-toolbar';
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            btn.title = b.title;
            btn.addEventListener('click', (e) => { e.stopPropagation(); b.fn(); });
            tb.appendChild(btn);
        });
        return tb;
    }

    toggleGroupToolbar(tb) {
        const wasOpen = tb.classList.contains('show');
        this.hideGroupToolbars();
        if (!wasOpen) tb.classList.add('show');
    }

    hideGroupToolbars() {
        this.container.querySelectorAll('.group-container .node-toolbar.show').forEach(t => t.classList.remove('show'));
    }

    // 删除整个空板块（仅空板块的长条工具栏提供；绕过固定节点保护，因为内容为空、损失为零）
    deleteGroupBlock(block) {
        if (block.children && block.children.length) {
            alert('该板块下已有内容，请在树状/大纲模式下处理');
            return;
        }
        if (!confirm(`确定删除整个「${block.name}」板块吗？`)) return;
        const idx = (this.data.children || []).indexOf(block);
        if (idx > -1) {
            this.data.children.splice(idx, 1);
            this.saveData();
            this.render();
        }
    }

    // 分组模式「＋同级」：插到本叶后面（与树状模式的 addSibling 同语义，但不依赖 DOM 定位）
    addGroupSibling(nodeData) {
        const findParent = (parentData, children) => {
            for (let i = 0; i < children.length; i++) {
                if (children[i] === nodeData) return { siblings: children, index: i };
                if (children[i].children) {
                    const found = findParent(children[i], children[i].children);
                    if (found) return found;
                }
            }
            return null;
        };
        const found = findParent(this.data, this.data.children || []);
        if (found) {
            found.siblings.splice(found.index + 1, 0, { name: '新节点', children: [] });
            this.saveData();
            this.render();
        }
    }

    // 分组模式编辑：光标落末尾 + 底线编辑态（样本定稿交互）
    startGroupEdit(el, nodeData) {
        if (el.isContentEditable) return;
        this.hideGroupToolbars();
        const original = nodeData.name;
        el.contentEditable = 'true';
        el.spellcheck = false;
        el.classList.add('editing');
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const finish = () => {
            const v = (el.innerText || '').trim().replace(/\s*\n\s*/g, ' ');
            el.contentEditable = 'false';
            el.classList.remove('editing');
            el.removeEventListener('keydown', onKey);
            el.removeEventListener('blur', onBlur);
            if (v && v !== original) {
                nodeData.name = v;
                nodeData.placeholder = false;
                this.saveData();
            }
            this.render();
        };
        const onKey = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
            else if (e.key === 'Escape') { el.innerText = original; el.blur(); }
        };
        const onBlur = () => finish();
        el.addEventListener('keydown', onKey);
        el.addEventListener('blur', onBlur);
    }

    // 分组模式枝干胶囊对齐：胶囊垂直对齐中间叶行（叶子行已无框无竖脊，仅保留胶囊对齐）
    alignGroupConnectors() {
        const root = this.container.querySelector('.group-container');
        if (!root) return;
        const savedTransform = root.style.transform;
        root.style.transform = 'none';
        this.container.querySelectorAll('.group-container .node-row').forEach(row => {
            const leaves = row.querySelector(':scope > .leaves');
            if (!leaves) return;
            const kids = Array.from(leaves.querySelectorAll(':scope > .leaf'));
            if (!kids.length) return;
            const pill = row.querySelector(':scope > .branch > .pill');
            if (!pill) return;
            const anchor = kids[Math.ceil(kids.length / 2) - 1];
            const anchorRect = anchor.getBoundingClientRect();
            const rowTop = row.getBoundingClientRect().top;
            const anchorCenter = anchorRect.top - rowTop + anchorRect.height / 2;
            pill.style.marginTop = (anchorCenter - pill.getBoundingClientRect().height / 2) + 'px';
        });
        root.style.transform = savedTransform;
    }

    renderTree() {
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            /* ===== 树状模式：横向树（父框在左，子框并列在右，竖直排开） ===== */
            .tree-container {
                max-width: 640px;
                margin: 0 auto;
                padding: 16px 8px;
            }
            .tree-container .mind-node {
                display: flex;
                align-items: center;
            }
            .tree-container .mind-node-row {
                display: flex;
                align-items: center;
                flex: none;
                position: relative; /* 短横线锚定在方框自身的垂直中心，而不是含子树的整体中心 */
                padding: 9px 20px;
                border: 1px solid #999;
                border-radius: 6px;
                background: #fff;
                white-space: nowrap;
            }
            /* "待填写"占位卡位：灰态 */
            .tree-container .mind-node.placeholder > .mind-node-row {
                border: 1px dashed #bbb;
                background: #f7f7f7;
            }
            .tree-container .mind-node.placeholder .node-text {
                color: #999;
            }
            .tree-container .mind-node[data-level="0"] > .mind-node-row {
                font-size: 20px;
                font-weight: bold;
                background: #000;
                color: #fff;
                border-color: #000;
            }
            /* 二级（妆发/色/料/型/鞋饰/造型刚需）：浅灰底 */
            .tree-container .mind-node[data-level="1"] > .mind-node-row {
                background: #f0f0f0;
            }
            /* 三级及以后：取消外边框 */
            .tree-container .mind-node[data-level="2"] > .mind-node-row,
            .tree-container .mind-node[data-level="3"] > .mind-node-row,
            .tree-container .mind-node[data-level="4"] > .mind-node-row,
            .tree-container .mind-node[data-level="5"] > .mind-node-row {
                border: none;
                background: #fff;
                box-shadow: none;
            }
            /* 妆容/发型：单独保留有框 + 浅灰底 */
            .tree-container .mind-node.framed-node > .mind-node-row {
                border: 1px solid #e3ded2 !important;
                background: #f0f0f0 !important;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            }

            .tree-container .node-dot {
                display: none;
            }
            /* 子级：在父框右侧竖直排开 */
            .tree-container .children-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 14px;
                margin-left: 46px;
                position: relative;
            }

            /* 连接线由SVG整层绘制：方框浮在图层上方 */
            .tree-container {
                position: relative;
            }
            .tree-container .mind-node {
                position: relative;
                z-index: 1;
            }
            .tree-container .tree-lines-svg {
                position: absolute;
                left: 0;
                top: 0;
                pointer-events: none;
                z-index: 0;
            }
            /* 子框连接线已由SVG整层绘制，无需伪元素 */
            .tree-container .children-container .mind-node {
                position: relative;
            }
            .tree-container .node-toolbar {
                margin-left: 10px;
                display: flex;
                align-items: center;
                gap: 6px;
                flex: none; /* 编辑长文字时禁止被文字挤压缩小，否则按钮会被压成 0×0 消失 */
            }
            .tree-container .node-toolbar button {
                width: 24px;
                height: 24px;
                flex: none;
                border-radius: 50%;
                border: 1px solid #c9c9c9;
                background: #fff;
                color: #333;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                line-height: 1;
                padding: 0;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .tree-container .node-toolbar button:hover:not(:disabled) {
                background: #000;
                border-color: #000;
                color: #fff;
            }
            .tree-container .node-toolbar button:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
        `;
        this.container.appendChild(style);

        // 渲染根节点
        const rootNode = this.createNode(this.data, null, 0);
        treeContainer.appendChild(rootNode);

        this.container.appendChild(treeContainer);
    }

    renderOutline() {
        const outlineContainer = document.createElement('div');
        outlineContainer.className = 'outline-container';

        // 大纲模式样式：同级节点对齐在一条竖线上，下一级向右缩进
        const style = document.createElement('style');
        style.textContent = `
            /* ===== 大纲模式：圆点 + 先竖线后短横线的叉状连接 ===== */
            .outline-container {
                max-width: 640px;
                margin: 0 auto;
                padding: 8px 24px 8px 56px;
            }
            .outline-container .mind-node {
                margin: 6px 0;
            }
            .outline-container .mind-node-row {
                display: flex;
                align-items: center;
                position: relative;
                padding: 6px 10px;
                border-radius: 4px;
            }
            /* "待填写"占位卡位：灰态 */
            .outline-container .mind-node.placeholder > .mind-node-row {
                border: 1px dashed #bbb;
                background: #f7f7f7;
            }
            .outline-container .mind-node.placeholder .node-text {
                color: #999;
            }
            .outline-container .node-content {
                cursor: pointer;
                flex: none;
                min-width: 60px;
                max-width: 100%;
                display: inline-flex;
                align-items: center;
            }
            /* 长文字折行：不撑破容器，圆点与首行保持对齐 */
            .outline-container .node-text {
                word-break: break-word;
                white-space: normal;
            }
            .outline-container .mind-node-row {
                max-width: 100%;
            }
            .outline-container .node-dot {
                flex: none;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background: #333;
                margin-right: 10px;
            }
            .outline-container .mind-node[data-level="0"] > .mind-node-row .node-dot {
                width: 12px;
                height: 12px;
                background: #000;
            }
            /* 子级竖线：从父节点下方垂下 */
            .outline-container .mind-node[data-level="0"] > .mind-node-row .node-content {
                font-size: 20px;
                font-weight: bold;
            }
            .outline-container .children-container {
                margin-left: 5px;
                padding-left: 32px;
                border-left: 1px solid #bbb;
            }
            /* 大纲模式：仅保留竖线，短横线已移除 */
            .outline-container .node-toolbar {
                margin-left: 10px;
                display: flex;
                align-items: center;
                gap: 6px;
                flex: none; /* 编辑长文字时禁止被文字挤压缩小 */
            }
            .outline-container .node-toolbar button {
                width: 24px;
                height: 24px;
                flex: none;
                border-radius: 50%;
                border: 1px solid #c9c9c9;
                background: #fff;
                color: #333;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                line-height: 1;
                padding: 0;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .outline-container .node-toolbar button:hover:not(:disabled) {
                background: #000;
                border-color: #000;
                color: #fff;
            }
            .outline-container .node-toolbar button:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
        `;
        this.container.appendChild(style);

        // 渲染根节点
        const rootNode = this.createNode(this.data, null, 0);
        outlineContainer.appendChild(rootNode);

        this.container.appendChild(outlineContainer);
    }

    createNode(nodeData, parent, level) {
        const node = document.createElement('div');
        node.className = 'mind-node';
        node.dataset.level = level;

        // 节点内容（圆点 + 文字，圆点仅在树状模式显示）
        const content = document.createElement('div');
        content.className = 'node-content';

        const dot = document.createElement('span');
        dot.className = 'node-dot';

        const text = document.createElement('span');
        text.className = 'node-text';
        // 绑定分台选择的固定节点：显示选中的文字（未选择时显示类别名）
        let displayText = nodeData.name;
        if (nodeData.bind) {
            const sel = window.mindmapBoundDisplay(nodeData.bind, nodeData.bindMap, nodeData.bindSeason);
            if (sel) displayText = nodeData.bindAppend ? `${nodeData.name} | ${sel}` : sel;
        }
        // "待填写"占位卡位：灰态显示提示文字，填写后恢复正常
        if (nodeData.plain) node.className += ' plain-node';
        if (nodeData.frame) node.className += ' framed-node';
        if (nodeData.placeholder) {
            node.className += ' placeholder';
            text.textContent = `待填写 · ${displayText}`;
        } else {
            text.textContent = displayText;
        }

        content.appendChild(dot);
        content.appendChild(text);
        content.ondblclick = () => this.startEdit(node, nodeData);
        content.onclick = (e) => {
            e.stopPropagation();
            this.selectNode(node, nodeData);
        };

        // 工具栏（选中时显示）
        const toolbar = document.createElement('div');
        toolbar.className = 'node-toolbar';
        toolbar.style.display = 'none';

        const addChildBtn = document.createElement('button');
        addChildBtn.textContent = '＋';
        addChildBtn.title = '添加子节点';
        addChildBtn.onclick = () => this.addChild(node, nodeData);

        const addSiblingBtn = document.createElement('button');
        addSiblingBtn.textContent = '⇊';
        addSiblingBtn.title = '添加同级节点（在下方）';
        addSiblingBtn.onclick = () => this.addSibling(node, nodeData);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.title = '删除节点';
        deleteBtn.onclick = () => this.deleteNode(node, nodeData);

        toolbar.appendChild(addChildBtn);
        toolbar.appendChild(addSiblingBtn);
        toolbar.appendChild(deleteBtn);

        // 行容器：文字与工具按钮在同一行，子级在下方（保证缩进竖线挂在文字下方）
        const row = document.createElement('div');
        row.className = 'mind-node-row';
        row.appendChild(content);
        row.appendChild(toolbar);

        node.appendChild(row);

        // 如果有子节点，递归渲染
        if (nodeData.children && nodeData.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';

            nodeData.children.forEach(child => {
                const childNode = this.createNode(child, nodeData, level + 1);
                childrenContainer.appendChild(childNode);
            });

            node.appendChild(childrenContainer);
        }

        return node;
    }

    toggleMode() {
        this.mode = this.mode === 'tree' ? 'outline' : 'tree';
        this.render();
    }

    selectNode(node, nodeData) {
        // 取消之前选中的节点
        if (this.selectedNode) {
            this.selectedNode.querySelector('.node-toolbar').style.display = 'none';
        }

        // 选中当前节点
        node.querySelector('.node-toolbar').style.display = 'block';
        this.selectedNode = node;

        // 检查是否为固定节点
        const fixedNodes = ['妆发', '色', '料', '型', '鞋饰', '造型刚需'];
        const isFixed = fixedNodes.includes(nodeData.name);
        node.querySelector('.node-toolbar button:last-child').disabled = isFixed;
    }

    // 读取分台选择：图片类选择提取卡牌文字（如 1.圆形脸.png → 圆形脸）；
    // 进阶表格类（{data:{...}}）返回组合文字
    // 自身体型 → 定表展示文字（外轮廓描述）
    bodyTypeDisplay(name) {
        return MINDMAP_BODY_MAP[name] || name;
    }

    resolveBoundSelection(key) {
        try {
            const d = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(d) && d[0] && d[0].src) {
                const name = decodeURIComponent(d[0].src).split('/').pop().replace(/.[^.]+$/, '');
                return name.replace(/^[0-9]+[.s]*/, '');
            }
            if (d && d.data) {
                const t = d.data;
                return `${t.inner}${t.outer}${t.bottom}${t.shoes}（${t.id}）`;
            }
        } catch (e) { /* 未选择或数据异常 */ }
        return null;
    }

    startEdit(node, nodeData) {
        const content = node.querySelector('.node-content');
        const textEl = content.querySelector('.node-text');
        // 已在编辑中，避免双击重复进入
        if (!textEl || textEl.isContentEditable) return;
        const currentValue = nodeData.name;

        // 直接让原文字元素原地进入编辑态：不新建元素、不复制样式，文字渲染零变化
        textEl.contentEditable = 'true';
        textEl.spellcheck = false;
        // 仅加一圈边框与白底示意编辑状态（不影响文字本身的字号/位置）
        textEl.style.outline = '1px solid #000';
        textEl.style.outlineOffset = '2px';
        textEl.style.background = '#fff';
        textEl.style.cursor = 'text';
        textEl.style.whiteSpace = 'pre-wrap';
        textEl.style.wordBreak = 'break-all';

        // 手机端大纲模式：改用块级布局保证编辑框为通栏长条。
        // 块级元素宽度天然占满父容器，不依赖flex收缩计算（flex方案在部分手机上不生效）
        if (content.closest('.outline-container') && window.matchMedia('(max-width: 768px)').matches) {
            const rowEl = content.parentElement;
            if (rowEl) rowEl.style.display = 'block';
            content.style.display = 'block';
            content.style.position = 'relative';
            content.style.width = '100%';
            const dotEl = content.querySelector('.node-dot');
            if (dotEl) {
                dotEl.style.position = 'absolute';
                dotEl.style.left = '0';
                dotEl.style.top = '50%';
                dotEl.style.transform = 'translateY(-50%)';
                dotEl.style.marginRight = '0';
            }
            textEl.style.display = 'block';
            textEl.style.width = '100%';
            textEl.style.boxSizing = 'border-box';
            textEl.style.paddingLeft = '26px';
            const tb = rowEl && rowEl.querySelector('.node-toolbar');
            if (tb && tb.style.display !== 'none') {
                tb.style.display = 'flex';
                tb.style.marginTop = '6px';
            }
        } else {
            content.style.flex = '1 1 auto';
        }
        content.style.minWidth = '0';
        content.style.whiteSpace = 'normal';

        // 聚焦并全选
        textEl.focus();
        const range = document.createRange();
        range.selectNodeContents(textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        // 编辑舒适度：足够宽的编辑区 + 内边距与行高，长文字不拥挤；
        // 光标颜色与阴影让编辑态一眼可辨，脱离原节点框也不显突廆
        textEl.style.minWidth = '220px';
        textEl.style.padding = '2px 8px';
        textEl.style.lineHeight = '1.6';
        textEl.style.borderRadius = '4px';
        textEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)';
        textEl.style.caretColor = '#000';

        // 处理输入完成（render()会整体重建节点，临时样式随之消失）
        const finishEdit = () => {
            const newValue = (textEl.innerText || '').trim().replace(/\s*\n\s*/g, ' ');
            if (newValue && newValue !== currentValue) {
                nodeData.name = newValue;
                // 占位卡位填写完成后转为正常节点
                nodeData.placeholder = false;
                this.saveData();
            }
            this.render();
        };

        textEl.addEventListener('blur', finishEdit);
        textEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                textEl.blur();
            } else if (e.key === 'Escape') {
                textEl.innerText = currentValue;
                textEl.blur();
            }
        });
    }

    addChild(node, nodeData) {
        const newNode = {
            name: '新节点',
            children: []
        };

        if (!nodeData.children) {
            nodeData.children = [];
        }

        nodeData.children.push(newNode);
        this.saveData();
        this.render();
    }

    addSibling(node, nodeData) {
        // 找到父节点的索引
        let parent = null;
        let siblings = null;
        let index = -1;

        // 如果是根节点
        if (nodeData === this.data) {
            siblings = this.data.children;
            index = siblings.indexOf(nodeData);
        } else {
            // 查找父节点
            const findParent = (parentData, children) => {
                for (let i = 0; i < children.length; i++) {
                    if (children[i] === nodeData) {
                        parent = parentData;
                        siblings = children;
                        index = i;
                        return true;
                    }
                    if (children[i].children && findParent(children[i], children[i].children)) {
                        return true;
                    }
                }
                return false;
            };

            findParent(this.data, this.data.children);
        }

        if (siblings) {
            const newNode = {
                name: '新节点',
                children: []
            };

            siblings.splice(index + 1, 0, newNode);
            this.saveData();
            this.render();
        }
    }

    deleteNode(node, nodeData) {
        // 检查是否为固定节点
        const fixedNodes = ['妆发', '色', '料', '型', '鞋饰', '造型刚需'];
        if (fixedNodes.includes(nodeData.name)) {
            alert('固定节点不能删除');
            return;
        }

        // 确认删除
        if (confirm('确定要删除这个节点吗？')) {
            // 找到父节点的索引
            let parent = null;
            let siblings = null;
            let index = -1;

            // 如果是根节点
            if (nodeData === this.data) {
                alert('不能删除根节点');
                return;
            } else {
                // 查找父节点
                const findParent = (parentData, children) => {
                    for (let i = 0; i < children.length; i++) {
                        if (children[i] === nodeData) {
                            parent = parentData;
                            siblings = children;
                            index = i;
                            return true;
                        }
                        if (children[i].children && findParent(children[i], children[i].children)) {
                            return true;
                        }
                    }
                    return false;
                };

                findParent(this.data, this.data.children);
            }

            if (siblings) {
                siblings.splice(index, 1);
                this.saveData();
                this.render();
            }
        }
    }

    saveData() {
        localStorage.setItem('mindMapData', JSON.stringify(this.data));
    }

    exportToImage() {
        // 手机端：Canvas按数据重画（html2canvas在手机端重新排版易错位，弃用）
        if (window.matchMedia('(max-width: 768px)').matches) {
            this.exportByCanvasDrawing();
            return;
        }

        // 使用 html2canvas 导出图片
        if (typeof html2canvas === 'undefined') {
            alert('请先引入 html2canvas 库');
            return;
        }

        // 只截取导图正文（分组/树状/大纲容器），不包含切换与导出按钮
        const target = this.container.querySelector('.tree-container') ||
                       this.container.querySelector('.outline-container') ||
                       this.container.querySelector('.group-container');
        if (!target) {
            alert('未找到导图内容');
            return;
        }

        // 导出前取消选中态，避免工具按钮（+/++/×）出现在图里
        if (this.selectedNode) {
            const tb = this.selectedNode.querySelector('.node-toolbar');
            if (tb) tb.style.display = 'none';
            this.selectedNode = null;
        }
        // 分组模式的工具栏用 .show 类控制，导出前一并收起
        this.container.querySelectorAll('.node-toolbar.show').forEach(t => t.classList.remove('show'));

        // 直接对页面上的真实导图截图（避免克隆导致深层级丢失）：
        // 临时解除宽度限制，按完整内容尺寸（含溢出部分）指定截取区域，保证最深层级不被裁掉
        const scale = 2;
        const oldMaxWidth = target.style.maxWidth;
        const oldPadding = target.style.padding;
        target.style.maxWidth = 'none';
        target.style.padding = '20px';
        // 宽度锁定为完整内容宽度（含溢出）：小数布局会让SVG连线与方框在导出时错位，溢出内容会被默认裁切
        target.style.width = Math.round(Math.max(
            target.scrollWidth,
            target.offsetWidth,
            target.getBoundingClientRect().width
        )) + 'px';

        // 手机端树状模式：导出期间去掉"整棵缩放适配屏幕"的transform。
        // html2canvas对带小数scale的元素渲染时，SVG连线/方框/文字各层坐标不一致，会错位且文字扭曲
        const isTreeWithZoom = this.mode === 'tree' && this._treeZoom;
        let savedTransform = null, savedHeight = null;
        if (isTreeWithZoom) {
            savedTransform = target.style.transform;
            savedHeight = target.style.height;
        }
        const clearTreeZoomForExport = () => {
            if (!isTreeWithZoom) return;
            target.style.transform = 'none';
            target.style.height = '';
        };
        clearTreeZoomForExport();

        const captureW = Math.max(target.scrollWidth, target.offsetWidth) + 40; // 留余量防边缘裁切
        const captureH = Math.max(target.scrollHeight, target.offsetHeight) + 40;

        // 布局已因临时样式改变，先按新布局重算连接线，避免线与框错位
        this.adjustTreeConnectors();
        // adjustTreeConnectors结尾会恢复缩放transform，导出前再次清掉
        clearTreeZoomForExport();

        // 电脑端：直接对元素整体截图（不传窗口坐标，避免滚动偏移导致的错位/空白）
        html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: scale,
            useCORS: true,
            logging: false
        }).then(srcCanvas => {
            // html2canvas 在本地 file:// 环境可能输出空白画布（0×0，克隆iframe加载样式失败）：
            // 检测到空画布时改用 Canvas 重画兜底，保证导出一定成功
            if (!srcCanvas.width || !srcCanvas.height) {
                this.exportByCanvasDrawing(true);
                return;
            }
            // 计算正文实际边界（所有方框的包围盒），剔除右侧/下方的空白
            const targetRect = target.getBoundingClientRect();
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            target.querySelectorAll('.mind-node-row').forEach(row => {
                const r = row.getBoundingClientRect();
                minX = Math.min(minX, r.left - targetRect.left);
                minY = Math.min(minY, r.top - targetRect.top);
                maxX = Math.max(maxX, r.right - targetRect.left);
                maxY = Math.max(maxY, r.bottom - targetRect.top);
            });
            if (minX === Infinity) { minX = 0; minY = 0; maxX = srcCanvas.width / scale; maxY = srcCanvas.height / scale; }

            // 包围盒四周各放宽8px，防止边缘内容被裁掉
            const edge = 8;
            minX = Math.max(0, minX - edge);
            minY = Math.max(0, minY - edge);
            maxX = Math.min(srcCanvas.width / scale, maxX + edge);
            maxY = Math.min(srcCanvas.height / scale, maxY + edge);

            const contentW = (maxX - minX) * scale;
            const contentH = (maxY - minY) * scale;

            // 画布尺寸：正文四周各留80px白边，向上取整到100的整数倍；最小1000×750
            const pad = 80 * scale;
            const step = 100 * scale;
            const w = Math.max(1000 * scale, Math.ceil((contentW + pad * 2) / step) * step);
            const h = Math.max(750 * scale, Math.ceil((contentH + pad * 2) / step) * step);

            const out = document.createElement('canvas');
            out.width = w;
            out.height = h;
            const ctx = out.getContext('2d');

            // 其余部分补白色
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            // 正文裁剪后严格居中绘制
            ctx.drawImage(srcCanvas,
                minX * scale, minY * scale, contentW, contentH,
                Math.round((w - contentW) / 2), Math.round((h - contentH) / 2), contentW, contentH);

            const link = document.createElement('a');
            link.download = '思维导图.png';
            link.href = out.toDataURL('image/png');

            // 手机端：直接下载不可靠，改为弹出大图提示长按保存
            if (window.matchMedia('(max-width: 768px)').matches) {
                this.showMobileExportOverlay(out.toDataURL('image/png'));
            } else {
                link.click();
            }
        }).catch(() => {
            // html2canvas 失败（网络/环境问题）时改用 Canvas 重画兜底
            this.exportByCanvasDrawing(true);
        }).finally(() => {
            // 恢复原样并重绘
            target.style.maxWidth = oldMaxWidth;
            target.style.padding = oldPadding;
            target.style.width = '';
            if (this.mode === 'tree') {
                if (savedTransform !== null) {
                    target.style.transform = savedTransform;
                    target.style.height = savedHeight;
                }
                this.adjustTreeConnectors();
            }
        });
    }

    // 手机端导出：不用html2canvas截屏，直接按导图数据用Canvas重画。
    // 坐标全部自行计算，连线/方框/文字天然对齐；文本过长自动折行。
    // directDownload=true（电脑端兑底）：直接触发下载，不弹长按保存浮层
    exportByCanvasDrawing(directDownload) {
        const scale = 2;
        const isTree = this.mode === 'tree';
        const data = this.data;
        const ctxm = document.createElement('canvas').getContext('2d');
        const FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

        const displayTextOf = (nd) => {
            let t = nd.name;
            if (nd.bind && window.mindmapBoundDisplay) {
                const sel = window.mindmapBoundDisplay(nd.bind, nd.bindMap, nd.bindSeason);
                if (sel) t = nd.bindAppend ? `${nd.name} | ${sel}` : sel;
            }
            return nd.placeholder ? `待填写 · ${t}` : t;
        };
        const textW = (t, font) => { ctxm.font = font; return ctxm.measureText(t).width; };
        const wrapText = (t, font, maxW) => {
            ctxm.font = font;
            const lines = [];
            let line = '';
            for (const ch of t) {
                if (line && ctxm.measureText(line + ch).width > maxW) { lines.push(line); line = ch; }
                else line += ch;
            }
            if (line) lines.push(line);
            return lines.length ? lines : [''];
        };
        const roundRect = (ctx, x, y, w, h, r) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        };

        let cw = 0, chh = 0;
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');

        if (this.mode === 'group') {
            // ===== 分组模式：分区卡纵向排布，卡内枝干在左、叶子在右 =====
            const FB = `bold 20px ${FONT_FAMILY}`;
            const FH = `bold 15px ${FONT_FAMILY}`;
            const FP = `bold 13px ${FONT_FAMILY}`;
            const FL = `12px ${FONT_FAMILY}`;
            const FT = `12px ${FONT_FAMILY}`;
            const PADX = 12, PADY = 8, GAPB = 22, GAPR = 10, GAPL = 6;
            const PILLW = 100, LEAFMAX = 300, W = 520, LX = 16, LW = W - 32;

            // 方案D 两栏行式布局：键左、值右、嵌套缩进递归
            const leafRowLayout = (kids, level, out, flat) => {
                kids.forEach(nd => {
                    let kText = nd.name, rText = '';
                    if (nd.bind && window.mindmapBoundDisplay) {
                        const sel = window.mindmapBoundDisplay(nd.bind, nd.bindMap, nd.bindSeason);
                        if (sel) {
                            if (nd.bindAppend) { kText = nd.name; rText = sel; } else { kText = sel; }
                        }
                    } else {
                        const si = nd.name.indexOf('｜');
                        if (si > -1) { kText = nd.name.slice(0, si).trim(); rText = nd.name.slice(si + 1).trim(); }
                    }
                    if (nd.placeholder) kText = `${flat ? '待填写' : '待选择'} · ${kText}`;
                    const indent = level * 16;
                    const availW = LEAFMAX + 40 - PADX * 2 - indent;
                    const kLines = textW(kText, FL) > availW * 0.6 ? wrapText(kText, FL, availW * 0.6) : [kText];
                    let rLines = [];
                    if (rText) {
                        const maxR = availW * 0.4;
                        rLines = textW(rText, FL) > maxR ? wrapText(rText, FL, maxR) : [rText];
                    }
                    const row = { nd, level, indent, kLines, rText, rLines, pending: !!nd.placeholder,
                        h: Math.max(kLines.length, rLines.length) * 18 + PADY * 2 + 4 };
                    const startIdx = out.length;
                    out.push(row);
                    if (nd.children && nd.children.length) {
                        leafRowLayout(nd.children, level + 1, out, flat);
                        row.cStart = startIdx + 1;
                        row.cEnd = out.length - 1;
                    }
                });
                return out;
            };

            const blocks = [];
            (data.children || []).forEach(block => {
                if (block.name === '妆发' && block.children && block.children.length) {
                    // 「妆发」总板块拆开：妆容、发型各一张卡
                    block.children.forEach(child => blocks.push({ node: child, tag: '妆发' }));
                } else {
                    blocks.push({ node: block, tag: null });
                }
            });
            const bl = blocks.map(b0 => {
                const block = b0.node;
                const hasKids = block.children && block.children.length;
                const isFlat = block.name === '鞋饰' || block.name === '造型刚需';
                const rows = (hasKids ? block.children : []).map(br => {
                    const leaves = leafRowLayout(br.children || [], 0, [], isFlat);
                    const leavesH = leaves.reduce((s, l, i) => s + l.h + (i ? GAPL : 0), 0);
                    if (isFlat) {
                        // 扁平板块：枝干直线行（30px）+ 叶子直线行
                        return { br, flat: true, leaves, h: 30 + (leaves.length ? 6 + leavesH : 0) };
                    }
                    const pillH = 20 + PADY * 2;
                    return { br, leaves, pillH, h: Math.max(pillH, leavesH) };
                });
                const bodyH = rows.length
                    ? Math.max(rows.reduce((s, r, i) => s + r.h + (i ? GAPR : 0), 0) + 14, 40)
                    : 64;
                const headH = 34;
                return { block, tag: b0.tag, rows, hasKids, headH, bodyH, h: headH + bodyH + 16 };
            });

            cw = W;
            chh = Math.ceil(56 + bl.reduce((s, b) => s + b.h + GAPB, 0) + 6);
            c.width = cw * scale;
            c.height = chh * scale;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, cw, chh);

            // 根标题
            ctx.fillStyle = '#2f2a26';
            ctx.font = FB;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.name || '个人定表', W / 2, 22);
            ctx.fillStyle = '#000';
            ctx.fillRect(W / 2 - 18, 40, 36, 3);
            ctx.textAlign = 'left';

            let y0 = 56;
            bl.forEach(b => {
                // 区块卡外框
                roundRect(ctx, LX, y0, LW, b.h, 12);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = '#e7e7e7';
                ctx.lineWidth = 1;
                ctx.stroke();
                // 头部底色（上圆角）：画一个圆角矩形再用白矩形盖掉下半
                roundRect(ctx, LX, y0, LW, b.headH, 12);
                ctx.fillStyle = '#fafafa';
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(LX, y0 + b.headH - 12, LW, 12);
                ctx.strokeStyle = '#efefef';
                ctx.beginPath();
                ctx.moveTo(LX, y0 + b.headH);
                ctx.lineTo(LX + LW, y0 + b.headH);
                ctx.stroke();
                // 区块名 + 右缘标签
                ctx.fillStyle = '#222';
                ctx.font = FH;
                ctx.textBaseline = 'middle';
                ctx.fillText(b.block.name, LX + 16, y0 + b.headH / 2);
                const tagText = b.tag || (b.hasKids ? b.rows.length + ' 项' : '待补充');
                const tagW = textW(tagText, FT) + 20;
                roundRect(ctx, LX + LW - tagW - 12, y0 + b.headH / 2 - 9, tagW, 18, 9);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = '#d5d5d5';
                ctx.stroke();
                ctx.fillStyle = '#999';
                ctx.font = FT;
                ctx.fillText(tagText, LX + LW - tagW - 12 + 10, y0 + b.headH / 2);

                // 空板块：居中的一个大号＋（虚线圆，与其他情况不同）
                if (!b.hasKids) {
                    const cx = LX + LW / 2;
                    const cy = y0 + b.headH + (b.bodyH) / 2;
                    ctx.setLineDash([5, 4]);
                    ctx.strokeStyle = '#b5b5b5';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#888';
                    ctx.font = `20px ${FONT_FAMILY}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('＋', cx, cy + 1);
                    ctx.textAlign = 'left';
                    y0 += b.h + GAPB;
                    return;
                }

                let ry = y0 + b.headH + 7;
                // 叶子直线行绘制（方案D：键左、值右贴缘、整行底线；嵌套缩进+垂线），返回绘制后的纵坐标
                const drawLeafRows = (leaves, lx0, lw, lyStart) => {
                    let ly = lyStart;
                    leaves.forEach((leaf) => { leaf.y = ly; ly += leaf.h + GAPL; });
                    ly = lyStart;
                    leaves.forEach((leaf, i) => {
                        const rx = lx0 + leaf.indent;
                        const rw = lw - leaf.indent;
                        ctx.fillStyle = leaf.pending ? '#aaa' : '#000';
                        ctx.font = FL;
                        ctx.textAlign = 'left';
                        let ty = ly + PADY + 9;
                        leaf.kLines.forEach(ln => {
                            ctx.fillText(ln, rx, ty);
                            ty += 18;
                        });
                        if (leaf.rText) {
                            ctx.textAlign = 'right';
                            ctx.fillStyle = leaf.pending ? '#aaa' : '#000';
                            let ty2 = ly + PADY + 9;
                            leaf.rLines.forEach(ln => {
                                ctx.fillText(ln, rx + rw, ty2);
                                ty2 += 18;
                            });
                            ctx.textAlign = 'left';
                        }
                        if (!leaf.pending) {
                            ctx.strokeStyle = '#999';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(rx, ly + leaf.h - 3);
                            ctx.lineTo(rx + rw, ly + leaf.h - 3);
                            ctx.stroke();
                        }
                        ly += leaf.h + (i < leaves.length - 1 ? GAPL : 0);
                    });
                    leaves.forEach(leaf => {
                        if (leaf.cStart !== undefined) {
                            const vx = lx0 + leaf.indent + 8;
                            const lastChild = leaves[leaf.cEnd];
                            ctx.strokeStyle = '#cfcfcf';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(vx, leaf.y + leaf.h);
                            ctx.lineTo(vx, lastChild.y + lastChild.h / 2);
                            ctx.stroke();
                        }
                    });
                    return ly;
                };
                b.rows.forEach(row => {
                    const bx = LX + 14;
                    if (row.flat) {
                        // 扁平板块：枝干直线行（无胶囊）+ 叶子直线行
                        const lx0 = bx;
                        const lw = LEAFMAX + 40;
                        ctx.fillStyle = '#000';
                        ctx.font = FP;
                        ctx.textAlign = 'left';
                        ctx.fillText(row.br.name, lx0, ry + 15);
                        ctx.strokeStyle = '#999';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(lx0, ry + 27);
                        ctx.lineTo(lx0 + lw, ry + 27);
                        ctx.stroke();
                        if (row.leaves.length) {
                            drawLeafRows(row.leaves, lx0, lw, ry + 33);
                        }
                        ry += row.h + GAPR;
                        return;
                    }
                    const pillTop = ry + (row.h - row.pillH) / 2;
                    // 枝干胶囊
                    roundRect(ctx, bx, pillTop, PILLW, row.pillH, 8);
                    ctx.fillStyle = '#f7f7f7';
                    ctx.fill();
                    ctx.strokeStyle = '#e0e0e0';
                    ctx.stroke();
                    ctx.fillStyle = '#333';
                    ctx.font = FP;
                    const bt = row.br.name;
                    ctx.fillText(bt.length > 7 ? bt.slice(0, 7) + '…' : bt, bx + PILLW / 2 - textW(bt.length > 7 ? bt.slice(0, 7) + '…' : bt, FP) / 2, pillTop + row.pillH / 2);

                    // 叶子列：方案D 无框行——键左、值右贴缘、整行底线；嵌套缩进 + 垂线
                    const lx0 = bx + PILLW + 14;
                    const lw = LEAFMAX + 40;
                    drawLeafRows(row.leaves, lx0, lw, ry);
                    ry += row.h + GAPR;
                });
                y0 += b.h + GAPB;
            });
        } else if (isTree) {
            // ===== 树状模式：父框在左，子树在右竖直排开，折线连接 =====
            const F0 = `bold 20px ${FONT_FAMILY}`, F = `14px ${FONT_FAMILY}`;
            const PADX = 18, PADY = 9, GAP = 16, LEVEL = 60, SPINE = 15, MAXW = 320;

            const pos = new Map(); // nd -> 布局信息（不挂在节点数据上，避免污染存储）
            (function measure(nd, level) {
                const font = level === 0 ? F0 : F;
                const t = displayTextOf(nd);
                const raw = textW(t, font);
                const maxText = MAXW - PADX * 2;
                const lines = raw > maxText ? wrapText(t, font, maxText) : [t];
                const lineH = level === 0 ? 26 : 20;
                pos.set(nd, {
                    lines, lineH, font, level,
                    boxW: Math.min(raw, maxText) + PADX * 2,
                    boxH: lines.length * lineH + PADY * 2
                });
                (nd.children || []).forEach(ch => measure(ch, level + 1));
            })(data, 0);

            const subtreeH = (nd, level) => {
                const b = pos.get(nd);
                if (!(nd.children && nd.children.length)) return b.boxH;
                let total = 0;
                nd.children.forEach((ch, i) => total += subtreeH(ch, level + 1) + (i ? GAP : 0));
                return Math.max(b.boxH, total);
            };

            let maxX = 0;
            (function layout(nd, level, x, yTop) {
                const b = pos.get(nd);
                b.x = x;
                let childTotal = 0;
                if (nd.children && nd.children.length) {
                    nd.children.forEach((ch, i) => childTotal += subtreeH(ch, level + 1) + (i ? GAP : 0));
                    let cy = yTop + (Math.max(b.boxH, childTotal) - childTotal) / 2;
                    nd.children.forEach(ch => {
                        layout(ch, level + 1, x + b.boxW + LEVEL, cy);
                        cy += subtreeH(ch, level + 1) + GAP;
                    });
                }
                b.y = yTop + (Math.max(b.boxH, childTotal) - b.boxH) / 2;
                maxX = Math.max(maxX, x + b.boxW);
            })(data, 0, 10, 0);

            cw = Math.ceil(maxX + 10);
            chh = Math.ceil(subtreeH(data, 0));
            c.width = cw * scale;
            c.height = chh * scale;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, cw, chh);

            // 连线：父框右缘中点 → 竖脊 → 子框左缘中点（先画线再画框，线头被框盖住）
            const drawLines = (nd) => {
                const b = pos.get(nd);
                if (nd.children && nd.children.length) {
                    const spineX = pos.get(nd.children[0]).x - SPINE;
                    const px = b.x + b.boxW, py = b.y + b.boxH / 2;
                    nd.children.forEach(ch => {
                        const cb = pos.get(ch);
                        const cy = cb.y + cb.boxH / 2;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(spineX, py);
                        ctx.lineTo(spineX, cy);
                        ctx.lineTo(cb.x, cy);
                        ctx.strokeStyle = '#bbb';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    });
                    nd.children.forEach(drawLines);
                }
            };
            drawLines(data);

            const drawBoxes = (nd) => {
                const b = pos.get(nd);
                roundRect(ctx, b.x, b.y, b.boxW, b.boxH, 6);
                if (b.level === 0) {
                    ctx.fillStyle = '#000';
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                } else if (nd.placeholder) {
                    ctx.fillStyle = '#f7f7f7';
                    ctx.fill();
                    ctx.strokeStyle = '#bbb';
                    ctx.setLineDash([4, 3]);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.strokeStyle = '#999';
                }
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = b.level === 0 ? '#fff' : (nd.placeholder ? '#999' : '#000');
                ctx.font = b.font;
                ctx.textBaseline = 'middle';
                let ty = b.y + b.boxH / 2 - (b.lines.length - 1) * b.lineH / 2;
                b.lines.forEach(l => {
                    ctx.fillText(l, b.x + PADX, ty);
                    ty += b.lineH;
                });
                (nd.children || []).forEach(drawBoxes);
            };
            drawBoxes(data);
        } else {
            // ===== 大纲模式：缩进 + 圆点 + 子级竖线 =====
            const F0 = `bold 20px ${FONT_FAMILY}`, F = `15px ${FONT_FAMILY}`;
            const INDENT = 30, GAP = 10;
            const W = 720;

            const rows = [];
            (function measure(nd, level) {
                const font = level === 0 ? F0 : F;
                const t = displayTextOf(nd);
                const x = 20 + level * INDENT;
                const maxText = W - x - 70;
                const raw = textW(t, font);
                const lines = raw > maxText ? wrapText(t, font, maxText) : [t];
                const lineH = level === 0 ? 28 : 22;
                const row = {
                    nd, level, x, lines, lineH, font,
                    boxH: lines.length * lineH + 12,
                    dotR: level === 0 ? 6 : 4.5
                };
                rows.push(row);
                nd._row = row;
                (nd.children || []).forEach(ch => measure(ch, level + 1));
            })(data, 0);

            let y = 0;
            rows.forEach(r => { r.y = y; y += r.boxH + GAP; });
            cw = W;
            chh = Math.ceil(y);
            c.width = cw * scale;
            c.height = chh * scale;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, cw, chh);

            // 子级竖线：从父行下方垂到最后一个后代的垂直中心
            const lastDesc = (n) => (n.children && n.children.length) ? lastDesc(n.children[n.children.length - 1]) : n;
            rows.forEach(r => {
                if (r.nd.children && r.nd.children.length) {
                    const lr = lastDesc(r.nd.children[r.nd.children.length - 1])._row;
                    ctx.beginPath();
                    ctx.moveTo(r.x + 13, r.y + r.boxH);
                    ctx.lineTo(r.x + 13, lr.y + lr.boxH / 2);
                    ctx.strokeStyle = '#bbb';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });

            rows.forEach(r => {
                // 圆点（与内容垂直居中对齐）
                ctx.beginPath();
                ctx.arc(r.x + 8, r.y + r.boxH / 2, r.dotR, 0, Math.PI * 2);
                ctx.fillStyle = r.level === 0 ? '#000' : '#333';
                ctx.fill();
                // 文字
                ctx.fillStyle = r.nd.placeholder ? '#999' : '#000';
                ctx.font = r.font;
                ctx.textBaseline = 'middle';
                let ty = r.y + 6 + r.lineH / 2;
                r.lines.forEach(l => {
                    ctx.fillText(l, r.x + 26, ty);
                    ty += r.lineH;
                });
            });
            // 回收临时引用
            rows.forEach(r => { delete r.nd._row; });
        }

        // 最终画布：内容居中，四周留白，尺寸规则与电脑端一致
        const pad = 80, step = 100;
        const w = Math.max(1000, Math.ceil((cw + pad * 2) / step) * step);
        const h = Math.max(750, Math.ceil((chh + pad * 2) / step) * step);
        const out = document.createElement('canvas');
        out.width = w * scale;
        out.height = h * scale;
        const octx = out.getContext('2d');
        octx.fillStyle = '#fff';
        octx.fillRect(0, 0, out.width, out.height);
        octx.drawImage(c, Math.round((out.width - c.width) / 2), Math.round((out.height - c.height) / 2));
        if (directDownload) {
            const link = document.createElement('a');
            link.download = '思维导图.png';
            link.href = out.toDataURL('image/png');
            link.click();
        } else {
            this.showMobileExportOverlay(out.toDataURL('image/png'));
        }
    }

    // 手机端导出浮层：全屏显示生成的图片，提示长按保存到相册；
    // 支持双指捏合/滚轮/双击缩放，方便查看大图细节
    showMobileExportOverlay(dataUrl) {
        // 避免重复弹出
        const existing = document.getElementById('mindmap-mobile-export-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'mindmap-mobile-export-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.75)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '16px';
        overlay.style.touchAction = 'none'; // 双指手势由浮层自己处理，不交给浏览器页面缩放

        const hint = document.createElement('div');
        hint.textContent = '长按图片保存到相册 · 双指或双击可缩放';
        hint.style.color = '#fff';
        hint.style.fontSize = '16px';
        hint.style.marginBottom = '12px';
        hint.style.textAlign = 'center';
        overlay.appendChild(hint);

        // 图片视口：捏合/双击缩放作用在这个容器上，居中显示
        const viewport = document.createElement('div');
        viewport.style.position = 'relative';
        viewport.style.width = '100%';
        viewport.style.flex = '1';
        viewport.style.minHeight = '0';
        viewport.style.display = 'flex';
        viewport.style.alignItems = 'center';
        viewport.style.justifyContent = 'center';
        viewport.style.overflow = 'hidden';
        overlay.appendChild(viewport);

        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        img.style.backgroundColor = '#fff';
        img.style.transformOrigin = 'center center';
        img.style.transition = 'transform 0.15s ease-out';
        img.style.touchAction = 'none';
        viewport.appendChild(img);

        // ===== 缩放状态与手势 =====
        // transform = translate(t) scale(s)，原点为视口中心：视口坐标 p 处的像素 = t + s*p
        const MIN_SCALE = 1, MAX_SCALE = 5;
        let scale = 1, tx = 0, ty = 0;
        const apply = () => {
            img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        };
        // 平移限位：放大后不露白（图片布局尺寸不受transform影响，可直接用clientWidth/Height）
        const clampPan = () => {
            const vw = viewport.clientWidth, vh = viewport.clientHeight;
            const halfW = Math.max(0, (img.clientWidth * scale - vw) / 2);
            const halfH = Math.max(0, (img.clientHeight * scale - vh) / 2);
            tx = Math.min(halfW, Math.max(-halfW, tx));
            ty = Math.min(halfH, Math.max(-halfH, ty));
        };
        // 以 clientX/Y（相对页面）为缩放中心改变 scale；不传则围绕视口中心
        const setScale = (target, cx, cy) => {
            const rect = viewport.getBoundingClientRect();
            const px = (cx !== undefined ? cx : rect.left + rect.width / 2) - (rect.left + rect.width / 2);
            const py = (cy !== undefined ? cy : rect.top + rect.height / 2) - (rect.top + rect.height / 2);
            const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, target));
            const ratio = next / scale;
            tx = px - ratio * (px - tx);
            ty = py - ratio * (py - ty);
            scale = next;
            clampPan();
            apply();
        };

        // 双指捏合 + 单指拖动
        let pinch = null, drag = null;
        viewport.addEventListener('touchstart', (e) => {
            img.style.transition = 'none';
            if (e.touches.length === 2) {
                const [a, b] = [e.touches[0], e.touches[1]];
                pinch = {
                    dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
                    scale
                };
                drag = null;
            } else if (e.touches.length === 1) {
                drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
            }
        }, { passive: true });
        viewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && pinch) {
                e.preventDefault();
                const [a, b] = [e.touches[0], e.touches[1]];
                const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                setScale(pinch.scale * (dist / pinch.dist), (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
            } else if (e.touches.length === 1 && drag && scale > 1) {
                e.preventDefault();
                tx = drag.tx + (e.touches[0].clientX - drag.x);
                ty = drag.ty + (e.touches[0].clientY - drag.y);
                clampPan();
                apply();
            }
        }, { passive: false });
        viewport.addEventListener('touchend', () => {
            pinch = null;
            drag = null;
            img.style.transition = 'transform 0.15s ease-out';
        });

        // 电脑端滚轮缩放
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            setScale(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
        }, { passive: false });

        // 电脑端鼠标拖动平移（放大后按住图片拖动；与单指拖动同一套限位）
        let mouseDrag = null;
        img.addEventListener('mousedown', (e) => {
            if (scale <= 1) return;
            e.preventDefault();
            img.style.transition = 'none';
            mouseDrag = { x: e.clientX, y: e.clientY, tx, ty };
        });
        window.addEventListener('mousemove', (e) => {
            if (!mouseDrag) return;
            tx = mouseDrag.tx + (e.clientX - mouseDrag.x);
            ty = mouseDrag.ty + (e.clientY - mouseDrag.y);
            clampPan();
            apply();
        });
        window.addEventListener('mouseup', () => {
            if (!mouseDrag) return;
            mouseDrag = null;
            img.style.transition = 'transform 0.15s ease-out';
        });

        // 双击：1x ↔ 2x 切换（以双击点为中心）
        viewport.addEventListener('dblclick', (e) => {
            if (scale > 1) setScale(1);
            else setScale(2, e.clientX, e.clientY);
        });

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '关闭';
        closeBtn.style.color = '#fff';
        closeBtn.style.fontSize = '14px';
        closeBtn.style.marginTop = '14px';
        closeBtn.style.padding = '8px 24px';
        closeBtn.style.border = '1px solid #fff';
        closeBtn.style.cursor = 'pointer';
        overlay.appendChild(closeBtn);

        // 点击浮层空白处关闭（缩放状态下点击图片本身不关闭，避免误触）
        overlay.addEventListener('click', (e) => {
            if (e.target === img || viewport.contains(e.target)) return;
            overlay.remove();
        });
        closeBtn.addEventListener('click', () => overlay.remove());

        document.body.appendChild(overlay);
    }

    bindEvents() {
        // 绑定键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.selectedNode && e.target.classList.contains('node-content')) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.addChild(this.selectedNode, this.getNodeData(this.selectedNode));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addSibling(this.selectedNode, this.getNodeData(this.selectedNode));
                }
            }
        });

        // 导出按钮已移至render()中生成（每次渲染都显示在导图下方）
    }

    getNodeData(node) {
        // 简化版：通过递归查找节点数据
        const findNode = (data, targetNode) => {
            if (data === this.data) return data;

            for (let child of data.children || []) {
                if (child === targetNode) return child;
                const found = findNode(child, targetNode);
                if (found) return found;
            }
            return null;
        };

        return findNode(this.data, node);
    }
}

// 初始化思维导图
document.addEventListener('DOMContentLoaded', () => {
    console.log('mind-map.js loaded');

    // 检查是否在定表页面
    const gradeContent = document.getElementById('grade');
    if (gradeContent) {
        console.log('grade content found');
        const subNav = gradeContent.querySelector('.sub-nav');
        if (subNav) {
            console.log('sub nav found');
            subNav.addEventListener('click', (e) => {
                const clickedItem = e.target.closest('li');
                if (clickedItem && clickedItem.textContent.trim() === '定表') {
                    console.log('定表 clicked');
                    const mindMapContainer = document.getElementById('mindMapContainer');
                    if (mindMapContainer) {
                        console.log('mindMapContainer found');
                        // 确保 mindMap 只初始化一次
                        if (!mindMapContainer.mindMap) {
                            console.log('creating new MindMap');
                            mindMapContainer.mindMap = new MindMap('mindMapContainer');
                        }
                        mindMapContainer.style.display = 'block';
                        mindMapContainer.mindMap.render();
                    }
                } else {
                    const mindMapContainer = document.getElementById('mindMapContainer');
                    if (mindMapContainer) {
                        mindMapContainer.style.display = 'none';
                    }
                }
            });
        }
    }
});

// 引入 html2canvas 库
if (typeof html2canvas === 'undefined') {
    const script = document.createElement('script');
    script.src = 'html2canvas.min.js'; // 本地文件：离线/无外网环境也可导出
    document.head.appendChild(script);
}

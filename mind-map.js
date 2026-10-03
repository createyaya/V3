class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mode = 'tree'; // 'tree' 或 'outline'
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
                                        {
                                            name: '中轴',
                                            children: [
                                                { name: 'T区', children: [] },
                                                { name: '下巴', children: [] },
                                                { name: '眼下中部', children: [] }
                                            ]
                                        },
                                        {
                                            name: '面中',
                                            children: [
                                                { name: '上', children: [] },
                                                { name: '中', children: [] },
                                                { name: '下', children: [] }
                                            ]
                                        },
                                        { name: '外轮廓', children: [] },
                                        { name: '局部', children: [] }
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
                                        { name: '发长', children: [] },
                                        { name: '正侧背面发流', children: [] }
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

        // 第二级起的默认节点标记为"待填写"占位卡位（一级固定节点正常显示）
        const markPlaceholders = (nodes, level) => {
            nodes.forEach(n => {
                if (level >= 2) n.placeholder = true;
                markPlaceholders(n.children || [], level + 1);
            });
        };
        markPlaceholders(defaultData.children, 1);

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
                            if (!savedChild.children) savedChild.children = [];
                            mergeChildren(savedChild.children, defChild.children || []);
                        } else {
                            savedChildren.push(JSON.parse(JSON.stringify(defChild)));
                        }
                    });
                };
                mergeChildren(data.children, defaultData.children);
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
                }
                /* 树状模式：不再滚动，默认整棵缩放适配屏幕，支持双指捏合放大 */
                .tree-container {
                    overflow: visible;
                    transform-origin: 50% 0;
                    touch-action: pan-y; /* 垂直滑动仍滚动页面，横向与捏合由导图接管 */
                }
                /* 大纲模式手机端：与导出图片一致的嵌套盒式样式，由总览缩放保证全览 */
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
                }
                .outline-container .mind-node {
                    padding: 3px 5px;
                }
                .outline-container {
                    padding: 8px 14px 30px;
                }
                .outline-container .node-content {
                    padding: 6px 8px;
                }
                .outline-container .mind-node[data-level="0"] > .mind-node-row .node-content {
                    font-size: 19px;
                }
                .outline-container .mind-node[data-level="1"] > .mind-node-row .node-content,
                .outline-container .mind-node[data-level="2"] > .mind-node-row .node-content,
                .outline-container .mind-node[data-level="3"] > .mind-node-row .node-content {
                    font-size: 15px;
                }
                .outline-container .children-container {
                    margin-left: 14px;
                    padding-left: 10px;
                }
                .outline-container .node-toolbar button {
                    width: 20px;
                    height: 20px;
                    font-size: 11px;
                }
            }
        `;
        this.container.appendChild(mobileStyle);

        // 沉浸模式按钮：只看导图，隐藏页面其他内容（固定在右上角，与模式按钮同一行）
        const immersiveBtn = document.createElement('button');
        immersiveBtn.textContent = this._immersive ? '退出' : '沉浸';
        immersiveBtn.className = 'mindmap-immersive-btn';
        immersiveBtn.style.padding = '6px 14px';
        immersiveBtn.style.fontSize = '13px';
        immersiveBtn.style.letterSpacing = '1px';
        immersiveBtn.style.border = '1px solid #000';
        immersiveBtn.style.background = '#fff';
        immersiveBtn.style.cursor = 'pointer';
        immersiveBtn.onclick = () => this.toggleImmersive();
        // 模式切换按钮：文字 + 下方短横线（点击切换）
        const modeSwitch = document.createElement('button');
        modeSwitch.textContent = this.mode === 'tree' ? '树状模式' : '大纲模式';
        modeSwitch.style.border = 'none';
        modeSwitch.style.background = 'none';
        modeSwitch.style.padding = '0 4px 6px';
        modeSwitch.style.fontSize = '14px';
        modeSwitch.style.letterSpacing = 'normal';
        modeSwitch.style.fontWeight = 'normal';
        modeSwitch.style.fontFamily = 'inherit';
        modeSwitch.style.color = '#000';
        modeSwitch.style.cursor = 'pointer';
        modeSwitch.style.position = 'relative';
        // 下方短横线
        const underline = document.createElement('span');
        underline.style.position = 'absolute';
        underline.style.left = '50%';
        underline.style.transform = 'translateX(-50%)';
        underline.style.bottom = '0';
        underline.style.width = '100%';
        underline.style.height = '1px';
        underline.style.backgroundColor = '#000';
        modeSwitch.appendChild(underline);
        modeSwitch.onclick = () => this.toggleMode();

        // 顶栏行：模式按钮居中，沉浸按钮贴右，两者文字中心垂直对齐
        const topRow = document.createElement('div');
        topRow.style.position = 'relative';
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'center';
        topRow.style.alignItems = 'center';
        topRow.style.width = '100%'; /* 撑满容器：沉浸按钮贴容器右缘，不压住居中的模式按钮 */
        topRow.style.marginBottom = '16px';
        topRow.appendChild(modeSwitch);
        topRow.appendChild(immersiveBtn);
        this.container.appendChild(topRow);

        // 渲染思维导图
        if (this.mode === 'tree') {
            this.renderTree();
            // 渲染后按实际位置生成框到框的连接线
            this.adjustTreeConnectors();
            // 手机端：初始即缩小版总览；沉浸模式下支持捏合放大
            this.setupMobileTreeZoom('.tree-container', { gestures: !!this._immersive });
            this.scheduleZoomRecalibration('.tree-container', { gestures: !!this._immersive });
        } else {
            this.renderOutline();
            // 大纲模式：初始即缩小版总览；沉浸模式下支持捏合放大
            this.setupMobileTreeZoom('.outline-container', { gestures: !!this._immersive });
            this.scheduleZoomRecalibration('.outline-container', { gestures: !!this._immersive });
        }


        // 导出图片按钮：固定显示在导图最下方居中
        const exportBtn = document.createElement('button');
        exportBtn.className = 'mindmap-export-btn';
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

        // 沉浸模式样式
        const immersiveStyle = document.createElement('style');
        immersiveStyle.textContent = `
            #mindMapContainer {
                position: relative;
            }
            .mindmap-immersive-btn {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                margin: 0;
            }
            .mindmap-immersive .mindmap-immersive-btn {
                right: 0;
            }
            /* 沉浸模式下导出按钮固定在视口底部居中（fixed不随内容滚动） */
            .mindmap-immersive .mindmap-export-btn {
                position: fixed !important;
                bottom: 12px !important;
                top: auto !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                margin: 0 !important;
                z-index: 10 !important;
            }
            /* 给正文底部留出按钮的高度，内容不会被按钮遮住 */
            .mindmap-immersive .tree-container,
            .mindmap-immersive .outline-container {
                padding-bottom: 60px !important;
            }
            .mindmap-immersive {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 9999 !important;
                background-color: #fff !important;
                overflow: auto !important;
                padding: 8px !important;
            }
        `;
        this.container.appendChild(immersiveStyle);
    }

    // 进入/退出沉浸模式：整个导图容器铺满屏幕，页面其他内容全部被盖住
    toggleImmersive() {
        this._immersive = !this._immersive;
        const c = this.container;
        if (this._immersive) {
            c.classList.add('mindmap-immersive');
        } else {
            c.classList.remove('mindmap-immersive');
        }
        this.render(); // 重建按钮文字与缩放状态
        if (!this._immersive) {
            // 退出沉浸：清除缩放残留，恢复正常页面滚动
            ['.tree-container', '.outline-container'].forEach(sel => {
                const t = this.container.querySelector(sel);
                if (t) {
                    t.style.transform = '';
                    t.style.height = '';
                    t.style.touchAction = '';
                }
            });
        }
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
                path.setAttribute('stroke', '#bbbbbb');
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

    // 手机端树状模式：默认整棵缩放适配屏幕宽度，支持双指捏合放大、单指左右平移
    setupMobileTreeZoom(selector, opts) {
        const t = this.container.querySelector(selector || '.tree-container');
        if (!t || !window.matchMedia('(max-width: 768px)').matches) return;
        this._zoomEl = t;
        const gestures = !(opts && opts.gestures === false);

        const vw = this.container.clientWidth;
        const cw = Math.max(t.scrollWidth, t.offsetWidth);
        const ch = Math.max(t.scrollHeight, t.offsetHeight);
        let fit = Math.min(1, vw / cw);
        // 初始即缩小版总览：高度也纳入适配，保证整棵导图一屏看全
        const vh = window.innerHeight - 130; // 顶部按钮与底部导出按钮的大致占位
        fit = Math.min(fit, vh / ch);
        this._treeZoom = { scale: fit, tx: 0, ty: 0, fit, cw, ch, vw };
        this.applyTreeZoom();

        if (!gestures) return;

        let mode = null; // 'pan' 或 'pinch'
        let startX = 0, startY = 0, startTx = 0, startTy = 0;
        let startDist = 0, startScale = 1, midX = 0, midY = 0;
        const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

        t.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                mode = 'pan';
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTx = this._treeZoom.tx;
                startTy = this._treeZoom.ty;
            } else if (e.touches.length === 2) {
                mode = 'pinch';
                startDist = dist(e.touches[0], e.touches[1]);
                startScale = this._treeZoom.scale;
                midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            }
        }, { passive: true });

        t.addEventListener('touchmove', (e) => {
            const z = this._treeZoom;
            if (!z) return;
            if (mode === 'pan' && e.touches.length === 1) {
                z.tx = startTx + (e.touches[0].clientX - startX);
                z.ty = startTy + (e.touches[0].clientY - startY);
                this.applyTreeZoom();
                e.preventDefault();
            } else if (mode === 'pinch' && e.touches.length === 2) {
                const ratio = dist(e.touches[0], e.touches[1]) / startDist;
                const newScale = Math.min(z.fit * 5, Math.max(z.fit, startScale * ratio));
                // 以双指中点为锚点缩放
                const rect = t.getBoundingClientRect();
                // rect已包含当前平移量，不能再减一次tx/ty（否则每次捏合中心都会漂移）
                const anchorX = (midX - rect.left) / z.scale;
                const anchorY = (midY - rect.top) / z.scale;
                z.tx = (midX - rect.left) - anchorX * newScale;
                z.ty = (midY - rect.top) - anchorY * newScale;
                z.scale = newScale;
                this.applyTreeZoom();
                e.preventDefault();
            }
        }, { passive: false });

        const end = () => { mode = null; };
        t.addEventListener('touchend', end);
        t.addEventListener('touchcancel', end);
    }

    // 延时重算：首次布局/字体加载完成后校准总览缩放（修正时序导致的"放大版"问题）
    scheduleZoomRecalibration(selector, opts) {
        clearTimeout(this._zoomRecalTimer);
        this._zoomRecalTimer = setTimeout(() => {
            this.setupMobileTreeZoom(selector, opts);
        }, 300);
    }

    // 应用当前缩放与平移（并同步占位高度，避免下方内容重叠）
    applyTreeZoom() {
        const t = this._zoomEl;
        const z = this._treeZoom;
        if (!t || !z) return;

        // 平移范围：放大后四周不露白
        const minTx = Math.min(0, z.vw - z.cw * z.scale);
        z.tx = Math.max(minTx, Math.min(0, z.tx));
        const vh = window.innerHeight;
        const minTy = Math.min(0, vh - z.ch * z.scale);
        z.ty = Math.max(minTy, Math.min(0, z.ty));

        t.style.transformOrigin = '50% 0';
        t.style.transform = `translate(${z.tx}px, ${z.ty}px) scale(${z.scale})`;
        t.style.height = (z.ch * z.scale) + 'px';
        // 放大后由导图接管全部手势（可自由拖动）；未放大时保留页面纵向滚动
        t.style.touchAction = (z.scale > z.fit + 0.001) ? 'none' : 'pan-y';
    }

    renderTree() {
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            /* ===== 树状模式：横向树（父框在左，子框并列在右，竖直排开） ===== */
            .tree-container {
                padding: 10px 0;
                /* 整棵树按实际内容宽度自适应，由父级flex水平居中（内容再宽也不会偏右） */
                width: fit-content;
                max-width: none;
            }
            .tree-container .mind-node {
                display: flex;
                align-items: center;
            }
            .tree-container .mind-node-row {
                display: flex;
                align-items: center;
                flex: none;
                position: relative;
                padding: 9px 18px;
                border: 1px solid #e3ded2;
                border-radius: 12px;
                background: #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                white-space: nowrap;
                transition: border-color 0.15s ease;
            }
            .tree-container .mind-node-row:hover {
                border-color: #b9b2a0;
            }
            /* 「待填写」占位：浅米灰底 + 虚线，填写后转正常卡片 */
            .tree-container .mind-node.placeholder > .mind-node-row {
                border: 1px dashed #d8d2c4;
                background: #faf8f4;
            }
            .tree-container .mind-node.placeholder .node-text {
                color: #999999;
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
            .tree-container .node-dot {
                display: none;
            }
            /* 子级：在父框右侧竖直排开 */
            .tree-container .children-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
                margin-left: 30px;
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
                gap: 5px;
            }
            .tree-container .node-toolbar button {
                padding: 2px 6px;
                font-size: 12px;
            }
        `;
        this.container.appendChild(style);

        // 渲染根节点
        const rootNode = this.createNode(this.data, null, 0);
        treeContainer.appendChild(rootNode);

        // 树模式：容器纵向flex、水平居中（配合fit-content，任何宽度都端正居中）
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';

        this.container.appendChild(treeContainer);
    }

    renderOutline() {
        const outlineContainer = document.createElement('div');
        outlineContainer.className = 'outline-container';

        // 大纲模式样式：同级节点对齐在一条竖线上，下一级向右缩进
        const style = document.createElement('style');
        style.textContent = `
            /* ===== 大纲模式：幕布式宽松文本页 ===== */
            .outline-container {
                max-width: 760px;
                margin: 0 auto;
                padding: 16px 32px 40px;
                text-align: left;
            }
            .outline-container .mind-node {
                margin: 0;
            }
            .outline-container .mind-node-row {
                display: flex;
                align-items: center;
                position: relative;
                padding: 0;
                border-radius: 8px;
            }
            .outline-container .node-content {
                cursor: pointer;
                flex: none;
                min-width: 0;
                max-width: 100%;
                display: inline-flex;
                align-items: center;
                padding: 7px 12px;
                border-radius: 8px;
                line-height: 1.6;
                transition: background-color 0.15s ease;
            }
            .outline-container .node-content:hover {
                background-color: #f5f5f5;
            }
            .outline-container .node-dot {
                flex: none;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #c0c0c0;
                margin-right: 14px;
                transition: background-color 0.15s ease;
            }
            .outline-container .node-content:hover .node-dot {
                background: #333;
            }
            .outline-container .mind-node[data-level="0"] > .mind-node-row .node-dot {
                width: 10px;
                height: 10px;
                background: #000;
            }
            .outline-container .mind-node[data-level="0"] > .mind-node-row .node-content {
                font-size: 22px;
                font-weight: bold;
                padding: 10px 12px;
            }
            .outline-container .mind-node[data-level="1"] > .mind-node-row .node-content {
                font-size: 17px;
            }
            .outline-container .mind-node[data-level="2"] > .mind-node-row .node-content,
            .outline-container .mind-node[data-level="3"] > .mind-node-row .node-content {
                font-size: 15px;
            }
            /* 子级引导线：极浅的竖线，随层级递进 */
            .outline-container .children-container {
                margin-left: 22px;
                padding-left: 16px;
                border-left: 2px solid #e5e5e5;
            }
            .outline-container .mind-node.placeholder .node-text {
                color: #999999;
            }
            .outline-container .node-toolbar {
                margin-left: 8px;
                display: flex;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.15s ease;
            }
            .outline-container .mind-node-row:hover .node-toolbar,
            .outline-container .mind-node.selected .node-toolbar {
                opacity: 1;
            }
            .outline-container .node-toolbar button {
                width: 24px;
                height: 24px;
                padding: 0;
                font-size: 12px;
                line-height: 1;
                border: 1px solid #d5d5d5;
                border-radius: 50%;
                background: #fff;
                color: #555;
                cursor: pointer;
            }
            .outline-container .node-toolbar button:hover {
                border-color: #000;
                color: #000;
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
        // "待填写"占位卡位：灰态显示提示文字，填写后恢复正常
        if (nodeData.placeholder) {
            node.className += ' placeholder';
            text.textContent = `待填写 · ${nodeData.name}`;
        } else {
            text.textContent = nodeData.name;
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
        addChildBtn.textContent = '+';
        addChildBtn.title = '添加子节点';
        addChildBtn.onclick = () => this.addChild(node, nodeData);

        const addSiblingBtn = document.createElement('button');
        addSiblingBtn.textContent = '++';
        addSiblingBtn.title = '添加兄弟节点';
        addSiblingBtn.onclick = () => this.addSibling(node, nodeData);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
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

    startEdit(node, nodeData) {
        const content = node.querySelector('.node-content');
        const currentValue = nodeData.name;

        // 继承原文字的字体样式，避免编辑时观感突变
        const cs = getComputedStyle(content);

        // 创建编辑输入框：无框无底，样式与原文字完全一致（小圆点保留，原地输入）
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.style.fontFamily = cs.fontFamily;
        input.style.fontSize = cs.fontSize;
        input.style.fontWeight = cs.fontWeight;
        input.style.color = cs.color;
        input.style.padding = '0';
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.background = 'transparent';

        // 用隐藏镜像元素实测文字像素宽（ch单位对中文不准）
        const measurer = document.createElement('span');
        measurer.style.position = 'absolute';
        measurer.style.visibility = 'hidden';
        measurer.style.whiteSpace = 'pre';
        measurer.style.fontFamily = cs.fontFamily;
        measurer.style.fontSize = cs.fontSize;
        measurer.style.fontWeight = cs.fontWeight;
        document.body.appendChild(measurer);

        const fitWidth = () => {
            measurer.textContent = input.value + '占'; // 多留一个字的余量
            input.style.width = (measurer.offsetWidth + 16) + 'px';
        };
        fitWidth();
        input.addEventListener('input', fitWidth);
        input.addEventListener('blur', () => measurer.remove());

        // 只替换文字部分为输入框（小圆点保留在原地）
        const textEl = content.querySelector('.node-text') || content;
        textEl.replaceWith(input);
        input.focus();
        input.select();

        // 处理输入完成
        const finishEdit = () => {
            const newValue = input.value.trim();
            if (newValue && newValue !== currentValue) {
                nodeData.name = newValue;
                // 占位卡位填写完成后转为正常节点
                nodeData.placeholder = false;
                this.saveData();
                this.render();
            } else {
                this.render();
            }
        };

        input.onblur = finishEdit;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                this.render();
            }
        };
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
        // 使用 html2canvas 导出图片
        if (typeof html2canvas === 'undefined') {
            alert('请先引入 html2canvas 库');
            return;
        }

        // 只截取导图正文（树状/大纲容器），不包含切换与导出按钮
        const target = this.container.querySelector('.tree-container') ||
                       this.container.querySelector('.outline-container');
        if (!target) {
            alert('未找到导图内容');
            return;
        }

        // 直接对页面上的真实导图截图（避免克隆导致深层级丢失）：
        // 临时解除宽度限制，按完整内容尺寸（含溢出部分）指定截取区域
        const scale = 2;
        const oldMaxWidth = target.style.maxWidth;
        const oldPadding = target.style.padding;
        target.style.maxWidth = 'none';
        target.style.padding = '20px';

        const captureW = Math.max(target.scrollWidth, target.offsetWidth) + 40; // 留余量防边缘裁切
        const captureH = Math.max(target.scrollHeight, target.offsetHeight) + 40;

        // 布局已因临时样式改变，先按新布局重算连接线，避免线与框错位
        this.adjustTreeConnectors();

        html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: scale,
            width: captureW,
            height: captureH,
            windowWidth: Math.max(document.documentElement.scrollWidth, captureW) + 100,
            windowHeight: Math.max(document.documentElement.scrollHeight, captureH) + 100
        }).then(srcCanvas => {
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
        }).finally(() => {
            // 恢复原样并重绘
            target.style.maxWidth = oldMaxWidth;
            target.style.padding = oldPadding;
            if (this.mode === 'tree') {
                this.adjustTreeConnectors();
            }
        });
    }

    // 手机端导出浮层：全屏显示生成的图片，提示长按保存到相册
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

        const hint = document.createElement('div');
        hint.textContent = '长按图片保存到相册';
        hint.style.color = '#fff';
        hint.style.fontSize = '16px';
        hint.style.marginBottom = '12px';
        hint.style.textAlign = 'center';
        overlay.appendChild(hint);

        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '80%';
        img.style.objectFit = 'contain';
        img.style.backgroundColor = '#fff';
        overlay.appendChild(img);

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '关闭';
        closeBtn.style.color = '#fff';
        closeBtn.style.fontSize = '14px';
        closeBtn.style.marginTop = '14px';
        closeBtn.style.padding = '8px 24px';
        closeBtn.style.border = '1px solid #fff';
        closeBtn.style.cursor = 'pointer';
        overlay.appendChild(closeBtn);

        // 点击浮层任意位置关闭
        overlay.addEventListener('click', () => overlay.remove());

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
    script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
    document.head.appendChild(script);
}

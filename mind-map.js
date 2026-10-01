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

        // 手机端适配：两种模式整块内容水平居中
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
            @media (max-width: 768px) {
                .tree-container,
                .outline-container {
                    max-width: none;
                    width: fit-content;
                    margin: 0 auto;
                    padding-left: 0;
                }
            }
        `;
        this.container.appendChild(mobileStyle);

        // 模式切换按钮：文字 + 下方短横线（点击切换）
        const modeSwitch = document.createElement('button');
        modeSwitch.textContent = this.mode === 'tree' ? '树状模式' : '大纲模式';
        modeSwitch.style.marginBottom = '16px';
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
        this.container.appendChild(modeSwitch);

        // 渲染思维导图
        if (this.mode === 'tree') {
            this.renderTree();
            // 渲染后按实际位置生成框到框的连接线
            this.adjustTreeConnectors();
        } else {
            this.renderOutline();
        }

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
    }

    renderTree() {
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            /* ===== 树状模式：横向树（父框在左，子框并列在右，竖直排开） ===== */
            .tree-container {
                max-width: 560px;
                margin: 0 auto;
                padding: 10px 0;
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
                padding: 8px 18px;
                border: 1px solid #999;
                border-radius: 6px;
                background: #fff;
                white-space: nowrap;
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
                max-width: 560px;
                margin: 0 auto;
                padding-left: 80px;
            }
            .outline-container .mind-node {
                margin: 4px 0;
            }
            .outline-container .mind-node-row {
                display: flex;
                align-items: center;
                position: relative;
                padding: 4px 6px;
                border-radius: 4px;
            }
            .outline-container .node-content {
                cursor: pointer;
                flex: none;
                min-width: 60px;
                display: inline-flex;
                align-items: center;
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
                padding-left: 26px;
                border-left: 1px solid #bbb;
            }
            /* 每个子节点：从竖线引出短横线连到圆点 */
            .outline-container .children-container .mind-node > .mind-node-row::before {
                content: '';
                position: absolute;
                left: -26px;
                top: 50%;
                width: 20px;
                height: 1px;
                background: #bbb;
            }
            .outline-container .node-toolbar {
                margin-left: 10px;
                display: flex;
                gap: 5px;
            }
            .outline-container .node-toolbar button {
                padding: 2px 6px;
                font-size: 12px;
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
        text.textContent = nodeData.name;

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

        // 创建编辑输入框：宽度随文字长度自适应，完整展示全部文字
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.style.fontFamily = cs.fontFamily;
        input.style.fontSize = cs.fontSize;
        input.style.fontWeight = cs.fontWeight;
        input.style.color = cs.color;
        input.style.padding = '2px 4px';
        input.style.border = '1px solid #000';
        input.style.outline = 'none';
        input.style.background = '#fff';

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

        // 替换内容为输入框
        content.replaceWith(input);
        input.focus();
        input.select();

        // 处理输入完成
        const finishEdit = () => {
            const newValue = input.value.trim();
            if (newValue && newValue !== currentValue) {
                nodeData.name = newValue;
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

        const captureW = Math.max(target.scrollWidth, target.offsetWidth);
        const captureH = Math.max(target.scrollHeight, target.offsetHeight);

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
            link.click();
        }).finally(() => {
            // 恢复原样并重绘
            target.style.maxWidth = oldMaxWidth;
            target.style.padding = oldPadding;
            if (this.mode === 'tree') {
                this.adjustTreeConnectors();
            }
        });
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

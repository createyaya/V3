class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mode = 'tree'; // 'tree' 或 'outline'
        this.data = this.loadInitialData();
        this.selectedNode = null;
        this.init();
    }

    loadInitialData() {
        // 从 localStorage 加载数据，或使用默认数据
        const saved = localStorage.getItem('mindMapData');
        if (saved) {
            return JSON.parse(saved);
        }

        // 默认数据结构 - 6个固定节点
        return {
            name: '思维导图',
            children: [
                { name: '妆发', children: [] },
                { name: '色', children: [] },
                { name: '料', children: [] },
                { name: '型', children: [] },
                { name: '鞋饰', children: [] },
                { name: '造型刚需', children: [] }
            ]
        };
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

        // 模式切换按钮
        const modeSwitch = document.createElement('button');
        modeSwitch.textContent = this.mode === 'tree' ? '树状模式' : '大纲模式';
        modeSwitch.style.marginBottom = '10px';
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
    }

    // 计算并放置树状模式的竖脊与父框连接线（精确连接方框到方框，不顶天立地）
    adjustTreeConnectors() {
        this.container.querySelectorAll('.tree-container .children-container').forEach(cc => {
            // 清掉旧的辅助线
            cc.querySelectorAll(':scope > .tree-spine, :scope > .tree-parent-link').forEach(el => el.remove());

            const rows = Array.from(cc.children)
                .map(n => n.querySelector(':scope > .mind-node-row'))
                .filter(Boolean);
            if (rows.length === 0) return;

            const cr = cc.getBoundingClientRect();
            const centerOf = row => row.getBoundingClientRect().top - cr.top + row.offsetHeight / 2;

            if (rows.length === 1) {
                // 只有一个子级：父框直接连到子框中心
                const y = centerOf(rows[0]);
                const link = document.createElement('div');
                link.className = 'tree-parent-link';
                link.style.top = y + 'px';
                link.style.width = '30px';
                cc.appendChild(link);
                return;
            }

            const first = centerOf(rows[0]);
            const last = centerOf(rows[rows.length - 1]);

            // 竖脊：第一个子框中心 → 最后一个子框中心
            const spine = document.createElement('div');
            spine.className = 'tree-spine';
            spine.style.top = first + 'px';
            spine.style.height = (last - first) + 'px';
            cc.appendChild(spine);

            // 父框到竖脊中点的横线
            const link = document.createElement('div');
            link.className = 'tree-parent-link';
            link.style.top = ((first + last) / 2) + 'px';
            cc.appendChild(link);
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
                padding: 8px 18px;
                border: 1px solid #999;
                border-radius: 6px;
                background: #fff;
                white-space: nowrap;
            }
            .tree-container .mind-node[data-level="0"] > .mind-node-row {
                font-size: 17px;
                font-weight: bold;
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
            /* 父框到子级的横向连接线（由JS按实际位置生成） */
            .tree-container .tree-parent-link {
                position: absolute;
                left: -30px;
                width: 15px;
                height: 1px;
                background: #bbb;
            }
            /* 子级竖脊：精确从第一个子框中心连到最后一个子框中心（JS定位） */
            .tree-container .tree-spine {
                position: absolute;
                left: -15.5px;
                width: 1px;
                background: #bbb;
            }
            /* 竖脊到每个子框的短横线 */
            .tree-container .children-container .mind-node > .mind-node-row::before {
                content: '';
                position: absolute;
                left: -15px;
                top: 50%;
                width: 15px;
                height: 1px;
                background: #bbb;
            }
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
                font-size: 17px;
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

        // 创建编辑输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.style.width = '100%';
        input.style.padding = '2px';
        input.style.border = '1px solid #ccc';

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

        html2canvas(this.container).then(canvas => {
            const link = document.createElement('a');
            link.download = '思维导图.png';
            link.href = canvas.toDataURL();
            link.click();
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

        // 添加导出按钮
        const exportBtn = document.createElement('button');
        exportBtn.textContent = '导出图片';
        exportBtn.style.marginTop = '10px';
        exportBtn.onclick = () => this.exportToImage();
        this.container.appendChild(exportBtn);
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

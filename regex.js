document.addEventListener('DOMContentLoaded', () => {
    // 引入引擎
    if (typeof RegexEngine === 'undefined') {
        console.error("RegexEngine is not defined! Please include regex-engine.js before regex.js.");
        window.RegexEngine = {
            getRules: () => JSON.parse(localStorage.getItem('fruit_machine_regex_rules')) || [],
            processText: (t) => t
        };
    }

    // 状态管理
    let rules = RegexEngine.getRules();
    let editingIndex = -1; // -1 表示新建模式

    // DOM 元素
    const listEl = document.getElementById('regex-list');
    const modal = document.getElementById('regex-modal');
    const modalTitle = document.getElementById('modal-title');
    
    // 输入框
    const patternInput = document.getElementById('rx-pattern');
    const replacementInput = document.getElementById('rx-replacement');
    const nameInput = document.getElementById('rx-name');
    // flagsInput 已移除

    // 按钮
    const addBtn = document.getElementById('add-regex-btn');
    const clearBtn = document.getElementById('clear-all-btn');
    const saveBtn = document.getElementById('save-regex-btn');
    const deleteBtn = document.getElementById('delete-regex-btn');
    const cancelBtn = document.getElementById('cancel-regex-btn');

    // =========== 渲染逻辑 ===========
    
    function renderList() {
        listEl.innerHTML = '';
        rules = RegexEngine.getRules(); // 重新获取最新

        if (rules.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无正则规则，点击上方“新建规则”添加</div>';
            return;
        }

        rules.forEach((rule, index) => {
            const item = document.createElement('div');
            item.className = `rx-item ${rule.active === false ? 'disabled' : ''}`;
            item.dataset.index = index;

            // 规则名称或简略显示
            const displayName = rule.name || `规则 #${index + 1}`;
            // 预览文本只显示简短的 pattern，不显示 flags
            const previewText = `/${rule.pattern}/`;
            
            // 构建 HTML
            // 移除 rx-detail-row，不再直接显示代码详情
            // 修改 rx-test-output 以支持 HTML 预览
            item.innerHTML = `
                <div class="rx-header">
                    <div class="rx-title-row">
                        <span class="rx-name">${escapeHtml(displayName)}</span>
                        <span class="rx-preview-text">${escapeHtml(previewText)}</span>
                        <span class="rx-expand-icon">▼</span>
                    </div>
                    
                    <div class="rx-switch" onclick="event.stopPropagation()">
                        <label class="switch">
                            <input type="checkbox" class="toggle-active" data-index="${index}" ${rule.active !== false ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div class="rx-body">
                    <!-- 详情已隐藏，只在编辑弹窗可见 -->
                    
                    <div class="rx-test-zone">
                        <div class="rx-label" style="margin-bottom:5px;">单条规则测试 (支持 HTML 预览):</div>
                        <textarea class="rx-test-input" placeholder="在此输入测试文本..." data-index="${index}"></textarea>
                        <!-- 注意：这里使用 innerHTML 渲染，所以不要 escape -->
                        <div class="rx-test-output" style="border:1px solid #eee; padding:10px; min-height:40px;"></div>
                    </div>

                    <div class="rx-btn-row">
                        <button class="edit-btn" data-index="${index}">编辑 / 删除</button>
                    </div>
                </div>
            `;

            // 绑定头部点击展开/折叠
            const header = item.querySelector('.rx-header');
            header.addEventListener('click', () => {
                item.classList.toggle('expanded');
            });

            // 绑定编辑按钮
            const editBtn = item.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(index);
            });

            // 绑定测试输入
            const testInput = item.querySelector('.rx-test-input');
            const testOutput = item.querySelector('.rx-test-output');
            
            testInput.addEventListener('click', (e) => e.stopPropagation()); // 防止冒泡导致折叠
            testInput.addEventListener('input', (e) => {
                const text = e.target.value;
                const result = testSingleRule(text, rule);
                // 关键修改：使用 innerHTML 显示 HTML 效果
                testOutput.innerHTML = result;
            });
            
            listEl.appendChild(item);
        });

        // 绑定开关事件
        document.querySelectorAll('.toggle-active').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                e.stopPropagation(); // 防止折叠
                const idx = parseInt(e.target.dataset.index);
                rules[idx].active = e.target.checked;
                saveRules();
                // 更新样式
                const item = listEl.children[idx];
                if (rules[idx].active) {
                    item.classList.remove('disabled');
                } else {
                    item.classList.add('disabled');
                }
            });
        });
        
        // 绑定 toggle 点击防止折叠
        document.querySelectorAll('.switch').forEach(sw => {
            sw.addEventListener('click', e => e.stopPropagation());
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========== 核心逻辑 ===========

    // 单条测试
    function testSingleRule(text, rule) {
        if (!text) return '';
        try {
            // 默认使用全局匹配
            const regex = new RegExp(rule.pattern, 'g');
            // 处理转义字符
            let replacement = rule.replacement || '';
            replacement = replacement
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t');
            
            return text.replace(regex, replacement);
        } catch (e) {
            return `<span style="color:red">正则错误: ${e.message}</span>`;
        }
    }

    function saveRules() {
        localStorage.setItem('fruit_machine_regex_rules', JSON.stringify(rules));
    }

    // 解析用户输入的正则 (兼容旧习惯)
    function parsePattern(input) {
        // 如果用户输入了 /pattern/flags 格式，只提取 pattern，忽略 flags (因为我们强制用 g)
        const match = input.match(/^\/(.*?)\/([gimuy]*)$/);
        if (match) {
            return {
                pattern: match[1]
            };
        }
        return null;
    }

    // =========== 弹窗逻辑 ===========

    function openEditModal(index) {
        editingIndex = index;
        modal.classList.add('active');

        if (index === -1) {
            // 新建模式
            modalTitle.textContent = "新建正则规则";
            patternInput.value = '';
            replacementInput.value = '';
            nameInput.value = '';
            deleteBtn.style.display = 'none';
        } else {
            // 编辑模式
            const rule = rules[index];
            modalTitle.textContent = "编辑正则规则";
            patternInput.value = rule.pattern;
            replacementInput.value = rule.replacement;
            nameInput.value = rule.name || '';
            deleteBtn.style.display = 'block';
        }
    }

    function closeModal() {
        modal.classList.remove('active');
        editingIndex = -1;
    }

    // =========== 事件监听 ===========

    addBtn.addEventListener('click', () => openEditModal(-1));

    clearBtn.addEventListener('click', () => {
        if (confirm("确定要清空所有正则规则吗？此操作不可恢复！")) {
            rules = [];
            saveRules();
            renderList();
        }
    });

    saveBtn.addEventListener('click', () => {
        let pattern = patternInput.value.trim();
        let replacement = replacementInput.value; // 允许空
        const name = nameInput.value.trim();
        // 强制使用 'g'
        const flags = 'g'; 

        if (!pattern) {
            alert("正则表达式不能为空！");
            return;
        }

        // 智能解析：如果用户输入了完整正则格式，自动提取 pattern
        const parsed = parsePattern(pattern);
        if (parsed) {
            pattern = parsed.pattern;
        }

        // 验证正则是否合法
        try {
            new RegExp(pattern, flags);
        } catch (e) {
            alert("正则表达式格式错误: " + e.message + "\n(如果包含了斜杠 / 请确保是 /pattern/flags 格式，或者去掉首尾斜杠)");
            return;
        }

        const newRule = {
            pattern,
            replacement,
            flags,
            name,
            active: true
        };

        if (editingIndex === -1) {
            rules.push(newRule);
        } else {
            newRule.active = rules[editingIndex].active;
            rules[editingIndex] = newRule;
        }

        saveRules();
        closeModal();
        renderList();
    });

    deleteBtn.addEventListener('click', () => {
        if (confirm("确定要删除这条规则吗？")) {
            rules.splice(editingIndex, 1);
            saveRules();
            closeModal();
            renderList();
        }
    });

    cancelBtn.addEventListener('click', closeModal);

    // 初始渲染
    renderList();
});

document.addEventListener('DOMContentLoaded', () => {

    // =========== 状态管理 ===========
    let categories = [];
    let entries = [];
    let htmlSnippets = []; // New HTML Worldbook
    let currentEditEntryId = null;
    let currentEditCategoryId = null;
    let currentEditSnippetId = null;
    let currentTab = 'worldbook'; // 'worldbook' or 'html'

    // =========== 元素获取 ===========
    const categoryListEl = document.getElementById('category-list');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addEntryBtn = document.getElementById('add-entry-btn');
    
    // HTML Worldbook Elements (Created dynamically or need to be added to HTML)
    // We will inject the tab switcher and snippet list container into the DOM if not present
    let wbContainer = document.querySelector('.worldbook-page');
    if(wbContainer && !document.getElementById('wb-tab-switch')) {
        const tabDiv = document.createElement('div');
        tabDiv.id = 'wb-tab-switch';
        tabDiv.style.cssText = "display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;";
        tabDiv.innerHTML = `
            <button class="settings-button" id="tab-btn-wb" style="background:#ff8787;">普通世界书</button>
            <button class="settings-button" id="tab-btn-html" style="background:#ccc;">HTML世界书</button>
        `;
        wbContainer.insertBefore(tabDiv, wbContainer.children[1]); // Insert after header
        
        // Add Snippet List Container
        const snippetList = document.createElement('div');
        snippetList.id = 'snippet-list';
        snippetList.className = 'wb-category-list';
        snippetList.style.display = 'none';
        wbContainer.appendChild(snippetList);
        
        // Add Snippet Modal (we can reuse entry modal or create new one? Create new one for simplicity)
        const snippetModal = document.createElement('div');
        snippetModal.id = 'snippet-modal';
        snippetModal.className = 'modal';
        snippetModal.innerHTML = `
            <div class="modal-content">
                <h2>编辑HTML条目</h2>
                <div class="form-group">
                    <label>触发关键词 (用户输入此词时触发)</label>
                    <input type="text" id="snippet-keyword" placeholder="例如: 启动卡片">
                </div>
                <div class="form-group">
                    <label>内容 (HTML代码)</label>
                    <textarea id="snippet-content" placeholder="输入HTML代码..." style="height:200px;"></textarea>
                </div>
                <div class="button-group">
                    <button class="settings-button" id="save-snippet-btn">保存</button>
                    <button class="settings-button" id="delete-snippet-btn" style="background-color: #dc3545; display:none;">删除</button>
                    <button class="settings-button" id="cancel-snippet-btn" style="background-color: #6c757d;">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(snippetModal);
    }

    // 词条弹窗
    const entryModal = document.getElementById('entry-modal');
    const entryNameInput = document.getElementById('entry-name');
    const entryContentInput = document.getElementById('entry-content');
    const entryCategorySelect = document.getElementById('entry-category');
    const entryPositionSelect = document.getElementById('entry-position');
    const entryGlobalCheckbox = document.getElementById('entry-global');
    const roleSelectGroup = document.getElementById('role-select-group');
    const roleList = document.getElementById('role-list');
    const newRoleInput = document.getElementById('new-role-input');
    const saveEntryBtn = document.getElementById('save-entry-btn');
    const deleteEntryBtn = document.getElementById('delete-entry-btn');
    const cancelEntryBtn = document.getElementById('cancel-entry-btn');
    const modalTitle = document.getElementById('modal-title');

    // 分类弹窗
    const categoryModal = document.getElementById('category-modal');
    const categoryNameInput = document.getElementById('category-name');
    const categoryGlobalCheckbox = document.getElementById('category-global');
    const catRoleSelectGroup = document.getElementById('cat-role-select-group');
    const catRoleList = document.getElementById('cat-role-list');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');

    // Navigation
    const backBtn = document.querySelector('#page-world-book .back-button');
    if(backBtn) backBtn.onclick = () => window.navigateTo('home');

    // =========== 数据管理 ===========

    function loadData() {
        categories = JSON.parse(localStorage.getItem('fruit-machine-wb-categories')) || [];
        entries = JSON.parse(localStorage.getItem('fruit-machine-wb-entries')) || [];
        htmlSnippets = JSON.parse(localStorage.getItem('fruit-machine-wb-html')) || [];
    }

    function saveData() {
        localStorage.setItem('fruit-machine-wb-categories', JSON.stringify(categories));
        localStorage.setItem('fruit-machine-wb-entries', JSON.stringify(entries));
        localStorage.setItem('fruit-machine-wb-html', JSON.stringify(htmlSnippets));
    }

    /**
     * 获取所有可用的角色列表 (从本地存储的应用+用户临时添加的)
     */
    function getAvailableRoles() {
        const roles = new Set(['default']); // 默认角色总是存在
        
        // 1. 从应用列表获取 (模拟角色)
        const apps = JSON.parse(localStorage.getItem('fruit-machine-apps')) || {};
        for(let appId in apps) {
             if(apps[appId].name) roles.add(apps[appId].name);
        }
        
        // 2. 从已保存的绑定关系中获取 (防止之前绑定的角色消失)
        categories.forEach(c => {
            if(c.boundRoles) c.boundRoles.forEach(r => roles.add(r));
        });
        entries.forEach(e => {
            if(e.boundRoles) e.boundRoles.forEach(r => roles.add(r));
        });

        return Array.from(roles);
    }

    // =========== 渲染逻辑 ===========

    function render() {
        if(currentTab === 'worldbook') {
            categoryListEl.style.display = 'flex';
            document.getElementById('snippet-list').style.display = 'none';
            document.querySelector('.wb-actions').style.display = 'flex'; // Show standard actions
            
            categoryListEl.innerHTML = '';
            // 1. 渲染未分类 (ID 0)
            const uncategorizedEntries = entries.filter(e => !e.categoryId || e.categoryId === '0');
            renderCategoryItem({ id: '0', name: '未分类', isGlobal: true }, uncategorizedEntries);

            // 2. 渲染其他分类
            categories.forEach(cat => {
                const catEntries = entries.filter(e => e.categoryId === cat.id);
                renderCategoryItem(cat, catEntries);
            });
        } else {
            categoryListEl.style.display = 'none';
            const snipList = document.getElementById('snippet-list');
            snipList.style.display = 'flex';
            document.querySelector('.wb-actions').style.display = 'none'; // Hide standard actions, show Add Snippet?
            
            // Render Snippets
            snipList.innerHTML = `<button class="settings-button" id="add-snippet-btn" style="margin-bottom:10px;">+ 新建HTML条目</button>`;
            document.getElementById('add-snippet-btn').onclick = () => openSnippetModal();
            
            htmlSnippets.forEach(snip => {
                const el = document.createElement('div');
                el.className = 'wb-entry';
                el.innerHTML = `
                    <div style="font-weight:bold;">${snip.keyword}</div>
                    <div style="font-size:10px; color:#666; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${snip.content.replace(/</g, '<')}</div>
                    <button class="del-btn" style="background:#ff3b30; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:10px;">删</button>
                `;
                el.onclick = () => openSnippetModal(snip.id);
                el.querySelector('.del-btn').onclick = (e) => {
                    e.stopPropagation();
                    if(confirm("确定删除?")) {
                        htmlSnippets = htmlSnippets.filter(s => s.id !== snip.id);
                        saveData();
                        render();
                    }
                };
                snipList.appendChild(el);
            });
        }
    }

    function renderCategoryItem(category, catEntries) {
        const catEl = document.createElement('div');
        catEl.classList.add('wb-category');
        catEl.dataset.id = category.id;

        // 标签
        let tagsHtml = '';
        if (category.id !== '0') {
            if (category.isGlobal) {
                tagsHtml += `<span class="wb-tag tag-global">全局</span>`;
            } else {
                tagsHtml += `<span class="wb-tag tag-role">绑定(${category.boundRoles ? category.boundRoles.length : 0})</span>`;
            }
        }

        catEl.innerHTML = `
            <div class="wb-category-header">
                <div>
                    <span class="wb-category-title">${category.name}</span>
                    ${tagsHtml}
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="add-to-cat-btn" style="font-size:12px; padding:2px 6px; border-radius:4px; border:none; background:#28a745; color:white;">+</button>
                    ${category.id !== '0' ? '<button class="del-cat-btn" style="font-size:12px; padding:2px 6px; border-radius:4px; border:none; background:#dc3545; color:white;">删</button>' : ''}
                    <span class="entry-count">${catEntries.length}</span>
                </div>
            </div>
            <div class="wb-entries">
                ${catEntries.map(entry => renderEntryItem(entry)).join('')}
            </div>
        `;
        
        if (category.id !== '0') {
            catEl.querySelector('.del-cat-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                currentEditCategoryId = category.id;
                deleteCategory(); // Use existing delete logic
            });
        }

        // 点击 "+" 号直接在该分类下添加
        const addBtn = catEl.querySelector('.add-to-cat-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发展开/折叠
            openEntryModal(null, category.id);
        });

        // 点击标题展开/折叠，或者进入分类编辑 (如果是未分类则不能编辑)
        const header = catEl.querySelector('.wb-category-header');
        header.addEventListener('click', (e) => {
            // 如果点击的是分类本身，展开/折叠
            // 如果要编辑分类，长按或者双击？这里简单处理：点击展开，点击标题右侧编辑按钮(待加)
            // 简单点：点击展开。如果是用户创建的分类，长按进入编辑？
            // 这里的交互：点击展开。如果要编辑分类，我们在标题旁加个小图标，或者双击标题
            if (catEl.classList.contains('expanded')) {
                catEl.classList.remove('expanded');
            } else {
                catEl.classList.add('expanded');
            }
        });

        // 双击编辑分类 (排除未分类)
        if (category.id !== '0') {
            header.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                openCategoryModal(category.id);
            });
        }

        // 绑定词条点击事件
        catEl.querySelectorAll('.wb-entry').forEach(entryEl => {
            entryEl.addEventListener('click', (e) => {
                e.stopPropagation();
                // 如果点击的是 checkbox
                if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                    toggleEntryEnabled(entryEl.dataset.id, e.target.checked);
                    return;
                }
                // 如果点击的是删除按钮
                if (e.target.classList.contains('del-entry-list-btn')) {
                    if(confirm("确定删除此词条?")) {
                        currentEditEntryId = entryEl.dataset.id;
                        deleteEntry();
                    }
                    return;
                }
                openEntryModal(entryEl.dataset.id);
            });
        });

        categoryListEl.appendChild(catEl);
    }

    /**
     * 切换词条启用状态
     */
    function toggleEntryEnabled(entryId, isEnabled) {
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
            entry.enabled = isEnabled;
            saveData();
            // 可以重新渲染，或者直接改变样式
            const entryEl = document.querySelector(`.wb-entry[data-id="${entryId}"]`);
            if (entryEl) {
                entryEl.style.opacity = isEnabled ? '1' : '0.5';
            }
        }
    }

    function renderEntryItem(entry) {
        let tags = '';
        if (entry.position === 'top') tags += `<span class="wb-tag tag-pos-top">Top</span>`;
        else if (entry.position === 'pre-persona') tags += `<span class="wb-tag tag-pos-pre">Pre</span>`;
        else if (entry.position === 'post-persona') tags += `<span class="wb-tag tag-pos-post">Post</span>`;

        if (!entry.isGlobal) tags += `<span class="wb-tag tag-role">绑定</span>`;

        const isEnabled = entry.enabled !== false; // 默认为 true
        const opacity = isEnabled ? '1' : '0.5';

        // 渲染开关
        const toggleHtml = `
            <div class="toggle-switch" style="display:inline-block; vertical-align:middle; margin-right:10px;" data-id="${entry.id}">
                <input type="checkbox" ${isEnabled ? 'checked' : ''} style="transform: scale(1.2); cursor: pointer;">
            </div>
        `;

        return `
            <div class="wb-entry" data-id="${entry.id}" style="opacity: ${opacity}; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center;">
                    ${toggleHtml}
                    <span>${entry.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    ${tags}
                    <button class="del-entry-list-btn" style="font-size:10px; padding:2px 5px; border-radius:4px; border:none; background:#dc3545; color:white;">删</button>
                </div>
            </div>
        `;
    }

    function renderRoleSelector(containerId, selectedRoles) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const allRoles = getAvailableRoles();
        
        allRoles.forEach(role => {
            const chip = document.createElement('div');
            chip.classList.add('role-chip');
            if (selectedRoles.includes(role)) chip.classList.add('selected');
            chip.textContent = role;
            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
            });
            container.appendChild(chip);
        });
    }

    function getSelectedRoles(containerId) {
        const container = document.getElementById(containerId);
        const selected = [];
        container.querySelectorAll('.role-chip.selected').forEach(chip => {
            selected.push(chip.textContent);
        });
        return selected;
    }


    // =========== 弹窗逻辑 (词条) ===========

    function openEntryModal(entryId = null, defaultCatId = '0') {
        currentEditEntryId = entryId;
        
        // 填充分类下拉框
        entryCategorySelect.innerHTML = '<option value="0">未分类</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            entryCategorySelect.appendChild(opt);
        });

        if (entryId) {
            // 编辑现有
            const entry = entries.find(e => e.id === entryId);
            if (!entry) return;

            modalTitle.textContent = '编辑词条';
            entryNameInput.value = entry.name;
            entryContentInput.value = entry.content;
            entryCategorySelect.value = entry.categoryId || '0';
            entryPositionSelect.value = entry.position;
            entryGlobalCheckbox.checked = entry.isGlobal;
            
            renderRoleSelector('role-list', entry.boundRoles || []);
            
            deleteEntryBtn.style.display = 'block';
        } else {
            // 新建
            modalTitle.textContent = '新建词条';
            entryNameInput.value = '';
            entryContentInput.value = '';
            entryCategorySelect.value = defaultCatId;
            entryPositionSelect.value = 'top'; // 默认
            entryGlobalCheckbox.checked = true; // 默认全局
            
            // 如果选择了分类，且分类非全局，则继承分类设置
            if (defaultCatId !== '0') {
                const cat = categories.find(c => c.id === defaultCatId);
                if (cat) {
                    entryGlobalCheckbox.checked = cat.isGlobal;
                    renderRoleSelector('role-list', cat.boundRoles || []);
                } else {
                    renderRoleSelector('role-list', []);
                }
            } else {
                renderRoleSelector('role-list', []);
            }

            deleteEntryBtn.style.display = 'none';
        }

        toggleRoleSelectGroup();
        entryModal.classList.add('active');
    }

    function closeEntryModal() {
        entryModal.classList.remove('active');
    }

    function saveEntry() {
        const name = entryNameInput.value.trim();
        const content = entryContentInput.value; // 允许为空? 最好不要
        if (!name) { alert('请输入名称'); return; }

        const isGlobal = entryGlobalCheckbox.checked;
        const boundRoles = isGlobal ? [] : getSelectedRoles('role-list');

        // 保留原有的 enabled 状态
        let enabledState = true;
        if (currentEditEntryId) {
            const existing = entries.find(e => e.id === currentEditEntryId);
            if (existing && existing.enabled !== undefined) {
                enabledState = existing.enabled;
            }
        }

        const entryData = {
            id: currentEditEntryId || Date.now().toString(),
            name: name,
            content: content,
            categoryId: entryCategorySelect.value,
            position: entryPositionSelect.value,
            isGlobal: isGlobal,
            boundRoles: boundRoles,
            enabled: enabledState
        };

        if (currentEditEntryId) {
            const index = entries.findIndex(e => e.id === currentEditEntryId);
            if (index !== -1) entries[index] = entryData;
        } else {
            entries.push(entryData);
        }

        saveData();
        render();
        closeEntryModal();
    }

    function deleteEntry() {
        if (!currentEditEntryId) return;
        if (confirm('确定删除此词条吗？')) {
            entries = entries.filter(e => e.id !== currentEditEntryId);
            saveData();
            render();
            closeEntryModal();
        }
    }

    // =========== 弹窗逻辑 (分类) ===========

    function openCategoryModal(catId = null) {
        currentEditCategoryId = catId;

        // 刷新角色列表供选择
        renderRoleSelector('cat-role-list', []);

        if (catId) {
            const cat = categories.find(c => c.id === catId);
            if (!cat) return;
            categoryNameInput.value = cat.name;
            categoryGlobalCheckbox.checked = cat.isGlobal;
            renderRoleSelector('cat-role-list', cat.boundRoles || []);
            deleteCategoryBtn.style.display = 'block';
        } else {
            categoryNameInput.value = '';
            categoryGlobalCheckbox.checked = true;
            deleteCategoryBtn.style.display = 'none';
        }

        toggleCatRoleSelectGroup();
        categoryModal.classList.add('active');
    }

    function closeCategoryModal() {
        categoryModal.classList.remove('active');
    }

    function saveCategory() {
        const name = categoryNameInput.value.trim();
        if (!name) { alert('请输入分类名称'); return; }

        const isGlobal = categoryGlobalCheckbox.checked;
        const boundRoles = isGlobal ? [] : getSelectedRoles('cat-role-list');

        const catData = {
            id: currentEditCategoryId || Date.now().toString(),
            name: name,
            isGlobal: isGlobal,
            boundRoles: boundRoles
        };

        if (currentEditCategoryId) {
            const index = categories.findIndex(c => c.id === currentEditCategoryId);
            if (index !== -1) categories[index] = catData;
        } else {
            categories.push(catData);
        }

        saveData();
        render();
        closeCategoryModal();
    }

    function deleteCategory() {
        if (!currentEditCategoryId) return;
        if (confirm('删除分类会将该分类下的所有词条移动到“未分类”，确定吗？')) {
            // 移动词条
            entries.forEach(e => {
                if (e.categoryId === currentEditCategoryId) {
                    e.categoryId = '0';
                }
            });
            // 删除分类
            categories = categories.filter(c => c.id !== currentEditCategoryId);
            saveData();
            render();
            closeCategoryModal();
        }
    }


    // =========== 事件监听 ===========

    // 新增按钮
    addEntryBtn.addEventListener('click', () => openEntryModal());
    addCategoryBtn.addEventListener('click', () => openCategoryModal());

    // 词条弹窗按钮
    saveEntryBtn.addEventListener('click', saveEntry);
    deleteEntryBtn.addEventListener('click', deleteEntry);
    cancelEntryBtn.addEventListener('click', closeEntryModal);

    // 分类弹窗按钮
    saveCategoryBtn.addEventListener('click', saveCategory);
    deleteCategoryBtn.addEventListener('click', deleteCategory);
    cancelCategoryBtn.addEventListener('click', closeCategoryModal);

    // 复选框显隐逻辑
    function toggleRoleSelectGroup() {
        roleSelectGroup.style.display = entryGlobalCheckbox.checked ? 'none' : 'block';
    }
    entryGlobalCheckbox.addEventListener('change', toggleRoleSelectGroup);

    function toggleCatRoleSelectGroup() {
        catRoleSelectGroup.style.display = categoryGlobalCheckbox.checked ? 'none' : 'block';
    }
    categoryGlobalCheckbox.addEventListener('change', toggleCatRoleSelectGroup);

    // 动态添加角色Tag
    newRoleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = newRoleInput.value.trim();
            if (val) {
                const container = document.getElementById('role-list');
                const chip = document.createElement('div');
                chip.classList.add('role-chip', 'selected');
                chip.textContent = val;
                chip.addEventListener('click', () => chip.classList.toggle('selected'));
                container.appendChild(chip);
                newRoleInput.value = '';
            }
        }
    });


    // Snippet Modal Logic
    const snippetModal = document.getElementById('snippet-modal'); // created dynamically
    
    window.openSnippetModal = (id = null) => {
        const modal = document.getElementById('snippet-modal');
        if(!modal) return;
        currentEditSnippetId = id;
        modal.classList.add('active');
        
        const kwInput = document.getElementById('snippet-keyword');
        const ctInput = document.getElementById('snippet-content');
        const delBtn = document.getElementById('delete-snippet-btn');
        
        if(id) {
            const snip = htmlSnippets.find(s => s.id === id);
            kwInput.value = snip.keyword;
            ctInput.value = snip.content;
            delBtn.style.display = 'block';
        } else {
            kwInput.value = '';
            ctInput.value = '';
            delBtn.style.display = 'none';
        }
    };
    
    // Bind dynamic modal buttons (only once)
    document.addEventListener('click', (e) => {
        if(e.target.id === 'tab-btn-wb') {
            currentTab = 'worldbook';
            document.getElementById('tab-btn-wb').style.background = '#ff8787';
            document.getElementById('tab-btn-html').style.background = '#ccc';
            render();
        }
        if(e.target.id === 'tab-btn-html') {
            currentTab = 'html';
            document.getElementById('tab-btn-wb').style.background = '#ccc';
            document.getElementById('tab-btn-html').style.background = '#ff8787';
            render();
        }
        if(e.target.id === 'cancel-snippet-btn') {
            document.getElementById('snippet-modal').classList.remove('active');
        }
        if(e.target.id === 'save-snippet-btn') {
            const kw = document.getElementById('snippet-keyword').value.trim();
            const ct = document.getElementById('snippet-content').value;
            if(!kw) return alert("Keyword required");
            
            const data = { id: currentEditSnippetId || Date.now().toString(), keyword: kw, content: ct };
            if(currentEditSnippetId) {
                const idx = htmlSnippets.findIndex(s => s.id === currentEditSnippetId);
                if(idx!==-1) htmlSnippets[idx] = data;
            } else {
                htmlSnippets.push(data);
            }
            saveData();
            document.getElementById('snippet-modal').classList.remove('active');
            render();
        }
        if(e.target.id === 'delete-snippet-btn') {
            if(confirm("Delete snippet?")) {
                htmlSnippets = htmlSnippets.filter(s => s.id !== currentEditSnippetId);
                saveData();
                document.getElementById('snippet-modal').classList.remove('active');
                render();
            }
        }
    });

    // =========== 初始化 ===========
    loadData();
    render();
    
    // 加载全局字体 (从主页同步逻辑，或者直接引用beautify.js里的逻辑，但这里我们简单重复一下以免依赖)
    const savedFont = localStorage.getItem('fruit-machine-custom-font');
    if (savedFont) {
        let fontStyle = document.createElement('style');
        fontStyle.innerHTML = `
            @font-face { font-family: 'CustomUserFont'; src: url('${savedFont}'); font-display: swap; }
            body, button, input, textarea, select { font-family: 'CustomUserFont', -apple-system, sans-serif !important; }
        `;
        document.head.appendChild(fontStyle);
    }
});

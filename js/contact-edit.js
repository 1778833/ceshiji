document.addEventListener('DOMContentLoaded', () => {
    console.log("Contact Edit Script Loaded");

    // =========== 状态管理 ===========
    let contacts = [], categories = [], entries = [], userPresets = [];
    
    try {
        contacts = JSON.parse(localStorage.getItem('fruit-machine-contacts')) || [];
        categories = JSON.parse(localStorage.getItem('fruit-machine-wb-categories')) || [];
        entries = JSON.parse(localStorage.getItem('fruit-machine-wb-entries')) || [];
        userPresets = JSON.parse(localStorage.getItem('fruit-machine-user-presets')) || [];
    } catch (e) {
        console.error("Error loading localStorage data", e);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const contactId = urlParams.get('id');
    let currentContact = contactId ? contacts.find(c => c.id === contactId) : null;
    let currentAvatarBase64 = currentContact ? currentContact.avatar : null;

    // =========== DOM 元素 ===========
    const contactForm = document.getElementById('contact-form');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('contact-avatar-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const wbListContainer = document.getElementById('wb-list-container');
    const userPresetSelect = document.getElementById('user-preset-select');
    const relationshipList = document.getElementById('relationship-list');
    
    if (!contactForm) {
        console.error("Critical Error: Contact form not found!");
        return;
    }

    // =========== 初始化界面 ===========

    // 1. 头像
    if (currentAvatarBase64 && avatarPreview) {
        avatarPreview.src = currentAvatarBase64;
        avatarPreview.style.display = 'block';
        if(avatarPlaceholder) avatarPlaceholder.style.display = 'none';
    }

    // 2. 填充表单 (如果是编辑模式)
    if (currentContact) {
        if(document.getElementById('contact-id')) document.getElementById('contact-id').value = currentContact.id;
        if(document.getElementById('contact-name')) document.getElementById('contact-name').value = currentContact.name;
        if(document.getElementById('contact-remark')) document.getElementById('contact-remark').value = currentContact.remark || '';
        if(document.getElementById('contact-persona')) document.getElementById('contact-persona').value = currentContact.persona || '';
        
        // 关系列表
        if (currentContact.relationships) {
            currentContact.relationships.forEach(rel => addRelationship(rel));
        }
    } else {
        // 新建模式，默认加一个空关系
        addRelationship();
    }

    // 3. 填充用户预设下拉框
    if (userPresetSelect) {
        if (userPresets.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = "(无用户预设，请先去设置)";
            userPresetSelect.appendChild(opt);
        } else {
            userPresets.forEach(preset => {
                const opt = document.createElement('option');
                opt.value = preset.id;
                opt.textContent = `${preset.name} (${preset.userName})`;
                userPresetSelect.appendChild(opt);
            });
        }
        
        if (currentContact && currentContact.boundUserPresetId) {
            userPresetSelect.value = currentContact.boundUserPresetId;
        }
    }

    // 4. 渲染世界书选择列表
    if (wbListContainer) {
        renderWorldbookSelect();
    }


    // =========== 功能函数 ===========

    function renderWorldbookSelect() {
        wbListContainer.innerHTML = '';
        const roleName = currentContact ? currentContact.name : null; 

        let hasContent = false;

        // 处理未分类 (ID '0')
        const uncategorizedEntries = entries.filter(e => !e.categoryId || e.categoryId === '0');
        if (uncategorizedEntries.length > 0) {
            renderWBCategory({ id: '0', name: '未分类' }, uncategorizedEntries, roleName);
            hasContent = true;
        }

        // 处理其他分类
        categories.forEach(cat => {
            const catEntries = entries.filter(e => e.categoryId === cat.id);
            renderWBCategory(cat, catEntries, roleName);
            hasContent = true;
        });

        if (!hasContent) {
            wbListContainer.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无世界书内容，请先去世界书添加。</div>';
        }
    }

    function renderWBCategory(cat, catEntries, roleName) {
        const catDiv = document.createElement('div');
        catDiv.className = 'wb-category-item';

        const isCatBound = roleName && cat.boundRoles && cat.boundRoles.includes(roleName);

        catDiv.innerHTML = `
            <div class="wb-cat-header">
                <input type="checkbox" class="cat-checkbox" data-id="${cat.id}" ${isCatBound ? 'checked' : ''}>
                <span>${cat.name} (${catEntries.length})</span>
            </div>
            <div class="wb-entries-list">
                ${catEntries.map(entry => {
                    const isEntryBound = roleName && entry.boundRoles && entry.boundRoles.includes(roleName);
                    return `
                        <div class="wb-entry-item">
                            <input type="checkbox" class="entry-checkbox" data-id="${entry.id}" data-cat-id="${cat.id}" ${isEntryBound ? 'checked' : ''}>
                            <span>${entry.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        const catHeader = catDiv.querySelector('.wb-cat-header');
        const catCheckbox = catDiv.querySelector('.cat-checkbox');
        const entriesList = catDiv.querySelector('.wb-entries-list');
        const entryCheckboxes = catDiv.querySelectorAll('.entry-checkbox');

        catHeader.addEventListener('click', (e) => {
            if (e.target !== catCheckbox) {
                entriesList.classList.toggle('expanded');
            }
        });

        catCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            entryCheckboxes.forEach(cb => cb.checked = isChecked);
        });

        wbListContainer.appendChild(catDiv);
    }

    // 头像处理
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    currentAvatarBase64 = evt.target.result;
                    if (avatarPreview) {
                        avatarPreview.src = currentAvatarBase64;
                        avatarPreview.style.display = 'block';
                    }
                    if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    // 手动添加关系
    window.addRelationship = (data = null) => {
        if (!relationshipList) return;
        const div = document.createElement('div');
        div.className = 'relation-item';
        div.innerHTML = `
            <div style="flex:1; margin-right:5px;">
                <input type="text" placeholder="对方姓名" class="rel-name" value="${data ? data.name : ''}" style="width:100%; margin-bottom:5px;">
                <input type="text" placeholder="关系" class="rel-type" value="${data ? data.relationship : ''}" style="width:100%;">
            </div>
            <div style="flex:1.5; margin-right:5px;">
                 <textarea placeholder="对方设定简述..." class="rel-desc" style="width:100%; height:60px; font-size:12px;">${data ? data.description : ''}</textarea>
            </div>
            <button type="button" onclick="this.parentElement.remove()" style="border:none; background:none; color:#999;">✖</button>
        `;
        relationshipList.appendChild(div);
    };

    // AI 生成关系
    const btnAiGen = document.getElementById('btn-ai-gen');
    if (btnAiGen) {
        btnAiGen.addEventListener('click', async () => {
            const promptText = document.getElementById('ai-gen-prompt').value.trim();
            const count = parseInt(document.getElementById('ai-gen-count').value);
            const loadingDiv = document.getElementById('ai-loading');
            
            if (!promptText) { alert("请填写要求！"); return; }

            // 健壮的配置读取
            let apiAddress = localStorage.getItem('api-address');
            let apiKey = localStorage.getItem('api-key');
            let apiModel = localStorage.getItem('api-model');
            const apiConfigStr = localStorage.getItem('fruit-machine-api-config');
            if (apiConfigStr) {
                try {
                    const cfg = JSON.parse(apiConfigStr);
                    if (cfg.address) apiAddress = cfg.address;
                    if (cfg.key) apiKey = cfg.key;
                    if (cfg.model) apiModel = cfg.model;
                } catch (e) {}
            }

            if (!apiAddress || !apiKey || !apiModel) {
                alert("请先配置 API！");
                return;
            }

            apiAddress = apiAddress.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '');
            
            loadingDiv.style.display = 'block';
            loadingDiv.textContent = '生成中...';

            try {
                const systemPrompt = "你是一个专业的小说人物设定助手。用户会给出一些关于人际关系的要求，你需要根据这些要求，生成指定数量的人物设定。生成的每个人物必须包含：姓名、性别、年龄、生日、外貌性格、背景经历、与用户的关系。请严格按照JSON数组格式返回，不要包含任何Markdown格式代码块标记。JSON格式如下：[{ \"name\": \"姓名\", \"relationship\": \"关系\", \"description\": \"完整人设描述...\" }]";
                const userMessage = `请生成 ${count} 个人物，要求：${promptText}。`;

                let fetchUrl = apiAddress;
                if (fetchUrl.endsWith('/v1')) fetchUrl += '/chat/completions';
                else fetchUrl += '/v1/chat/completions';

                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: apiModel,
                        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
                        temperature: 1.0
                    })
                });

                if (!response.ok) throw new Error(response.status);
                const data = await response.json();
                const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                const rels = JSON.parse(content);
                
                if (Array.isArray(rels)) {
                    rels.forEach(r => addRelationship(r));
                    alert(`生成了 ${rels.length} 个关系！`);
                } else {
                    alert("格式解析失败");
                }
            } catch (e) {
                alert("生成失败: " + e.message);
            } finally {
                loadingDiv.style.display = 'none';
            }
        });
    }

    // =========== 保存逻辑 ===========

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // 阻止默认提交
        console.log("Saving contact...");
        
        const nameInput = document.getElementById('contact-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        if (!name) return;

        // 1. 收集关系
        const rels = [];
        document.querySelectorAll('.relation-item').forEach(item => {
            const rName = item.querySelector('.rel-name').value.trim();
            const rType = item.querySelector('.rel-type').value.trim();
            const rDesc = item.querySelector('.rel-desc').value.trim();
            if (rName && rType) rels.push({ name: rName, relationship: rType, description: rDesc });
        });

        // 2. 收集表单数据
        const contactData = {
            id: document.getElementById('contact-id').value || Date.now().toString(),
            name: name,
            remark: document.getElementById('contact-remark').value.trim(),
            persona: document.getElementById('contact-persona').value.trim(),
            boundUserPresetId: userPresetSelect ? userPresetSelect.value : '',
            avatar: currentAvatarBase64,
            relationships: rels
        };

        // 3. 更新联系人列表
        if (currentContact) {
            const index = contacts.findIndex(c => c.id === currentContact.id);
            if (index !== -1) contacts[index] = contactData;
        } else {
            contacts.push(contactData);
        }
        localStorage.setItem('fruit-machine-contacts', JSON.stringify(contacts));

        // 4. 同步世界书绑定
        syncWorldbookBindings(name);

        alert("联系人已保存！");
        window.location.href = 'chat.html'; // 跳转回列表
    });

    function syncWorldbookBindings(roleName) {
        // 获取所有选中的分类ID
        const checkedCatIds = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.dataset.id);
        // 获取所有选中的词条ID
        const checkedEntryIds = Array.from(document.querySelectorAll('.entry-checkbox:checked')).map(cb => cb.dataset.id);

        let dataChanged = false;

        // 更新分类
        categories.forEach(cat => {
            if (!cat.boundRoles) cat.boundRoles = [];
            let changed = false;
            
            if (checkedCatIds.includes(cat.id)) {
                if (!cat.boundRoles.includes(roleName)) {
                    cat.boundRoles.push(roleName);
                    changed = true;
                }
            } else {
                // 如果当前未选中，且列表中有该名字，移除之
                // 注意：这里简化逻辑，不处理改名后的旧名字移除，仅处理当前名字的解绑
                const idx = cat.boundRoles.indexOf(roleName);
                if (idx !== -1) {
                    cat.boundRoles.splice(idx, 1);
                    changed = true;
                }
            }
            if(changed) dataChanged = true;
        });

        // 更新词条
        entries.forEach(entry => {
            if (!entry.boundRoles) entry.boundRoles = [];
            let changed = false;
            
            if (checkedEntryIds.includes(entry.id)) {
                if (!entry.boundRoles.includes(roleName)) {
                    entry.boundRoles.push(roleName);
                    changed = true;
                }
            } else {
                const idx = entry.boundRoles.indexOf(roleName);
                if (idx !== -1) {
                    entry.boundRoles.splice(idx, 1);
                    changed = true;
                }
            }
            if(changed) dataChanged = true;
        });

        if (dataChanged) {
            localStorage.setItem('fruit-machine-wb-categories', JSON.stringify(categories));
            localStorage.setItem('fruit-machine-wb-entries', JSON.stringify(entries));
        }
    }
});

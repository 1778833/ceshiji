// page-contact-edit.js
(function() {
    let currentContact = null;
    let currentAvatarBase64 = null;
    let contacts = [], categories = [], entries = [], userPresets = [];

    // Safe JSON parse
    function getSafeJSON(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Error parsing ${key}`, e);
            return defaultValue;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const avatarInput = document.querySelector('#page-contact-edit #avatar-input');
        const avatarPreview = document.querySelector('#page-contact-edit #contact-avatar-preview');
        const avatarPlaceholder = document.querySelector('#page-contact-edit #avatar-placeholder');
        
        const backBtn = document.querySelector('#page-contact-edit .back-button');
        if(backBtn) backBtn.onclick = (e) => { e.preventDefault(); window.navigateTo('chat'); };

        const avatarContainer = document.querySelector('#page-contact-edit #avatar-container');
        if(avatarContainer) {
            avatarContainer.addEventListener('click', () => {
                if(avatarInput) avatarInput.click();
            });
        }

        if(avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files[0]) {
                    try {
                        const resultUrl = await window.compressImage(e.target.files[0], 256, 256, 0.8);
                        currentAvatarBase64 = resultUrl;
                        if(avatarPreview) {
                            avatarPreview.src = currentAvatarBase64;
                            avatarPreview.style.display = 'block';
                        }
                        if(avatarPlaceholder) avatarPlaceholder.style.display = 'none';
                    } catch (error) {
                        console.error('头像压缩失败:', error);
                        alert('头像处理失败，请重试');
                    }
                }
            });
        }

        const btnAddRel = document.querySelector('#page-contact-edit #btn-add-rel');
        if(btnAddRel) btnAddRel.addEventListener('click', () => addRelationshipItem());

        const form = document.querySelector('#page-contact-edit #contact-form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveContact(false);
            });
        }

        const btnAddToChat = document.querySelector('#page-contact-edit #btn-add-to-chat');
        if(btnAddToChat) {
            btnAddToChat.addEventListener('click', (e) => {
                e.preventDefault();
                saveContact(true);
            });
        }

        const btnAiGen = document.querySelector('#page-contact-edit #btn-ai-gen');
        if(btnAiGen) btnAiGen.addEventListener('click', async () => {
            const prompt = document.querySelector('#page-contact-edit #ai-gen-prompt').value.trim();
            const count = document.querySelector('#page-contact-edit #ai-gen-count').value;
            if(!prompt) return alert("请输入要求");
            
            let apiAddress = localStorage.getItem('api-address');
            let apiKey = localStorage.getItem('api-key');
            let apiModel = localStorage.getItem('api-model');
            try {
                const cfg = JSON.parse(localStorage.getItem('fruit-machine-api-config'));
                if(cfg) { apiAddress = cfg.address; apiKey = cfg.key; apiModel = cfg.model; }
            } catch(e){}

            if(!apiAddress || !apiKey) return alert("请配置API");
            
            const loading = document.querySelector('#page-contact-edit #ai-loading');
            if(loading) loading.style.display = 'block';
            
            try {
                apiAddress = apiAddress.replace(/\/+$/, '');
                const url = apiAddress.endsWith('/v1') ? apiAddress + '/chat/completions' : apiAddress + '/v1/chat/completions';
                
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                    body: JSON.stringify({
                        model: apiModel,
                        messages: [
                            { role: 'system', content: '生成JSON数组: [{"name":"名","relationship":"关系","description":"描述"}]' },
                            { role: 'user', content: `生成${count}个人: ${prompt}` }
                        ]
                    })
                });
                const data = await res.json();
                const json = JSON.parse(data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, ''));
                json.forEach(r => addRelationshipItem(r));
            } catch(e) {
                alert("AI生成失败: " + e.message);
            } finally {
                if(loading) loading.style.display = 'none';
            }
        });
    });

    window.initPageContactEdit = function() {
        contacts = getSafeJSON('fruit-machine-contacts');
        categories = getSafeJSON('fruit-machine-wb-categories');
        entries = getSafeJSON('fruit-machine-wb-entries');
        userPresets = getSafeJSON('fruit-machine-user-presets');

        const contactId = window.spaParams.id;
        currentContact = contactId ? contacts.find(c => c.id === contactId) : null;
        currentAvatarBase64 = currentContact ? currentContact.avatar : null;

        const avatarPreview = document.querySelector('#page-contact-edit #contact-avatar-preview');
        const avatarPlaceholder = document.querySelector('#page-contact-edit #avatar-placeholder');
        const userPresetSelect = document.querySelector('#page-contact-edit #user-preset-select');
        const relationshipList = document.querySelector('#page-contact-edit #relationship-list');

        if (currentAvatarBase64 && avatarPreview) {
            avatarPreview.src = currentAvatarBase64;
            avatarPreview.style.display = 'block';
            if(avatarPlaceholder) avatarPlaceholder.style.display = 'none';
        } else {
            if(avatarPreview) avatarPreview.style.display = 'none';
            if(avatarPlaceholder) avatarPlaceholder.style.display = 'flex';
        }

        if(relationshipList) relationshipList.innerHTML = '';

        if (currentContact) {
            document.querySelector('#page-contact-edit #contact-id').value = currentContact.id;
            document.querySelector('#page-contact-edit #contact-name').value = currentContact.name;
            document.querySelector('#page-contact-edit #contact-remark').value = currentContact.remark || '';
            document.querySelector('#page-contact-edit #contact-persona').value = currentContact.persona || '';
            
            if (currentContact.relationships) {
                currentContact.relationships.forEach(rel => addRelationshipItem(rel));
            }
        } else {
            document.querySelector('#page-contact-edit #contact-id').value = '';
            document.querySelector('#page-contact-edit #contact-name').value = '';
            document.querySelector('#page-contact-edit #contact-remark').value = '';
            document.querySelector('#page-contact-edit #contact-persona').value = '';
            addRelationshipItem();
        }

        if(userPresetSelect) {
            userPresetSelect.innerHTML = '<option value="">-- 全局通用 --</option>';
            userPresets.forEach(preset => {
                const opt = document.createElement('option');
                opt.value = preset.id;
                opt.textContent = `${preset.name} (${preset.userName})`;
                userPresetSelect.appendChild(opt);
            });
            if (currentContact && currentContact.boundUserPresetId) {
                userPresetSelect.value = currentContact.boundUserPresetId;
            }
        }

        renderWorldbook();
    };

    function renderWorldbook() {
        const wbListContainer = document.querySelector('#page-contact-edit #wb-list-container');
        if(!wbListContainer) return;
        
        wbListContainer.innerHTML = '';
        const roleName = currentContact ? currentContact.name : null;
        let hasContent = false;

        const uncategorized = entries.filter(e => !e.categoryId || e.categoryId === '0');
        if (uncategorized.length > 0) {
            renderCategory({ id: '0', name: '未分类' }, uncategorized, roleName, wbListContainer);
            hasContent = true;
        }

        categories.forEach(cat => {
            const catEntries = entries.filter(e => e.categoryId === cat.id);
            renderCategory(cat, catEntries, roleName, wbListContainer);
            hasContent = true;
        });

        if (!hasContent) {
            wbListContainer.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无世界书内容</div>';
        }
    }

    function renderCategory(cat, catEntries, roleName, container) {
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
                        </div>`;
                }).join('')}
            </div>
        `;

        const header = catDiv.querySelector('.wb-cat-header');
        const checkbox = catDiv.querySelector('.cat-checkbox');
        const list = catDiv.querySelector('.wb-entries-list');
        const entryChecks = catDiv.querySelectorAll('.entry-checkbox');

        header.addEventListener('click', (e) => {
            if (e.target !== checkbox) list.classList.toggle('expanded');
        });

        checkbox.addEventListener('change', () => {
            entryChecks.forEach(cb => cb.checked = checkbox.checked);
        });

        container.appendChild(catDiv);
    }

    function addRelationshipItem(data = null) {
        const relationshipList = document.querySelector('#page-contact-edit #relationship-list');
        if(!relationshipList) return;
        
        const div = document.createElement('div');
        div.className = 'relation-item';
        div.innerHTML = `
            <div style="flex:1; margin-right:5px;">
                <input type="text" placeholder="姓名" class="rel-name" value="${data ? data.name : ''}" style="width:100%; margin-bottom:5px;">
                <input type="text" placeholder="关系" class="rel-type" value="${data ? data.relationship : ''}" style="width:100%;">
            </div>
            <div style="flex:1.5; margin-right:5px;">
                <textarea placeholder="简述..." class="rel-desc" style="width:100%; height:60px; font-size:12px;">${data ? data.description : ''}</textarea>
            </div>
            <button type="button" class="del-btn" style="border:none; background:none; color:#999;">✖</button>
        `;
        div.querySelector('.del-btn').addEventListener('click', () => div.remove());
        relationshipList.appendChild(div);
    }

    function saveContact(addToChat = false) {
        const nameInput = document.querySelector('#page-contact-edit #contact-name');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) { alert("请输入姓名"); return; }

        const rels = [];
        document.querySelectorAll('#page-contact-edit .relation-item').forEach(item => {
            const relNameInput = item.querySelector('.rel-name');
            const relTypeInput = item.querySelector('.rel-type');
            const relDescInput = item.querySelector('.rel-desc');
            
            if (relNameInput && relTypeInput && relDescInput) {
                const rName = relNameInput.value.trim();
                const rType = relTypeInput.value.trim();
                const rDesc = relDescInput.value.trim();
                if (rName && rType) rels.push({ name: rName, relationship: rType, description: rDesc });
            }
        });

        const userPresetSelect = document.querySelector('#page-contact-edit #user-preset-select');
        const currentId = document.querySelector('#page-contact-edit #contact-id').value;
        const newData = {
            id: currentId || Date.now().toString(),
            name: name,
            remark: document.querySelector('#page-contact-edit #contact-remark').value.trim(),
            persona: document.querySelector('#page-contact-edit #contact-persona').value.trim(),
            boundUserPresetId: userPresetSelect ? userPresetSelect.value : '',
            avatar: currentAvatarBase64,
            relationships: rels,
            group: 'role'
        };

        if (addToChat) {
            newData.inChatList = true;
        } else if (currentContact && currentContact.inChatList) {
            newData.inChatList = true;
        }

        if (currentId && currentContact) {
            const idx = contacts.findIndex(c => c.id === currentId);
            if (idx !== -1) {
                contacts[idx] = { ...contacts[idx], ...newData };
            } else {
                contacts.push(newData);
            }
        } else {
            contacts.push(newData);
        }
        localStorage.setItem('fruit-machine-contacts', JSON.stringify(contacts));

        syncWorldbook(name);

        if (addToChat) {
            alert("已添加到消息列表！");
        } else {
            alert("保存成功！");
        }
        window.navigateTo('chat');
    }

    function syncWorldbook(roleName) {
        const checkedCats = Array.from(document.querySelectorAll('#page-contact-edit .cat-checkbox:checked')).map(cb => cb.dataset.id);
        const checkedEntries = Array.from(document.querySelectorAll('#page-contact-edit .entry-checkbox:checked')).map(cb => cb.dataset.id);

        let changed = false;
        
        categories.forEach(cat => {
            if (!cat.boundRoles) cat.boundRoles = [];
            const has = cat.boundRoles.includes(roleName);
            const want = checkedCats.includes(cat.id);
            if (has !== want) {
                if (want) cat.boundRoles.push(roleName);
                else cat.boundRoles.splice(cat.boundRoles.indexOf(roleName), 1);
                changed = true;
            }
        });

        entries.forEach(entry => {
            if (!entry.boundRoles) entry.boundRoles = [];
            const has = entry.boundRoles.includes(roleName);
            const want = checkedEntries.includes(entry.id);
            if (has !== want) {
                if (want) entry.boundRoles.push(roleName);
                else entry.boundRoles.splice(entry.boundRoles.indexOf(roleName), 1);
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem('fruit-machine-wb-categories', JSON.stringify(categories));
            localStorage.setItem('fruit-machine-wb-entries', JSON.stringify(entries));
        }
    }
})();

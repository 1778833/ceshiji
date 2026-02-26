// page-user-settings.js
(function() {
    let presets = [];
    let listContainer, modal, form, avatarInput, avatarPreview, avatarPlaceholder, relList;
    let currentAvatarBase64 = null;

    document.addEventListener('DOMContentLoaded', () => {
        listContainer = document.querySelector('#page-user-settings #preset-list-container');
        modal = document.querySelector('#page-user-settings #edit-modal');
        form = document.querySelector('#page-user-settings #preset-form');
        avatarInput = document.querySelector('#page-user-settings #avatar-input');
        avatarPreview = document.querySelector('#page-user-settings #preset-avatar-preview');
        avatarPlaceholder = document.querySelector('#page-user-settings #avatar-placeholder');
        relList = document.querySelector('#page-user-settings #relationship-list');

        const backBtn = document.querySelector('#page-user-settings .back-button');
        if(backBtn) backBtn.onclick = (e) => { e.preventDefault(); window.navigateTo('chat'); };

        if(document.querySelector('#page-user-settings #avatar-container')) {
            document.querySelector('#page-user-settings #avatar-container').addEventListener('click', () => avatarInput.click());
        }
        
        if(avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                if(e.target.files[0]) {
                    try {
                        currentAvatarBase64 = await window.compressImage(e.target.files[0], 256, 256, 0.8);
                        updateAvatarView();
                    } catch(err) {
                        console.error(err);
                        alert("图片处理失败");
                    }
                }
            });
        }

        const btnAddRel = document.querySelector('#page-user-settings #btn-add-rel');
        if(btnAddRel) btnAddRel.addEventListener('click', () => addRelItem());

        const btnAiGen = document.querySelector('#page-user-settings #btn-ai-gen');
        if(btnAiGen) btnAiGen.addEventListener('click', async () => {
            const prompt = document.querySelector('#page-user-settings #ai-gen-prompt').value;
            const count = document.querySelector('#page-user-settings #ai-gen-count').value;
            if(!prompt) return alert("请输入要求");
            
            let api = localStorage.getItem('api-address');
            let key = localStorage.getItem('api-key');
            let model = localStorage.getItem('api-model');
            try {
                const cfg = JSON.parse(localStorage.getItem('fruit-machine-api-config'));
                if(cfg) { api = cfg.address; key = cfg.key; model = cfg.model; }
            } catch(e){}

            if(!api || !key) return alert("请先配置API");
            
            document.querySelector('#page-user-settings #ai-loading').style.display = 'block';
            try {
                api = api.replace(/\/+$/, '');
                const url = api.endsWith('/v1') ? api + '/chat/completions' : api + '/v1/chat/completions';
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+key },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: '返回JSON数组: [{"name":"名","relationship":"关系","description":"描述"}]' },
                            { role: 'user', content: `生成${count}个: ${prompt}` }
                        ]
                    })
                });
                const d = await res.json();
                const json = JSON.parse(d.choices[0].message.content.replace(/```json/g, '').replace(/```/g, ''));
                json.forEach(r => addRelItem(r));
            } catch(e) { alert("出错: "+e.message); }
            finally { document.querySelector('#page-user-settings #ai-loading').style.display = 'none'; }
        });

        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    const id = document.querySelector('#page-user-settings #edit-preset-id').value;
                    const name = document.querySelector('#page-user-settings #preset-name').value;
                    
                    const rels = [];
                    let contacts = JSON.parse(localStorage.getItem('fruit-machine-contacts')) || [];
                    let contactsChanged = false;

                    document.querySelectorAll('#page-user-settings .relation-item').forEach(el => {
                        const relNameInput = el.querySelector('.rel-name');
                        const relTypeInput = el.querySelector('.rel-type');
                        const relDescInput = el.querySelector('.rel-desc');
                        const syncInput = el.querySelector('.sync-contact');
                        
                        if (relNameInput && relTypeInput && relDescInput && syncInput) {
                            const rName = relNameInput.value.trim();
                            const rType = relTypeInput.value.trim();
                            const rDesc = relDescInput.value.trim();
                            const sync = syncInput.checked;
                            
                            if(rName && rType) {
                                rels.push({ name: rName, relationship: rType, description: rDesc });
                                if(sync) {
                                    contacts.push({ 
                                        id: Date.now().toString() + Math.random().toString().substr(2, 5), 
                                        name: rName, 
                                        remark: rType, 
                                        persona: rDesc, 
                                        group: 'other' 
                                    });
                                    contactsChanged = true;
                                }
                            }
                        }
                    });

                    if(contactsChanged) {
                        localStorage.setItem('fruit-machine-contacts', JSON.stringify(contacts));
                    }

                    const data = {
                        id: id || Date.now().toString(),
                        name: name,
                        userName: document.querySelector('#page-user-settings #user-name').value,
                        gender: document.querySelector('#page-user-settings #user-gender').value,
                        age: document.querySelector('#page-user-settings #user-age').value,
                        birthday: document.querySelector('#page-user-settings #user-birthday').value,
                        description: document.querySelector('#page-user-settings #user-description').value,
                        world: document.querySelector('#page-user-settings #user-world').value,
                        avatar: currentAvatarBase64,
                        relationships: rels
                    };

                    if(id) {
                        const idx = presets.findIndex(x => String(x.id) === String(id));
                        if(idx !== -1) {
                            presets[idx] = data;
                        } else {
                            presets.push(data);
                        }
                    } else {
                        presets.push(data);
                    }

                    save();
                    render();
                    modal.style.display = 'none';
                    alert("保存成功！");
                } catch(err) {
                    alert("保存失败，发生错误: " + err.message);
                }
            });
        }

        const btnAddPreset = document.querySelector('#page-user-settings #btn-add-preset');
        if(btnAddPreset) btnAddPreset.addEventListener('click', () => openModal());
        
        const btnCancel = document.querySelector('#page-user-settings #btn-cancel');
        if(btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');
        
        const closeBtn = document.querySelector('#page-user-settings #close-modal-btn');
        if(closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    });

    window.initPageUserSettings = function() {
        try {
            presets = JSON.parse(localStorage.getItem('fruit-machine-user-presets')) || [];
        } catch(e) { console.error(e); }

        if (presets.length === 0) {
            presets.push({ id: Date.now().toString(), name: "默认预设", userName: "小莓", gender: "女", age: "18", birthday: "2000-01-01", description: "默认", world: "现代", relationships: [] });
            localStorage.setItem('fruit-machine-user-presets', JSON.stringify(presets));
        }
        render();
    };

    function render() {
        if(!listContainer) return;
        listContainer.innerHTML = '';
        presets.forEach(p => {
            const el = document.createElement('div');
            el.className = 'preset-item';
            el.innerHTML = `
                <div class="preset-info" style="flex:1;">
                    <h3>${p.name}</h3>
                    <p>${p.gender} / ${p.age}岁 / ${p.userName}</p>
                </div>
                <div class="preset-actions">
                    <button class="edit-btn" data-id="${p.id}">✎</button>
                    <button class="del-btn" data-id="${p.id}" style="color:#ff3b30;">✖</button>
                </div>
            `;
            el.querySelector('.preset-info').addEventListener('click', () => openModal(p.id));
            el.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); openModal(p.id); });
            el.querySelector('.del-btn').addEventListener('click', (e) => { e.stopPropagation(); deletePreset(p.id); });
            listContainer.appendChild(el);
        });
    }

    function deletePreset(id) {
        if(presets.length <= 1) return alert("至少保留一个预设");
        if(confirm("确定删除?")) {
            presets = presets.filter(p => p.id !== id);
            save();
            render();
        }
    }

    function openModal(id = null) {
        if(!modal) return;
        modal.style.display = 'flex';
        if(relList) relList.innerHTML = '';
        
        if(id) {
            const p = presets.find(x => String(x.id) === String(id));
            if(!p) return;
            document.querySelector('#page-user-settings #edit-preset-id').value = p.id;
            document.querySelector('#page-user-settings #preset-name').value = p.name;
            document.querySelector('#page-user-settings #user-name').value = p.userName;
            document.querySelector('#page-user-settings #user-gender').value = p.gender;
            document.querySelector('#page-user-settings #user-age').value = p.age;
            document.querySelector('#page-user-settings #user-birthday').value = p.birthday;
            document.querySelector('#page-user-settings #user-description').value = p.description;
            document.querySelector('#page-user-settings #user-world').value = p.world || '';
            
            currentAvatarBase64 = p.avatar || null;
            updateAvatarView();
            
            if(p.relationships) p.relationships.forEach(r => addRelItem(r));
        } else {
            if(form) form.reset();
            document.querySelector('#page-user-settings #edit-preset-id').value = '';
            currentAvatarBase64 = null;
            updateAvatarView();
            addRelItem();
        }
    }

    function updateAvatarView() {
        if(!avatarPreview || !avatarPlaceholder) return;
        if(currentAvatarBase64) {
            avatarPreview.src = currentAvatarBase64;
            avatarPreview.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            avatarPreview.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
        }
    }

    function addRelItem(data = null) {
        if(!relList) return;
        const div = document.createElement('div');
        div.className = 'relation-item';
        div.innerHTML = `
            <div style="flex:1; margin-right:5px;">
                <input type="text" placeholder="姓名" class="rel-name" value="${data ? data.name : ''}" style="width:100%; margin-bottom:5px;">
                <input type="text" placeholder="关系" class="rel-type" value="${data ? data.relationship : ''}" style="width:100%;">
                <label style="font-size:10px; color:#666; display:flex; align-items:center; margin-top:2px;">
                    <input type="checkbox" class="sync-contact" style="width:auto; margin-right:4px;"> 加入通讯录
                </label>
            </div>
            <div style="flex:1.5; margin-right:5px;">
                <textarea placeholder="描述..." class="rel-desc" style="width:100%; height:60px; font-size:12px;">${data ? data.description : ''}</textarea>
            </div>
            <button type="button" class="del-btn" style="border:none; background:none; color:#999;">✖</button>
        `;
        div.querySelector('.del-btn').addEventListener('click', () => div.remove());
        relList.appendChild(div);
    }

    function save() {
        localStorage.setItem('fruit-machine-user-presets', JSON.stringify(presets));
    }
})();

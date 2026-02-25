document.addEventListener('DOMContentLoaded', () => {
    // 状态管理
    let presets = JSON.parse(localStorage.getItem('fruit-machine-user-presets')) || [];
    let currentPresetId = localStorage.getItem('fruit-machine-current-preset-id');
    
    // 如果没有预设，创建一个默认的
    if (presets.length === 0) {
        const defaultPreset = {
            id: Date.now().toString(),
            name: "默认预设",
            userName: "小莓",
            gender: "女",
            age: "18",
            birthday: "2000-01-01",
            description: "这是一个开朗活泼的默认人设。",
            world: "现代都市",
            relationships: []
        };
        presets.push(defaultPreset);
        currentPresetId = defaultPreset.id;
        savePresets();
    }

    // DOM 元素
    const presetListContainer = document.getElementById('preset-list-container');
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const presetForm = document.getElementById('preset-form');
    const relationshipList = document.getElementById('relationship-list');
    
    // 头像相关元素
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('preset-avatar-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    let currentAvatarBase64 = null;

    // 输入框
    const inputs = {
        id: document.getElementById('edit-preset-id'),
        presetName: document.getElementById('preset-name'),
        userName: document.getElementById('user-name'),
        gender: document.getElementById('user-gender'),
        age: document.getElementById('user-age'),
        birthday: document.getElementById('user-birthday'),
        description: document.getElementById('user-description'),
        world: document.getElementById('user-world'),
        aiPrompt: document.getElementById('ai-gen-prompt'),
        aiCount: document.getElementById('ai-gen-count')
    };

    // 渲染列表
    function renderList() {
        presetListContainer.innerHTML = '';
        presets.forEach(preset => {
            const el = document.createElement('div');
            // 移除 active 样式，不再强调当前选中
            el.className = `preset-item`; 
            el.innerHTML = `
                <div class="preset-info" onclick="openEditModal('${preset.id}')">
                    <h3>${preset.name || '未命名预设'}</h3>
                    <p>${preset.gender} / ${preset.age}岁 / ${preset.userName}</p>
                </div>
                <div class="preset-actions">
                    <button onclick="openEditModal('${preset.id}')">✎</button>
                    <button onclick="deletePreset('${preset.id}')" style="color:#ff3b30;">✖</button>
                </div>
            `;
            presetListContainer.appendChild(el);
        });
    }

    // 保存数据
    function savePresets() {
        localStorage.setItem('fruit-machine-user-presets', JSON.stringify(presets));
        if (currentPresetId) {
            localStorage.setItem('fruit-machine-current-preset-id', currentPresetId);
            // 更新全局当前用户缓存，方便其他页面读取
            const current = presets.find(p => p.id === currentPresetId);
            if(current) {
                localStorage.setItem('fruit-machine-current-user', JSON.stringify(current));
            }
        }
    }

    // 选择预设
    window.selectPreset = (id) => {
        currentPresetId = id;
        savePresets();
        renderList();
    };

    // 删除预设
    window.deletePreset = (id) => {
        if (presets.length <= 1) {
            alert("至少保留一个预设！");
            return;
        }
        if (confirm("确定要删除这个预设吗？")) {
            presets = presets.filter(p => p.id !== id);
            if (currentPresetId === id) {
                currentPresetId = presets[0].id;
            }
            savePresets();
            renderList();
        }
    };

    // 打开编辑模态框
    window.openEditModal = (id = null) => {
        modal.style.display = 'flex';
        relationshipList.innerHTML = ''; // 清空关系列表

        if (id) {
            // 编辑现有
            const preset = presets.find(p => p.id === id);
            if (!preset) return;

            modalTitle.textContent = "编辑预设";
            inputs.id.value = preset.id;
            inputs.presetName.value = preset.name;
            inputs.userName.value = preset.userName;
            inputs.gender.value = preset.gender;
            inputs.age.value = preset.age;
            inputs.birthday.value = preset.birthday;
            inputs.description.value = preset.description;
            inputs.world.value = preset.world || '';
            
            // 加载头像
            if (preset.avatar) {
                currentAvatarBase64 = preset.avatar;
                avatarPreview.src = preset.avatar;
                avatarPreview.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            } else {
                currentAvatarBase64 = null;
                avatarPreview.style.display = 'none';
                avatarPlaceholder.style.display = 'flex';
            }

            // 加载关系
            if (preset.relationships) {
                preset.relationships.forEach(rel => addRelationship(rel));
            }

        } else {
            // 新建
            modalTitle.textContent = "新建预设";
            inputs.id.value = '';
            presetForm.reset();
            inputs.gender.value = '女'; // 默认
            
            // 重置头像
            currentAvatarBase64 = null;
            avatarPreview.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
            avatarInput.value = '';

            addRelationship(); // 默认加一个空行
        }
    };

    // 头像上传逻辑 (使用事件绑定而非内联 onclick)
    const avatarContainer = document.querySelector('.avatar-upload-container');
    if (avatarContainer) {
        avatarContainer.addEventListener('click', () => {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentAvatarBase64 = e.target.result;
                    avatarPreview.src = currentAvatarBase64;
                    avatarPreview.style.display = 'block';
                    avatarPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // 移除可能存在的全局函数，避免冲突或误用
    // window.triggerAvatarUpload = null;
    // window.handleAvatarChange = null;

    document.getElementById('btn-add-preset').addEventListener('click', () => {
        openEditModal(null);
    });

    // 关闭模态框
    window.closeModal = () => {
        modal.style.display = 'none';
    };

    // 添加关系行
    window.addRelationship = (data = null) => {
        const div = document.createElement('div');
        div.className = 'relation-item';
        // 检查是否已同步到通讯录 (简单的判断：这里我们不存同步状态，只提供操作入口)
        // 改进：增加一个复选框 "加入通讯录"
        
        div.innerHTML = `
            <div style="flex:1; margin-right:5px;">
                <input type="text" placeholder="对方姓名" class="rel-name" value="${data ? data.name : ''}" style="width:100%; margin-bottom:5px;">
                <input type="text" placeholder="关系 (如: 哥哥)" class="rel-type" value="${data ? data.relationship : ''}" style="width:100%;">
                <label style="font-size:10px; color:#666; display:flex; align-items:center; margin-top:2px;">
                    <input type="checkbox" class="sync-contact" style="width:auto; margin-right:4px;"> 加入通讯录
                </label>
            </div>
            <div style="flex:1.5; margin-right:5px;">
                 <textarea placeholder="对方设定简述..." class="rel-desc" style="width:100%; height:60px; font-size:12px;">${data ? data.description : ''}</textarea>
            </div>
            <button type="button" onclick="this.parentElement.remove()" style="border:none; background:none; color:#999;">✖</button>
        `;
        relationshipList.appendChild(div);
    };

    // 表单提交
    presetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 收集关系数据 & 同步通讯录
        const rels = [];
        let contacts = JSON.parse(localStorage.getItem('fruit-machine-contacts')) || [];
        let contactsChanged = false;

        document.querySelectorAll('.relation-item').forEach(item => {
            const name = item.querySelector('.rel-name').value.trim();
            const relType = item.querySelector('.rel-type').value.trim();
            const desc = item.querySelector('.rel-desc').value.trim();
            const sync = item.querySelector('.sync-contact').checked;

            if (name && relType) {
                rels.push({ name, relationship: relType, description: desc });

                // 同步到通讯录逻辑
                if (sync) {
                    const existingIndex = contacts.findIndex(c => c.name === name && c.group === 'other');
                    const newContact = {
                        id: existingIndex !== -1 ? contacts[existingIndex].id : Date.now().toString() + Math.random().toString().slice(2, 5),
                        name: name,
                        remark: relType, // 关系作为备注
                        persona: desc,
                        avatar: null, // 人际关系暂无头像
                        group: 'other' // 标记为其他分组
                    };

                    if (existingIndex !== -1) {
                        contacts[existingIndex] = newContact;
                    } else {
                        contacts.push(newContact);
                    }
                    contactsChanged = true;
                }
            }
        });

        if (contactsChanged) {
            localStorage.setItem('fruit-machine-contacts', JSON.stringify(contacts));
            alert("已将选中人际关系添加到通讯录！");
        }

        const formData = {
            id: inputs.id.value || Date.now().toString(),
            name: inputs.presetName.value,
            userName: inputs.userName.value,
            gender: inputs.gender.value,
            age: inputs.age.value,
            birthday: inputs.birthday.value,
            description: inputs.description.value,
            world: inputs.world.value,
            relationships: rels,
            avatar: currentAvatarBase64 // 保存头像数据
        };

        if (inputs.id.value) {
            // 更新
            const index = presets.findIndex(p => p.id === inputs.id.value);
            if (index !== -1) {
                presets[index] = formData;
            }
        } else {
            // 新增
            presets.push(formData);
            // 如果是第一个，自动选中
            if (presets.length === 1) {
                currentPresetId = formData.id;
            }
        }

        savePresets();
        renderList();
        closeModal();
    });

    // =========== AI 生成逻辑 ===========
    document.getElementById('btn-ai-gen').addEventListener('click', async () => {
        const promptText = inputs.aiPrompt.value.trim();
        const count = parseInt(inputs.aiCount.value);
        const loadingDiv = document.getElementById('ai-loading');
        
        if (!promptText) {
            alert("请先填写AI生成的要求描述！");
            return;
        }

        // 获取API配置 (优先尝试从统一配置对象读取，兼容旧版单独key)
        let apiAddress = localStorage.getItem('api-address');
        let apiKey = localStorage.getItem('api-key');
        let apiModel = localStorage.getItem('api-model');
        
        // 尝试从 fruit-machine-api-config 读取
        const apiConfigStr = localStorage.getItem('fruit-machine-api-config');
        if (apiConfigStr) {
            try {
                const apiConfig = JSON.parse(apiConfigStr);
                if (apiConfig.address) apiAddress = apiConfig.address;
                if (apiConfig.key) apiKey = apiConfig.key;
                if (apiConfig.model) apiModel = apiConfig.model;
            } catch (e) {
                console.error("API配置解析失败", e);
            }
        }

        if (!apiAddress || !apiKey || !apiModel) {
            alert("请先在主页设置中配置完整的API连接信息！");
            return;
        }
        
        // 确保地址格式正确 (兼容 /v1/chat/completions 后缀)
        if (!apiAddress.endsWith('/v1') && !apiAddress.endsWith('/')) {
             // 如果用户只填了域名，没填 /v1，且后面也没接东西，可能需要补 /v1
             // 但这里我们只做最基础的检查，还是信任用户填写的地址
        }
        // 注意：fetch调用时会拼 /chat/completions，所以这里 apiAddress 应该是 base URL
        // 如果用户填了 https://api.openai.com/v1/chat/completions，那就会出错
        // 为了稳健性，做一个简单的处理：去除末尾的 /chat/completions
        apiAddress = apiAddress.replace(/\/chat\/completions\/?$/, '');
        apiAddress = apiAddress.replace(/\/+$/, ''); // 去除末尾斜杠

        loadingDiv.style.display = 'block';
        loadingDiv.textContent = `正在生成 ${count} 个人物关系，请稍候...`;

        try {
            // 构建 Prompt
            const systemPrompt = "你是一个专业的小说人物设定助手。用户会给出一些关于人际关系的要求，你需要根据这些要求，生成指定数量的人物设定。生成的每个人物必须包含：姓名、性别、年龄、生日、外貌性格、背景经历、与用户的关系。请严格按照JSON数组格式返回，不要包含任何Markdown格式代码块标记。JSON格式如下：[{ \"name\": \"姓名\", \"relationship\": \"关系\", \"description\": \"完整人设描述...\" }]";
            
            const userMessage = `请生成 ${count} 个人物，要求如下：${promptText}。当前用户设定参考：${inputs.userName.value}，${inputs.gender.value}，${inputs.age.value}岁。`;

            // 智能构建 URL
            let fetchUrl = apiAddress;
            if (fetchUrl.endsWith('/v1')) {
                fetchUrl += '/chat/completions';
            } else {
                fetchUrl += '/v1/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: apiModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 1.0
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            const aiContent = data.choices[0].message.content;
            
            console.log("AI Response:", aiContent);

            // 尝试解析 JSON
            let generatedRels = [];
            try {
                // 清理可能的 markdown 标记
                const jsonStr = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
                generatedRels = JSON.parse(jsonStr);
            } catch (e) {
                console.error("JSON解析失败", e);
                alert("AI返回的格式无法解析，请重试或检查模型能力。");
                loadingDiv.style.display = 'none';
                return;
            }

            // 添加到列表
            if (Array.isArray(generatedRels)) {
                generatedRels.forEach(rel => {
                    addRelationship({
                        name: rel.name,
                        relationship: rel.relationship,
                        description: rel.description
                        // 注意：这里我们把 AI 生成的一大段详细描述都放在 description 里
                        // 如果 AI 返回了更多字段，可以在这里拼接到 description 中
                    });
                });
                alert(`成功生成 ${generatedRels.length} 个人物关系！已添加到列表，请检查并保存。`);
            } else {
                alert("AI返回格式异常，不是数组。");
            }

        } catch (error) {
            console.error("AI生成出错:", error);
            alert("AI生成出错: " + error.message);
        } finally {
            loadingDiv.style.display = 'none';
        }
    });

    // 初始化
    renderList();
});

document.addEventListener('DOMContentLoaded', () => {

    // =========== 元素获取 ===========
    const body = document.body;
    const saveApiBtn = document.getElementById('save-api-settings');
    const apiAddressInput = document.getElementById('api-address');
    const apiKeyInput = document.getElementById('api-key');
    const apiModelSelect = document.getElementById('api-model');
    const getModelsBtn = document.getElementById('get-models-btn');
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    
    // 新增元素
    const apiTemperatureInput = document.getElementById('api-temperature');
    const temperatureValueSpan = document.getElementById('temperature-value');
    const presetNameInput = document.getElementById('preset-name');
    const savePresetBtn = document.getElementById('save-preset-btn');
    const apiPresetsSelect = document.getElementById('api-presets');
    const loadPresetBtn = document.getElementById('load-preset-btn');
    const deletePresetBtn = document.getElementById('delete-preset-btn');

    // Navigation
    const backBtn = document.querySelector('#page-settings .back-button');
    if(backBtn) backBtn.onclick = () => window.navigateTo('home');

    // =========== 功能函数 ===========

    /**
     * 从本地存储加载并应用主题
     */
    function loadAndApplyTheme() {
        const savedTheme = localStorage.getItem('fruit-machine-theme') || 'strawberry';
        body.dataset.theme = savedTheme;
    }

    /**
     * 加载已保存的 API 设置
     */
    function loadApiSettings() {
        const apiConfig = JSON.parse(localStorage.getItem('fruit-machine-api-config')) || {};
        
        if (apiConfig.address) apiAddressInput.value = apiConfig.address;
        if (apiConfig.key) apiKeyInput.value = apiConfig.key;
        if (apiConfig.temperature) {
            apiTemperatureInput.value = apiConfig.temperature;
            temperatureValueSpan.textContent = apiConfig.temperature;
        }

        // 强制恢复保存的模型选项，不自动请求 API
        // 这样可以避免每次进入页面都要等待联网，且保证离线时模型名不丢失
        if (apiConfig.model) {
             const option = document.createElement('option');
             option.value = apiConfig.model;
             option.textContent = apiConfig.model;
             // 检查是否已存在
             let exists = false;
             for(let i=0; i<apiModelSelect.options.length; i++) {
                 if(apiModelSelect.options[i].value === apiConfig.model) exists = true;
             }
             if(!exists) {
                 apiModelSelect.appendChild(option);
             }
             apiModelSelect.value = apiConfig.model;
        }
    }

    /**
     * 更新预设列表
     */
    function updatePresetsList() {
        const presets = JSON.parse(localStorage.getItem('fruit-machine-api-presets')) || {};
        apiPresetsSelect.innerHTML = '<option value="">-- 选择预设 --</option>';
        for (const name in presets) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            apiPresetsSelect.appendChild(option);
        }
    }

    /**
     * 获取模型列表
     * @param {boolean} silent 是否静默模式（不弹窗）
     * @param {string} targetModel 目标模型ID（获取后自动选中）
     */
    async function fetchModels(silent = false, targetModel = null) {
        const address = apiAddressInput.value.trim();
        const key = apiKeyInput.value.trim();

        if (!address) {
            if (!silent) alert('请输入 API 地址');
            return;
        }

        getModelsBtn.textContent = '获取中...';
        getModelsBtn.disabled = true;

        try {
            // 构建请求URL，假设是兼容 OpenAI 格式的 /v1/models
            let url = address;
            if (!url.endsWith('/v1/models') && !url.endsWith('/models')) {
                // 简单的智能补全，如果用户只输入了域名
                url = url.replace(/\/+$/, ''); // 去除末尾斜杠
                if (!url.endsWith('/v1')) {
                    url += '/v1';
                }
                url += '/models';
            }

            const headers = {
                'Content-Type': 'application/json'
            };
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            const response = await fetch(url, { method: 'GET', headers });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const models = data.data || []; // OpenAI 格式通常在 data 字段

            // 清空并重新填充
            apiModelSelect.innerHTML = '<option value="">请选择模型</option>';
            let targetExists = false;
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.id;
                apiModelSelect.appendChild(option);
                if (targetModel && model.id === targetModel) {
                    targetExists = true;
                }
            });

            // 如果有目标模型但列表中没有（可能是自定义模型或列表不全），手动添加
            if (targetModel && !targetExists) {
                const option = document.createElement('option');
                option.value = targetModel;
                option.textContent = targetModel + " (已保存)";
                apiModelSelect.appendChild(option);
            }

            if (targetModel) {
                apiModelSelect.value = targetModel;
            }

            if (!silent) alert(`成功获取 ${models.length} 个模型！`);

        } catch (error) {
            console.error('获取模型失败:', error);
            if (!silent) alert('获取模型失败，请检查地址和密钥是否正确，或查看控制台错误信息。');
            
            // 即使获取失败，如果之前有保存的模型，也恢复显示
            if (targetModel && apiModelSelect.options.length <= 1) {
                const option = document.createElement('option');
                option.value = targetModel;
                option.textContent = targetModel;
                apiModelSelect.appendChild(option);
                apiModelSelect.value = targetModel;
            }

        } finally {
            getModelsBtn.textContent = '获取模型列表';
            getModelsBtn.disabled = false;
        }
    }

    // =========== 事件监听 ===========

    // 温度滑块变化
    apiTemperatureInput.addEventListener('input', () => {
        temperatureValueSpan.textContent = apiTemperatureInput.value;
    });

    // 获取模型按钮
    getModelsBtn.addEventListener('click', () => fetchModels(false));

    // 保存 API 设置
    saveApiBtn.addEventListener('click', () => {
        const address = apiAddressInput.value.trim();
        const key = apiKeyInput.value.trim();
        const model = apiModelSelect.value;
        const temp = apiTemperatureInput.value;

        const apiConfig = {
            address: address,
            key: key,
            model: model,
            temperature: temp
        };
        localStorage.setItem('fruit-machine-api-config', JSON.stringify(apiConfig));
        
        // 兼容性保存 (供 user-settings.js 等使用)
        localStorage.setItem('api-address', address);
        localStorage.setItem('api-key', key);
        localStorage.setItem('api-model', model);
        localStorage.setItem('api-temperature', temp);

        alert('API 设置已保存！');
    });

    // 保存预设
    savePresetBtn.addEventListener('click', () => {
        const name = presetNameInput.value.trim();
        if (!name) {
            alert('请输入预设名称');
            return;
        }

        const currentConfig = {
            address: apiAddressInput.value.trim(),
            key: apiKeyInput.value.trim(),
            model: apiModelSelect.value,
            temperature: apiTemperatureInput.value
        };

        const presets = JSON.parse(localStorage.getItem('fruit-machine-api-presets')) || {};
        presets[name] = currentConfig;
        localStorage.setItem('fruit-machine-api-presets', JSON.stringify(presets));
        
        updatePresetsList();
        alert(`预设 "${name}" 已保存！`);
        presetNameInput.value = '';
    });

    // 加载预设
    loadPresetBtn.addEventListener('click', () => {
        const name = apiPresetsSelect.value;
        if (!name) return;

        const presets = JSON.parse(localStorage.getItem('fruit-machine-api-presets')) || {};
        const config = presets[name];

        if (config) {
            apiAddressInput.value = config.address || '';
            apiKeyInput.value = config.key || '';
            apiTemperatureInput.value = config.temperature || 1.0;
            temperatureValueSpan.textContent = config.temperature || 1.0;
            
            // 恢复模型选择
            if (config.model) {
                // 检查下拉列表中是否已有该模型，没有则添加
                let optionExists = false;
                for (let i = 0; i < apiModelSelect.options.length; i++) {
                    if (apiModelSelect.options[i].value === config.model) {
                        optionExists = true;
                        break;
                    }
                }
                
                if (!optionExists) {
                    const option = document.createElement('option');
                    option.value = config.model;
                    option.textContent = config.model; // 临时显示，虽然可能不在当前获取的列表中
                    apiModelSelect.appendChild(option);
                }
                apiModelSelect.value = config.model;
            }
            
            // 自动保存加载的配置到当前配置，以便下次打开即用
            localStorage.setItem('fruit-machine-api-config', JSON.stringify(config));
            
            alert(`预设 "${name}" 已加载！`);
        }
    });

    // 删除预设
    deletePresetBtn.addEventListener('click', () => {
        const name = apiPresetsSelect.value;
        if (!name) return;

        if (confirm(`确定要删除预设 "${name}" 吗？`)) {
            const presets = JSON.parse(localStorage.getItem('fruit-machine-api-presets')) || {};
            delete presets[name];
            localStorage.setItem('fruit-machine-api-presets', JSON.stringify(presets));
            updatePresetsList();
        }
    });


    // 导出数据
    exportBtn.addEventListener('click', () => {
        // 收集所有需要备份的数据
        const dataToExport = {
            version: "2.0", // 增加版本号以便将来处理迁移
            timestamp: new Date().toISOString(),
            // 基础/系统设置
            theme: localStorage.getItem('fruit-machine-theme'),
            apiConfig: JSON.parse(localStorage.getItem('fruit-machine-api-config') || '{}'),
            apiPresets: JSON.parse(localStorage.getItem('fruit-machine-api-presets') || '{}'),
            userPresets: JSON.parse(localStorage.getItem('fruit-machine-user-presets') || '[]'),
            currentPresetId: localStorage.getItem('fruit-machine-current-preset-id'),
            layout: JSON.parse(localStorage.getItem('fruit-machine-layout') || '{}'),

            // 美化/外观
            background: localStorage.getItem('fruit-machine-background'),
            customCss: localStorage.getItem('fruit-machine-custom-css'),
            customFont: localStorage.getItem('fruit-machine-custom-font'),
            icons: JSON.parse(localStorage.getItem('fruit-machine-icons') || '{}'),
            iconSizes: JSON.parse(localStorage.getItem('fruit-machine-icon-sizes') || '{}'),
            photos: JSON.parse(localStorage.getItem('fruit-machine-photos') || '{}'),
            beautifyPresets: JSON.parse(localStorage.getItem('fruit-machine-beautify-presets') || '{}'),

            // 内容/数据
            regexRules: JSON.parse(localStorage.getItem('fruit_machine_regex_rules') || '[]'),
            wbCategories: JSON.parse(localStorage.getItem('fruit-machine-wb-categories') || '[]'),
            wbEntries: JSON.parse(localStorage.getItem('fruit-machine-wb-entries') || '[]'),
            contacts: JSON.parse(localStorage.getItem('fruit-machine-contacts') || '[]'),
            apps: JSON.parse(localStorage.getItem('fruit-machine-apps') || '{}'),
            notepad: localStorage.getItem('fruit-machine-notepad'),

            // 兼容性/旧版数据 (可选，为了完整性)
            legacy: {
                apiAddress: localStorage.getItem('api-address'),
                apiKey: localStorage.getItem('api-key'),
                apiModel: localStorage.getItem('api-model'),
                apiTemperature: localStorage.getItem('api-temperature')
            }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fruit-machine-full-backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('完整存档已导出！包含所有设置、世界书、正则、联系人及美化数据。');
    });

    // 导入数据 (通过文件选择)
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none'; // 兼容性：添加到 DOM
        document.body.appendChild(input);

        input.onchange = e => {
            if (!e.target.files || e.target.files.length === 0) {
                if(document.body.contains(input)) document.body.removeChild(input);
                return;
            }

            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = readerEvent => {
                try {
                    let content = readerEvent.target.result;
                    
                    // 自动去除 BOM (Byte Order Mark) 以防止 JSON.parse 失败
                    if (content.charCodeAt(0) === 0xFEFF) {
                        content = content.slice(1);
                    }

                    const importedData = JSON.parse(content);
                    
                    if (!confirm('导入存档将覆盖当前所有数据（包括设置、聊天、世界书等），确定要继续吗？')) {
                        return;
                    }

                    // 辅助函数：安全地设置 localStorage
                    const safeSet = (key, value, isObject = false) => {
                        if (value !== undefined && value !== null) {
                            localStorage.setItem(key, isObject ? JSON.stringify(value) : value);
                        } else {
                            // 如果导入的数据中没有该字段，清除本地残留，恢复默认状态
                            localStorage.removeItem(key);
                        }
                    };

                    // 恢复数据
                    // 1. 基础/系统设置
                    safeSet('fruit-machine-theme', importedData.theme);
                    safeSet('fruit-machine-api-config', importedData.apiConfig, true);
                    safeSet('fruit-machine-api-presets', importedData.apiPresets, true);
                    safeSet('fruit-machine-user-presets', importedData.userPresets, true);
                    safeSet('fruit-machine-current-preset-id', importedData.currentPresetId);
                    
                    // 特殊处理布局：如果导入的数据没有布局，说明是默认布局，务必清除本地残留
                    if (importedData.layout) {
                        localStorage.setItem('fruit-machine-layout', JSON.stringify(importedData.layout));
                    } else {
                        localStorage.removeItem('fruit-machine-layout');
                    }

                    // 2. 美化/外观
                    safeSet('fruit-machine-background', importedData.background);
                    safeSet('fruit-machine-custom-css', importedData.customCss);
                    safeSet('fruit-machine-custom-font', importedData.customFont);
                    safeSet('fruit-machine-icons', importedData.icons, true);
                    safeSet('fruit-machine-icon-sizes', importedData.iconSizes, true);
                    safeSet('fruit-machine-photos', importedData.photos, true);
                    safeSet('fruit-machine-beautify-presets', importedData.beautifyPresets, true);

                    // 3. 内容/数据
                    safeSet('fruit_machine_regex_rules', importedData.regexRules, true);
                    safeSet('fruit-machine-wb-categories', importedData.wbCategories, true);
                    safeSet('fruit-machine-wb-entries', importedData.wbEntries, true);
                    safeSet('fruit-machine-contacts', importedData.contacts, true);
                    safeSet('fruit-machine-apps', importedData.apps, true);
                    safeSet('fruit-machine-notepad', importedData.notepad);

                    // 4. 兼容性处理
                    // 如果导入了 apiConfig，同步更新旧版 key 以保持兼容性
                    if (importedData.apiConfig) {
                        if(importedData.apiConfig.address) localStorage.setItem('api-address', importedData.apiConfig.address);
                        if(importedData.apiConfig.key) localStorage.setItem('api-key', importedData.apiConfig.key);
                        if(importedData.apiConfig.model) localStorage.setItem('api-model', importedData.apiConfig.model);
                        if(importedData.apiConfig.temperature) localStorage.setItem('api-temperature', importedData.apiConfig.temperature);
                    } else if (importedData.legacy) {
                        // 如果没有新版 config 但有旧版数据，尝试恢复旧版数据
                        if(importedData.legacy.apiAddress) localStorage.setItem('api-address', importedData.legacy.apiAddress);
                        if(importedData.legacy.apiKey) localStorage.setItem('api-key', importedData.legacy.apiKey);
                        if(importedData.legacy.apiModel) localStorage.setItem('api-model', importedData.legacy.apiModel);
                        if(importedData.legacy.apiTemperature) localStorage.setItem('api-temperature', importedData.legacy.apiTemperature);
                    }

                    alert('完整存档导入成功！页面即将刷新以应用所有更改。');
                    setTimeout(() => {
                        window.reloadApp(); // 强制刷新以应用所有更改
                    }, 1000);

                } catch (error) {
                    alert('导入失败！错误信息：' + error.message);
                    console.error('Import error:', error);
                } finally {
                    if(document.body.contains(input)) document.body.removeChild(input);
                }
            }
            reader.readAsText(file, 'UTF-8');
        }
        input.click();
    });


    // =========== 初始化 ===========
    loadAndApplyTheme();
    loadApiSettings();
    updatePresetsList();

    console.log("设置页面脚本加载完毕！");
});

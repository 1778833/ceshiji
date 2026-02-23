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
        // 实际应用中会收集所有需要备份的数据
        const dataToExport = {
            theme: localStorage.getItem('fruit-machine-theme'),
            apiConfig: JSON.parse(localStorage.getItem('fruit-machine-api-config')),
            apiPresets: JSON.parse(localStorage.getItem('fruit-machine-api-presets')), // 包含预设
            // ... 其他应用数据
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fruit-machine-backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('存档已导出！');
    });

    // 导入数据 (通过文件选择)
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    const importedData = JSON.parse(content);
                    
                    // 恢复数据
                    if(importedData.theme) {
                         localStorage.setItem('fruit-machine-theme', importedData.theme);
                    }
                    if(importedData.apiConfig) {
                         localStorage.setItem('fruit-machine-api-config', JSON.stringify(importedData.apiConfig));
                    }
                    if(importedData.apiPresets) {
                        localStorage.setItem('fruit-machine-api-presets', JSON.stringify(importedData.apiPresets));
                    }
                    
                    alert('存档导入成功！请刷新页面以应用更改。');
                    loadAndApplyTheme();
                    loadApiSettings();
                    updatePresetsList();

                } catch (error) {
                    alert('导入失败，请检查文件格式是否正确。');
                    console.error(error);
                }
            }
        }
        input.click();
    });


    // =========== 初始化 ===========
    loadAndApplyTheme();
    loadApiSettings();
    updatePresetsList();

    console.log("设置页面脚本加载完毕！");
});

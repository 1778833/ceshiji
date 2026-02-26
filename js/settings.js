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


    // 导出数据 (ZIP 打包)
    exportBtn.addEventListener('click', async () => {
        // 收集所有需要备份的数据
        const dataToExport = {
            version: "3.0", // 升级版本号
            timestamp: new Date().toISOString(),
            theme: localStorage.getItem('fruit-machine-theme'),
            apiConfig: JSON.parse(localStorage.getItem('fruit-machine-api-config') || '{}'),
            apiPresets: JSON.parse(localStorage.getItem('fruit-machine-api-presets') || '{}'),
            userPresets: JSON.parse(localStorage.getItem('fruit-machine-user-presets') || '[]'),
            currentPresetId: localStorage.getItem('fruit-machine-current-preset-id'),
            layout: JSON.parse(localStorage.getItem('fruit-machine-layout') || '{}'),
            background: localStorage.getItem('fruit-machine-background'),
            customCss: localStorage.getItem('fruit-machine-custom-css'),
            customFont: localStorage.getItem('fruit-machine-custom-font'),
            icons: JSON.parse(localStorage.getItem('fruit-machine-icons') || '{}'),
            iconSizes: JSON.parse(localStorage.getItem('fruit-machine-icon-sizes') || '{}'),
            photos: JSON.parse(localStorage.getItem('fruit-machine-photos') || '{}'),
            beautifyPresets: JSON.parse(localStorage.getItem('fruit-machine-beautify-presets') || '{}'),
            regexRules: JSON.parse(localStorage.getItem('fruit_machine_regex_rules') || '[]'),
            wbCategories: JSON.parse(localStorage.getItem('fruit-machine-wb-categories') || '[]'),
            wbEntries: JSON.parse(localStorage.getItem('fruit-machine-wb-entries') || '[]'),
            contacts: JSON.parse(localStorage.getItem('fruit-machine-contacts') || '[]'),
            apps: JSON.parse(localStorage.getItem('fruit-machine-apps') || '{}'),
            notepad: localStorage.getItem('fruit-machine-notepad'),
            legacy: {
                apiAddress: localStorage.getItem('api-address'),
                apiKey: localStorage.getItem('api-key'),
                apiModel: localStorage.getItem('api-model'),
                apiTemperature: localStorage.getItem('api-temperature')
            }
        };

        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);color:#fff;display:flex;justify-content:center;align-items:center;z-index:9999;';
        loadingDiv.innerHTML = '<div>正在打包存档，请稍候...</div>';
        document.body.appendChild(loadingDiv);

        try {
            // 如果 JSZip 未加载，降级为 JSON 导出
            if (typeof JSZip === 'undefined') {
                alert("JSZip 库未加载，将导出普通 JSON 存档（可能较大）。");
                throw new Error("JSZip not found");
            }

            const zip = new JSZip();
            const assetsFolder = zip.folder("assets");
            let imgCount = 0;

            // 辅助：Base64 转 Blob
            const base64ToBlob = (base64) => {
                const arr = base64.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return { blob: new Blob([u8arr], {type:mime}), ext: mime.split('/')[1] || 'png' };
            };

            // 递归提取图片
            const processData = (obj) => {
                if (!obj) return obj;
                if (typeof obj === 'string') {
                    if (obj.startsWith('data:image')) {
                        try {
                            const { blob, ext } = base64ToBlob(obj);
                            const filename = `img_${Date.now()}_${imgCount++}.${ext}`;
                            assetsFolder.file(filename, blob);
                            return `assets/${filename}`;
                        } catch(e) {
                            console.error("Image process error", e);
                            return obj; // 失败则保留原 Base64
                        }
                    }
                    return obj;
                }
                if (Array.isArray(obj)) {
                    return obj.map(item => processData(item));
                }
                if (typeof obj === 'object') {
                    const newObj = {};
                    for (const key in obj) {
                        newObj[key] = processData(obj[key]);
                    }
                    return newObj;
                }
                return obj;
            };

            const cleanData = processData(dataToExport);
            zip.file("data.json", JSON.stringify(cleanData, null, 2));

            const content = await zip.generateAsync({type:"blob"});
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = "fruit-machine-backup.fmbak";
            a.click();
            URL.revokeObjectURL(url);
            
            alert('完整存档已导出！包含纯文本数据和图片资源，更省空间。');

        } catch (err) {
            console.error(err);
            if (err.message !== "JSZip not found") alert("ZIP 打包失败，尝试导出 JSON...");
            
            // Fallback: JSON Export
            const jsonStr = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "fruit-machine-full-backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            if(document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv);
        }
    });

    // 导入数据 (支持 ZIP/FMBAK 和 JSON)
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json,.zip,.fmbak';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = async e => {
            if (!e.target.files || e.target.files.length === 0) {
                if(document.body.contains(input)) document.body.removeChild(input);
                return;
            }

            const file = e.target.files[0];
            const loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);color:#fff;display:flex;justify-content:center;align-items:center;z-index:9999;';
            loadingDiv.innerHTML = '<div>正在解析存档，请稍候...</div>';
            document.body.appendChild(loadingDiv);

            try {
                let importedData = null;

                // 尝试作为 ZIP/FMBAK 处理
                if ((file.name.endsWith('.zip') || file.name.endsWith('.fmbak')) && typeof JSZip !== 'undefined') {
                    try {
                        const zip = await JSZip.loadAsync(file);
                        const dataFile = zip.file("data.json");
                        if (!dataFile) throw new Error("无效的存档包：缺少 data.json");
                        
                        const jsonStr = await dataFile.async("string");
                        let rawData = JSON.parse(jsonStr);

                        // 递归恢复图片
                        const restoreData = async (obj) => {
                            if (!obj) return obj;
                            if (typeof obj === 'string') {
                                if (obj.startsWith('assets/')) {
                                    const imgFile = zip.file(obj);
                                    if (imgFile) {
                                        const blob = await imgFile.async("blob");
                                        if (window.compressImage) {
                                            const f = new File([blob], "restore.img", {type: blob.type});
                                            return await window.compressImage(f, 1080, 1080, 0.8);
                                        } else {
                                            return new Promise(resolve => {
                                                const r = new FileReader();
                                                r.onload = e => resolve(e.target.result);
                                                r.readAsDataURL(blob);
                                            });
                                        }
                                    }
                                }
                                return obj;
                            }
                            if (Array.isArray(obj)) {
                                return Promise.all(obj.map(item => restoreData(item)));
                            }
                            if (typeof obj === 'object') {
                                const newObj = {};
                                for (const key in obj) {
                                    newObj[key] = await restoreData(obj[key]);
                                }
                                return newObj;
                            }
                            return obj;
                        };

                        importedData = await restoreData(rawData);

                    } catch (zipErr) {
                        console.error("ZIP解析失败，尝试作为JSON处理", zipErr);
                    }
                }

                // 如果没成功解析为 ZIP，尝试作为 JSON 读取
                if (!importedData) {
                    const text = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = e => reject(new Error("文件读取失败"));
                        reader.readAsText(file, 'UTF-8');
                    });
                    let content = text;
                    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
                    importedData = JSON.parse(content);
                    
                    // JSON 模式下的自动瘦身
                    if (window.compressBase64) {
                        loadingDiv.innerHTML = '<div>检测到旧版存档，正在优化图片大小...</div>';
                        if (importedData.background) importedData.background = await window.compressBase64(importedData.background, 1920, 0.8);
                        if (importedData.photos) {
                            for (let k in importedData.photos) importedData.photos[k] = await window.compressBase64(importedData.photos[k], 1080, 0.8);
                        }
                        if (importedData.icons) {
                            for (let k in importedData.icons) importedData.icons[k] = await window.compressBase64(importedData.icons[k], 256, 0.8);
                        }
                        if (importedData.contacts && Array.isArray(importedData.contacts)) {
                            for (let c of importedData.contacts) {
                                if (c.avatar) c.avatar = await window.compressBase64(c.avatar, 256, 0.8);
                            }
                        }
                        if (importedData.userPresets && Array.isArray(importedData.userPresets)) {
                            for (let p of importedData.userPresets) {
                                if (p.avatar) p.avatar = await window.compressBase64(p.avatar, 256, 0.8);
                            }
                        }
                    }
                }

                if (!importedData) throw new Error("无法解析存档文件");

                if (!confirm('导入存档将覆盖当前所有数据（包括设置、聊天、世界书等），确定要继续吗？')) {
                    return;
                }

                let failedItems = [];
                const safeSet = (key, value, isObject = false) => {
                    try {
                        if (value !== undefined && value !== null) {
                            localStorage.setItem(key, isObject ? JSON.stringify(value) : value);
                        } else {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        console.error(`Error saving ${key}:`, e);
                        if (e.name === 'QuotaExceededError' || e.code === 22) {
                            failedItems.push(key);
                        }
                    }
                };

                // 恢复数据
                safeSet('fruit-machine-theme', importedData.theme);
                safeSet('fruit-machine-api-config', importedData.apiConfig, true);
                safeSet('fruit-machine-api-presets', importedData.apiPresets, true);
                safeSet('fruit-machine-user-presets', importedData.userPresets, true);
                safeSet('fruit-machine-current-preset-id', importedData.currentPresetId);
                
                try {
                    if (importedData.layout) {
                        localStorage.setItem('fruit-machine-layout', JSON.stringify(importedData.layout));
                    } else {
                        localStorage.removeItem('fruit-machine-layout');
                    }
                } catch (e) { failedItems.push('fruit-machine-layout'); }

                safeSet('fruit-machine-background', importedData.background);
                safeSet('fruit-machine-custom-css', importedData.customCss);
                safeSet('fruit-machine-custom-font', importedData.customFont);
                safeSet('fruit-machine-icons', importedData.icons, true);
                safeSet('fruit-machine-icon-sizes', importedData.iconSizes, true);
                safeSet('fruit-machine-photos', importedData.photos, true);
                safeSet('fruit-machine-beautify-presets', importedData.beautifyPresets, true);

                safeSet('fruit_machine_regex_rules', importedData.regexRules, true);
                safeSet('fruit-machine-wb-categories', importedData.wbCategories, true);
                safeSet('fruit-machine-wb-entries', importedData.wbEntries, true);
                safeSet('fruit-machine-contacts', importedData.contacts, true);
                safeSet('fruit-machine-apps', importedData.apps, true);
                safeSet('fruit-machine-notepad', importedData.notepad);

                try {
                    if (importedData.apiConfig) {
                        if(importedData.apiConfig.address) localStorage.setItem('api-address', importedData.apiConfig.address);
                        if(importedData.apiConfig.key) localStorage.setItem('api-key', importedData.apiConfig.key);
                        if(importedData.apiConfig.model) localStorage.setItem('api-model', importedData.apiConfig.model);
                        if(importedData.apiConfig.temperature) localStorage.setItem('api-temperature', importedData.apiConfig.temperature);
                    } else if (importedData.legacy) {
                        if(importedData.legacy.apiAddress) localStorage.setItem('api-address', importedData.legacy.apiAddress);
                        if(importedData.legacy.apiKey) localStorage.setItem('api-key', importedData.legacy.apiKey);
                        if(importedData.legacy.apiModel) localStorage.setItem('api-model', importedData.legacy.apiModel);
                        if(importedData.legacy.apiTemperature) localStorage.setItem('api-temperature', importedData.legacy.apiTemperature);
                    }
                } catch (e) { console.error("Legacy compatibility save failed", e); }

                if (failedItems.length > 0) {
                    alert('部分数据导入失败（浏览器存储空间已满）：\n' + failedItems.join('\n') + '\n\n建议：\n1. 减少背景图或照片的使用。\n2. 尝试清空浏览器缓存后重试。');
                } else {
                    alert('完整存档导入成功！页面即将刷新以应用所有更改。');
                }
                
                setTimeout(() => {
                    window.reloadApp();
                }, 1000);

            } catch (error) {
                alert('导入失败！错误信息：' + error.message);
                console.error('Import error:', error);
            } finally {
                if(document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv);
                if(document.body.contains(input)) document.body.removeChild(input);
            }
        };
        input.click();
    });

    // =========== 初始化 ===========
    loadAndApplyTheme();
    loadApiSettings();
    updatePresetsList();

    console.log("设置页面脚本加载完毕！");
});

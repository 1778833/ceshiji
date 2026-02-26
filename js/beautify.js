document.addEventListener('DOMContentLoaded', () => {

    // =========== 元素获取 ===========
    const body = document.body;
    const screen = document.getElementById('screen');
    
    const iconGrid = document.querySelector('.icon-grid');
    const customCssInput = document.getElementById('custom-css');
    const saveCssBtn = document.getElementById('save-css');
    const getCssTemplateBtn = document.getElementById('get-css-template');
    const exportConfigBtn = document.getElementById('export-config');
    const importConfigBtn = document.getElementById('import-config');
    const uploadBgBtn = document.getElementById('upload-bg-btn');
    const resetBgBtn = document.getElementById('reset-bg-btn');
    const resetLayoutBtn = document.getElementById('reset-layout-btn');

    // Navigation
    const backBtn = document.querySelector('#page-beautify .back-button');
    if(backBtn) backBtn.onclick = () => window.navigateTo('home');

    // 字体设置元素
    const fontUrlInput = document.getElementById('font-url');
    const applyFontBtn = document.getElementById('apply-font-btn');
    const resetFontBtn = document.getElementById('reset-font-btn');

    // 美化预设元素
    const beautifyPresetNameInput = document.getElementById('beautify-preset-name');
    const saveBeautifyPresetBtn = document.getElementById('save-beautify-preset');
    const beautifyPresetsSelect = document.getElementById('beautify-presets-select');
    const loadBeautifyPresetBtn = document.getElementById('load-beautify-preset');
    const deleteBeautifyPresetBtn = document.getElementById('delete-beautify-preset');


    // 创建隐藏的文件输入框 (用于图标上传)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    let currentEditingAppId = null;
    let isUploadingBackground = false;

    // =========== 默认配置 (需与主页保持一致) ===========
    const processUrl = (url) => {
        if (url.includes('postimg.cc') && !url.includes('i.postimg.cc') && !url.includes('/download')) {
            return `${url}/download`;
        }
        return url;
    };

    const defaultIcons = {
        'app-chat': 'https://img.heliar.top/file/1771832122012_98D2EF49-BD6A-4FC5-9E0B-EC499E9B774D.png',
        'app-roles': processUrl('https://img.heliar.top/file/1771832250936_43A64B8A-6C66-4CAB-823E-215063471A8F.png'),
        'app-social': processUrl('https://img.heliar.top/file/1771832330549_7215BA56-21BE-401B-AC9F-BABD9F4A19E6.png'),
        'app-info': processUrl('https://img.heliar.top/file/1771832334436_42FD8A11-B881-44B9-B543-9670D6356936.png'),
        'app-music': processUrl('https://img.heliar.top/file/1771832317923_01DABB5C-D658-4BF0-B99E-9A69A4BC9B0C.png'),
        'app-game': processUrl('https://img.heliar.top/file/1771832331802_841FB1AF-DFE1-4345-8832-7883613BF8F6.png')
    };

    // =========== 应用配置 ===========
    const customizableApps = [
        { id: 'app-chat', name: '莓莓聊天' },
        { id: 'app-roles', name: '来吃橘子' },
        { id: 'app-social', name: '西瓜甜' },
        { id: 'app-info', name: '可口葡萄' },
        { id: 'app-music', name: '来扒柚子' },
        { id: 'app-game', name: '吃火龙果' },
    ];

    // =========== 全能样式模板 (V6.0) ===========
    const cssTemplate = `/* =========================================
   全能自定义样式配置模板
   
   说明：
   1. 此模板包含当前页面所有可自定义元素的 ID 和类名。
   2. 使用 .feshuiguo 前缀可确保样式覆盖默认设置。
   3. 建议使用 !important 强制生效关键属性。
   4. 请勿修改布局属性 (display, grid, position 等)，以免破坏结构。
   ========================================= */

/* --- 1. 全局基础 --- */
.feshuiguo body {
    /* 背景设置 */
    /* background-color: #ffffff !important; */
    /* background-image: url('你的图片地址') !important; */
    /* background-size: cover !important; */
}

/* --- 2. 顶部状态栏 --- */
.feshuiguo #status-bar {
    /* background: rgba(255,255,255,0.5) !important; */
    /* color: #000000 !important; */
    /* font-family: monospace !important; */
}

/* --- 3. 照片墙区域 (4个格子) --- */
/* 容器 */
.feshuiguo #photo-wall {
    /* gap: 10px !important; */
}
/* 所有格子通用样式 */
.feshuiguo .photo-slot {
    /* border-radius: 10px !important; */
    /* border: 2px solid pink !important; */
    /* background-color: #ffe4e1 !important; */
}
/* 单独控制每个格子 (例如设置不同背景色) */
.feshuiguo .photo-slot:nth-child(1) { /* background: #ff9a9e !important; */ }
.feshuiguo .photo-slot:nth-child(2) { /* background: #a1c4fd !important; */ }
.feshuiguo .photo-slot:nth-child(3) { /* background: #84fab0 !important; */ }
.feshuiguo .photo-slot:nth-child(4) { /* background: #e0c3fc !important; */ }

/* --- 4. 这里的每个应用都可以独立设置名字和样式 --- */

/* [应用 1] 莓莓聊天 (#app-chat) */
.feshuiguo #app-chat .icon-image {
    /* border-radius: 50% !important; */
    /* border: 2px solid #ff0000 !important; */
}
/* 修改名字 (去掉下方注释即可生效) */
/*
.feshuiguo #app-chat .app-name {
    visibility: hidden !important; position: relative !important;
}
.feshuiguo #app-chat .app-name::after {
    visibility: visible !important; position: absolute !important;
    left: 0 !important; width: 100% !important; text-align: center !important;
    content: "我的微信" !important; 
    color: #000 !important; 
}
*/

/* [应用 2] 来吃橘子 (#app-roles) */
.feshuiguo #app-roles .icon-image { /* ... */ }
.feshuiguo #app-roles .app-name { /* ... */ }

/* [应用 3] 西瓜甜 (#app-social) */
.feshuiguo #app-social .icon-image { /* ... */ }
.feshuiguo #app-social .app-name { /* ... */ }

/* [应用 4] 可口葡萄 (#app-info) */
.feshuiguo #app-info .icon-image { /* ... */ }
.feshuiguo #app-info .app-name { /* ... */ }

/* [应用 5] 来扒柚子 (#app-music) */
.feshuiguo #app-music .icon-image { /* ... */ }
.feshuiguo #app-music .app-name { /* ... */ }

/* [应用 6] 吃火龙果 (#app-game) */
.feshuiguo #app-game .icon-image { /* ... */ }
.feshuiguo #app-game .app-name { /* ... */ }


/* --- 5. 右侧长方形组件 --- */
.feshuiguo .right-widget {
    /* border-radius: 20px !important; */
    /* background: linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%) !important; */
}

/* --- 6. 便签组件 --- */
.feshuiguo .bottom-left-widget {
    /* background-color: #fff !important; */
    /* border: 1px dashed #333 !important; */
    /* box-shadow: 5px 5px 0px #eee !important; */
}
.feshuiguo #notepad {
    /* color: #333 !important; */
    /* font-family: cursive !important; */
}

/* --- 7. 底部导航栏 --- */
.feshuiguo #bottom-bar {
    /* background: rgba(255,255,255,0.9) !important; */
    /* border-top: 1px solid #eee !important; */
}
/* 底部图标 */
.feshuiguo #bar-settings   { /* opacity: 0.8 !important; */ }
.feshuiguo #bar-beautify   {}
.feshuiguo #bar-world-book {}
.feshuiguo #bar-regex      {}`;

    // =========== 功能函数 ===========

    /**
     * 加载并应用本地存储中的数据
     */
    function loadSettings() {
        // ... (背景加载代码已注释)
        
        const savedCss = localStorage.getItem('fruit-machine-custom-css');
        if (savedCss) {
            customCssInput.value = savedCss;
            applyCustomCss(savedCss);
        }

        const savedFont = localStorage.getItem('fruit-machine-custom-font');
        if (savedFont) {
            fontUrlInput.value = savedFont;
            applyCustomFont(savedFont);
        }
    }
    
    function applyCustomCss(css) {
        let styleElement = document.getElementById('dynamic-custom-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dynamic-custom-styles';
            document.head.appendChild(styleElement);
        }
        styleElement.innerHTML = css;
    }

    function applyCustomFont(url) {
        let fontStyle = document.getElementById('dynamic-font-style');
        if (!fontStyle) {
            fontStyle = document.createElement('style');
            fontStyle.id = 'dynamic-font-style';
            document.head.appendChild(fontStyle);
        }

        if (url) {
            fontStyle.innerHTML = `
                @font-face {
                    font-family: 'CustomUserFont';
                    src: url('${url}');
                    font-display: swap;
                }
                body, button, input, textarea, select {
                    font-family: 'CustomUserFont', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                }
            `;
        } else {
            fontStyle.innerHTML = '';
        }
    }

    /**
     * 生成图标设置器 (包含大小调节)
     */
    function populateIconSetters() {
        const iconSettings = JSON.parse(localStorage.getItem('fruit-machine-icons')) || {};
        const iconSizes = JSON.parse(localStorage.getItem('fruit-machine-icon-sizes')) || {};
        
        iconGrid.innerHTML = ''; // 清空
        
        customizableApps.forEach(app => {
            const iconUrl = iconSettings[app.id] || defaultIcons[app.id] || '';
            // 默认50px，如果有保存则用保存的值
            const currentSizeStr = iconSizes[app.id] || '50px';
            const currentSizeVal = parseInt(currentSizeStr);

            const setterEl = document.createElement('div');
            setterEl.classList.add('icon-setter');
            
            setterEl.innerHTML = `
                <div class="icon-preview-container">
                    <div class="icon-preview" data-appid="${app.id}" style="width: ${currentSizeStr}; height: ${currentSizeStr};">
                        ${iconUrl ? `<img src="${iconUrl}" style="width:100%; height:100%; object-fit:cover; border-radius: 50%;">` : ''}
                    </div>
                </div>
                <span>${app.name}</span>
                <input type="range" class="icon-size-slider" min="30" max="100" value="${currentSizeVal}" data-appid="${app.id}">
                <span class="size-label" style="font-size: 10px; color: #888;">${currentSizeVal}px</span>
            `;
            
            // 绑定滑块事件
            const slider = setterEl.querySelector('.icon-size-slider');
            const preview = setterEl.querySelector('.icon-preview');
            const label = setterEl.querySelector('.size-label');
            
            slider.addEventListener('input', (e) => {
                const newSize = e.target.value + 'px';
                preview.style.width = newSize;
                preview.style.height = newSize;
                label.textContent = newSize;
                
                // 保存大小设置
                saveIconSize(app.id, newSize);
                
                // Update on home screen dynamically
                const homeIcon = document.querySelector(`#page-home #${app.id} .icon-image`);
                if(homeIcon) homeIcon.style.setProperty('--icon-size', newSize);
            });

            iconGrid.appendChild(setterEl);
        });
    }

    function saveIconSize(appId, size) {
        const iconSizes = JSON.parse(localStorage.getItem('fruit-machine-icon-sizes')) || {};
        iconSizes[appId] = size;
        localStorage.setItem('fruit-machine-icon-sizes', JSON.stringify(iconSizes));
    }

    function updateBeautifyPresetsList() {
        const presets = JSON.parse(localStorage.getItem('fruit-machine-beautify-presets')) || {};
        beautifyPresetsSelect.innerHTML = '<option value="">-- 选择预设 --</option>';
        for (const name in presets) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            beautifyPresetsSelect.appendChild(option);
        }
    }
    
    // =========== 事件监听 ===========

    saveCssBtn.addEventListener('click', () => {
        const css = customCssInput.value;
        localStorage.setItem('fruit-machine-custom-css', css);
        applyCustomCss(css);
        
        // 触发一次检测，防止名字重叠
        // Need to wait for styles to apply
        setTimeout(() => {
            if (window.checkCustomNameStyles) {
                window.checkCustomNameStyles();
            } else {
                // Fallback implementation if script.js not updated/reloaded in context
                const apps = document.querySelectorAll('.app-icon');
                apps.forEach(app => {
                    const appName = app.querySelector('.app-name');
                    if (!appName) return;
                    const afterStyle = window.getComputedStyle(appName, '::after');
                    const hasContent = afterStyle.content && afterStyle.content !== 'none' && afterStyle.content !== '""';
                    if (hasContent) appName.classList.add('has-custom-name');
                    else appName.classList.remove('has-custom-name');
                });
            }
        }, 100);

        alert('自定义样式已保存并应用！');
    });

    getCssTemplateBtn.addEventListener('click', () => {
        if(customCssInput.value.trim() !== '' && !confirm("文本框中已有内容，是否覆盖？")) {
            return;
        }
        customCssInput.value = cssTemplate;
        alert("完整配置模板已填充！"); 
    });

    uploadBgBtn.addEventListener('click', () => {
        isUploadingBackground = true;
        fileInput.click();
    });

    resetBgBtn.addEventListener('click', () => {
        if(confirm("确定要恢复默认背景吗？")) {
            localStorage.removeItem('fruit-machine-background');
            screen.style.backgroundImage = '';
            alert("背景已重置！");
        }
    });

    // 重置布局
    if(resetLayoutBtn) {
        resetLayoutBtn.addEventListener('click', () => {
            if(confirm("确定要恢复默认布局吗？这将清除所有自定义图标位置。")) {
                localStorage.removeItem('fruit-machine-layout');
                alert("布局已重置！页面即将刷新。");
                location.reload();
            }
        });
    }

    applyFontBtn.addEventListener('click', () => {
        const url = fontUrlInput.value.trim();
        if (url) {
            localStorage.setItem('fruit-machine-custom-font', url);
            applyCustomFont(url);
            alert('全局字体已应用！');
        } else {
            alert('请输入字体链接');
        }
    });

    resetFontBtn.addEventListener('click', () => {
        if(confirm("确定要恢复默认字体吗？")) {
            localStorage.removeItem('fruit-machine-custom-font');
            fontUrlInput.value = '';
            applyCustomFont(null);
            alert('已恢复默认字体！');
        }
    });


    // 美化预设保存 (更新：包含布局和大小)
    saveBeautifyPresetBtn.addEventListener('click', () => {
        const name = beautifyPresetNameInput.value.trim();
        if (!name) {
            alert('请输入预设名称');
            return;
        }

        const currentConfig = {
            background: localStorage.getItem('fruit-machine-background'),
            icons: JSON.parse(localStorage.getItem('fruit-machine-icons') || '{}'),
            customCss: localStorage.getItem('fruit-machine-custom-css'),
            customFont: localStorage.getItem('fruit-machine-custom-font'),
            // 新增：
            layout: JSON.parse(localStorage.getItem('fruit-machine-layout') || '{}'),
            iconSizes: JSON.parse(localStorage.getItem('fruit-machine-icon-sizes') || '{}')
        };

        const presets = JSON.parse(localStorage.getItem('fruit-machine-beautify-presets')) || {};
        presets[name] = currentConfig;
        localStorage.setItem('fruit-machine-beautify-presets', JSON.stringify(presets));
        
        updateBeautifyPresetsList();
        alert(`美化预设 "${name}" 已保存！`);
        beautifyPresetNameInput.value = '';
    });

    // 加载美化预设 (更新：包含布局和大小)
    loadBeautifyPresetBtn.addEventListener('click', () => {
        const name = beautifyPresetsSelect.value;
        if (!name) return;

        if (!confirm(`确定要加载预设 "${name}" 吗？这将覆盖当前的背景、图标、CSS、字体以及布局设置。`)) {
            return;
        }

        const presets = JSON.parse(localStorage.getItem('fruit-machine-beautify-presets')) || {};
        const config = presets[name];

        if (config) {
            if (config.background) localStorage.setItem('fruit-machine-background', config.background);
            else localStorage.removeItem('fruit-machine-background');

            if (config.icons) localStorage.setItem('fruit-machine-icons', JSON.stringify(config.icons));
            
            if (config.customCss) localStorage.setItem('fruit-machine-custom-css', config.customCss);
            else localStorage.removeItem('fruit-machine-custom-css');

            if (config.customFont) localStorage.setItem('fruit-machine-custom-font', config.customFont);
            else localStorage.removeItem('fruit-machine-custom-font');
            
            // 新增：加载布局和大小
            if (config.layout) localStorage.setItem('fruit-machine-layout', JSON.stringify(config.layout));
            else localStorage.removeItem('fruit-machine-layout');

            if (config.iconSizes) localStorage.setItem('fruit-machine-icon-sizes', JSON.stringify(config.iconSizes));
            else localStorage.removeItem('fruit-machine-icon-sizes');

            alert(`预设 "${name}" 已加载！页面将刷新以应用更改。`);
            window.reloadApp();
        }
    });

    deleteBeautifyPresetBtn.addEventListener('click', () => {
        const name = beautifyPresetsSelect.value;
        if (!name) return;

        if (confirm(`确定要删除预设 "${name}" 吗？`)) {
            const presets = JSON.parse(localStorage.getItem('fruit-machine-beautify-presets')) || {};
            delete presets[name];
            localStorage.setItem('fruit-machine-beautify-presets', JSON.stringify(presets));
            updateBeautifyPresetsList();
        }
    });


    // 导出全局配置 (ZIP打包)
    exportConfigBtn.addEventListener('click', async () => {
        const config = {
            version: "3.0",
            background: localStorage.getItem('fruit-machine-background'),
            icons: JSON.parse(localStorage.getItem('fruit-machine-icons') || '{}'),
            apps: JSON.parse(localStorage.getItem('fruit-machine-apps') || '{}'),
            photos: JSON.parse(localStorage.getItem('fruit-machine-photos') || '{}'),
            customCss: localStorage.getItem('fruit-machine-custom-css'),
            customFont: localStorage.getItem('fruit-machine-custom-font'),
            notepad: localStorage.getItem('fruit-machine-notepad'),
            apiConfig: JSON.parse(localStorage.getItem('fruit-machine-api-config') || '{}'),
            apiPresets: JSON.parse(localStorage.getItem('fruit-machine-api-presets') || '{}'),
            beautifyPresets: JSON.parse(localStorage.getItem('fruit-machine-beautify-presets') || '{}'),
            layout: JSON.parse(localStorage.getItem('fruit-machine-layout') || '{}'),
            iconSizes: JSON.parse(localStorage.getItem('fruit-machine-icon-sizes') || '{}')
        };
        
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);color:#fff;display:flex;justify-content:center;align-items:center;z-index:9999;';
        loadingDiv.innerHTML = '<div>正在打包美化配置，请稍候...</div>';
        document.body.appendChild(loadingDiv);

        try {
            if (typeof JSZip === 'undefined') throw new Error("JSZip not found");

            const zip = new JSZip();
            const assetsFolder = zip.folder("assets");
            let imgCount = 0;

            const base64ToBlob = (base64) => {
                const arr = base64.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while(n--) u8arr[n] = bstr.charCodeAt(n);
                return { blob: new Blob([u8arr], {type:mime}), ext: mime.split('/')[1] || 'png' };
            };

            const processData = (obj) => {
                if (!obj) return obj;
                if (typeof obj === 'string') {
                    if (obj.startsWith('data:image')) {
                        try {
                            const { blob, ext } = base64ToBlob(obj);
                            const filename = `img_${Date.now()}_${imgCount++}.${ext}`;
                            assetsFolder.file(filename, blob);
                            return `assets/${filename}`;
                        } catch(e) { return obj; }
                    }
                    return obj;
                }
                if (Array.isArray(obj)) return obj.map(item => processData(item));
                if (typeof obj === 'object') {
                    const newObj = {};
                    for (const key in obj) newObj[key] = processData(obj[key]);
                    return newObj;
                }
                return obj;
            };

            const cleanData = processData(config);
            zip.file("data.json", JSON.stringify(cleanData, null, 2));

            const content = await zip.generateAsync({type:"blob"});
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = "fruit-machine-beautify.fmbak";
            a.click();
            URL.revokeObjectURL(url);
            
            alert('全局配置已以 ZIP 格式导出！包含纯文本数据和图片资源。');

        } catch (err) {
            console.error(err);
            if (err.message !== "JSZip not found") alert("ZIP 打包失败，尝试导出 JSON...");
            
            const jsonStr = JSON.stringify(config, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "fruit-machine-beautify.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            if(document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv);
        }
    });

    // 导入全局配置 (支持 ZIP/FMBAK 和 JSON)
    importConfigBtn.addEventListener('click', () => {
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
            loadingDiv.innerHTML = '<div>正在解析配置，请稍候...</div>';
            document.body.appendChild(loadingDiv);

            try {
                let config = null;

                if ((file.name.endsWith('.zip') || file.name.endsWith('.fmbak')) && typeof JSZip !== 'undefined') {
                    try {
                        const zip = await JSZip.loadAsync(file);
                        const dataFile = zip.file("data.json");
                        if (!dataFile) throw new Error("无效的存档包：缺少 data.json");
                        
                        const jsonStr = await dataFile.async("string");
                        let rawData = JSON.parse(jsonStr);

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
                            if (Array.isArray(obj)) return Promise.all(obj.map(item => restoreData(item)));
                            if (typeof obj === 'object') {
                                const newObj = {};
                                for (const key in obj) newObj[key] = await restoreData(obj[key]);
                                return newObj;
                            }
                            return obj;
                        };
                        config = await restoreData(rawData);
                    } catch (zipErr) {
                        console.error("ZIP解析失败", zipErr);
                    }
                }

                if (!config) {
                    const text = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = e => reject(new Error("读取失败"));
                        reader.readAsText(file, 'UTF-8');
                    });
                    let content = text;
                    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
                    config = JSON.parse(content);

                    if (window.compressBase64) {
                        loadingDiv.innerHTML = '<div>检测到旧版配置，正在优化图片大小...</div>';
                        if (config.background) config.background = await window.compressBase64(config.background, 1920, 0.8);
                        if (config.photos) {
                            for (let k in config.photos) config.photos[k] = await window.compressBase64(config.photos[k], 1080, 0.8);
                        }
                        if (config.icons) {
                            for (let k in config.icons) config.icons[k] = await window.compressBase64(config.icons[k], 256, 0.8);
                        }
                    }
                }

                if (!config) throw new Error("无法解析配置文件");

                let failedItems = [];
                const trySet = (key, val, isObj) => {
                    try {
                        if(val) localStorage.setItem(key, isObj ? JSON.stringify(val) : val);
                    } catch(e) {
                         if (e.name === 'QuotaExceededError' || e.code === 22) failedItems.push(key);
                    }
                };

                trySet('fruit-machine-background', config.background, false);
                trySet('fruit-machine-icons', config.icons, true);
                trySet('fruit-machine-apps', config.apps, true);
                trySet('fruit-machine-photos', config.photos, true);
                trySet('fruit-machine-custom-css', config.customCss, false);
                trySet('fruit-machine-custom-font', config.customFont, false);
                trySet('fruit-machine-notepad', config.notepad, false);
                trySet('fruit-machine-api-config', config.apiConfig, true);
                trySet('fruit-machine-api-presets', config.apiPresets, true);
                trySet('fruit-machine-beautify-presets', config.beautifyPresets, true);
                
                try {
                    if(config.layout) localStorage.setItem('fruit-machine-layout', JSON.stringify(config.layout));
                    else localStorage.removeItem('fruit-machine-layout');
                } catch(e) { if (e.name === 'QuotaExceededError' || e.code === 22) failedItems.push('layout'); }
                
                trySet('fruit-machine-icon-sizes', config.iconSizes, true);

                if (failedItems.length > 0) {
                    alert('部分配置导入失败（存储空间已满）：\n' + failedItems.join('\n'));
                } else {
                    alert('导入成功！页面将刷新以应用更改。');
                }
                setTimeout(() => window.reloadApp(), 500);

            } catch (error) {
                alert('导入失败！错误信息：' + error.message);
                console.error(error);
            } finally {
                if(document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv);
                if(document.body.contains(input)) document.body.removeChild(input);
            }
        };
        input.click();
    });

    // 简单的图片压缩函数
    function compressImage(base64Str, maxWidth = 150, maxHeight = 150) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // 只有当图片大于目标尺寸时才压缩
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    } else {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                } else {
                    // 不需要压缩，直接返回原图
                    resolve(base64Str);
                    return;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/png', 0.8)); // 稍微压缩质量
            };
            img.onerror = () => resolve(base64Str); // 失败则返回原图
        });
    }

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (isUploadingBackground) {
                // 背景压缩，最大1920x1920，质量0.8
                const resultUrl = await window.compressImage(file, 1920, 1920, 0.8);
                try {
                    localStorage.setItem('fruit-machine-background', resultUrl);
                    alert("背景已更新！请返回主界面查看效果。");
                } catch (err) {
                    alert("背景图片太大，存储空间不足！请尝试使用更小的图片。");
                    console.error(err);
                }
                isUploadingBackground = false;
                if (window.refreshApp) window.refreshApp();
            } else {
                // 图标压缩，最大150x150
                const resultUrl = await window.compressImage(file, 150, 150, 0.8);
                const iconSettings = JSON.parse(localStorage.getItem('fruit-machine-icons')) || {};
                iconSettings[currentEditingAppId] = resultUrl;
                
                localStorage.setItem('fruit-machine-icons', JSON.stringify(iconSettings));
                populateIconSetters(); 
                currentEditingAppId = null;
                if (window.refreshApp) window.refreshApp();
            }
        } catch (e) {
            console.error('图片处理失败:', e);
            if (e.name === 'QuotaExceededError') {
                alert("存储空间已满！图片太大无法保存。");
            } else {
                alert("图片处理失败，请重试");
            }
        } finally {
            fileInput.value = '';
        }
    });

    iconGrid.addEventListener('click', (e) => {
        // 扩大点击区域：只要点击了 .icon-setter 内部，都尝试触发
        // 但为了准确，优先查找 .icon-preview-container
        const container = e.target.closest('.icon-preview-container');
        if (container) {
            const previewEl = container.querySelector('.icon-preview');
            if (previewEl) {
                currentEditingAppId = previewEl.dataset.appid;
                fileInput.click();
            }
        } else {
            // 兼容旧逻辑，直接点击 preview
            const previewEl = e.target.closest('.icon-preview');
            if (previewEl) {
                currentEditingAppId = previewEl.dataset.appid;
                fileInput.click();
            }
        }
    });

    // =========== 初始化 ===========
    loadSettings();
    populateIconSetters();
    updateBeautifyPresetsList();
    
});

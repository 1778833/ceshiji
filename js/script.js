// SPA Global State
window.spaParams = {};

window.navigateTo = function(pageId, params = {}) {
    console.log(`Navigating to ${pageId}`, params);
    
    // Update params
    window.spaParams = params;

    // Hide all pages
    document.querySelectorAll('.spa-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Handle global body class for background effects
        if (pageId !== 'home') {
            document.body.classList.add('not-home');
        } else {
            document.body.classList.remove('not-home');
        }
        
        // Trigger init functions if they exist
        if (pageId === 'chat' && window.initPageChat) window.initPageChat();
        if (pageId === 'chat-window' && window.initPageChatWindow) window.initPageChatWindow();
        if (pageId === 'user-settings' && window.initPageUserSettings) window.initPageUserSettings();
        if (pageId === 'contact-edit' && window.initPageContactEdit) window.initPageContactEdit();
        
        // Special case for Home: reload layout if returning?
        if (pageId === 'home') {
            // Maybe re-render if needed, but usually state is preserved
        }
    } else {
        console.error(`Page ${pageId} not found!`);
    }
};

window.reloadApp = function() {
    location.reload();
};

document.addEventListener('DOMContentLoaded', () => {

    // =========== 默认配置 ===========
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
        'app-game': processUrl('https://img.heliar.top/file/1771832331802_841FB1AF-DFE1-4345-8832-7883613BF8F6.png'),
        // 底部栏
        'bar-settings': processUrl('https://img.heliar.top/file/1771832345739_9BB15499-9568-4CE3-81F9-BF6B5DD674CE.png'),
        'bar-beautify': processUrl('https://img.heliar.top/file/1771832341008_3F860210-3F83-422A-8390-3094650AE816.png'),
        'bar-world-book': processUrl('https://img.heliar.top/file/1771832335173_CA3829EF-927F-4EC3-9343-32EA9B37965E.png'),
        'bar-regex': processUrl('https://img.heliar.top/file/1771832325770_47B61B8D-4967-4511-9285-5CF3A1BE4A4D.png')
    };

    const defaultPhotos = {
        'photo-wall-0': '',
        'photo-wall-1': '',
        'photo-wall-2': '',
        'photo-wall-3': '',
        'right-widget': ''
    };

    // =========== 元素获取 ===========
    const body = document.body;
    // Note: getElementById searches whole document. IDs on home page are unique.
    const screen = document.getElementById('screen'); 
    
    // 底部栏导航绑定
    const barSettings = document.getElementById('bar-settings');
    if(barSettings) barSettings.onclick = () => window.navigateTo('settings');
    
    const barBeautify = document.getElementById('bar-beautify');
    if(barBeautify) barBeautify.onclick = () => window.navigateTo('beautify');
    
    const barWorldBook = document.getElementById('bar-world-book');
    if(barWorldBook) barWorldBook.onclick = () => window.navigateTo('world-book');
    
    const barRegex = document.getElementById('bar-regex');
    if(barRegex) barRegex.onclick = () => window.navigateTo('regex');

    // 应用跳转逻辑
    const appChat = document.getElementById('app-chat');
    if (appChat) {
        appChat.addEventListener('click', (e) => {
            if(!isEditMode) {
                window.navigateTo('chat');
            }
        });
    }

    const notepad = document.getElementById('notepad');
    const dateDisplay = document.getElementById('date-display');
    const timeDisplay = document.getElementById('time-display');
    const saveLayoutBtn = document.getElementById('save-layout-btn');
    const cancelLayoutBtn = document.getElementById('cancel-layout-btn');

    // 状态变量
    let currentEditingElement = null; 
    let currentEditingId = null; 
    let currentEditingType = null; 
    
    // 拖拽相关变量
    let isEditMode = false;
    let longPressTimer = null;
    let isDragging = false;
    let draggedItem = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let itemStartX = 0;
    let itemStartY = 0;

    // 创建隐藏的文件输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // =========== 核心初始化逻辑 ===========

    function initMovableItems() {
        const movables = [
            ...document.querySelectorAll('.app-icon'),
            ...document.querySelectorAll('.photo-slot'),
            document.getElementById('right-widget'),
            document.getElementById('notepad-widget')
        ];
        
        movables.forEach(el => {
            if(el) {
                el.classList.add('movable-item');
                el.ondragstart = () => false; 
            }
        });
    }

    function loadLayout() {
        const savedLayout = localStorage.getItem('fruit-machine-layout');
        if (savedLayout) {
            let layoutData = {};
            try {
                layoutData = JSON.parse(savedLayout);
            } catch (e) {
                console.error('Error parsing layout data', e);
                return;
            }
            
            body.classList.add('custom-layout-active');

            for (const id in layoutData) {
                const el = document.getElementById(id);
                if (el) {
                    const pos = layoutData[id];
                    el.style.position = 'absolute';
                    el.style.left = pos.left;
                    el.style.top = pos.top;
                    el.style.width = pos.width;
                    el.style.height = pos.height;
                    el.style.margin = '0';
                    el.style.zIndex = '10'; 
                }
            }
        }
    }

    function loadIconSizes() {
        let iconSizes = {};
        try {
            iconSizes = JSON.parse(localStorage.getItem('fruit-machine-icon-sizes')) || {};
        } catch (e) {
            console.error('Error parsing icon sizes', e);
        }
        
        document.querySelectorAll('.app-icon').forEach(app => {
            if (iconSizes[app.id]) {
                const imgContainer = app.querySelector('.icon-image');
                if (imgContainer) {
                    imgContainer.style.setProperty('--icon-size', iconSizes[app.id]);
                }
            }
        });
    }

    // =========== 拖拽与编辑逻辑 ===========

    function freezeLayout() {
        if (body.classList.contains('custom-layout-active')) return;
        if (!screen) return;

        const screenRect = screen.getBoundingClientRect();
        
        document.querySelectorAll('.movable-item').forEach(el => {
            const rect = el.getBoundingClientRect();
            
            const left = rect.left - screenRect.left;
            const top = rect.top - screenRect.top;
            
            el.style.position = 'absolute';
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.margin = '0';
            el.style.zIndex = '10';
        });

        body.classList.add('custom-layout-active');
    }

    function enableEditMode() {
        if (isEditMode) return;
        
        freezeLayout();

        isEditMode = true;
        body.classList.add('edit-mode');
        if (saveLayoutBtn) saveLayoutBtn.style.display = 'flex';
        if (cancelLayoutBtn) cancelLayoutBtn.style.display = 'flex';
        
        if (navigator.vibrate) navigator.vibrate(50);
    }

    function disableEditMode(shouldSave = true) {
        isEditMode = false;
        body.classList.remove('edit-mode');
        if (saveLayoutBtn) saveLayoutBtn.style.display = 'none';
        if (cancelLayoutBtn) cancelLayoutBtn.style.display = 'none';
        
        if (shouldSave) {
            saveLayout();
        } else {
            // Reload to reset positions if cancelled
            location.reload();
        }
    }

    function saveLayout() {
        if (!screen) return;
        const layoutData = {};
        const screenRect = screen.getBoundingClientRect();

        document.querySelectorAll('.movable-item').forEach(el => {
            const rect = el.getBoundingClientRect();
            
            const leftPercent = ((rect.left - screenRect.left) / screenRect.width) * 100;
            const topPercent = ((rect.top - screenRect.top) / screenRect.height) * 100;
            const widthPercent = (rect.width / screenRect.width) * 100;
            const heightPercent = (rect.height / screenRect.height) * 100;

            if (el.id) {
                layoutData[el.id] = {
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`
                };
            }
        });

        localStorage.setItem('fruit-machine-layout', JSON.stringify(layoutData));
    }

    // 指针事件处理
    document.addEventListener('pointerdown', (e) => {
        // Only allow edit mode if on home page
        if (!document.getElementById('page-home').classList.contains('active')) return;

        const target = e.target.closest('.movable-item');
        
        if (!target) return;

        // 长按检测
        longPressTimer = setTimeout(() => {
            if (!isEditMode) {
                enableEditMode();
            }
        }, 500);

        if (isEditMode) {
            e.preventDefault(); 
            draggedItem = target;
            isDragging = false;
            
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            const computedStyle = window.getComputedStyle(draggedItem);
            itemStartX = parseFloat(computedStyle.left);
            itemStartY = parseFloat(computedStyle.top);
            
            draggedItem.setPointerCapture(e.pointerId);
            draggedItem.classList.add('dragging');
            draggedItem.style.zIndex = '1000';
        }
    });

    document.addEventListener('pointermove', (e) => {
        if (Math.abs(e.clientX - dragStartX) > 5 || Math.abs(e.clientY - dragStartY) > 5) {
            clearTimeout(longPressTimer);
        }

        if (isEditMode && draggedItem) {
            isDragging = true;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            
            draggedItem.style.left = (itemStartX + dx) + 'px';
            draggedItem.style.top = (itemStartY + dy) + 'px';
        }
    });

    document.addEventListener('pointerup', (e) => {
        clearTimeout(longPressTimer);
        
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem.style.zIndex = '10'; // 恢复层级
            draggedItem.releasePointerCapture(e.pointerId);
            draggedItem = null;
        }
    });

    if (saveLayoutBtn) {
        saveLayoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            disableEditMode(true);
            alert("布局已保存！");
        });
    }

    if (cancelLayoutBtn) {
        cancelLayoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm("确定要退出编辑模式吗？未保存的移动将丢失。")) {
                disableEditMode(false);
            }
        });
    }


    // =========== 原有功能函数 (保持不变) ===========

    function updateTime() {
        if (!dateDisplay || !timeDisplay) return;
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        dateDisplay.textContent = `${year}/${month}/${day}`;
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }

    function loadAllSettings() {
        const savedBg = localStorage.getItem('fruit-machine-background');
        // Only apply to the home screen
        const homeScreen = document.getElementById('screen');
        if (homeScreen) {
            if (savedBg) {
                homeScreen.style.backgroundImage = `url(${savedBg})`;
                homeScreen.style.backgroundSize = 'cover';
                homeScreen.style.backgroundPosition = 'center';
                homeScreen.style.backgroundRepeat = 'no-repeat';
            } else {
                homeScreen.style.backgroundImage = '';
            }
        }

        const savedCss = localStorage.getItem('fruit-machine-custom-css');
        if (savedCss) {
            let styleElement = document.getElementById('dynamic-custom-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'dynamic-custom-styles';
                document.head.appendChild(styleElement);
            }
            styleElement.innerHTML = savedCss;
        }

        const savedFont = localStorage.getItem('fruit-machine-custom-font');
        if (savedFont) {
            let fontStyle = document.getElementById('dynamic-font-style');
            if (!fontStyle) {
                fontStyle = document.createElement('style');
                fontStyle.id = 'dynamic-font-style';
                document.head.appendChild(fontStyle);
            }
            fontStyle.innerHTML = `
                @font-face {
                    font-family: 'CustomUserFont';
                    src: url('${savedFont}');
                    font-display: swap;
                }
                body, button, input, textarea, select {
                    font-family: 'CustomUserFont', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                }
            `;
        }

        let appData = {};
        try {
            appData = JSON.parse(localStorage.getItem('fruit-machine-apps')) || {};
        } catch (e) {
            console.error('Error parsing app data', e);
        }

        let iconData = {};
        try {
            iconData = JSON.parse(localStorage.getItem('fruit-machine-icons')) || {}; 
        } catch (e) {
            console.error('Error parsing icon data', e);
        }
        
        document.querySelectorAll('.app-icon').forEach(app => {
            const appId = app.id;
            const appNameSpan = app.querySelector('.app-name');
            const appIconDiv = app.querySelector('.icon-image');
            
            if (appData[appId] && appData[appId].name) {
                appNameSpan.textContent = appData[appId].name;
            }

            const iconUrl = iconData[appId] || (appData[appId] ? appData[appId].icon : '') || defaultIcons[appId];
            if (iconUrl) {
                appIconDiv.innerHTML = `<img src="${iconUrl}" alt="${appNameSpan.textContent}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmZmZjYzciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZHg9Ii0wLjVlbSIgZHk9IjAuM2VtIiBmaWxsPSIjNTU1Ij7lm748L3RleHQ+PC9zdmc+';">`;
            }
        });

        ['bar-settings', 'bar-beautify', 'bar-world-book', 'bar-regex'].forEach(barId => {
            const barEl = document.getElementById(barId);
            if (barEl) {
                const img = barEl.querySelector('img');
                const iconUrl = iconData[barId] || defaultIcons[barId];
                if (img && iconUrl) {
                    img.src = iconUrl;
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZmZmY2M3Ii8+PC9zdmc+'; 
                    };
                }
            }
        });

        let photoData = {};
        try {
            photoData = JSON.parse(localStorage.getItem('fruit-machine-photos')) || {};
        } catch (e) {
            console.error('Error parsing photo data', e);
        }

        document.querySelectorAll('#photo-wall .photo-slot').forEach((slot, index) => {
            const photoId = `photo-wall-${index}`;
            const imgEl = slot.querySelector('img');
            const photoUrl = photoData[photoId] || defaultPhotos[photoId];
            if (imgEl) {
                if (photoUrl) {
                    imgEl.src = photoUrl;
                    imgEl.style.display = 'block';
                } else {
                    imgEl.style.display = 'none';
                }
            }
        });
        const rightWidgetImg = document.querySelector('.right-widget img');
        const widgetUrl = photoData['right-widget'] || defaultPhotos['right-widget'];
        if (rightWidgetImg) {
            if (widgetUrl) {
                rightWidgetImg.src = widgetUrl;
                rightWidgetImg.style.display = 'block';
            } else {
                rightWidgetImg.style.display = 'none';
            }
        }

        if(notepad) {
            notepad.value = localStorage.getItem('fruit-machine-notepad') || '';
        }
    }

    function saveAppData(appId, data) {
        let appData = {};
        try {
            appData = JSON.parse(localStorage.getItem('fruit-machine-apps')) || {};
        } catch(e) {}
        
        if (!appData[appId]) appData[appId] = {};
        Object.assign(appData[appId], data);
        localStorage.setItem('fruit-machine-apps', JSON.stringify(appData));
    }

    function saveIconSetting(id, url) {
        let iconSettings = {};
        try {
            iconSettings = JSON.parse(localStorage.getItem('fruit-machine-icons')) || {};
        } catch(e) {}
        
        iconSettings[id] = url;
        localStorage.setItem('fruit-machine-icons', JSON.stringify(iconSettings));
    }

    function savePhotoData(photoId, url) {
        let photoData = {};
        try {
            photoData = JSON.parse(localStorage.getItem('fruit-machine-photos')) || {};
        } catch(e) {}
        
        photoData[photoId] = url;
        localStorage.setItem('fruit-machine-photos', JSON.stringify(photoData));
    }

    // =========== 文件处理 ===========
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const resultUrl = event.target.result; 

            if (currentEditingType === 'app') {
                if (currentEditingElement) {
                    currentEditingElement.innerHTML = `<img src="${resultUrl}" style="width:100%; height:100%; object-fit:cover;">`;
                }
                saveIconSetting(currentEditingId, resultUrl);
                
            } else if (currentEditingType === 'photo') {
                if (currentEditingElement) {
                    currentEditingElement.src = resultUrl;
                    currentEditingElement.style.display = 'block'; 
                }
                savePhotoData(currentEditingId, resultUrl);

            } else if (currentEditingType === 'widget') {
                if (currentEditingElement) {
                    currentEditingElement.src = resultUrl;
                    currentEditingElement.style.display = 'block'; 
                }
                savePhotoData('right-widget', resultUrl);
            }

            currentEditingElement = null;
            currentEditingId = null;
            currentEditingType = null;
            fileInput.value = ''; 
        };
        reader.readAsDataURL(file);
    });

    function triggerFileUpload(element, id, type) {
        currentEditingElement = element;
        currentEditingId = id;
        currentEditingType = type;
        fileInput.click();
    }


    // =========== 事件监听 (双击修改 & 点击打开) ===========
    
    if(notepad) {
        notepad.addEventListener('input', () => {
            localStorage.setItem('fruit-machine-notepad', notepad.value);
        });
    }

    // Removed double-click rename listener as requested by user

    document.querySelectorAll('.app-icon .icon-image').forEach(iconDiv => {
        iconDiv.addEventListener('dblclick', (e) => {
            if(isEditMode) return;
            e.preventDefault();
            e.stopPropagation();
            const appId = iconDiv.closest('.app-icon').id;
            triggerFileUpload(iconDiv, appId, 'app');
        });
    });

    document.querySelectorAll('#photo-wall .photo-slot').forEach((slot, index) => {
        slot.addEventListener('dblclick', (e) => {
            if(isEditMode) return;
            e.preventDefault();
            e.stopPropagation();
            const photoId = `photo-wall-${index}`;
            const imgEl = slot.querySelector('img');
            triggerFileUpload(imgEl, photoId, 'photo');
        });
    });

    const rightWidget = document.querySelector('.right-widget');
    if (rightWidget) {
        rightWidget.addEventListener('dblclick', (e) => {
             if(isEditMode) return;
             e.preventDefault();
             e.stopPropagation();
             const imgEl = rightWidget.querySelector('img');
             triggerFileUpload(imgEl, 'right-widget', 'widget');
        });
    }


    // =========== 自动检测样式冲突 ===========
    function checkCustomNameStyles() {
        const apps = document.querySelectorAll('.app-icon');
        apps.forEach(app => {
            const appName = app.querySelector('.app-name');
            if (!appName) return;

            // 获取伪元素的样式
            const afterStyle = window.getComputedStyle(appName, '::after');
            const hasContent = afterStyle.content && afterStyle.content !== 'none' && afterStyle.content !== '""';
            
            // 如果伪元素有内容，说明应用了自定义名字的CSS
            if (hasContent) {
                appName.classList.add('has-custom-name');
            } else {
                appName.classList.remove('has-custom-name');
            }
        });
    }

    // =========== 初始化 ===========
    initMovableItems();
    loadAllSettings();
    checkCustomNameStyles(); // Check on init
    loadLayout();     
    loadIconSizes();  
    
    // Expose refresh function
    window.refreshApp = loadAllSettings;
    
    updateTime();
    setInterval(updateTime, 1000);
    console.log("水果机主页脚本V6加载完毕！");
});

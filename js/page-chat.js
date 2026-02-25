// page-chat.js
(function() {
    // DOM Elements
    let headerTitle, btnExit, btnAddContact, contactListContainer;

    // Initialize elements when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        headerTitle = document.querySelector('#page-chat .chat-title');
        btnExit = document.querySelector('#page-chat #btn-exit');
        btnAddContact = document.querySelector('#page-chat #btn-add-contact');
        contactListContainer = document.querySelector('#page-chat #contact-list-container');
        
        // Navigation bindings
        if(btnExit) btnExit.onclick = (e) => { e.preventDefault(); window.navigateTo('home'); };
        if(btnAddContact) btnAddContact.onclick = (e) => { e.preventDefault(); window.navigateTo('contact-edit'); };

        // Tab switching
        document.querySelectorAll('#page-chat .chat-tab-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove active from all tabs in this page
                document.querySelectorAll('#page-chat .chat-tab-item').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('#page-chat .chat-content-area').forEach(content => content.classList.add('hidden'));

                // Activate current
                item.classList.add('active');
                const targetId = `tab-content-${item.dataset.target}`;
                const targetArea = document.querySelector(`#page-chat #${targetId}`);
                if(targetArea) targetArea.classList.remove('hidden');
                
                // Update header
                const target = item.dataset.target;
                const titles = {
                    'messages': '消息',
                    'channels': '频道',
                    'contacts': '联系人',
                    'moments': '动态'
                };
                if(headerTitle) headerTitle.textContent = titles[target];

                if (target === 'contacts') {
                    if(btnExit) btnExit.classList.add('hidden');
                    if(btnAddContact) btnAddContact.classList.remove('hidden');
                    loadContacts(); 
                } else if (target === 'messages') {
                    if(btnExit) btnExit.classList.remove('hidden');
                    if(btnAddContact) btnAddContact.classList.add('hidden');
                    loadMessages();
                } else {
                    if(btnExit) btnExit.classList.remove('hidden');
                    if(btnAddContact) btnAddContact.classList.add('hidden');
                }
            });
        });

        // Independent Home Avatar Logic
        const avatarContainer = document.querySelector('#page-chat #current-user-avatar');
        if(avatarContainer) {
            avatarContainer.onclick = (e) => { 
                e.preventDefault(); 
                if(!avatarContainer.dataset.isLongPress) {
                    window.navigateTo('user-settings'); 
                }
                avatarContainer.dataset.isLongPress = ''; 
            };

            // Compression function
            const compressHomeAvatar = (file, quality=0.6, maxWidth=500) => {
                return new Promise(resolve => {
                    const r = new FileReader();
                    r.onload = e => {
                        const img = new Image();
                        img.onload = () => {
                            const cvs = document.createElement('canvas');
                            let w=img.width, h=img.height;
                            if(w>maxWidth) { h=(maxWidth/w)*h; w=maxWidth; }
                            cvs.width=w; cvs.height=h;
                            cvs.getContext('2d').drawImage(img,0,0,w,h);
                            resolve(cvs.toDataURL('image/jpeg', quality));
                        };
                        img.src = e.target.result;
                    };
                    r.readAsDataURL(file);
                });
            };

            // Long press to upload independent home avatar
            let pressTimer;
            const startPress = () => {
                pressTimer = setTimeout(() => {
                    avatarContainer.dataset.isLongPress = 'true';
                    // Dynamic file input
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = async (e) => {
                        if(e.target.files[0]) {
                            try {
                                const b64 = await compressHomeAvatar(e.target.files[0]);
                                updateHomeAvatar(b64);
                            } catch(err) {
                                alert("图片处理失败");
                            }
                        }
                    };
                    fileInput.click();
                }, 600);
            };
            const endPress = () => clearTimeout(pressTimer);
            
            avatarContainer.addEventListener('mousedown', startPress);
            avatarContainer.addEventListener('mouseup', endPress);
            avatarContainer.addEventListener('touchstart', startPress);
            avatarContainer.addEventListener('touchend', endPress);
            avatarContainer.addEventListener('touchmove', endPress);
        }
    });

    // Public init function
    window.initPageChat = function() {
        loadMessages();
        loadHomeAvatar();
    };

    function loadHomeAvatar() {
        // Load independent home avatar
        const homeAvatarData = localStorage.getItem('fruit-machine-home-avatar');
        const avatarImg = document.querySelector('#page-chat #current-user-avatar img');
        
        if (avatarImg) {
            if (homeAvatarData) {
                avatarImg.src = homeAvatarData;
            } else {
                // Legacy fallback or placeholder
                const currentUser = JSON.parse(localStorage.getItem('fruit-machine-current-user')) || {};
                avatarImg.src = currentUser.avatar || 'https://via.placeholder.com/40';
            }
        }
    }

    function updateHomeAvatar(base64) {
        try {
            // Save independently, do NOT update user presets
            localStorage.setItem('fruit-machine-home-avatar', base64);
            loadHomeAvatar(); // Refresh UI
            alert("左上角头像已更新");
        } catch(err) {
            alert("保存失败: " + err.message);
        }
    }

    function loadContacts() {
        if(!contactListContainer) return;
        const contacts = JSON.parse(localStorage.getItem('fruit-machine-contacts')) || [];
        contactListContainer.innerHTML = '';
        
        if (contacts.length === 0) {
            contactListContainer.innerHTML = '<div style="text-align:center;color:#999;margin-top:20px;">暂无联系人<br>点击右上角 + 添加</div>';
            return;
        }

        // Grouping
        const roles = contacts.filter(c => !c.group || c.group === 'role');
        const others = contacts.filter(c => c.group === 'other');

        // Render Roles
        if (roles.length > 0) {
            const title = document.createElement('div');
            title.className = 'contact-group-title';
            title.textContent = '角色';
            contactListContainer.appendChild(title);

            roles.forEach(c => renderContactItem(c));
        }

        // Render Others
        if (others.length > 0) {
            const title = document.createElement('div');
            title.className = 'contact-group-title';
            title.textContent = '其他';
            contactListContainer.appendChild(title);

            others.forEach(c => renderContactItem(c));
        }
    }

    function renderContactItem(contact) {
        const el = document.createElement('div');
        el.className = 'contact-item';
        el.onclick = () => {
            window.navigateTo('contact-edit', { id: contact.id });
        };
        
        const avatarSrc = contact.avatar || 'https://via.placeholder.com/50';
        
        el.innerHTML = `
            <div class="contact-avatar">
                <img src="${avatarSrc}">
            </div>
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="contact-remark">${contact.remark || ''}</div>
            </div>
        `;
        contactListContainer.appendChild(el);
    }

    function loadMessages() {
        const messageListContainer = document.querySelector('#page-chat .message-list');
        if(!messageListContainer) return;
        
        messageListContainer.innerHTML = `
            <div class="message-item">
                <div class="msg-avatar"></div>
                <div class="msg-info">
                    <div class="msg-name">系统通知</div>
                    <div class="msg-preview">欢迎来到莓莓聊天！</div>
                </div>
            </div>
        `;

        const contacts = JSON.parse(localStorage.getItem('fruit-machine-contacts')) || [];
        const activeChats = contacts.filter(c => c.inChatList === true);

        activeChats.forEach(contact => {
            const el = document.createElement('div');
            el.className = 'message-item';
            el.onclick = () => {
                window.navigateTo('chat-window', { id: contact.id });
            };

            const avatarSrc = contact.avatar || 'https://via.placeholder.com/45';
            
            el.innerHTML = `
                <div class="msg-avatar">
                    <img src="${avatarSrc}">
                </div>
                <div class="msg-info">
                    <div class="msg-name">${contact.name}</div>
                    <div class="msg-preview">${contact.remark || '点击开始聊天'}</div>
                </div>
            `;
            messageListContainer.appendChild(el);
        });
    }

})();

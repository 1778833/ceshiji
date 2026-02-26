// page-chat-window.js
(function() {
    let contactId = null;
    let contact = null, userPreset = null, chatHistory = [], chatConfig = {}, summaryList = [];
    let renderedCount = 0, isSelectMode = false, selectedIndices = new Set(), currentQuote = null;
    let contextMenuTargetIndex = null;
    let longPressTriggered = false;

    // Thought Feature State
    const thoughtThemes = [
        { id: 'theme-cat', name: '萌萌小猫' },
        { id: 'theme-ins', name: '简约ins' },
        { id: 'theme-angry', name: '气鼓鼓' },
        { id: 'theme-snow', name: '飘雪' },
        { id: 'theme-water', name: '水滴' },
        { id: 'theme-ink', name: '墨韵' },
        { id: 'theme-wind', name: '思念的风' },
        { id: 'theme-star', name: '星河' },
        { id: 'theme-sakura', name: '樱花' },
        { id: 'theme-neon', name: '霓虹' }
    ];
    let currentThemeIndex = 0;

    // DOM Elements - initialized on load
    let msgArea, inputBox, loadMoreBtn;

    async function compressImage(file, quality=0.7, maxWidth=1080) {
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
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Elements
        msgArea = document.getElementById('msg-area');
        inputBox = document.getElementById('input-box');
        
        loadMoreBtn = document.createElement('div');
        loadMoreBtn.id = 'load-more-btn';
        loadMoreBtn.textContent = '点击加载更多';
        loadMoreBtn.onclick = loadMoreMessages;

        // Header Buttons
        const headerBtns = document.querySelectorAll('#page-chat-window .header-btn');
        if(headerBtns.length > 0) {
            headerBtns[0].onclick = (e) => { e.preventDefault(); window.navigateTo('chat'); };
        }
        
        // Change settings icon to blueberry
        const btnSettings = document.getElementById('btn-settings');
        if(btnSettings) btnSettings.textContent = '🫐';

        document.getElementById('btn-send').addEventListener('click', sendMessage);
        document.getElementById('btn-strawberry').addEventListener('click', triggerAI);
        document.getElementById('btn-plus').addEventListener('click', () => {
            document.getElementById('plus-menu').style.display = 'flex';
        });
        
        // Document level clicks for closing menus
        document.addEventListener('click', e => {
            if(document.querySelector('#page-chat-window').style.display === 'none') return; // Only if active

            if(!e.target.closest('#btn-plus')) {
                const menu = document.getElementById('plus-menu');
                if(menu) menu.style.display = 'none';
            }
            
            if(longPressTriggered) { longPressTriggered=false; return; }
            if(!e.target.closest('#context-menu')) {
                const ctxMenu = document.getElementById('context-menu');
                if(ctxMenu) ctxMenu.style.display = 'none';
            }
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            fillSettings();
            document.getElementById('modal-settings').style.display = 'flex';
        });
        document.getElementById('btn-save-cfg').addEventListener('click', saveConfig);
        document.getElementById('btn-view-debug').addEventListener('click', showDebugView);
        
        document.getElementById('menu-summary').addEventListener('click', () => {
            renderSummary();
            document.getElementById('modal-summary').style.display = 'flex';
        });
        document.getElementById('btn-do-summary').addEventListener('click', () => performSummary());
        document.getElementById('menu-regenerate').addEventListener('click', regenerateLast);
        document.getElementById('btn-cancel-del').addEventListener('click', exitSelectMode);
        document.getElementById('btn-confirm-del').addEventListener('click', deleteSelected);

        // Context Menu
        document.getElementById('ctx-quote').addEventListener('click', () => {
            if(contextMenuTargetIndex!==null) {
                currentQuote = chatHistory[contextMenuTargetIndex].content;
                document.getElementById('quote-text').textContent = currentQuote.substring(0,20) + (currentQuote.length>20?"...":"");
                document.getElementById('quote-bar').style.display = 'flex';
            }
            document.getElementById('context-menu').style.display = 'none';
        });
        document.getElementById('ctx-edit').addEventListener('click', () => {
            if(contextMenuTargetIndex!==null) {
                const msg = chatHistory[contextMenuTargetIndex];
                const newTxt = prompt("编辑消息:", msg.content);
                if(newTxt !== null && newTxt !== msg.content) {
                    msg.content = newTxt;
                    save();
                    renderInitialMessages();
                }
            }
            document.getElementById('context-menu').style.display = 'none';
        });
        document.getElementById('ctx-del').addEventListener('click', () => {
            document.getElementById('context-menu').style.display = 'none';
            enterSelectMode();
            if(contextMenuTargetIndex!==null) {
                selectedIndices.add(contextMenuTargetIndex);
                const el = document.querySelector(`.msg-row[data-index="${contextMenuTargetIndex}"] .select-checkbox`);
                if(el) el.classList.add('checked');
                document.getElementById('select-count').textContent = "已选 1 条";
            }
        });

        // Background
        const bgInput = document.getElementById('cfg-bg-input');
        if(bgInput) {
            bgInput.addEventListener('change', async e => {
                if(e.target.files[0]) {
                    const b64 = await compressImage(e.target.files[0]);
                    document.getElementById('bg-preview').src = b64;
                    document.getElementById('bg-preview').style.display = 'block';
                    document.getElementById('btn-clear-bg').style.display = 'block';
                    bgInput.dataset.base64 = b64;
                }
            });
        }
        const btnClearBg = document.getElementById('btn-clear-bg');
        if(btnClearBg) {
            btnClearBg.addEventListener('click', () => {
                bgInput.value=''; delete bgInput.dataset.base64;
                document.getElementById('bg-preview').style.display = 'none';
                document.getElementById('btn-clear-bg').style.display = 'none';
            });
        }
        
        // Modals close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = function() {
                this.closest('.modal').style.display = 'none';
            }
        });
        
        // Quote cancel
        const quoteCancel = document.querySelector('#quote-bar span[onclick]');
        if(quoteCancel) {
            quoteCancel.onclick = cancelQuote;
            quoteCancel.removeAttribute('onclick');
        }

        initThoughtFeature();
    });

    // Public Init
    window.initPageChatWindow = function() {
        // Reset state
        contactId = window.spaParams.id;
        if(!contactId) {
            alert("未指定联系人");
            window.navigateTo('chat');
            return;
        }
        
        const contacts = JSON.parse(localStorage.getItem('fruit-machine-contacts')) || [];
        contact = contacts.find(c => c.id === contactId);
        if(!contact) {
            alert("联系人不存在");
            window.navigateTo('chat');
            return;
        }

        const titleEl = document.querySelector('#page-chat-window #chat-title');
        if(titleEl) titleEl.textContent = contact.name;

        const presets = JSON.parse(localStorage.getItem('fruit-machine-user-presets')) || [];
        // Strict ID matching
        userPreset = presets.find(p => String(p.id) === String(contact.boundUserPresetId));
        if(!userPreset) {
            const curId = localStorage.getItem('fruit-machine-current-preset-id');
            userPreset = presets.find(p => String(p.id) === String(curId));
            if (!userPreset && presets.length > 0) userPreset = presets[0];
        }

        const key = `fruit-machine-chat-${contactId}`;
        const data = JSON.parse(localStorage.getItem(key)) || {};
        chatHistory = data.history || [];
        chatConfig = data.config || { replyMin:1, replyMax:1, mountLimit:50, contextLimit:20, summaryTrigger:50 };
        summaryList = data.summaryList || [];
        
        selectedIndices = new Set();
        isSelectMode = false;
        exitSelectMode(); // Ensure UI reset

        applyConfig();
        renderInitialMessages();
    };

    function cancelQuote() {
        currentQuote = null;
        document.getElementById('quote-bar').style.display = 'none';
    };

    function renderInitialMessages() {
        if(!msgArea) return;
        msgArea.innerHTML = '';
        msgArea.appendChild(loadMoreBtn);
        const limit = parseInt(chatConfig.mountLimit) || 50;
        const start = Math.max(0, chatHistory.length - limit);
        const msgs = chatHistory.slice(start);
        renderedCount = msgs.length;
        msgs.forEach((msg, i) => appendMessage(msg, start + i));
        updateLoadMore();
        scrollToBottom();
    }

    function loadMoreMessages() {
        const limit = parseInt(chatConfig.mountLimit) || 50;
        const remaining = chatHistory.length - renderedCount;
        if(remaining <= 0) return;
        const count = Math.min(limit, remaining);
        const start = chatHistory.length - renderedCount - count;
        const end = chatHistory.length - renderedCount;
        const msgs = chatHistory.slice(start, end);
        for(let i=msgs.length-1; i>=0; i--) {
            const el = createMsgEl(msgs[i], start + i);
            msgArea.insertBefore(el, loadMoreBtn.nextSibling);
        }
        renderedCount += count;
        updateLoadMore();
    }

    function updateLoadMore() {
        loadMoreBtn.style.display = renderedCount < chatHistory.length ? 'block' : 'none';
        loadMoreBtn.textContent = `点击加载更多 (${chatHistory.length - renderedCount} 条)`;
    }

    function appendMessage(msg, index) {
        const el = createMsgEl(msg, index);
        msgArea.appendChild(el);
    }

    function createMsgEl(msg, index) {
        const row = document.createElement('div');
        row.className = `msg-row ${msg.role}`;
        row.dataset.index = index;

        const cb = document.createElement('div');
        cb.className = 'select-checkbox';
        if(selectedIndices.has(index)) cb.classList.add('checked');
        row.appendChild(cb);

        // 长按菜单
        let timer;
        const startPress = (e) => {
            if(!isSelectMode) {
                timer = setTimeout(() => {
                    showContextMenu(e, index);
                    longPressTriggered = true;
                }, 600);
            }
        };
        const endPress = () => clearTimeout(timer);
        row.addEventListener('mousedown', startPress);
        row.addEventListener('mouseup', endPress);
        row.addEventListener('touchstart', startPress);
        row.addEventListener('touchend', endPress);
        row.addEventListener('touchmove', endPress);
        row.addEventListener('mouseleave', endPress);

        // 点击选择
        row.addEventListener('click', (e) => {
            if(isSelectMode) {
                if(selectedIndices.has(index)) {
                    selectedIndices.delete(index);
                    cb.classList.remove('checked');
                } else {
                    selectedIndices.add(index);
                    cb.classList.add('checked');
                }
                document.getElementById('select-count').textContent = `已选 ${selectedIndices.size} 条`;
            }
        });

        const av = document.createElement('div');
        av.className = 'msg-avatar';
        const url = msg.role === 'user' ? (userPreset?.avatar) : (contact.avatar);
        if(url) av.innerHTML = `<img src="${url}">`;
        
        // Avatar click to show thought
        av.onclick = (e) => {
            e.stopPropagation();
            if(msg.role === 'ai') {
                showThoughtModal(index);
            }
        };

        row.appendChild(av);

        const b = document.createElement('div');
        b.className = 'msg-bubble';
        if(msg.role==='user' && chatConfig.cssUser) b.style.cssText += chatConfig.cssUser;
        if(msg.role==='ai' && chatConfig.cssAi) b.style.cssText += chatConfig.cssAi;
        
        let content = msg.content;
        if (!content.includes('<')) { content = content.replace(/\n/g, '<br>'); }
        b.innerHTML = content;

        // Sanitize inline events to prevent accidental toggling/interaction from HTML Worldbook content
        b.querySelectorAll('*').forEach(el => {
            el.removeAttribute('onclick');
            el.removeAttribute('onmousedown');
            el.removeAttribute('onmouseup');
        });

        row.appendChild(b);
        return row;
    }

    function showContextMenu(e, index) {
        if(isSelectMode) return;
        e.preventDefault();
        contextMenuTargetIndex = index;
        const menu = document.getElementById('context-menu');
        let x = e.touches ? e.touches[0].clientX : e.clientX;
        let y = e.touches ? e.touches[0].clientY : e.clientY;
        
        if (x + 100 > window.innerWidth) x -= 100;
        if (y + 120 > window.innerHeight) y -= 120;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'flex';
    }

    function enterSelectMode() {
        if(isSelectMode) return;
        isSelectMode = true;
        document.body.classList.add('select-mode');
        document.getElementById('input-bar').style.display = 'none';
        document.getElementById('delete-bar').style.display = 'flex';
        selectedIndices.clear();
        document.getElementById('select-count').textContent = "已选 0 条";
    }

    function exitSelectMode() {
        isSelectMode = false;
        document.body.classList.remove('select-mode');
        document.getElementById('input-bar').style.display = 'block'; // Ensure input bar is shown
        document.getElementById('delete-bar').style.display = 'none';
        document.querySelectorAll('.select-checkbox').forEach(c => c.classList.remove('checked'));
    }

    function deleteSelected() {
        if(selectedIndices.size === 0) return exitSelectMode();
        if(!confirm(`删除选中的 ${selectedIndices.size} 条消息?`)) return;
        const sorted = Array.from(selectedIndices).sort((a,b) => b-a);
        sorted.forEach(idx => chatHistory.splice(idx, 1));
        
        // Force sync with localStorage immediately
        save();
        // Also update contact last msg preview if possible (optional but good)
        
        exitSelectMode();
        renderInitialMessages();
    }

    function sendMessage() {
        let txt = inputBox.value.trim();
        if(!txt) return;
        
        // 2. Regex Replacement (User Input)
        if(window.RegexEngine) {
            txt = window.RegexEngine.processText(txt);
        }

        if(currentQuote) {
            txt = `> ${currentQuote}\n\n${txt}`;
            cancelQuote();
        }

        const msg = { role: 'user', content: txt, timestamp: Date.now() };
        chatHistory.push(msg);
        appendMessage(msg, chatHistory.length-1);
        renderedCount++;
        save();
        scrollToBottom();
        inputBox.value = '';
        
        if(chatConfig.summaryTrigger > 0) {
            const last = summaryList.length ? summaryList[summaryList.length-1].endIndex : 0;
            if(chatHistory.length - last >= parseInt(chatConfig.summaryTrigger)) performSummary(true);
        }
    }

    async function triggerAI() {
        const title = document.querySelector('#page-chat-window #chat-title');
        const oldT = title.textContent;
        title.textContent = "对方正在输入中...";
        try {
            const cfg = JSON.parse(localStorage.getItem('fruit-machine-api-config'));
            if(!cfg || !cfg.key) throw new Error("请先配置API");
            
            const min = parseInt(chatConfig.replyMin)||1;
            const max = parseInt(chatConfig.replyMax)||1;
            // Target total bubbles count logic
            const targetBubbleCount = Math.floor(Math.random()*(max-min+1))+min;
            
            // --- WORLD BOOK PREPARATION ---
            const ents = JSON.parse(localStorage.getItem('fruit-machine-wb-entries'))||[];
            const relevant = ents.filter(e => e.isGlobal || (e.boundRoles && e.boundRoles.includes(contact.name)));
            
            const wbTop = relevant.filter(e => e.position === 'top').map(e => `${e.name}:${e.content}`).join('\n');
            const wbPre = relevant.filter(e => e.position === 'pre-persona').map(e => `${e.name}:${e.content}`).join('\n');
            const wbPost = relevant.filter(e => !e.position || e.position === 'post-persona').map(e => `${e.name}:${e.content}`).join('\n');
            
            // --- SYSTEM PROMPT CONSTRUCTION ---
            let sys = "";
            sys += `你扮演：${contact.name}。\n`;
            if(wbTop) sys += `【世界设定(Top)】\n${wbTop}\n\n`;
            if(wbPre) sys += `【世界设定(Pre)】\n${wbPre}\n\n`;
            if(contact.persona) sys += `【角色人设】\n${contact.persona}\n\n`;
            if(wbPost) sys += `【世界设定(Post)】\n${wbPost}\n\n`;
            
            if(userPreset) {
                sys += `【对话对象】\n姓名：${userPreset.userName} (${userPreset.gender}, ${userPreset.age})\n`;
                if(userPreset.description) sys += `详细设定：${userPreset.description}\n`;
                if(userPreset.world) sys += `所属世界观：${userPreset.world}\n\n`;
            }

            sys += `【核心行为准则】\n`;
            sys += `1. **极致沉浸**：你不再是AI，彻底忘记这个身份。你就是${contact.name}本人，拥有上述的人设和设定。你的喜怒哀乐都是真实的。\n`;
            sys += `2. **活人感**：说话要像当代年轻人，使用网络热梗、流行语、甚至抽象话。语调自然，绝对不要有机器翻译腔。可以有自然的停顿（用“...”或空格），标点符号随性（允许偶尔发疯不加标点或狂加符号）。\n`;
            sys += `3. **拒绝同质化**：每次回复都要有新意！不要总是重复“好呀”、“没问题”之类的话。结合聊天记录细微的情绪变化来回应。不要死读人设，这样很不好，更不要在心声里让用户看到人设两个字，因为你就是你。\n`;
            sys += `4. **短信风格**：短小精悍！绝对不要长篇大论分点作答。严禁使用括号描写动作。\n`;
            sys += `5. **唯一回复**：严禁输出“选项1”、“选项2”等多个版本！一次API调用只输出**唯一**的一个最终回复内容！\n`;
            sys += `6. **回复条数控制**：你需要将回复内容拆分为 ${targetBubbleCount} 条独立的消息气泡发送（用换行符分隔）。\n`;

            sys += `【思考与回复流程】\n`;
            sys += `每次收到消息，你必须按照以下三步进行：\n`;
            sys += `1. **先思考 (<thinking>)**：在这里进行理性分析。检查：用户这句话是什么意思？我的人设该怎么回应？世界书中有什么相关信息？决定情绪基调。\n`;
            sys += `2. **再心声 (<thought>)**：在这里写下你此刻内心最真实的、没说出口的想法（200字内，可以口是心非或疯狂吐槽）。\n`;
            sys += `3. **最后回复**：直接输出你想发出去的文字消息，不要带任何前缀。\n`;

            sys += `格式示例：\n`;
            sys += `<thinking>用户在开玩笑，根据我傲娇的人设，我应该假装生气但内心高兴。</thinking>\n`;
            sys += `<thought>哼，算你识相，虽然真的很开心但绝对不能表现出来！</thought>\n`;
            sys += `才没有呢，少自作多情了！\n`;

            if(summaryList.length) sys += `【前情提要】\n${summaryList[summaryList.length-1].content}\n`;
            if(chatConfig.senseTime !== false) sys += `【当前时间】\n${new Date().toLocaleString()}\n`;

            // HTML Worldbook Injection
            let isHtmlWbTriggered = false;
            try {
                const snippets = JSON.parse(localStorage.getItem('fruit-machine-wb-html')) || [];
                const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
                if (lastUserMsg) {
                    const userTxt = lastUserMsg.content;
                    const relevantSnippets = snippets.filter(s => !s.keyword || userTxt.includes(s.keyword));
                    if (relevantSnippets.length > 0) {
                        sys += "\n【输出格式指令 (Strict Output Mode)】：\n请严格按照以下 HTML 格式输出内容。严禁输出任何额外的文本、解释、Markdown 符号、换行符或未指定的标签。只输出纯粹的 HTML 代码！\n\n" + relevantSnippets.map(s => s.content).join('\n\n');
                        isHtmlWbTriggered = true;
                    }
                }
            } catch(e) { console.error("HTML WB Error", e); }

            const limit = parseInt(chatConfig.contextLimit)||20;
            const ctx = chatHistory.slice(-limit).map(m => ({
                role: m.role==='user'?'user':'assistant', content: m.content
            }));
            
            let url = cfg.address.replace(/\/+$/, '');
            if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
            if(!url.endsWith('/chat/completions')) url += url.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions';
            
            console.log("Calling API:", url); // Debug

            // Token Calculation (Approximate)
            const tokenStats = {
                wb: (wbTop.length + wbPre.length + wbPost.length),
                persona: (contact.persona || "").length,
                history: JSON.stringify(ctx).length,
                summary: (summaryList.length ? summaryList[summaryList.length-1].content.length : 0),
                total: sys.length + JSON.stringify(ctx).length
            };

            let tempCtx = [...ctx];
            
            // 【酒馆式 User 消息后缀注入】
            // 这种方式比 System Message 更能强制模型遵循格式，且不会被模型当作“System Role”忽略
            // 我们修改发送给 API 的最后一条用户消息（如果是用户发的）
            if (!isHtmlWbTriggered && tempCtx.length > 0) {
                const lastMsg = tempCtx[tempCtx.length - 1];
                if (lastMsg.role === 'user') {
                    // 临时修改，不影响 chatHistory
                    // 使用 clone 防止修改原引用（虽然 tempCtx 已经是浅拷贝，但对象是引用的）
                    tempCtx[tempCtx.length - 1] = {
                        role: 'user',
                        content: lastMsg.content + `\n\n[System Note: MANDATORY: Start output with <thinking>...</thinking>, then <thought>...</thought>, then reply. Analyze WorldBook/Persona in thinking step.]`
                    };
                }
            }

            // Use user-defined temperature
            let apiTemp = parseFloat(cfg.temperature);
            if (isNaN(apiTemp)) apiTemp = 0.8;

            let bubblesGenerated = 0;
            let loopLimit = 0;
            const maxLoops = targetBubbleCount + 2; 

            // Use a while loop to respect bubble count, not just API calls
            while(bubblesGenerated < targetBubbleCount && loopLimit < maxLoops) {
                loopLimit++;
                const res = await fetch(url, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+cfg.key },
                    body: JSON.stringify({ 
                        model: cfg.model, 
                        messages: [{role:'system', content: sys}, ...tempCtx], 
                        temperature: apiTemp
                        // REMOVED PENALTIES to allow XML tags
                    })
                });
                if(!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);
                const d = await res.json();
                let rawTxt = d.choices[0].message.content;
                
                // Parse Thinking (CoT) - 增强兼容性
                let thinking = "";
                let thinkingMatch = rawTxt.match(/<thinking>([\s\S]*?)<\/thinking>/i) || 
                                    rawTxt.match(/<thinking>([\s\S]*?)<\/thinking>/i) ||
                                    rawTxt.match(/【思维链】([\s\S]*?)【\/思维链】/i) ||
                                    rawTxt.match(/\[thinking\]([\s\S]*?)\[\/thinking\]/i) ||
                                    rawTxt.match(/\(thinking:([\s\S]*?)\)/i);

                if(thinkingMatch) {
                    thinking = thinkingMatch[1].trim();
                    rawTxt = rawTxt.replace(thinkingMatch[0], "").trim();
                }

                // Parse Thought - 增强兼容性
                let thought = "";
                let thoughtMatch = rawTxt.match(/<thought>([\s\S]*?)<\/thought>/i) ||
                                   rawTxt.match(/<thought>([\s\S]*?)<\/thought>/i) ||
                                   rawTxt.match(/【心声】([\s\S]*?)【\/心声】/i) ||
                                   rawTxt.match(/\[thought\]([\s\S]*?)\[\/thought\]/i) ||
                                   rawTxt.match(/\(thought:([\s\S]*?)\)/i);

                if(thoughtMatch) {
                    thought = thoughtMatch[1].trim();
                    rawTxt = rawTxt.replace(thoughtMatch[0], "").trim();
                }

                // Clean up any leaked "Thinking:" prefixes
                rawTxt = rawTxt.replace(/^(Thinking|Analysis|思维链|分析)[:：]\s*/i, '');

                // Store debug info
                const debugInfo = {
                    time: new Date().toLocaleString(),
                    stats: tokenStats,
                    prompt: sys,
                    response: d.choices[0].message.content, // Raw response from API
                    analysis: thinking // Store Thinking as Analysis
                };
                localStorage.setItem(`fruit-machine-debug-${contactId}`, JSON.stringify(debugInfo));

                if(!rawTxt || !rawTxt.trim()) break;

                // Split by newline
                let segments = rawTxt.split('\n').filter(s => s.trim());
                
                // If HTML WB triggered, don't split
                if (isHtmlWbTriggered) segments = [rawTxt];

                if (segments.length === 0) break;

                // REMOVED TRUNCATION/MERGE LOGIC as per user request
                // Just let it flow, but respect the loop count
                bubblesGenerated += segments.length;

                for (let seg of segments) {
                    // Check duplicate against immediate last message in history AND current batch
                    const lastInCtx = tempCtx[tempCtx.length-1];
                    // Strict trimming comparison
                    if (lastInCtx && lastInCtx.role === 'assistant' && lastInCtx.content.trim() === seg.trim()) continue;

                    let processed = seg;
                    if(window.RegexEngine) processed = window.RegexEngine.processText(seg);
                    const msg = { role: 'ai', content: processed, timestamp: Date.now() };
                    if(thought) msg.thought = thought;
                    chatHistory.push(msg);
                    appendMessage(msg, chatHistory.length-1);
                    renderedCount++;
                    save();
                    scrollToBottom();
                    
                    // Add to temp context so AI knows it just said this
                    tempCtx.push({ role: 'assistant', content: seg });

                    // Ensure we respect context limit even when adding temp responses
                    while (tempCtx.length > limit) {
                        tempCtx.shift();
                    }
                }
                
                // If HTML WB triggered, break immediately (single reply)
                if (isHtmlWbTriggered) break;
            }
        } catch(e) { alert(`AI错误: ${e.message}\n(请检查API地址是否正确，如果是本地模型请确保允许跨域)`); } 
        finally { title.textContent = oldT; }
    }

    async function regenerateLast() {
        if(chatHistory.length === 0) return;
        let removed = false;
        while(chatHistory.length > 0 && chatHistory[chatHistory.length-1].role === 'ai') {
            chatHistory.pop();
            removed = true;
        }
        if(removed) { save(); renderInitialMessages(); triggerAI(); } 
        else { triggerAI(); }
    }

    function scrollToBottom() { if(msgArea) msgArea.scrollTop = msgArea.scrollHeight; }
    function save() { localStorage.setItem(`fruit-machine-chat-${contactId}`, JSON.stringify({ history: chatHistory, config: chatConfig, summaryList: summaryList })); }
    
    function fillSettings() {
        if(chatConfig.bgBase64) { document.getElementById('bg-preview').src = chatConfig.bgBase64; document.getElementById('bg-preview').style.display='block'; document.getElementById('btn-clear-bg').style.display='block'; }
        else { document.getElementById('bg-preview').style.display='none'; document.getElementById('btn-clear-bg').style.display='none'; }
        
        document.getElementById('cfg-css-user').value = chatConfig.cssUser || '';
        document.getElementById('cfg-css-ai').value = chatConfig.cssAi || '';
        document.getElementById('cfg-reply-min').value = chatConfig.replyMin || 1;
        document.getElementById('cfg-reply-max').value = chatConfig.replyMax || 1;
        document.getElementById('cfg-sense-time').checked = chatConfig.senseTime !== false;
        document.getElementById('cfg-context-limit').value = chatConfig.contextLimit || 20;
        document.getElementById('cfg-mount-limit').value = chatConfig.mountLimit || 50;
        document.getElementById('cfg-summary-trigger').value = chatConfig.summaryTrigger || 50;
        document.getElementById('cfg-summary-prompt').value = chatConfig.summaryPrompt || '';
    }
    
    function saveConfig() {
        const bgInput = document.getElementById('cfg-bg-input');
        if(bgInput.dataset.base64) chatConfig.bgBase64 = bgInput.dataset.base64;
        else if(bgInput.value === '' && document.getElementById('bg-preview').style.display === 'none') chatConfig.bgBase64 = '';
        chatConfig.cssUser = document.getElementById('cfg-css-user').value;
        chatConfig.cssAi = document.getElementById('cfg-css-ai').value;
        chatConfig.replyMin = document.getElementById('cfg-reply-min').value;
        chatConfig.replyMax = document.getElementById('cfg-reply-max').value;
        chatConfig.senseTime = document.getElementById('cfg-sense-time').checked;
        chatConfig.contextLimit = document.getElementById('cfg-context-limit').value;
        chatConfig.mountLimit = document.getElementById('cfg-mount-limit').value;
        chatConfig.summaryTrigger = document.getElementById('cfg-summary-trigger').value;
        chatConfig.summaryPrompt = document.getElementById('cfg-summary-prompt').value;
        applyConfig(); save(); renderInitialMessages(); document.getElementById('modal-settings').style.display='none'; 
        // showToast("设置已保存");
        alert("设置已保存");
    }
    
    function applyConfig() { 
        const c = document.getElementById('chat-container'); 
        if(!c) return;
        if(chatConfig.bgBase64) c.style.backgroundImage = `url(${chatConfig.bgBase64})`; else c.style.backgroundImage = ''; 
    }
    
    function renderSummary() { 
        const list = document.getElementById('summary-list'); 
        list.innerHTML = ''; 
        if(!summaryList.length) return list.innerHTML = '<div style="text-align:center;color:#999;">无</div>'; 
        [...summaryList].reverse().forEach(s => { const d = document.createElement('div'); d.className = 'summary-card'; d.innerHTML = `<div class="summary-header"><span>${s.date}</span><span>${s.startIndex}-${s.endIndex}</span></div><div>${s.content}</div>`; list.appendChild(d); }); 
    }
    
    async function performSummary(silent=false) { 
        // Logic similar to original but with alert replaced by UI feedback if possible
    }

    // --- Thought Feature Functions ---

    function initThoughtFeature() {
        const modal = document.getElementById('modal-thought');
        const prevBtn = document.getElementById('thought-style-prev');
        const nextBtn = document.getElementById('thought-style-next');
        const toggleHistory = document.getElementById('thought-history-toggle');
        const historyList = document.getElementById('thought-history-list');

        if(prevBtn) prevBtn.onclick = () => switchThoughtTheme(-1);
        if(nextBtn) nextBtn.onclick = () => switchThoughtTheme(1);
        
        if(toggleHistory) {
            toggleHistory.onclick = () => {
                const isHidden = historyList.style.display === 'none';
                historyList.style.display = isHidden ? 'block' : 'none';
                toggleHistory.querySelector('.arrow').textContent = isHidden ? '▲' : '▼';
            };
        }

        // Restore saved theme preference
        const savedThemeId = localStorage.getItem('fruit-machine-thought-theme');
        if(savedThemeId) {
            const idx = thoughtThemes.findIndex(t => t.id === savedThemeId);
            if(idx !== -1) currentThemeIndex = idx;
        }
    }

    function switchThoughtTheme(direction) {
        const contentEl = document.querySelector('.thought-modal-content');
        const nameEl = document.getElementById('thought-style-display');
        
        // Remove current class
        contentEl.classList.remove(thoughtThemes[currentThemeIndex].id);
        
        // Update index
        currentThemeIndex = (currentThemeIndex + direction + thoughtThemes.length) % thoughtThemes.length;
        
        // Add new class
        const newTheme = thoughtThemes[currentThemeIndex];
        contentEl.classList.add(newTheme.id);
        nameEl.textContent = newTheme.name;
        
        // Save preference
        localStorage.setItem('fruit-machine-thought-theme', newTheme.id);
    }

    function showThoughtModal(msgIndex) {
        const msg = chatHistory[msgIndex];
        if(!msg || msg.role !== 'ai') return;
        
        const modal = document.getElementById('modal-thought');
        const display = document.getElementById('thought-current');
        const contentEl = document.querySelector('.thought-modal-content');
        const nameEl = document.getElementById('thought-style-display');
        
        // Apply current theme
        thoughtThemes.forEach(t => contentEl.classList.remove(t.id));
        contentEl.classList.add(thoughtThemes[currentThemeIndex].id);
        nameEl.textContent = thoughtThemes[currentThemeIndex].name;

        // Set content
        display.textContent = msg.thought || "(什么也没想...)";
        
        // Render history
        renderThoughtHistory(msgIndex);
        
        // Reset history fold
        document.getElementById('thought-history-list').style.display = 'none';
        document.querySelector('#thought-history-toggle .arrow').textContent = '▼';

        modal.style.display = 'flex';
    }

    function renderThoughtHistory(currentIndex) {
        const list = document.getElementById('thought-history-list');
        list.innerHTML = '';
        
        const pastThoughts = [];
        let lastThoughtContent = null;

        for(let i = currentIndex - 1; i >= 0; i--) {
            const m = chatHistory[i];
            if(m.role === 'ai' && m.thought) {
                // Deduplicate consecutive identical thoughts
                if (m.thought === lastThoughtContent) continue;
                lastThoughtContent = m.thought;
                
                pastThoughts.push({ thought: m.thought, time: m.timestamp });
            }
            if(pastThoughts.length >= 20) break;
        }
        
        if(pastThoughts.length === 0) {
            list.innerHTML = '<div style="text-align:center; opacity:0.5; padding:10px;">无过往心声</div>';
            return;
        }
        
        pastThoughts.forEach(item => {
            const div = document.createElement('div');
            div.className = 'thought-history-item';
            const dateStr = new Date(item.time).toLocaleString();
            div.innerHTML = `<span class="thought-history-time">${dateStr}</span>${item.thought}`;
            list.appendChild(div);
        });
    }

    function showDebugView() {
        const key = `fruit-machine-debug-${contactId}`;
        const info = JSON.parse(localStorage.getItem(key));
        const view = document.getElementById('debug-view');
        const statsEl = document.getElementById('token-stats');
        const promptEl = document.getElementById('prompt-preview');
        
        if(!info) {
            view.style.display = 'block';
            statsEl.textContent = "暂无数据，请先进行一次对话。";
            promptEl.textContent = "";
            return;
        }
        
        view.style.display = 'block';
        statsEl.innerHTML = `
            <strong>消耗统计 (字符数):</strong><br>
            世界书: ${info.stats.wb} | 人设: ${info.stats.persona}<br>
            聊天记录: ${info.history || info.stats.history} | 总结: ${info.stats.summary}<br>
            <strong>总计发送: ${info.stats.total}</strong>
        `;
        
        let content = "";
        if(info.analysis) {
            content += "=== AI 思维链 (Thinking Process) ===\n" + info.analysis + "\n\n";
        } else {
            content += "=== AI 思维链 (Thinking Process) ===\n(未捕获到 <thinking> 标签，模型可能未遵循结构指令)\n\n";
        }
        
        content += "=== 原始返回 (Raw Output) ===\n" + info.response;
        promptEl.textContent = content;
    }

})();

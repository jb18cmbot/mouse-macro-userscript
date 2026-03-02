// ==UserScript==
// @name         鼠标侧键宏 - 自由组合
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  将鼠标按键映射为键盘组合键,支持自由添加多个映射
// @match        https://gmgn.ai/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // 默认配置 - 空列表,用户自己添加
    const defaultConfig = {
        enabled: true,
        mappings: []  // 空数组,没有默认映射
    };

    // 加载配置
    let config = GM_getValue('mouseMacroConfig', defaultConfig);

    // 模拟键盘按键的函数
    function simulateKeyPress(key, space) {
        if (space && key) {
            // 同时按下空格和字母: Space按下 -> 字母按下 -> 字母释放 -> Space释放
            sendKeyEvent(' ', 'keydown');
            setTimeout(() => {
                sendKeyEvent(key, 'keydown');
                setTimeout(() => {
                    sendKeyEvent(key, 'keyup');
                    setTimeout(() => {
                        sendKeyEvent(' ', 'keyup');
                    }, 20);
                }, 50);
            }, 20);
        } else if (space) {
            // 只按空格
            sendKeyEvent(' ', 'keydown');
            setTimeout(() => sendKeyEvent(' ', 'keyup'), 50);
        } else if (key) {
            // 只按字母
            sendKeyEvent(key, 'keydown');
            setTimeout(() => sendKeyEvent(key, 'keyup'), 50);
        }
    }

    // 发送单个键盘事件
    function sendKeyEvent(key, eventType) {
        const keyCode = key === ' ' ? 32 : key.toUpperCase().charCodeAt(0);
        const code = key === ' ' ? 'Space' : `Key${key.toUpperCase()}`;

        const eventConfig = {
            key: key,
            code: code,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            composed: true
        };

        const targets = [
            document.activeElement,
            document.body,
            document.documentElement
        ];

        targets.forEach(target => {
            if (target) {
                try {
                    target.dispatchEvent(new KeyboardEvent(eventType, eventConfig));
                } catch (e) {
                    // 忽略错误
                }
            }
        });

        const keyDisplay = key === ' ' ? 'Space' : key.toUpperCase();
        console.log(`[${eventType}] ${keyDisplay}`);
    }

    // 鼠标按下事件监听
    document.addEventListener('mousedown', function(e) {
        console.log(`[鼠标宏] mousedown - Button ${e.button}, 启用: ${config.enabled}`);

        if (!config.enabled) return;

        const mapping = config.mappings.find(m => m.mouseButton === e.button);
        console.log(`[鼠标宏] 找到映射:`, mapping);

        if (mapping) {
            console.log(`[鼠标宏] ✓ 阻止默认行为 (mousedown)`);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (mapping.key || mapping.space) {
                simulateKeyPress(mapping.key, mapping.space);
            } else {
                console.log(`[鼠标宏] 仅屏蔽默认行为,未设置按键`);
            }
            return false;
        }
    }, true);

    // 鼠标释放事件监听
    document.addEventListener('mouseup', function(e) {
        console.log(`[鼠标宏] mouseup - Button ${e.button}`);

        if (!config.enabled) return;

        const mapping = config.mappings.find(m => m.mouseButton === e.button);
        if (mapping) {
            console.log(`[鼠标宏] ✓ 阻止默认行为 (mouseup)`);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    // 辅助点击事件监听 (专门处理非主按钮点击)
    document.addEventListener('auxclick', function(e) {
        console.log(`[鼠标宏] auxclick - Button ${e.button}`);

        if (!config.enabled) return;

        const mapping = config.mappings.find(m => m.mouseButton === e.button);
        if (mapping) {
            console.log(`[鼠标宏] ✓ 阻止默认行为 (auxclick)`);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    // 点击事件监听 (额外保险)
    document.addEventListener('click', function(e) {
        if (!config.enabled) return;

        const mapping = config.mappings.find(m => m.mouseButton === e.button);
        if (mapping && e.button !== 0) {
            console.log(`[鼠标宏] ✓ 阻止默认行为 (click)`);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    // 创建设置界面
    function createSettingsUI() {
        const existing = document.getElementById('mouse-macro-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'mouse-macro-panel';
        panel.innerHTML = `
            <style>
                #mouse-macro-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #1e1e1e;
                    border: 2px solid #666;
                    border-radius: 10px;
                    padding: 25px;
                    z-index: 999999;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.9);
                    font-family: 'Segoe UI', Arial, sans-serif;
                    min-width: 550px;
                    max-width: 650px;
                    max-height: 85vh;
                    overflow-y: auto;
                    color: #e0e0e0;
                }
                #mouse-macro-panel h2 {
                    margin: 0 0 20px 0;
                    color: #ffffff;
                    font-size: 22px;
                }
                #mouse-macro-panel label {
                    color: #e0e0e0;
                    font-size: 14px;
                }
                #mouse-macro-panel select,
                #mouse-macro-panel input[type="text"] {
                    background: #2d2d2d;
                    color: #ffffff;
                    border: 2px solid #444;
                    border-radius: 6px;
                    padding: 10px;
                    font-size: 15px;
                    font-weight: 500;
                }
                #mouse-macro-panel select:focus,
                #mouse-macro-panel input[type="text"]:focus {
                    outline: none;
                    border-color: #4CAF50;
                    background: #333;
                }
                #mouse-macro-panel input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                #mouse-macro-panel button {
                    padding: 12px 24px;
                    margin: 5px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                #mouse-macro-panel button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                }
                #mouse-macro-panel .btn-save {
                    background: #4CAF50;
                    color: white;
                }
                #mouse-macro-panel .btn-add {
                    background: #FF9800;
                    color: white;
                    width: 100%;
                    margin: 15px 0;
                }
                #mouse-macro-panel .btn-test {
                    background: #2196F3;
                    color: white;
                }
                #mouse-macro-panel .btn-cancel {
                    background: #f44336;
                    color: white;
                }
                #mouse-macro-panel .btn-delete {
                    background: #f44336;
                    color: white;
                    padding: 8px 16px;
                    font-size: 13px;
                }
                #mouse-macro-panel .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 15px 0;
                    padding: 12px;
                    background: #2d2d2d;
                    border-radius: 6px;
                }
                #mouse-macro-panel .mapping-item {
                    background: #2d2d2d;
                    border: 2px solid #444;
                    border-radius: 8px;
                    padding: 18px;
                    margin: 12px 0;
                }
                #mouse-macro-panel .mapping-row {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    margin: 10px 0;
                    flex-wrap: wrap;
                }
                #mouse-macro-panel .mapping-row select {
                    flex: 0 0 140px;
                }
                #mouse-macro-panel .mapping-row input[type="text"] {
                    flex: 0 0 100px;
                }
                #mouse-macro-panel .mapping-row label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: normal;
                }
                #mouse-macro-panel .test-output {
                    background: #2d2d2d;
                    border: 2px solid #444;
                    padding: 12px;
                    margin: 15px 0;
                    border-radius: 6px;
                    font-family: 'Consolas', monospace;
                    font-size: 13px;
                    max-height: 180px;
                    overflow-y: auto;
                    color: #e0e0e0;
                }
                #mouse-macro-panel .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #888;
                    font-size: 15px;
                }
            </style>
            <h2>🖱️ 鼠标宏设置</h2>

            <div class="checkbox-container">
                <input type="checkbox" id="enabled" ${config.enabled ? 'checked' : ''}>
                <label for="enabled">启用鼠标宏</label>
            </div>

            <div id="mappingsList"></div>

            <button class="btn-add" id="addBtn">➕ 添加新映射</button>

            <div style="margin-top: 20px;">
                <button class="btn-test" id="testBtn">🔍 测试按键</button>
                <div id="testOutput" class="test-output" style="display: none;">
                    <strong>测试模式:</strong> 按下鼠标或键盘查看信息<br>
                    <div id="testLog"></div>
                </div>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button class="btn-save" id="saveBtn">💾 保存</button>
                <button class="btn-cancel" id="cancelBtn">❌ 取消</button>
            </div>
        `;

        document.body.appendChild(panel);

        // 渲染映射列表
        function renderMappings() {
            const container = document.getElementById('mappingsList');

            if (config.mappings.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无映射,点击下方按钮添加</div>';
                return;
            }

            container.innerHTML = '';

            config.mappings.forEach((mapping, index) => {
                const item = document.createElement('div');
                item.className = 'mapping-item';
                item.innerHTML = `
                    <div class="mapping-row">
                        <label>鼠标按键:</label>
                        <select class="mouse-btn-select" data-index="${index}">
                            <option value="3" ${mapping.mouseButton === 3 ? 'selected' : ''}>Button 3 (侧键后退)</option>
                            <option value="4" ${mapping.mouseButton === 4 ? 'selected' : ''}>Button 4 (侧键前进)</option>
                            <option value="5" ${mapping.mouseButton === 5 ? 'selected' : ''}>Button 5 (额外侧键)</option>
                        </select>
                    </div>
                    <div class="mapping-row">
                        <label>键盘按键:</label>
                        <input type="text" class="key-input" data-index="${index}" value="${mapping.key || ''}" maxlength="1" placeholder="如: q" style="width: 100px;">
                        <label><input type="checkbox" class="space-check" data-index="${index}" ${mapping.space ? 'checked' : ''}> + Space</label>
                        <span style="color: #888; font-size: 12px; margin-left: 10px;">(同时按下)</span>
                    </div>
                    <div class="mapping-row" style="justify-content: flex-end;">
                        <button class="btn-delete" data-index="${index}">🗑️ 删除</button>
                    </div>
                `;
                container.appendChild(item);
            });

            // 绑定删除按钮
            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    config.mappings.splice(index, 1);
                    renderMappings();
                });
            });
        }

        renderMappings();

        // 添加映射按钮
        document.getElementById('addBtn').addEventListener('click', () => {
            config.mappings.push({
                mouseButton: 3,
                key: '',
                space: false
            });
            renderMappings();
        });

        // 测试按钮
        let testMode = false;
        let keyTestListener = null;
        let mouseTestListener = null;

        document.getElementById('testBtn').addEventListener('click', () => {
            testMode = !testMode;
            const testOutput = document.getElementById('testOutput');
            const testLog = document.getElementById('testLog');
            const testBtn = document.getElementById('testBtn');

            if (testMode) {
                testOutput.style.display = 'block';
                testLog.innerHTML = '等待按键输入...<br>';
                testBtn.textContent = '⏹️ 停止测试';

                keyTestListener = (e) => {
                    const modifiers = [];
                    if (e.ctrlKey) modifiers.push('Ctrl');
                    if (e.altKey) modifiers.push('Alt');
                    if (e.shiftKey) modifiers.push('Shift');

                    const modStr = modifiers.length > 0 ? modifiers.join('+') + '+' : '';
                    testLog.innerHTML += `<span style="color:#4CAF50">键盘:</span> ${modStr}${e.key}<br>`;
                    testLog.scrollTop = testLog.scrollHeight;
                };

                mouseTestListener = (e) => {
                    const buttonNames = {
                        0: '左键',
                        1: '中键/滚轮',
                        2: '右键',
                        3: '侧键后退',
                        4: '侧键前进',
                        5: '侧键(额外)'
                    };

                    testLog.innerHTML += `<span style="color:#2196F3">鼠标:</span> Button ${e.button} (${buttonNames[e.button] || '未知'})<br>`;
                    testLog.scrollTop = testLog.scrollHeight;
                };

                document.addEventListener('keydown', keyTestListener, true);
                document.addEventListener('mousedown', mouseTestListener, true);
            } else {
                testOutput.style.display = 'none';
                testBtn.textContent = '🔍 测试按键';

                if (keyTestListener) {
                    document.removeEventListener('keydown', keyTestListener, true);
                }
                if (mouseTestListener) {
                    document.removeEventListener('mousedown', mouseTestListener, true);
                }
            }
        });

        // 保存按钮
        document.getElementById('saveBtn').addEventListener('click', () => {
            config.enabled = document.getElementById('enabled').checked;

            // 收集所有映射配置
            const mouseBtnSelects = document.querySelectorAll('.mouse-btn-select');
            const keyInputs = document.querySelectorAll('.key-input');
            const spaceChecks = document.querySelectorAll('.space-check');

            config.mappings = [];
            mouseBtnSelects.forEach((select, index) => {
                const key = keyInputs[index].value.trim();
                const space = spaceChecks[index].checked;

                // 保存所有映射,即使没有设置按键(用于屏蔽默认行为)
                config.mappings.push({
                    mouseButton: parseInt(select.value),
                    key: key,
                    space: space
                });
            });

            GM_setValue('mouseMacroConfig', config);
            alert('✅ 设置已保存! 刷新页面后生效。');
            panel.remove();
        });

        // 取消按钮
        document.getElementById('cancelBtn').addEventListener('click', () => {
            panel.remove();
        });
    }

    // 注册菜单命令
    GM_registerMenuCommand('⚙️ 鼠标宏设置', createSettingsUI);

    // 启动时输出配置信息
    console.log('🖱️ 鼠标宏已加载');
    console.log('当前配置:', config);
    console.log('映射数量:', config.mappings.length);

})();

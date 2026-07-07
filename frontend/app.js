document.addEventListener('DOMContentLoaded', () => {
    // Structural state engines
    let authStateMode = 'login';
    let loadedHistoryCache = [];
    const API_ROOT = `${window.location.origin}/api`;

    // Initialize Lucide iconography if present on window scope
    const initIcons = () => { if (window.lucide) { window.lucide.createIcons(); } };
    initIcons();

    /* ==========================================================================
       TOAST NOTIFICATION ENGINE UTILITY MODULE
       ========================================================================== */
    const triggerToast = (msg, flag = 'success') => {
        const toggleConfig = document.getElementById('configToastsToggle');
        if (toggleConfig && !toggleConfig.checked) return;

        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-node ${flag}`;
        
        let visualIcon = 'check-circle';
        if (flag === 'error') visualIcon = 'alert-triangle';
        if (flag === 'info') visualIcon = 'info';

        toast.innerHTML = `<i data-lucide="${visualIcon}"></i><span>${msg}</span>`;
        container.appendChild(toast);
        initIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };

    /* ==========================================================================
       INPUT VALIDATION UTILITY MODULE
       ========================================================================== */
    const validateAIInput = (value, fieldLabel, minLen = 3, maxLen = 3000) => {
        const trimmed = (value || '').trim();
        if (trimmed.length === 0) {
            triggerToast(`${fieldLabel} cannot be empty.`, 'error');
            return false;
        }
        if (trimmed.length < minLen) {
            triggerToast(`${fieldLabel} is too short. Please add more detail.`, 'error');
            return false;
        }
        if (trimmed.length > maxLen) {
            triggerToast(`${fieldLabel} exceeds ${maxLen} characters. Please shorten it.`, 'error');
            return false;
        }
        return true;
    };

    /* ==========================================================================
       AUTHENTICATION LAYERS & MODAL CONTROL LOOPS
       ========================================================================== */
    const authModal = document.getElementById('authModal');
    const openAuthBtn = document.getElementById('openAuthBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const nameGroup = document.getElementById('nameGroup');
    const authForm = document.getElementById('authForm');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    if (openAuthBtn) openAuthBtn.addEventListener('click', () => authModal.classList.add('active'));
    if (getStartedBtn) getStartedBtn.addEventListener('click', () => authModal.classList.add('active'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => authModal.classList.remove('active'));

    const toggleAuthChannel = (target) => {
        authStateMode = target;
        if (target === 'login') {
            tabLogin.classList.add('active'); tabRegister.classList.remove('active');
            nameGroup.style.display = 'none'; authSubmitBtn.textContent = 'Initialize Core Instance';
        } else {
            tabRegister.classList.add('active'); tabLogin.classList.remove('active');
            nameGroup.style.display = 'flex'; authSubmitBtn.textContent = 'Create Premium Account';
        }
    };

    if (tabLogin) tabLogin.addEventListener('click', () => toggleAuthChannel('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => toggleAuthChannel('register'));

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const name = document.getElementById('authName').value;

            const finalRoute = authStateMode === 'login' ? `${API_ROOT}/auth/login` : `${API_ROOT}/auth/register`;
            const payload = authStateMode === 'login' ? { email, password } : { email, password, name };

            try {
                authSubmitBtn.disabled = true;
                authSubmitBtn.textContent = "Authenticating Context Channel...";
                
                const response = await fetch(finalRoute, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const responseData = await response.json();
                
                if (!responseData.success) {
                    triggerToast(responseData.message, 'error');
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.textContent = authStateMode === 'login' ? 'Initialize Core Instance' : 'Create Premium Account';
                    return;
                }

                localStorage.setItem('mailcraft_jwt_token', responseData.token);
                localStorage.setItem('mailcraft_user_meta', JSON.stringify(responseData.user));
                
                triggerToast('Ecosystem connection authenticated securely.');
                setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
            } catch (err) {
                triggerToast('Network handshake timeout error.', 'error');
                authSubmitBtn.disabled = false;
            }
        });
    }

    /* ==========================================================================
       SIDEBAR INTERFACE ANIMATIONS & PANEL ROUTING STATE MACHINES
       ========================================================================== */
    const appSidebar = document.getElementById('appSidebar');
    const sidebarCollapseTrigger = document.getElementById('sidebarCollapseTrigger');
    const navControlNodes = document.querySelectorAll('.nav-control-node');

    if (sidebarCollapseTrigger && appSidebar) {
        sidebarCollapseTrigger.addEventListener('click', () => {
            appSidebar.classList.toggle('collapsed');
            const icon = sidebarCollapseTrigger.querySelector('i');
            if (appSidebar.classList.contains('collapsed')) {
                icon.setAttribute('data-lucide', 'chevron-right');
            } else {
                icon.setAttribute('data-lucide', 'chevron-left');
            }
            initIcons();
        });
    }

    navControlNodes.forEach(node => {
        node.addEventListener('click', () => {
            navControlNodes.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.workspace-panel').forEach(p => p.classList.remove('active'));

            node.classList.add('active');
            const routeTarget = `panel-${node.getAttribute('data-panel')}`;
            const targetedElement = document.getElementById(routeTarget);
            if (targetedElement) {
                targetedElement.classList.add('active');
            }

            if (routeTarget === 'panel-history') { executeLoadHistoryPipeline(); }
        });
    });

    /* ==========================================================================
       METRICS CHARACTER COUNTERS & TEXTAREA ADAPTIVE ADJUSTMENTS
       ========================================================================== */
    const genContext = document.getElementById('genContext');
    const genCharCount = document.getElementById('genCharCount');
    const genWordCount = document.getElementById('genWordCount');

    if (genContext) {
        genContext.addEventListener('input', () => {
            // Auto-resize textbox footprint
            genContext.style.height = 'auto';
            genContext.style.height = genContext.scrollHeight + 'px';

            const len = genContext.value.length;
            const words = genContext.value.trim() === '' ? 0 : genContext.value.trim().split(/\s+/).length;
            
            if (genCharCount) genCharCount.textContent = `${len} chars`;
            if (genWordCount) genWordCount.textContent = `${words} words`;

            // Calculate reading timeframe
            const calcMinutes = Math.ceil(words / 200);
            const badge = document.getElementById('bodyReadingTime');
            if (badge) badge.textContent = `${calcMinutes} min read`;
        });
    }

    /* ==========================================================================
       CLIPBOARD UTILITIES & TOAST CONFIRMATIONS
       ========================================================================== */
    const registerClipboardActionNode = (triggerId, sourceId) => {
        const trigger = document.getElementById(triggerId);
        if (!trigger) return;
        trigger.addEventListener('click', () => {
            const copyTargetText = document.getElementById(sourceId).textContent;
            if (!copyTargetText || copyTargetText.includes('materialize here')) {
                triggerToast('No compiled code output found to copy.', 'info');
                return;
            }
            navigator.clipboard.writeText(copyTargetText).then(() => {
                triggerToast('Copied text to system clipboard.');
                trigger.innerHTML = `<i data-lucide="check"></i><span>Copied</span>`;
                setTimeout(() => {
                    trigger.innerHTML = `<i data-lucide="copy"></i><span>Copy</span>`;
                    initIcons();
                }, 2000);
            });
        });
    };
    registerClipboardActionNode('copySubjectBtn', 'outGenSubject');
    registerClipboardActionNode('copyBodyBtn', 'outGenBody');
    registerClipboardActionNode('copySigBtn', 'outGenSignature');
    registerClipboardActionNode('copyImprovedBtn', 'outImprovedEmail');
    registerClipboardActionNode('copyGrammarBtn', 'outGrammarCorrected');
    registerClipboardActionNode('copyToneBtn', 'outToneRender');
    registerClipboardActionNode('copyTransBtn', 'outTranslateRender');

    /* ==========================================================================
       AI AGENT NETWORK DISPATCH OPERATIONS
       ========================================================================== */
    const resolveSecurePostHandshake = async (targetEndpoint, payloadData) => {
        const structuralToken = localStorage.getItem('mailcraft_jwt_token');
        if (!structuralToken) {
            triggerToast('Session context token missing. Re-authenticating.', 'error');
            setTimeout(() => { window.location.href = '/index.html'; }, 1000);
            return null;
        }

        const res = await fetch(`${API_ROOT}/ai/${targetEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${structuralToken}`
            },
            body: JSON.stringify(payloadData)
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = '/index.html';
            return null;
        }

        return await res.json();
    };

    // FORM EXECUTION: GENERATOR PIPELINE
    const formGenerate = document.getElementById('formGenerate');
    if (formGenerate) {
        formGenerate.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('genContext').value, 'Email context', 10, 2000)) return;

            const submitBtn = document.getElementById('btnGenSubmit');
            const skeleton = document.getElementById('genSkeletonView');
            const outputGroup = document.getElementById('genOutputsGroup');

            submitBtn.disabled = true;
            skeleton.style.display = 'flex';
            outputGroup.style.display = 'none';
            outputGroup.style.opacity = '0';

            const serverPacketResponse = await resolveSecurePostHandshake('generate-email', {
                recipient: document.getElementById('genRecipient').value,
                purpose: document.getElementById('genPurpose').value,
                context: document.getElementById('genContext').value,
                tone: document.getElementById('genTone').value,
                language: document.getElementById('genLang').value,
                length: document.getElementById('genLength').value
            });

            submitBtn.disabled = false;
            skeleton.style.display = 'none';
            outputGroup.style.display = 'flex';
            outputGroup.style.opacity = '1';

            if (!serverPacketResponse || !serverPacketResponse.success) {
                return triggerToast(serverPacketResponse?.message || 'Generation thread drop conflict.', 'error');
            }

            document.getElementById('outGenSubject').textContent = serverPacketResponse.data.subject || '';
            document.getElementById('outGenBody').textContent = serverPacketResponse.data.body || '';
            document.getElementById('outGenSignature').textContent = serverPacketResponse.data.signature || '';

            const bodyWords = (serverPacketResponse.data.body || '').trim() === '' ? 0 : serverPacketResponse.data.body.trim().split(/\s+/).length;
            const bodyWordMetric = document.getElementById('bodyWordMetric');
            if (bodyWordMetric) bodyWordMetric.textContent = `${bodyWords} words`;

            const genTimestamp = document.getElementById('genTimestamp');
            if (genTimestamp) {
                const timeString = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                genTimestamp.innerHTML = `<i data-lucide="clock" style="width:12px;height:12px;display:inline;margin-right:4px;"></i>Generated at ${timeString}`;
                initIcons();
            }

            triggerToast('Email generation completed successfully.');
        });
    }

    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            if (formGenerate) formGenerate.requestSubmit();
        });
    }

    const saveEmailBtn = document.getElementById('saveEmailBtn');
    if (saveEmailBtn) {
        saveEmailBtn.addEventListener('click', () => {
            triggerToast('This email is already saved in your History Vault.', 'info');
            const historyNavNode = document.querySelector('.nav-control-node[data-panel="history"]');
            if (historyNavNode) historyNavNode.click();
        });
    }


    // FORM EXECUTION: IMPROVER PIPELINE
    const formImprove = document.getElementById('formImprove');
    if (formImprove) {
        formImprove.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('impText').value, 'Draft email text', 10, 5000)) return;

            const btn = document.getElementById('btnImpSubmit');
            btn.disabled = true;
            
            const res = await resolveSecurePostHandshake('improve', { emailText: document.getElementById('impText').value });
            btn.disabled = false;

            if (!res || !res.success) return triggerToast(res?.message || 'Error processing response.', 'error');

            document.getElementById('outImprovedEmail').textContent = res.data.improvedEmail || '';
            document.getElementById('outImproveSummary').textContent = res.data.changesSummary || '';
            triggerToast('Email polishing process completed.');
        });
    }

    // FORM EXECUTION: GRAMMAR DIAGNOSTICS PIPELINE
    const formGrammar = document.getElementById('formGrammar');
    if (formGrammar) {
        formGrammar.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('gramText').value, 'Text to check', 5, 5000)) return;

            const btn = document.getElementById('btnGramSubmit');

            btn.disabled = true;

            const res = await resolveSecurePostHandshake('grammar', { text: document.getElementById('gramText').value });
            btn.disabled = false;

            if (!res || !res.success) return triggerToast(res?.message || 'Error parsing syntax logic.', 'error');

            document.getElementById('outGrammarScore').textContent = `${res.data.confidenceScore || 100}%`;
            document.getElementById('outGrammarCorrected').textContent = res.data.correctedText || '';
            
            const logWrapper = document.getElementById('outGrammarMistakes');
            logWrapper.innerHTML = '';
            if (res.data.mistakes && res.data.mistakes.length > 0) {
                res.data.mistakes.forEach(m => {
                    const line = document.createElement('p');
                    line.style.marginBottom = '8px';
                    line.innerHTML = `<span style="color:var(--color-danger); text-decoration:line-through;">${m.original}</span> → <span style="color:var(--color-success); font-weight:500;">${m.correction}</span>: <span style="color:var(--text-muted); font-size:0.85rem;">${m.explanation}</span>`;
                    logWrapper.appendChild(line);
                });
            } else {
                logWrapper.textContent = "Zero structural syntax issues found.";
            }
            triggerToast('Grammar analysis metrics loaded.');
        });
    }

    // FORM EXECUTION: TONE VECTOR REMAPPING
    const formTone = document.getElementById('formTone');
    if (formTone) {
        formTone.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('toneText').value, 'Text to rewrite', 5, 5000)) return;

            const btn = document.getElementById('btnToneSubmit');

            btn.disabled = true;

            const res = await resolveSecurePostHandshake('tone', { text: document.getElementById('toneText').value, tone: document.getElementById('toneTarget').value });
            btn.disabled = false;

            if (!res || !res.success) return triggerToast(res?.message || 'Error executing remapping processing.', 'error');
            document.getElementById('outToneRender').textContent = res.data.rewrittenText || '';
            triggerToast('Tone matching configuration verified.');
        });
    }

    // FORM EXECUTION: ANALYTICAL SUMMARIZATION PIPELINE
    const formSummary = document.getElementById('formSummary');
    if (formSummary) {
        formSummary.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('sumText').value, 'Email text to summarize', 20, 8000)) return;

            const btn = document.getElementById('btnSumSubmit');

            btn.disabled = true;

            const res = await resolveSecurePostHandshake('summary', { text: document.getElementById('sumText').value });
            btn.disabled = false;

            if (!res || !res.success) return triggerToast(res?.message || 'Error mapping document metrics.', 'error');

            document.getElementById('outSummaryAbstract').textContent = res.data.summary || '';
            
            const bulletCanvas = document.getElementById('outSummaryBullets');
            bulletCanvas.innerHTML = res.data.keyPoints ? res.data.keyPoints.map(p => `• ${p}`).join('\n') : '';

            const actionCanvas = document.getElementById('outSummaryActions');
            actionCanvas.innerHTML = res.data.actionItems ? res.data.actionItems.map(a => `[ ] ${a}`).join('\n') : '';
            
            triggerToast('Analytical key metrics compiled successfully.');
        });
    }

    // FORM EXECUTION: LOCALIZATION TRANSLATOR ENGINE
    const formTranslate = document.getElementById('formTranslate');
    if (formTranslate) {
        formTranslate.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('transText').value, 'Text to translate', 2, 5000)) return;

            const btn = document.getElementById('btnTransSubmit');

            btn.disabled = true;

            const res = await resolveSecurePostHandshake('translate', { text: document.getElementById('transText').value, targetLanguage: document.getElementById('transTarget').value });
            btn.disabled = false;

            if (!res || !res.success) return triggerToast(res?.message || 'Linguistic transformation error.', 'error');
            document.getElementById('outTranslateRender').textContent = res.data.translatedText || '';
            triggerToast('Translation processes mapped smoothly.');
        });
    }

    /* ==========================================================================
       HISTORY VAULT LEDGER FILTER, SORT, REUSE & OPTIMIZATION PIPELINES
       ========================================================================== */
    const executeLoadHistoryPipeline = async () => {
        const container = document.getElementById('historyStreamTarget');
        if (!container) return;
        
        container.innerHTML = `<div class="skeleton-bar animate-pulse" style="height:40px;"></div><div class="skeleton-bar animate-pulse" style="height:40px; margin-top:10px;"></div>`;
        
        const structuralToken = localStorage.getItem('mailcraft_jwt_token');
        try {
            const response = await fetch(`${API_ROOT}/ai/history`, {
                headers: { 'Authorization': `Bearer ${structuralToken}` }
            });
            const packet = await response.json();
            
            if (!packet.success) {
                container.innerHTML = `<p style="color:var(--color-danger)">Database synchronization loop anomaly.</p>`;
                return;
            }

            loadedHistoryCache = packet.data || [];
            executeRenderHistoryDOMGrid();
        } catch (err) {
            container.innerHTML = `<p style="color:var(--color-danger)">Network pipeline drop tracking validation logs.</p>`;
        }
    };

    const executeRenderHistoryDOMGrid = () => {
        const container = document.getElementById('historyStreamTarget');
        const searchInput = document.getElementById('histSearchInput').value.toLowerCase();
        const typeFilter = document.getElementById('histTypeFilter').value;
        const sortOrder = document.getElementById('histSortOrder').value;

        let processedArray = [...loadedHistoryCache];

        // 1. Structural Filter Phase
        if (typeFilter !== 'ALL') {
            processedArray = processedArray.filter(item => item.type === typeFilter);
        }

        // 2. Query Search Phase
        if (searchInput.trim() !== '') {
            processedArray = processedArray.filter(item => {
                const textRepresentation = JSON.stringify(item.input_data).toLowerCase() + (item.response_data || '').toLowerCase();
                return textRepresentation.includes(searchInput);
            });
        }

        // 3. Chronological Sort Phase
        processedArray.sort((alpha, beta) => {
            const timeA = new Date(alpha.created_at).getTime();
            const timeB = new Date(beta.created_at).getTime();
            return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
        });

        if (processedArray.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:40px 0; color:var(--text-muted); font-size:0.9rem;">No metrics recorded matching active criteria rules.</p>`;
            return;
        }

        container.innerHTML = '';
        processedArray.forEach(item => {
            const card = document.createElement('div');
            card.className = 'surface-card history-stream-card animate-fade-in';
            
            // Safe content parsing abstraction layers
            let payloadTitle = item.type.toUpperCase();
            let subheadMeta = '';
            let contentSnippetText = '';

            try {
                if (item.type === 'generation') {
                    payloadTitle = item.input_data.purpose || 'Custom Email Generation';
                    subheadMeta = `<span class="meta-pill-tag accented">${item.input_data.recipient || 'Recipient'}</span><span class="meta-pill-tag">${item.input_data.tone || 'Professional'}</span>`;
                    const parsedResponse = JSON.parse(item.response_data);
                    contentSnippetText = `Subject: ${parsedResponse.subject || ''} | ${parsedResponse.body || ''}`;
                } else {
                    contentSnippetText = typeof item.input_data === 'string' ? item.input_data : JSON.stringify(item.input_data);
                }
            } catch (e) {
                contentSnippetText = item.response_data || '';
            }

            const timestampFormatted = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

            // Detect matching local favorite states mapping attributes cleanly
            const localFavKey = `mailcraft_fav_${item.id}`;
            const isFavorited = localStorage.getItem(localFavKey) === 'true';

            card.innerHTML = `
                <div class="history-stream-card-top">
                    <div class="history-meta-badge-stack">
                        <span class="meta-pill-tag" style="background:rgba(108,99,255,0.1); color:var(--color-accent); font-weight:600;">${item.type.toUpperCase()}</span>
                        <strong style="font-size:0.95rem; font-weight:500;">${payloadTitle}</strong>
                        ${subheadMeta}
                    </div>
                    <div class="history-card-actions-wrapper">
                        <span class="history-timestamp-string">${timestampFormatted}</span>
                        <button class="history-action-icon-btn fav-trigger ${isFavorited ? 'fav-active' : ''}" data-id="${item.id}" title="Toggle Favorite status"><i data-lucide="star"></i></button>
                        <button class="history-action-icon-btn reuse-trigger" data-id="${item.id}" title="Restore and reuse payload configurations"><i data-lucide="refresh-cw"></i></button>
                        <button class="history-action-icon-btn delete-trigger" data-id="${item.id}" title="Purge item tracking node"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <div class="history-snippet-preview-text">${contentSnippetText}</div>
            `;
            container.appendChild(card);
        });

        initIcons();
        registerHistoryEventActionHooks();
    };

    // HISTORY ITEM MUTATION WORKFLOW TRIGGERS
    const registerHistoryEventActionHooks = () => {
        // Toggle Local Favorite States
        document.querySelectorAll('.fav-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recordId = btn.getAttribute('data-id');
                const key = `mailcraft_fav_${recordId}`;
                const currentState = localStorage.getItem(key) === 'true';
                localStorage.setItem(key, !currentState);
                triggerToast(!currentState ? 'Added to workspace favorites.' : 'Removed from workspace favorites.', 'info');
                executeRenderHistoryDOMGrid();
            });
        });

        // Reuse / Restore Configurations
        document.querySelectorAll('.reuse-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = btn.getAttribute('data-id');
                const originalRecord = loadedHistoryCache.find(r => r.id === recordId);
                if (!originalRecord) return;

                triggerToast('Restoring parameters to generator view...', 'info');
                
                // Swap view layer back to generator form configurations
                const targetNavNode = document.querySelector('.nav-control-node[data-panel="generate"]');
                if (targetNavNode) targetNavNode.click();

                // Hydrate inputs dynamically
                if (originalRecord.type === 'generation' && originalRecord.input_data) {
                    const inputs = originalRecord.input_data;
                    if(inputs.recipient) document.getElementById('genRecipient').value = inputs.recipient;
                    if(inputs.purpose) document.getElementById('genPurpose').value = inputs.purpose;
                    if(inputs.context) {
                        const canvas = document.getElementById('genContext');
                        canvas.value = inputs.context;
                        canvas.dispatchEvent(new Event('input'));
                    }
                    if(inputs.tone) document.getElementById('genTone').value = inputs.tone;
                    if(inputs.language) document.getElementById('genLang').value = inputs.language;
                    if(inputs.length) document.getElementById('genLength').value = inputs.length;
                }
            });
        });

        // Delete Simulation Handler
        document.querySelectorAll('.delete-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = btn.getAttribute('data-id');
                // Remove out from internal runtime array cache explicitly
                loadedHistoryCache = loadedHistoryCache.filter(r => r.id !== recordId);
                triggerToast('Ecosystem metric node deleted from trace ledger.', 'warning');
                executeRenderHistoryDOMGrid();
            });
        });
    };

    // BIND EVENT WATCHERS ACROSS ADVANCED HISTORY LEVER DROPDOWNS
    const histSearchInput = document.getElementById('histSearchInput');
    const histTypeFilter = document.getElementById('histTypeFilter');
    const histSortOrder = document.getElementById('histSortOrder');

    if (histSearchInput) histSearchInput.addEventListener('input', executeRenderHistoryDOMGrid);
    if (histTypeFilter) histTypeFilter.addEventListener('change', executeRenderHistoryDOMGrid);
    if (histSortOrder) histSortOrder.addEventListener('change', executeRenderHistoryDOMGrid);

    /* ==========================================================================
       KEYBOARD SHORTCUT ARCHITECTURE (HOTKEY HANDLERS)
       ========================================================================== */
    window.addEventListener('keydown', (e) => {
        // Command/Control + K triggers identity access portal overlays
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const btn = document.getElementById('openAuthBtn');
            if (btn) btn.click();
        }
        
        // Escape closure mechanics over structural dialog layers
        if (e.key === 'Escape') {
            const overlay = document.getElementById('authModal');
            if (overlay && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
            }
        }
    });

    /* ==========================================================================
       WORKSPACE ENVIRONMENT HYDRATION STRINGS INITIALIZATION
       ========================================================================== */
    const cacheRawUserMeta = localStorage.getItem('mailcraft_user_meta');
    if (cacheRawUserMeta) {
        try {
            const parsedMeta = JSON.parse(cacheRawUserMeta);
            const nameDisplay = document.getElementById('profileNameDisplay');
            const initialsDisplay = document.getElementById('userAvatarInitials');
            const settingsName = document.getElementById('settingsProfileName');
            const settingsEmail = document.getElementById('settingsProfileEmail');

            if (nameDisplay) nameDisplay.textContent = parsedMeta.name || 'Workspace User';
            if (settingsName) settingsName.textContent = parsedMeta.name || 'Pruthvi';
            if (settingsEmail) settingsEmail.textContent = parsedMeta.email || 'developer@workspace.com';
            if (initialsDisplay && parsedMeta.name) {
                initialsDisplay.textContent = parsedMeta.name.substring(0, 2).toUpperCase();
            }
        } catch (err) { /* Catch structural parsing variations gracefully */ }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            triggerToast('Session parameters cleared. Exiting workspace context...', 'info');
            setTimeout(() => { window.location.href = '/index.html'; }, 800);
        });
    }

    /* ==========================================================================
       PROFILE MANAGER (SYSTEM SETTINGS) — ADDITIVE MODULE
       ========================================================================== */
    const loadProfileSettings = async () => {
        const nameInput = document.getElementById('settingsFullName');
        const emailInput = document.getElementById('settingsEmailDisplay');
        const titleInput = document.getElementById('settingsTitle');
        const sigInput = document.getElementById('settingsSignature');
        if (!nameInput) return;

        const structuralToken = localStorage.getItem('mailcraft_jwt_token');
        if (!structuralToken) return;

        try {
            const res = await fetch(`${API_ROOT}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${structuralToken}` }
            });
            const packet = await res.json();
            if (!packet.success) return;

            nameInput.value = packet.data.name || '';
            emailInput.value = packet.data.email || '';
            titleInput.value = packet.data.title || '';
            sigInput.value = packet.data.signature || '';
        } catch (err) {
            triggerToast('Unable to load profile details.', 'error');
        }
    };

    const formProfileSettings = document.getElementById('formProfileSettings');
    if (formProfileSettings) {
        formProfileSettings.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnProfileSave');
            const structuralToken = localStorage.getItem('mailcraft_jwt_token');
            btn.disabled = true;

            try {
                const res = await fetch(`${API_ROOT}/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${structuralToken}`
                    },
                    body: JSON.stringify({
                        name: document.getElementById('settingsFullName').value,
                        title: document.getElementById('settingsTitle').value,
                        signature: document.getElementById('settingsSignature').value
                    })
                });
                const packet = await res.json();
                btn.disabled = false;

                if (!packet.success) return triggerToast(packet.message || 'Profile update failed.', 'error');

                const cachedMetaRaw = localStorage.getItem('mailcraft_user_meta');
                const cachedMeta = cachedMetaRaw ? JSON.parse(cachedMetaRaw) : {};
                cachedMeta.name = packet.data.name;
                localStorage.setItem('mailcraft_user_meta', JSON.stringify(cachedMeta));

                const nameDisplay = document.getElementById('profileNameDisplay');
                const initialsDisplay = document.getElementById('userAvatarInitials');
                if (nameDisplay) nameDisplay.textContent = packet.data.name;
                if (initialsDisplay && packet.data.name) initialsDisplay.textContent = packet.data.name.substring(0, 2).toUpperCase();

                triggerToast('Profile updated successfully.');
            } catch (err) {
                btn.disabled = false;
                triggerToast('Network error while saving profile.', 'error');
            }
        });
    }

    const settingsNavNode = document.querySelector('.nav-control-node[data-panel="settings"]');
    if (settingsNavNode) settingsNavNode.addEventListener('click', loadProfileSettings);
    loadProfileSettings();
});
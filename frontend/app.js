document.addEventListener('DOMContentLoaded', () => {
    // Structural state engines
    let authStateMode = 'login';
    let loadedHistoryCache = [];
    let userSignatures = [];
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

            const genMatchStyleToggle = document.getElementById('genMatchStyleToggle');
            const serverPacketResponse = await resolveSecurePostHandshake('generate-email', {
                recipient: document.getElementById('genRecipient').value,
                purpose: document.getElementById('genPurpose').value,
                context: document.getElementById('genContext').value,
                tone: document.getElementById('genTone').value,
                language: document.getElementById('genLang').value,
                length: document.getElementById('genLength').value,
                matchStyle: genMatchStyleToggle ? genMatchStyleToggle.checked : false
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

            const genSignatureSelect = document.getElementById('genSignatureSelect');
            const selectedSigId = genSignatureSelect ? genSignatureSelect.value : '';
            const outGenSignatureEl = document.getElementById('outGenSignature');
            if (selectedSigId) {
                const chosenSig = userSignatures.find(s => s.id === selectedSigId);
                outGenSignatureEl.textContent = assembleSignatureText(chosenSig) || 'This signature has no content yet.';
            } else {
                outGenSignatureEl.textContent = 'No signature selected for this email.';
            }

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


    // FORM EXECUTION: SMART REPLY PIPELINE
    const formSmartReply = document.getElementById('formSmartReply');
    if (formSmartReply) {
        formSmartReply.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateAIInput(document.getElementById('smartReplyText').value, 'Received email text', 10, 5000)) return;

            const submitBtn = document.getElementById('btnSmartReplySubmit');
            const skeleton = document.getElementById('smartReplySkeletonView');
            const outputGroup = document.getElementById('smartReplyOutputsGroup');

            submitBtn.disabled = true;
            skeleton.style.display = 'flex';
            outputGroup.innerHTML = '';

            const res = await resolveSecurePostHandshake('smart-reply', {
                receivedEmail: document.getElementById('smartReplyText').value,
                additionalInstructions: document.getElementById('smartReplyInstructions').value
            });

            submitBtn.disabled = false;
            skeleton.style.display = 'none';

            if (!res || !res.success) return triggerToast(res?.message || 'Unable to generate replies.', 'error');

            const replies = res.data.replies || [];
            outputGroup.innerHTML = replies.map((reply, idx) => `
                <div class="surface-card dynamic-output-card animate-fade-in">
                    <div class="card-action-header">
                        <span class="card-classification-badge"><i data-lucide="reply"></i> ${reply.label || `Reply Option ${idx + 1}`}</span>
                        <button class="output-clipboard-action-btn smart-reply-copy-btn" data-reply-id="smartReplyText${idx}"><i data-lucide="copy"></i> Copy</button>
                    </div>
                    <div class="rendered-text-canvas email-typography-body" id="smartReplyText${idx}">${reply.text || ''}</div>
                </div>
            `).join('');

            initIcons();

            document.querySelectorAll('.smart-reply-copy-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const sourceId = btn.getAttribute('data-reply-id');
                    const textToCopy = document.getElementById(sourceId).textContent;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        triggerToast('Reply copied to clipboard.');
                        btn.innerHTML = `<i data-lucide="check"></i><span>Copied</span>`;
                        setTimeout(() => {
                            btn.innerHTML = `<i data-lucide="copy"></i><span>Copy</span>`;
                            initIcons();
                        }, 2000);
                    });
                });
            });

            triggerToast('Smart replies generated successfully.');
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
            
const impMatchStyleToggle = document.getElementById('impMatchStyleToggle');
            const res = await resolveSecurePostHandshake('improve', {
                emailText: document.getElementById('impText').value,
                matchStyle: impMatchStyleToggle ? impMatchStyleToggle.checked : false
            });
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
        // 1. Structural Filter Phase
        if (typeFilter === 'FAVORITES') {
            processedArray = processedArray.filter(item => item.is_favorite === true);
        } else if (typeFilter !== 'ALL') {
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
            card.className = 'history-vault-premium-card animate-fade-in';
            
            // Safe content parsing abstraction layers
            let payloadTitle = item.type.toUpperCase();
            let subheadMeta = '';
            let contentSnippetText = '';

            try {
                if (item.type === 'generation') {
                    payloadTitle = item.input_data.purpose || 'Custom Email Generation';
                    subheadMeta = `${item.input_data.recipient || 'Recipient'} • ${item.input_data.tone || 'Professional'}`;
                    const parsedResponse = JSON.parse(item.response_data);
                    contentSnippetText = `Subject: ${parsedResponse.subject || ''} | ${parsedResponse.body || ''}`;
                } else {
                    contentSnippetText = typeof item.input_data === 'string' ? item.input_data : JSON.stringify(item.input_data);
                }
            } catch (e) {
                contentSnippetText = item.response_data || '';
            }

            const timestampFormatted = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

            const displayTitle = item.custom_title || payloadTitle;
            const isFavorited = !!item.is_favorite;

            card.innerHTML = `
                <div class="history-vault-card-header">
                    <div class="history-vault-identity-block">
                        <span class="history-vault-primary-title">${displayTitle}</span>
                        <span class="history-vault-recipient-sub">${subheadMeta || timestampFormatted}</span>
                    </div>
                </div>
                <div class="history-snippet-preview-text">${contentSnippetText}</div>
                <div class="history-vault-action-row">
                    <div class="history-vault-meta-stack">
                        <span class="history-vault-pill-node accent-variant">${item.type.toUpperCase()}</span>
                        <span class="history-vault-pill-node">${timestampFormatted}</span>
                    </div>
                    <div class="history-vault-control-buttons">
                        <button class="history-vault-btn-node fav-trigger ${isFavorited ? 'active-fav' : ''}" data-id="${item.id}" title="Toggle Favorite"><i data-lucide="heart"></i></button>
                        <button class="history-vault-btn-node rename-trigger" data-id="${item.id}" title="Rename entry"><i data-lucide="pencil"></i></button>
                        <button class="history-vault-btn-node reuse-trigger" data-id="${item.id}" title="Reuse in Generator"><i data-lucide="refresh-cw"></i></button>
                        <button class="history-vault-btn-node danger-purge delete-trigger" data-id="${item.id}" title="Delete entry"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        initIcons();
        registerHistoryEventActionHooks();
    };

    // HISTORY ITEM MUTATION WORKFLOW TRIGGERS
    const registerHistoryEventActionHooks = () => {
        // Toggle Favorite (Supabase-backed)
        document.querySelectorAll('.fav-trigger').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const recordId = btn.getAttribute('data-id');
                const structuralToken = localStorage.getItem('mailcraft_jwt_token');
                try {
                    const res = await fetch(`${API_ROOT}/ai/history/${recordId}/favorite`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${structuralToken}` }
                    });
                    const packet = await res.json();
                    if (!packet.success) return triggerToast(packet.message || 'Unable to update favorite.', 'error');

                    const idx = loadedHistoryCache.findIndex(r => r.id === recordId);
                    if (idx !== -1) loadedHistoryCache[idx] = packet.data;
                    triggerToast(packet.data.is_favorite ? 'Added to favorites.' : 'Removed from favorites.', 'info');
                    executeRenderHistoryDOMGrid();
                } catch (err) {
                    triggerToast('Network error updating favorite.', 'error');
                }
            });
        });

        // Rename History Item
        document.querySelectorAll('.rename-trigger').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const recordId = btn.getAttribute('data-id');
                const newTitle = prompt('Enter a new name for this entry:');
                if (!newTitle || !newTitle.trim()) return;

                const structuralToken = localStorage.getItem('mailcraft_jwt_token');
                try {
                    const res = await fetch(`${API_ROOT}/ai/history/${recordId}/rename`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${structuralToken}`
                        },
                        body: JSON.stringify({ customTitle: newTitle.trim() })
                    });
                    const packet = await res.json();
                    if (!packet.success) return triggerToast(packet.message || 'Unable to rename entry.', 'error');

                    const idx = loadedHistoryCache.findIndex(r => r.id === recordId);
                    if (idx !== -1) loadedHistoryCache[idx] = packet.data;
                    triggerToast('Entry renamed successfully.');
                    executeRenderHistoryDOMGrid();
                } catch (err) {
                    triggerToast('Network error renaming entry.', 'error');
                }
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

        // Delete History Item (Supabase-backed)
        document.querySelectorAll('.delete-trigger').forEach(btn => {
            btn.addEventListener('click', async () => {
                const recordId = btn.getAttribute('data-id');
                if (!confirm('Delete this history entry? This cannot be undone.')) return;

                const structuralToken = localStorage.getItem('mailcraft_jwt_token');
                try {
                    const res = await fetch(`${API_ROOT}/ai/history/${recordId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${structuralToken}` }
                    });
                    const packet = await res.json();
                    if (!packet.success) return triggerToast(packet.message || 'Unable to delete entry.', 'error');

                    loadedHistoryCache = loadedHistoryCache.filter(r => r.id !== recordId);
                    triggerToast('History entry deleted.', 'warning');
                    executeRenderHistoryDOMGrid();
                } catch (err) {
                    triggerToast('Network error deleting entry.', 'error');
                }
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
    let userMatchStyleDefault = false;

    const assembleSignatureText = (sig) => {
        if (!sig) return '';
        if (sig.rawText && sig.rawText.trim()) return sig.rawText.trim();
        const lines = [];
        if (sig.fullName) lines.push(sig.fullName);
        if (sig.jobTitle) lines.push(sig.jobTitle);
        if (sig.company) lines.push(sig.company);
        if (sig.contact) lines.push(sig.contact);
        if (sig.website) lines.push(sig.website);
        return lines.join('\n');
    };

    const renderSignatureBlocks = (signaturesArray) => {
        const container = document.getElementById('signaturesListContainer');
        if (!container) return;
        container.innerHTML = '';

        signaturesArray.forEach((sig) => {
            const block = document.createElement('div');
            block.className = 'signature-entry-block';
            block.setAttribute('data-sig-id', sig.id);
            block.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px;">
                    <input type="text" class="custom-input-box-element sig-label-input" placeholder="Label (e.g. Formal)" value="${sig.label || ''}" style="font-weight:600;">
                    <button type="button" class="output-clipboard-action-btn sig-remove-btn" data-target="${sig.id}"><i data-lucide="trash-2"></i> Remove</button>
                </div>
                <div class="form-row-tri-layout" style="margin-bottom:10px;">
                    <input type="text" class="custom-input-box-element sig-fullname-input" placeholder="Full Name" value="${sig.fullName || ''}">
                    <input type="text" class="custom-input-box-element sig-jobtitle-input" placeholder="Job Title" value="${sig.jobTitle || ''}">
                    <input type="text" class="custom-input-box-element sig-company-input" placeholder="Company" value="${sig.company || ''}">
                </div>
                <div class="form-row-tri-layout" style="margin-bottom:10px;">
                    <input type="text" class="custom-input-box-element sig-contact-input" placeholder="Phone / Contact" value="${sig.contact || ''}">
                    <input type="text" class="custom-input-box-element sig-website-input" placeholder="Website / Link" value="${sig.website || ''}">
                </div>
                <textarea class="interactive-textarea sig-rawtext-input" rows="2" placeholder="Or paste custom signature text (overrides fields above)">${sig.rawText || ''}</textarea>
            `;
            container.appendChild(block);
        });

        initIcons();

        document.querySelectorAll('.sig-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                userSignatures = userSignatures.filter(s => s.id !== targetId);
                renderSignatureBlocks(userSignatures);
            });
        });
    };

    const gatherSignaturesFromDOM = () => {
        const blocks = document.querySelectorAll('.signature-entry-block');
        const result = [];
        blocks.forEach(block => {
            result.push({
                id: block.getAttribute('data-sig-id'),
                label: block.querySelector('.sig-label-input')?.value || 'Untitled',
                fullName: block.querySelector('.sig-fullname-input')?.value || '',
                jobTitle: block.querySelector('.sig-jobtitle-input')?.value || '',
                company: block.querySelector('.sig-company-input')?.value || '',
                contact: block.querySelector('.sig-contact-input')?.value || '',
                website: block.querySelector('.sig-website-input')?.value || '',
                rawText: block.querySelector('.sig-rawtext-input')?.value || ''
            });
        });
        return result;
    };

    const populateGenSignatureDropdown = () => {
        const select = document.getElementById('genSignatureSelect');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">None</option>';
        userSignatures.forEach(sig => {
            const opt = document.createElement('option');
            opt.value = sig.id;
            opt.textContent = sig.label || 'Untitled';
            select.appendChild(opt);
        });
        if ([...select.options].some(o => o.value === currentVal)) select.value = currentVal;
    };

    const addSignatureBtn = document.getElementById('addSignatureBtn');
    if (addSignatureBtn) {
        addSignatureBtn.addEventListener('click', () => {
            userSignatures.push({
                id: `sig_${Date.now()}`,
                label: '', fullName: '', jobTitle: '', company: '', contact: '', website: '', rawText: ''
            });
            renderSignatureBlocks(userSignatures);
        });
    }

    const loadProfileSettings = async () => {
        const nameInput = document.getElementById('settingsFullName');
        const emailInput = document.getElementById('settingsEmailDisplay');
        const titleInput = document.getElementById('settingsTitle');
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

            userSignatures = packet.data.signatures || [];
            renderSignatureBlocks(userSignatures);
            populateGenSignatureDropdown();

            const s1 = document.getElementById('writingSample1');
            const s2 = document.getElementById('writingSample2');
            const s3 = document.getElementById('writingSample3');
            const matchDefault = document.getElementById('matchStyleDefault');
            if (s1) s1.value = packet.data.writing_sample_1 || '';
            if (s2) s2.value = packet.data.writing_sample_2 || '';
            if (s3) s3.value = packet.data.writing_sample_3 || '';
            if (matchDefault) matchDefault.checked = !!packet.data.match_style_default;

            const genToggle = document.getElementById('genMatchStyleToggle');
            const impToggle = document.getElementById('impMatchStyleToggle');
            if (genToggle) genToggle.checked = !!packet.data.match_style_default;
            if (impToggle) impToggle.checked = !!packet.data.match_style_default;
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
                        signatures: gatherSignaturesFromDOM(),
                        writingSample1: document.getElementById('writingSample1').value,
                        writingSample2: document.getElementById('writingSample2').value,
                        writingSample3: document.getElementById('writingSample3').value,
                        matchStyleDefault: document.getElementById('matchStyleDefault').checked
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

                userSignatures = packet.data.signatures || [];
                renderSignatureBlocks(userSignatures);
                populateGenSignatureDropdown();

                triggerToast('Profile updated successfully.');
            } catch (err) {
                btn.disabled = false;
                triggerToast('Network error while saving profile.', 'error');
            }
        });
    }
    const loadUsageAnalytics = async () => {
        const structuralToken = localStorage.getItem('mailcraft_jwt_token');
        if (!structuralToken) return;

        try {
            const res = await fetch(`${API_ROOT}/ai/analytics`, {
                headers: { 'Authorization': `Bearer ${structuralToken}` }
            });
            const packet = await res.json();
            if (!packet.success) return;

            const map = {
                statTotalGenerated: packet.data.totalGenerated,
                statTotalSmartReplies: packet.data.totalSmartReplies,
                statTotalGrammar: packet.data.totalGrammarChecks,
                statTotalTone: packet.data.totalToneRewrites,
                statTotalSummary: packet.data.totalSummaries,
                statTotalTranslation: packet.data.totalTranslations,
                statTotalRequests: packet.data.totalRequests
            };

            Object.keys(map).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = map[id];
            });
        } catch (err) {
            triggerToast('Unable to load usage analytics.', 'error');
        }
    };

    const settingsNavNode = document.querySelector('.nav-control-node[data-panel="settings"]');
    if (settingsNavNode) settingsNavNode.addEventListener('click', () => { loadProfileSettings(); loadUsageAnalytics(); });
    loadProfileSettings();
    loadUsageAnalytics();
});
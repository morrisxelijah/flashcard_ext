// // chrome.runtime.onInstalled.addListener(() => {
// //     chrome.storage.local.set({
// //         name: "Jack"
// //     });
// // });


// // -----------------  open extention in a side panel  -----------------
// chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
//     .catch((error) => console.error(error));
  

// // -----------------  close popup / side panel  -----------------
// // Enable the built-in behavior whenever the worker starts or the extension (re)installs.
// // This tells Chrome: "when the user clicks the toolbar icon, open my side panel."
// chrome.runtime.onInstalled.addListener(function () {
//     chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function (err) {
//         // If this fails on an older channel, we still have the explicit click handler below.
//         // console.warn('setPanelBehavior (onInstalled) failed:', err);
//     });
// });

// chrome.runtime.onStartup.addListener(function () {
//     chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function (_err) {});
// });


// // Explicit fallback: if a user clicks the toolbar icon, force the panel to open on that tab.
// chrome.action.onClicked.addListener(function (clickedTab) {
//     // Guard: we need a real tab id to target the side panel at.
//     if (!clickedTab || typeof clickedTab.id !== 'number') {
//         return;
//     }

//     // 1) Make absolutely sure the panel is enabled for this tab and points at our UI.
//     //    (This also fixes cases where our "close" workaround temporarily disabled it.)
//     chrome.sidePanel.setOptions({
//         tabId: clickedTab.id,
//         enabled: true,
//         path: 'popup.html'   // path is relative to the extension root
//     }).then(function () {
//         // 2) Open the panel for the current window (visible to the user).
//         return chrome.sidePanel.open({ windowId: clickedTab.windowId });
//     }).catch(function (_err) {
//         // If anything fails, we silently ignore. The user can try again;
//         // most failures are transient (e.g., panel not available on channel).
//     });
// });

// /* ============================
//    Helpers: open panel + deliver payload safely
//    ============================ */

// // Opens the side panel for the given tab/window, returns a Promise that settles when Chrome tries to open it.
// function openStudyPanelForTab(tabObject) {
//     // Make sure the panel is enabled and pointing to our UI for this tab
//     return chrome.sidePanel.setOptions({
//         tabId: tabObject.id,
//         enabled: true,
//         path: 'popup.html'
//     }).then(function () {
//         return chrome.sidePanel.open({ windowId: tabObject.windowId });
//     });
// }

// // Sends one message to the UI with optional simple retries to avoid race conditions
// function sendToUiWithRetry(messageObject, totalAttempts, delayMs) {
//     var attemptsLeft = typeof totalAttempts === 'number' ? totalAttempts : 5;
//     var retryDelay = typeof delayMs === 'number' ? delayMs : 150;

//     return new Promise(function (resolve) {
//         function tryOnce() {
//             // Use callback form so there is no unhandled rejection even if no listener exists yet
//             chrome.runtime.sendMessage(messageObject, function (response) {
//                 // If a listener handled it and acknowledged, we are done
//                 if (response && response.ok === true) {
//                     resolve(true);
//                     return;
//                 }
//                 // If no listener yet, check runtime.lastError (consumes it) and retry if we have attempts left
//                 var ignored = chrome.runtime.lastError;
//                 attemptsLeft = attemptsLeft - 1;
//                 if (attemptsLeft > 0) {
//                     setTimeout(tryOnce, retryDelay);
//                 } else {
//                     resolve(false);
//                 }
//             });
//         }
//         tryOnce();
//     });
// }



// /* ============================
//    Keyboard command: clip_selection (populate Quick Add)
//    ============================ */
// chrome.commands.onCommand.addListener(function (commandName) {
//     if (commandName !== 'clip_selection') {
//         return; // ignore other commands here
//     }

//     // Step 1: find the active tab (we need its id and windowId)
//     chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
//         var activeTab = tabs && tabs.length > 0 ? tabs[0] : null;
//         if (!activeTab || typeof activeTab.id !== 'number') {
//             return; // no valid tab to operate on
//         }

//         // Step 2: ask the content script in that tab for the current selection
//         chrome.tabs.sendMessage(activeTab.id, { type: 'GET_SELECTION' }, function (selectionResponse) {
//             // Consume any transport error cleanly
//             var ignored = chrome.runtime.lastError;

//             var frontText = '';
//             if (selectionResponse && typeof selectionResponse.text === 'string') {
//                 frontText = String(selectionResponse.text).trim();
//             }

//             // If nothing was selected, still open the panel so the user can paste/type
//             // (but we won’t auto-save anything)
//             var payloadToUi = {
//                 type: 'ui:populate_flashcard',
//                 payload: {
//                     front: frontText,     // MVP: fill only the front from selection
//                     back: '',             // leave back empty; user can type it
//                     // OPTIONAL: you could prefill tags by hostname for convenience:
//                     tags: ''              // e.g., new URL(activeTab.url).hostname
//                 }
//             };

//             // Step 3: ensure the panel is visible, then deliver the payload with retries
//             openStudyPanelForTab(activeTab).then(function () {
//                 return sendToUiWithRetry(payloadToUi, 6, 150);
//             }).then(function (_delivered) {
//                 // No-op: even if initial delivery failed, user can still paste/type manually.
//             });
//         });
//     }).catch(function (_err) {
//         // ignore; no active tab or permissions issue
//     });
// });








// // -----------------  read / write to storage  -----------------

// // storage keys
// const STORE_KEYS = {
//   CARDS: 'cards',  // array of saved cards
//   PREFS: 'prefs'  // later --> user can change preferences in options
// };

// async function loadCards() {
//   const { [STORE_KEYS.CARDS]: cards = [] } = await chrome.storage.local.get(STORE_KEYS.CARDS);
//   return cards;
// }

// async function saveCards(cards) {
//   await chrome.storage.local.set({ [STORE_KEYS.CARDS]: cards });
// }

// async function loadPrefs() {
//   const { [STORE_KEYS.PREFS]: prefs = defaultPrefs() } = await chrome.storage.sync.get(STORE_KEYS.PREFS);
//   return Object.assign(defaultPrefs(), prefs);
// }

// async function savePrefs(prefs) {
//   await chrome.storage.sync.set({ [STORE_KEYS.PREFS]: prefs });
// }

// function defaultPrefs() {
//   return {
//     destinations: { local: true, exportAnki: true, exportQuizlet: true, ankiConnect: false },
//     dailyReminderHour: 9,     // 9am local time
//   };
// }




// // generate unique id 
// function makeId() {
//   // simple id: time + random; good enough for local MVP
//   return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
// }

// // make a flash card
// function createCard({ front, back = '', tags = [], srcTitle = '', srcUrl = '' }) {
//   const now = Date.now();
//   return {
//     id: makeId(),
//     front: (front || '').trim(),
//     back: (back || '').trim(),
//     tags,
//     srcTitle,
//     srcUrl,
//     ease: 2.5,
//     interval: 0,
//     reps: 0,
//     dueAt: now,  // due now so it shows up in first session
//     createdAt: now,
//     updatedAt: now
//   };
// }





// // -----------------  save selection  -----------------

// // // user presses keyboard shortcut → background asks for selection then saves the card
// // chrome.commands.onCommand.addListener(async (command) => {
// //     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
// //     if (!tab.id) return;

// //     if (command === 'clip_selection') {
// //         // ask the content script to send us the current selection (safer across frames)
// //         const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }).catch(() => null);
// //         const front = (response.text || '').trim();
// //         if (!front) return;

// //         const newCard = createCard({ front, srcTitle: tab.title || '', srcUrl: tab.url || '' });
// //         const cards = await loadCards();
// //         cards.unshift(newCard);
// //         await saveCards(cards);
// //         chrome.runtime.sendMessage({ type: 'cards:created', payload: { id: newCard.id } });
// //     }

// //     if (command === 'open-study-panel') {
// //         await chrome.sidePanel.open({ windowId: tab.windowId });
// //     }
// // });

// // // user saves card with right click instead of selection
// // chrome.runtime.onInstalled.addListener(async () => {
// //     chrome.contextMenus.create({
// //         id: 'clip_save_selection',
// //         title: 'Save selection as flashcard',
// //         contexts: ['selection']
// //     });
// // });







// // -----------------  __  -----------------

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     // wait for tab to fully load (avoid running scripts multiple times on each partial load)
//     if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        
//         // change css of current tab page
//         // chrome.scripting.insertCSS({
//         //     target: { tabId: tabId },
//         //     files: ["./foreground_styles.css"]
//         // })
//         //     .then(() => {
//         //         console.log("INJECTED THE FOREGROUND STYLES.");

//         //         chrome.scripting.executeScript({
//         //             target: { tabId: tabId },
//         //             files: ["./foreground.js"]
//         //         })
//         //             .then(() => {
//         //                 console.log("INJECTED THE FOREGROUND SCRIPT.");
//         //             });
//         //     })
//         //     .catch(err => console.log(err));
//     }
// });

// // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
// //     if (request.message === 'get_name') {
// //         chrome.storage.local.get('name', data => {
// //             if (chrome.runtime.lastError) {
// //                 sendResponse({
// //                     message: 'fail'
// //                 });

// //                 return;
// //             }

// //             sendResponse({
// //                 message: 'success',
// //                 payload: data.name
// //             });
// //         });

// //         return true;
// //     } else if (request.message === 'change_name') {
// //         chrome.storage.local.set({
// //             name: request.payload
// //         }, () => {
// //             if (chrome.runtime.lastError) {
// //                 sendResponse({ message: 'fail' });
// //                 return;
// //             }

// //             sendResponse({ message: 'success' });
// //         })

// //         return true;
// //     }
// // });






/* ======================================================================
   background.js  (Manifest V3 service worker)
   Changes:
   - Panel opens immediately on user gesture (shortcut / context menu).
   - Flashcard shortcut populates the BACK field (front stays empty).
   - Notes shortcut stores page metadata in storage and only inserts:
       "Selected text" + \n\n for the user to type.
   - Right-click items mirror the same populate-only behavior (no saves).
   ====================================================================== */


/* -----------------------------------------------------------
   Side panel behavior (panel-first UX)
   ----------------------------------------------------------- */

chrome.runtime.onInstalled.addListener(function () {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function (_err) {});
    createContextMenus();   // install context menus
});

chrome.runtime.onStartup.addListener(function () {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function (_err) {});
});

// Fallback: open panel if action icon is clicked (some channels need this)
chrome.action.onClicked.addListener(function (clickedTab) {
    if (!clickedTab || typeof clickedTab.id !== 'number') return;
    openPanelNow(clickedTab);
});


/* -----------------------------------------------------------
   "Close panel" request from UI (× button)
   ----------------------------------------------------------- */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== 'panel:close_request') return false;

    function hidePanelForTab(tabIdValue) {
        if (!tabIdValue || typeof tabIdValue !== 'number') {
            try { sendResponse({ ok: true }); } catch (e) {}
            return;
        }
        chrome.sidePanel.setOptions({ tabId: tabIdValue, enabled: false })
            .then(function () {
                setTimeout(function () {
                    chrome.sidePanel.setOptions({ tabId: tabIdValue, enabled: true });
                }, 300);
            })
            .catch(function (_err) { /* ignore */ });

        try { sendResponse({ ok: true }); } catch (e) {}
    }

    if (sender && sender.tab && typeof sender.tab.id === 'number') {
        hidePanelForTab(sender.tab.id);
        return true;
    }

    chrome.tabs.query({ active: true, currentWindow: true })
        .then(function (tabs) {
            var t = tabs && tabs.length ? tabs[0] : null;
            hidePanelForTab(t && typeof t.id === 'number' ? t.id : null);
        })
        .catch(function () { try { sendResponse({ ok: true }); } catch (e) {} });

    return true;
});


/* -----------------------------------------------------------
   Helpers: open panel immediately; reliable UI messaging
   ----------------------------------------------------------- */

// Open the side panel ASAP (preserves user gesture for sidePanel.open)
function openPanelNow(tabObj) {
    if (!tabObj || typeof tabObj.id !== 'number') return;
    chrome.sidePanel.setOptions({
        tabId: tabObj.id,
        enabled: true,
        path: 'popup.html'
    }).then(function () {
        return chrome.sidePanel.open({ windowId: tabObj.windowId });
    }).catch(function (_err) { /* ignore transient failures */ });
}

// Retry messages because the panel may still be booting
function sendToUiWithRetry(messageObj, attempts, delayMs) {
    var left = typeof attempts === 'number' ? attempts : 6;
    var wait = typeof delayMs === 'number' ? delayMs : 150;

    return new Promise(function (resolve) {
        function once() {
            chrome.runtime.sendMessage(messageObj, function (resp) {
                if (resp && resp.ok === true) { resolve(true); return; }
                var _ignored = chrome.runtime.lastError;
                left = left - 1;
                if (left > 0) setTimeout(once, wait);
                else resolve(false);
            });
        }
        once();
    });
}


/* -----------------------------------------------------------
   Storage helpers (cards for future; notes metadata now)
   ----------------------------------------------------------- */

var STORE_KEYS = {
    CARDS: 'cards',
    PREFS: 'prefs',
    NOTES_META: 'notes_meta'   // array of { id, url, title, host, summary, createdAt }
};

function defaultPrefs() {
    return {
        destinations: { local: true, exportAnki: true, exportQuizlet: true, ankiConnect: false },
        dailyReminderHour: 9
    };
}

async function loadPrefs() {
    var got = await chrome.storage.sync.get(STORE_KEYS.PREFS);
    var prefs = got && got[STORE_KEYS.PREFS] ? got[STORE_KEYS.PREFS] : defaultPrefs();
    var merged = defaultPrefs();
    for (var k in prefs) { if (Object.prototype.hasOwnProperty.call(prefs, k)) merged[k] = prefs[k]; }
    return merged;
}

async function savePrefs(prefsObj) {
    await chrome.storage.sync.set({ [STORE_KEYS.PREFS]: prefsObj });
}

async function loadNotesMeta() {
    var got = await chrome.storage.local.get(STORE_KEYS.NOTES_META);
    var arr = got && got[STORE_KEYS.NOTES_META] ? got[STORE_KEYS.NOTES_META] : [];
    return Array.isArray(arr) ? arr : [];
}

async function saveNotesMeta(arr) {
    await chrome.storage.local.set({ [STORE_KEYS.NOTES_META]: Array.isArray(arr) ? arr : [] });
}

// Minimal ID factory
function makeId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}


/* -----------------------------------------------------------
   Keyboard shortcuts
   - Alt/Option+Shift+K  → populate flashcard BACK
   - Alt/Option+Shift+N  → populate notes + store metadata in background
   ----------------------------------------------------------- */
chrome.commands.onCommand.addListener(function (commandName) {
    if (commandName !== 'clip_selection' && commandName !== 'clip_selection_notes') return;

    chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs && tabs.length ? tabs[0] : null;
        if (!activeTab || typeof activeTab.id !== 'number') return;

        // 1) Open panel first (preserves user gesture)
        openPanelNow(activeTab);

        // 2) Get the current selection text from content script
        chrome.tabs.sendMessage(activeTab.id, { type: 'GET_SELECTION' }, function (selResp) {
            var _ignored = chrome.runtime.lastError;
            var selected = '';
            if (selResp && typeof selResp.text === 'string') selected = String(selResp.text).trim();

            if (commandName === 'clip_selection') {
                // *** Populate BACK (not front) ***
                var payload = { type: 'ui:populate_flashcard', payload: { front: '', back: selected, tags: '' } };
                sendToUiWithRetry(payload, 6, 150);
                return;
            }

            if (commandName === 'clip_selection_notes') {
                // Also get simple meta from the page; fall back to tab fields
                chrome.tabs.sendMessage(activeTab.id, { type: 'GET_PAGE_META' }, function (metaResp) {
                    var _ignored2 = chrome.runtime.lastError;

                    var tabTitle = typeof activeTab.title === 'string' ? activeTab.title : '';
                    var tabUrl   = typeof activeTab.url === 'string' ? activeTab.url : '';
                    var hostName = '';
                    try { hostName = tabUrl ? new URL(tabUrl).hostname : ''; } catch (e) { hostName = ''; }

                    var data = metaResp && metaResp.data ? metaResp.data : {};
                    var metaTitle = typeof data.metaTitle === 'string' ? data.metaTitle : '';
                    var metaDesc  = typeof data.metaDescription === 'string' ? data.metaDescription : '';
                    var ogTitle   = typeof data.ogTitle === 'string' ? data.ogTitle : '';
                    var ogDesc    = typeof data.ogDescription === 'string' ? data.ogDescription : '';

                    var displayTitle = metaTitle || ogTitle || tabTitle || '(untitled page)';
                    var displayDesc  = metaDesc || ogDesc || '';

                    // 3) Store only the METADATA in background
                    var noteMeta = {
                        id: makeId(),
                        url: tabUrl,
                        title: displayTitle,
                        host: hostName,
                        summary: displayDesc,
                        createdAt: Date.now()
                    };
                    loadNotesMeta().then(function (arr) {
                        arr.unshift(noteMeta);
                        return saveNotesMeta(arr);
                    });

                    // 4) Send UI just the QUOTED selection + two newlines for typing
                    var quoted = selected ? ('"' + selected + '"\n\n') : '';
                    var notesPayload = { type: 'ui:populate_notes', payload: { text: quoted } };
                    sendToUiWithRetry(notesPayload, 6, 150);
                });

                return;
            }
        });
    }).catch(function (_err) { /* ignore */ });
});


/* right click context menu */

function createContextMenus() {
    chrome.contextMenus.create({
        id: 'ctx_to_flashcard',
        title: 'Clip selection → Flashcard (populate back)',
        contexts: ['selection']
    });
    chrome.contextMenus.create({
        id: 'ctx_to_notes',
        title: 'Clip selection → Notes (populate)',
        contexts: ['selection']
    });
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (!tab || typeof tab.id !== 'number') return;
    if (info.menuItemId !== 'ctx_to_flashcard' && info.menuItemId !== 'ctx_to_notes') return;

    // Open panel immediately to keep gesture
    openPanelNow(tab);

    var selected = typeof info.selectionText === 'string' ? String(info.selectionText).trim() : '';

    if (info.menuItemId === 'ctx_to_flashcard') {
        // Populate BACK (not front)
        var payload = { type: 'ui:populate_flashcard', payload: { front: '', back: selected, tags: '' } };
        sendToUiWithRetry(payload, 6, 150);
        return;
    }

    // notes --> store metadata; UI gets only the quote + blank lines
    var pageUrl  = typeof info.pageUrl === 'string' ? info.pageUrl : (typeof tab.url === 'string' ? tab.url : '');
    var tabTitle = typeof tab.title === 'string' ? tab.title : '';
    var host     = ''; try { host = pageUrl ? new URL(pageUrl).hostname : ''; } catch (e) { host = ''; }

    var metaOnly = {
        id: makeId(),
        url: pageUrl,
        title: tabTitle || '(untitled page)',
        host: host,
        summary: '',            // we do not have content meta in contextMenus; leave empty
        createdAt: Date.now()
    };
    loadNotesMeta().then(function (arr) {
        arr.unshift(metaOnly);
        return saveNotesMeta(arr);
    });

    var quoteOnly = selected ? ('"' + selected + '"\n\n') : '';
    var notesPayload = { type: 'ui:populate_notes', payload: { text: quoteOnly } };
    sendToUiWithRetry(notesPayload, 6, 150);
});


/* for future */
function createCard(params) {
    var now = Date.now();
    var front = params && typeof params.front === 'string' ? params.front : '';
    var back  = params && typeof params.back  === 'string' ? params.back  : '';
    var tags  = params && Array.isArray(params.tags) ? params.tags : [];
    var title = params && typeof params.srcTitle === 'string' ? params.srcTitle : '';
    var url   = params && typeof params.srcUrl   === 'string' ? params.srcUrl   : '';

    return {
        id: makeId(),
        front: front.trim(),
        back: back.trim(),
        tags: tags,
        srcTitle: title,
        srcUrl: url,
        ease: 2.5,
        interval: 0,
        reps: 0,
        dueAt: now,
        createdAt: now,
        updatedAt: now
    };
}

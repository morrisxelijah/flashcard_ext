// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.local.set({
//         name: "Jack"
//     });
// });


// -----------------  open extention in a side panel  -----------------
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
  

// -----------------  close popup / side panel  -----------------
// Enable the built-in behavior whenever the worker starts or the extension (re)installs.
// This tells Chrome: "when the user clicks the toolbar icon, open my side panel."
chrome.runtime.onInstalled.addListener(function () {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function (err) {
        // If this fails on an older channel, we still have the explicit click handler below.
        // console.warn('setPanelBehavior (onInstalled) failed:', err);
    });
});

chrome.runtime.onStartup.addListener(function () {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function (_err) {});
});

// Explicit fallback: if a user clicks the toolbar icon, force the panel to open on that tab.
chrome.action.onClicked.addListener(function (clickedTab) {
    // Guard: we need a real tab id to target the side panel at.
    if (!clickedTab || typeof clickedTab.id !== 'number') {
        return;
    }

    // 1) Make absolutely sure the panel is enabled for this tab and points at our UI.
    //    (This also fixes cases where our "close" workaround temporarily disabled it.)
    chrome.sidePanel.setOptions({
        tabId: clickedTab.id,
        enabled: true,
        path: 'popup.html'   // path is relative to the extension root
    }).then(function () {
        // 2) Open the panel for the current window (visible to the user).
        return chrome.sidePanel.open({ windowId: clickedTab.windowId });
    }).catch(function (_err) {
        // If anything fails, we silently ignore. The user can try again;
        // most failures are transient (e.g., panel not available on channel).
    });
});









// -----------------  read / write to storage  -----------------

// storage keys
const STORE_KEYS = {
  CARDS: 'cards',  // array of saved cards
  PREFS: 'prefs'  // later --> user can change preferences in options
};

async function loadCards() {
  const { [STORE_KEYS.CARDS]: cards = [] } = await chrome.storage.local.get(STORE_KEYS.CARDS);
  return cards;
}

async function saveCards(cards) {
  await chrome.storage.local.set({ [STORE_KEYS.CARDS]: cards });
}

async function loadPrefs() {
  const { [STORE_KEYS.PREFS]: prefs = defaultPrefs() } = await chrome.storage.sync.get(STORE_KEYS.PREFS);
  return Object.assign(defaultPrefs(), prefs);
}

async function savePrefs(prefs) {
  await chrome.storage.sync.set({ [STORE_KEYS.PREFS]: prefs });
}

function defaultPrefs() {
  return {
    destinations: { local: true, exportAnki: true, exportQuizlet: true, ankiConnect: false },
    dailyReminderHour: 9,     // 9am local time
  };
}




// generate unique id 
function makeId() {
  // simple id: time + random; good enough for local MVP
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// make a flash card
function createCard({ front, back = '', tags = [], srcTitle = '', srcUrl = '' }) {
  const now = Date.now();
  return {
    id: makeId(),
    front: (front || '').trim(),
    back: (back || '').trim(),
    tags,
    srcTitle,
    srcUrl,
    ease: 2.5,
    interval: 0,
    reps: 0,
    dueAt: now,  // due now so it shows up in first session
    createdAt: now,
    updatedAt: now
  };
}





// -----------------  save selection  -----------------

// user presses keyboard shortcut → background asks for selection then saves the card
chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    if (command === 'clip_selection') {
        // ask the content script to send us the current selection (safer across frames)
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }).catch(() => null);
        const front = (response.text || '').trim();
        if (!front) return;

        const newCard = createCard({ front, srcTitle: tab.title || '', srcUrl: tab.url || '' });
        const cards = await loadCards();
        cards.unshift(newCard);
        await saveCards(cards);
        chrome.runtime.sendMessage({ type: 'cards:created', payload: { id: newCard.id } });
    }

    if (command === 'open-study-panel') {
        await chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

// user saves card with right click instead of selection
chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: 'clip_save_selection',
        title: 'Save selection as flashcard',
        contexts: ['selection']
    });
});

// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//     if (info.menuItemId !== 'clip_save_selection') return;

//     // gets from foreground
//     const front = (info.selectionText || '').trim();
//     if (!front) return;

//     const srcUrl = info.pageUrl || tab.url || '';
//     const srcTitle = tab.title || '';

//     const newCard = createCard({ front, srcTitle, srcUrl });
//     const cards = await loadCards();
//     cards.unshift(newCard);
//     await saveCards(cards);

//     chrome.runtime.sendMessage({ type: 'cards:created', payload: { id: newCard.id } });
// });





// -----------------  __  -----------------

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // wait for tab to fully load (avoid running scripts multiple times on each partial load)
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        
        // change css of current tab page
        // chrome.scripting.insertCSS({
        //     target: { tabId: tabId },
        //     files: ["./foreground_styles.css"]
        // })
        //     .then(() => {
        //         console.log("INJECTED THE FOREGROUND STYLES.");

        //         chrome.scripting.executeScript({
        //             target: { tabId: tabId },
        //             files: ["./foreground.js"]
        //         })
        //             .then(() => {
        //                 console.log("INJECTED THE FOREGROUND SCRIPT.");
        //             });
        //     })
        //     .catch(err => console.log(err));
    }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.message === 'get_name') {
//         chrome.storage.local.get('name', data => {
//             if (chrome.runtime.lastError) {
//                 sendResponse({
//                     message: 'fail'
//                 });

//                 return;
//             }

//             sendResponse({
//                 message: 'success',
//                 payload: data.name
//             });
//         });

//         return true;
//     } else if (request.message === 'change_name') {
//         chrome.storage.local.set({
//             name: request.payload
//         }, () => {
//             if (chrome.runtime.lastError) {
//                 sendResponse({ message: 'fail' });
//                 return;
//             }

//             sendResponse({ message: 'success' });
//         })

//         return true;
//     }
// });
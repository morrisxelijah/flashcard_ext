// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.local.set({
//         name: "Jack"
//     });
// });


// -----------------  open extention in a side panel  -----------------
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
  







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
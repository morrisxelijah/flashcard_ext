// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.local.set({
//         name: "Jack"
//     });
// });


// open extention in a side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


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
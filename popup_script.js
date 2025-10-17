// chrome.runtime.sendMessage({ 
//     message: "get_name"
// }, response => {
//     if (response.message === 'success') {
//         document.querySelector('div').innerHTML = `Hello ${response.payload}`;
//     }
// });

const els = {
    btnRefresh: document.getElementById('btn-refresh'),
    btnExportAnki: document.getElementById('btn-export_anki'),
    btnCopyQuizlet: document.getElementById('btn-copy_quizlet'),
    qaFront: document.getElementById('qa_front'),
    qaBack: document.getElementById('qa_back'),
    qaTags: document.getElementById('qa_tags'),
    qaCreate: document.getElementById('qa_create'),
    dueList: document.getElementById('due_list'),
    btnClosePanel: document.getElementById('btn-close_panel'), // direct handle to the close button
};


// // click handler that works in both contexts (popup and side panel)
// if (els.btnClosePanel) {
//     els.btnClosePanel.addEventListener('click', function handleClosePanelClick() {
//         // 1) first try to close the popup window directly (this works when we are in the popup)
//         try {
//             // window.close() will close the extension popup (Chrome allows this)
//             window.close();
//         } catch (error) {
//             // if window.close() is not allowed, we silently continue to the next step
//         }

//         // 2) also ask background to "close" the side panel context if we are in the side panel
//         //    note: Chrome does not expose a direct programmatic “close panel” API.
//         //    We simulate a close by temporarily disabling the panel for this tab, which hides it.
//         //    Then we re-enable it shortly after so users can open it again from the action button.
//         try {
//             chrome.runtime.sendMessage({ type: 'panel:close_request' });
//         } catch (error) {
//             // if messaging fails for any reason, we simply do nothing further
//         }
//     });
// }


// get inline "×" to close button
var closePanelButton = document.getElementById('btn-close_panel');

if (closePanelButton) {
    closePanelButton.addEventListener('click', function handleCloseClick(event) {
        // 1) Send a "please hide panel" request to background FIRST.
        //    Using the callback form guarantees there is NO unhandled Promise.
        chrome.runtime.sendMessage({ type: 'panel:close_request' }, function (_response) {
            // If background wasn’t listening, Chrome supplies a runtime.lastError.
            // We read it to consume the error; we do not need to do anything with it.
            var ignored = chrome.runtime.lastError;

            // 2) Close our view on the next tick. This closes the popup immediately,
            //    and in the side-panel it simply ends this JS context (the panel hides via background).
            setTimeout(function () {
                try { window.close(); } catch (e) { /* ignore */ }
            }, 0);
        });

        // Optional: prevent any default click behavior.
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
    });
}

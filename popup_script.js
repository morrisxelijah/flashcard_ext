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
    qaCreate: document.getElementById('qa_createBtn'),
    dueList: document.getElementById('due_list'),
    btnClosePanel: document.getElementById('btn-close_panel'), // direct handle to the close button
};




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





// accept a "populate flashcard" request from background and fill the Quick Add fields.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message && message.type === 'ui:populate_flashcard') {
        // Pull the payload (selected text, optional back/tags)
        var frontFromPage = '';
        var backFromPage = '';
        var tagsFromPage = '';

        if (message.payload && typeof message.payload.front === 'string') {
            frontFromPage = message.payload.front;
        }
        if (message.payload && typeof message.payload.back === 'string') {
            backFromPage = message.payload.back;
        }
        if (message.payload && typeof message.payload.tags === 'string') {
            tagsFromPage = message.payload.tags;
        }

        // Put text into the visible inputs (no saving — MVP requirement)
        if (els.qaFront) { els.qaFront.value = frontFromPage; }
        if (els.qaBack)  { els.qaBack.value  = backFromPage; }
        if (els.qaTags)  { els.qaTags.value  = tagsFromPage; }

        // focus whichever field received content (prefer back if it has text)
        try {
            var target = els.qaBack && els.qaBack.value && els.qaBack.value.length ? els.qaBack : els.qaFront;
            if (target && typeof target.focus === 'function') target.focus();
            if (target && typeof target.scrollIntoView === 'function') {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (e) { /* ignore */ }


        // Acknowledge so background can stop retrying
        try { sendResponse({ ok: true }); } catch (e) {}

        return true; // we responded
    }
    return false;
});



// Populate the Notes textarea with a template from background (no saving).
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message && message.type === 'ui:populate_notes') {
        var noteTextArea = document.getElementById('noteText');  // your HTML id
        var incomingText = '';
        if (message.payload && typeof message.payload.text === 'string') {
            incomingText = message.payload.text;
        }

        // If user already typed something, append with a clear separator; else set fresh text.
        if (noteTextArea) {
            var prior = String(noteTextArea.value || '');
            var needsSeparator = prior.trim().length > 0;
            var merged = needsSeparator ? (prior + '\n\n---\n\n' + incomingText) : incomingText;

            noteTextArea.value = merged;

            // Friendly UX: focus and place caret at end; scroll into view.
            try {
                noteTextArea.focus();
                noteTextArea.selectionStart = noteTextArea.value.length;
                noteTextArea.selectionEnd = noteTextArea.value.length;
                if (typeof noteTextArea.scrollIntoView === 'function') {
                    noteTextArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (e) { /* ignore focus issues */ }
        }

        try { sendResponse({ ok: true }); } catch (e) {}
        return true;
    }

    return false;
});

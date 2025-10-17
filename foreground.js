
/** 
const noteWritten = document.getElement('noteText')
const saveNoteBtn = document.getElement('Save Note')
const notesContainer = document.getElement('notesContainer')



//To load Notes
document.addEventListener("DOMContentLoaded", loadNotes);

//Saving Notes
saveNoteBtn.addEventListener("click", async() => {
    const text = noteWritten.value.trim();
    if (text === "") return;

    const note = {
        text, 
        date: new Date().toLocaleString()
    };

    //to get notes
    const data = await chrome.storage.local.get("notes");
    const notes = data.notes || [];
    notes.push(note);

    //Save new list
    await chrome.storage.local.set({ notes });

    noteWritten.value = "";
    renderNotes(notes);

});

//to load and render the notes
async function loadNotes() {
    const data = await chrome.storage.local.get("notes"); 
    const notes = data.notes || [];
    renderNotes(notes);
}

function renderNotes(notes) {
    notesContainer.innerHTML = "";

    notes.forEach((note) => {
        const li = document.createElement('li');
        li.innerHTML = `
        <div class="note">
            <p>${note.text}</p>
            <small>${note.date}</small>
        </div>
        `;
        notesContainer.appendChild(li);
    });
}
*/




// content script  -->  answer "what is currently selected on this page?" for the background.
// keep tiny to avoid breaking sites

// Listen for messages from the extension.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // ------------- Selection -------------
    if (message && message.type === 'GET_SELECTION') {
        var selectionText = '';
        try {
            var selectionObject = window.getSelection();
            selectionText = selectionObject ? String(selectionObject).trim() : '';
        } catch (e) {
            selectionText = '';
        }
        try { sendResponse({ ok: true, text: selectionText }); } catch (e) {}
        return true; // we replied
    }

    // ------------- Page Meta -------------
    if (message && message.type === 'GET_PAGE_META') {
        // We try to read common meta fields. All are optional; background has fallbacks.
        var metaTitle = '';
        var metaDescription = '';
        var openGraphTitle = '';
        var openGraphDescription = '';
        var openGraphSiteName = '';

        try {
            // Title from the document (often same as tab.title but can differ)
            metaTitle = document.title ? String(document.title).trim() : '';
        } catch (e) { metaTitle = ''; }

        try {
            var descTag = document.querySelector('meta[name="description"]');
            metaDescription = descTag && descTag.content ? String(descTag.content).trim() : '';
        } catch (e) { metaDescription = ''; }

        try {
            var ogTitleTag = document.querySelector('meta[property="og:title"]');
            openGraphTitle = ogTitleTag && ogTitleTag.content ? String(ogTitleTag.content).trim() : '';
        } catch (e) { openGraphTitle = ''; }

        try {
            var ogDescTag = document.querySelector('meta[property="og:description"]');
            openGraphDescription = ogDescTag && ogDescTag.content ? String(ogDescTag.content).trim() : '';
        } catch (e) { openGraphDescription = ''; }

        try {
            var ogSiteTag = document.querySelector('meta[property="og:site_name"]');
            openGraphSiteName = ogSiteTag && ogSiteTag.content ? String(ogSiteTag.content).trim() : '';
        } catch (e) { openGraphSiteName = ''; }

        var metaPayload = {
            metaTitle: metaTitle,
            metaDescription: metaDescription,
            ogTitle: openGraphTitle,
            ogDescription: openGraphDescription,
            ogSiteName: openGraphSiteName
        };

        try { sendResponse({ ok: true, data: metaPayload }); } catch (e) {}
        return true; // we replied
    }

    return false; // not our message
});






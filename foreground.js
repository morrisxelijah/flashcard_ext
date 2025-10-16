// const ce_main_container = document.createElement('DIV');
// // const ce_name = document.createElement('DIV');
// const ce_input = document.createElement('INPUT');
// const ce_button = document.createElement('DIV');
// ce_main_container.classList.add('ce_main');
// // ce_name.id = 'ce_name';
// ce_input.id = 'ce_input';
// ce_button.id = 'ce_button';



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

// ce_name.innerHTML = `Hello NAME`;
// ce_button.innerHTML = `Change name.`;

// ce_main_container.appendChild(ce_name);
// ce_main_container.appendChild(ce_input);
// ce_main_container.appendChild(ce_button);


// document.querySelector('body').appendChild(ce_main_container);

// chrome.runtime.sendMessage({ 
//     message: "get_name"
// }, response => {
//     if (response.message === 'success') {
//         ce_name.innerHTML = `Hello ${response.payload}`;
//     }
// });

// ce_button.addEventListener('click', () => {
//     chrome.runtime.sendMessage({ 
//         message: "change_name",
//         payload: ce_input.value
//     }, response => {
//         if (response.message === 'success') {
//             ce_name.innerHTML = `Hello ${ce_input.value}`;
//         }
//     });
// });


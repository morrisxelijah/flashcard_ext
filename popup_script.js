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
    dueList: document.getElementById('due_list')
};
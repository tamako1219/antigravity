// content.js

let floatingBtn = null;

// Create Floating Button
function createFloatingButton() {
    const btn = document.createElement("div");
    btn.className = "mab-floating-btn";
    btn.innerText = "🧠 Save";
    btn.style.display = "none";
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
        const selection = window.getSelection().toString();
        if (selection) {
            chrome.runtime.sendMessage({
                action: "saveToBrain",
                data: {
                    type: "text",
                    text: selection
                }
            });
            hideButton();
        }
    });

    return btn;
}

floatingBtn = createFloatingButton();

function showButton(x, y) {
    floatingBtn.style.left = `${x}px`;
    floatingBtn.style.top = `${y}px`;
    floatingBtn.style.display = "block";
}

function hideButton() {
    floatingBtn.style.display = "none";
}

// Listen for text selection
document.addEventListener("mouseup", (e) => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 0) {
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showButton(rect.right + window.scrollX, rect.top + window.scrollY - 30);
    } else {
        hideButton();
    }
});

// Drag and Drop Zone
const dropZone = document.createElement("div");
dropZone.className = "mab-drop-zone";
dropZone.innerText = "Drop to Save to Brain";
document.body.appendChild(dropZone);

let dragCounter = 0;

document.addEventListener("dragenter", (e) => {
    dragCounter++;
    dropZone.classList.add("active");
});

document.addEventListener("dragleave", (e) => {
    dragCounter--;
    if (dragCounter === 0) {
        dropZone.classList.remove("active");
    }
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});

document.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("active");
    dragCounter = 0;

    const text = e.dataTransfer.getData("text");
    if (text) {
        chrome.runtime.sendMessage({
            action: "saveToBrain",
            data: {
                type: "text",
                text: text
            }
        });
    }
    // TODO: Handle files/images if needed via DataTransferItemList
});

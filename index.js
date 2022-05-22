// require("dotenv").config();
// const apiKey = process.env.API_KEY;
// const url = `something/${apiKey}`;

//  ====== storing data for the user in the browser
let db;
const openRequest = window.indexedDB.open("names_db", 1);
const galleryEl = document.querySelector(".gallery__list")
const promptLabel = "Prompt Label";
const responseLabel = "Response Label";

openRequest.addEventListener('error', () => console.error('Database failed to open'));

openRequest.addEventListener('success', () => {
    console.log('Database opened successfully');
    db = openRequest.result;
    displayData();
});

openRequest.addEventListener('upgradeneeded', e => {
    db = e.target.result;
    const objectStore = db.createObjectStore('names_os');
    objectStore.createIndex('prompt', 'prompt', { unique: false });
    objectStore.createIndex('response', 'response', { unique: false });
    console.log('Database setup complete');
});

// ====== form event and handler
const form = document.querySelector(".form");
const promptInput = document.querySelector("#prompt")
const responseValue = "placeholder"; // this will later be returned by the API
form.addEventListener("submit", addData);

function addData(e) {
    e.preventDefault();
    const newName = {
        prompt: promptInput.value,
        response: responseValue
    }
    console.log(`we are saving: ${newName}`)
    const transaction = db.transaction(["names_os"], "readwrite");
    const objectStore = transaction.objectStore("names_os");
    const addRequest = objectStore.add(newName);
    addRequest.addEventListener("success", () => {
        console.log(`input value ${promptInput}`)
        promptInput.value = "";
        console.log(`input value post clear ${promptInput}`)
    })
    transaction.addEventListener("complete", () => {
        console.log("database updated");
        displayData();
    })
    transaction.addEventListener("error", () => {
        console.error("transaction incomplete");
    })

}

function displayData() {
    galleryEl.innerHTML = "";
    let counter = 0;
    const promptAndNameList = [];
    const objectStore = db.transaction("names_os").objectStore("names_os");
    objectStore.openCursor().addEventListener("success", e => {
        const cursor = e.target.result;

        if (cursor) {
            promptAndNameList.unshift({
                prompt: cursor.value.prompt,
                response: cursor.value.response
            })
            cursor.continue();
        } else {
            promptAndNameList.forEach((item, index) => {
                const galleryItemEl = document.createElement("li");
                galleryItemEl.classList.add("gallery__item");
                galleryEl.appendChild(galleryItemEl);
                const itemEl = document.createElement("ul");
                itemEl.classList.add("item");
                galleryItemEl.appendChild(itemEl)
                const itemPromptEl = document.createElement("li");
                itemPromptEl.classList.add("item__prompt");
                itemEl.appendChild(itemPromptEl)
                const itemPromptLabelEl = document.createElement("p");
                const itemPromptContentEl = document.createElement("p");
                itemPromptEl.appendChild(itemPromptLabelEl);
                itemPromptEl.appendChild(itemPromptContentEl);
                itemPromptContentEl.classList.add("item__content");
                const itemResponseEl = document.createElement("li");
                itemEl.appendChild(itemResponseEl);
                itemResponseEl.classList.add("item__response");
                const itemResponseLabelEl = document.createElement("p");
                const itemResponseContentEl = document.createElement("p");
                itemResponseEl.appendChild(itemResponseLabelEl);
                itemResponseEl.appendChild(itemResponseContentEl);
                itemResponseContentEl.classList.add("item__content");
                if (index === 0) {
                    itemPromptLabelEl.classList.add("item__label", "item__label--first");
                    itemResponseLabelEl.classList.add("item__label", "item__label--first");
                    counter++;
                } else {
                    itemPromptLabelEl.classList.add("item__label");
                    itemResponseLabelEl.classList.add("item__label");
                }
                itemPromptLabelEl.textContent = promptLabel;
                itemPromptContentEl.textContent = item.prompt;
                itemResponseLabelEl.textContent = responseLabel;
                itemResponseContentEl.textContent = item.response;
                // galleryItemEl.setAttribute("data-node-id", cursor.value.id);
            })
        }
    })
}

require('dotenv').config();
const apiKey = process.env.API_KEY;
const apiUrl = "https://api.openai.com/v1/engines/text-curie-001/completions";
//  ====== storing data for the user in the browser
let db;
const openRequest = window.indexedDB.open("names_db", 1);
const galleryEl = document.querySelector(".gallery__list");
const inputContainerEl = document.querySelector(".app__input");
const promptLabel = "Your Dream";
const responseLabel = "Your Endless Possibilities";
openRequest.addEventListener('error', () => console.error('Database failed to open'));
//  ====== building page on data saved in the browser
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
const promptInput = document.querySelector("#prompt");
form.addEventListener("submit", addData);

function addData(e) {
    e.preventDefault();
    let userPrompt = promptInput.value;
    let apiPrompt = "Brainstorm some ideas combining ecommerce and " + userPrompt;
    let responseValue = "";
    let authorization = "Bearer " + apiKey; 
    let headersApi = {
        "Content-Type": "application/json",
        "Authorization": authorization
    };
    let dataApi = JSON.stringify({
        "prompt": apiPrompt,
        "max_tokens": 50,
        "temperature": 0.6,
        "top_p": 1,
        "frequency_penalty": 1,
        "presence_penalty": 1
    })
    axios({
        method: "post",
        url: apiUrl,
        headers: headersApi,
        data: dataApi
    })
        .then(response => {
            console.log("response is: " + response.data.choices[0].text)
            responseValue = response.data.choices[0].text;
            console.log("new variable is: " + responseValue)
            const newName = {
                prompt: userPrompt,
                response: responseValue
            }
            saveData(newName);
        })
        .catch(error => {
            console.log(`error sending request to API: ${error}`)
        })
}

// ====== delete event and handler
const deleteButton = document.querySelector(".app__button");
deleteButton.addEventListener("click", clearData);
function clearData() {
    let transaction = db.transaction(["names_os"], "readwrite");
    transaction.oncomplete = (e) => { console.log("success opening") };
    transaction.onerror = (e) => { console.log("unable to open") };
    let objectStore = transaction.objectStore("names_os");
    let clearRequest = objectStore.clear()
    clearRequest.onsuccess = (e) => {
        console.log("clear successful");
        displayData();
    }
}
// ====== general use func
function displayData() {
    galleryEl.innerHTML = "";
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
            // append button to section app__gallery
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
                } else {
                    itemPromptLabelEl.classList.add("item__label");
                    itemResponseLabelEl.classList.add("item__label");
                }
                itemPromptLabelEl.textContent = promptLabel;
                itemPromptContentEl.textContent = item.prompt;
                itemResponseLabelEl.textContent = responseLabel;
                let formattedResponse = item.response.replaceAll(" \n", "<br>").replaceAll(".\n", "<br>").replaceAll("-", "- ");
                itemResponseContentEl.innerHTML = formattedResponse;
            })
        }
    })
}
function saveData(data) {
    const transaction = db.transaction(["names_os"], "readwrite");
    const objectStore = transaction.objectStore("names_os");
    const addRequest = objectStore.add(data);
    addRequest.addEventListener("success", () => {
        promptInput.value = "";
    })
    transaction.addEventListener("complete", () => {
        console.log("database updated");
        displayData();
    })
    transaction.addEventListener("error", () => {
        console.error("transaction incomplete");
    })
}
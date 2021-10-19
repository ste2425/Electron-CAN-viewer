const { ipcRenderer } = require('electron');

const { ipcEvents } = require('./ipcEvents');

/**
 * Contains the table cells which have active classes applied and the timeout ID's to cancel the automatic removal of those classes.
 * @type {Map<HTMLTableCellElement, number>}
 */
const changeMap = new Map();

window.addEventListener('DOMContentLoaded', () => { 
    /** @type {HTMLButtonElement} */
    const goBtn = document.querySelector('#go'),
        /** @type {HTMLButtonElement} */
        stopBtn = document.querySelector('#stop'),
        /** @type {HTMLButtonElement} */
        connectBtn = document.querySelector('#connectBTN'),
        /** @type {HTMLSelectElement} */
        portList = document.querySelector('#portList'),
        /** @type {HTMLButtonElement} */
        refreshPortsBtn = document.querySelector('#refreshPortsBTN'),
        /** @type {HTMLButtonElement} */
        messagesTabBtn = document.querySelector('#messages-tab'),
        /** @type {HTMLButtonElement} */
        adapterTabBtn = document.querySelector('#adapter-tab'),
        /** @type {HTMLButtonElement} */
        disconnectBtn = document.querySelector('#disconnectBTN'),
        clickEvent = new Event('click', {
            bubbles: true
        });

    ipcRenderer.on(ipcEvents.serialConnected, () => {
        messagesTabBtn.classList.remove('disabled');
        disconnectBtn.removeAttribute('disabled');
    });

    ipcRenderer.on(ipcEvents.serialDisconnect, (e, path) => {
        connectBtn.removeAttribute('disabled');
        portList.removeAttribute('disabled');
        messagesTabBtn.classList.add('disabled');
        goBtn.removeAttribute('disabled');
        stopBtn.setAttribute('disabled', 'disabled');
        disconnectBtn.setAttribute('disabled', 'disabled');

        adapterTabBtn.dispatchEvent(clickEvent);
        
        ipcRenderer.send(ipcEvents.performPortList);
    });

    ipcRenderer.on(ipcEvents.CANMessage, (e, d) => {
        renderMessages(d);
    });

    ipcRenderer.on(ipcEvents.debugMessage, (e, d) => {
        console.log(d);
    });

    ipcRenderer.on(ipcEvents.init, (e, d) => {
        ipcRenderer.send(ipcEvents.performPortList);

        if (d.connected) {
            messagesTabBtn.classList.remove('disabled');

            messagesTabBtn.dispatchEvent(clickEvent);

            connectBtn.setAttribute('disabled', 'disabled');
            portList.setAttribute('disabled', 'disabled');
            disconnectBtn.removeAttribute('disabled');
        }

        if (d.path) {    
            // if available ports haven't been bound yet set the selected port as a data attribute to be added later
            if (portList.options.length)
                portList.value = d.path;
            else
                portList.dataset.path = d.path;
        }
    });

    ipcRenderer.on(ipcEvents.portList, (e, ports) => {
        const templateData = ports.map(p => {
            return {
                value: p.path,
                label: `${p.manufacturer || 'N/A'} : (${p.path})`
            };
        });

        const element = renderTemplate('#port-list-item-template', templateData);

        const selectedValue = portList.value;
        portList.innerHTML = '';

        portList.appendChild(element);

        if (selectedValue)
            portList.value = selectedValue;

        if (portList.dataset.path) {
            portList.value = portList.dataset.path;
            delete portList.dataset.path;
        }
    });

    connectBtn.addEventListener('click', (e) => {
        const path = portList.value;

        if (!path)
            return;

        ipcRenderer.send(ipcEvents.performSerialConnect, path);
        connectBtn.setAttribute('disabled', 'disabled');
        portList.setAttribute('disabled', 'disabled');
    });

    goBtn.addEventListener('click', (e) => {
        goBtn.setAttribute('disabled', 'disabled');
        stopBtn.removeAttribute('disabled');

        ipcRenderer.send(ipcEvents.performStartCANListening);
    });    
    
    stopBtn.addEventListener('click', (e) => {
        stopBtn.setAttribute('disabled', 'disabled');
        goBtn.removeAttribute('disabled');

        ipcRenderer.send(ipcEvents.performStopCANListening);
    });

    refreshPortsBtn.addEventListener('click', () => {
        ipcRenderer.send(ipcEvents.performPortList);
    });

    disconnectBtn.addEventListener('click', () => {
        ipcRenderer.send(ipcEvents.performSerialDisconnect);
    });

    ipcRenderer.send(ipcEvents.performInit);    
});

/**
 * Sets the CAN message value against its table cell. Adds a highlight class which will automatically be removed after a period of time.
 * 
 * This is not used for first time messages but for updating existing CAN messages.
 * @param {HTMLTableCellElement} td 
 * @param {string} v 
 * @returns 
 */
function setValue(td, v) {
    if (td.textContent === v)
        return;

    td.textContent = v;
    
    td.classList.add('changed');

    if (changeMap.has(td))
        clearTimeout(changeMap.get(td));

    const timeoutID = ((e) => setTimeout(() => {
        e.classList.remove('changed');
    }, 2500))(td);
    
    changeMap.set(td, timeoutID);
}

/**
 * Renders the CAN messages recieved
 * 
 * @param {object[]} messages 
 */
function renderMessages(messages) {
    const tbody = document.querySelector('tbody');

    messages.forEach(message => {
        const existingCells = Array.from(tbody.querySelectorAll(`[data-message-id="${message.id}"] td.data-block`));
    
        if (existingCells.length) {
            // If the can message has already been recieved only update the actual can data blocks
            existingCells
                .forEach((cell, i) => setValue(cell, message.dataBlocks[i]));
        } else {
            const clone = renderTemplate('#table-row-template', {
                messageId: message.id,
                d1: message.dataBlocks[0] || '',
                d2: message.dataBlocks[1] || '',
                d3: message.dataBlocks[2] || '',
                d4: message.dataBlocks[3] || '',
                d5: message.dataBlocks[4] || '',
                d6: message.dataBlocks[5] || '',
                d7: message.dataBlocks[6] || '',
                d8: message.dataBlocks[7] || ''
            });
    
            tbody.appendChild(clone);

            // Add the message ID to the filter dropdown list to hide messages of this id
            if (!document.querySelector(`.dropdown-menu [data-message-id="${message.id}"]`)) {

                const messageFilterClone = renderTemplate('#message-filter-item-template', {
                    messageId: message.id
                });
   
                document.querySelector('.dropdown-menu').appendChild(messageFilterClone);
            }
        }
    });
}

/**
 * Prevent XSS by escaping html.
 * Very unlikely that we will get an XSS attack over a serial port but who knows.
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, "&#x2F;")
}

/**
 * 
 * @param {string} templateSelector 
 * @param {(object|object[])} datas
 * @returns {HTMLTemplateElement}
 */
function renderTemplate(templateSelector, templateData) {
    const template = document.querySelector(templateSelector),
        rootClone = template.content.cloneNode(true);

    function renderItem(clone, data) {
        let html = clone.firstElementChild.innerHTML;

        // build a lookup of attributes that have template keys as their value
        const attributesMap = Array.from(clone.firstElementChild.attributes)
            .reduce((accu, cur) => {
                if (cur.value.startsWith('{{'))
                    accu[cur.value] = cur;
        
                return accu;
            }, {});
        
        for (const key in data) {
            const templateKey = `{{${key}}}`,
                regex = new RegExp(templateKey, 'g'),
                value = escapeHtml(data[key]);
    
            html = html.replace(regex, value);
    
            if (templateKey in attributesMap)
                attributesMap[templateKey].value = value;
        }
    
        clone.firstElementChild.innerHTML = html;

        return clone;
    }

    if (!Array.isArray(templateData))
        templateData = [templateData];

    // render the first item as root
    renderItem(rootClone, templateData[0]);

    // then append all others after the root item
    for (const data of templateData.splice(1)) {
        const clone = template.content.cloneNode(true);

        renderItem(clone, data);

        rootClone.firstElementChild.after(clone);
    }

    return rootClone;
}

document.addEventListener('DOMContentLoaded', () => {
    /** @type {HTMLTableElement} */
    const table = document.querySelector('table'),
        /** @type {HTMLUListElement} */
        filterDropdownList = document.querySelector('#hideMessagesDropdown ul');

    document.querySelector('#clear').addEventListener('click', () => {
        table.tBodies[0].innerHTML = '';
        filterDropdownList.innerHTML = '';
    });

    document.querySelector('#expandAll').addEventListener('click', () => {
        Array.from(document.querySelectorAll('tr.d-none'))
            .forEach(e => e.classList.remove('d-none'));
    });

    document.querySelector('#hideMessagesDropdown').addEventListener('change', (e) => {
        let target = e.target;

        if (!target.matches('.filter-chk'))
            return;

        const messageId = target.value;

        if (target.checked) {
            document.querySelector(`tr[data-message-id="${messageId}"]`).classList.add('d-none');
        } else {
            document.querySelector(`tr[data-message-id="${messageId}"]`).classList.remove('d-none');
        }
    });
});

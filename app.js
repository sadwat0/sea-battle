'use strict';

// Creating player field
let player_field = document.getElementById('self-table');
let table1 = document.createElement('table');
for (let i = 0; i < 10; i++) {
    let tr = document.createElement('tr');
    for (let j = 0; j < 10; j++) {
        let td = document.createElement('td');

        td.setAttribute('class', 'cell');
        td.setAttribute('data-x', i);
        td.setAttribute('data-y', j);
        tr.appendChild(td);
    }

    table1.appendChild(tr);
}
player_field.appendChild(table1);

table1.setAttribute('cellspacing', '0');
document.getElementById('player-field').appendChild(player_field);


// Creating enemy field
let enemy_field = document.getElementById('enemy-table');
let table2 = document.createElement('table');
for (let i = 0; i < 10; i++) {
    let tr = document.createElement('tr');
    for (let j = 0; j < 10; j++) {
        let td = document.createElement('td');

        td.setAttribute('class', 'cell');
        td.setAttribute('data-x', i);
        td.setAttribute('data-y', j);
        tr.appendChild(td);
    }

    table2.appendChild(tr);
}
enemy_field.appendChild(table2);

table2.setAttribute('cellspacing', '0');
document.getElementById('eenmy-field').appendChild(enemy_field);
'use strict';

function randomNumber(a, b) { // [a; b]
    return Math.floor(Math.random() * (b - a + 1) + a)
}

// Creating player field
let ourBattleFieldTable = document.getElementById('self-table');
let table1 = document.createElement('table');
for (let i = 0; i < 10; i++) {
    let tr = document.createElement('tr');
    for (let j = 0; j < 10; j++) {
        let td = document.createElement('td');

        td.setAttribute('class', 'cell');
        td.setAttribute('data-x', i);
        td.setAttribute('data-y', j);
        td.setAttribute('data-owner', 0);
        tr.appendChild(td);
    }

    table1.appendChild(tr);
}
ourBattleFieldTable.appendChild(table1);

table1.setAttribute('cellspacing', '0');
document.getElementById('player-field').appendChild(ourBattleFieldTable);


// Creating enemy field
let enemyBattleFieldTable = document.getElementById('enemy-table');
let table2 = document.createElement('table');
for (let i = 0; i < 10; i++) {
    let tr = document.createElement('tr');
    for (let j = 0; j < 10; j++) {
        let td = document.createElement('td');

        td.setAttribute('class', 'cell');
        td.setAttribute('data-x', i);
        td.setAttribute('data-y', j);
        td.setAttribute('data-owner', 1);
        tr.appendChild(td);
    }

    table2.appendChild(tr);
}
enemyBattleFieldTable.appendChild(table2);

table2.setAttribute('cellspacing', '0');
document.getElementById('enemy-field').appendChild(enemyBattleFieldTable);


let START_SHIPS_COUNT = [0, 4, 3, 2, 1];
let DELTA_X = [1, 0], DELTA_Y = [0, 1]; // from direction get shift
class Field {
    /*
        this.matrix[x][y] = {
            0 - not used cell
            1 - placed ship
            2 - missed shoot
            3 - destroyed ship
        }
    */
    constructor(owner) {
        this.ships_remained = START_SHIPS_COUNT;
        this.matrix = Array(10).fill().map(() => Array(10).fill(0));
        this.owner = owner;
    }

    createField() {
        for (let i = 1; i < START_SHIPS_COUNT.length; i++) {
            for (let j = 0; j < START_SHIPS_COUNT[i]; j++) {
                let x = randomNumber(0, 9), y = randomNumber(0, 9);
                let direction = randomNumber(0, 1);

                // checking this position
                let ok = true;
                let cx = x, cy = y; // current x, current y
                for (let k = 0; k < i; k++) {
                    if (cx < 0 || cx >= 10 || cy < 0 || cy >= 10 || this.matrix[cx][cy] != 0) {
                        ok = false;
                        break;
                    }

                    for (let X = Math.max(0, cx - 1); X <= Math.min(9, cx + 1); X++) {
                        for (let Y = Math.max(0, cy - 1); Y <= Math.min(9, cy + 1); Y++) {
                            if (this.matrix[X][Y] != 0) {
                                ok = false;
                            }
                        }
                    }

                    cx += DELTA_X[direction];
                    cy += DELTA_Y[direction];
                }

                if (!ok) {
                    // generated bad position
                    j--;
                    continue;
                }

                // placing ship
                for (let k = 0; k < i; k++) {
                    this.matrix[x][y] = 1;
                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                    cell.setAttribute('class', 'cell ship-cell');
                    x += DELTA_X[direction];
                    y += DELTA_Y[direction];
                }
            }
        }
    }
}

let our_field = new Field(0);
our_field.createField();

let enemy_field = new Field(1);
enemy_field.createField();

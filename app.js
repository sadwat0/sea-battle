'use strict';

function randomNumber(a, b) { // [a; b]
    return Math.floor(Math.random() * (b - a + 1) + a)
}

/* --- Creating tables --- */

// creating our table
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


// creating enemy table
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




/* --- Main game --- */

let START_SHIPS_COUNT = [0, 4, 3, 2, 1]; // START_SHIPS_COUNT[x] - count of ships len x
let DELTA_X = [1, 0], DELTA_Y = [0, 1]; // from direction get shift
class Field {
    /*
        this.matrix[x][y] = {
            0 - not used cell
            1 - placed ship
            2 - missed shoot
            3 - destroyed ship
            4 - cell, near to destroyed ship
        }
    */

    constructor(owner) {
        this.ships_remained = START_SHIPS_COUNT;
        this.matrix = Array(10).fill().map(() => Array(10).fill(0));
        this.ship_cover = Array(10).fill().map(() => Array(10).fill(-1));
        this.owner = owner;
        this.ships_health = [];
        this.ships_cells = [];
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

                this.ships_health.push(i);
                this.ships_cells.push([]);

                // placing ship
                for (let k = 0; k < i; k++) {
                    this.matrix[x][y] = 1;
                    this.ships_cells[this.ships_cells.length - 1].push([x, y]);
                    this.ship_cover[x][y] = this.ships_health.length - 1;

                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                    cell.setAttribute('class', 'cell ship-cell');

                    x += DELTA_X[direction];
                    y += DELTA_Y[direction];
                }
            }
        }
    }
}

let field = [new Field(0), new Field(1)];
field[0].createField();
field[1].createField();

let current_step = 0; // 0 - this player, 1 - enemy
function attack(x, y, to) {
    if (to == current_step) {
        return 0; // not our step
    }

    let state = field[to].matrix[x][y];
    if (state != 0 && state != 1) {
        return 0; // already attacked cell
    }

    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${to}"]`);
    if (state == 0) {
        cell.setAttribute('class', 'cell missed-cell');
        field[to].matrix[x][y] = 2;
        current_step ^= 1;
    } else {
        cell.setAttribute('class', 'cell died-ship-cell')
        field[to].matrix[x][y] = 3;

        let ship = field[to].ship_cover[x][y];
        field[to].ships_health[ship]--;

        // destroying nearby cells
        if (field[to].ships_health[ship] == 0) {
            for (let i = 0; i < field[to].ships_cells[ship].length; i++) {
                let p = field[to].ships_cells[ship][i];

                for (let x = Math.max(0, p[0] - 1); x <= Math.min(9, p[0] + 1); x++) {
                    for (let y = Math.max(0, p[1] - 1); y <= Math.min(9, p[1] + 1); y++) {
                        if (field[to].matrix[x][y] == 0) {
                            field[to].matrix[x][y] = 4;
                            console.log(x, y);

                            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${to}"]`);
                            cell.setAttribute('class', 'cell died-cell');
                        }
                    }
                }
            }
        }
    }

    return 1;
}

const enemy_tbody = document.querySelector('#enemy-table');
enemy_tbody.addEventListener('click', function (e) {
    const cell = e.target.closest('td');
    if (!cell) { return; } // not clicked on a cell
    let x = cell.getAttribute("data-x"), y = cell.getAttribute("data-y");

    let res = attack(x, y, 1);
    console.log(`Clicked at (${x}, ${y}) - ${res}`);

    while (current_step == 1) {
        let x = randomNumber(0, 9), y = randomNumber(0, 9);
        attack(x, y, 0);
    }
});

let status_object = document.getElementById('status-message');
status_object.innerHTML = "Ваш ход.";

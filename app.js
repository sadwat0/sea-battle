'use strict';

window.onload = (event) => {
    function randomNumber(a, b) { // [a; b)
        return Math.floor(Math.random() * (b - a) + a)
    }

    let status_object = document.getElementById('status-message');
    function setStatus(status) {
        status_object.innerHTML = status;
    }

    /* --- Creating empty tables --- */
    function createTable(tableName, fieldName, owner) {
        let ourBattleFieldTable = document.getElementById(tableName);
        let table1 = document.createElement('table');
        for (let i = 0; i < 10; i++) {
            let tr = document.createElement('tr');
            for (let j = 0; j < 10; j++) {
                let td = document.createElement('td');

                td.setAttribute('class', 'cell');
                td.setAttribute('data-x', i);
                td.setAttribute('data-y', j);
                td.setAttribute('data-owner', owner);
                tr.appendChild(td);
            }

            table1.appendChild(tr);
        }
        ourBattleFieldTable.appendChild(table1);

        table1.setAttribute('cellspacing', '0');
        document.getElementById(fieldName).appendChild(ourBattleFieldTable);
    }
    createTable('self-table', 'self-field', 0);
    createTable('enemy-table', 'enemy-field', 1);



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
            this.owner = owner;
            this.isShipsVisible = false;
            this.ships_remained = START_SHIPS_COUNT.reduce((partialSum, a) => partialSum + a, 0);;
            this.matrix = Array(10).fill().map(() => Array(10).fill(0));
            this.ship_cover = Array(10).fill().map(() => Array(10).fill(-1));
            this.ships_health = [];
            this.ships_cells = [];
        }

        createField(showShips) {
            this.isShipsVisible = showShips;

            for (let i = 1; i < START_SHIPS_COUNT.length; i++) {
                for (let j = 0; j < START_SHIPS_COUNT[i]; j++) {
                    let x = randomNumber(0, 10), y = randomNumber(0, 10);
                    let direction = randomNumber(0, 2);

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

                        if (showShips) {
                            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                            cell.setAttribute('class', 'cell ship-cell');
                        }

                        x += DELTA_X[direction];
                        y += DELTA_Y[direction];
                    }
                }
            }
        }

        changeShipsVisibility() {
            this.isShipsVisible ^= 1;

            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (this.matrix[i][j] == 1) {
                        let cell = document.querySelector(`[data-x="${i}"][data-y="${j}"][data-owner="${this.owner}"]`);

                        if (this.isShipsVisible) {
                            cell.setAttribute('class', 'cell ship-cell');
                        } else {
                            cell.setAttribute('class', 'cell');
                        }
                    }
                }
            }
        }

        attack(x, y) {
            /*
                0 - not attacked
                1 - missed
                2 - hitted ship
                3 - destroyed ship
            */

            if (x < 0 || x >= 10 || y < 0 || y >= 10) {
                return 0;
            }

            if (this.owner == currentStep) {
                return 0; // not our step
            }

            let state = this.matrix[x][y];
            if (state != 0 && state != 1) {
                return 0; // already attacked cell
            }

            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
            if (state == 0) {
                cell.setAttribute('class', 'cell missed-cell');
                this.matrix[x][y] = 2;
                currentStep ^= 1;

                return 1;
            } else {
                cell.setAttribute('class', 'cell died-ship-cell')
                this.matrix[x][y] = 3;

                let ship = this.ship_cover[x][y];
                this.ships_health[ship]--;

                // we destroyed ship => need to destroy nearby cells
                if (this.ships_health[ship] == 0) {
                    for (let i = 0; i < this.ships_cells[ship].length; i++) {
                        let p = this.ships_cells[ship][i];

                        for (let x = Math.max(0, p[0] - 1); x <= Math.min(9, p[0] + 1); x++) {
                            for (let y = Math.max(0, p[1] - 1); y <= Math.min(9, p[1] + 1); y++) {
                                if (this.matrix[x][y] == 0) {
                                    this.matrix[x][y] = 4;

                                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                                    cell.setAttribute('class', 'cell died-cell');
                                }
                            }
                        }
                    }

                    this.ships_remained--;

                    if (this.ships_remained == 0) {
                        setStatus(`Победил ${(this.owner ? "игрок" : "компьютер")}.`);
                    }

                    return 3;
                }

                return 2;
            }
        }

        clearField() {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    let cell = document.querySelector(`[data-x="${i}"][data-y="${j}"][data-owner="${this.owner}"]`);
                    cell.setAttribute('class', 'cell');
                    this.matrix[i][j] = 4;
                }
            }
        }
    }

    let field = [new Field(0), new Field(1)];
    field[0].createField(1);
    field[1].createField(0);

    let currentStep = 0; // 0 - this player, 1 - enemy
    let pastBotSteps = [];

    // Detecting all player clicks
    const enemy_tbody = document.querySelector('#enemy-table');
    enemy_tbody.addEventListener('click', function (e) {
        const cell = e.target.closest('td');
        if (!cell) { return; } // not clicked on a cell
        let x = cell.getAttribute("data-x"), y = cell.getAttribute("data-y");

        let player_step = field[1].attack(x, y);
        // console.log(`Clicked at (${x}, ${y}) - ${res}`);

        // Bot need to attack too
        while (currentStep == 1 && field[0].ships_remained && field[1].ships_remained) {
            while (currentStep == 1 && pastBotSteps.length > 0) {
                let attacked = false;

                let pastBotStep = pastBotSteps[pastBotSteps.length - 1];
                let possibleSteps = [];
                if (pastBotStep[2] == 0) {
                    possibleSteps = [
                        [pastBotStep[0] - 1, pastBotStep[1]],
                        [pastBotStep[0] + 1, pastBotStep[1]],
                        [pastBotStep[0], pastBotStep[1] - 1],
                        [pastBotStep[0], pastBotStep[1] + 1]
                    ];
                } else {
                    possibleSteps = [
                        [pastBotStep[0], pastBotStep[1] - 1],
                        [pastBotStep[0], pastBotStep[1] + 1],
                        [pastBotStep[0] - 1, pastBotStep[1]],
                        [pastBotStep[0] + 1, pastBotStep[1]]
                    ];
                }

                for (let i = 0; i < possibleSteps.length; i++) {
                    // if we attacked already it's not our turn and we don't attack again, so we don't need to break from cycle
                    let res = field[0].attack(possibleSteps[i][0], possibleSteps[i][1]);
                    if (res > 0) {
                        attacked = true;
                    }

                    if (res == 2) {
                        console.log(pastBotStep);
                        console.log(possibleSteps[i]);

                        pastBotSteps.push([possibleSteps[i][0], possibleSteps[i][1],
                        (pastBotStep[2] == -1 ? (pastBotStep[2] >= 2 ? 1 : 0) : pastBotStep[2])]);
                    }
                }

                if (!attacked) {
                    pastBotSteps.pop();
                }
            }

            let x = randomNumber(0, 10), y = randomNumber(0, 10);
            let res = field[0].attack(x, y);
            if (res == 2) {
                pastBotSteps.push([x, y, -1]);
            }
        }
    });

    setStatus("Ваш ход.");

    function changeShipsVisibility() {
        field[1].changeShipsVisibility();
    }
    document.getElementById('button-hide').onclick = changeShipsVisibility;

    function createNewMap() {
        field[0].clearField();
        field[1].clearField();
        
        field = [new Field(0), new Field(1)];
        field[0].createField(1);
        field[1].createField(0);
        setStatus("Ваш ход.");
    }
    document.getElementById('button-reload').onclick = createNewMap;
};

'use strict';

const CELL_WIDTH = 36;
const START_SHIPS_COUNT = [0, 4, 3, 2, 1]; // START_SHIPS_COUNT[x] - count of ships len x
const SHIPS_HEALTH = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4];
const DELTA_X = [1, 0], DELTA_Y = [0, 1]; // from direction get shift

window.onload = (event) => {
    function randomNumber(a, b) { // [a; b)
        return Math.floor(Math.random() * (b - a) + a)
    }

    let status_object = document.getElementById('status-message');
    function setStatus(status) {
        status_object.innerHTML = status;
    }

    /* --- Creating empty tables --- */
    let hdrMarks = " ABCDEFGHIJ";
    function createTable(tableName, fieldName, owner) {
        let battleFieldTable = document.getElementById(tableName);
        let table1 = document.createElement('table');

        // create header
        let trh = document.createElement('tr');
        for (let i = 0; i <= 10; i++) {
            let td = document.createElement('td');
            td.setAttribute('class', 'cell-hdr');
            if (i > 0) td.setAttribute('class', 'cell-hdr cell-border-row');
            td.innerText = hdrMarks[i];
            trh.append(td);
        }
        table1.appendChild(trh);

        // create rows
        for (let i = 1; i <= 10; i++) {
            let tr = document.createElement('tr');
            for (let j = 0; j <= 10; j++) {
                let td = document.createElement('td');
                if (j === 0) {
                    td.setAttribute('class', 'cell-hdr cell-border-col');
                    td.innerText = i;
                } else {
                    td.setAttribute('class', 'cell');
                    td.setAttribute('data-x', i - 1);
                    td.setAttribute('data-y', j - 1);
                    td.setAttribute('data-owner', owner);
                    if (j === 10) {
                        td.classList.add("cell-border-col");
                    }
                    if (i === 10) {
                        td.classList.add("cell-border-row");
                    }
                }
                tr.appendChild(td);
            }

            table1.appendChild(tr);
        }
        battleFieldTable.appendChild(table1);

        table1.setAttribute('cellspacing', '0');
        document.getElementById(fieldName).appendChild(battleFieldTable);
    }
    createTable('self-table', 'self-field', 0);
    createTable('enemy-table', 'enemy-field', 1);

    let gameStarted = 0;
    let placedShips = 0;
    function updatePlacedShips(cnt) {
        placedShips = cnt;
        let elem = document.getElementById("enemy-field"); 
        if (placedShips == 10)
            elem.removeAttribute('disabled');
        else
            elem.setAttribute('disabled', '');
    }

    /* --- Main game --- */
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
            this.ships_remained = 1 + 2 + 3 + 4;
            this.matrix = Array(10).fill().map(() => Array(10).fill(0));
            this.ship_cover = Array(10).fill().map(() => Array(10).fill(-1));

            this.ships = [];
            for (let i = 1; i < START_SHIPS_COUNT.length; i++) {
                for (let j = 0; j < START_SHIPS_COUNT[i]; j++) {
                    this.ships.push({
                        health: i,
                        cells: []
                    });
                }
            }
        }

        createRandomField(showShips) {
            this.isShipsVisible = showShips;

            let shipId = 0;
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

                    let ship = {
                        health: i,
                        cells: []
                    };

                    if (this.owner == 0) {
                        // placing blue rectangle
                        let currentCell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="0"]`);
                        let resultPos = getCoords(currentCell);
                        let shipElem = document.querySelector(`[data-id="${shipId}"]`);
                        shipElem.style.position = 'absolute';
                        shipElem.style.cursor = 'pointer';   
                        if (direction == 1) {
                            shipElem.style.left = resultPos.left + 2 + 'px';
                            shipElem.style.top = resultPos.top + 2 + 'px';
                        } else {
                            shipElem.style.webkitTransform = 'rotate(90deg)';
                            shipElem.style.mozTransform = 'rotate(90deg)';
                            shipElem.style.msTransform = 'rotate(90deg)';
                            shipElem.style.oTransform = 'rotate(90deg)';
                            shipElem.style.transform = 'rotate(90deg)';

                            shipElem.style.left = resultPos.left - (ship.health - 1) * CELL_WIDTH / 2 + 2 + 'px';
                            shipElem.style.top = resultPos.top + (ship.health - 1) * CELL_WIDTH / 2 + 2 + 'px';
                        }

                        document.body.appendChild(shipElem);

                        let wasId = shipId;
                        shipElem.onclick = function () {
                            let ship = field[0].ships[wasId];
                            if (ship.cells.length == 1) return;

                            let newCells = [];

                            let wasHorizontal = ship.cells[1][1] !== ship.cells[0][1];
                            let x = ship.cells[0][0], y = ship.cells[0][1];
                            for (let k = 0; k < ship.cells.length; k++) {
                                newCells.push([x, y]);
                                if (wasHorizontal) x++;
                                else y++;
                            }

                            for (let k = 0; k < ship.cells.length; k++) {
                                field[0].matrix[ship.cells[k][0]][ship.cells[k][1]] = 0;
                            }

                            // we can rotate ship
                            if (field[0].IsCellsValid(newCells)) {
                                for (let k = 0; k < ship.cells.length; k++) {
                                    if (field[0].isShipsVisible) {
                                        let cell = document.querySelector(`[data-x="${ship.cells[k][0]}"][data-y="${ship.cells[k][1]}"][data-owner="0"]`);
                                        cell.classList.remove('ship-cell');
                                    }
                                }

                                field[0].ships[wasId].cells = newCells;
                                for (let k = 0; k < newCells.length; k++) {
                                    field[0].matrix[newCells[k][0]][newCells[k][1]] = 1;
                                    if (field[0].isShipsVisible) {
                                        let cell = document.querySelector(`[data-x="${newCells[k][0]}"][data-y="${newCells[k][1]}"][data-owner="0"]`);
                                        cell.classList.add('ship-cell');
                                    }
                                }

                                let deg = wasHorizontal ? 90 : 0;
                                shipElem.style.webkitTransform = 'rotate(' + deg + 'deg)';
                                shipElem.style.mozTransform = 'rotate(' + deg + 'deg)';
                                shipElem.style.msTransform = 'rotate(' + deg + 'deg)';
                                shipElem.style.oTransform = 'rotate(' + deg + 'deg)';
                                shipElem.style.transform = 'rotate(' + deg + 'deg)';

                                if (wasHorizontal) {
                                    shipElem.style.left = resultPos.left - (ship.health - 1) * CELL_WIDTH / 2 + 2 + 'px';
                                    shipElem.style.top = resultPos.top + (ship.health - 1) * CELL_WIDTH / 2 + 2 + 'px';
                                } else {
                                    shipElem.style.left = resultPos.left + 2 + 'px';
                                    shipElem.style.top = resultPos.top + 2 + 'px';
                                }
                            } else {
                                shipElem.classList.add("error-color");

                                for (let k = 0; k < ship.cells.length; k++)
                                    field[0].matrix[ship.cells[k][0]][ship.cells[k][1]] = 1;

                                setTimeout(function () {
                                    shipElem.classList.remove("error-color");
                                }, 500);
                            }
                        };
                    }

                    // placing ship at the matrix
                    for (let k = 0; k < i; k++) {
                        this.matrix[x][y] = 1;
                        ship.cells.push([x, y]);

                        // getting ship number in list
                        this.ship_cover[x][y] = shipId;

                        if (showShips) {
                            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                            cell.classList.add('ship-cell');
                        }

                        x += DELTA_X[direction];
                        y += DELTA_Y[direction];
                    }

                    this.ships[shipId++] = ship;
                }
            }

            if (this.owner == 0) updatePlacedShips(10);
        }
        
        IsCellsValid(cells) {
            for (let k = 0; k < cells.length; k++) {
                let cx = cells[k][0], cy = cells[k][1];
                if (cx < 0 || cy < 0 || cx >= 10 || cy >= 10) return false;
                
                for (let X = Math.max(0, cx - 1); X <= Math.min(9, cx + 1); X++) {
                    for (let Y = Math.max(0, cy - 1); Y <= Math.min(9, cy + 1); Y++) {
                        if (this.matrix[X][Y] != 0) {
                            return false;
                        }
                    }
                }
            }
            
            return true;
        }
        
        placeShip(ship, shipId) {
            if (!this.IsCellsValid(ship.cells)) return false;
            
            for (let k = 0; k < ship.cells.length; k++) {
                let x = ship.cells[k][0], y = ship.cells[k][1];
                this.matrix[x][y] = 1;
                this.ship_cover[x][y] = shipId;
                
                if (this.isShipsVisible) {
                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                    cell.classList.add('ship-cell');
                }
            }
            
            this.ships[shipId] = ship;
            if (this.owner == 0) updatePlacedShips(placedShips + 1);
            return true;
        }

        changeShipsVisibility() {
            this.isShipsVisible ^= 1;

            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (this.matrix[i][j] == 1) {
                        let cell = document.querySelector(`[data-x="${i}"][data-y="${j}"][data-owner="${this.owner}"]`);

                        if (this.isShipsVisible) {
                            cell.classList.add('ship-cell');
                        } else {
                            cell.classList.remove('ship-cell');
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

            if (this.owner === currentStep) {
                return 0; // not our step
            }

            if (this.owner === 1) {
                if (!gameStarted) {
                    for (let i = 0; i < 10; i++) {
                        let elem = document.querySelector(`[data-id="${i}"]`);
                        elem.classList.remove('draggable');
                        elem.style.cursor = '';
                        elem.onclick = (function() {});
                    }
                }

                gameStarted = true;
            }

            let state = this.matrix[x][y];
            if (state !== 0 && state !== 1) {
                return 0; // already attacked cell
            }

            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
            if (state === 0) {
                //cell.classList.remove('died-ship-cell');
                cell.classList.add('missed-cell');
                this.matrix[x][y] = 2;
                currentStep ^= 1;

                return 1;
            } else {
                //cell.classList.remove('missed-cell');
                cell.classList.add('died-ship-cell')
                this.matrix[x][y] = 3;

                let shipId = this.ship_cover[x][y];
                this.ships[shipId].health--;

                // we destroyed ship => need to destroy nearby cells
                if (this.ships[shipId].health === 0) {
                    for (let i = 0; i < this.ships[shipId].cells.length; i++) {
                        let p = this.ships[shipId].cells[i];

                        for (let x = Math.max(0, p[0] - 1); x <= Math.min(9, p[0] + 1); x++) {
                            for (let y = Math.max(0, p[1] - 1); y <= Math.min(9, p[1] + 1); y++) {
                                if (this.matrix[x][y] == 0 || this.matrix[x][y] == 2) {
                                    this.matrix[x][y] = 4;

                                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                                    cell.classList.add('died-cell');
                                }
                            }
                        }
                    }

                    if (this.owner === 1) {
                        document.getElementById(`stat-ship-${shipId}`).classList.add('died-stats-ship');
                    }

                    this.ships_remained--;

                    if (this.ships_remained === 0) {
                        setStatus(`Победил ${(this.owner ? "игрок" : "компьютер")}.`);
                    }

                    return 3;
                }

                return 2;
            }
        }

        clearField() {
            if (this.owner === 0) {
                updatePlacedShips(0);

                // returning all ships to the start position
                let ids = [
                    "ship-1-1", "ship-1-2", "ship-1-3", "ship-1-4",
                    "ship-2-1", "ship-2-2", "ship-2-3",
                    "ship-3-1", "ship-3-2",
                    "ship-4-1"
                ];

                ids.forEach((id) => {
                    let ship = document.getElementById(id);
                    ship.style = '';
                    let to = document.getElementById(`ships-row-${id[5]}`);
                    to.appendChild(ship);
                    // ship.remove();
                });
            } else {
                for (let i = 0; i < 10; i++) {
                    document.getElementById(`stat-ship-${i}`).classList.remove('died-stats-ship');
                }
            }

            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    let cell = document.querySelector(`[data-x="${i}"][data-y="${j}"][data-owner="${this.owner}"]`);
                    // cell.setAttribute('class', 'cell');
                    cell.classList.remove('died-cell');
                    cell.classList.remove('died-ship-cell');
                    cell.classList.remove('ship-cell');
                    cell.classList.remove('missed-cell');
                    this.matrix[i][j] = 4;
                }
            }
        }
    }

    let field = [new Field(0), new Field(1)];
    field[1].createRandomField(0);
    setStatus("Расставьте корабли.");
    // field[0].isShipsVisible = true;
    // field[0].createField(1);

    let currentStep = 0; // 0 - this player, 1 - enemy
    let pastBotSteps = [];

    // Detecting all player clicks
    const enemy_tbody = document.querySelector('#enemy-table');
    enemy_tbody.addEventListener('click', function (e) {
        const cell = e.target.closest('td');
        if (!cell) return; // not clicked on a cell

        let x = cell.getAttribute("data-x"), y = cell.getAttribute("data-y");
        field[1].attack(x, y);

        // Bot needs to attack too
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

    /* --- Some functions --- */
    function changeShipsVisibility() {
        field[1].changeShipsVisibility();
    }
    document.getElementById('button-hide').onclick = changeShipsVisibility;

    function createNewMap() {
        field[0].clearField();
        field[1].clearField();

        field = [new Field(0), new Field(1)];
        field[0].createRandomField(0);
        field[1].createRandomField(0);
        updatePlacedShips(10);
        setStatus("Ваш ход.");
    }
    document.getElementById('button-reload').onclick = createNewMap;


    /* --- Dragable ships --- */
    let DragManager = new function () {
        /**
         * составной объект для хранения информации о переносе:
         * {
         *   elem - элемент, на котором была зажата мышь
         *   avatar - аватар
         *   downX/downY - координаты, на которых был mousedown
         *   shiftX/shiftY - относительный сдвиг курсора от угла элемента
         * }
         */
        let dragObject = {};
        let self = this;

        function hideGreenShip() {
            if (dragObject.elem) {
                let shipLength = SHIPS_HEALTH[dragObject.elem.getAttribute("data-id")];
                let greenShip = document.getElementById(`green-ship-${shipLength}`);
                greenShip.classList.add('hidden');
            }
        }

        function onMouseDown(e) {
            if (e.which != 1) return;

            let elem = e.target.closest('.draggable');
            if (!elem) return;

            dragObject.elem = elem;

            // запомним, что элемент нажат на текущих координатах pageX/pageY
            dragObject.downX = e.pageX;
            dragObject.downY = e.pageY;

            return false;
        }

        function onMouseMove(e) {
            if (!dragObject.elem) return;

            if (!dragObject.avatar) {
                let moveX = e.pageX - dragObject.downX;
                let moveY = e.pageY - dragObject.downY;

                if (Math.abs(moveX) < 6 && Math.abs(moveY) < 6) {
                    return;
                }

                dragObject.avatar = createAvatar(e);
                if (!dragObject.avatar) {
                    dragObject = {};
                    return;
                }

                let coords = getCoords(dragObject.avatar);
                dragObject.shiftX = dragObject.downX - coords.left;
                dragObject.shiftY = dragObject.downY - coords.top;

                startDrag(e);
            }

            dragObject.avatar.style.left = e.pageX - dragObject.shiftX + 'px';
            dragObject.avatar.style.top = e.pageY - dragObject.shiftY + 'px';

            let dropElem = findDroppable(e);
            if (dropElem && dragObject.elem) {
                let currentShip = dragObject.elem;
                let shipCoords = getCoords(currentShip);

                let X = e.clientX, Y = e.clientY;

                let horizontalShift = Math.floor((X - shipCoords.left) / CELL_WIDTH);
                let verticalShift = Math.floor((Y - shipCoords.top) / CELL_WIDTH);

                let shipLength = SHIPS_HEALTH[dragObject.elem.getAttribute("data-id")];

                let x = dropElem.getAttribute("data-x") - verticalShift,
                    y = dropElem.getAttribute("data-y") - horizontalShift;
                let cellUnderMouse = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="0"]`);
                if (!cellUnderMouse || dropElem.getAttribute("data-owner") == 1) {
                    hideGreenShip();
                    return false;
                }

                let resultPos = getCoords(cellUnderMouse);

                let cells = [];
                for (let k = 0; k < shipLength; k++)
                    cells.push([x, y++]);

                if (!field[0].IsCellsValid(cells)) {
                    hideGreenShip();
                    return false;
                }
                
                let greenShip = document.getElementById(`green-ship-${shipLength}`);
                greenShip.style.left = resultPos.left + 2 + 'px';
                greenShip.style.top = resultPos.top + 2 + 'px';
                greenShip.classList.remove('hidden');
            } else {
                hideGreenShip();
            }

            return false;
        }

        function onMouseUp(e) {
            if (dragObject.avatar)
                finishDrag(e);

            dragObject = {};
        }

        function finishDrag(e) {
            let dropElem = findDroppable(e);
            if (!dropElem) {
                self.onDragCancel(dragObject);
            } else {
                self.onDragEnd(dragObject, dropElem, e);
            }
            hideGreenShip();
        }

        function createAvatar(e) {
            let avatar = dragObject.elem;
            let old = {
                parent: avatar.parentNode,
                nextSibling: avatar.nextSibling,
                position: avatar.position || '',
                left: avatar.left || '',
                top: avatar.top || '',
                zIndex: avatar.zIndex || ''
            };

            avatar.rollback = function () {
                old.parent.insertBefore(avatar, old.nextSibling);
                avatar.style.position = old.position;
                avatar.style.left = old.left;
                avatar.style.top = old.top;
                avatar.style.zIndex = old.zIndex
            };

            return avatar;
        }

        function startDrag(e) {
            let avatar = dragObject.avatar;

            // инициировать начало переноса
            document.body.appendChild(avatar);
            avatar.style.zIndex = 9999;
            avatar.style.position = 'absolute';

            let shipId = dragObject.elem.getAttribute("data-id");
            let ship = field[0].ships[shipId];

            for (let i = 0; i < ship.cells.length; i++)
                field[0].matrix[ship.cells[i][0]][ship.cells[i][1]] = 0;

            if (ship.cells.length)
                updatePlacedShips(placedShips - 1);

            let elem = dragObject.elem;
            elem.style.webkitTransform = 'rotate(0deg)';
            elem.style.mozTransform = 'rotate(0deg)';
            elem.style.msTransform = 'rotate(0deg)';
            elem.style.oTransform = 'rotate(0deg)';
            elem.style.transform = 'rotate(0deg)';
        }

        function findDroppable(event) {
            dragObject.avatar.hidden = true;

            let elems = document.elementsFromPoint(event.clientX, event.clientY);
            let elem = null;
            elems.forEach((el, i) => {
                if (el.classList.contains('cell')) {
                    elem = el;
                }
            });

            dragObject.avatar.hidden = false;

            if (elem === null) return null;

            let res = elem.closest('.cell');
            return res;
        }

        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
        document.onmousedown = onMouseDown;

        this.onDragEnd = function (dragObject, dropElem, e) { };
        this.onDragCancel = function (dragObject) { };
    };

    function getCoords(elem) {
        let box = elem.getBoundingClientRect();

        return {
            left: Math.round(box.left + pageXOffset),
            top: Math.round(box.top + pageYOffset),
        };
    }

    DragManager.onDragCancel = function (dragObject) {
        dragObject.avatar.rollback();
        if (dragObject.elem) {
            let shipId = dragObject.elem.getAttribute("data-id");
            let shipLength = SHIPS_HEALTH[shipId];
            document.getElementById(`ships-row-${shipLength}`).appendChild(dragObject.elem);
            
            field[0].ships[shipId].cells = [];
        }
    };

    DragManager.onDragEnd = function (dragObject, dropElem, e) {
        let currentShip = dragObject.elem;
        let shipCoords = getCoords(currentShip);

        let X = e.clientX, Y = e.clientY;

        let horizontalShift = Math.floor((X - shipCoords.left) / CELL_WIDTH);
        let verticalShift = Math.floor((Y - shipCoords.top) / CELL_WIDTH);
        
        let x = dropElem.getAttribute("data-x") - verticalShift,
        y = dropElem.getAttribute("data-y") - horizontalShift;
        let cellUnderMouse = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="0"]`);
        if (!cellUnderMouse || dropElem.getAttribute("data-owner") == 1) {
            DragManager.onDragCancel(dragObject);
            return;
        }
        
        let shipId = dragObject.elem.getAttribute("data-id");
        let ship = {
            health: SHIPS_HEALTH[shipId],
            cells: [],
        }

        let resultPos = getCoords(cellUnderMouse);

        for (let k = 0; k < ship.health; k++)
            ship.cells.push([x, y++]);

        if (!field[0].IsCellsValid(ship.cells)) {
            DragManager.onDragCancel(dragObject);
            return;
        }

        field[0].placeShip(ship, shipId);
        // currentShip.classList.remove('draggable');
        dragObject.avatar.style.left = resultPos.left + 2 + 'px';
        dragObject.avatar.style.top = resultPos.top + 2 + 'px';

        dragObject.avatar.style.cursor = 'pointer';

        // rotation
        currentShip.onclick = function() {
            let ship = field[0].ships[shipId];
            if (ship.cells.length == 1) return;

            let newCells = [];

            let wasHorizontal = ship.cells[1][1] !== ship.cells[0][1];
            let x = ship.cells[0][0], y = ship.cells[0][1];
            for (let k = 0; k < ship.cells.length; k++) {
                newCells.push([x, y]);
                if (wasHorizontal) x++;
                else y++;
            }

            for (let k = 0; k < ship.cells.length; k++) {
                field[0].matrix[ship.cells[k][0]][ship.cells[k][1]] = 0;
            }

            // we can rotate ship
            if (field[0].IsCellsValid(newCells)) {
                for (let k = 0; k < ship.cells.length; k++) {
                    if (field[0].isShipsVisible) {
                        let cell = document.querySelector(`[data-x="${ship.cells[k][0]}"][data-y="${ship.cells[k][1]}"][data-owner="0"]`);
                        cell.classList.remove('ship-cell');
                    }
                }
                
                field[0].ships[shipId].cells = newCells;
                for (let k = 0; k < newCells.length; k++) {
                    field[0].matrix[newCells[k][0]][newCells[k][1]] = 1;
                    if (field[0].isShipsVisible) {
                        let cell = document.querySelector(`[data-x="${newCells[k][0]}"][data-y="${newCells[k][1]}"][data-owner="0"]`);
                        cell.classList.add('ship-cell');
                    }
                }

                let deg = wasHorizontal ? 90 : 0;
                currentShip.style.webkitTransform = 'rotate(' + deg + 'deg)';
                currentShip.style.mozTransform = 'rotate(' + deg + 'deg)';
                currentShip.style.msTransform = 'rotate(' + deg + 'deg)';
                currentShip.style.oTransform = 'rotate(' + deg + 'deg)';
                currentShip.style.transform = 'rotate(' + deg + 'deg)';

                if (wasHorizontal) {
                    dragObject.avatar.style.left = resultPos.left - (ship.health - 1) * CELL_WIDTH / 2 + 2 + 'px';
                    dragObject.avatar.style.top = resultPos.top + (ship.health - 1) * CELL_WIDTH / 2 + 2 + 'px';
                } else {
                    dragObject.avatar.style.left = resultPos.left + 2 + 'px';
                    dragObject.avatar.style.top = resultPos.top + 2 + 'px';
                }
            } else {
                dragObject.elem.classList.add("error-color");

                for (let k = 0; k < ship.cells.length; k++)
                    field[0].matrix[ship.cells[k][0]][ship.cells[k][1]] = 1;

                setTimeout(function () {
                    dragObject.elem.classList.remove("error-color");
                }, 500); 
            }
        };
    };
};


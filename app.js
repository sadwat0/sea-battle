'use strict';

const CELL_WIDTH = 36;

window.onload = (event) => {
    function randomNumber(a, b) { // [a; b)
        return Math.floor(Math.random() * (b - a) + a)
    }

    let status_object = document.getElementById('status-message');
    function setStatus(status) {
        status_object.innerHTML = status;
    }

    /* --- Creating empty tables --- */
    let hdrMarks = " abcdefghij";
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
            this.ships_remained = START_SHIPS_COUNT.reduce((partialSum, a) => partialSum + a, 0);
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

                        // getting ship number in list
                        this.ship_cover[x][y] = this.ships_health.length - 1;

                        if (showShips) {
                            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                            cell.classList.add('ship-cell');
                        }

                        x += DELTA_X[direction];
                        y += DELTA_Y[direction];
                    }
                }
            }
        }

        placeShip(cells, health) {
            this.ships_health.push(health)
            this.ships_cells.push(cells)

            for (let k = 0; k < cells.length; k++) {
                let x = cells[k][0], y = cells[k][1];
                this.matrix[x][y] = 1;
                this.ship_cover[x][y] = this.ships_health.length - 1;

                if (this.isShipsVisible) {
                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                    cell.classList.add('ship-cell');
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

            if (this.owner == currentStep) {
                return 0; // not our step
            }

            let state = this.matrix[x][y];
            if (state != 0 && state != 1) {
                return 0; // already attacked cell
            }

            let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
            if (state == 0) {
                //cell.classList.remove('died-ship-cell');
                cell.classList.add('missed-cell');
                this.matrix[x][y] = 2;
                currentStep ^= 1;

                return 1;
            } else {
                //cell.classList.remove('missed-cell');
                cell.classList.add('died-ship-cell')
                this.matrix[x][y] = 3;

                let ship = this.ship_cover[x][y];
                this.ships_health[ship]--;

                // we destroyed ship => need to destroy nearby cells
                if (this.ships_health[ship] == 0) {
                    for (let i = 0; i < this.ships_cells[ship].length; i++) {
                        let p = this.ships_cells[ship][i];

                        for (let x = Math.max(0, p[0] - 1); x <= Math.min(9, p[0] + 1); x++) {
                            for (let y = Math.max(0, p[1] - 1); y <= Math.min(9, p[1] + 1); y++) {
                                if (this.matrix[x][y] == 0 || this.matrix[x][y] == 2) {
                                    this.matrix[x][y] = 4;

                                    let cell = document.querySelector(`[data-x="${x}"][data-y="${y}"][data-owner="${this.owner}"]`);
                                    // cell.setAttribute('class', 'cell died-cell');
                                    cell.classList.add('died-cell');
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
    // field[0].isShipsVisible = true;
    // field[0].createField(1);
    // field[1].createField(0);

    let currentStep = 0; // 0 - this player, 1 - enemy
    let pastBotSteps = [];

    // Detecting all player clicks
    const enemy_tbody = document.querySelector('#enemy-table');
    enemy_tbody.addEventListener('click', function (e) {
        const cell = e.target.closest('td');
        if (!cell) return; // not clicked on a cell
        let x = cell.getAttribute("data-x"), y = cell.getAttribute("data-y");

        let playerStepRes = field[1].attack(x, y);
        // console.log(`Clicked at (${x}, ${y}) - ${res}`);


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

    /* --- Some functions --- */
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


    let startCoords = getCoords(document.querySelector(`[data-x="1"][data-y="1"][data-owner="0"]`));
    console.log(`startCoords: ${startCoords.left}, ${startCoords.top}`);


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
            if (!dragObject.elem) return; // элемент не зажат

            if (!dragObject.avatar) { // если перенос не начат...
                let moveX = e.pageX - dragObject.downX;
                let moveY = e.pageY - dragObject.downY;

                // если мышь передвинулась в нажатом состоянии недостаточно далеко
                if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) {
                    return;
                }

                // начинаем перенос
                dragObject.avatar = createAvatar(e); // создать аватар
                if (!dragObject.avatar) { // отмена переноса, нельзя "захватить" за эту часть элемента
                    dragObject = {};
                    return;
                }

                // аватар создан успешно
                // создать вспомогательные свойства shiftX/shiftY
                let coords = getCoords(dragObject.avatar);
                dragObject.shiftX = dragObject.downX - coords.left;
                dragObject.shiftY = dragObject.downY - coords.top;

                startDrag(e); // отобразить начало переноса
            }

            // отобразить перенос объекта при каждом движении мыши
            dragObject.avatar.style.left = e.pageX - dragObject.shiftX + 'px';
            dragObject.avatar.style.top = e.pageY - dragObject.shiftY + 'px';

            return false;
        }

        function onMouseUp(e) {
            if (dragObject.avatar) { // если перенос идет
                finishDrag(e);
            }

            // перенос либо не начинался, либо завершился
            // в любом случае очистим "состояние переноса" dragObject
            dragObject = {};
        }

        function finishDrag(e) {
            let dropElem = findDroppable(e);
            if (!dropElem) {
                self.onDragCancel(dragObject);
            } else {
                self.onDragEnd(dragObject, dropElem, e);
            }
        }

        function createAvatar(e) {

            // запомнить старые свойства, чтобы вернуться к ним при отмене переноса
            let avatar = dragObject.elem;
            let old = {
                parent: avatar.parentNode,
                nextSibling: avatar.nextSibling,
                position: avatar.position || '',
                left: avatar.left || '',
                top: avatar.top || '',
                zIndex: avatar.zIndex || ''
            };

            // функция для отмены переноса
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

            if (elem === null) {
                // такое возможно, если курсор мыши "вылетел" за границу окна
                return null;
            }

            let res = elem.closest('.cell');
            return res;
        }

        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
        document.onmousedown = onMouseDown;

        this.onDragEnd = function(dragObject, dropElem, e) { };
        this.onDragCancel = function (dragObject) { };
    };


    function getCoords(elem) { // кроме IE8-
        let box = elem.getBoundingClientRect();

        return {
            left: Math.round(box.left + pageXOffset),
            top: Math.round(box.top + pageYOffset),
        };
    }

    DragManager.onDragCancel = function(dragObject) {
        dragObject.avatar.rollback();
        // console.log('canceled');
    };

    DragManager.onDragEnd = function(dragObject, dropElem, e) {
        // console.log('ended');

        let currentShip = dragObject.elem;
        let shipCoords = getCoords(currentShip);

        let X = e.clientX, Y = e.clientY;
        console.log(X, Y);

        let horizontalShift = Math.floor((X - shipCoords.left) / CELL_WIDTH);
        let verticalShift = Math.floor((Y - shipCoords.top) / CELL_WIDTH);
        console.log(horizontalShift, verticalShift);
        console.log(dropElem);

        let shipId = currentShip.id;
        let health = shipId[5];
        let cells = [];

        let x = dropElem.getAttribute("data-x") - verticalShift, 
            y = dropElem.getAttribute("data-y") - horizontalShift;
        console.log(x, y);

        let isHorizontal = true;
        for (let k = 0; k < health; k++) {
            cells.push([x, y]);

            if (isHorizontal) y++;
            else x++;
        }

        field[0].placeShip(cells, health);

        currentShip.classList.remove('draggable');
    };
};

const canvas = document.getElementById("diagramCanvas");
const viewport = document.getElementById("diagramViewport");

const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetButton = document.getElementById("resetView");
const zoomLabel = document.getElementById("zoomLevel");


/* =========================================
   ZOOM
========================================= */

let zoom = 1;

let panX = 0;
let panY = 0;

let isPanning = false;

let panStartX = 0;
let panStartY = 0;

let originalPanX = 0;
let originalPanY = 0;


/* =========================================
   TABLES
========================================= */

const tables = {
    users: document.getElementById("users"),
    students: document.getElementById("students"),
    announcements: document.getElementById("announcements"),
    gate_logs: document.getElementById("gate_logs")
};


/* =========================================
   INITIAL POSITIONS
========================================= */

const initialPositions = {
    users: {
        x: 80,
        y: 100
    },

    students: {
        x: 520,
        y: 70
    },

    announcements: {
        x: 80,
        y: 650
    },

    gate_logs: {
        x: 970,
        y: 550
    }
};


/* =========================================
   SET POSITIONS
========================================= */

function setInitialPositions() {

    for (const id in initialPositions) {

        const table = tables[id];

        if (!table) {
            continue;
        }

        table.style.left =
            initialPositions[id].x + "px";

        table.style.top =
            initialPositions[id].y + "px";
    }
}


/* =========================================
   UPDATE CANVAS
========================================= */

function updateCanvas() {

    canvas.style.transform =
        "translate(" +
        panX +
        "px, " +
        panY +
        "px) scale(" +
        zoom +
        ")";

    zoomLabel.textContent =
        Math.round(zoom * 100) + "%";

    updateRelationships();
}


/* =========================================
   ZOOM IN
========================================= */

zoomInButton.addEventListener("click", function () {

    zoom += 0.1;

    if (zoom > 2) {
        zoom = 2;
    }

    updateCanvas();
});


/* =========================================
   ZOOM OUT
========================================= */

zoomOutButton.addEventListener("click", function () {

    zoom -= 0.1;

    if (zoom < 0.5) {
        zoom = 0.5;
    }

    updateCanvas();
});


/* =========================================
   MOUSE WHEEL ZOOM
========================================= */

viewport.addEventListener("wheel", function (event) {

    event.preventDefault();

    if (event.deltaY < 0) {
        zoom += 0.05;
    } else {
        zoom -= 0.05;
    }

    if (zoom > 2) {
        zoom = 2;
    }

    if (zoom < 0.5) {
        zoom = 0.5;
    }

    updateCanvas();

}, { passive: false });


/* =========================================
   RESET
========================================= */

resetButton.addEventListener("click", function () {

    zoom = 1;

    panX = 0;
    panY = 0;

    setInitialPositions();

    updateCanvas();
});


/* =========================================
   PAN DIAGRAM
========================================= */

viewport.addEventListener("mousedown", function (event) {

    if (event.target.closest(".entity-card")) {
        return;
    }

    isPanning = true;

    viewport.classList.add("grabbing");

    panStartX = event.clientX;
    panStartY = event.clientY;

    originalPanX = panX;
    originalPanY = panY;
});


window.addEventListener("mousemove", function (event) {

    if (!isPanning) {
        return;
    }

    const deltaX =
        event.clientX - panStartX;

    const deltaY =
        event.clientY - panStartY;

    panX =
        originalPanX + deltaX;

    panY =
        originalPanY + deltaY;

    updateCanvas();
});


window.addEventListener("mouseup", function () {

    isPanning = false;

    viewport.classList.remove("grabbing");
});


/* =========================================
   DRAG TABLES
========================================= */

Object.values(tables).forEach(function (table) {

    if (!table) {
        return;
    }

    const header =
        table.querySelector(".entity-header");

    if (!header) {
        return;
    }

    let dragging = false;

    let startMouseX = 0;
    let startMouseY = 0;

    let startTableX = 0;
    let startTableY = 0;


    header.addEventListener("mousedown", function (event) {

        event.preventDefault();
        event.stopPropagation();

        dragging = true;

        startMouseX =
            event.clientX;

        startMouseY =
            event.clientY;

        startTableX =
            parseFloat(table.style.left) || 0;

        startTableY =
            parseFloat(table.style.top) || 0;

        table.style.zIndex = "100";
    });


    window.addEventListener("mousemove", function (event) {

        if (!dragging) {
            return;
        }

        const deltaX =
            (event.clientX - startMouseX) / zoom;

        const deltaY =
            (event.clientY - startMouseY) / zoom;

        table.style.left =
            startTableX + deltaX + "px";

        table.style.top =
            startTableY + deltaY + "px";

        updateRelationships();
    });


    window.addEventListener("mouseup", function () {

        if (!dragging) {
            return;
        }

        dragging = false;

        table.style.zIndex = "10";
    });

});


/* =========================================
   GET TABLE RECTANGLE
========================================= */

function getTableRect(table) {

    return {
        left:
            parseFloat(table.style.left) || 0,

        top:
            parseFloat(table.style.top) || 0,

        width:
            table.offsetWidth,

        height:
            table.offsetHeight
    };
}


/* =========================================
   GET CONNECTION POINT
========================================= */

function getConnectionPoint(source, target) {

    const sourceRect =
        getTableRect(source);

    const targetRect =
        getTableRect(target);


    const sourceCenterX =
        sourceRect.left +
        sourceRect.width / 2;

    const sourceCenterY =
        sourceRect.top +
        sourceRect.height / 2;


    const targetCenterX =
        targetRect.left +
        targetRect.width / 2;

    const targetCenterY =
        targetRect.top +
        targetRect.height / 2;


    const deltaX =
        targetCenterX - sourceCenterX;

    const deltaY =
        targetCenterY - sourceCenterY;


    let x = sourceCenterX;
    let y = sourceCenterY;


    if (Math.abs(deltaX) > Math.abs(deltaY)) {

        if (deltaX > 0) {

            x =
                sourceRect.left +
                sourceRect.width;

        } else {

            x =
                sourceRect.left;
        }

    } else {

        if (deltaY > 0) {

            y =
                sourceRect.top +
                sourceRect.height;

        } else {

            y =
                sourceRect.top;
        }
    }


    return {
        x: x,
        y: y
    };
}


/* =========================================
   CONNECT TABLES
========================================= */

function connectTables(lineId, source, target) {

    const line =
        document.getElementById(lineId);

    if (!line || !source || !target) {
        return;
    }


    const start =
        getConnectionPoint(
            source,
            target
        );

    const end =
        getConnectionPoint(
            target,
            source
        );


    line.setAttribute(
        "x1",
        start.x
    );

    line.setAttribute(
        "y1",
        start.y
    );

    line.setAttribute(
        "x2",
        end.x
    );

    line.setAttribute(
        "y2",
        end.y
    );
}


/* =========================================
   UPDATE RELATIONSHIPS
========================================= */

function updateRelationships() {

    /* students.user_id -> users.id */

    connectTables(
        "lineStudentsUsers",
        tables.students,
        tables.users
    );


    /* announcements.posted_by -> users.id */

    connectTables(
        "lineAnnouncementsUsers",
        tables.announcements,
        tables.users
    );


    /* gate_logs.student_id -> students.id */

    connectTables(
        "lineGateStudent",
        tables.gate_logs,
        tables.students
    );


    /* gate_logs.guard_id -> users.id */

    connectTables(
        "lineGateGuard",
        tables.gate_logs,
        tables.users
    );
}


/* =========================================
   START
========================================= */

setInitialPositions();

updateCanvas();


/* =========================================
   WINDOW RESIZE
========================================= */

window.addEventListener("resize", function () {

    updateRelationships();

});
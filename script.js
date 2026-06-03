"use strict";

const brett = document.getElementById("schachbrett");
const startMenu = document.getElementById("start-menu");
const endScreen = document.getElementById("end-screen");
const endMessage = document.getElementById("end-message");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

// Startaufstellung (Weiß = Großbuchstaben, Schwarz = Kleinbuchstaben)
let spielfeld = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

const figurenSymbole = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙',
    '': ''
};

let aktuellerSpieler = "WEISS"; 
let ausgewaehltesFeld = null;   

function brettZeichnen() {
    brett.innerHTML = "";
    for (let z = 0; z < 8; z++) {
        for (let s = 0; s < 8; s++) {
            const feld = document.createElement("div");
            feld.classList.add("feld");
            feld.classList.add((z + s) % 2 === 0 ? "weiss" : "schwarz");
            
            const figur = spielfeld[z][s];
            feld.innerText = figurenSymbole[figur];
            
            feld.dataset.zeile = z;
            feld.dataset.spalte = s;
            
            if (ausgewaehltesFeld && ausgewaehltesFeld.zeile === z && ausgewaehltesFeld.spalte === s) {
                feld.classList.add("ausgewaehlt");
            }
            
            feld.addEventListener("click", feldGeklickt);
            brett.appendChild(feld);
        }
    }
}

function holeFarbe(figur) {
    if (!figur) return null;
    return figur === figur.toUpperCase() ? "WEISS" : "SCHWARZ";
}

// --- REGEL-ENGINE ---
function holeErlaubteZuege(z, s, board = spielfeld) {
    const figur = board[z][s];
    const farbe = holeFarbe(figur);
    if (!farbe) return [];
    
    let zuege = [];
    const kreuzRichtungen = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const diagonalRichtungen = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    switch (figur.toUpperCase()) {
        case 'P':
            const richtung = farbe === "WEISS" ? -1 : 1;
            const startZeile = farbe === "WEISS" ? 6 : 1;
            
            if (z + richtung >= 0 && z + richtung < 8 && board[z + richtung][s] === "") {
                zuege.push({z: z + richtung, s: s});
                if (z === startZeile && board[z + richtung * 2][s] === "") {
                    zuege.push({z: z + richtung * 2, s: s});
                }
            }
            const schlagSpalten = [s - 1, s + 1];
            schlagSpalten.forEach(ss => {
                if (ss >= 0 && ss < 8 && z + richtung >= 0 && z + richtung < 8) {
                    const zielFigur = board[z + richtung][ss];
                    if (zielFigur !== "" && holeFarbe(zielFigur) !== farbe) {
                        zuege.push({z: z + richtung, s: ss});
                    }
                }
            });
            break;

        case 'R': langeZuege(z, s, kreuzRichtungen, farbe, zuege, board); break;
        case 'B': langeZuege(z, s, diagonalRichtungen, farbe, zuege, board); break;
        case 'Q': langeZuege(z, s, kreuzRichtungen.concat(diagonalRichtungen), farbe, zuege, board); break;
        case 'K':
            kreuzRichtungen.concat(diagonalRichtungen).forEach(([dz, ds]) => {
                const nz = z + dz, ns = s + ds;
                if (nz >= 0 && nz < 8 && ns >= 0 && ns < 8) {
                    if (board[nz][ns] === "" || holeFarbe(board[nz][ns]) !== farbe) {
                        zuege.push({z: nz, s: ns});
                    }
                }
            });
            break;
        case 'N':
            [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]].forEach(([dz, ds]) => {
                const nz = z + dz, ns = s + ds;
                if (nz >= 0 && nz < 8 && ns >= 0 && ns < 8) {
                    if (board[nz][ns] === "" || holeFarbe(board[nz][ns]) !== farbe) {
                        zuege.push({z: nz, s: ns});
                    }
                }
            });
            break;
    }
    return zuege;
}

function langeZuege(z, s, richtungen, farbe, zuege, board) {
    richtungen.forEach(([dz, ds]) => {
        let nz = z + dz; let ns = s + ds;
        while (nz >= 0 && nz < 8 && ns >= 0 && ns < 8) {
            if (board[nz][ns] === "") {
                zuege.push({z: nz, s: ns});
            } else {
                if (holeFarbe(board[nz][ns]) !== farbe) zuege.push({z: nz, s: ns});
                break;
            }
            nz += dz; ns += ds;
        }
    });
}

// --- MATTPRÜFUNG ---
function istInSchach(farbe, board) {
    let kz = -1, ks = -1;
    const koenigChar = farbe === "WEISS" ? "K" : "k";
    
    for (let z = 0; z < 8; z++) {
        for (let s = 0; s < 8; s++) {
            if (board[z][s] === koenigChar) { kz = z; ks = s; break; }
        }
        if (kz !== -1) break;
    }
    if (kz === -1) return false;

    const gegnerFarbe = farbe === "WEISS" ? "SCHWARZ" : "WEISS";
    for (let z = 0; z < 8; z++) {
        for (let s = 0; s < 8; s++) {
            if (board[z][s] !== "" && holeFarbe(board[z][s]) === gegnerFarbe) {
                const zuege = holeErlaubteZuege(z, s, board);
                if (zuege.some(zug => zug.z === kz && zug.s === ks)) return true;
            }
        }
    }
    return false;
}

function holeEchteGueltigeZuege(z, s, board) {
    const farbe = holeFarbe(board[z][s]);
    const erlaubte = holeErlaubteZuege(z, s, board);
    let echteZuege = [];

    erlaubte.forEach(zug => {
        let ursprung = board[z][s];
        let ziel = board[zug.z][zug.s];
        board[zug.z][zug.s] = ursprung;
        board[z][s] = "";

        if (!istInSchach(farbe, board)) {
            echteZuege.push(zug);
        }

        board[z][s] = ursprung;
        board[zug.z][zug.s] = ziel;
    });
    return echteZuege;
}

function pruefeSpielende(farbe) {
    let hatAusweg = false;

    for (let z = 0; z < 8; z++) {
        for (let s = 0; s < 8; s++) {
            if (spielfeld[z][s] !== "" && holeFarbe(spielfeld[z][s]) === farbe) {
                const zuege = holeEchteGueltigeZuege(z, s, spielfeld);
                if (zuege.length > 0) { hatAusweg = true; break; }
            }
        }
        if (hatAusweg) break;
    }

    if (!hatAusweg) {
        if (istInSchach(farbe, spielfeld)) {
            if (farbe === "WEISS") {
                endMessage.innerText = "Du hast verloren! Der Computer hat dich schachmatt gesetzt.";
            } else {
                endMessage.innerText = "Glückwunsch! Du hast gewonnen und den Computer schachmatt gesetzt!";
            }
        } else {
            endMessage.innerText = "Unentschieden! Das Spiel endet im Patt.";
        }
        // Endscreen anzeigen
        endScreen.classList.remove("hidden");
        return true;
    }
    return false;
}

function spielZuruecksetzen() {
    spielfeld = [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"]
    ];
    aktuellerSpieler = "WEISS";
    ausgewaehltesFeld = null;
    brettZeichnen();
}

// --- SPIELSTEUERUNG ---
function feldGeklickt(event) {
    if (aktuellerSpieler !== "WEISS") return; 

    const z = parseInt(event.currentTarget.dataset.zeile);
    const s = parseInt(event.currentTarget.dataset.spalte);
    const figur = spielfeld[z][s];

    if (!ausgewaehltesFeld) {
        if (figur !== "" && holeFarbe(figur) === "WEISS") {
            ausgewaehltesFeld = {zeile: z, spalte: s};
            brettZeichnen();
        }
    } 
    else {
        const echteZuege = holeEchteGueltigeZuege(ausgewaehltesFeld.zeile, ausgewaehltesFeld.spalte, spielfeld);
        const zugGueltig = echteZuege.some(zug => zug.z === z && zug.s === s);

        if (zugGueltig) {
            spielfeld[z][s] = spielfeld[ausgewaehltesFeld.zeile][ausgewaehltesFeld.spalte];
            spielfeld[ausgewaehltesFeld.zeile][ausgewaehltesFeld.spalte] = "";
            
            ausgewaehltesFeld = null;
            brettZeichnen();

            if (pruefeSpielende("SCHWARZ")) return;

            aktuellerSpieler = "SCHWARZ";
            setTimeout(computerZug, 500);
        } else {
            if (figur !== "" && holeFarbe(figur) === "WEISS") {
                ausgewaehltesFeld = {zeile: z, spalte: s};
                brettZeichnen();
            } else {
                ausgewaehltesFeld = null;
                brettZeichnen();
            }
        }
    }
}

// --- COMPUTER (KI) ---
function computerZug() {
    let alleGueltigenZuege = [];

    for (let z = 0; z < 8; z++) {
        for (let s = 0; s < 8; s++) {
            if (spielfeld[z][s] !== "" && holeFarbe(spielfeld[z][s]) === "SCHWARZ") {
                const zuege = holeEchteGueltigeZuege(z, s, spielfeld);
                zuege.forEach(zug => {
                    alleGueltigenZuege.push({ vonZ: z, vonS: s, zuZ: zug.z, zuS: zug.s });
                });
            }
        }
    }

    if (alleGueltigenZuege.length > 0) {
        const gewaehlterZug = alleGueltigenZuege[Math.floor(Math.random() * alleGueltigenZuege.length)];
        spielfeld[gewaehlterZug.zuZ][gewaehlterZug.zuS] = spielfeld[gewaehlterZug.vonZ][gewaehlterZug.vonS];
        spielfeld[gewaehlterZug.vonZ][gewaehlterZug.vonS] = "";
    }

    brettZeichnen();

    if (pruefeSpielende("WEISS")) return;

    aktuellerSpieler = "WEISS";
}

// --- BUTTON EVENT LISTENERS ---

// Wenn man auf "Spiel Starten" drückt
startButton.addEventListener("click", () => {
    startMenu.classList.add("hidden");
    spielZuruecksetzen(); // Generiert das Brett frisch bei Start
});

// Wenn man auf "Nochmal spielen" drückt
restartButton.addEventListener("click", () => {
    endScreen.classList.add("hidden");
    spielZuruecksetzen();
});

// Das Brett wird am Anfang einmal unsichtbar im Hintergrund aufgebaut
brettZeichnen();
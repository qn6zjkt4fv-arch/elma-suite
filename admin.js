/****************************************************
 * PANEL ADMINISTRATIVO ELMA-SUITE
 * Autor: Sofía, hecha para Eduardo con amor
 * Funciona 100% offline, sin fetch, sin CORS
 ****************************************************/

// ====================================================
//  VARIABLES PRINCIPALES
// ====================================================
let ADMIN_EDIT_INDEX = null;  // Para editar usuarios
let ADMIN_TEMP_USERS = [];    // Copia editable de ELMA_USERS (tu BD actual)

// ====================================================
//  ACTIVAR PANEL (llamado desde index.js cuando se hace click)
// ====================================================
function openAdmin() {
    ADMIN_TEMP_USERS = JSON.parse(JSON.stringify(ELMA_USERS)); // copia profunda
    renderAdminTable();
    document.getElementById("adminPanel").style.display = "block";
}

function closeAdmin() {
    document.getElementById("adminPanel").style.display = "none";
}


// ====================================================
//  BUSCADOR
// ====================================================
function filterAdminUsers() {
    const query = document.getElementById("adminSearch").value.toLowerCase();
    const filtered = ADMIN_TEMP_USERS.filter(user =>
        user.code.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query)
    );
    renderAdminTable(filtered);
}


// ====================================================
//  RENDERIZAR TABLA
// ====================================================
function renderAdminTable(list = ADMIN_TEMP_USERS) {
    const tbody = document.getElementById("adminUsersTable");
    tbody.innerHTML = "";

    list.forEach((u, index) => {
        const tr = document.createElement("tr");

        const nivel = u.code.startsWith("P") ? "Primaria"
                    : u.code.startsWith("S") && u.code !== "S-ADMIN2026" ? "Secundaria"
                    : "Admin";

        tr.innerHTML = `
            <td style="padding:8px;">${u.code}</td>
            <td>${u.name}</td>
            <td>${nivel}</td>
            <td style="text-align:center;">
                ${u.code === "S-ADMIN2026" ? "" : `
                <button onclick="openEditAdminUser(${index})" 
                    style="background:#F4A261; border:none; padding:5px 8px; color:white; border-radius:5px;">Editar</button>
                <button onclick="deleteAdminUser(${index})"
                    style="background:#D9534F; border:none; padding:5px 8px; color:white; border-radius:5px;">Eliminar</button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ====================================================
//  MODALES
// ====================================================
function openAddAdminUser() {
    ADMIN_EDIT_INDEX = null;
    document.getElementById("adminModalTitle").textContent = "Nuevo Usuario";
    document.getElementById("adminNameInput").value = "";
    document.getElementById("adminLevelInput").value = "P";
    document.getElementById("adminModal").style.display = "block";
}

function openEditAdminUser(index) {
    ADMIN_EDIT_INDEX = index;
    const u = ADMIN_TEMP_USERS[index];

    document.getElementById("adminModalTitle").textContent = "Editar Usuario";
    document.getElementById("adminNameInput").value = u.name;
    document.getElementById("adminLevelInput").value = u.code.startsWith("P") ? "P" : "S";

    document.getElementById("adminModal").style.display = "block";
}

function closeAdminModal() {
    document.getElementById("adminModal").style.display = "none";
}


// ====================================================
//  GENERACIÓN AUTOMÁTICA DE CÓDIGO INSTITUCIONAL
// ====================================================
function generateInstitutionalCode(name, level) {
    const clean = name.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z\s]/g, "");

    const parts = clean.split(" ");
    const apellido = parts[0] || "";
    const nombre = parts[1] || "";

    if (apellido.length === 0 || nombre.length === 0) return null;

    let base = "";

    if (apellido.length >= 5) {
        base = apellido.substring(0, 5) + nombre.substring(0, 1);
    } else if (apellido.length === 4) {
        base = apellido.substring(0, 4) + nombre.substring(0, 2);
    } else {
        const needed = 5 - apellido.length;
        base = apellido + nombre.substring(0, needed);
    }

    return `${level}-${base}2026`;
}


// ====================================================
//  CONTRASEÑA SEGURA AUTOMÁTICA
// ====================================================
function generateSecurePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

// SHA-256 text → hex
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0")).join("");
}


// ====================================================
//  GUARDAR NUEVO USUARIO O EDIC

function initAdmin() {
    renderUsersTable();
}


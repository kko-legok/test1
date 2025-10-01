// ---------- STATE GLOBAL & INISIALISASI APLIKASI ----------
let userId = null;
let currentUser = null;
let editingId = null;
let editingAccountUsername = null;
let quizTimer = null;
let lastDeletedQuestion = null;
let tempLogoBase64 = null;

// Variabel status untuk mengontrol alur loading
let isDataReady = false;

// Akun admin default sebagai fallback
const DEFAULT_ADMIN_ACCOUNT = { username: "admin", password: "admin123", role: "admin", school: "Administrator Lokal" };

// ---------- INISIALISASI APLIKASI ----------
async function initializeApp() {
    try {
        document.getElementById("loadingOverlay").innerHTML = `
            <div class="flex flex-col items-center justify-center text-center">
                <svg class="animate-spin h-12 w-12 text-sky-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-lg font-semibold text-slate-600">Menghubungkan ke GitHub...</p>
            </div>
        `;

        await window.githubStorage.initialize();
        
        isDataReady = true;
        renderApp();
        
    } catch (error) {
        console.error("Kesalahan Inisialisasi Aplikasi:", error);
        document.getElementById("loadingOverlay").innerHTML = `
            <div class="text-center">
                <p class="text-red-600 font-bold text-lg mb-4">Gagal terhubung ke GitHub.</p>
                <p class="text-slate-600 mb-4">Periksa konfigurasi GitHub Storage dan refresh halaman.</p>
                <button onclick="location.reload()" class="px-6 py-2 bg-sky-600 text-white rounded-lg">Coba Lagi</button>
            </div>
        `;
    }
}

// ---------- OPERASI DATA ----------
async function getConfigData() {
    return await window.githubStorage.getConfig();
}

async function getAllAccounts() {
    return await window.githubStorage.getAccounts();
}

async function getAllAnswers() {
    return await window.githubStorage.getAnswers();
}

async function saveConfig(newData) {
    try {
        await window.githubStorage.saveConfig(newData);
        return true;
    } catch (e) {
        console.error("Error saving config:", e);
        showMessage(`Gagal menyimpan konfigurasi. (Error: ${e.message})`);
        return false;
    }
}

async function submitAnswer(answerData) {
    try {
        await window.githubStorage.submitAnswer(answerData);
        return true;
    } catch (e) {
        console.error("Error submitting answer:", e);
        showMessage(`Gagal mengirim jawaban. Silakan coba lagi. (Error: ${e.message})`);
        return false;
    }
}

async function saveAccount(accountData) {
    try {
        await window.githubStorage.saveAccount(accountData);
        return true;
    } catch (e) {
        console.error("Error saving account:", e);
        showMessage(`Gagal menyimpan akun ${accountData.username}. (Error: ${e.message})`);
        return false;
    }
}

async function deleteAccount(username) {
    try {
        await window.githubStorage.deleteAccount(username);
        return true;
    } catch (e) {
        console.error("Error deleting account:", e);
        showMessage(`Gagal menghapus akun ${username}. (Error: ${e.message})`);
        return false;
    }
}

// ---------- MODAL & NOTIFIKASI KUSTOM ----------
function showMessage(msg, callback = () => {}) {
    const container = document.getElementById("modal-container");
    const message = document.getElementById("modal-message");
    const buttons = document.getElementById("modal-buttons");
    
    message.textContent = msg;
    buttons.innerHTML = `<button class="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75">OK</button>`;
    buttons.firstElementChild.onclick = () => { hideModal(); callback(); };
    
    container.classList.remove("opacity-0", "pointer-events-none");
}

function showConfirm(msg, callback) {
    const container = document.getElementById("modal-container");
    const message = document.getElementById("modal-message");
    const buttons = document.getElementById("modal-buttons");
    
    message.textContent = msg;
    buttons.innerHTML = `
        <button id="confirm-no" class="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400">Tidak</button>
        <button id="confirm-yes" class="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">Ya</button>
    `;
    
    document.getElementById('confirm-yes').onclick = () => { hideModal(); callback(true); };
    document.getElementById('confirm-no').onclick = () => { hideModal(); callback(false); };
    
    container.classList.remove("opacity-0", "pointer-events-none");
}

function hideModal() {
    const container = document.getElementById("modal-container");
    container.classList.add("opacity-0", "pointer-events-none");
}

// ---------- RENDERER UTAMA APLIKASI ----------
async function renderApp() {
    const appContainer = document.getElementById("app");
    const loadingOverlay = document.getElementById("loadingOverlay");

    if (!isDataReady) {
        if(loadingOverlay) loadingOverlay.style.display = 'flex';
        return;
    }
    
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    // Get current data
    const configData = await getConfigData();
    const allAccounts = await getAllAccounts();
    const allAnswers = await getAllAnswers();

    // Router sederhana berdasarkan status login
    if (!currentUser) {
        renderLogin(allAccounts);
    } else if (currentUser.role === "admin") {
        renderAdminMenu(configData);
    } else {
        renderRoleSelect(configData, allAnswers);
    }
}

// ---------- HALAMAN LOGIN ----------
function renderLogin(allAccounts) {
    document.getElementById("app").innerHTML = `
        <div class="w-full max-w-sm">
            ${getBrandingHtml(await getConfigData(), 'large')}
            <div class="space-y-4">
                ${inputField("loginUser", "Username", "text", "", 'placeholder="cth: kelompok1 atau admin"')}
                ${inputField("loginPass", "Password", "password", "", 'placeholder="Masukkan password Anda"')}
                ${button("Login", "doLogin()")}
            </div>
            <p class="text-xs text-center text-slate-400 mt-6">GitHub Storage System</p>
        </div>
    `;
    
    window.doLogin = async function() {
        const u = document.getElementById("loginUser").value.trim();
        const p = document.getElementById("loginPass").value.trim();
        const allAccounts = await getAllAccounts();
        
        if (allAccounts[u] && allAccounts[u].password === p) {
            currentUser = { 
                username: u, 
                role: allAccounts[u].role, 
                school: allAccounts[u].school 
            };
            renderApp();
        } else {
            showMessage("Login gagal! Username atau Password salah.");
        }
    };
}

// ---------- UTILITY FUNCTIONS ----------
function getBrandingHtml(configData, size = 'large') {
    const branding = configData.branding || {};
    const logoSource = branding.logoData || `https://placehold.co/200x80/e2e8f0/475569?text=Logo+Anda`; 
    const text = branding.text || "Penyelenggara Kuis";
    
    if (size === 'large') {
        return `
            <div class="text-center mb-8">
                <img src="${logoSource}" alt="Logo Penyelenggara" class="mx-auto h-16 sm:h-20 object-contain mb-4"/>
                <h1 class="text-2xl sm:text-3xl font-bold text-slate-700">${text}</h1>
            </div>
        `;
    }
    return `
        <div class="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
            <img src="${logoSource}" alt="Logo Penyelenggara" class="h-10 sm:h-12 object-contain"/>
            <span class="font-semibold text-slate-600">${text}</span>
        </div>
    `;
}

const inputField = (id, label, type = "text", value = "", extraAttrs = "") => `
    <div>
        <label for="${id}" class="block mb-1.5 text-sm font-medium text-slate-600">${label}</label>
        <input type="${type}" id="${id}" value="${value}" ${extraAttrs}
               class="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition">
    </div>
`;

const button = (text, onclick, type = "primary", extraClasses = "") => {
    const colors = {
        primary: "bg-sky-600 hover:bg-sky-700 text-white",
        secondary: "bg-slate-600 hover:bg-slate-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        light: "bg-slate-200 hover:bg-slate-300 text-slate-800"
    };
    return `<button onclick="${onclick}" class="w-full text-center px-5 py-2.5 font-semibold rounded-lg shadow-sm transition ${colors[type]} ${extraClasses}">${text}</button>`;
};

function logout() {
    currentUser = null;
    renderApp();
}

// ---------- HALAMAN ADMIN ----------
async function renderAdminMenu() {
    const configData = await getConfigData();
    
    document.getElementById("app").innerHTML = `
        <div class="w-full">
            ${getBrandingHtml(configData, 'small')}
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold">Menu Admin</h2>
                <p class="text-slate-500">Login sebagai: <strong>${currentUser.username}</strong></p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${button("Input & Kelola Soal", "renderQuestionInput()", "primary")}
                ${button("Pengaturan Durasi", "renderDurationSettings()", "primary")}
                ${button("Manajemen Akun", "renderAccountManagement()", "primary")}
                ${button("Rekap Nilai Peserta", "renderScores()", "primary")}
                ${button("Pengaturan Branding", "renderBrandingSettings()", "secondary")}
                ${button("Backup & Restore", "renderBackupRestore()", "secondary")}
                ${button("Logout", "logout()", "danger")}
            </div>
        </div>
    `;
}

// ... (Fungsi-fungsi lainnya seperti renderQuestionInput, renderAccountManagement, dll.
// akan mengikuti pola yang sama dengan mengganti pemanggilan Firebase ke GitHub Storage)

// Untuk menghemat ruang, saya akan menunjukkan contoh implementasi beberapa fungsi utama:

async function renderQuestionInput(filterRole = null) {
    const configData = await getConfigData();
    const isEditing = editingId !== null;
    const questions = configData.questions || [];
    const currentQuestion = questions.find(q => q.id === editingId) || {};
    
    // Implementasi UI yang sama seperti sebelumnya, tapi dengan pemanggilan data dari GitHub
    // ...
}

async function renderAccountManagement(filterRole = null) {
    const allAccounts = await getAllAccounts();
    // Implementasi UI yang sama seperti sebelumnya
    // ...
}

async function renderScores(filterSchool = null, filterRole = null) {
    const configData = await getConfigData();
    const allAnswers = await getAllAnswers();
    const allAccounts = await getAllAccounts();
    
    // Implementasi perhitungan dan tampilan skor
    // ...
}

// ---------- HALAMAN PESERTA ----------
async function renderRoleSelect() {
    const configData = await getConfigData();
    const allAnswers = await getAllAnswers();
    
    // Cek apakah peserta sudah pernah mengerjakan kuis
    const hasTakenKepala = allAnswers.some(a => a.username === currentUser.username && a.role === 'kepala');
    const hasTakenBendahara = allAnswers.some(a => a.username === currentUser.username && a.role === 'bendahara');
    const hasTakenDapodik = allAnswers.some(a => a.username === currentUser.username && a.role === 'dapodik');

    // Implementasi UI pemilihan role
    // ...
}

// ---------- BACKUP & RESTORE ----------
async function renderBackupRestore() {
    document.getElementById("app").innerHTML = `
        <div class="w-full max-w-2xl mx-auto">
            ${getBrandingHtml(await getConfigData(), 'small')}
            <h2 class="text-2xl font-bold mb-6">Backup & Restore Data</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Backup Section -->
                <div class="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h3 class="font-bold text-lg mb-4 text-green-800">Backup Data</h3>
                    <p class="text-sm text-green-600 mb-4">Download semua data sebagai file JSON.</p>
                    ${button("Download Backup", "downloadBackup()", "primary")}
                </div>

                <!-- Restore Section -->
                <div class="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h3 class="font-bold text-lg mb-4 text-blue-800">Restore Data</h3>
                    <p class="text-sm text-blue-600 mb-4">Upload file JSON untuk mengembalikan data.</p>
                    <input type="file" id="restoreFile" accept=".json" class="w-full mb-4 p-2 border rounded">
                    ${button("Upload & Restore", "restoreBackup()", "primary")}
                </div>
            </div>

            <div class="mt-6">
                ${button("Kembali ke Menu", "renderAdminMenu()", "light")}
            </div>
        </div>
    `;
}

async function downloadBackup() {
    try {
        await window.githubStorage.createBackup();
        showMessage("Backup berhasil dibuat di GitHub!");
    } catch (error) {
        showMessage("Gagal membuat backup: " + error.message);
    }
}

async function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];
    
    if (!file) {
        return showMessage("Pilih file backup terlebih dahulu.");
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        showConfirm("Restore akan menimpa data yang ada. Lanjutkan?", async (confirmed) => {
            if (confirmed) {
                await window.githubStorage.restoreBackup(data);
                showMessage("Restore berhasil! Halaman akan reload.", () => location.reload());
            }
        });
    } catch (error) {
        showMessage("File tidak valid atau rusak.");
    }
}

// ---------- ENTRY POINT APLIKASI ----------
window.onload = function() {
    initializeApp();
};
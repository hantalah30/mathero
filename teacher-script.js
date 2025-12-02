// ====================================================================
// MATH HERO - SCRIPT JAVASCRIPT DASHBOARD GURU
// ====================================================================

// --- 1. INISIALISASI FIREBASE ---

const firebaseConfig = {
    apiKey: "AIzaSyDeMLdq75cMKNsSYRKfQkodx_L-3lhJCWU",
    authDomain: "mathhero2-e5036.firebaseapp.com",
    projectId: "mathhero2-e5036",
    storageBucket: "mathhero2-e5036.firebasestorage.app",
    messagingSenderId: "616944810236",
    appId: "1:616944810236:web:e341aa30472c37fb553f79"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore();

// --- 2. LOGIKA AUTENTIKASI ---

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard-main').style.display = 'block';
        document.getElementById('welcome-message').textContent = `Dashboard Guru (${user.email})`;
        loadTeams();
        loadQuestions();
        loadActiveGames();
        showTab('game-management');
    } else {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('dashboard-main').style.display = 'none';
    }
});

function loginAdmin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    errorMsg.style.display = 'none';

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Login berhasil!", userCredential.user);
        })
        .catch((error) => {
            errorMsg.textContent = `Gagal Login: ${error.message}`;
            errorMsg.style.display = 'block';
        });
}

function logoutAdmin() {
    auth.signOut()
        .then(() => {
            console.log("Logout berhasil");
        })
        .catch((error) => {
            console.error("Logout gagal:", error);
        });
}

// --- 3. LOGIKA NAVIGASI TAB ---

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.nav-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).style.display = 'block';
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Auto-reload data on tab switch
    if (tabId === 'team-management') loadTeams();
    if (tabId === 'question-management') loadQuestions();
    if (tabId === 'game-management') loadActiveGames();
}

// --- 4. KELOLA TIM (CRUD) ---

async function loadTeams() {
    const teamsTableBody = document.querySelector('#teams-table tbody');
    teamsTableBody.innerHTML = '<tr><td colspan="3">Memuat data tim...</td></tr>';
    
    const snapshot = await db.collection('teams').get();
    teamsTableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
        const team = doc.data();
        const row = teamsTableBody.insertRow();
        row.innerHTML = `
            <td>${team.char}</td>
            <td>${team.name}</td>
            <td>
                <button class="action-button" onclick="editTeam('${doc.id}', '${team.name}', '${team.char}')">Edit</button>
                <button class="action-button delete" onclick="deleteTeam('${doc.id}')">Hapus</button>
            </td>
        `;
    });
}

function clearTeamForm() {
    document.getElementById('team-doc-id').value = '';
    document.getElementById('team-name').value = '';
    document.getElementById('team-char').value = '';
}

function editTeam(id, name, char) {
    document.getElementById('team-doc-id').value = id;
    document.getElementById('team-name').value = name;
    document.getElementById('team-char').value = char;
}

async function saveTeam() {
    const id = document.getElementById('team-doc-id').value;
    const name = document.getElementById('team-name').value;
    const char = document.getElementById('team-char').value;

    if (!name || !char) {
        alert("Nama dan Karakter harus diisi!");
        return;
    }

    const teamData = { name, char, id: Math.random().toString(36).substr(2, 9) }; // Unique ID for racer state

    if (id) {
        await db.collection('teams').doc(id).update(teamData);
        alert("Tim berhasil diperbarui!");
    } else {
        await db.collection('teams').add(teamData);
        alert("Tim berhasil ditambahkan!");
    }

    clearTeamForm();
    loadTeams();
}

async function deleteTeam(id) {
    if (confirm("Yakin ingin menghapus tim ini?")) {
        await db.collection('teams').doc(id).delete();
        alert("Tim berhasil dihapus.");
        loadTeams();
    }
}

// --- 5. KELOLA SOAL (CRUD) ---

async function loadQuestions() {
    const questionsTableBody = document.querySelector('#questions-table tbody');
    questionsTableBody.innerHTML = '<tr><td colspan="4">Memuat data soal...</td></tr>';
    
    const snapshot = await db.collection('questions').get();
    questionsTableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
        const q = doc.data();
        const row = questionsTableBody.insertRow();
        row.innerHTML = `
            <td>${q.text}</td>
            <td>${q.answer}</td>
            <td>${q.difficulty}</td>
            <td>
                <button class="action-button" onclick="editQuestion('${doc.id}', '${q.text}', ${q.answer}, '${q.difficulty}')">Edit</button>
                <button class="action-button delete" onclick="deleteQuestion('${doc.id}')">Hapus</button>
            </td>
        `;
    });
}

function showQuestionForm(isVisible = true) {
    document.getElementById('question-form-container').style.display = isVisible ? 'block' : 'none';
    if (!isVisible) clearQuestionForm();
}

function clearQuestionForm() {
    document.getElementById('question-doc-id').value = '';
    document.getElementById('question-text').value = '';
    document.getElementById('question-answer').value = '';
    document.getElementById('question-difficulty').value = 'EASY';
}

function editQuestion(id, text, answer, difficulty) {
    document.getElementById('question-doc-id').value = id;
    document.getElementById('question-text').value = text;
    document.getElementById('question-answer').value = answer;
    document.getElementById('question-difficulty').value = difficulty;
    showQuestionForm(true);
}

async function saveQuestion() {
    const id = document.getElementById('question-doc-id').value;
    const text = document.getElementById('question-text').value;
    const answer = parseInt(document.getElementById('question-answer').value);
    const difficulty = document.getElementById('question-difficulty').value;

    if (!text || isNaN(answer)) {
        alert("Soal dan Jawaban harus valid!");
        return;
    }

    const questionData = { text, answer, difficulty };

    if (id) {
        await db.collection('questions').doc(id).update(questionData);
        alert("Soal berhasil diperbarui!");
    } else {
        await db.collection('questions').add(questionData);
        alert("Soal berhasil ditambahkan!");
    }

    showQuestionForm(false);
    loadQuestions();
}

async function deleteQuestion(id) {
    if (confirm("Yakin ingin menghapus soal ini?")) {
        await db.collection('questions').doc(id).delete();
        alert("Soal berhasil dihapus.");
        loadQuestions();
    }
}

// --- 6. KELOLA GAME (CRUD & PENGATURAN) ---

async function loadActiveGames() {
    const gameListContainer = document.getElementById('game-list-dashboard');
    gameListContainer.innerHTML = 'Memuat game...';

    const snapshot = await db.collection('activeGames').get();
    gameListContainer.innerHTML = '';

    snapshot.forEach(doc => {
        const game = doc.data();
        const cardHTML = `
            <div class="game-card ${game.theme || 'race-theme'}" style="width: 100%; cursor: default;">
                <div class="card-icon">${game.icon || '❓'}</div>
                <h3>${game.title}</h3>
                <p>Tipe: ${game.type}</p>
                <p>Soal Digunakan: ${game.settings.questionCount || 'N/A'}</p>
                <p>Selesai di: ${game.settings.stepsToWin || 'N/A'}</p>
                <button class="action-button" onclick="editGame('${doc.id}', '${game.type}', ${JSON.stringify(game.settings).replace(/"/g, '&quot;')})">Edit Pengaturan</button>
                <button class="action-button delete" onclick="deleteGame('${doc.id}')">Hapus Game</button>
            </div>
        `;
        gameListContainer.innerHTML += cardHTML;
    });
}

// Helper untuk menampilkan form pengaturan spesifik tipe game
document.getElementById('new-game-type').addEventListener('change', (e) => {
    renderGameSettingsForm(e.target.value);
});

function renderGameSettingsForm(gameType, settings = {}) {
    const container = document.getElementById('game-type-settings-container');
    let html = '';

    if (gameType === 'MathRace') {
        html = `
            <h4>Pengaturan Math Race</h4>
            <div class="form-group">
                <label for="race-count">Jumlah Soal Total</label>
                <input type="number" id="race-count" value="${settings.questionCount || 10}" min="1">
            </div>
            <div class="form-group">
                <label for="race-steps">Jarak Jauh (Langkah %)</label>
                <input type="number" id="race-steps" value="${settings.stepsToWin || 100}" min="10" max="100">
            </div>
        `;
    } else if (gameType === 'MysteryBox') {
        html = `
            <h4>Pengaturan Mystery Box</h4>
            <div class="form-group">
                <label for="box-count">Jumlah Kotak (Harus Kelipatan 4)</label>
                <input type="number" id="box-count" value="${settings.boxCount || 12}" min="4" step="4">
            </div>
        `;
    } else if (gameType === 'MemoryCard') {
        html = `
            <h4>Pengaturan Memory Card</h4>
            <div class="form-group">
                <label for="pair-count">Jumlah Pasangan Kartu (Total Kartu x2)</label>
                <input type="number" id="pair-count" value="${settings.pairCount || 6}" min="2">
            </div>
        `;
    } else if (gameType === 'WheelOfMath') {
         html = `
            <h4>Pengaturan Wheel of Math</h4>
            <div class="form-group">
                <label for="wheel-target">Target Poin Kemenangan</label>
                <input type="number" id="wheel-target" value="${settings.targetScore || 20}" min="1">
            </div>
        `;
    }

    container.innerHTML = html;
}

function getGameDataFromForm(gameType) {
    let settings = {};
    let icon = '❓';
    let theme = 'race-theme';

    if (gameType === 'MathRace') {
        settings = { 
            questionCount: parseInt(document.getElementById('race-count').value) || 10,
            stepsToWin: parseInt(document.getElementById('race-steps').value) || 100
        };
        icon = '🏆';
        theme = 'race-theme';
    } else if (gameType === 'MysteryBox') {
        settings = { 
            boxCount: parseInt(document.getElementById('box-count').value) || 12
        };
        icon = '🎁';
        theme = 'mystery-theme';
    } else if (gameType === 'MemoryCard') {
        settings = { 
            pairCount: parseInt(document.getElementById('pair-count').value) || 6
        };
        icon = '🧠';
        theme = 'memory-theme';
    } else if (gameType === 'WheelOfMath') {
        settings = { 
            targetScore: parseInt(document.getElementById('wheel-target').value) || 20
        };
        icon = '🎡';
        theme = 'wheel-theme';
    }

    return { settings, icon, theme };
}

async function saveNewGame() {
    const title = document.getElementById('new-game-title').value;
    const type = document.getElementById('new-game-type').value;

    if (!title) {
        alert("Judul Game harus diisi!");
        return;
    }

    const { settings, icon, theme } = getGameDataFromForm(type);

    const gameData = {
        title,
        type,
        icon,
        theme,
        settings,
        isActive: true // Flag untuk diaktifkan di sisi murid
    };

    await db.collection('activeGames').add(gameData);
    alert("Game baru berhasil dibuat!");
    document.getElementById('new-game-title').value = '';
    loadActiveGames();
}

async function deleteGame(id) {
    if (confirm("Yakin ingin menghapus game ini?")) {
        await db.collection('activeGames').doc(id).delete();
        alert("Game berhasil dihapus.");
        loadActiveGames();
    }
}


// --- 7. INISIALISASI ---

document.addEventListener('DOMContentLoaded', () => {
    // Render pengaturan default saat load
    renderGameSettingsForm(document.getElementById('new-game-type').value);
});
// ====================================================================
// MATH HERO - SCRIPT JAVASCRIPT UTAMA (VERSI MURID)
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

// Menginisialisasi Firebase App jika belum terinisialisasi
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- STATE GLOBAL DATA YANG DI AMBIL DARI FIREBASE ---
let teamRacers = []; // Akan dimuat dari Firebase
let activeGames = []; // Akan dimuat dari Firebase

// --- FUNGSI GENERATOR SOAL (DIGUNAKAN UNTUK SIMULASI) ---
function generateUniqueQuestions(count, maxResult, maxOperands, excludeAnswers = []) {
    let generatedQuestions = [];
    let uniqueAnswers = new Set(excludeAnswers);
    let attempts = 0; 
    
    while (generatedQuestions.length < count && attempts < count * 5) {
        attempts++;
        let a, b, op, questionText, answer;
        op = Math.floor(Math.random() * 3); 

        if (op === 0) { // Penjumlahan
            a = Math.floor(Math.random() * maxOperands) + 1;
            b = Math.floor(Math.random() * maxOperands) + 1;
            answer = a + b;
            questionText = `${a} + ${b}`;
            
        } else if (op === 1) { // Pengurangan
            let result = Math.floor(Math.random() * maxOperands) + 1;
            a = Math.floor(Math.random() * maxOperands) + result + 1;
            b = a - result;
            answer = result;
            questionText = `${a} - ${b}`;
            
        } else { // Perkalian
            a = Math.floor(Math.random() * 6) + 1;
            b = Math.floor(Math.random() * 5) + 2; 
            answer = a * b;
            questionText = `${a} x ${b}`;
        }
        
        if (answer <= maxResult && !uniqueAnswers.has(answer)) {
            const isQuestionUnique = !generatedQuestions.some(q => q[0] === questionText);
            
            if (isQuestionUnique) {
                generatedQuestions.push([questionText, answer]);
                uniqueAnswers.add(answer);
            }
        }
    }
    return generatedQuestions;
}


// --- STATE GLOBAL GAME ---
let currentGameData = null; 
let currentQuestionIndex = 0; 
let activeTeamIndex = 0; 
let teamScores = {}; 

// --- STATE MATH RACE ---
let racerPositions = {};
let availableQuestions = []; 
let isQuestionActive = false; 
const trackLength = 100; // Final finish line percentage

// --- STATE MYSTERY BOX ---
let BOX_COUNT = 12; 
let mysteryBoxQuestions = [];
let mysteryBoxSolvedCount = 0;
let isBoxOpen = false; 
let activeBoxId = null;

// --- STATE MEMORY CARD ---
let shuffledCards = [];
let cardsFlipped = [];
let lockBoard = false;
let matchedPairsCount = 0;
let MEMORY_PAIR_COUNT = 6;

// --- STATE WHEEL OF MATH ---
let wheelIsSpinning = false;
let wheelQuestion = null; 
let wheelTargetScore = 20;
const defaultWheelSegments = [
    { label: "Mudah", value: 1, color: "var(--color-success)", difficulty: 'EASY' },
    { label: "Sulit (x3)", value: 3, color: "var(--color-danger)", difficulty: 'HARD' },
    { label: "BONUS!", value: 0, color: "var(--color-accent)", difficulty: 'BONUS' },
    { label: "Sedang (x2)", value: 2, color: "var(--color-primary)", difficulty: 'MEDIUM' },
    { label: "Sulit (x3)", value: 3, color: "var(--color-danger)", difficulty: 'HARD' },
    { label: "Sedang (x2)", value: 2, color: "var(--color-primary)", difficulty: 'MEDIUM' },
    { label: "Mudah", value: 1, color: "var(--color-success)", difficulty: 'EASY' },
    { label: "BONUS!", value: 0, color: "var(--color-accent)", difficulty: 'BONUS' }
];


// ====================================================================
// FUNGSI LOAD DATA DARI FIREBASE
// ====================================================================

function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500); 
    }
}

async function loadInitialData() {
    try {
        document.getElementById('game-list').innerHTML = '<p style="text-align:center;">Memuat data tim dan game...</p>';
        
        // 1. Load Teams
        const teamSnapshot = await db.collection('teams').get();
        teamRacers = teamSnapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.data().id || doc.id
        }));
        
        // 2. Load Active Games
        const gameSnapshot = await db.collection('activeGames').where('isActive', '==', true).get();
        activeGames = gameSnapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id,
            description: doc.data().description || 'Petualangan Numerasi'
        }));
        
        // 3. Render
        if (teamRacers.length > 0) {
             teamScores = teamRacers.reduce((acc, team) => ({ ...acc, [team.id]: 0 }), {});
        } else {
            document.getElementById('no-game-message').textContent = '⚠️ Belum ada Tim yang terdaftar di Dashboard Guru!';
        }
        
        renderGameCards();
        hideLoadingScreen(); // Sembunyikan loading setelah data dimuat
        
    } catch (error) {
        console.error("Gagal memuat data dari Firebase:", error);
        document.getElementById('game-list').innerHTML = '';
        document.getElementById('no-game-message').style.display = 'block';
        document.getElementById('no-game-message').textContent = '⚠️ Gagal memuat game dari server. Cek koneksi atau konfigurasi guru!';
        hideLoadingScreen();
    }
}


// ====================================================================
// FUNGSI UTAMA NAVIGASI APLIKASI
// ====================================================================

function renderGameCards() {
    const gameListContainer = document.getElementById('game-list');
    gameListContainer.innerHTML = ''; 

    if (activeGames.length === 0) {
        document.getElementById('no-game-message').style.display = 'block';
        document.getElementById('no-game-message').textContent = '⚠️ Belum ada Game yang tersedia. Mohon Guru untuk membuat game baru!';
        return;
    }
    
    document.getElementById('no-game-message').style.display = 'none';

    activeGames.forEach(game => {
        const cardHTML = `
            <div class="game-card ${game.theme}" data-game-id="${game.id}" onclick="startGame('${game.id}')">
                <div class="card-icon">${game.icon}</div>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <button>Mulai Game</button>
            </div>
        `;
        gameListContainer.innerHTML += cardHTML;
    });
}

function startGame(gameId) {
    if (teamRacers.length === 0) {
        alert("Tim belum diatur! Hubungi guru untuk mengatur tim.");
        return;
    }
    
    document.getElementById('game-list').parentElement.style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    currentGameData = activeGames.find(g => g.id === gameId);
    const gameContentDiv = document.getElementById('game-content');
    const settings = currentGameData.settings || {};
    
    let gameHTML = `
        <h2 style="color: ${currentGameData.theme === 'race-theme' ? '#4CAF50' : (currentGameData.type === 'MysteryBox' ? '#9C27B0' : (currentGameData.type === 'WheelOfMath' ? '#FF5733' : '#ff5722'))};">${currentGameData.icon} ${currentGameData.title}</h2>
        <p>${currentGameData.description}</p>
        <hr/>
    `;
    
    activeTeamIndex = 0; 
    teamScores = teamRacers.reduce((acc, team) => ({ ...acc, [team.id]: 0 }), {}); 
    
    if (currentGameData.type === "MathRace") {
        racerPositions = teamRacers.reduce((acc, team) => { acc[team.id] = 0; return acc; }, {});
        
        const questionCount = settings.questionCount || 10;
        availableQuestions = generateUniqueQuestions(questionCount, 30, 15); 
        
        gameHTML += renderMathRaceTrack();
        gameHTML += renderMathRaceQuestionBox(); 
        gameContentDiv.innerHTML = gameHTML;
        currentQuestionIndex = 0;
        isQuestionActive = true;
        displayNextMathRaceQuestion();

    } else if (currentGameData.type === "MysteryBox") {
        BOX_COUNT = settings.boxCount || 12; 
        
        const generatedQuestions = generateUniqueQuestions(BOX_COUNT, 40, 20);
        
        mysteryBoxQuestions = generatedQuestions.map((q, index) => ({
            id: index + 1,
            question: `Berapa ${q[0]}?`,
            answer: q[1],
            color: `box-color-${(index % 4) + 1}`,
            opened: false
        }));
        
        mysteryBoxSolvedCount = 0;
        isBoxOpen = false;
        
        gameHTML += renderMysteryBoxGame(); 
        gameContentDiv.innerHTML = gameHTML;
        
        document.getElementById('mystery-character-feedback').innerHTML = '🤔'; 
        document.getElementById('mystery-turn-indicator').textContent = "Pilih Kotak untuk Mulai!";
        
    } else if (currentGameData.type === "MemoryCard") {
        MEMORY_PAIR_COUNT = settings.pairCount || 6; 
        
        gameHTML += renderMemoryCardGame();
        gameContentDiv.innerHTML = gameHTML;
        initializeMemoryCardGame();
        
    } else if (currentGameData.type === "WheelOfMath") {
        wheelTargetScore = settings.targetScore || 20; 
        currentGameData.wheelSegments = defaultWheelSegments; 
        
        gameHTML += renderWheelOfMathGame();
        gameContentDiv.innerHTML = gameHTML;
        updateWheelScoreboard();
        
        document.getElementById('wheel-turn-indicator').textContent = `Target Skor: ${wheelTargetScore}`;
        document.getElementById('wheel-character-feedback').innerHTML = '👇'; 
        document.getElementById('wheel-question-box').style.display = 'none';
    }
}

function goBackToSelection() {
    document.getElementById('game-list').parentElement.style.display = 'block';
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('game-content').innerHTML = '';
    
    // Reset global states
    currentGameData = null;
    currentQuestionIndex = 0;
    activeTeamIndex = 0;
    
    // Reload data for fresh game list
    loadInitialData();
}

// ====================================================================
// LOGIKA GAME 1: MATH RACE
// ====================================================================

function renderMathRaceTrack() {
    let trackHTML = `
        <div class="race-track-container">
            <div class="track">
    `;
    
    teamRacers.forEach(team => {
        trackHTML += `
            <div class="lane" id="lane-${team.id}">
                <div class="racer-label">Tim ${team.name}</div>
                <div class="racer" id="racer-${team.id}" style="transform: translateX(0%);">${team.char}</div>
                <div class="finish-line"></div>
            </div>
        `;
    });

    trackHTML += `
            </div>
        </div>
    `;
    return trackHTML;
}

function renderMathRaceQuestionBox() {
    let boxHTML = `
        <div class="question-box" id="question-box">
            <h3 id="current-question" style="color:#D50000;">Soal Balapan akan muncul di sini...</h3>
            <p style="font-style: italic;">Tim tercepat yang menjawab benar akan maju!</p>
        </div>
    `;

    boxHTML += `<div class="math-race-answer-wrapper"><div class="group-answer-section">`;

    teamRacers.forEach(team => {
        boxHTML += `
            <div class="answer-col" id="col-${team.id}">
                <h4>Tim ${team.name}</h4>
                <input type="number" id="answer-input-${team.id}" placeholder="Jawab!" onkeydown="if(event.key === 'Enter') checkTeamAnswer('${team.id}');">
                <button class="team-submit" onclick="checkTeamAnswer('${team.id}')">Kirim!</button>
            </div>
        `;
    });

    boxHTML += `</div></div>`;
    return boxHTML;
}

function displayNextMathRaceQuestion() {
    document.getElementById('question-box').style.display = 'block'; 

    if (currentQuestionIndex >= availableQuestions.length) {
        showEndGamePopUp(null); 
        return;
    }

    const [questionText, _] = availableQuestions[currentQuestionIndex];
    document.getElementById('current-question').textContent = `❓ Soal #${currentQuestionIndex + 1} dari ${availableQuestions.length}: Berapakah ${questionText}?`;

    teamRacers.forEach(team => {
        const inputElement = document.getElementById(`answer-input-${team.id}`);
        const buttonElement = inputElement.parentElement.querySelector('button');
        const colElement = document.getElementById(`col-${team.id}`);

        inputElement.value = '';
        inputElement.disabled = false;
        buttonElement.disabled = false;
        colElement.style.backgroundColor = '#ffe0b2'; 
        colElement.classList.remove('correct', 'wrong'); // Reset classes
    });

    if (teamRacers.length > 0) {
        document.getElementById(`answer-input-${teamRacers[0].id}`).focus();
    }
    isQuestionActive = true; 
}

function checkTeamAnswer(teamId) {
    if (!isQuestionActive) return; 
    
    const settings = currentGameData.settings || {};
    const questionCount = settings.questionCount || 10;
    const raceSteps = settings.stepsToWin || 100;
    const stepSize = raceSteps / questionCount; 
    
    const inputElement = document.getElementById(`answer-input-${teamId}`);
    const answerColElement = document.getElementById(`col-${teamId}`);
    const team = teamRacers.find(t => t.id === teamId);

    const userAnswer = parseInt(inputElement.value);
    const [_, correctAnswer] = availableQuestions[currentQuestionIndex]; 

    if (isNaN(userAnswer)) {
        answerColElement.classList.add('wrong');
        setTimeout(() => answerColElement.classList.remove('wrong'), 300);
        return;
    }

    if (userAnswer === correctAnswer) {
        isQuestionActive = false; 
        
        answerColElement.classList.add('correct'); 
        alert(`🥇 Tim ${team.name} TERCEPAT! Jawaban benar. ${team.name} Maju!`);
        
        const isWinner = moveRacer(teamId, stepSize);
        
        if (!isWinner) {
            currentQuestionIndex++; 
            setTimeout(() => {
                displayNextMathRaceQuestion(); 
            }, 2000); 
        }

    } else {
        answerColElement.classList.add('wrong'); 
        setTimeout(() => answerColElement.classList.remove('wrong'), 500); 

        alert(`❌ Tim ${team.name} SALAH! Coba lagi!`);
        inputElement.value = ''; 
        inputElement.focus();
    }
}

function moveRacer(teamId, stepSize) {
    const team = teamRacers.find(t => t.id === teamId);
    
    racerPositions[teamId] += stepSize;
    let newPosition = racerPositions[teamId];

    if (newPosition > trackLength) newPosition = trackLength;
    
    document.getElementById(`racer-${teamId}`).style.transform = `translateX(${newPosition}%)`;
    
    if (newPosition >= trackLength) { 
        showEndGamePopUp(team); 
        return true;
    }
    return false;
}

// ====================================================================
// LOGIKA GAME 2: MYSTERY BOX
// ====================================================================

function renderMysteryBoxGame() {
    let html = `
        <div class="mystery-container">
            <div class="score-and-turn-indicator">
                <div id="mystery-turn-indicator" class="turn-indicator">Pilih Kotak untuk Mulai!</div>
                <div id="mystery-score-board" class="score-board">
                    ${teamRacers.map(t => `<div id="mystery-score-${t.id}" class="team-score-card team-${t.id}">${t.char} <span class="score-value">0</span></div>`).join('')}
                </div>
            </div>
            
            <div class="mystery-box-grid-wrapper">
                <div class="box-grid box-grid-12" id="mystery-box-grid" style="grid-template-columns: repeat(${Math.min(BOX_COUNT, 12) > 4 ? 4 : 3}, 1fr);">
                    ${mysteryBoxQuestions.map((q, index) => `
                        <button class="mystery-box-button ${q.color}" 
                                data-box-id="${q.id}"
                                onclick="openMysteryBox(${q.id})">
                            ${index + 1}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="question-box" id="mystery-question-box" style="display:none;">
                <div class="character-feedback-container">
                    <span id="mystery-character-feedback" class="character-feedback-emoji">🤔</span>
                    <h3 id="mystery-current-question" style="color:#D50000;"></h3>
                </div>
                <div class="group-answer-section mystery-rebutan-answer-section">
                    ${teamRacers.map(t => `
                        <div class="answer-col" id="mystery-col-${t.id}">
                            <h4>Tim ${t.name}</h4>
                            <input type="number" id="mystery-answer-input-${t.id}" placeholder="Jawab!" onkeydown="if(event.key === 'Enter') checkMysteryBoxAnswer('${t.id}');" disabled>
                            <button class="team-submit" onclick="checkMysteryBoxAnswer('${t.id}')" disabled>Kirim!</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    return html;
}

function openMysteryBox(boxId) {
    if (isBoxOpen) return; 
    
    const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
    const questionData = mysteryBoxQuestions.find(q => q.id === boxId);

    if (questionData.opened) return; 
    
    isBoxOpen = true; 
    document.getElementById('mystery-turn-indicator').textContent = "REBUT JAWABANNYA!";
    
    boxElement.classList.add('pop-up-box');
    
    const questionBox = document.getElementById('mystery-question-box');
    questionBox.style.display = 'block';
    
    document.getElementById('mystery-current-question').textContent = `${questionData.question}`;
    document.getElementById('mystery-character-feedback').innerHTML = '🧐'; 
    
    teamRacers.forEach(team => {
        const colElement = document.getElementById(`mystery-col-${team.id}`);
        document.getElementById(`mystery-answer-input-${team.id}`).value = '';
        document.getElementById(`mystery-answer-input-${team.id}`).disabled = false;
        document.querySelector(`#mystery-col-${team.id} button`).disabled = false;
        colElement.style.backgroundColor = '#ffe0b2'; 
        colElement.classList.remove('correct', 'wrong'); // Reset classes
    });
    
    document.querySelectorAll('.mystery-box-button').forEach(btn => btn.disabled = true);
    
    activeBoxId = boxId;
    if (teamRacers.length > 0) {
        document.getElementById(`mystery-answer-input-${teamRacers[0].id}`).focus();
    }
}

function checkMysteryBoxAnswer(teamId) {
    if (!isBoxOpen || !activeBoxId) return;
    
    const inputElement = document.getElementById(`mystery-answer-input-${teamId}`);
    const answerColElement = document.getElementById(`mystery-col-${teamId}`);
    const team = teamRacers.find(t => t.id === teamId);
    
    const userAnswer = parseInt(inputElement.value);
    const questionData = mysteryBoxQuestions.find(q => q.id === activeBoxId);
    const correctAnswer = questionData.answer;
    
    if (isNaN(userAnswer)) {
        answerColElement.classList.add('wrong');
        setTimeout(() => answerColElement.classList.remove('wrong'), 300);
        return;
    }
    
    // Blokir semua input setelah jawaban pertama dikirim (untuk menghindari spam)
    teamRacers.forEach(t => {
        document.getElementById(`mystery-answer-input-${t.id}`).disabled = true;
        document.querySelector(`#mystery-col-${t.id} button`).disabled = true;
    });

    if (userAnswer === correctAnswer) {
        // JAWABAN BENAR
        isBoxOpen = false; 
        
        document.getElementById('mystery-character-feedback').innerHTML = '🥳'; 
        answerColElement.classList.add('correct'); 
        alert(`🎉 TIM ${team.name} TERCEPAT! Berhak mengambil kotak!`);
        
        const boxElement = document.querySelector(`[data-box-id="${activeBoxId}"]`);
        boxElement.classList.add('opened');
        boxElement.innerHTML = team.char; 
        mysteryBoxQuestions.find(q => q.id === activeBoxId).opened = true;
        mysteryBoxSolvedCount++;
        
        teamScores[teamId] += 1;
        document.querySelector(`#mystery-score-${teamId} .score-value`).textContent = teamScores[teamId];
        
        if (mysteryBoxSolvedCount === BOX_COUNT) {
            setTimeout(showMysteryWinnerPopUp, 2000); 
        } else {
            setTimeout(resetMysteryBoxGame, 2000);
        }
        
    } else {
        // JAWABAN SALAH: BUKA KEMBALI KESEMPATAN UNTUK SEMUA TIM
        answerColElement.classList.add('wrong');
        document.getElementById('mystery-character-feedback').innerHTML = '😥'; 
        alert(`❌ TIM ${team.name} SALAH! Rebutan dibuka lagi!`);
        
        inputElement.value = '';
        
        teamRacers.forEach(t => {
            const currentTeamCol = document.getElementById(`mystery-col-${t.id}`);
            if (t.id !== teamId) {
                document.getElementById(`mystery-answer-input-${t.id}`).disabled = false;
                document.querySelector(`#mystery-col-${t.id} button`).disabled = false;
            } else {
                currentTeamCol.style.backgroundColor = '#f1f1f1';
            }
        });
        
        isBoxOpen = true; 
    }
}

function resetMysteryBoxGame() {
    document.getElementById('mystery-question-box').style.display = 'none';
    document.getElementById('mystery-turn-indicator').textContent = "Pilih Kotak!";
    document.getElementById('mystery-character-feedback').innerHTML = '😁'; 
    activeBoxId = null;
    
    document.querySelectorAll('.mystery-box-button').forEach(btn => {
        btn.classList.remove('pop-up-box'); 
        if (!btn.classList.contains('opened')) {
            btn.disabled = false;
        }
    });
    
    isBoxOpen = false;
}

function showMysteryWinnerPopUp() {
    let winnerId = teamRacers[0].id;
    let maxScore = teamScores[winnerId];
    
    teamRacers.forEach(team => {
        if (teamScores[team.id] > maxScore) {
            maxScore = teamScores[team.id];
            winnerId = team.id;
        }
    });
    
    const winnerTeam = teamRacers.find(t => t.id === winnerId);
    showEndGamePopUp(winnerTeam, maxScore);
}

// ====================================================================
// LOGIKA GAME 3: MEMORY CARD
// ====================================================================

function renderMemoryCardGame() {
    return `
        <div class="memory-container">
            <div class="score-and-turn-indicator">
                <div id="turn-indicator" class="turn-indicator"></div>
                <div id="score-board" class="score-board">
                    ${teamRacers.map(t => `<div id="score-${t.id}" class="team-score-card team-${t.id}">${t.char} <span class="score-value">0</span></div>`).join('')}
                </div>
            </div>
            <div class="memory-grid" id="memory-grid">
                </div>
        </div>
    `;
}

function initializeMemoryCardGame() {
    // GENERATE PASANGAN KARTU UNIK
    const questions = generateUniqueQuestions(MEMORY_PAIR_COUNT, 25, 12);
    let cards = [];
    questions.forEach((q, index) => {
        cards.push({ value: q[0], pairId: index }); // Soal (String)
        cards.push({ value: String(q[1]), pairId: index }); // Jawaban (String)
    });
    
    shuffledCards = cards.sort(() => 0.5 - Math.random());
    
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    shuffledCards.forEach((item, index) => {
        const cardHTML = `
            <div class="memory-card" data-card-id="${index}" data-pair-id="${item.pairId}" data-value="${item.value}" onclick="flipCard(${index})">
                <div class="card-face card-back">❓</div>
                <div class="card-face card-front">${item.value}</div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
    
    cardsFlipped = [];
    lockBoard = false;
    matchedPairsCount = 0;
    activeTeamIndex = 0;
    teamScores = teamRacers.reduce((acc, team) => ({ ...acc, [team.id]: 0 }), {}); 
    updateTurnIndicator();
}

function updateTurnIndicator() {
    const activeTeam = teamRacers[activeTeamIndex];
    const indicator = document.getElementById('turn-indicator');
    indicator.innerHTML = `Giliran Tim <span style="font-size:1.5em">${activeTeam.char} ${activeTeam.name}</span>`;
    
    document.querySelectorAll('.team-score-card').forEach(card => card.classList.remove('active-turn'));
    document.getElementById(`score-${activeTeam.id}`).classList.add('active-turn');
}

function flipCard(cardId) {
    if (lockBoard) return;
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    
    if (cardElement.classList.contains('flip') || cardsFlipped.length === 2) return; 
    
    cardElement.classList.add('flip');
    cardsFlipped.push(cardElement);

    if (cardsFlipped.length === 2) {
        lockBoard = true;
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = cardsFlipped;
    
    const isSamePairId = card1.dataset.pairId === card2.dataset.pairId;
    const isDifferentValue = card1.dataset.value !== card2.dataset.value; 
    
    const isMatch = isSamePairId && isDifferentValue;
    
    if (isMatch) {
        disableCards(card1, card2);
        
        const activeTeamId = teamRacers[activeTeamIndex].id;
        teamScores[activeTeamId] += 1;
        document.querySelector(`#score-${activeTeamId} .score-value`).textContent = teamScores[activeTeamId];
        
        matchedPairsCount++;
        if (matchedPairsCount === MEMORY_PAIR_COUNT) {
            setTimeout(() => {
                showMemoryWinnerPopUp();
            }, 1000);
        }
        
    } else {
        unflipCards(card1, card2);
        activeTeamIndex = (activeTeamIndex + 1) % teamRacers.length;
        setTimeout(updateTurnIndicator, 1200);
    }
}

function disableCards(card1, card2) {
    card1.classList.add('matched');
    card2.classList.add('matched');
    
    card1.onclick = null;
    card2.onclick = null;
    resetBoard();
}

function unflipCards(card1, card2) {
    setTimeout(() => {
        card1.classList.remove('flip');
        card2.classList.remove('flip');
        resetBoard();
    }, 1200); 
}

function resetBoard() {
    [cardsFlipped, lockBoard] = [[], false];
}

function showMemoryWinnerPopUp() {
    let winnerId = teamRacers[0].id;
    let maxScore = teamScores[winnerId];
    
    teamRacers.forEach(team => {
        if (teamScores[team.id] > maxScore) {
            maxScore = teamScores[team.id];
            winnerId = team.id;
        }
    });
    
    const winnerTeam = teamRacers.find(t => t.id === winnerId);
    showEndGamePopUp(winnerTeam, maxScore);
}

// ====================================================================
// LOGIKA GAME 4: WHEEL OF MATH
// ====================================================================

function renderWheelOfMathGame() {
    const totalSegments = currentGameData.wheelSegments.length;
    
    let segmentsHTML = currentGameData.wheelSegments.map((seg, index) => {
        const angle = 360 / totalSegments;
        const skew = 90 - angle;
        const color = seg.color;
        const rotate = index * angle;
        
        return `
            <li style="--color: ${color}; transform: rotate(${rotate}deg) skewY(${skew}deg);">
                <span style="color: white; transform: skewY(-${skew}deg) rotate(${angle / 2}deg);">
                    ${seg.label}
                </span>
            </li>
        `;
    }).join('');

    return `
        <div class="wheel-container">
             <div class="score-and-turn-indicator">
                <div id="wheel-turn-indicator" class="turn-indicator">Target Skor: ${wheelTargetScore}</div>
                <div id="wheel-score-board" class="score-board">
                    ${teamRacers.map(t => `<div id="wheel-score-${t.id}" class="team-score-card team-${t.id}">${t.char} <span class="score-value">0</span></div>`).join('')}
                </div>
            </div>
            
            <div class="wheel-wrapper">
                <div class="wheel-pin"></div>
                <ul class="wheel" id="wheel">
                    ${segmentsHTML}
                </ul>
                <button class="spin-button" id="spin-button" onclick="spinWheel()">PUTAR RODA!</button>
            </div>
            
            <div class="question-box wheel-question-box" id="wheel-question-box" style="display:none;">
                <div class="character-feedback-container">
                    <span id="wheel-character-feedback" class="character-feedback-emoji"></span>
                    <h3 id="wheel-current-question" style="color:#D50000;"></h3>
                </div>
                <div class="group-answer-section wheel-rebutan-answer-section">
                    ${teamRacers.map(t => `
                        <div class="answer-col" id="wheel-col-${t.id}">
                            <h4>Tim ${t.name}</h4>
                            <input type="number" id="wheel-answer-input-${t.id}" placeholder="Jawab!" onkeydown="if(event.key === 'Enter') checkWheelAnswer('${t.id}');" disabled>
                            <button class="team-submit" onclick="checkWheelAnswer('${t.id}')" disabled>Kirim!</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function updateWheelScoreboard() {
    teamRacers.forEach(team => {
        document.querySelector(`#wheel-score-${team.id} .score-value`).textContent = teamScores[team.id];
    });
}

function spinWheel() {
    if (wheelIsSpinning) return;
    wheelIsSpinning = true;
    document.getElementById('spin-button').disabled = true;
    document.getElementById('wheel-question-box').style.display = 'none'; 

    const wheel = document.getElementById('wheel');
    const totalSegments = currentGameData.wheelSegments.length;
    const segmentAngle = 360 / totalSegments;
    
    const winningSegmentIndex = Math.floor(Math.random() * totalSegments);
    const winningSegment = currentGameData.wheelSegments[winningSegmentIndex];
    
    const extraTurns = 5; 
    const targetRotation = (extraTurns * 360) + (360 - (winningSegmentIndex * segmentAngle) - (segmentAngle / 2));
    
    wheel.style.transition = 'transform 6s cubic-bezier(0.1, 0.8, 0.4, 1)'; 
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    
    document.getElementById('wheel-turn-indicator').textContent = 'Roda Berputar!';
    document.getElementById('wheel-character-feedback').innerHTML = '🤞'; 

    setTimeout(() => {
        wheel.style.transition = 'none'; 
        wheel.style.transform = `rotate(${targetRotation % 360}deg)`; 
        handleWheelResult(winningSegment);
    }, 6000); // Tunggu 6 detik untuk animasi 6s
}

function handleWheelResult(segment) {
    wheelIsSpinning = false;
    document.getElementById('spin-button').disabled = false;
    document.getElementById('wheel-turn-indicator').textContent = segment.label.toUpperCase() + "!";
    
    document.getElementById('wheel-character-feedback').innerHTML = '🥳'; 
    
    if (segment.difficulty === 'BONUS') {
        const bonusPoints = 2; // Nilai bonus tetap 2
        alert(`🎉 BONUS POIN! Semua tim mendapat +${bonusPoints} poin!`); 
        teamRacers.forEach(team => {
            teamScores[team.id] += bonusPoints;
        });
        updateWheelScoreboard();
        setTimeout(resetWheelQuestion, 2000);

    } else {
        displayWheelQuestion(segment);
    }
}

function displayWheelQuestion(segment) {
    let maxResult = 20; 
    if (segment.difficulty === 'HARD') maxResult = 40;
    
    const [questionText, answer] = generateUniqueQuestions(1, maxResult, 20)[0]; 
    wheelQuestion = { question: questionText, answer: answer, points: segment.value };
    
    const questionBox = document.getElementById('wheel-question-box');
    questionBox.style.display = 'block';
    
    document.getElementById('wheel-current-question').textContent = `[${segment.label}] Berapakah ${questionText}? (Nilai: ${wheelQuestion.points} pts)`;
    document.getElementById('wheel-turn-indicator').textContent = 'REBUT JAWABANNYA!';
    document.getElementById('wheel-character-feedback').innerHTML = '🧐'; 
    
    teamRacers.forEach(team => {
        const colElement = document.getElementById(`wheel-col-${team.id}`);
        document.getElementById(`wheel-answer-input-${team.id}`).value = '';
        document.getElementById(`wheel-answer-input-${team.id}`).disabled = false;
        document.querySelector(`#wheel-col-${team.id} button`).disabled = false;
        colElement.style.backgroundColor = '#ffe0b2';
        colElement.classList.remove('correct', 'wrong'); // Reset classes
    });
    isQuestionActive = true;
    if (teamRacers.length > 0) {
        document.getElementById(`wheel-answer-input-${teamRacers[0].id}`).focus();
    }
}

function checkWheelAnswer(teamId) {
    if (!isQuestionActive || !wheelQuestion) return; 

    const inputElement = document.getElementById(`wheel-answer-input-${teamId}`);
    const answerColElement = document.getElementById(`wheel-col-${teamId}`);
    const team = teamRacers.find(t => t.id === teamId);

    const userAnswer = parseInt(inputElement.value);
    const correctAnswer = wheelQuestion.answer;
    
    if (isNaN(userAnswer)) {
        answerColElement.classList.add('wrong');
        setTimeout(() => answerColElement.classList.remove('wrong'), 300);
        return;
    }
    
    // Blokir semua input setelah jawaban pertama dikirim
    teamRacers.forEach(t => {
        document.getElementById(`wheel-answer-input-${t.id}`).disabled = true;
        document.querySelector(`#wheel-col-${t.id} button`).disabled = true;
    });

    if (userAnswer === correctAnswer) {
        // JAWABAN BENAR
        isQuestionActive = false;
        
        document.getElementById('wheel-character-feedback').innerHTML = '🏆'; 
        answerColElement.classList.add('correct'); 
        
        teamScores[teamId] += wheelQuestion.points;
        updateWheelScoreboard();
        
        alert(`🎉 TIM ${team.name} BENAR! Mendapat +${wheelQuestion.points} poin!`);
        
        // Cek Pemenang (menggunakan target score dari settings)
        if (teamScores[teamId] >= wheelTargetScore) { 
            setTimeout(() => showEndGamePopUp(team), 500);
            return;
        }

        setTimeout(resetWheelQuestion, 2000);
        
    } else {
        // JAWABAN SALAH: BUKA KEMBALI KESEMPATAN UNTUK SEMUA TIM
        answerColElement.classList.add('wrong'); 
        document.getElementById('wheel-character-feedback').innerHTML = '😭'; 
        alert(`❌ TIM ${team.name} SALAH! Coba lagi!`);
        
        inputElement.value = '';
        
        teamRacers.forEach(t => {
            const currentTeamCol = document.getElementById(`wheel-col-${t.id}`);
            if (t.id !== teamId) {
                document.getElementById(`wheel-answer-input-${t.id}`).disabled = false;
                document.querySelector(`#wheel-col-${t.id} button`).disabled = false;
            } else {
                currentTeamCol.style.backgroundColor = '#f1f1f1';
            }
        });
    }
}

function resetWheelQuestion() {
    isQuestionActive = false;
    wheelQuestion = null;
    document.getElementById('wheel-question-box').style.display = 'none';
    document.getElementById('wheel-turn-indicator').textContent = `Target Skor: ${wheelTargetScore}`;
    document.getElementById('wheel-character-feedback').innerHTML = '👇'; 
}


// ====================================================================
// LOGIKA POP-UP KEMENANGAN & INISIALISASI
// ====================================================================

function showEndGamePopUp(winnerTeam, maxScore = null) {
    const popup = document.getElementById('winner-popup');
    const title = document.getElementById('winner-title');
    const message = document.getElementById('winner-message');
    
    document.getElementById('game-area').style.display = 'none';

    if (winnerTeam) {
        let gameType = currentGameData ? currentGameData.type : 'Game';
        let messageText = '';

        if (gameType === 'MathRace') {
            messageText = `Karakter ${winnerTeam.char} mencapai garis finish. Kalian adalah Math Hero!`;
        } else if (gameType === 'MysteryBox') {
            messageText = `${winnerTeam.char} Memenangkan ${maxScore} Kotak Misteri! Kalian HEBAT!`;
        } else if (gameType === 'MemoryCard') {
            messageText = `${winnerTeam.char} Memenangkan ${maxScore} Pasang! Kalian HEBAT!`;
        } else if (gameType === 'WheelOfMath') {
            messageText = `Tim ${winnerTeam.name} mencapai target ${wheelTargetScore} poin. Kalian adalah Math Hero!`;
        }
        
        title.textContent = `SELAMAT, TIM ${winnerTeam.name}!`;
        message.textContent = messageText;
        
    } else {
        // Digunakan jika pertanyaan habis (Math Race)
        title.textContent = `PERLOMBAAN SELESAI!`;
        message.textContent = `Semua soal telah terjawab. Cek skor tim terbaik!`;
    }

    popup.style.display = 'flex';
}

function closeWinnerPopUp() {
    document.getElementById('winner-popup').style.display = 'none';
    goBackToSelection();
}

document.addEventListener('DOMContentLoaded', () => {
    // Memuat data tim dan game dari Firebase saat aplikasi dimulai
    loadInitialData(); 
});
// Global state management
const AppState = {
    currentPage: 'home',
    user: null,
    classes: [],
    quizzes: [],
    materials: [],
    helpRequests: [],
    reports: [],
    attendanceRecords: []
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    loadMockData();

    // Só vai para home se não houver hash de sala
    if (!window.location.hash.startsWith('#join/')) {
        navigateTo('home');
    }
});
// Initialize application
function initializeApp() {
    console.log('Inicializando Plataforma Educacional...');

    // Set up event listeners
    setupEventListeners();

    // Initialize components
    initializeComponents();

    // Show loading overlay briefly
    showLoading();
    setTimeout(hideLoading, 1000);
}

// Setup global event listeners
function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllModals();
            closeAllSections();
        }
    });

    // Handle form submissions
    document.addEventListener('submit', function (e) {
        e.preventDefault();
    });
}

// Initialize components
function initializeComponents() {
    // Initialize any component-specific logic here
    console.log('Componentes inicializados');
}

// SPA Navigation System
function navigateTo(page) {
    const paginaAntiga = AppState.currentPage;

    const buttonSair = document.getElementById("sair");
    const spanText = buttonSair.querySelector("span");
    const nav = document.querySelector(".nav");
    const inicio = document.querySelector("#inicio")


    if (page == "home" && nav.classList.contains("show")) {
        exibirMenu();
    }
    if (page != "home") {
        if (page == "teacher-panel") {
            RoomManager.openConnectedStudents();
            buttonSair.onclick = endRoom;
            spanText.textContent = "Desativar";
            buttonSair.style.display = "flex";
        } else {
            buttonSair.onclick = leaveRoom;
            spanText.textContent = "Sair";
            buttonSair.style.display = "none";
        }
        inicio.style.display = "none";
    } else {
        buttonSair.style.display = "none";
        inicio.style.display = "none";
    }


    AppState.currentPage = page;

    history.pushState({ page }, '', `#${page}`);

    loadPageContent(page);
    updateNavigationState(page);
}

function openConnectedStudents() {
    RoomManager.openConnectedStudents();
}

window.openConnectedStudents = openConnectedStudents;

// Load page content dynamically
async function loadPageContent(page) {
    const mainContent = document.getElementById('main-content');

    try {
        showLoading();

        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await fetch(`pages/${page}.html`);

        if (!response.ok) {
            throw new Error(`Página não encontrada: ${page}`);
        }

        const content = await response.text();
        mainContent.innerHTML = content;

        // Initialize page-specific functionality
        initializePageFunctionality(page);

        hideLoading();

    } catch (error) {
        console.error('Erro ao carregar página:', error);
        mainContent.innerHTML = `
            <div class="error-page">
                <div class="container">
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h1>Página não encontrada</h1>
                        <p>A página que você está procurando não existe.</p>
                        <button class="btn btn-primary" onclick="navigateTo('home')">
                            <i class="fas fa-home"></i> Voltar ao Início
                        </button>
                    </div>
                </div>
            </div>
        `;
        hideLoading();
    }
}

// Initialize page-specific functionality
function initializePageFunctionality(page) {
    switch (page) {
        case 'student-panel':
            initializeStudentPanel();
            break;
        case 'teacher-panel':
            initializeTeacherPanel();
            break;
        case 'home':
            initializeHomePage();
            break;
    }
}

// Initialize home page
function initializeHomePage() {
    console.log('Página inicial carregada');
}

// Initialize student panel
function initializeStudentPanel() {
    loadStudentClasses();
}

// Initialize teacher panel
function initializeTeacherPanel() {
    loadTeacherClasses();
    loadTeacherMaterials();
    loadAttendanceRecords();
}

// Update navigation state
function updateNavigationState(page) {
    // Update active navigation items if needed
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
    });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function (e) {
    if (e.state && e.state.page) {
        loadPageContent(e.state.page);
    } else {
        navigateTo('home');
    }
});

// Loading functions
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Toast notification system
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': return 'fas fa-info-circle';
        default: return 'fas fa-check-circle';
    }
}

// Modal functions
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
        modal.style.display = 'none';
    });
}

function closeAllSections() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}





function openHelpRequests() {
    closeAllSections();
    const section = document.getElementById('help-requests-section');
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
        loadHelpRequests();
    }
}


const api = {
    salas: { getAll: async () => [] },
    maosLevantadas: { getAll: async () => [] },
};


// Load mock data
async function loadMockData() {
    try {
        AppState.classes = await api.salas.getAll();
    } catch (error) {
        showToast("Erro ao carregar dados iniciais: " + error.message, "error");
        console.error("Erro ao carregar dados iniciais:", error);
    }
}

// Teacher panel functions
window.openHelpRequests = openHelpRequests;






// New Room System Functions

// Student Access Functions
function showStudentAccess() {
    // Hide hero section and show student access
    const heroSection = document.querySelector('.hero-section');
    const featuresSection = document.querySelector('.features-section');
    const studentAccessSection = document.getElementById('student-access-section');

    if (heroSection) heroSection.style.display = 'none';
    if (featuresSection) featuresSection.style.display = 'none';
    if (studentAccessSection) studentAccessSection.style.display = 'flex';
}

function hideStudentAccess() {
    // Show hero section and hide student access
    const heroSection = document.querySelector('.hero-section');
    const featuresSection = document.querySelector('.features-section');
    const studentAccessSection = document.getElementById('student-access-section');
    const codeInputSection = document.getElementById('code-input-section');
    const qrScannerSection = document.getElementById('qr-scanner-section');

    if (heroSection) heroSection.style.display = 'block';
    if (featuresSection) featuresSection.style.display = 'block';
    if (studentAccessSection) studentAccessSection.style.display = 'none';
    if (codeInputSection) codeInputSection.style.display = 'none';
    if (qrScannerSection) qrScannerSection.style.display = 'none';

    // Stop QR scanner if active
    if (QRScanner.isScanning) {
        QRScanner.stop();
    }
}

function showCodeInput() {
    const studentAccessSection = document.getElementById('student-access-section');
    const codeInputSection = document.getElementById('code-input-section');

    if (studentAccessSection) studentAccessSection.style.display = 'none';
    if (codeInputSection) codeInputSection.style.display = 'flex';

    // Focus on input
    setTimeout(() => {
        const codeInput = document.getElementById('room-code-input');
        if (codeInput) codeInput.focus();
    }, 100);
}



function backToStudentAccess() {
    const studentAccessSection = document.getElementById('student-access-section');
    const codeInputSection = document.getElementById('code-input-section');
    const qrScannerSection = document.getElementById('qr-scanner-section');

    if (studentAccessSection) studentAccessSection.style.display = 'flex';
    if (codeInputSection) codeInputSection.style.display = 'none';
    if (qrScannerSection) qrScannerSection.style.display = 'none';

    // Stop QR scanner if active
    if (QRScanner.isScanning) {
        QRScanner.stop();
    }
}

function joinRoomByCode(roomCode = null) {
    if (!roomCode) {
        const codeInput = document.getElementById('room-code-input');
        roomCode = codeInput ? codeInput.value.trim() : '';
    }

    if (!roomCode || roomCode.length !== 6) {
        showToast('Por favor, digite um código de 6 dígitos', 'error');
        return;
    }

    roomCode = roomCode.toUpperCase();
    showLoading();

    RoomManager.joinRoom(roomCode)
        .then(room => {
            hideLoading();
            showToast(`Entrando na sala ${roomCode}...`, 'success');

            // Clear input
            const codeInput = document.getElementById('room-code-input');
            if (codeInput) codeInput.value = '';

            // Navigate to student room
            navigateTo('student-room');
        })
        .catch(error => {
            hideLoading();
            showToast(error, 'error');
        });
}

// QR Scanner Functions
function startQRScanner() {
    showLoading();

    QRScanner.start()
        .then(() => {
            hideLoading();
            showToast('Câmera iniciada. Posicione o QR Code na área de escaneamento', 'info');

            // Simulate QR detection for demo (in real app, would use actual QR detection)
            if (RoomState.roomCode) {
                QRScanner.simulateDetection(RoomState.roomCode);
            }
        })
        .catch(error => {
            hideLoading();
            showToast(error, 'error');
        });
}

// Teacher Panel Functions
function initializeTeacherPanel() {

    // Create room automatically when teacher panel loads
    if (!RoomState.isTeacher && !RoomState.currentRoom) {
        const roomCode = RoomManager.createRoom();
        showToast(`Sala criada com código: ${roomCode}`, 'success');
    } else if (RoomState.isTeacher) {
        RoomManager.updateTeacherUI();
    }
}

async function generateNewRoomCode() {
    if (confirm('Gerar um novo código irá desconectar todos os alunos. Continuar?')) {
        try {
            showLoading(); // Mostra carregando

            // Cria uma nova sala e espera o retorno do novo código
            const newCode = await RoomManager.createRoom();

            // Atualiza o código mostrado na tela
            const codeElement = document.getElementById('qr-room-code');
            if (codeElement) codeElement.textContent = newCode;

            // Limpa o container do QR antigo
            const qrContainer = document.getElementById('qr-code-container');
            if (qrContainer) qrContainer.innerHTML = '';

            // Marca que ainda não tem QR gerado
            RoomState.qrCodeGenerated = false;

            // Gera automaticamente o novo QR Code
            await RoomManager.generateQRCode();

            hideLoading();
            showToast(`Novo QR Code gerado com sucesso! Código: ${newCode}`, 'success');

        } catch (error) {
            hideLoading();
            showToast('Erro ao gerar novo QR Code: ' + error.message, 'error');
            console.error(error);
        }
    }
}


function generateQRCode() {
    if (!RoomState.roomCode) {
        showToast('Nenhuma sala ativa', 'error');
        return;
    }

    closeAllSections();
    const section = document.getElementById('qr-code-section');
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });

        if (!RoomState.qrCodeGenerated) {
            showLoading();

            RoomManager.generateQRCode()
                .then(() => {
                    hideLoading();
                    showToast('QR Code gerado com sucesso!', 'success');
                })
                .catch(error => {
                    hideLoading();
                    showToast(`Erro ao gerar QR Code: ${error}`, 'error');
                });
        }
    }
}

function downloadQRCode() {
    RoomManager.downloadQRCode();
}





function endRoom() {
    if (confirm('Tem certeza que deseja encerrar a sala? Todos os alunos serão desconectados.')) {
        RoomManager.endRoom();
    }
}

// Student Room Functions
function leaveRoom() {
    if (confirm('Tem certeza que deseja sair da sala?')) {
        RoomManager.leaveRoom();
    }
}



function raiseHand() {

    showToast('Mão levantada! O professor foi notificado.', 'success');
}


// Load Functions for Teacher Panel

// Update navigation to handle new pages
const originalNavigateTo = navigateTo;
navigateTo = function (page) {
    // Handle special navigation cases
    if (page === 'student-room') {
        if (!RoomState.isStudent || !RoomState.currentRoom) {
            showToast('Você precisa entrar em uma sala primeiro', 'error');
            navigateTo('home');
            return;
        }
    }

    // Call original navigation function
    originalNavigateTo(page);
};

// Export new functions for global access
window.showStudentAccess = showStudentAccess;
window.hideStudentAccess = hideStudentAccess;
window.showCodeInput = showCodeInput;
window.backToStudentAccess = backToStudentAccess;
window.joinRoomByCode = joinRoomByCode;
window.startQRScanner = startQRScanner;
window.generateNewRoomCode = generateNewRoomCode;
window.generateQRCode = generateQRCode;
window.downloadQRCode = downloadQRCode;
window.endRoom = endRoom;
window.leaveRoom = leaveRoom;
window.raiseHand = raiseHand;


// Student Name Functions
function confirmStudentName() {
    const nameInput = document.getElementById('student-name-input');
    const name = nameInput ? nameInput.value.trim() : '';

    if (StudentManager.confirmName(name)) {
        // Clear input
        if (nameInput) {
            nameInput.value = ''

            const buttonSair = document.getElementById("sair");
            buttonSair.style.display = "flex";
            console.log("até aqui")

            //tempo de gaantia de carregamento do Mão Levantada e as outras coisas
            showLoading();
            setTimeout(() => {
                hideLoading();
                closeAllSections();
            }, 2200);
        };
    };
};

//  
//     const spanText = buttonSair.querySelector("span");
//     const nav = document.querySelector(".nav");
//     const inicio = document.querySelector("#inicio")


//     if (page == "home" && nav.classList.contains("show")) {
//         exibirMenu();
//     }
//     if (page != "home") {
//         if (page == "teacher-panel") {
//             RoomManager.openConnectedStudents();
//             buttonSair.onclick = endRoom;
//             spanText.textContent = "Desativar";
//         } else {
//             buttonSair.onclick = leaveRoom;
//             spanText.textContent = "Sair";
//         }

// Handle Enter key in student name input
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('student-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmStudentName();
            }
        });
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;

    if (!hash) return;

    // Se o link tiver #join/
    if (hash.startsWith('#join/')) {
        const parts = hash.split('/');
        const roomCode = parts[1];

        if (roomCode && roomCode.length === 6) {
            // Mostra acesso do aluno
            showStudentAccess();
            showCodeInput();

            // Preenche o código automaticamente
            const codeInput = document.getElementById('room-code-input');
            if (codeInput) codeInput.value = roomCode;

            // Mostra aviso e entra na sala automaticamente
            showToast(`Entrando na sala ${roomCode}...`, 'info');
            setTimeout(() => {
                joinRoomByCode(roomCode);
            }, 1000); // pequena espera só para UX mais suave
        }
    }
});



// Export function for global access
window.confirmStudentName = confirmStudentName;


// Student function to raise/lower hand
function raiseHand() {
    const statusMao = document.querySelector(".feature-item h3");

    const iconEmoje = document.querySelector(".feature-icon p");

    const divCriacao = document.createElement("div");
    divCriacao.classList.add("status-circle");
    const studentName = StudentManager.getName();
    if (!studentName) {
        showToast('Por favor, digite seu nome primeiro', 'error');
        return;
    }
    const icone = document.querySelector("#iconeMao i");
    if (icone.classList.contains("fa-hand-point-up")) {
        //Icone
        icone.classList.remove("fa-hand-point-up");
        icone.classList.add("fa-hand-fist");

        iconEmoje.textContent = "✊";

        //Texto
        statusMao.innerHTML = "Mão Abaixada ";
        divCriacao.style.backgroundColor = "red";
        statusMao.appendChild(divCriacao);
    } else {
        icone.classList.remove("fa-hand-fist");
        icone.classList.add("fa-hand-point-up");

        iconEmoje.textContent = "🙋‍♂️";

        //Texto
        divCriacao.style.backgroundColor = "blue";
        statusMao.innerHTML = "Mão Levantada ";
        statusMao.appendChild(divCriacao);
    }
    HandRaiseManager.raiseHand(studentName);
}


// Teacher function to open raised hands section
function openRaisedHands() {
    closeAllSections();
    const section = document.getElementById('raised-hands-section');
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
    }
    // Reforça o listener
    HandRaiseManager.listenToRaisedHands();
}

// === Detecta link do tipo #join/XXXXX e entra automaticamente na sala ===


// Teacher function to acknowledge a specific hand
function acknowledgeHand(studentId) {
    HandRaiseManager.acknowledgeHand(studentId);
}

window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash; // ex: "#join/8B3SMH"
    if (!hash) return; // se não tiver hash, não faz nada

    if (hash.startsWith('#join/')) {
        // Pega o código da sala (tudo depois de "#join/")
        const roomCode = hash.replace('#join/', '').trim();


        // Mostra a interface de estudante
        showStudentAccess();
        showCodeInput();

        // Espera um pouco para garantir que os elementos da tela já estão no DOM
        setTimeout(() => {
            const codeInput = document.getElementById('room-code-input');
            if (codeInput) {
                // Preenche o campo de código automaticamente
                codeInput.value = roomCode;

                // Mostra um aviso e tenta entrar
                showToast(`Entrando na sala ${roomCode}...`, 'info');

                // Chama a função que já existe no seu código para entrar
                joinRoomByCode(roomCode);
            } else {
                console.error("❌ Elemento #room-code-input não encontrado.");
            }
        }, 600); // meio segundo de espera
    }
});

window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#join/')) {
        const roomCode = window.location.hash.replace('#join/', '').trim();
        joinRoomByCode(roomCode);
    }
});

// Export hand raise functions for global access
window.raiseHand = raiseHand;
window.openRaisedHands = openRaisedHands;
window.acknowledgeHand = acknowledgeHand;

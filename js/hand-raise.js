import { StudentService } from './firebase-services.js';

const HandRaiseState = {
    raisedHands: [],
    studentHandRaised: false,
    lastHandRaiseTime: null,
    unsubscribers: [],
    notificationSound: null // Adicione esta linha
};

const HandRaiseManager = {

    // FUNÇÃO PARA INICIALIZAR O SOM - ADICIONE ISSO
    initNotificationSound: () => {
        try {
            // Cria o som usando Howler.js
            HandRaiseState.notificationSound = new Howl({
                src: ['sons/notificacao.mp3'],
                volume: 1.0,
                preload: true,
                onloaderror: function() {
                    HandRaiseManager.createFallbackSound();
                }
            });
        } catch (error) {
            console.warn('Erro ao inicializar Howler:', error);
            HandRaiseManager.createFallbackSound();
        }
    },

    // SOM ALTERNATIVO SE O HOWLER FALHAR - ADICIONE ISSO
    createFallbackSound: () => {
        try {
            // Cria um som simples como fallback
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Áudio não suportado');
        }
    },

    // FUNÇÃO PARA TOCAR O SOM - ADICIONE ISSO
    playNotificationSound: () => {
        if (HandRaiseState.notificationSound) {
            try {
                HandRaiseState.notificationSound.play();
            } catch (error) {
                console.warn('Erro ao tocar som com Howler:', error);
                HandRaiseManager.createFallbackSound();
            }
        } else {
            HandRaiseManager.createFallbackSound();
        }
    },

    raiseHand: async () => {
        const studentId = RoomState.studentId;
        if (!studentId) {
            showToast('ID do aluno não encontrado', 'error');
            return false;
        }

        // Buscar dados completos do aluno
        const student = await StudentService.getStudent(studentId);
        const studentName = student?.nome;
        if (!studentName) {
            showToast("Nome do aluno não encontrado", "error");
            return false;
        }

        try {
            const levantada = !HandRaiseState.studentHandRaised;
            await StudentService.raiseHand(studentId, levantada);

            HandRaiseState.studentHandRaised = levantada;
            HandRaiseState.lastHandRaiseTime = levantada ? new Date() : null;

            const message = levantada ? 'Mão levantada! O professor foi notificado.' : 'Mão abaixada';
            const type = levantada ? 'success' : 'info';

            showToast(message, type);

            return levantada;
        } catch (error) {
            showToast('Erro ao levantar a mão: ' + error.message, 'error');
            console.error('Erro ao levantar a mão:', error);
            return false;
        }
    },

    updateStudentHandButton: () => {
        const handButton = document.querySelector('div[onclick="raiseHand()"]');
        if (!handButton) return;

        const text = handButton.querySelector('h3');

        if (HandRaiseState.studentHandRaised) {
            icon.className = 'fas fa-hand-paper';
            text.innerHTML = 'Abaixar Mão';
            handButton.classList.add('hand-raised');
        } else {
            icon.className = 'fas fa-hand-fist';
            text.innerHTML = 'Levantar a Mão';
            handButton.classList.remove('hand-raised');
        }
    },

    // MODIFIQUE ESTA FUNÇÃO - ADICIONE A LINHA DO SOM
    showTeacherNotification: (count) => {
        const existingNotification = document.querySelector('.raised-hand-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 🔥 ADICIONE ESTA LINHA PARA TOCAR O SOM - É SÓ ISSO!
        HandRaiseManager.playNotificationSound();

        const notification = document.createElement('div');
        notification.className = 'raised-hand-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-hand-paper"></i>
                <span>${count} aluno${count > 1 ? 's' : ''} com a mão levantada</span>
                <i class="fas fa-volume-up" style="margin-left: auto;"></i>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        notification.addEventListener('click', () => {
            openRaisedHands();
            notification.remove();
        });
    },

    updateTeacherHandsDisplay: () => {
        const handsSection = document.getElementById('raised-hands-section');
        if (!handsSection) return;

        const handsList = handsSection.querySelector('.raised-hands-list');
        if (!handsList) return;

        if (HandRaiseState.raisedHands.length === 0) {
            handsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hand-paper" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <p>Nenhum aluno com a mão levantada</p>
                </div>
            `;
            return;
        }
        handsList.innerHTML = HandRaiseState.raisedHands.map(hand => `
            <div class="raised-hand-item">
                <div class="hand-student-info">
                    <i class="fas fa-hand-paper hand-icon"></i>
                    <span class="student-name">${hand.nome}</span>
                </div>
                <div class="hand-actions">
                    <span class="hand-time">${hand.maoLevantadaEm ? new Date(hand.maoLevantadaEm.toDate()).toLocaleTimeString() : ''}</span>
                    <button class="btn btn-small btn-secondary" onclick="acknowledgeHand('${hand.id}')">
                        <i class="fas fa-check"></i> Atender
                    </button>
                </div>
            </div>
        `).join('');
    },

    acknowledgeHand: async (studentId) => {
        try {
            await StudentService.raiseHand(studentId, false);
            showToast('Mão atendida com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao atender a mão: ' + error.message, 'error');
            console.error('Erro ao atender a mão:', error);
        }
    },

    clearAllHands: async () => {
        if (confirm('Tem certeza que deseja limpar todas as mãos levantadas?')) {
            try {
                for (const hand of HandRaiseState.raisedHands) {
                    await StudentService.raiseHand(hand.id, false);
                }

                showToast('Todas as mãos foram abaixadas', 'info');
            } catch (error) {
                showToast('Erro ao limpar mãos levantadas: ' + error.message, 'error');
                console.error('Erro ao limpar mãos levantadas:', error);
            }
        }
    },

    listenToRaisedHands: () => {
        if (!RoomState.roomCode) {
            console.warn("RoomCode não disponível para listenToRaisedHands.");
            return;
        }
        // Limpa listeners anteriores para evitar duplicação
        HandRaiseState.unsubscribers.forEach(unsub => unsub());
        HandRaiseState.unsubscribers = [];

        const unsubscribe = StudentService.listenToRaisedHands(RoomState.roomCode, (raisedHands) => {
            const previousCount = HandRaiseState.raisedHands.length;
            HandRaiseState.raisedHands = raisedHands.sort((a, b) => (a.maoLevantadaEm?.toDate() || 0) - (b.maoLevantadaEm?.toDate() || 0)); // Ordena por tempo

            HandRaiseManager.updateTeacherHandsDisplay();

            // Mostra notificação apenas se for professor e o número de mãos levantadas aumentou
            if (RoomState.isTeacher && raisedHands.length > previousCount) {
                HandRaiseManager.showTeacherNotification(raisedHands.length);
            }
        });
        HandRaiseState.unsubscribers.push(unsubscribe);
    },

    init: async () => {
        // 🔥 INICIALIZA O SOM QUANDO O HAND RAISE MANAGER COMEÇA
        HandRaiseManager.initNotificationSound();

        if (RoomState.isTeacher && RoomState.roomCode) {
            HandRaiseManager.listenToRaisedHands();
        }

        if (RoomState.isStudent && RoomState.studentId) {
            const student = await StudentService.getStudent(RoomState.studentId);
            if (student) {
                HandRaiseState.studentHandRaised = student.maoLevantada || false;
            }
        }
    },

    cleanup: () => {
        HandRaiseState.unsubscribers.forEach(unsub => unsub());
        HandRaiseState.unsubscribers = [];
        HandRaiseState.raisedHands = [];
        HandRaiseState.studentHandRaised = false;
        HandRaiseState.lastHandRaiseTime = null;
        
        // Limpa o som do Howler se existir
        if (HandRaiseState.notificationSound) {
            HandRaiseState.notificationSound.unload();
        }
    },

};

document.addEventListener('DOMContentLoaded', async () => {
    // Aguarda o RoomState carregar corretamente
    const waitForRoomState = async () => {
        return new Promise(resolve => {
            const check = () => {
                if (RoomState && RoomState.roomCode) resolve();
                else setTimeout(check, 300);
            };
            check();
        });
    };

    await waitForRoomState();

    HandRaiseManager.init();
});

window.HandRaiseManager = HandRaiseManager;

document.addEventListener('DOMContentLoaded', async () => {
    // Aguarda o RoomState carregar corretamente
    const waitForRoomState = async () => {
        return new Promise(resolve => {
            const check = () => {
                if (RoomState && RoomState.roomCode) resolve();
                else setTimeout(check, 300);
            };
            check();
        });
    };

    await waitForRoomState();

    HandRaiseManager.init();
});

window.HandRaiseManager = HandRaiseManager;
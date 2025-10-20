import { StudentService } from './firebase-services.js';

const HandRaiseState = {
    raisedHands: [],
    studentHandRaised: false,
    lastHandRaiseTime: null,
    unsubscribers: []
};

const HandRaiseManager = {

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
            text.textContent = 'Abaixar Mão';
            handButton.classList.add('hand-raised');
        } else {
            icon.className = 'fas fa-hand-fist';
            text.textContent = 'Levantar a Mão';
            handButton.classList.remove('hand-raised');
        }
    },

    showTeacherNotification: (count) => {
        const existingNotification = document.querySelector('.raised-hand-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'raised-hand-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-hand-paper"></i>
                <span>${count} aluno${count > 1 ? 's' : ''} com a mão levantada</span>
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
        console.log("listenToRaisedHands ativado para sala:", RoomState.roomCode);
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
    console.log("RoomState detectado:", RoomState);

    HandRaiseManager.init();
});

window.HandRaiseManager = HandRaiseManager;
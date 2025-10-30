import { RoomService, StudentService } from './firebase-services.js';

const RoomState = {
    currentRoom: null,
    isTeacher: false,
    isStudent: false,
    connectedStudents: [],
    roomCode: null,
    qrCodeGenerated: false,
    studentId: null,
    unsubscribers: []
};

const RoomManager = {
    generateRoomCode: () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },

    createRoom: async () => {
        try {
            const professorNome = 'Professor Atual';
            const roomCode = await RoomService.createRoom(professorNome);

            RoomState.roomCode = roomCode;
            RoomState.isTeacher = true;

            RoomManager.updateTeacherUI();
            RoomManager.listenToRoomUpdates();

            console.log('Sala criada:', roomCode);
            return roomCode;
        } catch (error) {
            console.error('Erro ao criar sala:', error);
            showToast('Erro ao criar sala', 'error');
            throw error;
        }
    },


    leaveRoom: async () => {
        if (RoomState.isTeacher) {
            RoomManager.endRoom();
        } else if (RoomState.isStudent) {
            try {
                // Remover aluno do Firebase
                if (RoomState.studentId && RoomState.roomCode) {
                    await StudentService.deleteStudent(RoomState.studentId);

                    // 🔥 TENTAR remover da lista de alunos conectados (se a sala ainda existir)
                    try {
                        const room = await RoomService.getRoom(RoomState.roomCode);
                        if (room && room.alunosConectados) {
                            const updatedStudents = room.alunosConectados.filter(
                                student => student.id !== RoomState.studentId
                            );
                            await RoomService.updateRoom(RoomState.roomCode, {
                                alunosConectados: updatedStudents
                            });
                        }
                    } catch (error) {
                        console.log('Sala já foi excluída ou não encontrada');
                    }

                    showToast('Você saiu da sala', 'info');
                }
            } catch (error) {
                console.error('Erro ao sair da sala:', error);
                showToast('Erro ao sair da sala', 'error');
            }

            StudentManager.clear();
            RoomManager.clearListeners();

            RoomState.isStudent = false;
            RoomState.currentRoom = null;
            RoomState.roomCode = null;
            RoomState.studentId = null;

            navigateTo('home');
        }
    },

    updateTeacherUI: () => {
        const roomCodeElement = document.getElementById('teacher-room-code');
        const connectedStudentsElement = document.getElementById('connected-students');

        if (roomCodeElement && RoomState.roomCode) {
            roomCodeElement.textContent = RoomState.roomCode;
        }

        if (connectedStudentsElement) {
            connectedStudentsElement.textContent = RoomState.connectedStudents.length;
        }
    },

    updateStudentUI: () => {
        const roomCodeElement = document.getElementById('current-room-code');

        if (roomCodeElement && RoomState.roomCode) {
            roomCodeElement.textContent = RoomState.roomCode;
        }
    },

    listenToRoomUpdates: () => {
        if (!RoomState.roomCode) return;

        const unsubscribe = RoomService.listenToStudents(RoomState.roomCode, (students) => {
            RoomState.connectedStudents = students;
            RoomManager.updateTeacherUI();
        });

        RoomState.unsubscribers.push(unsubscribe);
    },

    clearListeners: () => {
        RoomState.unsubscribers.forEach(unsub => unsub());
        RoomState.unsubscribers = [];
    },

    generateQRCode: () => {
        return new Promise((resolve, reject) => {
            if (!RoomState.roomCode) {
                reject('Nenhuma sala ativa');
                return;
            }

            const qrContainer = document.getElementById('qr-code-container');
            if (!qrContainer) {
                reject('Container do QR Code não encontrado');
                return;
            }

            qrContainer.innerHTML = '';

            const baseURL = window.location.origin + window.location.pathname;
            const qrData = `${baseURL}#join/${RoomState.roomCode}`;

            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(qrData, { width: 256, margin: 2 }, (error, canvas) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    qrContainer.appendChild(canvas);
                    RoomState.qrCodeGenerated = true;

                    const qrRoomCodeElement = document.getElementById('qr-room-code');
                    if (qrRoomCodeElement) {
                        qrRoomCodeElement.textContent = RoomState.roomCode;
                    }

                    resolve(canvas);
                });
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'qr-placeholder';
                placeholder.style.cssText = `
                    width: 256px;
                    height: 256px;
                    background: #f0f0f0;
                    border: 2px solid #0066cc;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: monospace;
                `;
                placeholder.innerHTML = `
                    <i class="fas fa-qrcode" style="font-size: 4rem; color: #0066cc; margin-bottom: 1rem;"></i>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">${RoomState.roomCode}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">QR Code da Sala</div>
                `;

                qrContainer.appendChild(placeholder);
                RoomState.qrCodeGenerated = true;

                const qrRoomCodeElement = document.getElementById('qr-room-code');
                if (qrRoomCodeElement) {
                    qrRoomCodeElement.textContent = RoomState.roomCode;
                }

                resolve(placeholder);
            }
        });
    },

    downloadQRCode: () => {
        const canvas = document.querySelector('#qr-code-container canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `sala-${RoomState.roomCode}-qrcode.png`;
            link.href = canvas.toDataURL();
            link.click();
            showToast('QR Code baixado com sucesso', 'success');
        } else {
            showToast('QR Code não encontrado', 'error');
        }
    },

    init: () => {
    },
    joinRoom: async (roomCode) => {
        try {
            const room = await RoomService.getRoom(roomCode);

            if (!room || !room.ativa) {
                throw new Error('Sala não encontrada ou inativa');
            }

            RoomState.currentRoom = room;
            RoomState.isStudent = true;
            RoomState.roomCode = roomCode;

            RoomManager.listenToRoomStatus();

            setTimeout(() => {
                if (!StudentManager.currentStudentName) {
                    StudentManager.showNameModal();
                } else {
                    StudentManager.updateStudentUI();
                }
            }, 500);

            return room;
        } catch (error) {
            console.error('Erro ao entrar na sala:', error);
            showToast(error.message || 'Erro ao entrar na sala', 'error');
            throw error;
        }
    },

    listenToRoomStatus: () => {
        if (!RoomState.roomCode) return;

        const unsubscribe = RoomService.listenToRoomStatus(RoomState.roomCode, (room) => {
            if (!room) {
                // 🔥 SALA FOI EXCLUÍDA - desconectar aluno automaticamente
                showToast('A sala foi encerrada pelo professor', 'info');
                setTimeout(() => {
                    RoomManager.forceLeaveRoom();
                }, 2000);
            } else if (!room.ativa) {
                // Sala foi marcada como inativa
                showToast('A sala foi encerrada pelo professor', 'info');
                setTimeout(() => {
                    RoomManager.forceLeaveRoom();
                }, 2000);
            }
        });

        RoomState.unsubscribers.push(unsubscribe);
    },

    forceLeaveRoom: async () => {
        try {
            if (RoomState.studentId && RoomState.roomCode) {
                await StudentService.deleteStudent(RoomState.studentId);
            }
        } catch (error) {
            console.error('Erro ao remover aluno:', error);
        }

        StudentManager.clear();
        RoomManager.clearListeners();

        RoomState.isStudent = false;
        RoomState.currentRoom = null;
        RoomState.roomCode = null;
        RoomState.studentId = null;

        navigateTo('home');
    },

    endRoom: async () => {
        if (RoomState.isTeacher && RoomState.roomCode) {
            try {
                showLoading();

                // 🔥 PRIMEIRO: Buscar e excluir todos os alunos
                const students = await StudentService.getStudentsByRoom(RoomState.roomCode);

                // Excluir cada aluno individualmente
                for (const student of students) {
                    try {
                        await StudentService.deleteStudent(student.id);
                        console.log(`Aluno ${student.id} excluído`);
                    } catch (error) {
                        console.error(`Erro ao excluir aluno ${student.id}:`, error);
                    }
                }

                await RoomService.deleteRoom(RoomState.roomCode);

                showToast('Sala excluída com sucesso! Todos os alunos foram desconectados.', 'success');

            } catch (error) {
                console.error('Erro ao excluir sala:', error);
                showToast('Erro ao excluir sala: ' + error.message, 'error');
            } finally {
                hideLoading();

                // 🔥 LIMPE O ESTADO LOCAL
                RoomManager.clearListeners();
                RoomState.currentRoom = null;
                RoomState.isTeacher = false;
                RoomState.roomCode = null;
                RoomState.qrCodeGenerated = false;
                RoomState.connectedStudents = [];

                // Navegar para home
                setTimeout(() => {
                    navigateTo('home');
                }, 1000);
            }
        }
    },

    clearListeners: () => {
        RoomState.unsubscribers.forEach(unsub => unsub());
        RoomState.unsubscribers = [];
        RoomState.connectedStudents = [];
    },
    openConnectedStudents: () => {
        closeAllSections();
        const section = document.getElementById('connected-students-section');
        if (section) {
            section.style.display = 'block';
            section.scrollIntoView({ behavior: 'smooth' });
            RoomManager.updateConnectedStudentsDisplay();
        }
    },

    updateConnectedStudentsDisplay: () => {
        const studentsList = document.getElementById('connected-students-list');
        if (!studentsList) {
            console.log("Elemento connected-students-list não encontrado");
            return;
        }

        if (RoomState.connectedStudents.length === 0) {
            studentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Nenhum aluno conectado no momento</p>
            </div>
        `;
            return;
        }

        studentsList.innerHTML = RoomState.connectedStudents.map(student => `
        <div class="connected-student-item">
            <div class="student-info">
                <div class="student-avatar">
                    ${student.nome ? student.nome.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <div class="student-name">${student.nome || 'Aluno'}</div>
                    <div class="student-join-time">
                        Conectado em: ${student.conectadoEm ?
                new Date(student.conectadoEm).toLocaleString('pt-BR') :
                'Agora'}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    },

    listenToRoomUpdates: () => {
        if (!RoomState.roomCode) return;

        const unsubscribe = RoomService.listenToStudents(RoomState.roomCode, (students) => {
            RoomState.connectedStudents = students;
            RoomManager.updateTeacherUI();

            // 🔥 SEMPRE atualiza a lista, independente da seção estar visível
            RoomManager.updateConnectedStudentsDisplay();
        });

        RoomState.unsubscribers.push(unsubscribe);
    },
};


document.addEventListener('DOMContentLoaded', () => {
    RoomManager.init();
});

window.RoomManager = RoomManager;
window.RoomState = RoomState;

const StudentManager = {
    currentStudentName: null,

    showNameModal: () => {
        const modal = document.getElementById('student-name-modal');
        if (modal) {
            modal.style.display = 'flex';

            setTimeout(() => {
                const nameInput = document.getElementById('student-name-input');
                if (nameInput) nameInput.focus();
            }, 100);
        }
    },

    hideNameModal: () => {
        const modal = document.getElementById('student-name-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    confirmName: async (name) => {
        if (!name || name.trim().length < 2) {
            showToast('Por favor, digite um nome válido (mínimo 2 caracteres)', 'error');
            return false;
        }

        StudentManager.currentStudentName = name.trim();

        try {
            const studentId = await StudentService.createStudent(
                RoomState.roomCode,
                StudentManager.currentStudentName
            );

            RoomState.studentId = studentId;

            StudentManager.hideNameModal();
            StudentManager.updateStudentUI();
            showToast(`Bem-vindo, ${StudentManager.currentStudentName}!`, 'success');

            return true;
        } catch (error) {
            console.error('Erro ao registrar aluno:', error);
            showToast('Erro ao registrar na sala', 'error');
            return false;
        }
    },

    updateStudentUI: () => {
        if (!StudentManager.currentStudentName) return;

        const roomHeader = document.querySelector('.room-header .container');
        if (!roomHeader) return;

        // Procura se já existe o display
        let studentInfoDiv = document.querySelector('.student-info-display');
        if (!studentInfoDiv) {
            studentInfoDiv = document.createElement('div');
            studentInfoDiv.className = 'student-info-display';
            roomHeader.appendChild(studentInfoDiv);
        }

        // Atualiza o conteúdo sempre que o nome mudar
        studentInfoDiv.innerHTML = `
    <div class="student-welcome">
        <div class="student-avatar">
            ${StudentManager.currentStudentName.charAt(0).toUpperCase()}
        </div>
        <div class="student-details">
            <h3>${StudentManager.currentStudentName}</h3>
            <p>Participando da sala ${RoomState.roomCode}</p>
        </div>
    </div>
    `;
    },



    init: () => {
    },

    getName: () => {
        return StudentManager.currentStudentName;
    },

    clear: () => {
        StudentManager.currentStudentName = null;
        RoomState.studentId = null;
    },
};

document.addEventListener('DOMContentLoaded', () => {
    StudentManager.init();
    init: async () => {

        // 🔧 Se o aluno já tem um ID salvo (voltou para a sala), buscar nome no Firebase
        if (RoomState.isStudent && RoomState.studentId && !StudentManager.currentStudentName) {
            try {
                const student = await StudentService.getStudent(RoomState.studentId);
                if (student && student.nome) {
                    StudentManager.currentStudentName = student.nome;
                    StudentManager.updateStudentUI();
                }
            } catch (err) {
                console.warn('Não foi possível restaurar o nome do aluno:', err);
            }
        }
    }
});

window.StudentManager = StudentManager;

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

    joinRoom: async (roomCode) => {
        try {
            const room = await RoomService.getRoom(roomCode);

            if (!room || !room.ativa) {
                throw new Error('Sala não encontrada ou inativa');
            }

            RoomState.currentRoom = room;
            RoomState.isStudent = true;
            RoomState.roomCode = roomCode;

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

    leaveRoom: () => {
        if (RoomState.isTeacher) {
            RoomManager.endRoom();
        } else if (RoomState.isStudent) {
            StudentManager.clear();
            RoomManager.clearListeners();

            RoomState.isStudent = false;
            RoomState.currentRoom = null;
            RoomState.roomCode = null;
            RoomState.studentId = null;

            navigateTo('home');
        }
    },

    endRoom: () => {
        if (RoomState.isTeacher) {
            RoomManager.clearListeners();

            RoomState.currentRoom = null;
            RoomState.isTeacher = false;
            RoomState.roomCode = null;
            RoomState.qrCodeGenerated = false;

            exibirMenu();
            showToast('Sala encerrada com sucesso', 'info');
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

            console.log(qrData);

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
        console.log('Room Manager inicializado');
    }
};

const QRScanner = {
    video: null,
    stream: null,
    isScanning: false,

    start: () => {
        return new Promise((resolve, reject) => {
            const video = document.getElementById('qr-video');
            if (!video) {
                reject('Elemento de vídeo não encontrado');
                return;
            }

            navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
                .then(stream => {
                    QRScanner.stream = stream;
                    video.srcObject = stream;
                    video.play();
                    QRScanner.isScanning = true;
                    resolve(stream);

                    showToast('Câmera iniciada. Posicione o QR Code.', 'info');

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    const scan = () => {
                        if (!QRScanner.isScanning) return;

                        if (video.readyState === video.HAVE_ENOUGH_DATA) {
                            canvas.height = video.videoHeight;
                            canvas.width = video.videoWidth;
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);

                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, canvas.width, canvas.height);

                            if (code) {
                                QRScanner.isScanning = false;
                                QRScanner.stop();
                                showToast(`QR Detectado: ${code.data}`, 'success');

                                // 🔹 Se o QR contém link (http:// ou https://)
                                if (code.data.startsWith("http://") || code.data.startsWith("https://")) {
                                    window.location.href = code.data;
                                } else {
                                    // 🔹 Caso seja um código da sala
                                    joinRoomByCode(code.data);
                                }
                                return;
                            }
                        }

                        requestAnimationFrame(scan);
                    };

                    requestAnimationFrame(scan);
                })
                .catch(error => {
                    console.error('Erro ao acessar câmera:', error);
                    reject('Não foi possível acessar a câmera');
                });
        });
    },

    stop: () => {
        if (QRScanner.stream) {
            QRScanner.stream.getTracks().forEach(track => track.stop());
            QRScanner.stream = null;
        }

        if (QRScanner.video) {
            QRScanner.video.srcObject = null;
        }

        QRScanner.isScanning = false;

        const startBtn = document.getElementById('start-scanner-btn');
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-camera"></i> Iniciar Câmera';
            startBtn.onclick = startQRScanner;
        }
    },

    simulateDetection: (roomCode) => {
        setTimeout(() => {
            if (QRScanner.isScanning) {
                showToast(`QR Code detectado: ${roomCode}`, 'success');
                QRScanner.stop();
                joinRoomByCode(roomCode);
            }
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RoomManager.init();
});

window.RoomManager = RoomManager;
window.QRScanner = QRScanner;
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
        console.log('Student Manager inicializado');
    },

    getName: () => {
        return StudentManager.currentStudentName;
    },

    clear: () => {
        StudentManager.currentStudentName = null;
        RoomState.studentId = null;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    StudentManager.init();
    init: async () => {
        console.log('Student Manager inicializado');

        // 🔧 Se o aluno já tem um ID salvo (voltou para a sala), buscar nome no Firebase
        if (RoomState.isStudent && RoomState.studentId && !StudentManager.currentStudentName) {
            try {
                const student = await StudentService.getStudent(RoomState.studentId);
                if (student && student.nome) {
                    StudentManager.currentStudentName = student.nome;
                    StudentManager.updateStudentUI();
                    console.log('Nome restaurado do aluno:', student.nome);
                }
            } catch (err) {
                console.warn('Não foi possível restaurar o nome do aluno:', err);
            }
        }
    }
});

window.StudentManager = StudentManager;

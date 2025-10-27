// Dynamic Components for Educational Platform
// Functions to generate cards, modals, lists and other UI components

// Class Card Component
function createClassCard(classData, userType = 'student') {
    const card = DOM.create('div', { className: 'class-card' });

    const header = DOM.create('div', { className: 'class-header' });

    const titleContainer = DOM.create('div');
    const title = DOM.create('h4', { className: 'class-title' }, classData.name);
    const subject = DOM.create('div', { className: 'class-subject' }, classData.subject);
    titleContainer.appendChild(title);
    titleContainer.appendChild(subject);

    const menu = DOM.create('div', { className: 'class-menu' });
    const menuBtn = DOM.create('button', {
        className: 'menu-btn',
        onclick: `toggleClassMenu(${classData.id})`
    });
    menuBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';

    const dropdown = DOM.create('div', {
        className: 'menu-dropdown',
        id: `class-menu-${classData.id}`
    });

    if (userType === 'student') {
        const leaveItem = DOM.create('button', {
            className: 'menu-item danger',
            onclick: `leaveClass(${classData.id})`
        }, 'Sair da turma');
        dropdown.appendChild(leaveItem);
    } else {
        const editItem = DOM.create('button', {
            className: 'menu-item',
            onclick: `editClass(${classData.id})`
        }, 'Editar turma');
        const deleteItem = DOM.create('button', {
            className: 'menu-item danger',
            onclick: `deleteClass(${classData.id})`
        }, 'Excluir turma');
        dropdown.appendChild(editItem);
        dropdown.appendChild(deleteItem);
    }

    menu.appendChild(menuBtn);
    menu.appendChild(dropdown);

    header.appendChild(titleContainer);
    header.appendChild(menu);

    const details = DOM.create('div', { className: 'class-details' });

    const teacherDetail = DOM.create('div', { className: 'class-detail' });
    teacherDetail.innerHTML = `<i class="fas fa-user"></i> ${classData.teacher}`;

    const studentsDetail = DOM.create('div', { className: 'class-detail' });
    studentsDetail.innerHTML = `<i class="fas fa-users"></i> ${classData.students} alunos`;

    const scheduleDetail = DOM.create('div', { className: 'class-detail' });
    scheduleDetail.innerHTML = `<i class="fas fa-clock"></i> ${classData.schedule}`;

    const codeDetail = DOM.create('div', { className: 'class-detail' });
    codeDetail.innerHTML = `<i class="fas fa-key"></i> Código: ${classData.code}`;

    details.appendChild(teacherDetail);
    details.appendChild(studentsDetail);
    details.appendChild(scheduleDetail);
    details.appendChild(codeDetail);

    card.appendChild(header);
    card.appendChild(details);

    return card;
}

function exibirMenu() {
    const menu = document.getElementsByClassName('nav')[0];

    if (menu.classList.contains("show")) {
        menu.classList.toggle('show');
    } else {
        menu.classList.toggle('show');
    }
}


// Modal Component
function createModal(id, title, content, actions = []) {
    const modal = DOM.create('div', {
        className: 'modal',
        id: id
    });

    const modalContent = DOM.create('div', { className: 'modal-content' });

    const header = DOM.create('div', { className: 'modal-header' });
    const titleElement = DOM.create('h3', {}, title);
    const closeBtn = DOM.create('button', {
        className: 'close-btn',
        onclick: `closeModal('${id}')`
    });
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';

    header.appendChild(titleElement);
    header.appendChild(closeBtn);

    const body = DOM.create('div', { className: 'modal-body' });
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else {
        body.appendChild(content);
    }

    modalContent.appendChild(header);
    modalContent.appendChild(body);

    if (actions.length > 0) {
        const footer = DOM.create('div', { className: 'modal-footer' });
        actions.forEach(action => {
            footer.appendChild(action);
        });
        modalContent.appendChild(footer);
    }

    modal.appendChild(modalContent);

    return modal;
}

// Interactive Functions
function toggleClassMenu(classId) {
    const menu = DOM.get(`class-menu-${classId}`);
    if (menu) {
        menu.classList.toggle('active');
    }

    // Close other menus
    const allMenus = DOM.queryAll('.menu-dropdown');
    allMenus.forEach(otherMenu => {
        if (otherMenu.id !== `class-menu-${classId}`) {
            otherMenu.classList.remove('active');
        }
    });
}

function closeModal(modalId) {
    const modal = DOM.get(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// Export functions to global scope
window.createClassCard = createClassCard;
window.createModal = createModal;
window.toggleClassMenu = toggleClassMenu;
window.closeModal = closeModal;
window.exibirMenu = exibirMenu;

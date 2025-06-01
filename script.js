document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM sepenuhnya dimuat dan di-parse.');

    // Pemilihan Elemen DOM
    const openAddTaskModalBtn = document.getElementById('openAddTaskModalBtn');
    const taskModal = document.getElementById('taskModal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const taskForm = document.getElementById('taskForm');
    const taskGrid = document.getElementById('taskGrid');
    const modalTitleElement = document.getElementById('modalTitle');
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    
    let noTasksMessage = document.getElementById('noTasksMessage');
    if (!noTasksMessage) {
        noTasksMessage = document.createElement('p');
        noTasksMessage.id = 'noTasksMessage';
        noTasksMessage.style.textAlign = 'center';
        noTasksMessage.style.color = 'var(--gray)';
        // taskGrid.appendChild(noTasksMessage); // Don't append here, renderTasks will handle it
    }
    
    const taskIdInput = document.createElement('input');
    taskIdInput.type = 'hidden';
    taskIdInput.id = 'taskId';
    taskForm.prepend(taskIdInput);

    // Elemen input form
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskDateInput = document.getElementById('taskDate');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskCategoryInput = document.getElementById('taskCategory');
    const taskStatusInput = document.getElementById('taskStatus');

    // Elemen untuk counter
    const allTasksCountBadge = document.getElementById('allTasksCount');
    const statTotalTasks = document.getElementById('statTotalTasks');
    const statHighPriorityTasks = document.getElementById('statHighPriorityTasks');
    const statInProgressTasks = document.getElementById('statInProgressTasks');
    const statCompletedTasks = document.getElementById('statCompletedTasks');

    const todayTasksBadge = document.getElementById('todayTasksBadge');
    const thisWeekTasksBadge = document.getElementById('thisWeekTasksBadge');
    const highPriorityFilterBadge = document.getElementById('highPriorityFilterBadge');

    let currentFilter = 'all';
    const filterItems = document.querySelectorAll('.filters .filter-item');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let editingTaskId = null;
    let taskAdditionsLog = JSON.parse(localStorage.getItem('taskAdditionsLog')) || [];

    const categoryColors = {
        Pekerjaan: '#1e88e5',
        "Tugas Kuliah": '#4caf50',
        Belanja: '#ff9800',
        Kesehatan: '#9c27b0',
        Penting: '#f44336'
    };
    const statusText = {
        todo: 'Belum Dimulai',
        inprogress: 'Lagi Dikerjain',
        completed: 'Udah Kelar'
    };
    const priorityClasses = {
        high: 'task-priority-high',
        medium: 'task-priority-medium',
        low: 'task-priority-low'
    };

    const saveTasksToLocalStorage = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const saveTaskAdditionsLogToLocalStorage = () => {
        localStorage.setItem('taskAdditionsLog', JSON.stringify(taskAdditionsLog));
        console.log('Catatan penambahan tugas disimpan ke LocalStorage:', taskAdditionsLog);
    };

    const getDefaultDate = () => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const isToday = (taskDateStr) => {
        if (!taskDateStr) return false;
        return taskDateStr === getDefaultDate();
    };

    const isThisWeek = (taskDateStr) => {
        if (!taskDateStr) return false;
        try {
            const taskDate = new Date(taskDateStr + 'T00:00:00Z');
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const currentDayOfWeek = today.getUTCDay();
            const startOfWeek = new Date(today);
            startOfWeek.setUTCDate(today.getUTCDate() - currentDayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
            
            return taskDate >= startOfWeek && taskDate <= endOfWeek;
        } catch (e) {
            console.error("Error parsing date for isThisWeek:", taskDateStr, e);
            return false;
        }
    };
    
    const updateUICounters = () => {
        const totalTasks = tasks.length;
        const highPriorityTasksCount = tasks.filter(task => task.priority === 'high').length;
        const inProgressTasksCount = tasks.filter(task => task.status === 'inprogress').length;
        const completedTasksCount = tasks.filter(task => task.status === 'completed').length;
        const todayTasksCount = tasks.filter(task => isToday(task.date)).length;
        const thisWeekTasksCount = tasks.filter(task => isThisWeek(task.date)).length;

        if (allTasksCountBadge) allTasksCountBadge.textContent = totalTasks;
        if (statTotalTasks) statTotalTasks.textContent = totalTasks;
        if (statHighPriorityTasks) statHighPriorityTasks.textContent = highPriorityTasksCount;
        if (highPriorityFilterBadge) highPriorityFilterBadge.textContent = highPriorityTasksCount;
        if (statInProgressTasks) statInProgressTasks.textContent = inProgressTasksCount;
        if (statCompletedTasks) statCompletedTasks.textContent = completedTasksCount;
        if (todayTasksBadge) todayTasksBadge.textContent = todayTasksCount;
        if (thisWeekTasksBadge) thisWeekTasksBadge.textContent = thisWeekTasksCount;
    };

    const renderTasks = () => {
        let tasksToRender = [];
        switch (currentFilter) {
            case 'today':
                tasksToRender = tasks.filter(task => isToday(task.date));
                break;
            case 'thisWeek':
                tasksToRender = tasks.filter(task => isThisWeek(task.date));
                break;
            case 'highPriority':
                tasksToRender = tasks.filter(task => task.priority === 'high');
                break;
            case 'all':
            default:
                tasksToRender = tasks;
                break;
        }

        taskGrid.innerHTML = '';

        if (tasksToRender.length === 0) {
            if (noTasksMessage) {
                let message = "Belum ada tugas";
                if (currentFilter === 'all' && tasks.length === 0) {
                    message += ". Tambahkan tugas baru!";
                } else if (currentFilter !== 'all') {
                    const activeFilterElement = document.querySelector(`.filter-item.active[data-filter="${currentFilter}"]`);
                    let filterName = currentFilter;
                    if (activeFilterElement) {
                        const textNodes = Array.from(activeFilterElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
                        filterName = textNodes.map(node => node.textContent.trim()).join(' ').trim() || filterName;
                    }
                    message += ` yang sesuai dengan filter "${filterName}".`;
                } else if (tasks.length > 0 && tasksToRender.length === 0) { // Ada tugas, tapi tidak cocok filter
                     message += ` yang sesuai dengan filter ini.`;
                } else { // Default untuk kasus lain (misal, tasks.length === 0 dan filter bukan 'all')
                    message += ` yang tersedia.`;
                }
                noTasksMessage.textContent = message;
                taskGrid.appendChild(noTasksMessage);
                noTasksMessage.style.display = 'block';
            }
        } else {
            if (noTasksMessage) noTasksMessage.style.display = 'none';

            tasksToRender.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.classList.add('task-card', priorityClasses[task.priority] || 'task-priority-medium');
                taskCard.setAttribute('data-id', task.id);

                taskCard.innerHTML = `
                    <div class="task-header-row">
                        <div>
                            <h3 class="task-title">${task.title}</h3>
                            <div class="task-category">
                                <span class="task-category-color" style="background: ${categoryColors[task.category] || '#78909c'};"></span>
                                ${task.category}
                            </div>
                        </div>
                        <div class="task-actions-row">
                            <div class="task-action-btn edit-btn" data-id="${task.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </div>
                            <div class="task-action-btn delete-btn" data-id="${task.id}" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </div>
                        </div>
                    </div>
                    <p class="task-details">${task.description || ''}</p>
                    <div class="task-meta">
                        <div class="task-date">
                            <i class="far fa-calendar"></i>
                            ${new Date(task.date + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </div>
                        <div class="task-status status-${task.status}">${statusText[task.status]}</div>
                    </div>
                `;
                taskGrid.appendChild(taskCard);
            });
        }
        updateUICounters();
    };

    const resetModalToAddTask = () => {
        taskForm.reset();
        editingTaskId = null;
        taskIdInput.value = '';
        taskDateInput.value = getDefaultDate();
        if (modalTitleElement) modalTitleElement.innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Tugas Baru';
        if (saveTaskBtn) saveTaskBtn.textContent = 'Simpan Tugas';
    };

    const openModalForAdd = () => {
        resetModalToAddTask();
        if (taskModal) {
            taskModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    const openModalForEdit = (id) => {
        const taskToEdit = tasks.find(task => task.id === id);
        if (!taskToEdit) {
            console.error(`Tugas dengan ID ${id} tidak ditemukan.`);
            return;
        }

        editingTaskId = id;
        taskIdInput.value = id;
        taskTitleInput.value = taskToEdit.title;
        taskDescriptionInput.value = taskToEdit.description;
        taskDateInput.value = taskToEdit.date;
        taskPriorityInput.value = taskToEdit.priority;
        taskCategoryInput.value = taskToEdit.category;
        taskStatusInput.value = taskToEdit.status;

        if (modalTitleElement) modalTitleElement.innerHTML = '<i class="fas fa-edit"></i> Edit Tugas';
        if (saveTaskBtn) saveTaskBtn.textContent = 'Simpan Perubahan';
        if (taskModal) {
            taskModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    const closeModal = () => {
        if (taskModal) {
            taskModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            resetModalToAddTask();
        }
    };

    if (openAddTaskModalBtn) {
        openAddTaskModalBtn.addEventListener('click', openModalForAdd);
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    window.addEventListener('click', (e) => {
        if (taskModal && e.target === taskModal) {
            closeModal();
        }
    });

    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const idCurrent = taskIdInput.value;
            const title = taskTitleInput.value.trim();
            const description = taskDescriptionInput.value.trim();
            const date = taskDateInput.value;
            const priority = taskPriorityInput.value;
            const category = taskCategoryInput.value;
            const status = taskStatusInput.value;

            if (!title || !date) {
                alert("Judul dan Tanggal Jatuh Tempo tidak boleh kosong!");
                return;
            }

            if (editingTaskId && idCurrent === editingTaskId) {
                tasks = tasks.map(task =>
                    task.id === editingTaskId ? { ...task, title, description, date, priority, category, status } : task
                );
            } else {
                const newTask = {
                    id: Date.now().toString(), title, description, date, priority, category, status
                };
                tasks.push(newTask);
                const additionLogEntry = {
                    taskId: newTask.id, title: newTask.title, category: newTask.category,
                    priority: newTask.priority, status: newTask.status, addedAt: new Date().toISOString()
                };
                taskAdditionsLog.push(additionLogEntry);
                saveTaskAdditionsLogToLocalStorage();
            }
            saveTasksToLocalStorage();
            renderTasks();
            closeModal();
        });
    }

    taskGrid.addEventListener('click', (e) => {
        const target = e.target.closest('.task-action-btn');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('edit-btn')) {
            openModalForEdit(id);
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasksToLocalStorage();
                renderTasks();
            }
        }
    });

    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            filterItems.forEach(fi => fi.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });

    taskDateInput.value = getDefaultDate();
    updateUICounters();
    renderTasks();
    console.log('Inisialisasi TaskFlow selesai.');
});
// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const navArrows = document.querySelectorAll('.nav-arrow');
    const currentDateElement = document.querySelector('.current-date');
    const fab = document.querySelector('.fab');
    const bottomNavItems = document.querySelectorAll('.nav-item');

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Date navigation
    let currentDate = new Date(2025, 5, 29); // June 29, 2025
    
    function updateDateDisplay() {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        currentDateElement.textContent = currentDate.toLocaleDateString('en-US', options);
    }

    navArrows[0].addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
    });

    navArrows[1].addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
    });

    // FAB click handler
    fab.addEventListener('click', function() {
        alert('Add new task functionality would be implemented here');
    });

    // Bottom navigation
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function() {
            bottomNavItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Task completion toggle (for future use)
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(task => {
        task.addEventListener('click', function() {
            this.style.opacity = this.style.opacity === '0.6' ? '1' : '0.6';
        });
    });
});
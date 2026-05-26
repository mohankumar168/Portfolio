// ==========================================
// PORTFOLIO INTERACTION ENGINE — PREMIUM
// ==========================================

const panels = document.querySelectorAll('.panel');
const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
const menuToggle = document.getElementById('menuToggle');
const sidebarPane = document.getElementById('sidebarPane');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentSection = 0;

// ==========================================
// MOBILE DRAWER NAVIGATION TOGGLES
// ==========================================
function toggleMobileSidebar(show) {
    if (menuToggle && sidebarPane && sidebarOverlay) {
        menuToggle.classList.toggle('active', show);
        sidebarPane.classList.toggle('active', show);
        sidebarOverlay.classList.toggle('active', show);
        
        // Prevent body scrolling when drawer is open on mobile
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const isActive = sidebarPane.classList.contains('active');
        toggleMobileSidebar(!isActive);
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        toggleMobileSidebar(false);
    });
}

// ==========================================
// INTERSECTION OBSERVER — Active Section Detection
// ==========================================
// We use root: null (browser viewport) so section detection works
// on both desktop (split container) and mobile (natural body scroll)
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');

            const index = Array.from(panels).indexOf(entry.target);
            if (index !== -1) {
                currentSection = index;
                updateNavigation(index);
            }
        }
    });
}, {
    root: null,
    threshold: 0.3, // Trigger navigation update when 30% of the section is visible
    rootMargin: '-10% 0px -40% 0px' // Offset to match user focus area
});

panels.forEach(panel => sectionObserver.observe(panel));

// ==========================================
// UPDATE NAVIGATION STATE
// ==========================================
function updateNavigation(index) {
    // Update sidebar links active class
    navLinks.forEach((link) => {
        const sectionIdx = parseInt(link.dataset.section);
        link.classList.toggle('active', sectionIdx === index);
    });
}

// ==========================================
// SMOOTH NAVIGATION TRIGGERS
// ==========================================
function navigateToSection(index) {
    if (index >= 0 && index < panels.length) {
        // Smooth scroll to target panel
        panels[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        currentSection = index;
        updateNavigation(index);
    }
}

// Sidebar nav link click handlers
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(link.dataset.section);
        navigateToSection(index);
        
        // Always close sidebar overlay on mobile after selecting a link
        toggleMobileSidebar(false);
    });
});

// Inline helper nav buttons (e.g. "View Projects" inside Hero)
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.section);
        navigateToSection(index);
    });
});

// ==========================================
// KEYBOARD & SHORTCUT NAVIGATION
// ==========================================
document.addEventListener('keydown', (e) => {
    // Only capture keys if not typing in form or if sidebar overlay is closed
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (currentSection < panels.length - 1) {
            e.preventDefault();
            navigateToSection(currentSection + 1);
        }
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (currentSection > 0) {
            e.preventDefault();
            navigateToSection(currentSection - 1);
        }
    }
    
    // Quick digits shortcut 1-6
    const num = parseInt(e.key);
    if (num >= 1 && num <= panels.length) {
        navigateToSection(num - 1);
    }
});

// ==========================================
// ANIMATE STAT NUMBERS
// ==========================================
const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * (end - start) + start);
        element.textContent = value + (element.dataset.suffix || '');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

const statsSection = document.querySelector('.about-stats');
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
            statsAnimated = true;
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach((stat, index) => {
                const text = stat.textContent;
                const value = parseInt(text) || 0;
                const suffix = text.replace(/[0-9]/g, '');
                stat.dataset.suffix = suffix;
                setTimeout(() => {
                    animateValue(stat, 0, value, 2000);
                }, index * 200);
            });
        }
    });
}, { root: null, threshold: 0.2 });

if (statsSection) {
    statsObserver.observe(statsSection);
}

// ==========================================
// BUTTON RIPPLE EFFECT
// ==========================================
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// ==========================================
// SKILL CARD TILT EFFECT (DESKTOP ONLY)
// ==========================================
const isTouchDevice = () => {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
};

if (!isTouchDevice()) {
    document.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateX = (y - 0.5) * -10;
            const rotateY = (x - 0.5) * 10;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ==========================================
// PROJECT CARD HOVER GLOW FOLLOW
// ==========================================
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const glow = card.querySelector('.project-glow');
        if (glow) {
            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, var(--p-color, #6366f1) 0%, transparent 65%)`;
        }
    });
});

// ==========================================
// INITIAL LAYOUT TRIGGERS
// ==========================================
window.addEventListener('load', () => {
    if (panels.length > 0) {
        panels[0].classList.add('in-view');
        updateNavigation(0);
    }
    
    // Add loaded class to body for page load transitions
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 150);
});

// Console easter egg
console.log('%c👋 Hello, Developer!', 'font-size: 20px; color: #6366f1; font-weight: bold;');
console.log('%c🎯 Use Arrow Keys ↑↓ or Number Keys 1-6 to navigate!', 'font-size: 14px; color: #8b5cf6;');
console.log('%c🌟 Built by Mohan Kumar', 'font-size: 12px; color: #06b6d4;');

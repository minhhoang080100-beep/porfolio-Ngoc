const fs = require('fs');

let mainJs = fs.readFileSync('d:/Ngoc selection/Ngọc/main.js', 'utf8');

const oldNavbarLogic = `    // Navbar Scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Navbar
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });`;

const newNavbarLogic = `    // Navbar Scroll (Optimized with requestAnimationFrame)
    const navbar = document.querySelector('.navbar');
    let isNavbarScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isNavbarScrolling) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                isNavbarScrolling = false;
            });
            isNavbarScrolling = true;
        }
    }, { passive: true });`;

mainJs = mainJs.replace(oldNavbarLogic, newNavbarLogic);

const oldRevealLogic = `    // 3. Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');
    
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                reveal.classList.add('active');
            }
        });
    }
    
    // Initial check
    checkReveal();
    // Check on scroll
    window.addEventListener('scroll', checkReveal);`;

const newRevealLogic = `    // 3. Scroll Reveal Animation (Optimized with IntersectionObserver)
    const reveals = document.querySelectorAll('.reveal');
    
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Stop observing once revealed
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -100px 0px', // Equivalent to revealPoint = 100
            threshold: 0
        });

        reveals.forEach(reveal => {
            revealObserver.observe(reveal);
        });
    } else {
        // Fallback for very old browsers
        reveals.forEach(reveal => reveal.classList.add('active'));
    }`;

mainJs = mainJs.replace(oldRevealLogic, newRevealLogic);

fs.writeFileSync('d:/Ngoc selection/Ngọc/main.js', mainJs, 'utf8');
console.log("Replaced scroll logic successfully!");

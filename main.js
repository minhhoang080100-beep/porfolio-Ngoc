// main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    hamburger.addEventListener('click', () => {
        mobileMenu.classList.add('active');
    });

    closeMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    // 3. Scroll Reveal Animation
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
    window.addEventListener('scroll', checkReveal);

    // 4. Media Modal (Lightbox)
    const modal = document.getElementById('mediaModal');
    const modalImg = document.getElementById('modalImg');
    const modalVideo = document.getElementById('modalVideo');
    const closeBtn = document.querySelector('.modal-close');
    const masonryItems = document.querySelectorAll('.masonry-item');

    masonryItems.forEach(item => {
        item.addEventListener('click', () => {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            if (item.dataset.type === 'video') {
                const videoSrc = item.querySelector('video').src;
                modalImg.style.display = 'none';
                modalVideo.style.display = 'block';
                modalVideo.src = videoSrc;
                modalVideo.play();
            } else {
                const imgSrc = item.querySelector('img').src;
                modalVideo.style.display = 'none';
                modalImg.style.display = 'block';
                modalImg.src = imgSrc;
                modalVideo.pause();
            }
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modalVideo.pause();
    });

    // Close modal when clicking outside the media
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            modalVideo.pause();
        }
    });
});

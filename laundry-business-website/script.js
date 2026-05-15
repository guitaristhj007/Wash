document.addEventListener("DOMContentLoaded", () => {
    const drum = document.getElementById('drum');
    const preloader = document.getElementById('preloader');
    const mainContent = document.getElementById('main-content');
    
    // Disable scrolling during preloader
    document.body.style.overflow = 'hidden';

    // 1. Water drop animation happens (0 to 1.5s)
    // 2. Washing machine appears (1.2s to 2.0s)
    
    // 3. Start rolling after machine appears (2.2s)
    setTimeout(() => {
        drum.classList.add('rolling');
    }, 2200);

    // 4. End preloader and show main page after 5 seconds total
    setTimeout(() => {
        // Fade out preloader
        preloader.style.opacity = '0';
        
        // Show main content and add visible class for fade in
        mainContent.classList.remove('hidden');
        
        // Small delay to ensure display:none is removed before opacity transition
        setTimeout(() => {
            mainContent.classList.add('visible');
            document.body.style.overflow = ''; // Restore scrolling
        }, 50);
        
        // Remove preloader from DOM after fade out completes
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800); // 0.8s matches CSS transition
    }, 5000);

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for fixed navbar
                    behavior: 'smooth'
                });
            }
        });
    });
});

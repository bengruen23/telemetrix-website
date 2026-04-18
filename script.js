 function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            document.getElementById(pageId).classList.add('active');
            
            // Update nav
            document.querySelectorAll('.nav a').forEach(link => {
                link.classList.remove('active');
            });
            document.getElementById('nav-' + pageId).classList.add('active');
            
            // Update URL without reload
            history.pushState({page: pageId}, '', '#' + pageId);
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            const page = event.state?.page || 'home';
            showPage(page);
        });
        
        // Initial state
        history.replaceState({page: 'home'}, '', '#home');
        
        // Chapter interactions
        document.querySelectorAll('.chapter').forEach(chapter => {
            chapter.addEventListener('click', () => {
                // Could add chapter detail modal or expand functionality
                console.log('Chapter clicked');
            });
        });

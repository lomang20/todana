document.addEventListener("DOMContentLoaded", function () {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const body = document.body;
    const mainContent = document.getElementById("main-content");
    const pageCache = {}; // Cache for storing page data

    // Sidebar toggle functionality
    sidebarToggle.addEventListener("click", function () {
        body.classList.toggle("sb-sidenav-toggled");
    });

    // Ensure sidebar resets on larger screens
    window.addEventListener("resize", function () {
        if (window.innerWidth > 991.98) {
            body.classList.remove("sb-sidenav-toggled");
        }
    });

    const menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const page = this.getAttribute("data-page");

            // Highlight the active menu item
            menuItems.forEach(el => el.classList.remove("active"));
            this.classList.add("active");

            // Close the sidebar after selecting a menu item
            if (body.classList.contains("sb-sidenav-toggled")) {
                body.classList.remove("sb-sidenav-toggled");
            }

            // Check if the page is already cached
            if (pageCache[page]) {
                mainContent.innerHTML = pageCache[page];
                reinitializeScripts(mainContent);
            } else {
                // Load the page into main-content
                fetch(page)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(data => {
                        pageCache[page] = data; // Cache the page content
                        mainContent.innerHTML = data;

                        // Reinitialize scripts for dynamically loaded content
                        reinitializeScripts(mainContent);
                    })
                    .catch(error => {
                        console.error("Error loading page:", error);
                        mainContent.innerHTML = `<p class="text-danger">Failed to load content. Please try again later.</p>`;
                    });
            }
        });
    });

    // Function to reinitialize scripts for dynamically loaded content
    function reinitializeScripts(container) {
        const scriptTags = container.querySelectorAll("script");
        scriptTags.forEach(script => {
            const newScript = document.createElement("script");
            if (script.src) {
                // If the script has a src attribute, copy it
                newScript.src = script.src;
            } else {
                // If the script is inline, wrap it in an IIFE to avoid redeclaration
                newScript.textContent = `(function() { ${script.textContent} })();`;
            }
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    }
});

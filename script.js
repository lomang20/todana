document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("productContainer");
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cartCount = document.getElementById("cart-count");
    const offcanvasElement = document.getElementById("offcanvasCart");
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Fetch product data
    fetch('http://localhost:3000/produk')
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch products");
            return response.json();
        })
        .then(data => {
            renderProducts(data);
        })
        .catch(error => console.error('Error fetching products:', error));

        // Render products
        function renderProducts(data) {
            if (!container) {
                console.error("Product container not found!");
                return;
            }
    
            container.innerHTML = ''; // Clear container
            data.forEach(produk => {
                const hargaAsli = produk.harga_asli && produk.harga_asli > 0
                    ? `<span class="text-danger fw-bold text-decoration-line-through text-center harga-asli">
                        Rp. ${Number(produk.harga_asli).toLocaleString()}
                    </span>`
                    : '';
    
                const hargaDiskon = produk.harga_diskon
                    ? `Rp. ${Number(produk.harga_diskon).toLocaleString()}`
                    : 'Rp. 0';
    
                const card = `
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-5">
                        <div class="card-product shadow-sm mb-4">
                            <div class="card-img-top">
                                <img src="${produk.gambar}" alt="${produk.nama}">
                            </div>
                            <div class="card-body">
                                <p class="product-name">${produk.nama}</p>
                            </div>
                            <div class="d-none deskripsi"><p>${produk.deskripsi}</p></div>
                            <div class="card-footer">
                                <div class="product-price d-flex justify-content-between align-items-center">
                                    ${hargaAsli}
                                    <span class="fw-bold text-success fw-bold text-center ms-auto harga-diskon">
                                        ${hargaDiskon}
                                    </span>
                                </div>
                                <button class="btn btn-primary btn-sm btnDetail mt-2">
                                    <i class="bi bi-info-circle-fill icon-detail"></i>
                                    <span class="text-detail">Detail</span>
                                </button>
                                <button class="btn-cart btn-success btn-sm btnAddToCart mt-2" 
                                    data-name="${produk.nama || 'Produk Tidak Dikenal'}"
                                    data-price="${produk.harga_diskon || 0}">
                                    <span class="icon-only"><i class="bi bi-cart"></i></span>
                                    <span class="icon-text">Tambah ke Keranjang</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });
    
            // Add event listeners for "Add to Cart" buttons
            container.addEventListener('click', (event) => {
                if (event.target.classList.contains('btnAddToCart') || event.target.closest('.btnAddToCart')) {
                  const btn = event.target.closest('.btnAddToCart');
                  const productName = btn.dataset.name || 'Produk Tidak Dikenal';
                  const productPrice = parseFloat(btn.dataset.price || 0);
              
                  addToCart(productName, productPrice);
              
                  // Animasi klik
                  btn.classList.add('clicked');
                  setTimeout(() => {
                    btn.classList.remove('clicked');
                  }, 400);
                }
              });
              
            

            // Add event listeners for "Detail" buttons
            document.querySelectorAll('.btnDetail').forEach(button => {
                button.addEventListener('click', (event) => {
                    const card = event.target.closest('.card-product');
                    const nama = card.querySelector('.product-name').textContent;
                    const gambar = card.querySelector('img').src;
                    const hargaAsli = card.querySelector('.harga-asli')?.textContent || '';
                    const hargaDiskon = card.querySelector('.harga-diskon')?.textContent || '';
                    const deskripsi = card.querySelector('.deskripsi')?.textContent || '';

                    // Populate modal elements
                    document.querySelector('#detailModal .modalTitle').textContent = nama;
                    document.querySelector('#detailModal .modalImage').innerHTML = `<img src="${gambar}" class="img-fluid rounded shadow-sm w-100" alt="${nama}" />`;
                    document.querySelector('#detailModal .deskripsiContent').textContent = deskripsi;
                    document.querySelector('#detailModal .modalHargaAsli').textContent = hargaAsli;
                    document.querySelector('#detailModal .modal-harga-diskon').textContent = hargaDiskon;

                    // Show the modal
                    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
                    detailModal.show();
                });
            });
        }
    // Update cart display
    function updateCart() {
        if (!cartContainer || !cartTotal || !cartCount) {
            console.error("Cart elements not found!");
            return;
        }

        cartContainer.innerHTML = '';
        let total = 0;
        const fragment = document.createDocumentFragment();

        cart.forEach((item, index) => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            total += price * quantity;

            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            li.innerHTML = `
                <div>
                    <strong>${item.name || "Produk Tanpa Nama"}</strong><br>
                    <small>${quantity} x Rp ${price.toLocaleString()}</small>
                </div>
                <button class="btn btn-danger btn-sm" data-index="${index}">Hapus</button>
            `;
            fragment.appendChild(li);
        });

        cartContainer.appendChild(fragment);
        cartTotal.textContent = "Rp " + total.toLocaleString();
        cartCount.textContent = cart.length;

        localStorage.setItem("cart", JSON.stringify(cart));
    }

    // Add to cart
    function addToCart(productName, productPrice) {
        const existingProduct = cart.find(item => item.name === productName);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push({ name: productName, price: productPrice, quantity: 1 });
        }

        updateCart();
    }

    // Remove from cart
    cartContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("btn-danger")) {
            const index = event.target.dataset.index;
            cart.splice(index, 1);
            updateCart();
        }
    });

    // Offcanvas cart
    if (offcanvasElement) {
        const offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);

        document.querySelectorAll('[data-bs-toggle="offcanvas"]').forEach(button => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                offcanvasInstance.show();
            });
        });
    } else {
        console.error("Offcanvas element not found!");
    }

    // Ensure hover effects are not overridden
    const productCards = document.querySelectorAll('.card-product');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        });
    });

    // Initial cart update
    updateCart();

    // Toggle tampilan form search
    const toggleSearchBtn = document.getElementById("toggleSearch");
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
  
    if (toggleSearchBtn && searchForm && searchInput) {
      toggleSearchBtn.addEventListener("click", () => {
        searchForm.classList.toggle("d-none"); // tampilkan/sembunyikan
        if (!searchForm.classList.contains("d-none")) {
          searchInput.focus(); // fokuskan input kalau tampil
        }
      });
  
      // Filter produk saat mengetik
      searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.toLowerCase();
        const productCards = document.querySelectorAll(".card-product");
  
        productCards.forEach(card => {
          const name = card.querySelector(".product-name").textContent.toLowerCase();
          const cardCol = card.closest(".col-12, .col-sm-6, .col-md-4, .col-lg-3") || card.parentElement;
  
          if (name.includes(keyword)) {
            cardCol.style.display = "block";
          } else {
            cardCol.style.display = "none";
          }
        });
      });
    }

});

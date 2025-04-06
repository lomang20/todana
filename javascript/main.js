const observer = new MutationObserver(() => {
    document.querySelectorAll('.btnDetail').forEach(item => {
        // Hapus event listener sebelumnya untuk menghindari duplikasi
        item.removeEventListener('click', handleDetailClick);
        item.addEventListener('click', handleDetailClick);
    });
});

// Fungsi event handler terpisah
function handleDetailClick(e) {
    let parent = e.target.closest('.card');
    let gambar = parent.querySelector('.card-img-top').src;
    let hargaDiskon = parent.querySelector('.harga-diskon')?.innerHTML || "Rp. 0";
    let hargaAsli = parent.querySelector('.harga-asli')?.innerHTML || "";
    let judul = parent.querySelector('.card-text').innerHTML;
    let deskripsi = parent.querySelector('.deskripsi')?.innerHTML.trim() || "Tidak ada deskripsi";

    let modal = new bootstrap.Modal(document.getElementById('exampleModal'));
    modal.show();

    document.querySelector('.modalTitle').innerHTML = judul;

    let image = document.createElement('img');
    image.src = gambar;
    image.classList.add('w-100', 'rounded-3');

    let modalImageContainer = document.querySelector('.modalImage');
    modalImageContainer.innerHTML = '';
    modalImageContainer.appendChild(image);

    document.querySelector('.deskripsiContent').innerHTML = deskripsi;
    document.querySelector('.modalHargaAsli').innerHTML = hargaAsli;
    document.querySelector('.modal-harga-diskon').innerHTML = hargaDiskon;
}

// Amati perubahan pada #productContainer
observer.observe(document.getElementById('productContainer'), {
    childList: true, // Amati penambahan atau penghapusan elemen
    subtree: true    // Termasuk elemen-elemen di dalam container
});

document.addEventListener("DOMContentLoaded", () => {
    let cart = JSON.parse(localStorage.getItem('cart')) || []; // Ambil cart dari localStorage jika ada
    const cartCountElement = document.getElementById("cart-count");
    const cartItemsElement = document.getElementById("cart-items");
    const cartTotalElement = document.getElementById("cart-total");

    // Function to update the cart display
    function updateCartDisplay() {
        cartItemsElement.innerHTML = "";
        let total = 0;

        cart.forEach((item) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.textContent = item.name;
            const priceSpan = document.createElement("span");
            priceSpan.textContent = `Rp ${item.price}`;
            li.appendChild(priceSpan);
            cartItemsElement.appendChild(li);
            total += item.price;
        });

        cartCountElement.textContent = cart.length;
        cartTotalElement.textContent = `Rp ${total}`;
    }

    // Event listener for "Add to Cart" buttons
    document.querySelectorAll(".btnTambahKeranjang").forEach((button) => {
        button.addEventListener("click", (event) => {
            const modal = event.target.closest(".modal-content");
            const productName = modal.querySelector(".modalTitle").textContent;
            const productPrice = parseInt(
                modal.querySelector(".modal-harga-diskon").textContent.replace(/[^\d]/g, "")
            );

            const product = {
                name: productName,
                price: productPrice,
            };

            cart.push(product);
            localStorage.setItem('cart', JSON.stringify(cart)); // <-- tambahkan ini
            updateCartDisplay();

            

            // Close the modal
            const modalInstance = bootstrap.Modal.getInstance(modal.closest(".modal"));
            modalInstance.hide();
        });
    });
});

// Tombol Checkout
document.getElementById('checkoutButton').addEventListener('click', () => {
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    checkoutModal.show();
  });
  
  document.getElementById('checkoutForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const nama = document.getElementById('nama').value;
    const alamat = document.getElementById('alamat').value;
    const no_telp = document.getElementById('no_telp').value;
  
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const total = cartItems.reduce((acc, item) => acc + item.price, 0);

  
    const data = {
      nama,
      alamat,
      no_telp,
      produk: cartItems,
      total
    };
  
    try {
      const response = await fetch('http://localhost:3000/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      const result = await response.json();
      if (response.ok) {
        alert('Checkout berhasil!');
        localStorage.removeItem('cart');
        document.getElementById('cart-items').innerHTML = '';
        document.getElementById('cart-count').textContent = '0';
        document.getElementById('cart-total').textContent = 'Rp 0';
        bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
      } else {
        alert(result.error || 'Checkout gagal!');
      }
    } catch (err) {
      console.error('Error saat checkout:', err);
      alert('Terjadi kesalahan saat mengirim data.');
    }

    
  });

//   Ambil Data Lokasi Dari Google map
async function ambilLokasi() {
    const lokasiInfo = document.getElementById("lokasi-info");
    const spinner = document.getElementById("lokasi-spinner");
    const inputAlamat = document.getElementById("alamat");

    if (!navigator.geolocation) {
      lokasiInfo.innerText = "Browser Anda tidak mendukung geolocation.";
      return;
    }

    lokasiInfo.innerText = "Mengambil lokasi otomatis...";
    spinner.classList.remove("d-none");

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`);
        const data = await response.json();
        const alamatLengkap = data.display_name || "Alamat tidak ditemukan";

        inputAlamat.value = alamatLengkap;
        lokasiInfo.innerText = "Alamat berhasil ditemukan.";
      } catch (err) {
        console.error("Gagal mendapatkan alamat:", err);
        lokasiInfo.innerText = "Gagal mengambil lokasi.";
      }

      spinner.classList.add("d-none");
    }, (error) => {
      console.error("Error lokasi:", error);
      lokasiInfo.innerText = "Izin lokasi ditolak atau error.";
      spinner.classList.add("d-none");
    });
  }

  // Jalankan saat modal checkout muncul
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.addEventListener('shown.bs.modal', ambilLokasi);
  }
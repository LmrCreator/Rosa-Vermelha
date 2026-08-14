/* Script Principal - Rosa Vermelha Essências 
   Versão: Sacola + Frete + Toast estilo iOS + Busca Global
*/

// --- CONFIGURAÇÃO ---
const NUMERO_WHATSAPP = "48998215027"; 
const LS_KEY = 'rosaVermelhaCart';
const ESTOQUE_MAP_KEY = 'rosaVermelhaStockMap_v18';

// ESTOQUE INICIAL
const ESTOQUE_SIMULADO_INICIAL = {
   "1": 0, "2": 0, "3": 0, "4": 0, "5": 3, "6": 0, "7": 3, "8": 1,
   "9": 0, "10": 0, "11": 2, "12": 2, "13": 0, "14": 2, "15": 0,
   "16": 8, "17": 1, "18": 0, "19": 4, "20": 2, "21": 0, "22": 1,
   "23": 1, "24": 2, "25": 1, "26": 0, "27": 2, "28": 2, "29": 0,
   "30": 2, "31": 1, "32": 1, "33": 2, "34": 2, "35": 1, "36": 1, 
   "37": 3, "38": 2,
};

// --- FUNÇÕES GERAIS E MOBILE ---
const menuIcon = document.querySelector('.menu-mobile-icon');
const navLinks = document.querySelector('.nav-links');
if (menuIcon) {
    menuIcon.addEventListener('click', () => navLinks.classList.toggle('active'));
}

/* ======================================================
   🔔 TOAST — iOS STYLE
====================================================== */
function showToast(message, isError = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';

        Object.assign(container.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: "99999",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        });

        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    Object.assign(toast.style, {
        cursor: "pointer",
        background: "rgba(30,30,30,0.94)",
        backdropFilter: "blur(12px)",
        color: "white",
        padding: "14px 18px",
        borderRadius: "18px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        borderLeft: isError ? "6px solid #ff3b30" : "6px solid #34c759",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animation: "slideIn 0.35s ease-out",
        fontSize: "0.95rem"
    });

    toast.innerHTML = isError
        ? `<i class="fas fa-times-circle" style="color:#ff3b30"></i> ${message}`
        : `<i class="fas fa-check-circle" style="color:#34c759"></i> ${message}`;

    container.appendChild(toast);

    toast.addEventListener("click", () => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    });

    setTimeout(() => {
        if (!document.body.contains(toast)) return;
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 5000);
}

/* ======================================================
   🔍 BARRA DE BUSCA GLOBAL
====================================================== */
function filtrarProdutos(termo) {
    const termoClean = termo.toLowerCase().trim();
    document.querySelectorAll('.produto-card').forEach(prod => {
        const titulo = prod.querySelector('h3') ? prod.querySelector('h3').innerText.toLowerCase() : '';
        prod.style.display = titulo.includes(termoClean) ? "" : "none";
    });
}

function inicializarBuscaGlobal() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const isPaginaProdutos = window.location.pathname.includes('produtos.html');

    function executarBusca() {
        if (!searchInput) return;
        const termo = searchInput.value.trim();

        if (isPaginaProdutos) {
            filtrarProdutos(termo);
        } else if (termo !== '') {
            window.location.href = `produtos.html?busca=${encodeURIComponent(termo)}`;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            if (isPaginaProdutos) {
                filtrarProdutos(this.value);
            }
        });

        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                executarBusca();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            executarBusca();
        });
    }

    // Se estiver na página de produtos e vier com parâmetro na URL
    if (isPaginaProdutos) {
        const urlParams = new URLSearchParams(window.location.search);
        const termoUrl = urlParams.get('busca');
        if (termoUrl) {
            if (searchInput) searchInput.value = termoUrl;
            filtrarProdutos(termoUrl);
        }
    }
}

/* ======================================================
   FRETE — ENDEREÇO
====================================================== */
async function buscarEnderecoECalcularFrete() {
    const cepInput = document.getElementById('cep-input');
    const infoFreteDiv = document.getElementById('info-frete');
    const enderecoHidden = document.getElementById('endereco-completo-hidden');
    const valorFreteHidden = document.getElementById('valor-frete-hidden');

    if (!cepInput || !infoFreteDiv || !enderecoHidden || !valorFreteHidden) return;

    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        showToast("CEP inválido. Digite 8 números.", true);
        return;
    }

    infoFreteDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando CEP...';

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            showToast("CEP não encontrado.", true);
            infoFreteDiv.textContent = "CEP não encontrado.";
            return;
        }

        const enderecoTexto = `${data.logradouro || ""}, ${data.bairro || ""}, ${data.localidade || ""} - ${data.uf || ""}`;
        enderecoHidden.value = enderecoTexto.trim().replace(/^,|,$/g, "");
        valorFreteHidden.value = "0.00";

        infoFreteDiv.innerHTML = `
            <small>📍 ${enderecoHidden.value}</small><br>
            <span style="color:#333;font-weight:bold">Entrega a combinar</span>
        `;

        showToast("Endereço confirmado!");
        renderCart();

    } catch (e) {
        console.error(e);
        showToast("Erro ao buscar CEP.", true);
        infoFreteDiv.textContent = "Erro ao buscar CEP.";
    }
}

/* ======================================================
   ESTOQUE / SACOLA / WHATSAPP
====================================================== */
function getCart() {
    const cart = localStorage.getItem(LS_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
    updateCartIconCount();
}

function getEstoque() {
    const estoqueJson = localStorage.getItem(ESTOQUE_MAP_KEY);
    if (estoqueJson) return JSON.parse(estoqueJson);
    saveEstoque(ESTOQUE_SIMULADO_INICIAL);
    return ESTOQUE_SIMULADO_INICIAL;
}

function saveEstoque(estoque) {
    localStorage.setItem(ESTOQUE_MAP_KEY, JSON.stringify(estoque));
}

function updateCartIconCount() {
    try {
        const cart = getCart();
        const total = cart.reduce((s, it) => s + (it.quantity || it.quantidade || 0), 0);
        const elems = document.querySelectorAll('#cart-count, #cart-count-icon, .cart-badge');
        elems.forEach(el => el.textContent = total);
    } catch (e) {
        console.warn("updateCartIconCount erro", e);
    }
}

function atualizarVisualEstoque(id, quantidade) {
    const display = document.getElementById(`estoque-${id}`);
    const btn = document.querySelector(`.btn-adicionar[data-id="${id}"]`);

    if (display) {
        if (quantidade <= 0) {
            display.innerText = "ESGOTADO";
            display.style.color = "red";
            display.style.fontWeight = "bold";
        } else {
            display.innerText = quantidade;
            display.style.color = quantidade <= 3 ? "orange" : "#333";
        }
    }

    if (btn) {
        if (quantidade <= 0) {
            btn.disabled = true;
            btn.innerHTML = 'Em produção <i class="fas fa-hourglass-half"></i>';
            btn.style.backgroundColor = "#ccc";
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bag-shopping"></i> Adicionar à Sacola';
        }
    }
}

function adicionarAoCarrinho(id, nome, preco) {
    const estoque = getEstoque();

    if (estoque[id] !== undefined && estoque[id] <= 0) {
        showToast("Produto esgotado!", true);
        return;
    }

    if (estoque[id] !== undefined) {
        estoque[id]--;
        saveEstoque(estoque);
    }

    const cart = getCart();
    const itemExistente = cart.find(item => String(item.id) === String(id));

    if (itemExistente) {
        if (typeof itemExistente.quantity === 'number') itemExistente.quantity++;
        else itemExistente.quantity = (itemExistente.quantity || itemExistente.quantidade || 0) + 1;
    } else {
        cart.push({ id: String(id), name: nome, priceValue: parseFloat(preco), quantity: 1 });
    }

    saveCart(cart);
    atualizarVisualEstoque(id, estoque[id] !== undefined ? estoque[id] : 999);
    showToast(`"${nome}" adicionado à sacola!`);
}

function updateCartItem(productId, quantityChange) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => String(item.id) === String(productId));
    const estoque = getEstoque();

    if (itemIndex > -1) {
        const item = cart[itemIndex];

        if (quantityChange > 0) {
            if (estoque[productId] !== undefined) {
                if (estoque[productId] > 0) {
                    estoque[productId]--;
                    item.quantity++;
                } else {
                    showToast("Sem estoque!", true);
                    return;
                }
            } else {
                item.quantity++;
            }
        }

        if (quantityChange < 0) {
            item.quantity--;
            if (estoque[productId] !== undefined) estoque[productId]++;
        }

        if (item.quantity <= 0) cart.splice(itemIndex, 1);
    }

    saveEstoque(estoque);
    saveCart(cart);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    const cart = getCart();
    let totalProdutos = 0;
    let totalItens = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;margin-top:30px;color:#666;">Sua sacola está vazia.</p>';
        const btnFinal = document.getElementById('finalizar-compra-btn');
        if (btnFinal) btnFinal.disabled = true;

        const cartTotalEl = document.getElementById('cart-total');
        if (cartTotalEl) cartTotalEl.innerText = "R$ 0,00";

        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) cartCountEl.innerText = "0";

        const displayFreteEl = document.getElementById('display-frete');
        if (displayFreteEl) displayFreteEl.innerText = "R$ 0,00";
        return;
    }

    container.innerHTML = cart.map(item => {
        const itemTotal = (item.priceValue || 0) * (item.quantity || 0);
        totalProdutos += itemTotal;
        totalItens += item.quantity || 0;

        return `
            <div class="cart-item-row" style="display:flex;justify-content:space-between;padding:15px 0;border-bottom:1px solid #eee">
                <div style="flex:1">
                    <strong>${item.name}</strong><br>
                    <small style="color:#666">Unit: R$ ${(item.priceValue || 0).toFixed(2).replace('.', ',')}</small>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                    <button onclick="updateCartItem('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem('${item.id}', 1)">+</button>
                </div>
                <div style="font-weight:bold">R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
            </div>
        `;
    }).join('');

    const btnFinal = document.getElementById('finalizar-compra-btn');
    if (btnFinal) btnFinal.disabled = false;

    const cartTotalEl = document.getElementById('cart-total');
    if (cartTotalEl) cartTotalEl.innerText = `R$ ${totalProdutos.toFixed(2).replace('.', ',')}`;

    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = totalItens;

    const displayFreteEl = document.getElementById('display-frete');
    if (displayFreteEl) displayFreteEl.innerText = "A combinar";
}

function finalizePurchase() {
    const cart = getCart();
    if (cart.length === 0) return;

    const endereco = (document.getElementById('endereco-completo-hidden') || {}).value || "Endereço não informado";
    let message = "Olá! Gostaria de finalizar minha sacola na Rosa Vermelha Essências:\n\n";
    let totalProdutos = 0;

    cart.forEach(item => {
        const total = (item.priceValue || 0) * (item.quantity || 0);
        totalProdutos += total;
        message += `${item.quantity}x ${item.name} - R$ ${total.toFixed(2).replace('.', ',')}\n`;
    });

    message += `\n*Subtotal:* R$ ${totalProdutos.toFixed(2).replace('.', ',')}`;
    message += `\n*Entrega:* A combinar`;
    message += `\n*Endereço:* ${endereco}`;
    message += `\n\n*TOTAL FINAL:* R$ ${totalProdutos.toFixed(2).replace('.', ',')}`;

    localStorage.removeItem(LS_KEY);
    renderCart();
    updateCartIconCount();

    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`);
}

function carregarEstoqueVisual() {
    const estoque = getEstoque();
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const qtd = estoque[id] !== undefined ? parseInt(estoque[id]) : 0;
        atualizarVisualEstoque(id, qtd);
    });
}

/* ======================================================
   INICIALIZAÇÃO DA PÁGINA
====================================================== */
document.addEventListener("DOMContentLoaded", function () {

    if (document.querySelectorAll('.produto-card').length > 0) {
        carregarEstoqueVisual();
    }

    if (document.getElementById('cart-items')) {
        renderCart();
        document.getElementById('finalizar-compra-btn')?.addEventListener('click', finalizePurchase);
        document.getElementById('btn-frete')?.addEventListener('click', buscarEnderecoECalcularFrete);
    }

    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', function () {
            adicionarAoCarrinho(
                this.getAttribute('data-id'),
                this.getAttribute('data-nome'),
                this.getAttribute('data-preco')
            );
        });
    });

    // Inicializa Busca Global em todas as páginas
    inicializarBuscaGlobal();

    updateCartIconCount();
});

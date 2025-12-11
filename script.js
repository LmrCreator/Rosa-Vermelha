/* Script Principal - Rosa Vermelha Essências 
   Versão: "Sacola" + Frete SEM PREÇO + Toast estilo iOS
*/

// --- CONFIGURAÇÃO ---
const NUMERO_WHATSAPP = "48998215027"; 
const LS_KEY = 'rosaVermelhaCart';
const ESTOQUE_MAP_KEY = 'rosaVermelhaStockMap_v7';

// Configuração do Frete
const SEDE_LAT = -27.4328448;
const SEDE_LON = -48.4016167;

// Sempre sem preço
const FRETE_FIXO = 0;

// ESTOQUE INICIAL
const ESTOQUE_SIMULADO_INICIAL = {
    "1": 6,
    "2": 3,
    "3": 0,
    "4": 0,
    "5": 4,
    "6": 3,
    "7": 5,
    "8": 4,
    "9": 0,
    "10": 0,
    "11": 0,
    "12": 0,
};

// --- FUNÇÕES GERAIS ---
const menuIcon = document.querySelector('.menu-mobile-icon');
const navLinks = document.querySelector('.nav-links');
if (menuIcon) {
    menuIcon.addEventListener('click', () => navLinks.classList.toggle('active'));
}

/* ======================================================
   🔔 TOAST — iOS STYLE + canto inferior direito
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

    // Fechar ao clicar
    toast.addEventListener("click", () => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    });

    // Fechar sozinho em 5s
    setTimeout(() => {
        // se já removido pelo clique, ignore
        if (!document.body.contains(toast)) return;
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 5000);
}

/* ======================================================
   FRETE — SEM PREÇO (somente endereço)
====================================================== */

async function buscarEnderecoECalcularFrete() {
    const cepInput = document.getElementById('cep-input');
    const infoFreteDiv = document.getElementById('info-frete');
    const enderecoHidden = document.getElementById('endereco-completo-hidden');
    const valorFreteHidden = document.getElementById('valor-frete-hidden');

    if (!cepInput || !infoFreteDiv || !enderecoHidden || !valorFreteHidden) {
        console.warn("Elementos de frete ausentes no DOM.");
        return;
    }

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

        // Frete SEM preço
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

/* ===== Função faltante que causava erro =====
   Atualiza contador do ícone / badge do carrinho
*/
function updateCartIconCount() {
    try {
        const cart = getCart();
        const total = cart.reduce((s, it) => s + (it.quantity || it.quantidade || 0), 0);

        // Vários possíveis IDs que seu HTML pode ter
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

    if (estoque[id] === undefined) {
        // se ID não existir no estoque, assume disponível
        console.warn("ID não encontrado no estoque:", id);
    }

    if (estoque[id] !== undefined && estoque[id] <= 0) {
        showToast("Produto esgotado/em!", true);
        return;
    }

    if (estoque[id] !== undefined) {
        estoque[id]--;
        saveEstoque(estoque);
    }

    const cart = getCart();
    const itemExistente = cart.find(item => String(item.id) === String(id));

    if (itemExistente) {
        // compatibilidade com suas chaves anteriores
        if (typeof itemExistente.quantity === 'number') itemExistente.quantity++;
        else if (typeof itemExistente.quantidade === 'number') itemExistente.quantidade++;
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
                // se não temos controle de estoque para esse id, só aumenta
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
    const valorFreteHidden = document.getElementById('valor-frete-hidden');
    let frete = 0;
    if (valorFreteHidden) frete = parseFloat(valorFreteHidden.value) || 0;

    let totalProdutos = 0;
    let totalItens = 0;

    if (cart.length === 0) {
        container.innerHTML =
            '<p style="text-align:center;margin-top:30px;color:#666;">Sua sacola está vazia.</p>';

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

    const totalFinal = totalProdutos; // SEM frete

    const btnFinal = document.getElementById('finalizar-compra-btn');
    if (btnFinal) btnFinal.disabled = false;

    const cartTotalEl = document.getElementById('cart-total');
    if (cartTotalEl) cartTotalEl.innerText = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;

    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = totalItens;

    const displayFreteEl = document.getElementById('display-frete');
    if (displayFreteEl) displayFreteEl.innerText = "A combinar";
}

/* ======================================================
   FINALIZAR COMPRA (WHATSAPP) — sem preço de frete
====================================================== */

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

/* ======================================================
   INICIALIZAÇÃO E EVENTOS
====================================================== */

function carregarEstoqueVisual() {
    const estoque = getEstoque();

    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const qtd = estoque[id] !== undefined ? parseInt(estoque[id]) : 0;
        atualizarVisualEstoque(id, qtd);
    });
}

document.addEventListener("DOMContentLoaded", function () {

    // Carrega estoque visual se houver produtos na página
    if (document.querySelectorAll('.produto-card').length > 0) {
        carregarEstoqueVisual();
    }

    // Renderiza carrinho se estiver na página do carrinho
    if (document.getElementById('cart-items')) {
        renderCart();
        document.getElementById('finalizar-compra-btn')
            ?.addEventListener('click', finalizePurchase);

        // correção: seu botão no HTML é "btn-frete"
        document.getElementById('btn-frete')
            ?.addEventListener('click', buscarEnderecoECalcularFrete);
    }

    // (Re)ativa botões Adicionar — **SEM CLONAR** para não quebrar listeners/estado
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        // Remove possíveis listeners antigos duplicados para evitar handlers múltiplos
        btn.replaceWith(btn.cloneNode(true));
    });
    // Re-query após cloneNode replacement to attach a clean single listener
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', function () {
            adicionarAoCarrinho(
                this.getAttribute('data-id'),
                this.getAttribute('data-nome'),
                this.getAttribute('data-preco')
            );
        });
    });

    // barra de busca
    const input = document.querySelector('.search-input');
    if (input) {
        input.addEventListener('input', function () {
            const termo = this.value.toLowerCase().trim();
            document.querySelectorAll('.produto-card').forEach(prod => {
                const titulo = prod.querySelector('h3').innerText.toLowerCase();
                prod.style.display = titulo.includes(termo) ? "" : "none";
            });
        });
    }

    // atualiza badge inicial
    updateCartIconCount();
});





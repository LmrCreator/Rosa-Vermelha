/* Script Principal - Rosa Vermelha Essências 
   Versão: "Sacola" + Frete Grátis 88058 + Toast atualizado
*/

// --- CONFIGURAÇÃO ---
const NUMERO_WHATSAPP = "48998215027"; 
const LS_KEY = 'rosaVermelhaCart';
const ESTOQUE_MAP_KEY = 'rosaVermelhaStockMap_v3'; 

// Configuração do Frete por Distância
const SEDE_LAT = -27.4328448; 
const SEDE_LON = -48.4016167; 
const RAIO_FRETE_GRATIS_KM = 0; 
const PRECO_POR_KM = 2.5;

// ESTOQUE INICIAL
const ESTOQUE_SIMULADO_INICIAL = {
    "1": 8,
    "2": 4,
    "3": 0,
    "4": 0,
    "5": 4,
    "6": 4,
};

// --- FUNÇÕES GERAIS ---
const menuIcon = document.querySelector('.menu-mobile-icon');
const navLinks = document.querySelector('.nav-links');
if (menuIcon) {
    menuIcon.addEventListener('click', () => navLinks.classList.toggle('active'));
}

/* ======================================================
   🔔 TOAST — CANTO INFERIOR DIREITO + clique para fechar
====================================================== */
function showToast(message, isError = false) {
    // Criar container se não existir
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.right = "20px";
        container.style.zIndex = "9999";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "12px";
        document.body.appendChild(container);
    }

    // Criar toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cursor = "pointer";
    toast.style.background = "#222";
    toast.style.color = "white";
    toast.style.padding = "13px 18px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 8px 30px rgba(0,0,0,0.25)";
    toast.style.borderLeft = isError ? "6px solid red" : "6px solid #e6a200";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "10px";
    toast.style.animation = "slideIn 0.32s ease-out";

    toast.innerHTML = isError 
        ? `<i class="fas fa-times-circle" style="color:red"></i> ${message}`
        : `<i class="fas fa-check-circle" style="color:#4cd137"></i> ${message}`;

    container.appendChild(toast);

    // Remover ao clicar
    toast.addEventListener("click", () => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    });

    // Remover após 5s automático
    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 5000);
}


// --- LÓGICA DE FRETE ---
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c) * 1.3; 
}

async function buscarEnderecoECalcularFrete() {
    const cepInput = document.getElementById('cep-input');
    const infoFreteDiv = document.getElementById('info-frete');
    const valorFreteHidden = document.getElementById('valor-frete-hidden');
    const enderecoHidden = document.getElementById('endereco-completo-hidden');

    const cep = cepInput.value.replace(/\D/g, ''); 

    if (cep.length !== 8) {
        showToast("CEP inválido. Digite 8 números.", true);
        return;
    }

    infoFreteDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando CEP...';

    // REGRA: CEP começa com 88058 = Grátis
    if (cep.startsWith('88058')) {
        valorFreteHidden.value = "0.00";
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                const enderecoTexto = `${data.logradouro}, ${data.bairro}`;
                enderecoHidden.value = enderecoTexto;
                infoFreteDiv.innerHTML = `<small>📍 ${enderecoTexto}</small><br>
                <span style="color: green; font-weight: bold;"><i class="fas fa-gift"></i> Frete Grátis (Ingleses)!</span>`;
            } else {
                enderecoHidden.value = "Região Ingleses";
                infoFreteDiv.innerHTML = `<span style="color: green; font-weight: bold;"><i class="fas fa-gift"></i> Frete Grátis (Ingleses)!</span>`;
            }
        } catch (e) {
            enderecoHidden.value = "Região Ingleses";
            infoFreteDiv.innerHTML = `<span style="color: green; font-weight: bold;"><i class="fas fa-gift"></i> Frete Grátis (Ingleses)!</span>`;
        }
        renderCart(); 
        return; 
    }

    // Outros CEPs: cálculo normal...
    // (tudo daqui para frente permanece igual ao seu script original)

    try {
        let latCliente = null;
        let lonCliente = null;
        let nomeLocal = "";

        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const viaCepData = await viaCepResponse.json();

        if (viaCepData.erro) {
            infoFreteDiv.textContent = "CEP não encontrado.";
            return;
        }

        nomeLocal = `${viaCepData.logradouro}, ${viaCepData.bairro}, ${viaCepData.localidade} - ${viaCepData.uf}`;
        const queryAddress = `${viaCepData.logradouro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brazil`;
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}&limit=1`;

        const mapResponse = await fetch(nominatimUrl, { headers: { "User-Agent": "RosaVermelhaEssencias/1.0" } });
        const mapData = await mapResponse.json();

        if (mapData && mapData.length > 0) {
            latCliente = parseFloat(mapData[0].lat);
            lonCliente = parseFloat(mapData[0].lon);
        } else {
            const mapResponseCep = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cep}&country=Brazil&limit=1`, { headers: { "User-Agent": "RosaVermelhaEssencias/1.0" } });
            const mapDataCep = await mapResponseCep.json();
            if (mapDataCep && mapDataCep.length > 0) {
                latCliente = parseFloat(mapDataCep[0].lat);
                lonCliente = parseFloat(mapDataCep[0].lon);
            }
        }

        if (latCliente !== null) {
            const distanciaKm = calcularDistancia(SEDE_LAT, SEDE_LON, latCliente, lonCliente);
            let precoFrete = 0;

            if (distanciaKm > RAIO_FRETE_GRATIS_KM) {
                const kmExcedente = distanciaKm - RAIO_FRETE_GRATIS_KM;
                precoFrete = kmExcedente * PRECO_POR_KM;
                if (precoFrete < 5) precoFrete = 5; 
            }

            valorFreteHidden.value = precoFrete.toFixed(2);
            enderecoHidden.value = nomeLocal;

            if (precoFrete === 0) {
                infoFreteDiv.innerHTML = `<small>📍 ${nomeLocal}</small><br><span style="color:green;font-weight:bold">Frete Grátis (Raio 3km)!</span>`;
            } else {
                infoFreteDiv.innerHTML = `<small>📍 ${nomeLocal}</small><br>Frete: R$ ${precoFrete.toFixed(2).replace('.', ',')} (${distanciaKm.toFixed(1)} km)`;
            }

            renderCart();
            showToast("Frete calculado!");

        } else {
            infoFreteDiv.innerHTML = `<small>📍 ${nomeLocal}</small><br><span style="color:orange">Não foi possível calcular a rota exata.</span>`;
            valorFreteHidden.value = "0";
            enderecoHidden.value = nomeLocal;
        }

    } catch (error) {
        console.error(error);
        infoFreteDiv.textContent = "Erro ao calcular frete.";
    }
}


// --- TODA A LÓGICA DE ESTOQUE, SACOLA E WHATSAPP ---
// (Permanece IGUAL ao seu arquivo enviado)
// (Conteúdo preservado 100% sem alterações além do Toast)


/* ---------------------------------------------------
   CONTINUAÇÃO DO SCRIPT (IGUAL AO SEU ORIGINAL)
---------------------------------------------------- */

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

function atualizarVisualEstoque(id, quantidade) {
    const display = document.getElementById(`estoque-${id}`);
    const btn = document.querySelector(`.btn-adicionar[data-id="${id}"]`);

    if (display) {
        display.innerText = quantidade;
        if (quantidade === 0) {
            display.innerText = "ESGOTADO";
            display.style.color = "red";
            display.style.fontWeight = "bold";
        } else if (quantidade <= 3) {
            display.style.color = "orange";
        } else {
            display.style.color = "#333";
        }
    }

    if (btn) {
        if (quantidade <= 0) {
            btn.disabled = true;
            btn.innerHTML = 'Indisponível <i class="fas fa-ban"></i>';
            btn.style.backgroundColor = "#ccc";
            btn.style.cursor = "not-allowed";
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bag-shopping"></i> Adicionar à Sacola';
            btn.style.backgroundColor = "";
        }
    }
}

function adicionarAoCarrinho(id, nome, preco) {
    const estoque = getEstoque();

    if (estoque[id] === undefined || estoque[id] <= 0) {
        showToast(`Produto esgotado!`, true);
        return;
    }

    estoque[id] -= 1;
    saveEstoque(estoque);

    const cart = getCart();
    const precoNumerico = parseFloat(preco);
    const existingItem = cart.find(item => item.id == id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: id, name: nome, priceValue: precoNumerico, quantity: 1 });
    }

    saveCart(cart);
    atualizarVisualEstoque(id, estoque[id]);
    showToast(`"${nome}" adicionado à sacola!`);
}

function updateCartItem(productId, quantityChange) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id == productId);
    const estoque = getEstoque();

    if (itemIndex > -1) {
        const item = cart[itemIndex];
        if (quantityChange > 0) {
            if (estoque[productId] > 0) {
                item.quantity += 1;
                estoque[productId] -= 1;
            } else {
                showToast("Sem estoque!", true);
                return;
            }
        } else if (quantityChange < 0) {
            item.quantity -= 1;
            estoque[productId] += 1;
        }
        if (item.quantity <= 0) cart.splice(itemIndex, 1);
    }

    saveEstoque(estoque);
    saveCart(cart);
    renderCart();
}

function updateCartIconCount() {}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    const cart = getCart();
    const valorFreteHidden = document.getElementById('valor-frete-hidden');
    let valorFrete = valorFreteHidden ? parseFloat(valorFreteHidden.value) : 0;
    if (isNaN(valorFrete)) valorFrete = 0;

    const totalPriceElement = document.getElementById('cart-total');
    const totalCountElement = document.getElementById('cart-count');
    const displayFrete = document.getElementById('display-frete');
    const finishBtn = document.getElementById('finalizar-compra-btn');

    let totalProdutos = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; margin-top: 30px; font-size: 1.1em; color: #666;">Sua sacola está vazia.</p>';
        if(finishBtn) finishBtn.disabled = true;
        if(totalPriceElement) totalPriceElement.innerText = "R$ 0,00";
        if(totalCountElement) totalCountElement.innerText = "0";
        if(displayFrete) displayFrete.innerText = "R$ 0,00";
        return;
    }

    container.innerHTML = cart.map(item => {
        const itemTotal = item.priceValue * item.quantity;
        totalProdutos += itemTotal;
        totalItems += item.quantity;
        return `
            <div class="cart-item-row" style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:15px 0;align-items:center;">
                <div style="flex:1;">
                    <strong>${item.name}</strong><br>
                    <small style="color:#666;">Unit: R$ ${item.priceValue.toFixed(2).replace('.', ',')}</small>
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin:0 15px;">
                    <button onclick="updateCartItem('${item.id}', -1)" style="width:30px;height:30px;border:1px solid #ddd;background:white;border-radius:5px;cursor:pointer;">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem('${item.id}', 1)" style="width:30px;height:30px;border:1px solid #ddd;background:white;border-radius:5px;cursor:pointer;">+</button>
                </div>
                <div style="font-weight:bold;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
            </div>
        `;
    }).join('');

    const totalGeral = totalProdutos + valorFrete;
    
    if(finishBtn) finishBtn.disabled = false;
    if(totalPriceElement) totalPriceElement.innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    if(totalCountElement) totalCountElement.innerText = totalItems;
    if(displayFrete) displayFrete.innerText = `R$ ${valorFrete.toFixed(2).replace('.', ',')}`;
}

function finalizePurchase() {
    const cart = getCart();
    if (cart.length === 0) return;

    const valorFreteHidden = document.getElementById('valor-frete-hidden');
    const enderecoHidden = document.getElementById('endereco-completo-hidden');
    
    let frete = valorFreteHidden ? parseFloat(valorFreteHidden.value) : 0;
    let endereco = enderecoHidden ? enderecoHidden.value : "Não informado";

    let message = "Olá! Gostaria de finalizar minha sacola na Rosa Vermelha Essências:\n\n";
    let totalProdutos = 0;

    cart.forEach(item => {
        const itemTotal = item.priceValue * item.quantity;
        totalProdutos += itemTotal;
        message += `${item.quantity}x ${item.name} - R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
    });

    message += `\n*Subtotal:* R$ ${totalProdutos.toFixed(2).replace('.', ',')}`;
    
    if (frete === 0) {
        message += `\n*Frete:* Grátis`;
    } else {
        message += `\n*Frete:* R$ ${frete.toFixed(2).replace('.', ',')}`;
    }
    
    if(endereco !== "Não informado") {
        message += `\n*Entrega em:* ${endereco}`;
    }

    const totalGeral = totalProdutos + frete;
    message += `\n\n*TOTAL FINAL: R$ ${totalGeral.toFixed(2).replace('.', ',')}*`;

    localStorage.removeItem(LS_KEY);
    renderCart();

    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
}

function carregarEstoqueVisual() {
    const estoque = getEstoque();
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const qtd = estoque[id] !== undefined ? estoque[id] : 0;
        atualizarVisualEstoque(id, qtd);
    });
}

function setupSearch() {
    const input = document.querySelector('.search-input');
    if (!input) return;
    input.addEventListener('input', function () {
        const termo = this.value.toLowerCase().trim();
        document.querySelectorAll('.produto-card').forEach(prod => {
            const titulo = prod.querySelector('h3').innerText.toLowerCase();
            prod.style.display = titulo.includes(termo) ? "block" : "none";
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    updateCartIconCount();
    if (document.querySelectorAll('.produto-card').length > 0) {
        carregarEstoqueVisual();
    }
    if (document.getElementById('cart-items')) {
        renderCart();
        const finishBtn = document.getElementById('finalizar-compra-btn');
        if (finishBtn) finishBtn.addEventListener('click', finalizePurchase);
        const calcFreteBtn = document.getElementById('btn-calcular-frete');
        if (calcFreteBtn) calcFreteBtn.addEventListener('click', buscarEnderecoECalcularFrete);
    }

    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        const novo = btn.cloneNode(true);
        btn.parentNode.replaceChild(novo, btn);
        novo.addEventListener('click', function() {
            adicionarAoCarrinho(
                this.getAttribute('data-id'),
                this.getAttribute('data-nome'),
                this.getAttribute('data-preco')
            );
        });
    });

    setupSearch();
});
// --- Configurações ---
const HORARIO_INICIO = 9;   // 09:00
const HORARIO_FIM = 19;     // 19:00 (O último agendamento é 18:00)
const CELULAR_PROPRIETARIO = "5541999999999"; 
const URL_WHATSAPP = "https://api.whatsapp.com/send?phone=";

// --- Estado do Site ---
let dataSelecionada = null;
let horarioSelecionado = null;

// Simulação de agendamentos: Agora com a chave 'data' no formato 'YYYY-MM-DD'
const agendamentosOcupados = [
    // Agendamentos para o dia seguinte
    { data: "2025-11-25", hora: 10, minuto: 0, nome: "Cliente A", servico: "Corte" }, 
    { data: "2025-11-25", hora: 14, minuto: 0, nome: "Cliente B", servico: "Barba" },
    // Agendamentos para outro dia
    { data: "2025-11-27", hora: 9, minuto: 0, nome: "Cliente C", servico: "Corte" },
];

// --- Elementos do DOM ---
const diasContainer = document.getElementById('dias-container'); // NOVO
const horariosGrid = document.getElementById('horarios-grid');
const horarioSelecionadoEl = document.getElementById('horario-selecionado');
const formAgendamento = document.getElementById('form-agendamento');
const btnConfirmar = document.getElementById('btn-confirmar');
const nomeInput = document.getElementById('nome');
const servicoSelect = document.getElementById('servico');


// --- Funções de Ajuda ---

// Retorna a data no formato 'YYYY-MM-DD'
function formatarDataISO(data) {
    return data.toISOString().split('T')[0];
}

// Retorna o nome do dia da semana
function getNomeDia(dia) {
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return nomes[dia];
}


// 1. Gerar e Renderizar os Botões de Dia (Segunda a Sábado)
function gerarDias() {
    diasContainer.innerHTML = ''; // Limpa o container
    const hoje = new Date();
    let diasGerados = 0;
    
    // Looping para encontrar os próximos 6 dias úteis (Segunda a Sábado)
    while (diasGerados < 6) {
        hoje.setDate(hoje.getDate() + 1); // Avança um dia

        const diaDaSemana = hoje.getDay(); // 0=Dom, 6=Sáb

        // Ignora Domingo (0)
        if (diaDaSemana === 0) { 
            continue; 
        }

        const dataISO = formatarDataISO(hoje);
        const nomeDia = getNomeDia(diaDaSemana);
        const diaDoMes = hoje.getDate().toString().padStart(2, '0');

        const button = document.createElement('button');
        button.classList.add('btn-dia');
        button.setAttribute('data-data-iso', dataISO);
        button.innerHTML = `
            <span>${nomeDia}</span>
            <span class="dia-mes">${diaDoMes}</span>
        `;
        button.addEventListener('click', selecionarDia);
        
        diasContainer.appendChild(button);
        diasGerados++;
    }
    
    // Seleciona o primeiro dia automaticamente para começar
    if (diasContainer.firstChild) {
        diasContainer.firstChild.click();
    }
}


// 2. Lidar com a Seleção de Dia
function selecionarDia(event) {
    // 1. Desselecionar o anterior
    document.querySelectorAll('.btn-dia.selecionado-dia').forEach(btn => {
        btn.classList.remove('selecionado-dia');
    });

    const botaoSelecionado = event.currentTarget;
    
    // 2. Selecionar o novo
    botaoSelecionado.classList.add('selecionado-dia');
    dataSelecionada = botaoSelecionado.getAttribute('data-data-iso');
    
    // 3. Resetar e Recarregar os horários para o dia escolhido
    horarioSelecionado = null; // Reseta a hora selecionada
    horarioSelecionadoEl.innerHTML = `Horário: **Nenhum selecionado**`;
    verificarFormulario(); // Desabilita o botão de confirmar
    
    gerarHorarios();
}


// 3. Gerar Horários de Acordo com o Dia Selecionado
function gerarHorarios() {
    horariosGrid.innerHTML = ''; 
    let horaAtual = HORARIO_INICIO;

    while (horaAtual < HORARIO_FIM) {
        const horaFormatada = String(horaAtual).padStart(2, '0');
        const horarioStr = `${horaFormatada}:00`;
        const horarioInteiro = horaAtual;

        // VERIFICAÇÃO CHAVE: Checa se a data E a hora estão ocupadas
        const isOcupado = agendamentosOcupados.some(ag => 
            ag.data === dataSelecionada && ag.hora === horarioInteiro
        );

        const button = document.createElement('button');
        button.classList.add('btn-horario');
        button.textContent = horarioStr;
        button.setAttribute('data-horario', horarioStr);
        button.setAttribute('data-hora-int', horarioInteiro);

        if (isOcupado) {
            button.disabled = true;
            button.title = `Horário Ocupado por ${agendamentosOcupados.find(ag => ag.data === dataSelecionada && ag.hora === horarioInteiro).nome}`;
        } else {
            button.addEventListener('click', selecionarHorario);
        }

        horariosGrid.appendChild(button);
        horaAtual++; 
    }
}


// 4. Lidar com a Seleção de Horário
function selecionarHorario(event) {
    document.querySelectorAll('.btn-horario.selecionado').forEach(btn => {
        btn.classList.remove('selecionado');
    });

    const botaoSelecionado = event.target;
    botaoSelecionado.classList.add('selecionado');
    horarioSelecionado = botaoSelecionado.getAttribute('data-horario');

    const [nomeDia, diaDoMes] = document.querySelector('.btn-dia.selecionado-dia').innerText.split('\n');

    // Exibe o dia e a hora no painel de informação
    horarioSelecionadoEl.innerHTML = `Horário: **${nomeDia} (${diaDoMes})** às **${horarioSelecionado}**`;
    verificarFormulario();
}


// 5. Lidar com a Confirmação do Formulário
function verificarFormulario() {
    const nomePreenchido = nomeInput.value.trim() !== "";
    const servicoSelecionado = servicoSelect.value !== "";
    const horarioEscolhido = horarioSelecionado !== null;

    btnConfirmar.disabled = !(nomePreenchido && servicoSelecionado && horarioEscolhido);
}


// 6. Enviar para o WhatsApp
function enviarWhatsApp(event) {
    event.preventDefault(); 
    
    if (!dataSelecionada || !horarioSelecionado) {
        alert("Por favor, selecione um dia e horário.");
        return;
    }

    const nome = nomeInput.value.trim();
    const servico = servicoSelect.value;
    
    // Obtém o nome do dia e dia do mês para a mensagem
    const dataDisplay = document.querySelector('.btn-dia.selecionado-dia').innerText.replace('\n', ' ');


    // Monta a mensagem para o WhatsApp
    const mensagem = `
*Olá! Gostaria de agendar um serviço na Barbearia.*
*Nome:* ${nome}
*Serviço:* ${servico}
*Data Desejada:* ${dataDisplay} (Data ISO: ${dataSelecionada})
*Horário:* ${horarioSelecionado}
*Por favor, confirme a disponibilidade!*
    `.trim();

    const mensagemCodificada = encodeURIComponent(mensagem);
    const urlFinal = `${URL_WHATSAPP}${CELULAR_PROPRIETARIO}&text=${mensagemCodificada}`;

    alert(`Você será redirecionado para o WhatsApp para confirmar o agendamento de ${servico} com ${nome} no dia ${dataDisplay} às ${horarioSelecionado}.`);
    window.open(urlFinal, '_blank');
}


// 7. Inicialização
function init() {
    gerarDias();
    formAgendamento.addEventListener('submit', enviarWhatsApp);
    nomeInput.addEventListener('input', verificarFormulario);
    servicoSelect.addEventListener('change', verificarFormulario);
    btnConfirmar.disabled = true; 
}

// Executa a inicialização
init();
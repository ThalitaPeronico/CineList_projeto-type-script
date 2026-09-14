import validator from 'validator';
import inquirer from 'inquirer';
import { gerarHash, verificarHash } from "./src/auth.ts";
import { inserirUsuarios, obterUsuarios, inserirCine, obterCine, obterCinePorId, atualizarCine, excluirCine } from "./src/db/conexao.ts";
import { encerrarTerminal, escreva, leia, leiaSenha, leiaSimOuNao } from "./src/entrada.ts";
import type { Usuarios } from "./src/tipo.ts";
import type { Cine } from './src/tipo.ts';


//sistema de login/cadastro
async function fazerLogin() {
    const username: string = await leia("Usuario: ");
    const senha: string = await leiaSenha("Senha: ");

    const usuario = obterUsuarios(username);
    if(usuario === undefined) {
        escreva("Usuário e/ou senha incorretos");
        return undefined;
    }

    if(!await verificarHash(senha, usuario.senha)) {
        escreva("Usuário e/ou senha incorretos");
        return undefined;
    }

    return usuario;
}

async function cadastrar() {
    // cadastro
    escreva("Criando nova conta...");
    const nome: string = await leia("Nome:");

    const username: string = await leia("Nome de usuário:");
    if(!validator.isAlphanumeric(username)) {
        escreva("Nome de usuário inválido! deve conter apenas letras ou números");
        return undefined;
    }

    const existe = obterUsuarios(username);
    if(existe !== undefined) {
        escreva("Usuário com esse username já existe!");
        return undefined;
    }

    const senha1: string = await leiaSenha("Senha:");
    const senha2: string = await leiaSenha("Senha (novamente):");

    if(senha1 !== senha2) {
        escreva("Senhas não correspondem!");
        return undefined;
    }
    const forcaSenha = validator.isStrongPassword(senha1, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 0, 
        minSymbols: 0,
        pointsForContainingNumber: 10,
        pointsForContainingLower: 13,
        pointsForContainingUpper: 17,
        pointsForContainingSymbol: 20,
        returnScore: true
    })
    if(forcaSenha < 50) {
        escreva(`Senha muito fraca! ${forcaSenha}/50`);
        return undefined;
    }

    inserirUsuarios({
        nome: nome,
        username: username,
        senha: await gerarHash(senha1)
    });

    const usuario = obterUsuarios(username);
    return usuario;
}

//conta
let possuiConta = await leiaSimOuNao("Você já possui uma conta?");

let usuario: Usuarios | undefined;
while(usuario === undefined) {
    if(possuiConta) {
        for(let tentativas = 0; tentativas < 3; tentativas++) {
            usuario = await fazerLogin();
            if(usuario !== undefined) break;
        }
        if(usuario === undefined) {
            escreva("Limite de tentativas incorretas!");
            process.exit(1);
        }
    } else {
        usuario = await cadastrar();
    }
}

//PARTE DO CINE
//adicionar filme/serie
async function adicionarFilme(usuarioId: number) {
    const titulo: string = await leia("Título: ");

    const { tipo } = await inquirer.prompt([{
        type: 'select',
        name: 'tipo',
        message: 'Tipo:',
        choices: [
            { name: "Filme", value: "filme" },
            { name: "Série", value: "serie" },
        ]
    }]);

    const genero: string = await leia("Gênero: ");

    const { status } = await inquirer.prompt([{
        type: 'select',
        name: 'status',
        message: 'Status:',
        choices: [
            { name: "Para assistir", value: "para_assistir" },
            { name: "Assistido", value: "assistido" },
        ]
    }]);

    let avaliacao: number | undefined = undefined;
    if (status === "assistido") {
        const { nota } = await inquirer.prompt([{
            type: 'number',
            name: 'nota',
            message: 'Qual sua avaliação (0 a 10)?',
        }]);
        avaliacao = nota;
    }

    const observacao: string = await leia("Alguma observação? (deixe em branco se não tiver): ");

    inserirCine({
        titulo: titulo,
        tipo: tipo,
        genero: genero,
        status: status,
        avaliacao: avaliacao,
        observacao: observacao === "" ? undefined : observacao,
        usuarioID: usuarioId
    });

    escreva("");
    escreva("Filme/série adicionado com sucesso!");
    escreva("");
}


//atualizar dados
async function editarCampos(id: number) {
    let editando = true;

    while (editando) {
        const filme = obterCinePorId(id);
        if (filme === undefined) {
            escreva("Item não encontrado.");
            return;
        }

        const { campo } = await inquirer.prompt([{
            type: 'select',
            name: 'campo',
            message: `Editando "${filme.titulo}" — qual dado deseja mudar?`,
            choices: [
                { name: "Título", value: "titulo" },
                { name: "Tipo", value: "tipo" },
                { name: "Gênero", value: "genero" },
                { name: "Status", value: "status" },
                { name: "Avaliação", value: "avaliacao" },
                { name: "Observação", value: "observacao" },
                { name: "Voltar ao menu principal", value: "voltar" },
            ]
        }]);

        if (campo === "voltar") {
            editando = false;
            continue;
        }

        if (campo === "titulo") {
            const novoTitulo: string = await leia("Novo título: ");
            atualizarCine(id, { ...filme, titulo: novoTitulo });
        } else if (campo === "tipo")     
        {
            const { novoTipo } = await inquirer.prompt([{
                type: 'select', name: 'novoTipo', message: 'Novo tipo:',
                choices: [{ name: "Filme", value: "filme" }, { name: "Série", value: "serie" }]
            }]);
            atualizarCine(id, { ...filme, tipo: novoTipo });
        } else if (campo === "genero") {
            const novoGenero: string = await leia("Novo gênero: ");
            atualizarCine(id, { ...filme, genero: novoGenero });
        } else if (campo === "status") {
            const { novoStatus } = await inquirer.prompt([{
                type: 'select', name: 'novoStatus', message: 'Novo status:',
                choices: [{ name: "Para assistir", value: "para_assistir" }, { name: "Assistido", value: "assistido" }]
            }]);
            atualizarCine(id, { ...filme, status: novoStatus });
        } else if (campo === "avaliacao") {
            const { novaNota } = await inquirer.prompt([{
                type: 'number', name: 'novaNota', message: 'Nova avaliação (0 a 10):'
            }]);
            atualizarCine(id, { ...filme, avaliacao: novaNota });
        } else if (campo === "observacao") {
            const novaObs: string = await leia("Nova observação: ");
            atualizarCine(id, { ...filme, observacao: novaObs });
        }

        escreva("Atualizado com sucesso!");
        escreva("");
    }
}


//continuação
async function editarFilme(usuarioId: number) {
    const filmes = obterCine(usuarioId);

    if (filmes.length === 0) {
        escreva("");
        escreva("Você ainda não tem nada cadastrado.");
        escreva("");
        return;
    }

    const opcoes = filmes.map(filme => ({
        name: `${filme.titulo} (id: ${filme.id})`,
        value: filme.id
    }));
    opcoes.push({ name: "Voltar ao menu principal", value: -1 });

    const { idEscolhido } = await inquirer.prompt([{
        type: 'select',
        name: 'idEscolhido',
        message: 'Qual item deseja editar?',
        choices: opcoes,
        pageSize: 20 
    }]);

    if (idEscolhido === -1) {
        return;
    }

    await editarCampos(idEscolhido);
}



//excluir dados
async function excluirFilme(usuarioId: number) {
    const filmes = obterCine(usuarioId);

    if (filmes.length === 0) {
        escreva("");
        escreva("Você ainda não tem nada cadastrado.");
        escreva("");
        return;
    }

    const opcoes = filmes.map(filme => ({
        name: `${filme.titulo} (${filme.status})`,
        value: filme.id
    }));
    opcoes.push({ name: "Voltar ao menu principal", value: -1 });

    const { idEscolhido } = await inquirer.prompt([{
        type: 'select',
        name: 'idEscolhido',
        message: 'Qual item deseja excluir?',
        choices: opcoes,
        pageSize: 20
    }]);

    if (idEscolhido === -1) {
        return;
    }

    const filme = obterCinePorId(idEscolhido);

    const confirmou = await leiaSimOuNao(`Tem certeza que deseja excluir "${filme?.titulo}"?`);
    if (!confirmou) {
        escreva("");
        escreva("Cancelado.");
        escreva("");
        return;
    }

    excluirCine(idEscolhido);
    escreva("");
    escreva("Excluído com sucesso!");
    escreva("");
}



//parte da funcionalidade
async function verLista(usuarioId: number) {
    const filmes = obterCine(usuarioId);

    if (filmes.length === 0) {
        escreva("");
        escreva("Você ainda não tem nada cadastrado.");
        escreva("");
        return;
    }

    const opcoes = filmes.map(filme => ({
        name: `${filme.titulo} (${filme.status})`,
        value: filme.id
    }));
    opcoes.push({ name: "Voltar ao menu principal", value: -1 });

    const { idEscolhido } = await inquirer.prompt([{
        type: 'select',
        name: 'idEscolhido',
        message: 'Escolha um para ver em detalhes:',
        choices: opcoes,
        pageSize: 20
    }]);

    if (idEscolhido === -1) {
        return;
    }

    const filme = obterCinePorId(idEscolhido);
    if (filme === undefined) {
        escreva("Item não encontrado.");
        return;
    }

    escreva("");
    escreva("Título: ", filme.titulo);
    escreva("Tipo: ", filme.tipo);
    escreva("Gênero: ", filme.genero);
    escreva("Status: ", filme.status);
    escreva("Avaliação: ", filme.avaliacao ?? "sem avaliação");
    escreva("Observação: ", filme.observacao ?? "sem observação");
    escreva("");
}





//menu principal
async function menuPrincipal(usuarioId: number) {
    let sair = false;

    while (!sair) {
        const { opcao } = await inquirer.prompt([{
            type: 'select',
            name: 'opcao',
            message: 'O que deseja fazer?',
            choices: [
                { name: "Adicionar filme/série", value: "adicionar" },
                { name: "Ver minha lista", value: "ver" },
                { name: "Editar filme/série", value: "editar" },
                { name: "Excluir filme/série", value: "excluir" },
                { name: "Sair", value: "sair" },
]
        }]);

        if (opcao === "adicionar") {
            await adicionarFilme(usuarioId);
        } else if (opcao === "ver") {
            await verLista(usuarioId);
        } else if (opcao === "editar") {
            await editarFilme(usuarioId);
        } else if (opcao === "excluir") {
            await excluirFilme(usuarioId);
        } else {
            sair = true;
        }
    }
}

escreva(`
|    Olá ${usuario.nome}, seja bem-vindo(a)!
`);

await menuPrincipal(usuario.id);


encerrarTerminal();
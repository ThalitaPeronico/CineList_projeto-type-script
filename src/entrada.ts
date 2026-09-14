import inquirer from 'inquirer';

export function escreva(...valores: unknown[]) {
    for(let valor of valores) {
        process.stdout.write(String(valor));
    }
    process.stdout.write("\n");
}

export async function leiaSimOuNao(message: string) {
    const resposta = await inquirer.prompt([{
        type: 'select',
        name: 'escolha',
        message: message,
        choices: [
            { name: "Sim", value: "s" },
            { name: "Não", value: "n" },
        ]
    }]);

    return resposta.escolha === "s";
}

export async function leia(message: string) {
    const resposta = await inquirer.prompt([{
        type: 'input',
        name: 'valor',
        message: message
    }]);

    return resposta.valor;
}

export async function leiaSenha(message: string) {
    const resposta = await inquirer.prompt([{
        type: 'password',
        name: 'senha',
        message: message,
        mask: '*',
    }]);

    return resposta.senha;
}

export function encerrarTerminal() {

}
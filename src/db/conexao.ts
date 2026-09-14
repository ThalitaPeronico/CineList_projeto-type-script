import { DatabaseSync } from 'node:sqlite';
import type { Usuarios } from '../tipo.ts';
import type { Cine } from '../tipo.ts';

const banco = new DatabaseSync('banco.db');


//parte do usuario
banco.exec(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL
)`);

const queryObterUsuarios = banco.prepare(`
    SELECT * FROM usuarios WHERE username = ?
`);

export function obterUsuarios(username: string): Usuarios | undefined {
    const resultado = queryObterUsuarios.get(username);
    if(resultado === undefined) {
        return undefined;
    }

    return {
        id: resultado["id"] as number,
        username: resultado["username"] as string,
        nome: resultado["nome"] as string,
        senha: resultado["senha"] as string
    };
}

const queryInserirUsuarios = banco.prepare(`
    INSERT INTO usuarios(username, nome, senha)
    VALUES(?, ?, ?)
`);

export function inserirUsuarios(dados: Omit<Usuarios, "id">) {
    queryInserirUsuarios.run(dados.username, dados.nome, dados.senha);
}

//parte do Cine
banco.exec(`CREATE TABLE IF NOT EXISTS cine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(6) NOT NULL,
    genero VARCHAR(255) NOT NULL,
    status VARCHAR(45) NOT NULL,
    avaliacao INTEGER,
    observacao varchar(255),
    usuarioID INTEGER, 
    FOREIGN KEY (usuarioID) REFERENCES usuarios(id)
)`);


const queryObterCine = banco.prepare(`
    SELECT * FROM cine WHERE usuarioID = ?
`);

export function obterCine(usuarioID: number): Cine[] {
    const resultado = queryObterCine.all(usuarioID);
     return resultado.map(resultado => ({
        id: resultado["id"] as number,
        titulo: resultado["titulo"] as string,
        tipo: resultado["tipo"] as "filme" | "serie",
        genero: resultado["genero"] as string,
        status: resultado["status"] as "para_assistir" | "assistido",
        avaliacao: resultado["avaliacao"] as number | undefined,
        observacao: resultado["observacao"] as string | undefined,
        usuarioID: resultado["usuarioID"] as number
    }));
}


//inserir
const queryInserirCine = banco.prepare(`
    INSERT INTO cine(titulo, tipo, genero, status, avaliacao, observacao, usuarioID)
    VALUES(?, ?, ?, ?, ?, ?, ?)
`);

export function inserirCine(dados: Omit<Cine, "id">) {
    queryInserirCine.run(dados.titulo, dados.tipo, dados.genero, 
    dados.status, dados.avaliacao ?? null, dados.observacao ?? null, dados.usuarioID);
}


//obter
const queryObterCinePorId = banco.prepare(`
    SELECT * FROM cine WHERE id = ?
`);

export function obterCinePorId(id: number): Cine | undefined {
    const resultado = queryObterCinePorId.get(id);
    if (resultado === undefined) {
        return undefined;
    }

    return {
        id: resultado["id"] as number,
        titulo: resultado["titulo"] as string,
        tipo: resultado["tipo"] as "filme" | "serie",
        genero: resultado["genero"] as string,
        status: resultado["status"] as "para_assistir" | "assistido",
        avaliacao: resultado["avaliacao"] as number | undefined,
        observacao: resultado["observacao"] as string | undefined,
        usuarioID: resultado["usuarioID"] as number
    };
}


//atualizar
const queryAtualizarCine = banco.prepare(`
    UPDATE cine
    SET titulo = ?, tipo = ?, genero = ?, status = ?, avaliacao = ?, observacao = ?
    WHERE id = ?
`);

export function atualizarCine(id: number, dados: Omit<Cine, "id" | "usuarioID">) {
    queryAtualizarCine.run(
        dados.titulo, dados.tipo, dados.genero, dados.status,
        dados.avaliacao ?? null, dados.observacao ?? null, id
    );
}



//excluir
const queryExcluirCine = banco.prepare(`
    DELETE FROM cine WHERE id = ?
`);

export function excluirCine(id: number) {
    queryExcluirCine.run(id);
}

export interface Usuarios {
    id: number,
    username: string,
    nome: string,
    senha: string
}

export interface Cine {
    id: number,
    titulo: string,
    tipo: "filme" | "serie",
    genero: string,
    status: "para_assistir" | "assistido",
    avaliacao?: number | undefined,
    observacao?: string | undefined,
    usuarioID: number
}
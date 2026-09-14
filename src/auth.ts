import bcrypt from "bcryptjs";

export async function gerarHash(senha: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);
    return hash;
}

export async function verificarHash(senha: string, hash: string) {
    return await bcrypt.compare(senha, hash);
}
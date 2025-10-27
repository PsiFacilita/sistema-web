/**
 * Helper para validação e formatação de CPF (versão frontend baseada no CPFHelper.php)
 */
export class CPFHelper {
    /**
     * Valida um CPF brasileiro
     *
     * @param cpf string
     * @returns boolean
     */
    static validaCPF(cpf: string): boolean {
        // Extrai somente os números
        cpf = cpf.replace(/[^0-9]/g, '');
         
        // Verifica se foi informado todos os digitos corretamente
        if (cpf.length != 11) {
            return false;
        }

        // Verifica se foi informada uma sequência de digitos repetidos. Ex: 111.111.111-11
        if (/(\d)\1{10}/.test(cpf)) {
            return false;
        }

        // Faz o calculo para validar o CPF
        for (let t = 9; t < 11; t++) {
            let d = 0;
            for (let c = 0; c < t; c++) {
                d += parseInt(cpf[c]) * ((t + 1) - c);
            }
            d = ((10 * d) % 11) % 10;
            if (parseInt(cpf[t]) != d) {
                return false;
            }
        }
        return true;
    }

    /**
     * Normaliza um CPF removendo caracteres especiais
     *
     * @param cpf string
     * @returns string
     */
    static normalize(cpf: string): string {
        return cpf.replace(/[^0-9]/is, '');
    }

    /**
     * Formata um CPF para exibição (XXX.XXX.XXX-XX)
     *
     * @param cpf string
     * @returns string | null
     */
    static format(cpf: string): string | null {
        cpf = this.normalize(cpf);
        
        if (cpf.length !== 11) {
            return null;
        }
        
        return cpf.substr(0, 3) + '.' + 
               cpf.substr(3, 3) + '.' + 
               cpf.substr(6, 3) + '-' + 
               cpf.substr(9, 2);
    }

    /**
     * Valida e formata um CPF
     *
     * @param cpf string
     * @returns object
     */
    static validateAndFormat(cpf: string): { valid: boolean; formatted: string | null; normalized: string; original: string } {
        const normalized = this.normalize(cpf);
        const isValid = this.validaCPF(cpf);
        const formatted = isValid ? this.format(cpf) : null;

        return {
            valid: isValid,
            formatted: formatted,
            normalized: normalized,
            original: cpf
        };
    }
}
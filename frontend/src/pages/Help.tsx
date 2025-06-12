import React, { useState } from 'react';


type Manual = {
    id: number;
    title: string;
    description: string;
    url: string;
};

const manuals: Manual[] = [
    {
        id: 1,
        title: 'Manual do Usuário',
        description: 'Guia completo para utilização do sistema.',
        url: '/manuals/manual-usuario.pdf',
    },
    {
        id: 2,
        title: 'Manual do Administrador',
        description: 'Instruções para administração do sistema.',
        url: '/manuals/manual-administrador.pdf',
    },
];

const Help: React.FC = () => {
    const [selectedManual, setSelectedManual] = useState<Manual | null>(null);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-center text-[#4F644D] mb-8">
                Manuais
            </h1>

            {!selectedManual && (
                <ul className="grid gap-6 md:grid-cols-2">
                    {manuals.map((manual) => (
                        <li
                            key={manual.id}
                            className="border border-gray-300 rounded-lg p-6 bg-[#F9F9F9] hover:bg-[#F0F0F0] shadow transition cursor-pointer"
                            onClick={() => setSelectedManual(manual)}
                        >
                            <h2 className="text-xl font-semibold text-[#4F644D] mb-2">
                                {manual.title}
                            </h2>
                            <p className="text-gray-600">{manual.description}</p>
                        </li>
                    ))}
                </ul>
            )}

            {selectedManual && (
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold text-[#4F644D] mb-4">
                        {selectedManual.title}
                    </h2>
                    <iframe
                        src={selectedManual.url}
                        title={selectedManual.title}
                        width="100%"
                        height="600px"
                        className="border border-gray-300 rounded-lg"
                    />
                    <button
    onClick={() => setSelectedManual(null)}
    className="mt-4 bg-[#4F644D] hover:bg-[#3F513F] text-white py-2 px-4 rounded transition"
>
    Voltar
</button>
</div>
            )}
        </div>
    );
}
export default Help;
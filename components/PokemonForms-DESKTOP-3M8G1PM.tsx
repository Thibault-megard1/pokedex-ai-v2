"use client";

import Image from "next/image";
import Link from "next/link";
import type { PokemonForm } from "@/lib/types";
import { typeColors } from "@/lib/typeStyle";
import { getDisplayName } from "@/lib/pokemonNames.utils";

interface PokemonFormsProps {
  forms: PokemonForm[];
  pokemonName: string;
}

export default function PokemonForms({ forms, pokemonName }: PokemonFormsProps) {
  if (!forms || forms.length === 0) {
    return null;
  }

  // Grouper les formes par catégorie
  const megaForms = forms.filter(f => f.isMega);
  const gmaxForms = forms.filter(f => f.isGmax);
  const regionalForms = forms.filter(f => f.isRegionalForm);
  const otherForms = forms.filter(f => !f.isMega && !f.isGmax && !f.isRegionalForm);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Formes alternatives</h3>

      {/* Méga-Évolutions */}
      {megaForms.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-purple-600 mb-3">Méga-Évolutions</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {megaForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gigamax */}
      {gmaxForms.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-red-600 mb-3">Gigamax</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gmaxForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
              />
            ))}
          </div>
        </div>
      )}

      {/* Formes régionales */}
      {regionalForms.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-blue-600 mb-3">Formes régionales</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regionalForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
              />
            ))}
          </div>
        </div>
      )}

      {/* Autres formes */}
      {otherForms.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-600 mb-3">Autres formes</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FormCardProps {
  form: PokemonForm;
}

function FormCard({ form }: FormCardProps) {
  const displayName = getDisplayName(form.name, form.frenchName);
  
  return (
    <Link
      href={`/pokemon/${form.name}`}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer border-2 border-transparent hover:border-blue-400 block"
    >
      {form.sprite && (
        <div className="flex justify-center mb-2">
          <Image
            src={form.sprite}
            alt={displayName}
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
      )}
      <p className="text-sm font-semibold text-center text-gray-800">
        {form.frenchName || form.formName}
      </p>
      <div className="flex gap-1 mt-2 justify-center flex-wrap">
        {form.types.map((type) => (
          <span
            key={type}
            className="px-2 py-0.5 rounded text-white text-xs capitalize"
            style={{ backgroundColor: typeColors[type] || "#999" }}
          >
            {type}
          </span>
        ))}
      </div>
    </Link>
  );
}

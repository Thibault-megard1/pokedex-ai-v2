"use client";

import Image from "next/image";
import Link from "next/link";
import type { PokemonForm } from "@/lib/types";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";
import { getDisplayName } from "@/lib/pokemonNames.utils";

interface PokemonFormsProps {
  forms: PokemonForm[];
  pokemonName: string;
}

export default function PokemonForms({ forms, pokemonName }: PokemonFormsProps) {
  // Grouper les formes par catégorie
  const megaForms = forms.filter(f => f.isMega);
  const gmaxForms = forms.filter(f => f.isGmax);
  const regionalForms = forms.filter(f => f.isRegionalForm && !f.isMega && !f.isGmax);
  const otherForms = forms.filter(f => !f.isRegionalForm && !f.isMega && !f.isGmax);

  // Si aucune forme à afficher
  if (megaForms.length === 0 && gmaxForms.length === 0 && regionalForms.length === 0 && otherForms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Formes alternatives</h3>

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
          <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3">Autres formes</h4>
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500 block"
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
      <p className="text-sm font-semibold text-center text-gray-800 dark:text-gray-100">
        {form.frenchName || form.formName}
      </p>
      {form.requiredItem && (
        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">Objet: {form.requiredItem}</p>
      )}
      <div className="flex gap-1 mt-2 justify-center flex-wrap">
        {form.types.map((type) => (
          <TypeBadge key={type} kind={type as BadgeKey} width={85} />
        ))}
      </div>
    </Link>
  );
}

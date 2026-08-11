// Banderas como imagen (flagcdn.com), no emoji: Windows no trae los glifos de
// bandera en su fuente de emoji y muestra el código de país en texto plano en
// vez de la bandera — esto se ve igual en cualquier sistema operativo.
export default function CountryFlag({ code }: { code: string }) {
  if (!code || code.length !== 2 || code === "XX") {
    return (
      <span aria-hidden="true" className="inline-block w-4 text-center">
        🌐
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      width={16}
      height={12}
      loading="lazy"
      className="inline-block h-3 w-4 rounded-[2px] align-middle ring-1 ring-black/10"
    />
  );
}

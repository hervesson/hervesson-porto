import fs from "fs"
import path from "path"

const logosDir = path.join(process.cwd(), "public/img/clientes")

function getLogos(): string[] {
  if (!fs.existsSync(logosDir)) return []
  return fs
    .readdirSync(logosDir)
    .filter((file) => /\.(png|svg|webp|jpe?g)$/i.test(file))
    .sort()
}

export function Clients() {
  const logos = getLogos()
  if (logos.length === 0) return null

  // repete a lista até a faixa ficar larga o bastante pro loop ser contínuo
  const repeats = Math.max(2, Math.ceil(10 / logos.length))
  const strip = Array.from({ length: repeats }, () => logos).flat()

  return (
    <section
      id="clientes"
      className="border-y border-black/5 dark:border-white/5 py-12"
      aria-label="Empresas atendidas"
    >
      <p className="text-center text-sm font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-8">
        Empresas que já contaram com meu trabalho
      </p>
      <div className="relative overflow-hidden max-w-7xl mx-auto [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-16 pr-16 hover:[animation-play-state:paused]">
          {[0, 1].map((half) => (
            <div key={half} className="flex items-center gap-16" aria-hidden={half === 1}>
              {strip.map((logo, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={`${half}-${i}`}
                  src={`/img/clientes/${logo}`}
                  alt={logo.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")}
                  className="h-10 md:h-12 w-auto object-contain"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

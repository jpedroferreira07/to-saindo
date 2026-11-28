import { Suspense } from "react";
import { App } from "@/components/App";

/** Esqueleto mínimo enquanto o navegador lê a URL (filtros e aba ficam nela). */
function Esqueleto() {
  return (
    <div className="app">
      <header className="cab">
        <span className="marca">TÔ SAINDO</span>
      </header>
      <p className="apoio" style={{ padding: 16 }} role="status">
        Carregando o app…
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <App />
    </Suspense>
  );
}

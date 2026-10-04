import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // Strona „Zostań testerem” została usunięta — zgłoszenie testera jest na karcie każdej innowacji.
      // Stare linki trafiają do panelu testera, który to wyjaśnia. Tymczasowe (307), żeby można było wrócić.
      { source: "/testerzy", destination: "/testerzy/panel", permanent: false },
    ];
  },
};

export default nextConfig;

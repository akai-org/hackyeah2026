"""Rozgrzewa cache tłumaczeń (translations.db) przed demo: odpytuje API w każdym języku.

Uruchom przy działającym backendzie:
    python -m data.warm_translations                # http://localhost:8000, en + uk
    python -m data.warm_translations --base http://localhost:8123 --langs en

Każdy tekst tłumaczy się raz; kolejne uruchomienia trwają sekundy.
"""

import argparse
import asyncio
import time

import httpx

from data.challenges import POWIATY

ADMIN = {"X-Dev-Admin": "true"}


def paths(innovation_ids: list[int]) -> list[tuple[str, dict]]:
    out: list[tuple[str, dict]] = [
        ("/api/innovations?limit=200", {}),
        ("/api/innovations?limit=200&include_archived=true", {}),
        ("/api/challenges", {}),
        ("/api/stats/malopolska", {}),
        ("/api/innovation-gap", {}),
        ("/api/forum", {}),
        ("/api/grants", {}),
        ("/api/resources?type=education&limit=100", {}),
        ("/api/areas", {}),
        ("/api/admin/innovations", ADMIN),
        ("/api/admin/forum", ADMIN),
        ("/api/admin/needs", ADMIN),
        ("/api/admin/needs/trends", ADMIN),
        ("/api/admin/search-trends", ADMIN),
        ("/api/admin/analytics/innovations?days=14", ADMIN),
        ("/api/admin/analytics/funnel?days=14", ADMIN),
        ("/api/admin/test-requests", ADMIN),
        ("/api/admin/ideas", ADMIN),
    ]
    out += [(f"/api/innovations/{i}", {}) for i in innovation_ids]
    out += [(f"/api/forum?innovation_id={i}", {}) for i in innovation_ids]
    out += [(f"/api/gmina-pulse/{p}", {}) for p in POWIATY]
    return out


async def warm(base: str, lang: str, concurrency: int) -> None:
    async with httpx.AsyncClient(base_url=base, timeout=300) as client:
        listing = (await client.get("/api/innovations?limit=200&include_archived=true")).json()["data"]
        ids = [item["id"] for item in listing.get("innovations", [])]
        jobs = paths(ids)
        semaphore = asyncio.Semaphore(concurrency)
        done = 0
        started = time.monotonic()

        async def fetch(path: str, headers: dict) -> None:
            nonlocal done
            async with semaphore:
                try:
                    response = await client.get(path, headers={"X-Lang": lang, **headers})
                    status = response.status_code
                except httpx.HTTPError as error:
                    status = type(error).__name__
                done += 1
                if done % 20 == 0 or status != 200:
                    print(f"[{lang}] {done}/{len(jobs)} {path} → {status}", flush=True)

        await asyncio.gather(*(fetch(path, headers) for path, headers in jobs))
        print(f"[{lang}] gotowe: {len(jobs)} zapytań w {time.monotonic() - started:.0f} s", flush=True)


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8000")
    parser.add_argument("--langs", nargs="+", default=["en", "uk"])
    parser.add_argument("--concurrency", type=int, default=4)
    args = parser.parse_args()
    for lang in args.langs:
        await warm(args.base, lang, args.concurrency)


if __name__ == "__main__":
    asyncio.run(main())

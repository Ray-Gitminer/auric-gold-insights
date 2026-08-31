from __future__ import annotations

import hashlib
import json
import os
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote

import feedparser
from dotenv import load_dotenv
from icalendar import Calendar
from supabase import create_client

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "connector" / ".env")

BLS_CALENDAR_URL = "https://www.bls.gov/schedule/news_release/bls.ics"
RSS_SOURCES = (
    ("U.S. Bureau of Labor Statistics", "https://www.bls.gov/feed/bls_latest.rss"),
    ("Federal Reserve", "https://www.federalreserve.gov/feeds/press_all.xml"),
)
VERIFIED_FALLBACK_EVENTS = (
    (
        "bls-jolts-2026-07",
        "Job Openings and Labor Turnover Survey — July 2026",
        "2026-09-01T14:00:00+00:00",
        3,
        "https://www.bls.gov/schedule/news_release/jolts.htm",
    ),
    (
        "bls-productivity-2026-q2-r",
        "Productivity and Costs (Revised) — Q2 2026",
        "2026-09-03T12:30:00+00:00",
        2,
        "https://www.bls.gov/schedule/2026/09_sched.htm",
    ),
    (
        "bls-empsit-2026-08",
        "Employment Situation (Nonfarm Payrolls) — August 2026",
        "2026-09-04T12:30:00+00:00",
        3,
        "https://www.bls.gov/schedule/news_release/empsit.htm",
    ),
)
HIGH_IMPACT_TERMS = (
    "employment situation",
    "job openings and labor turnover",
    "consumer price index",
    "producer price index",
)
GOLD_RELEVANT_TERMS = (
    "employment",
    "job",
    "inflation",
    "consumer price",
    "producer price",
    "interest rate",
    "monetary policy",
    "fomc",
    "federal reserve",
    "productivity",
    "earnings",
)


def fetch_bytes(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "AURIQ-NewsCollector/0.1 contact=local"})
    with urlopen(request, timeout=30) as response:
        return response.read()


def optional_text(value) -> str | None:
    return None if value in (None, "") else str(value)


def sync_trading_economics_calendar(db, api_key: str) -> int:
    today = datetime.now(UTC)
    start = (today - timedelta(days=7)).date().isoformat()
    end = (today + timedelta(days=45)).date().isoformat()
    endpoint = (
        "https://api.tradingeconomics.com/calendar/country/"
        f"united%20states/{start}/{end}?c={quote(api_key, safe=':')}&f=json"
    )
    payload = json.loads(fetch_bytes(endpoint))
    rows = []
    for item in payload:
        title = str(item.get("Event") or item.get("Category") or "").strip()
        if not title:
            continue
        importance = int(item.get("Importance") or 1)
        if importance < 2 and not any(term in title.lower() for term in GOLD_RELEVANT_TERMS):
            continue
        scheduled = datetime.fromisoformat(str(item["Date"]).replace("Z", "+00:00"))
        if scheduled.tzinfo is None:
            scheduled = scheduled.replace(tzinfo=UTC)
        actual = optional_text(item.get("Actual"))
        external_id = optional_text(item.get("CalendarId") or item.get("CalendarID"))
        external_id = external_id or hashlib.sha256(
            f"{title}|{scheduled.isoformat()}".encode()
        ).hexdigest()
        rows.append(
            {
                "external_id": external_id,
                "provider": "Trading Economics",
                "country": "United States",
                "currency": str(item.get("Currency") or "USD"),
                "event_name": title,
                "category": item.get("Category"),
                "importance": max(1, min(3, importance)),
                "scheduled_at": scheduled.astimezone(UTC).isoformat(),
                "actual": actual,
                "forecast": optional_text(item.get("Forecast")),
                "previous": optional_text(item.get("Previous")),
                "revised": optional_text(item.get("Revised")),
                "unit": optional_text(item.get("Unit")),
                "source_name": str(item.get("Source") or "Trading Economics"),
                "source_url": str(item.get("SourceURL") or item.get("URL") or "https://tradingeconomics.com/calendar"),
                "status": "released" if actual not in (None, "") else "scheduled",
                "updated_at": today.isoformat(),
            }
        )
    if rows:
        db.table("economic_events").upsert(rows, on_conflict="provider,external_id").execute()
    return len(rows)


def as_utc(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    return datetime(value.year, value.month, value.day, tzinfo=UTC)


def sync_bls_calendar(db) -> int:
    today = datetime.now(UTC)
    start = today - timedelta(days=7)
    end = today + timedelta(days=45)
    rows = []
    try:
        calendar = Calendar.from_ical(fetch_bytes(BLS_CALENDAR_URL))
        source_events = [
            (
                str(component.get("uid", "")).strip(),
                str(component.get("summary", "")).strip(),
                as_utc(component.decoded("dtstart")),
                None,
            )
            for component in calendar.walk("VEVENT")
        ]
    except Exception as error:
        print(f"BLS_CALENDAR_FALLBACK | {type(error).__name__}")
        source_events = [
            (external_id, title, datetime.fromisoformat(timestamp), (importance, source_url))
            for external_id, title, timestamp, importance, source_url in VERIFIED_FALLBACK_EVENTS
        ]

    for uid, title, scheduled, fallback in source_events:
        if not (start <= scheduled <= end):
            continue
        title_lower = title.lower()
        if not any(term in title_lower for term in GOLD_RELEVANT_TERMS):
            continue
        uid = uid or hashlib.sha256(f"{title}|{scheduled.isoformat()}".encode()).hexdigest()
        importance = fallback[0] if fallback else (
            3 if any(term in title_lower for term in HIGH_IMPACT_TERMS) else 2
        )
        source_url = fallback[1] if fallback else BLS_CALENDAR_URL
        rows.append(
            {
                "external_id": uid,
                "provider": "BLS",
                "country": "United States",
                "currency": "USD",
                "event_name": title,
                "category": "Labour / inflation",
                "importance": importance,
                "scheduled_at": scheduled.isoformat(),
                "source_name": "U.S. Bureau of Labor Statistics",
                "source_url": source_url,
                "status": "scheduled" if scheduled > today else "released",
                "updated_at": today.isoformat(),
            }
        )
    if rows:
        db.table("economic_events").upsert(rows, on_conflict="provider,external_id").execute()
    return len(rows)


def sync_rss(db) -> int:
    rows = []
    for source_name, source_url in RSS_SOURCES:
        try:
            parsed = feedparser.parse(fetch_bytes(source_url))
        except Exception as error:
            print(f"RSS_SKIPPED | source={source_name} error={type(error).__name__}")
            continue
        for entry in parsed.entries[:30]:
            headline = str(entry.get("title", "")).strip()
            summary = str(entry.get("summary", "")).strip()
            combined = f"{headline} {summary}".lower()
            if not any(term in combined for term in GOLD_RELEVANT_TERMS):
                continue
            canonical_url = str(entry.get("link", source_url))
            published_struct = entry.get("published_parsed") or entry.get("updated_parsed")
            published_at = (
                datetime(*published_struct[:6], tzinfo=UTC)
                if published_struct
                else datetime.now(UTC)
            )
            fingerprint = hashlib.sha256(
                f"{source_name}|{headline.lower()}|{canonical_url}".encode()
            ).hexdigest()
            rows.append(
                {
                    "source_name": source_name,
                    "source_url": source_url,
                    "canonical_url": canonical_url,
                    "headline": headline,
                    "summary": summary[:4000] or None,
                    "published_at": published_at.isoformat(),
                    "fingerprint": fingerprint,
                }
            )
    if rows:
        db.table("news_items").upsert(rows, on_conflict="fingerprint").execute()
    return len(rows)


def main() -> None:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SECRET_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY are required")
    db = create_client(url, key)
    trading_economics_key = os.getenv("TRADING_ECONOMICS_API_KEY", "").strip()
    if trading_economics_key:
        event_count = sync_trading_economics_calendar(db, trading_economics_key)
        calendar_provider = "Trading Economics"
    else:
        event_count = sync_bls_calendar(db)
        calendar_provider = "BLS official schedule (forecast/actual unavailable)"
    news_count = sync_rss(db)
    print(
        "NEWS_SYNC_OK | "
        f"provider={calendar_provider} economic_events={event_count} news_items={news_count}"
    )


if __name__ == "__main__":
    main()

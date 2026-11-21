import copy
import json

import pytest
from pydantic import ValidationError

from app.knowledge import TILE_IDS, KnowledgeBase, load_knowledge, missing_tiles

VALID = {
    "organizations": [
        {
            "id": "sample-office",
            "name": "Sample Office",
            "helps_with": "Residence permits",
            "tiles": ["documents", "work"],
            "subjects": ["work-permit"],
            "address": {"street": "Musterstrasse 1", "postcode": "6000", "city": "Luzern"},
            "phone": "+41 41 000 00 00",
            "email": "info@example.ch",
            "hours": "Mo-Fr 08:00-12:00",
            "languages": ["de", "en"],
            "free": True,
            "appointment_needed": None,
            "booking_url": None,
            "interpreter": None,
            "what_to_bring": ["Passport"],
            "official_url": "https://example.ch/office",
            "coordinates": {"lat": 47.05, "lon": 8.31},
            "source_url": "https://example.ch/office/contact",
            "verified_on": "2026-11-15",
        }
    ],
    "info": [
        {
            "id": "sample-transport",
            "tiles": ["daily-life"],
            "subject": "transport",
            "summary": "Buy tickets in the app.",
            "official_url": "https://example.ch/transport",
            "source_url": "https://example.ch/transport",
            "verified_on": "2026-11-15",
        }
    ],
    "emergency": [
        {
            "id": "ambulance",
            "name": "Ambulance",
            "phone": "144",
            "description": "Medical emergencies",
            "source_url": "https://example.ch/emergency",
            "verified_on": "2026-11-15",
        }
    ],
}


def build(**changes):
    """Return a copy of VALID with fields of the first organization replaced."""
    data = copy.deepcopy(VALID)
    data["organizations"][0].update(changes)
    return data


def test_valid_sample_loads():
    kb = KnowledgeBase.model_validate(VALID)
    assert kb.organizations[0].name == "Sample Office"
    assert kb.emergency[0].phone == "144"


def test_only_core_fields_are_required():
    org = {
        "id": "minimal",
        "name": "Minimal",
        "tiles": ["work"],
        "source_url": "https://example.ch",
        "verified_on": "2026-11-15",
    }
    kb = KnowledgeBase.model_validate({"organizations": [org], "info": [], "emergency": []})
    assert kb.organizations[0].phone is None


@pytest.mark.parametrize("tiles", [[], ["jobs"], ["Work"], [" work"]])
def test_bad_tiles_are_refused(tiles):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(tiles=tiles))


@pytest.mark.parametrize(
    "url",
    [
        "http://example.ch",
        "javascript:alert(1)",
        "",
        "   ",
        " https://example.ch",
        "https://example.ch ",
        "https://exa mple.ch",
        "https://example.ch\nhttps://evil.example",
        "ftp://example.ch",
    ],
)
def test_bad_urls_are_refused(url):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(source_url=url))
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(official_url=url))


@pytest.mark.parametrize(
    "phone",
    [
        "",
        "   ",
        "call us",
        "+49 30 000 00 00",
        "+41 41 000 00",
        "+41 41 000 00 00 0",
        " +41 41 000 00 00",
        "+41 41 000 00 00\n",
        "14",
        "1444",
    ],
)
def test_bad_phones_are_refused(phone):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(phone=phone))


@pytest.mark.parametrize("phone", ["+41 41 000 00 00", "+41410000000", "+41 800 000 000", "117"])
def test_good_phones_load(phone):
    KnowledgeBase.model_validate(build(phone=phone))


@pytest.mark.parametrize("email", ["", "info", "info@", "@example.ch", "in fo@example.ch"])
def test_bad_emails_are_refused(email):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(email=email))


@pytest.mark.parametrize("item_id", ["", "Sample", "sample office", "-sample", "../sample", "a/b"])
def test_bad_ids_are_refused(item_id):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(id=item_id))


@pytest.mark.parametrize("text", ["", "   ", "\t\n"])
def test_blank_names_are_refused(text):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(name=text))


@pytest.mark.parametrize("coordinates", [{"lat": 0, "lon": 0}, {"lat": 52.5, "lon": 13.4}])
def test_coordinates_outside_switzerland_are_refused(coordinates):
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(coordinates=coordinates))


def test_unknown_field_is_refused():
    with pytest.raises(ValidationError):
        KnowledgeBase.model_validate(build(phone_number="+41 41 000 00 00"))


def test_duplicate_ids_are_refused():
    data = copy.deepcopy(VALID)
    data["info"][0]["id"] = "sample-office"
    with pytest.raises(ValidationError, match="sample-office"):
        KnowledgeBase.model_validate(data)


def test_missing_tiles_lists_tiles_without_entry():
    kb = KnowledgeBase.model_validate(VALID)
    assert missing_tiles(kb) == [
        t for t in TILE_IDS if t not in {"documents", "work", "daily-life", "urgent"}
    ]


def test_shipped_knowledge_validates_and_covers_every_tile():
    kb = load_knowledge()
    assert missing_tiles(kb) == []


def test_load_knowledge_reads_json_file(tmp_path):
    path = tmp_path / "knowledge.json"
    path.write_text(json.dumps(VALID), encoding="utf-8")
    assert load_knowledge(path).organizations[0].id == "sample-office"

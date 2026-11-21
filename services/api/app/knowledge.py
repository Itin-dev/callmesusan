"""Verified knowledge base of Lucerne organizations, info entries and emergency contacts.

The agent answers only from this data, so every entry names the page it was checked
against (`source_url`) and the date of that check (`verified_on`). A field that the
source does not show stays null instead of a guess.
"""

from collections import Counter
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

DATA_FILE = Path(__file__).parent / "data" / "knowledge.json"

# home screen tiles; must match TOPICS in apps/web/src/features/home/topics.ts
Tile = Literal[
    "work",
    "housing",
    "health",
    "language",
    "documents",
    "money",
    "children",
    "daily-life",
    "urgent",
]
TILE_IDS: tuple[str, ...] = get_args(Tile)

# bounding box of Switzerland in WGS84 degrees, so a swapped or foreign coordinate fails
SWISS_LAT_MIN, SWISS_LAT_MAX = 45.8, 47.9
SWISS_LON_MIN, SWISS_LON_MAX = 5.9, 10.6

Id = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")]
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
# https only, and no whitespace anywhere, so a pasted line break cannot smuggle a second URL
HttpsUrl = Annotated[str, StringConstraints(pattern=r"^https://[^\s/?#]+\.[^\s/?#]+[^\s]*$")]
# +41 with 9 digits (spaces allowed), or a 3-digit Swiss emergency or helpline number
Phone = Annotated[str, StringConstraints(pattern=r"^(\+41( ?\d){9}|\d{3})$")]
Email = Annotated[str, StringConstraints(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
# ISO 639 language code, for example "de" or "prs" (Dari)
Language = Annotated[str, StringConstraints(pattern=r"^[a-z]{2,3}$")]


class Entry(BaseModel):
    # refuse unknown keys, so a typo in the JSON fails the test instead of being dropped
    model_config = ConfigDict(extra="forbid", frozen=True)


class Address(Entry):
    street: Text
    postcode: Annotated[str, StringConstraints(pattern=r"^\d{4}$")]
    city: Text


class Coordinates(Entry):
    lat: float = Field(ge=SWISS_LAT_MIN, le=SWISS_LAT_MAX)
    lon: float = Field(ge=SWISS_LON_MIN, le=SWISS_LON_MAX)


class Organization(Entry):
    """A service that people are referred to (Mode 2)."""

    id: Id
    name: Text
    tiles: list[Tile] = Field(min_length=1)
    source_url: HttpsUrl
    verified_on: date
    helps_with: Text | None = None
    subjects: list[Id] = []
    address: Address | None = None
    phone: Phone | None = None
    email: Email | None = None
    hours: Text | None = None
    languages: list[Language] = []
    free: bool | None = None
    appointment_needed: bool | None = None
    booking_url: HttpsUrl | None = None
    interpreter: bool | None = None
    what_to_bring: list[Text] = []
    official_url: HttpsUrl | None = None
    coordinates: Coordinates | None = None


class InfoEntry(Entry):
    """A short answer with an official link, for questions without a referral (Mode 1)."""

    id: Id
    tiles: list[Tile] = Field(min_length=1)
    subject: Id
    summary: Text
    source_url: HttpsUrl
    verified_on: date
    official_url: HttpsUrl | None = None


class EmergencyContact(Entry):
    """A number for the urgent help tile."""

    id: Id
    name: Text
    phone: Phone
    source_url: HttpsUrl
    verified_on: date
    description: Text | None = None


class KnowledgeBase(Entry):
    organizations: list[Organization]
    info: list[InfoEntry]
    emergency: list[EmergencyContact]

    @model_validator(mode="after")
    def ids_are_unique(self) -> "KnowledgeBase":
        # ids are unique across all three lists, so an id alone names one entry
        ids = [e.id for e in (*self.organizations, *self.info, *self.emergency)]
        duplicates = sorted(i for i, n in Counter(ids).items() if n > 1)
        if duplicates:
            raise ValueError(f"duplicate ids: {', '.join(duplicates)}")
        return self


def missing_tiles(kb: KnowledgeBase) -> list[str]:
    """Return the tiles without any entry, in home screen order."""
    covered = {t for e in (*kb.organizations, *kb.info) for t in e.tiles}
    # an emergency contact always belongs to the urgent tile
    if kb.emergency:
        covered.add("urgent")
    return [t for t in TILE_IDS if t not in covered]


@lru_cache
def load_knowledge(path: Path = DATA_FILE) -> KnowledgeBase:
    return KnowledgeBase.model_validate_json(path.read_text(encoding="utf-8"))

import json

import pytest

from app.chat import build_messages, parse_reply, select_entries
from app.knowledge import load_knowledge


@pytest.fixture
def kb():
    return load_knowledge()


def org(kb, tile):
    return next(o for o in kb.organizations if tile in o.tiles)


def test_select_entries_keeps_topic_and_emergency(kb):
    selected = select_entries(kb, "housing")
    assert selected.organizations
    assert all("housing" in o.tiles for o in selected.organizations)
    assert all("housing" in i.tiles for i in selected.info)
    assert selected.emergency == kb.emergency


def test_select_entries_without_topic_keeps_everything(kb):
    assert select_entries(kb, None) == kb


def test_build_messages_injects_knowledge_and_language(kb):
    conversation = [{"role": "user", "content": "My landlord wants me out"}]
    messages = build_messages(kb, conversation, language="uk", topic="housing", persona="Be kind.")
    system = messages[0]
    assert system["role"] == "system"
    assert "Be kind." in system["content"]
    assert org(kb, "housing").id in system["content"]
    assert "uk" in system["content"]
    assert messages[1:] == conversation


def test_build_messages_leaves_out_other_topics(kb):
    other_topic = [o for o in kb.organizations if "housing" not in o.tiles]
    messages = build_messages(
        kb, [{"role": "user", "content": "hi"}], language="en", topic="housing", persona=""
    )
    assert other_topic[0].id not in messages[0]["content"]


def test_parse_reply_reads_json(kb):
    o = org(kb, "housing")
    raw = json.dumps(
        {"reply": "Go here", "mode": 2, "organization_ids": [o.id], "source_url": o.source_url}
    )
    reply = parse_reply(raw, kb)
    assert reply.reply == "Go here"
    assert reply.mode == 2
    assert reply.organization_ids == [o.id]
    assert reply.source_url == o.source_url


def test_parse_reply_accepts_code_fence(kb):
    raw = '```json\n{"reply": "Hi", "mode": 1}\n```'
    assert parse_reply(raw, kb).reply == "Hi"


def test_parse_reply_drops_unknown_ids_and_urls(kb):
    raw = json.dumps(
        {
            "reply": "x",
            "mode": 2,
            "organization_ids": ["made-up-org"],
            "source_url": "https://evil.example.com",
        }
    )
    reply = parse_reply(raw, kb)
    assert reply.organization_ids == []
    assert reply.source_url is None


def test_parse_reply_falls_back_to_plain_text(kb):
    reply = parse_reply("Just some text", kb)
    assert reply.reply == "Just some text"
    assert reply.mode == 1
    assert reply.organization_ids == []
    assert reply.source_url is None


def test_parse_reply_falls_back_on_bad_mode(kb):
    reply = parse_reply('{"reply": "Hi", "mode": 7}', kb)
    assert reply.reply == "Hi"
    assert reply.mode == 1

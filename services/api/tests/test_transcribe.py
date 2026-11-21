import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.llm import get_llm
from app.main import app
from app.scan import MAX_UPLOAD_BYTES

# file starts as browsers write them; the rest of a real recording does not matter here
WEBM = b"\x1a\x45\xdf\xa3" + b"\x00" * 64
MP4 = b"\x00\x00\x00\x20ftypM4A " + b"\x00" * 64
OGG = b"OggS" + b"\x00" * 64
WAV = b"RIFF\x24\x00\x00\x00WAVEfmt " + b"\x00" * 64


class FakeAudioLLM:
    def __init__(
        self, text: str = "How much did I spend last week?", error: Exception | None = None
    ):
        self.text = text
        self.error = error
        self.calls: list[tuple[bytes, str, str]] = []

    def complete(self, messages):
        raise AssertionError("transcription must not use the chat completion")

    def transcribe(self, audio: bytes, audio_format: str, instructions: str) -> str:
        self.calls.append((audio, audio_format, instructions))
        if self.error:
            raise self.error
        return self.text


@pytest.fixture
def client():
    yield TestClient(app)
    app.dependency_overrides.clear()


def use(fake: FakeAudioLLM, model: str = "test-transcribe-model") -> FakeAudioLLM:
    app.dependency_overrides[get_llm] = lambda: fake
    settings = Settings(
        openrouter_api_key="test",
        openrouter_transcribe_model=model,
    )
    app.dependency_overrides[get_settings] = lambda: settings
    return fake


def send(client, data: bytes = WEBM, name: str = "recording.webm", language: str | None = "en"):
    form = {} if language is None else {"language": language}
    return client.post("/api/transcribe", files={"file": (name, data, "audio/webm")}, data=form)


def test_transcribe_returns_the_text(client):
    use(FakeAudioLLM())
    response = send(client)
    assert response.status_code == 200
    assert response.json() == {"text": "How much did I spend last week?"}


def test_transcribe_trims_the_text(client):
    use(FakeAudioLLM("  Wie viel habe ich ausgegeben?\n"))
    assert send(client, language="de").json()["text"] == "Wie viel habe ich ausgegeben?"


@pytest.mark.parametrize(
    ("data", "audio_format"),
    [(WEBM, "webm"), (MP4, "mp4"), (OGG, "ogg"), (WAV, "wav")],
    ids=["webm", "mp4", "ogg", "wav"],
)
def test_transcribe_sends_the_detected_format_to_the_model(client, data, audio_format):
    fake = use(FakeAudioLLM())
    send(client, data)
    assert fake.calls[0][0] == data
    assert fake.calls[0][1] == audio_format


def test_transcribe_tells_the_model_the_language(client):
    fake = use(FakeAudioLLM())
    send(client, language="de")
    assert "German" in fake.calls[0][2]


def test_transcribe_defaults_to_english(client):
    fake = use(FakeAudioLLM())
    send(client, language=None)
    assert "English" in fake.calls[0][2]


@pytest.mark.parametrize(
    ("data", "name"),
    [
        (b"", "empty.webm"),
        (b"hello, this is text", "text.webm"),
        (b"%PDF-1.4", "doc.webm"),
        (b"\x89PNG\r\n\x1a\n" + b"\x00" * 10, "photo.webm"),
        (b" " + WEBM, "space.webm"),
        (b"RIFF\x24\x00\x00\x00AVI LIST", "video.wav"),
    ],
    ids=["empty", "text", "pdf", "png", "leading-space", "riff-not-wave"],
)
def test_transcribe_refuses_files_that_are_not_audio(client, data, name):
    fake = use(FakeAudioLLM())
    assert send(client, data, name).status_code == 415
    assert fake.calls == []


def test_transcribe_refuses_a_file_over_the_limit(client):
    fake = use(FakeAudioLLM())
    assert send(client, WEBM + b"\x00" * MAX_UPLOAD_BYTES).status_code == 413
    assert fake.calls == []


@pytest.mark.parametrize("language", ["xx", "EN", " en", "en; DROP"])
def test_transcribe_refuses_an_unknown_language(client, language):
    fake = use(FakeAudioLLM())
    assert send(client, language=language).status_code == 422
    assert fake.calls == []


def test_transcribe_treats_an_empty_language_as_english(client):
    fake = use(FakeAudioLLM())
    assert send(client, language="").status_code == 200
    assert "English" in fake.calls[0][2]


def test_transcribe_needs_the_file_field(client):
    use(FakeAudioLLM())
    response = client.post("/api/transcribe", files={"audio": ("r.webm", WEBM, "audio/webm")})
    assert response.status_code == 422


def test_transcribe_without_speech_is_422(client):
    use(FakeAudioLLM("   "))
    assert send(client).status_code == 422


def test_transcribe_reports_a_model_failure(client):
    use(FakeAudioLLM(error=RuntimeError("model down")))
    assert send(client).status_code == 502


def test_transcribe_without_a_model_setting_is_503(client):
    fake = use(FakeAudioLLM(), model="")
    response = send(client)
    assert response.status_code == 503
    assert "OPENROUTER_TRANSCRIBE_MODEL" in response.json()["detail"]
    assert fake.calls == []


def test_transcribe_model_has_no_default_in_code(monkeypatch):
    monkeypatch.delenv("OPENROUTER_TRANSCRIBE_MODEL", raising=False)
    assert Settings(_env_file=None).openrouter_transcribe_model == ""

"""Voice to text for the chat mic (docs/mvp.md, task BE-8).

The browser records a short question and uploads it. The model writes down what was said; the
text goes into the chat input, where the user checks it before sending. Nothing is stored or
logged.
"""

from app.chat import Language
from app.llm import LLM
from app.scan import MAX_UPLOAD_BYTES, ModelAnswerError, UploadError

# containers that phone and desktop browsers record with MediaRecorder; checked by file signature
# webm: Chrome and Android, mp4: Safari and iPhone, ogg: Firefox, wav: test recordings
EBML_MAGIC = b"\x1a\x45\xdf\xa3"

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "de": "German",
    "uk": "Ukrainian",
    "ru": "Russian",
    "ar": "Arabic",
}


class NoSpeechError(Exception):
    """The recording holds no words."""


def audio_format(data: bytes) -> str:
    """Container name from the file signature; raises UploadError for anything else."""
    if len(data) > MAX_UPLOAD_BYTES:
        raise UploadError(
            413, f"the recording is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"
        )
    if data.startswith(EBML_MAGIC):
        return "webm"
    # an MP4 file starts with a 4-byte box size, then the box type "ftyp"
    if data[4:8] == b"ftyp":
        return "mp4"
    if data.startswith(b"OggS"):
        return "ogg"
    if data.startswith(b"RIFF") and data[8:12] == b"WAVE":
        return "wav"
    raise UploadError(415, "send a WebM, MP4, Ogg or WAV recording")


def instructions(language: Language) -> str:
    return (
        "Write down exactly what the speaker says in this recording. The speaker probably talks"
        f" {LANGUAGE_NAMES[language]}. Answer with the spoken words only: no quotes, no comments,"
        " no translation. If nobody speaks, answer with nothing."
    )


def transcribe_audio(data: bytes, language: Language, llm: LLM) -> str:
    container = audio_format(data)
    try:
        text = llm.transcribe(data, container, instructions(language)).strip()
    except Exception as error:  # network, provider or format errors of the model call
        raise ModelAnswerError("the model could not transcribe the recording") from error
    if not text:
        raise NoSpeechError("no speech found in the recording")
    return text

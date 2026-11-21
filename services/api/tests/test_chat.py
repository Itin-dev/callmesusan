from app.chat import build_messages


def test_build_messages_adds_persona_and_language():
    conversation = [{"role": "user", "content": "Where does my money go?"}]
    messages = build_messages(conversation, language="de", persona="Be kind.")
    system = messages[0]
    assert system["role"] == "system"
    assert "Be kind." in system["content"]
    assert "'de'" in system["content"]
    assert messages[1:] == conversation

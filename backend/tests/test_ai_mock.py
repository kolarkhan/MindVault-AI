import pytest

from app.services.ai.provider import MockProvider


@pytest.mark.asyncio
async def test_mock_provider_extracts_finance_deterministically():
    provider = MockProvider()
    result = await provider.process_memory("I gave Ahmed 15,000 rupees last month.", "text")
    assert result.provider == "mock"
    assert result.is_financial is True
    assert result.amounts[0].amount == 15000
    assert result.amounts[0].currency == "PKR"
    assert any(p.name == "Ahmed" for p in result.people)
    assert result.suggested_category == "Finance"


@pytest.mark.asyncio
async def test_mock_provider_never_fabricates_when_nothing_present():
    provider = MockProvider()
    result = await provider.process_memory("Just a quiet afternoon.", "text")
    assert result.amounts == []
    assert result.people == []
    assert result.is_financial is False


@pytest.mark.asyncio
async def test_mock_rag_answer_uses_fallback_when_no_context():
    provider = MockProvider()
    answer = await provider.generate_rag_answer("How much did I give Ahmed?", [])
    assert answer == "I couldn't find that information in your memories."


@pytest.mark.asyncio
async def test_mock_embedding_is_deterministic():
    provider = MockProvider()
    v1 = await provider.embed("hello world")
    v2 = await provider.embed("hello world")
    assert v1 == v2
    assert len(v1) == 1536

def determine_verdict(
    pattern_score: int,
    complexity_score: int,
    correctness_score: int,
    edge_case_score: int,
) -> str:
    average_score = (
        pattern_score
        + complexity_score
        + correctness_score
        + edge_case_score
    ) / 4

    if correctness_score < 50:
        return "incorrect"

    if average_score >= 80:
        return "strong"

    return "needs_improvement"
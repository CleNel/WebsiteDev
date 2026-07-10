
The goal of this project was to build a hands-on tutorial for learning unit testing fundamentals, taught the same way across three languages so the underlying ideas, not just the syntax, stick. I wanted a resource that shows how one testing concept plays out differently (and similarly) in different ecosystems.

To build this, I created parallel lesson tracks in **JavaScript (Jest)**, **Python (pytest)**, and **Java (JUnit 5 + Mockito)**, each implementing the exact same four lessons. The process involved:

- **Lesson design:** Structured four progressive lessons covering assertions, edge cases, mocking, and TDD, each building on the last so learners develop a complete mental model of testing.
- **Parallel implementation:** Wrote every lesson three times, once per language, keeping the core concept identical while adapting it to each framework's idioms (Jest matchers, pytest fixtures, JUnit 5 + Mockito annotations).
- **Practice-first approach:** Paired every lesson with a short README explaining the concept and a "try it yourself" exercise, so learners practice the skill instead of just reading about it.
- **Continuous integration:** Set up a GitHub Actions workflow per language track, each triggered only when files in that track change, so every push and pull request runs the relevant test suite automatically.

The result is a guided, three-language tour through the core skills of unit testing: writing assertions, thinking about edge cases, mocking external dependencies, and letting tests drive design.

import TestsAPI from "./api/tests.js";

import { Test } from "./models.js";

class SurveyPage {
  constructor(rootEl, test, mainPage) {
    this.rootEl = rootEl;
    this.test = test;
    this.mainPage = mainPage;
    this.step = 1;
    this.receivedScore = 0;
    this.selectedAnswer = null;
    this.allAnswers = [];
  }

  get questions() {
    return this.test.questions;
  }

  createHeader() {
    this.surveyHeaderEl = document.createElement("div");
    this.surveyHeaderEl.classList.add("survey-header");

    this.surveyHeaderTitleEl = document.createElement("h3");
    this.surveyHeaderTitleEl.classList.add("survey-header__title");

    this.surveyHeaderDescEl = document.createElement("p");
    this.surveyHeaderDescEl.classList.add("survey-header__desc");

    this.surveyHeaderEl.append(
      this.surveyHeaderTitleEl,
      this.surveyHeaderDescEl
    );

    return this;
  }

  get currentQuestion() {
    return this.questions?.[this.step - 1];
  }

  createQuestionEl() {
    const question = this.currentQuestion;
    if (!question) {
      this.surveyQuestionEl = document.createElement("p");
      this.surveyQuestionEl.classList.add("tests-message");
      this.surveyQuestionEl.textContent = "Нет доступных вопросов";
      return null;
    }

    this.surveyQuestionEl = document.createElement("div");
    this.surveyQuestionEl.classList.add("survey-question");

    this.surveyQuestionTitleEl = document.createElement("h4");
    this.surveyQuestionTitleEl.classList.add("survey-question__title");
    this.surveyQuestionTitleEl.textContent = question.title;

    this.surveyAnswerEl = document.createElement("ul");
    this.surveyAnswerEl.classList.add("survey-answer");

    this.surveyAnswerItemEls = question.answers.map((answer) => {
      const answerItemEl = document.createElement("li");
      answerItemEl.classList.add("survey-answer__item");

      const answerId = `answer${answer.id}`;
      const answerItemLabelEl = document.createElement("label");
      answerItemLabelEl.classList.add("survey-answer__item-label");
      answerItemLabelEl.setAttribute("for", answerId);
      answerItemLabelEl.textContent = answer.title;

      const answerItemInputEl = document.createElement("input");
      answerItemInputEl.classList.add("survey-answer__item-input");
      answerItemInputEl.id = answerId;
      answerItemInputEl.name = "selected-answer";
      answerItemInputEl.type = "radio";
      answerItemInputEl.addEventListener("input", () => {
        this.surveySubmitEl.disabled = false;
        this.selectedAnswer = answer;
      });

      answerItemLabelEl.appendChild(answerItemInputEl);
      answerItemEl.appendChild(answerItemLabelEl);
      return answerItemEl;
    });

    this.surveyAnswerEl.append(...this.surveyAnswerItemEls);

    this.surveyQuestionEl.append(
      this.surveyQuestionTitleEl,
      this.surveyAnswerEl
    );
    return this;
  }

  updateProgress() {
    this.surveyProgressEl.textContent = `${this.step} / ${this.questions.length}`;
    this.surveySubmitEl.textContent =
      this.step === this.questions.length ? "Завершить" : "Дальше";
    return this;
  }

  goNextQuestion() {
    this.receivedScore += this.selectedAnswer?.score ?? 0;
    if (this.selectedAnswer) {
      this.allAnswers.push(this.selectedAnswer);
      this.selectedAnswer = null;
    }

    if (this.step >= this.questions.length) {
      this.showResult();
      return this;
    }

    this.step += 1;
    this.createQuestionBody();

    this.render();
    return this;
  }

  createQuestionBody() {
    this.surveyHeaderTitleEl.textContent = this.test.title;
    this.surveyHeaderDescEl.textContent = this.test.desc;

    this.surveyBodyEl = document.createElement("div");
    this.surveyBodyEl.classList.add("survey-body");

    this.surveyProgressEl = document.createElement("p");
    this.surveyProgressEl.classList.add("survey-progress");
    this.createQuestionEl();

    this.surveySubmitEl = document.createElement("button");
    this.surveySubmitEl.classList.add(
      "survey-submit-button",
      "button",
      "button_primary"
    );
    this.surveySubmitEl.disabled = !!this.currentQuestion;
    this.surveySubmitEl.addEventListener("click", () => {
      if (!this.selectedAnswer && this.currentQuestion) {
        return;
      }

      this.goNextQuestion();
    });

    this.updateProgress();
    this.surveyBodyEl.append(
      this.surveyProgressEl,
      this.surveyQuestionEl,
      this.surveySubmitEl
    );
    return this;
  }

  init() {
    this.createHeader();
    this.createQuestionBody();

    this.render();
    return this;
  }

  getScorePhraseByValue(score) {
    if (score !== 11 && score % 10 === 1) {
      return `${score} балл`;
    }

    if (![12, 13, 14].includes(score) && [2, 3, 4].includes(score % 10)) {
      return `${score} балла`;
    }

    return `${score} баллов`;
  }

  createAnswerResults() {
    return this.questions.map((question) => {
      const resultEl = document.createElement("li");
      resultEl.classList.add("survey-result");
      const selectedAnswer = question.answers.find((answer) =>
        this.allAnswers.find((a) => answer.id === a.id)
      );
      const questionHasRightAnswer = question.answers.some(
        (answer) => answer.isRight
      );

      const resultQuestionTitleEl = document.createElement("p");
      resultQuestionTitleEl.classList.add("survey-result__question");
      resultQuestionTitleEl.textContent = question.title;

      const resultAnswersEl = document.createElement("ul");
      resultAnswersEl.classList.add("survey-result__answers");
      resultAnswersEl.append(
        ...question.answers.map((answer) => {
          const answerResultEl = document.createElement("li");
          answerResultEl.classList.add("survey-result__answer");
          if (selectedAnswer.id === answer.id) {
            const answerExtraClass = questionHasRightAnswer
              ? `survey-result__answer-${
                  answer.isRight ? "correct" : "incorrect"
                }`
              : "survey-result__answer-selected";
            answerResultEl.classList.add(answerExtraClass);
          }

          answerResultEl.textContent = answer.title;
          return answerResultEl;
        })
      );

      resultEl.append(resultQuestionTitleEl, resultAnswersEl);

      return resultEl;
    });
  }

  showResult() {
    this.createHeader();
    this.surveyBodyEl = document.createElement("div");
    this.surveyBodyEl.classList.add("survey-body");

    this.surveyHeaderTitleEl.textContent = "Результат";

    this.receivedScoreEl = document.createElement("span");
    this.receivedScoreEl.classList.add("survey-header__desc-received-score");
    this.receivedScoreEl.textContent = this.getScorePhraseByValue(
      this.receivedScore
    );

    this.totalScoreEl = document.createElement("span");
    this.totalScoreEl.classList.add("survey-header__desc-total-score");
    this.totalScoreEl.textContent = this.test.totalScore;

    this.goToMainPageEl = document.createElement("a");
    this.goToMainPageEl.href = "#";
    this.goToMainPageEl.classList.add(
      "suver-header__button",
      "button",
      "button_primary"
    );
    this.goToMainPageEl.textContent = "На главную";
    this.goToMainPageEl.addEventListener("click", async () => {
      await this.mainPage.init();
    });
    this.surveyHeaderDescEl.append(
      this.receivedScoreEl,
      " из ",
      this.totalScoreEl
    );

    this.goMainPageDescEl = document.createElement("p");
    this.goMainPageDescEl.classList.add("survey-body__desc");
    this.goMainPageDescThanksEl = document.createElement("span");
    this.goMainPageDescThanksEl.textContent = "Благодарим за прохождение!";
    this.goMainPageDescEl.append(
      this.goMainPageDescThanksEl,
      "Вы можете найти еще больше интересных тестов на главной странице."
    );

    this.allAnswersResultEl = document.createElement("ul");
    this.allAnswersResultEl.classList.add("survey-results");
    if (this.test.totalScore) {
      this.allAnswersResultEl.append(...this.createAnswerResults());
    }

    this.surveyBodyEl.append(
      this.goMainPageDescEl,
      this.allAnswersResultEl,
      this.goToMainPageEl
    );

    this.render();
  }

  render() {
    this.rootEl.innerHTML = "";
    this.rootEl.className = "survey";
    this.rootEl.append(this.surveyHeaderEl, this.surveyBodyEl);
  }
}

class TestsListPage {
  constructor(rootEl) {
    this.rootEl = rootEl;
    this.tests = [];
    this.likeIconString = `<svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 48 48"><path fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M15 8C8.925 8 4 12.925 4 19c0 11 13 21 20 23.326C31 40 44 30 44 19c0-6.075-4.925-11-11-11c-3.72 0-7.01 1.847-9 4.674A10.99 10.99 0 0 0 15 8"/></svg>`;
    this.editIconString = `<svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24"><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6.525q.5 0 .75.313t.25.687t-.262.688T11.5 5H5v14h14v-6.525q0-.5.313-.75t.687-.25t.688.25t.312.75V19q0 .825-.587 1.413T19 21zm4-7v-2.425q0-.4.15-.763t.425-.637l8.6-8.6q.3-.3.675-.45t.75-.15q.4 0 .763.15t.662.45L22.425 3q.275.3.425.663T23 4.4t-.137.738t-.438.662l-8.6 8.6q-.275.275-.637.438t-.763.162H10q-.425 0-.712-.288T9 14m12.025-9.6l-1.4-1.4zM11 13h1.4l5.8-5.8l-.7-.7l-.725-.7L11 11.575zm6.5-6.5l-.725-.7zl.7.7z"/></svg>`;
    this.deleteIconString = `<svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z"/></svg>`;
  }

  async fetchTests() {
    this.tests = await TestsAPI.getAll();
    this.likedTests = this.getCacheTestLikes();
  }

  getCacheTestLikes() {
    try {
      return JSON.parse(localStorage.getItem("tests_likes")) ?? [];
    } catch (err) {
      console.error(`Failed to parse cached likes, because ${err.message}`);
      return [];
    }
  }

  updateCacheTestLike(testId, isLike) {
    const currentLikes = this.getCacheTestLikes();
    const selectedTest = currentLikes.find((test) => test.id === testId);
    console.log(currentLikes, selectedTest, currentLikes[selectedTest]);
    if (selectedTest) {
      selectedTest.liked = isLike;
    } else {
      currentLikes.push({
        id: testId,
        liked: isLike,
      });
    }

    localStorage.setItem("tests_likes", JSON.stringify(currentLikes));
    this.likedTests = currentLikes;
    return currentLikes;
  }

  async init() {
    await this.fetchTests();
    this.createTestsList();
    this.render();
  }

  createEmptyInfo() {
    this.testsListEl = document.createElement("ul");
    this.testsListEl.classList.add("tests");
    const testsMessageEl = document.createElement("p");
    testsMessageEl.classList.add("tests-message");
    testsMessageEl.textContent = "Не найдено ни одного теста";
    this.testsListEl.appendChild(testsMessageEl);
    return this;
  }

  async openTestSurvey(testId) {
    const test = await Test.fetchById(testId, true, true);
    this.surveyPage = new SurveyPage(this.rootEl, test, this).init();
  }

  createTestsList() {
    this.createEmptyInfo();
    if (!this.tests.length) {
      this.render();
      return this;
    }

    this.testsListEl.removeChild(this.testsListEl.firstChild);

    this.testItemEls = this.tests.map((test) => {
      const testItemEl = document.createElement("li");
      testItemEl.classList.add("tests-item");

      const testItemHeadEl = document.createElement("div");
      testItemHeadEl.classList.add("tests-header");

      const testTitleEl = document.createElement("a");
      testTitleEl.classList.add("tests-header__link");
      testTitleEl.textContent = test.title;
      testTitleEl.href = `#testId=${test.id}`;
      testTitleEl.addEventListener("click", () => this.openTestSurvey(test.id));

      const testDescEl = document.createElement("p");
      testDescEl.classList.add("tests-header__desc");
      testDescEl.textContent = test.desc;

      const testActionsEl = document.createElement("div");
      testActionsEl.classList.add("tests-header__actions");

      const isLikedTest = this.likedTests.find((t) => t.id === test.id)?.liked;
      const testLikesEl = document.createElement("button");
      testLikesEl.classList.add(
        "tests-header__action",
        isLikedTest
          ? "tests-header__action-dislike"
          : "tests-header__action-like",
        "button"
      );

      const testLikesIconEl = document.createElement("span");
      testLikesIconEl.classList.add("tests-header__action-icon");
      testLikesIconEl.innerHTML = this.likeIconString;

      const testLikesCounterEl = document.createElement("span");
      testLikesCounterEl.classList.add("tests-header__action-counter");
      testLikesCounterEl.textContent = test.likes;

      const changeLikeStateHandle = async () => {
        const isLike = testLikesEl.classList.contains(
          "tests-header__action-like"
        );
        testLikesEl.classList.toggle("tests-header__action-like");
        testLikesEl.classList.toggle("tests-header__action-dislike");
        testLikesCounterEl.textContent = test.likes = isLike
          ? test.likes + 1
          : test.likes - 1;
        testLikesIconEl.innerHTML = this.likeIconString;
        isLike
          ? await TestsAPI.setLike(test.id)
          : await TestsAPI.removeLike(test.id);
        this.updateCacheTestLike(test.id, isLike);
      };

      testLikesEl.changeLikeState = changeLikeStateHandle;
      testLikesEl.addEventListener("click", changeLikeStateHandle);
      testLikesEl.append(testLikesIconEl, testLikesCounterEl);

      const testAdminActionsEl = document.createElement("div");
      testAdminActionsEl.classList.add("tests-header__admin");

      const testEditEl = document.createElement("a");
      testEditEl.href = `/editor.html#testId=${test.id}`;
      testEditEl.classList.add(
        "tests-header__action",
        "tests-header__action-edit",
        "button"
      );

      const testEditIconEl = document.createElement("span");
      testEditIconEl.classList.add("tests-header__action-icon");
      testEditIconEl.innerHTML = this.editIconString;
      testEditEl.appendChild(testEditIconEl);

      const testDeleteEl = document.createElement("button");
      testDeleteEl.classList.add(
        "tests-header__action",
        "tests-header__action-delete",
        "button"
      );

      const testDeleteIconEl = document.createElement("span");
      testDeleteIconEl.classList.add("tests-header__action-icon");
      testDeleteIconEl.innerHTML = this.deleteIconString;
      testDeleteEl.addEventListener("click", async () => {
        await TestsAPI.delete(test.id);
        this.tests = this.tests.filter((t) => t.id !== test.id);
        this.createTestsList();
      });
      testDeleteEl.appendChild(testDeleteIconEl);

      testAdminActionsEl.append(testEditEl, testDeleteEl);
      testActionsEl.append(testLikesEl, testAdminActionsEl);
      testItemHeadEl.append(testTitleEl, testDescEl);
      testItemEl.append(testItemHeadEl, testActionsEl);

      return testItemEl;
    });

    this.testsListEl.append(...this.testItemEls);
    this.render();
    return this;
  }

  render() {
    this.rootEl.innerHTML = "";
    this.rootEl.className = "tests-container";
    this.rootEl.appendChild(this.testsListEl);
    return this;
  }
}

async function init() {
  const rootEl = document.querySelector(".page-placeholder");
  const params = new URLSearchParams(window.location.hash.substring(1));
  const testId = +params.get("testId");

  const mainPage = new TestsListPage(rootEl);
  testId > 0 ? mainPage.openTestSurvey(testId) : await mainPage.init();
}

await init();

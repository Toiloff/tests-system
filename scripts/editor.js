import TestsAPI from "./api/tests.js";
import { Question, Test, Answer } from "./models.js";
import { clamp, toast } from "./utils.js";

export class TestEditor {
  constructor(rootEl, test) {
    this.rootEl = rootEl;
    this.test =
      test instanceof Test
        ? test
        : new Test({
            title: "",
            desc: null,
            isBlank: true,
          });
    this.maxAnswerLength = 256;
    this.maxQuestionLength = 256;
    this.maxTestTitleLength = 128;
    this.maxTestDescLength = 512;
    this.minScore = 0;
    this.maxScore = 10;
    this.updateUIInfo();
  }

  updateUIInfo() {
    this.editorHeaderTitle = this.test.id
      ? `Редактирование теста #${this.test.id}`
      : "Создание теста";
    this.formMethod = this.test.id ? "PUT" : "POST";
    this.formAction =
      "/api/tests/full.php" +
      (this.formMethod === "PUT" ? `?id=${this.test.id}` : "");
    this.onSavePhraes = this.test.id
      ? "Тест успешно обновлен"
      : "Тест успешно сохранен";
  }

  createHeader() {
    this.editorHeaderEl = document.createElement("div");
    this.editorHeaderEl.classList.add("editor-header");

    this.editorHeaderTitleEl = document.createElement("h3");
    this.editorHeaderTitleEl.classList.add("editor-header__title");
    this.editorHeaderTitleEl.textContent = this.editorHeaderTitle;

    this.editorHeaderEl.appendChild(this.editorHeaderTitleEl);

    return this;
  }

  createTextInput() {
    const titleEl = document.createElement("label");
    titleEl.classList.add("editor-form__label-wrapper");

    const inputEl = document.createElement("input");
    inputEl.classList.add("editor-form__text-input");
    return { title: titleEl, input: inputEl };
  }

  createSection() {
    const sectionEl = document.createElement("section");
    sectionEl.classList.add("editor-section");
    return sectionEl;
  }

  createAnswerItemEl(answer, question, questionIdx, idx) {
    const answerGroupIdx = `questions[${questionIdx}][answers][${idx}]`;

    const answerItemEl = document.createElement("li");
    answerItemEl.classList.add("editor-answers__item");

    const answersItemHeaderEl = document.createElement("div");
    answersItemHeaderEl.classList.add("editor-answers__item-header");

    const answersItemCounterEl = document.createElement("span");
    answersItemCounterEl.classList.add("editor-answers__item-counter");
    answersItemCounterEl.textContent = idx + 1;

    const editorUtilityEl = document.createElement("div");
    editorUtilityEl.classList.add("editor-utility");

    const deleteButtonEl = document.createElement("button");
    deleteButtonEl.classList.add(
      "editor-utility__button",
      "editor-utility__button-delete",
      "button"
    );
    deleteButtonEl.type = "button";
    deleteButtonEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z"/></svg>`;
    deleteButtonEl.addEventListener("click", () => {
      question.deleteAnswer(answer);
      this.test.calcTotalScore();
      this.createBody();
      this.render();
    });

    editorUtilityEl.appendChild(deleteButtonEl);
    answersItemHeaderEl.append(answersItemCounterEl, editorUtilityEl);

    const { title: answerTitleEl, input: answerTitleInputEl } =
      this.createTextInput();

    const answerTitleId = `question${questionIdx}-answer${idx}-title`;
    answerTitleEl.textContent = "Текст ответа";
    answerTitleEl.setAttribute("for", answerTitleId);

    answerTitleInputEl.id = answerTitleId;
    answerTitleInputEl.name = `${answerGroupIdx}[title]`;
    answerTitleInputEl.placeholder = "Самолёт";
    answerTitleInputEl.minLength = 1;
    answerTitleInputEl.maxLength = this.maxAnswerLength;
    answerTitleInputEl.value = answer.title ?? "";
    answerTitleInputEl.addEventListener("input", () => {
      let value = answerTitleInputEl.value;
      if (value.length > this.maxAnswerLength) {
        value = value.substring(0, this.maxAnswerLength);
        answerTitleInputEl.value = value;
      }

      answer.title = value;
    });
    answerTitleEl.appendChild(answerTitleInputEl);

    const { title: answerScoreEl, input: answerScoreInputEl } =
      this.createTextInput();

    const answerScoreId = `question${questionIdx}-answer${idx}-score`;
    answerScoreEl.textContent = "Количество баллов за ответ (0-10)";
    answerScoreEl.setAttribute("for", answerScoreId);

    const answerScoreHiddenEl = document.createElement("input");
    answerScoreHiddenEl.name = `${answerGroupIdx}[score]`;
    answerScoreHiddenEl.value = answer.score ?? 0;
    answerScoreHiddenEl.hidden = true;

    answerScoreInputEl.id = answerScoreId;
    answerScoreInputEl.placeholder = "5";
    answerScoreInputEl.value = answer.score ?? 0;
    answerScoreInputEl.type = "number";
    answerScoreInputEl.min = this.minScore;
    answerScoreInputEl.max = this.maxScore;
    answerScoreInputEl.addEventListener("input", () => {
      if (!answerScoreInputEl.value || answerScoreInputEl.value === "") {
        answer.score = answerScoreHiddenEl.value = 0;
        this.test.calcTotalScore();
        return;
      }

      answer.score =
        answerScoreInputEl.value =
        answerScoreHiddenEl.value =
          clamp(+answerScoreInputEl.value, this.minScore, this.maxScore);
      this.test.calcTotalScore();
    });
    answerScoreEl.append(answerScoreHiddenEl, answerScoreInputEl);

    const answerIsRightId = `question${questionIdx}-answer${idx}-isRight`;
    const answerIsRightEl = document.createElement("label");
    answerIsRightEl.classList.add("editor-form__label-wrapper");
    answerIsRightEl.textContent = "Это правильный ответ";
    answerIsRightEl.setAttribute("for", answerIsRightId);

    const answerIsRightHiddenEl = document.createElement("input");
    answerIsRightHiddenEl.hidden = true;
    answerIsRightHiddenEl.value = answer.isRight;
    answerIsRightHiddenEl.name = `${answerGroupIdx}[isRight]`;

    const answerIsRightInputEl = document.createElement("input");
    answerIsRightInputEl.classList.add("editor-form__checkbox-input");
    answerIsRightInputEl.id = answerIsRightId;
    answerIsRightInputEl.type = "checkbox";
    answerIsRightInputEl.addEventListener("input", () => {
      answer.isRight = answerIsRightHiddenEl.value =
        answerIsRightInputEl.checked;
    });

    if (answer.isRight) {
      answerIsRightInputEl.checked = "checked";
    }

    answerIsRightEl.append(answerIsRightHiddenEl, answerIsRightInputEl);

    answerItemEl.append(
      answersItemHeaderEl,
      answerTitleEl,
      answerScoreEl,
      answerIsRightEl
    );
    return {
      answerItemEl,
      answersItemHeaderEl,
      answerTitleEl,
      answerTitleInputEl,
      answerScoreEl,
      answerScoreInputEl,
      answerIsRightEl,
      answerIsRightInputEl,
    };
  }

  createAnswerSectionEl(question, questionIdx) {
    const answersSectionEl = this.createSection();

    const answersSectionTitleEl = document.createElement("h5");
    answersSectionTitleEl.classList.add("editor-section__title");
    answersSectionTitleEl.textContent = "Ответы на вопрос";

    const answersListEl = document.createElement("ul");
    answersListEl.classList.add("editor-answers");
    if (!question.answers) {
      const answersPlaceholderEl = document.createElement("p");
      answersPlaceholderEl.classList.add("editor-answers__placeholder");
      answersPlaceholderEl.textContent =
        "Вы не добавили ни одного ответа на вопрос :(";
      answersSectionEl.append(answersSectionTitleEl, answersPlaceholderEl);
      return this;
    }

    const answersItemEls =
      question.answers.map((answerItem, idx) =>
        this.createAnswerItemEl(answerItem, question, questionIdx, idx)
      ) ?? [];
    answersListEl.answersItemEls = answersItemEls;

    const answerButtonEl = document.createElement("button");
    answerButtonEl.classList.add("editor-section__button", "button");
    answerButtonEl.textContent = "Добавить ответ";
    answerButtonEl.type = "menu";
    answerButtonEl.addEventListener("click", (e) => {
      e.preventDefault();
      question.addAnswer(new Answer({ id: Date.now(), isBlank: true }));
      this.createBody();

      this.render();
    });
    answersSectionEl.append(
      answersSectionTitleEl,
      ...answersItemEls.map((answerEl) => answerEl.answerItemEl),
      answerButtonEl
    );
    return answersSectionEl;
  }

  createQuestionItemEl(question, idx) {
    const questionGroupIdx = `questions[${idx}]`;

    const questionItemEl = document.createElement("li");
    questionItemEl.classList.add("editor-questions__item");

    const questionItemHeaderEl = document.createElement("div");
    questionItemHeaderEl.classList.add("editor-questions__item-header");

    const questionItemCounterEl = document.createElement("span");
    questionItemCounterEl.classList.add("editor-questions__item-counter");
    questionItemCounterEl.textContent = idx + 1;

    const editorUtilityEl = document.createElement("div");
    editorUtilityEl.classList.add("editor-utility");

    const deleteButtonEl = document.createElement("button");
    deleteButtonEl.classList.add(
      "editor-utility__button",
      "editor-utility__button-delete",
      "button"
    );
    deleteButtonEl.type = "button";
    deleteButtonEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z"/></svg>`;
    deleteButtonEl.addEventListener("click", () => {
      this.test.deleteQuestion(question);
      this.createBody();
      this.render();
    });

    editorUtilityEl.appendChild(deleteButtonEl);
    questionItemHeaderEl.append(questionItemCounterEl, editorUtilityEl);

    const { title: questionTitleEl, input: questionTitleInputEl } =
      this.createTextInput();

    const questionTitleId = `question${idx}-title`;
    questionTitleEl.textContent = "Текст вопроса";
    questionTitleEl.setAttribute("for", questionTitleId);

    questionTitleInputEl.id = questionTitleId;
    questionTitleInputEl.name = `${questionGroupIdx}[title]`;
    questionTitleInputEl.placeholder = "Что обозначает...";
    questionTitleInputEl.value = question.title ?? "";
    questionTitleInputEl.minLength = 1;
    questionTitleInputEl.maxLength = this.maxQuestionLength;
    questionTitleInputEl.addEventListener("input", () => {
      let value = questionTitleInputEl.value;
      if (value.length > this.maxQuestionLength) {
        value = value.substring(0, this.maxQuestionLength);
        questionTitleInputEl.value = value;
      }

      question.title = value;
    });
    questionTitleEl.appendChild(questionTitleInputEl);

    const answersSectionEl = this.createAnswerSectionEl(question, idx);
    questionItemEl.append(
      questionItemHeaderEl,
      questionTitleEl,
      answersSectionEl
    );
    return {
      questionItemEl,
      questionItemHeaderEl,
      questionTitleEl,
      questionTitleInputEl,
      answersSectionEl,
    };
  }

  createQuestionsSection() {
    this.questionsSectionEl = this.createSection();

    this.questionsSectionTitleEl = document.createElement("h4");
    this.questionsSectionTitleEl.classList.add("editor-section__title");
    this.questionsSectionTitleEl.textContent = "Вопросы";

    this.questionsListEl = document.createElement("ul");
    this.questionsListEl.classList.add("editor-questions");

    this.questionButtonEl = document.createElement("button");
    this.questionButtonEl.classList.add("editor-section__button", "button");
    this.questionButtonEl.textContent = "Добавить вопрос";
    this.questionButtonEl.type = "menu";
    this.questionButtonEl.addEventListener("click", (e) => {
      e.preventDefault();
      this.test.addQuestion(new Question({ id: Date.now(), isBlank: true }));
      this.createBody();

      this.render();
    });
    if (!this.test?.questions) {
      this.questionPlaceholderEl = document.createElement("p");
      this.questionPlaceholderEl.classList.add("editor-questions__placeholder");
      this.questionPlaceholderEl.textContent =
        "Вы не добавили ни одного вопроса :(";
      this.questionsSectionEl.append(
        this.questionsSectionTitleEl,
        this.questionPlaceholderEl,
        this.questionButtonEl
      );
      return this;
    }

    const questionItemEls =
      this.test?.questions.map((questionItem, idx) =>
        this.createQuestionItemEl(questionItem, idx)
      ) ?? [];
    this.questionsListEl.questionItemEls = questionItemEls;

    this.questionsSectionEl.append(
      this.questionsSectionTitleEl,
      ...questionItemEls.map((questionEl) => questionEl.questionItemEl),
      this.questionButtonEl
    );
    return this;
  }

  createTestInfo() {
    const { title: testTitleEl, input: testTitleInputEl } =
      this.createTextInput();

    this.testTitleEl = testTitleEl;
    this.testTitleEl.textContent = "Название";
    this.testTitleEl.setAttribute("for", "test-title");

    this.testTitleInputEl = testTitleInputEl;
    this.testTitleInputEl.id = "test-title";
    this.testTitleInputEl.name = "title";
    this.testTitleInputEl.placeholder = "Насколько хорошо вы знаете...";
    this.testTitleInputEl.value = this.test?.title ?? "";
    this.testTitleInputEl.addEventListener("input", () => {
      let value = this.testTitleInputEl.value;
      if (value.length > this.maxTestTitleLength) {
        value = value.substring(0, this.maxTestTitleLength);
        this.testTitleInputEl.value = value;
      }

      this.test.title = value;
    });
    this.testTitleEl.appendChild(this.testTitleInputEl);

    const { title: testDescEl, input: testDescInputEl } =
      this.createTextInput();

    this.testDescEl = testDescEl;
    this.testDescEl.textContent = "Описание";
    this.testDescEl.setAttribute("for", "test-desc");

    this.testDescInputEl = testDescInputEl;
    this.testDescInputEl.id = "test-desc";
    this.testDescInputEl.name = "desc";
    this.testDescInputEl.placeholder = "Проверьте свои знания в области...";
    this.testDescInputEl.value = this.test?.desc ?? "";
    this.testDescInputEl.addEventListener("input", () => {
      let value = this.testDescInputEl.value;
      if (value.length > this.maxTestDescLength) {
        value = value.substring(0, this.maxTestDescLength);
        this.testDescInputEl.value = value;
      }

      this.test.desc = value;
    });
    this.testDescEl.appendChild(this.testDescInputEl);
    return this;
  }

  createBody() {
    this.editorBodyEl = document.createElement("div");
    this.editorBodyEl.classList.add("editor-body");

    this.editorFormEl = document.createElement("form");
    this.editorFormEl.classList.add("editor-form");
    this.editorFormEl.action = this.formAction;
    this.editorFormEl._method = this.formMethod;

    this.createTestInfo();
    this.createQuestionsSection();

    this.editorFormSaveButtonEl = document.createElement("button");
    this.editorFormSaveButtonEl.classList.add(
      "editor-form__button",
      "button",
      "button_primary"
    );
    this.editorFormSaveButtonEl.textContent = "Сохранить";
    this.editorFormSaveButtonEl.type = "submit";
    this.editorFormSaveButtonEl.addEventListener("click", async (e) => {
      e.preventDefault();
      const result = await TestsAPI.fetchByForm(this.editorFormEl);
      if (!result) {
        return;
      }

      toast(this.onSavePhraes, "success", 5000);
      this.test = await Test.fetchById(result.id);
      window.location.hash = `#testId=${this.test.id}`;
      this.updateUIInfo();
      if (this.editorFormEl._method === "POST") {
        this.createHeader();
      }

      this.createBody();
      this.render();
    });

    this.editorFormEl.append(
      this.testTitleEl,
      this.testDescEl,
      this.questionsSectionEl,
      this.editorFormSaveButtonEl
    );
    this.editorBodyEl.appendChild(this.editorFormEl);

    return this;
  }

  init() {
    this.createHeader();
    this.createBody();
    this.render();
    return this;
  }

  render() {
    this.rootEl.innerHTML = "";
    this.rootEl.className = "editor";
    this.rootEl.append(this.editorHeaderEl, this.editorBodyEl);
    return this;
  }
}

async function init() {
  const rootEl = document.querySelector(".editor");
  const params = new URLSearchParams(window.location.hash.substring(1));
  const testId = +params.get("testId");

  const testEditor = new TestEditor(
    rootEl,
    testId ? await Test.fetchById(testId) : null
  );
  testEditor.init();
}

await init();

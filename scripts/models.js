import TestsAPI from "./api/tests.js";
import QuestionsAPI from "./api/questions.js";

export class Answer {
  constructor({ id, title, score = 0, isRight = true, isBlank = false }) {
    if (
      !isBlank &&
      (!id ||
        !title ||
        typeof score !== "number" ||
        typeof isRight !== "boolean")
    ) {
      throw new Error("Failed to create an answer, because not enough data");
    }

    this.id = id;
    this.title = title;
    this.score = score;
    this.isRight = isRight;
    this.isBlank = isBlank;
  }
}

export class Question {
  constructor({ id, title, answers = [], isBlank = false } = {}) {
    if (!isBlank && (!id || !title || (answers && !Array.isArray(answers)))) {
      throw new Error("Failed to create an question, because not enough data");
    }

    this.id = id;
    this.title = title;
    this.answers = answers;
    this.isBlank = isBlank;
  }

  addAnswers(answers) {
    for (const answer of answers) {
      this.addAnswer(answer);
    }
    return this;
  }

  addAnswer(answer) {
    this.answers.push(answer);
    return this;
  }

  deleteAnswer(answer) {
    this.answers = this.answers.filter((a) => a.id !== answer.id);
    return this;
  }
}

export class Test {
  constructor({ id, title, desc, likes, questions = [], isBlank = false }) {
    if (
      !isBlank &&
      (!id ||
        !title ||
        typeof likes !== "number" ||
        (questions && !Array.isArray(questions)))
    ) {
      throw new Error("Failed to create a test, because not enough data");
    }

    this.id = id;
    this.title = title;
    this.desc = desc;
    this.likes = likes;
    this.questions = questions;
    this.isBlank = isBlank;
    this.calcTotalScore();
  }

  addQuestions(questions) {
    for (const question of questions) {
      this.addQuestion(question);
    }
    return this;
  }

  addQuestion(question) {
    this.questions.push(question);
    this.calcTotalScore();
    return this;
  }

  deleteQuestion(question) {
    this.questions = this.questions.filter((q) => q.id !== question.id);
    this.calcTotalScore();
    return this;
  }

  calcTotalScore() {
    this.totalScore = this.questions.reduce((result, question) => {
      const maxScore = Math.max(
        ...question.answers.map((answer) => answer.score)
      );
      result += Number.isFinite(maxScore) ? maxScore : 0;
      return result;
    }, 0);

    return this;
  }

  static async fetchById(testId, strictAnswers = false, showToast = false) {
    const testData = await TestsAPI.get(testId);
    let questions = [];
    try {
      questions = (
        await QuestionsAPI.getAllByTestId(testData.id, { showToast })
      ).map(({ id, title, answers }) => {
        return new Question({
          id,
          title,
          answers: answers.map(
            ({ id, title, score, isRight }) =>
              new Answer({ id, title, score, isRight })
          ),
        });
      });
      if (strictAnswers) {
        questions = questions.filter(({ answers }) => answers.length);
      }
    } catch {
      questions = [];
    }

    return new Test({
      id: testData.id,
      title: testData.title,
      desc: testData.desc,
      likes: testData.likes,
      questions,
    });
  }
}

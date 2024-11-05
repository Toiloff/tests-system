import BaseAPI from "./base.JS";

export default new (class AnswersAPI extends BaseAPI {
  defaultScore = 0;
  defaultIsRight = true;
  constructor() {
    super("/api/tests/questions");
  }

  async get(id, options = {}) {
    return await this.request(`${this.prefix}/answers.php?id=${id}`, options);
  }

  async getAllByQuestionId(questionId, options = {}) {
    const data = await this.request(
      `${this.prefix}/answers.php?question_id=${questionId}`,
      options
    );
    return data ? data : [];
  }

  async getAll(options = {}) {
    const data = await this.request(
      `${this.prefix}/answers.php`,
      (options = {})
    );
    return data ? data : [];
  }

  async create(
    questionId,
    title,
    score = this.defaultScore,
    isRight = this.defaultIsRight,
    options = {}
  ) {
    return await this.request(
      `${this.prefix}/answers.php?question_id=${questionId}`,
      {
        method: "POST",
        body: JSON.stringify({
          title,
          score,
          isRight,
        }),
        ...options,
      }
    );
  }

  async update(
    id,
    title,
    score = this.defaultScore,
    isRight = this.defaultIsRight,
    options = {}
  ) {
    return await this.request(`${this.prefix}/answers.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title,
        score,
        isRight,
      }),
      ...options,
    });
  }

  async delete(id, options = {}) {
    const data = await this.request(`${this.prefix}/answers.php?id=${id}`, {
      method: "DELETE",
      ...options,
    });

    return !!data;
  }
})();

import BaseAPI from "./base.JS";

export default new (class QuestionsAPI extends BaseAPI {
  constructor() {
    super("/api/tests/questions");
  }

  async get(id, options = {}) {
    return await this.request(`${this.prefix}/index.php?id=${id}`, options);
  }

  async getAllByTestId(testId, options = {}) {
    const data = await this.request(
      `${this.prefix}/index.php?test_id=${testId}`,
      options
    );
    return data ? data : [];
  }

  async getAll(options = {}) {
    const data = await this.request(`${this.prefix}/index.php`, options);
    return data ? data : [];
  }

  async create(testId, title, options = {}) {
    return await this.request(`${this.prefix}/index.php?test_id=${testId}`, {
      method: "POST",
      body: JSON.stringify({
        title,
      }),
      ...options,
    });
  }

  async update(id, title, options = {}) {
    return await this.request(`${this.prefix}/index.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title,
      }),
      ...options,
    });
  }

  async delete(id, options = {}) {
    const data = await this.request(`${this.prefix}/index.php?id=${id}`, {
      method: "DELETE",
      ...options,
    });

    return !!data;
  }
})();

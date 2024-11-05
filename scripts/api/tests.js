import BaseAPI from "./base.JS";

export default new (class TestsAPI extends BaseAPI {
  constructor() {
    super("/api/tests");
  }

  async get(id, options = {}) {
    return await this.request(`${this.prefix}/index.php?id=${id}`, options);
  }

  async getAll(options = {}) {
    const data = await this.request(`${this.prefix}/index.php`, options);
    return data ? data : [];
  }

  async create(id, title, desc = null, options = {}) {
    return await this.request(`${this.prefix}/index.php?id=${id}`, {
      method: "POST",
      body: JSON.stringify({
        title,
        desc,
      }),
      ...options,
    });
  }

  async update(id, title, desc = null, options = {}) {
    return await this.request(`${this.prefix}/index.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title,
        desc,
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

  async getLikes(id, options = {}) {
    return await this.request(`${this.prefix}/like.php?id=${id}`, options);
  }

  async setLike(id, options = {}) {
    return await this.request(`${this.prefix}/like.php?id=${id}`, {
      method: "POST",
      ...options,
    });
  }

  async removeLike(id, options = {}) {
    return await this.request(`${this.prefix}/like.php?id=${id}`, {
      method: "DELETE",
      ...options,
    });
  }
})();

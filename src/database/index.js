import Sequelize from 'sequelize'

import configDatabase from '../config/database.js'

import Tokens from '../appp/models/Token.js'

const models = [Tokens]

class Database {
  constructor() {
    this.init()
  }

  init() {
    this.connection = new Sequelize(configDatabase)
    models.map((model) => model.init(this.connection))
  }
}

export default new Database()
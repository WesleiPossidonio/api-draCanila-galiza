import Sequelize, { Model } from 'sequelize'

class Tokens extends Model {
  static init(sequelize) {
    super.init(
      {
        link_token: Sequelize.STRING,
      },
      {
        sequelize,
      }
    )
  }
}

export default Tokens
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const configDatabase = {
  dialect: 'postgres',
  dialectModule: pg,
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 24992,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Defina como true para certificados confiáveis.
    },
  },
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
}

export default configDatabase;
